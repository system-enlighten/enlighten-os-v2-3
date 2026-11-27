import {randomUUID} from 'node:crypto';
import {db} from './supabase-db.js';
import {checkProjectRead,requireProject,requireStudio} from './permissions.js';
import {getProjectDiary} from './project-diary.js';
import {actor,failure,insertRecord,now,text,updateRecord,writeActivity} from './project-write-storage.js';
import {receivedSourceForTask_,wihDelegationResolver_,wihPlanDates_} from './wih-projections.js';

const dayDuration=86400000;
const finished=task=>/completed|^done$/i.test(String(task.status));
const overlap=(a,b,c,d)=>Date.parse(a)<Date.parse(d)&&Date.parse(c)<Date.parse(b);
const blockActive=row=>String(row.active).toLowerCase()!=='false';
const locked=tx=>tx.query('SELECT pg_advisory_xact_lock(hashtextextended($1,0))',['employee-calendar']);
const dateValid=value=>/^\d{4}-\d{2}-\d{2}$/.test(value)&&Number.isFinite(Date.parse(value))&&new Date(value).toISOString().slice(0,10)===value;

async function readTasks(tx) {
  const query=(name)=>tx.rows('SELECT cells FROM enlighten_operational.'+name+' ORDER BY source_row_number NULLS LAST,record_id');
  const [tasks,rules,lines,people]=await Promise.all(['design_tasks','workflow_delegations','line_of_work','people'].map(query));
  const resolve=wihDelegationResolver_(rules.map(row=>row.cells),lines.map(row=>row.cells),people.map(row=>row.cells));
  return new Map(tasks.map(row=>resolve(row.cells)).map(task=>[String(task.designTaskId),task]));
}

async function calendarBlocks(tx,employeeId) {
  return tx.rows("SELECT record_id,cells FROM enlighten_operational.personal_calendar_blocks WHERE cells->>'userId'=$1 ORDER BY source_row_number NULLS LAST,record_id",
    [employeeId]);
}

function calendarUser(user,write=false) {
  requireStudio(user);
  if (!user.userId) throw failure('Employee access required.',403);
  if (write&&String(user.appAccess).toLowerCase()==='viewer') throw failure('View only access.',403);
}

export async function getPersonalCalendar(payload,{user,database=db}) {
  calendarUser(user);
  const start=String(payload.start||''),end=String(payload.end||'');
  if (!dateValid(start)||!dateValid(end)||end<start||Date.parse(end)-Date.parse(start)>31*dayDuration) {
    throw failure('Choose a calendar range of up to 31 days.');
  }
  const diary=await getProjectDiary({}, {user,database});
  const projects=new Map(diary.projects.map(row=>[String(row.id),row]));
  return {blocks:(await calendarBlocks(database,String(user.userId))).map(row=>row.cells)
    .filter(row=>blockActive(row)&&overlap(start+'T00:00:00+05:30',end+'T23:59:59+05:30',row.startAt,row.endAt)),
    meetings:diary.timeline.filter(event=>!event.cancelled&&!event.archived&&event.date>=start&&event.date<=end)
      .map(event=>({id:event.id,projectId:event.projectId,projectName:projects.get(String(event.projectId))?.name||'',
        title:event.title,date:event.date,time:event.time,endTime:event.endTime,participants:event.participants,
        location:event.location,meetingMode:event.meetingMode,happened:event.happened}))};
}

