import {assignedDepartment,internalAreaRows,studioMember} from './studio-settings.js';
import {loadTimer,pauseTimer} from './wih-timers.js';
import {db} from './supabase-db.js';
import {isSystemAdmin,projectRoleFor,requireAccounts,requireStudio,wihProjectRole} from './permissions.js';

const sheetActive=value=>!['false','no','0','n',''].includes(String(value??'').trim().toLowerCase());
const fail=(message,statusCode=400)=>Object.assign(new Error(message),{statusCode});
const isDate=value=>/^\d{4}-\d{2}-\d{2}$/.test(value)&&Number.isFinite(Date.parse(value))&&new Date(value).toISOString().slice(0,10)===value;
const indiaDay=now=>new Date(+now+330*60000).toISOString().slice(0,10);
const studioRows="SELECT cells FROM enlighten_operational.studio_attendance WHERE cells->>'userId'=$1";

export async function getStudioDay(_payload,{user,database=db,now=Date.now()}) {
  requireStudio(user);
  if (!user.userId) throw fail('Team member account required.',403);
  const day=indiaDay(now),userId=String(user.userId);
  const records=(await database.rows(studioRows+' ORDER BY source_row_number NULLS LAST,record_id',[userId])).map(row=>row.cells);
  const record=records.find(row=>row.key===userId+'|'+day)||{};
  const otherDays=records.filter(row=>row.checkIn&&!row.checkOut).map(row=>String(row.key||'').slice(userId.length+1))
    .filter(date=>/^\d{4}-\d{2}-\d{2}$/.test(date)&&date<day).sort().reverse();
  const iso=value=>value?new Date(value).toISOString():'';
  return {missedDay:otherDays[0]||'',checkIn:iso(record.checkIn),checkOut:iso(record.checkOut),
    breakStart:record.breakStart||'',entries:JSON.parse(record.entriesJson||'[]')};
}

export async function getAccountsAttendance(payload,{user,database=db}) {
  requireAccounts(user);
  const {date}=payload;
  if (typeof date!=='string'||!isDate(date)) throw fail('Enter a valid date.');
  const employeeId=String(payload.employeeId??'').trim().slice(0,250);
  const month=date.slice(0,7);
  const days=new Date(Date.UTC(Number(date.slice(0,4)),Number(date.slice(5,7)),0)).getUTCDate();
  return database.transaction(async tx=>{
    const people=await tx.rows("SELECT cells FROM enlighten_operational.people WHERE cells->>'userId'=$1",[employeeId]);
    if (!people.some(row=>sheetActive(row.cells.active))) throw fail('Choose an active employee.');
    const checked=new Set((await tx.rows(studioRows,[employeeId])).map(row=>row.cells).filter(row=>row.checkIn)
      .map(row=>String(row.key||'').split('|')[1]||String(row.day||'').slice(0,10)));
    const punches=await tx.rows(`SELECT to_char(attendance_date,'YYYY-MM-DD') AS day
      FROM enlighten_operational.payroll_machine_attendance WHERE employee_id=$1 AND check_in IS NOT NULL
        AND attendance_date >= $2::date AND attendance_date < ($2::date + interval '1 month')`,[employeeId,month+'-01']);
    for (const {day} of punches) checked.add(day);
    const approved=(await tx.rows(`SELECT cells FROM enlighten_operational.studio_leave_requests
      WHERE cells->>'userId'=$1 AND cells->>'status'='Approved'`,[employeeId])).map(row=>row.cells);
    let working=0,present=0,leave=0;
    for (let dateNumber=1;dateNumber<=days;dateNumber++) {
      const day=month+'-'+String(dateNumber).padStart(2,'0');
      if (new Date(day).getUTCDay()===0) continue;
      working++;
      if (checked.has(day)) present++;
      else if (approved.some(row=>String(row.from||'').slice(0,10)<=day&&String(row.to||'').slice(0,10)>=day)) leave++;
    }
    return {working,present,leave};
  },{readOnly:true});
}

export async function attendanceLabels(tx,p,user) {
  const projectId=String(p.projectId||''),task=String(p.task||'').trim(),subtask=String(p.subtask||'').trim();
  let project=(await internalAreaRows(tx)).find(row=>row.active&&row.id===projectId)?.name;
  if (!project&&wihProjectRole(user,projectId)) {
    const [row]=await tx.rows("SELECT cells->>'projectName' AS name FROM enlighten_operational.projects WHERE cells->>'projectId'=$1 LIMIT 1",[projectId]);
    project=row?.name;
  }
  if (!project||!task||task.length>150||subtask.length>150) throw fail('Choose an accessible project and enter a task.');
  return {projectId,project,task,subtask};
}