export async function savePersonalCalendarBlock(payload,{user,database=db}) {
  calendarUser(user,true);
  const id=String(payload.id||''),employeeId=String(user.userId);
  return database.transaction(async tx=>{
    await locked(tx);
    const blocks=await calendarBlocks(tx,employeeId);
    const prior=blocks.find(row=>row.cells.id===id);
    if ((id||payload.remove===true)&&!prior) throw failure('Personal block not found.',404);
    if (prior&&String(prior.cells.version)!==String(payload.expectedVersion||'')) throw failure('This block changed. Refresh the calendar before saving.',409);
    let row;
    if (payload.remove===true) row={...prior.cells,active:false,version:randomUUID(),updatedAt:now()};
    else {
      const title=text(payload.title||'Personal work'),start=Date.parse(payload.startAt),end=Date.parse(payload.endAt);
      if (!title||title.length>150||!Number.isFinite(start)||!Number.isFinite(end)||end<=start||end-start>31*dayDuration) {
        throw failure('Enter a title and a valid start and finish within 31 days.');
      }
      if (blocks.some(({cells})=>cells.id!==id&&blockActive(cells)&&overlap(payload.startAt,payload.endAt,cells.startAt,cells.endAt))) {
        throw failure('This overlaps another personal block.',409);
      }
      const tasks=await readTasks(tx);
      const plans=await tx.rows('SELECT cells FROM enlighten_operational.wih_plans');
      if (plans.some(({cells})=>{
        const task=tasks.get(String(cells.designTaskId));
        return task&&String(task.assigneeUserId)===employeeId&&!finished(task)&&overlap(payload.startAt,payload.endAt,cells.plannedStart,cells.plannedEnd);
      })) throw failure('This overlaps a planned task. Move its time block first.',409);
      row={id:prior?.cells.id||randomUUID(),userId:employeeId,title,startAt:new Date(start).toISOString(),
        endAt:new Date(end).toISOString(),active:true,version:randomUUID(),updatedAt:now()};
    }
    if (prior) await updateRecord(tx,'personal_calendar_blocks',prior.record_id,row);
    else await insertRecord(tx,'personal_calendar_blocks',row);
    return row;
  });
}