export async function saveStudioDay(p,{user,database=db,now=Date.now()}) {
  const uid=studioMember(user),day=indiaDay(now),key=uid+'|'+day,at=new Date(now).toISOString();
  return database.transaction(async tx=>{
    await tx.query("SELECT pg_advisory_xact_lock(hashtext('enlighten_work_timers'))");
    const rows=await tx.rows("SELECT record_id,cells FROM enlighten_operational.studio_attendance WHERE cells->>'key'=$1 LIMIT 2 FOR UPDATE",[key]);
    if (rows.length>1) throw fail('Attendance record is duplicated.',409);
    const prior=rows[0],row={key,userId:uid,day,checkIn:'',checkOut:'',entriesJson:'[]',...prior?.cells};
    const entries=JSON.parse(row.entriesJson||'[]'),breaks=JSON.parse(row.breaksJson||'[]'),pausedTasks=[];
    const action=p.action;
    const endBreak=()=>{
      breaks.push({start:new Date(row.breakStart).toISOString(),end:at});
      row.breaksJson=JSON.stringify(breaks);
      row.breakStart='';
    };
    if (action==='out'||action==='break') {
      const briefing=await tx.rows("SELECT 1 FROM enlighten_operational.studio_briefings WHERE cells->>'openUserId'=$1 AND coalesce(cells->>'end','')='' LIMIT 1",[uid]);
      if (briefing.length) throw fail('End your discussion first.',409);
      if (action==='out'&&(!row.checkIn||row.checkOut)) throw fail('No open attendance today.',409);
      if (action==='break'&&(!row.checkIn||row.checkOut||row.breakStart)) throw fail('Check in before starting a break.',409);
      if (action==='break'&&breaks.length>=40) throw fail('Daily break limit reached.');
      const timers=await tx.rows("SELECT cells->>'designTaskId' AS id,cells->>'projectId' AS project_id FROM enlighten_operational.wih WHERE cells->>'assigneeUserId'=$1 AND cells->>'status'='In Progress' ORDER BY record_id",[uid]);
      for (const timer of timers) {
        const state=await loadTimer(tx,timer.id,user,{attendanceOwner:uid});
        pausedTasks.push((await pauseTimer(tx,state,user,at,'')).wih);
      }
      if (action==='break') row.breakStart=at;
      else {
        if (row.breakStart) endBreak();
        row.checkOut=at;
        row.availabilityBusy=false;
      }
    } else if (action==='in') {
      if (row.checkIn) throw fail('Already checked in today.',409);
      row.checkIn=at;
    } else if (action==='resume') {
      if (!row.breakStart||row.checkOut) throw fail('No active break.',409);
      endBreak();
    } else if (action==='entry') {
      const start=String(p.start||''),end=String(p.end||''),note=String(p.note||'').trim();
      const valid=/^([01]\d|2[0-3]):[0-5]\d$/;
      if (!row.checkIn||!valid.test(start)||!valid.test(end)||start>=end||!note||note.length>250||entries.length>=40) throw fail('Enter a valid time range and activity.');
      const clock=value=>Date.parse(day+'T'+value+':00+05:30');
      if (clock(start)<Math.floor(Date.parse(row.checkIn)/60000)*60000||clock(end)>Date.parse(row.checkOut||at)) throw fail('Log time within your attendance window.');
      if ([...breaks,...(row.breakStart?[{start:row.breakStart,end:at}]:[])].some(item=>clock(start)<Date.parse(item.end)&&clock(end)>Date.parse(item.start))) {
        throw fail('That time overlaps a break.');
      }
      if (entries.some(item=>start<item.end&&end>item.start)) throw fail('That time overlaps an existing entry.');
      entries.push({start,end,note,...await attendanceLabels(tx,p,user)});
      row.entriesJson=JSON.stringify(entries);
    } else throw fail('Unknown attendance action.');
    if (prior) await tx.query('UPDATE enlighten_operational.studio_attendance SET cells=$1::jsonb,updated_at=clock_timestamp() WHERE record_id=$2',[JSON.stringify(row),prior.record_id]);
    else await tx.query('INSERT INTO enlighten_operational.studio_attendance (cells) VALUES ($1::jsonb)',[JSON.stringify(row)]);
    return {checkIn:row.checkIn,checkOut:row.checkOut,breakStart:row.breakStart||'',entries,pausedTasks};
  });
}