function dayInZone(value,zone) {
  let format;
  try { format=new Intl.DateTimeFormat('en-CA',{timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit'}); }
  catch { throw failure('Choose a valid time zone.'); }
  const parts=Object.fromEntries(format.formatToParts(value).map(({type,value})=>[type,value]));
  return [parts.year,parts.month,parts.day].join('-');
}

function requirePlanAccess(user,task) {
  const role=requireProject(user,String(task.projectId),{write:true});
  if (role!=='Admin'&&String(task.assigneeUserId)!==user.userId) throw failure('Plan only your assigned work.',403);
}

export async function saveWihPlan(payload,{user,database=db}) {
  calendarUser(user,true);
  const id=text(payload.designTaskId),onlyTat=payload.tatOnly===true;
  if (!id||!onlyTat&&(!payload.plannedStart||!payload.plannedEnd||!payload.timeZone)) throw failure('Choose a task and work session.');
  return database.transaction(async tx=>{
    await locked(tx);
    const tasks=await readTasks(tx),task=tasks.get(id);
    if (!task) throw failure('Task not found.',404);
    requirePlanAccess(user,task);
    await checkProjectRead(tx,user,String(task.projectId));
    if (!task.assigneeUserId) throw failure('Assign this task to a team member before scheduling.');
    if (finished(task)||task.mergedIntoTaskId) throw failure('Completed work cannot be rescheduled.',409);
    const drawings=await tx.rows("SELECT cells FROM enlighten_operational.drawing_register WHERE cells->>'projectId'=$1",[String(task.projectId)]);
    const source=receivedSourceForTask_(task,Object.fromEntries(tasks),drawings.map(row=>row.cells));
    if (!source) throw failure('This task needs a linked received drawing.');
    const plans=await tx.rows('SELECT record_id,cells FROM enlighten_operational.wih_plans ORDER BY source_row_number NULLS LAST,record_id');
    const prior=plans.find(row=>String(row.cells.designTaskId)===id),old=prior?.cells;
    if (old&&Number(old.tatDays)!==Number(payload.tatDays)) throw failure('TAT is locked. Reschedule the work session without changing the original deadline.',409);
    let dates;
    try { dates=old?{receivedDate:old.receivedDate,tatDays:Number(old.tatDays),internalDueDate:old.internalDueDate,clientDueDate:old.clientDueDate}:
      wihPlanDates_(source.receivedSentDate||source.createdAt,payload.tatDays); }
    catch(error) {throw failure(error.message);}
    const at=now(),requiredBy=new Date((Date.parse(task.createdAt)||Date.parse(source.createdAt)||Date.now())+dayDuration).toISOString();
    const row={designTaskId:id,projectId:task.projectId,assigneeUserId:task.assigneeUserId,sourceDrawingId:source.drawingId,...dates,
      plannedStart:old?.plannedStart||'',plannedEnd:old?.plannedEnd||'',timeZone:old?.timeZone||'Asia/Kolkata',
      tatEnteredAt:old?.tatEnteredAt||old?.updatedAt||at,tatRequiredBy:old?.tatRequiredBy||requiredBy,
      tatEnteredLate:old?old.tatEnteredLate!==''&&old.tatEnteredLate!==undefined?old.tatEnteredLate:Date.parse(old.tatEnteredAt||old.updatedAt)>Date.parse(requiredBy):
        Date.now()>Date.parse(requiredBy),updatedAt:at,updatedBy:actor(user)};
    const shifts=[];
    if (onlyTat&&old?.sourceDrawingId) row.sourceDrawingId=old.sourceDrawingId;
    if (!onlyTat) {
      const start=Date.parse(payload.plannedStart),end=Date.parse(payload.plannedEnd),timeZone=String(payload.timeZone);
      if (!Number.isFinite(start)||!Number.isFinite(end)||end<=start||end-start>dayDuration) throw failure('Choose a work session of up to 24 hours.');
      if (dayInZone(new Date(start),timeZone)<dates.receivedDate) throw failure('Work cannot be planned before the drawing was received.');
      Object.assign(row,{plannedStart:new Date(start).toISOString(),plannedEnd:new Date(end).toISOString(),timeZone});
      let boundary=end;
      const peers=plans.filter(({cells})=>{
        const other=tasks.get(String(cells.designTaskId));
        return cells.plannedStart&&cells.plannedEnd&&other&&String(other.designTaskId)!==id&&
          String(other.assigneeUserId)===String(task.assigneeUserId)&&!finished(other);
      }).sort((a,b)=>Date.parse(a.cells.plannedStart)-Date.parse(b.cells.plannedStart));
      for (const peer of peers) {
        const a=Date.parse(peer.cells.plannedStart),b=Date.parse(peer.cells.plannedEnd);
        if (b<=start||a>=boundary||!Number.isFinite(a)||!Number.isFinite(b)) continue;
        const other=tasks.get(String(peer.cells.designTaskId));
        if (payload.conflictPolicy!=='shift') throw failure('This session overlaps another task. Choose Shift following tasks or select a free time.',409);
        if (String(other.status)==='In Progress') throw failure('Another task is already running in this slot. Pause it and resolve its schedule first.',409);
        requirePlanAccess(user,other);
        await checkProjectRead(tx,user,String(other.projectId));
        const patch={plannedStart:new Date(boundary).toISOString(),plannedEnd:new Date(boundary+(b-a)).toISOString(),updatedAt:at,updatedBy:actor(user)};
        boundary+=b-a;
        shifts.push({peer,patch});
      }
      const blocked=(await calendarBlocks(tx,String(task.assigneeUserId))).map(entry=>entry.cells).filter(blockActive);
      if ([row,...shifts.map(shift=>shift.patch)].some(plan=>blocked.some(block=>overlap(plan.plannedStart,plan.plannedEnd,block.startAt,block.endAt)))) {
        throw failure('This time is blocked for personal work. Choose another slot.',409);
      }
    }
    for (const {peer,patch} of shifts) {
      await updateRecord(tx,'wih_plans',peer.record_id,patch);
      await writeActivity(tx,user,'RESCHEDULE','WihPlan',peer.cells.designTaskId,peer.cells.projectId,peer.cells,{...peer.cells,...patch});
    }
    if (prior) await updateRecord(tx,'wih_plans',prior.record_id,row);
    else await insertRecord(tx,'wih_plans',row);
    await writeActivity(tx,user,onlyTat||!old?'LOCK_TAT':'RESCHEDULE','WihPlan',id,task.projectId,old,row);
    return row;
  });
}