export async function teamAvailability(p,{user,database=db,now=Date.now()}) {
  const uid=studioMember(user),department=String(p.department||''),admin=/^admin$/i.test(user.appAccess);
  const canEdit=/^(admin|user)$/i.test(user.appAccess);
  if (!['studio','sales','marketing','accounts','legal','hr'].includes(department)||(!isSystemAdmin(user)&&user.departmentKey!==department)) {
    throw fail('Department access required.',403);
  }
  if (p.action!=='list'&&(p.action!=='setBusy'||typeof p.busy!=='boolean'||!canEdit)) throw fail('Availability update is unavailable.');
  const day=indiaDay(now),key=uid+'|'+day;
  const statusOf=(row,onsite=false)=>!row?.checkIn||row.checkOut?(onsite?'Available':'Offline'):
    sheetActive(row.availabilityBusy)||row.breakStart?'Busy':'Available';
  return database.transaction(async tx=>{
    if (p.action==='setBusy') {
      await tx.query("SELECT pg_advisory_xact_lock(hashtext('enlighten_work_timers'))");
      const rows=await tx.rows("SELECT record_id,cells FROM enlighten_operational.studio_attendance WHERE cells->>'key'=$1 LIMIT 2 FOR UPDATE",[key]);
      if (rows.length!==1||statusOf(rows[0].cells)==='Offline') throw fail('Check in before changing your availability.',409);
      await tx.query("UPDATE enlighten_operational.studio_attendance SET cells=jsonb_set(cells,'{availabilityBusy}',to_jsonb($1::boolean)),updated_at=clock_timestamp() WHERE record_id=$2",
        [p.busy,rows[0].record_id]);
    }
    const attendance=new Map((await tx.rows("SELECT cells FROM enlighten_operational.studio_attendance WHERE cells->>'key'=(cells->>'userId')||'|'||$1",[day]))
      .map(row=>[String(row.cells.userId),row.cells]));
    const departmentNames=new Map((await tx.rows("SELECT cells FROM enlighten_operational.departments WHERE cells->>'masterId' LIKE 'WS-%'"))
      .map(({cells})=>[String(cells.name).toLowerCase(),String(cells.masterId).slice(3)]));
    const members=(await tx.rows('SELECT cells FROM enlighten_operational.people ORDER BY source_row_number NULLS LAST,record_id'))
      .map(row=>row.cells).filter(row=>row.userId&&sheetActive(row.active)&&/^(admin|user|viewer)$/i.test(row.appAccess)&&
        (admin||assignedDepartment(row.department,departmentNames)===department));
    const memberIds=new Set(members.map(row=>String(row.userId)));
    const punches=new Map();
    for (const {cells:punch} of await tx.rows('SELECT cells FROM enlighten_operational.site_punch_ins ORDER BY source_row_number NULLS LAST,record_id')) {
      const id=String(punch.userId),start=Date.parse(punch.checkInAt);
      if (!memberIds.has(id)||!Number.isFinite(start)||start>now||indiaDay(start)!==day) continue;
      if (!punches.has(id)||start>=Date.parse(punches.get(id).checkInAt)) punches.set(id,punch);
    }
    const projects=new Map((await tx.rows('SELECT cells FROM enlighten_operational.projects'))
      .map(({cells})=>[String(cells.projectId),cells.projectName]));
    const work=new Map();
    if (admin) {
      const areas=await internalAreaRows(tx);
      const names=new Map([...projects,...areas.map(row=>[row.id,row.name])]);
      const timers=await tx.rows("SELECT w.cells AS timer,d.cells->>'taskType' AS title FROM enlighten_operational.wih w LEFT JOIN enlighten_operational.design_tasks d ON d.cells->>'designTaskId'=w.cells->>'designTaskId' WHERE w.cells->>'status'='In Progress'");
      for (const {timer,title} of timers) {
        const id=String(timer.assigneeUserId),pid=String(timer.projectId);
        if (!memberIds.has(id)||!Number.isFinite(Date.parse(timer.startAt))||!areas.some(area=>area.id===pid)&&!wihProjectRole(user,pid)) continue;
        if (!work.has(id)) work.set(id,[]);
        work.get(id).push({id:String(timer.designTaskId),title:title||'Task',project:names.get(pid)||''});
      }
    }
    const onSite=punch=>Boolean(punch&&!punch.checkOutAt&&!/checked out/i.test(String(punch.status)));
    const own=attendance.get(uid);
    const people=members.map(member=>{
      const id=String(member.userId),row=attendance.get(id),punch=punches.get(id),onsite=onSite(punch);
      const status=statusOf(row,onsite),pid=String(punch?.projectId||'');
      return {id,name:member.name,department:member.department||'',location:onsite?(projectRoleFor(user,pid)?projects.get(pid)||'On site':'On site'):'',
        onsite,status,activeWork:work.get(id)||[],note:status==='Busy'?(sheetActive(row?.availabilityBusy)?"Please don't disturb":'On break'):''};
    });
    return {people,status:statusOf(own,onSite(punches.get(uid))),busy:Boolean(own?.checkIn&&!own.checkOut&&sheetActive(own.availabilityBusy)),
      canSet:canEdit&&statusOf(own)!=='Offline'};
  },{readOnly:p.action==='list'});
}
