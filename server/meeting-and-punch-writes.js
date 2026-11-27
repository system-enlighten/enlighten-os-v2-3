import {cleanVisitPlans,validVisitDate,visitCoverageList,writeVisitPlans} from './project-visits.js';
import {meetingParticipantDisplay_,resolveSiteVisitParticipants_,resolveSiteVisitLead_,isVisitClock_,meetingClockCell_} from './meeting-participants.js';
import {db} from './supabase-db.js';
import {requireProject,requireSystemAdmin} from './permissions.js';
import {active,actor,failure,insertRecord,nextEntityId,now,projectRow,text,updateRecord,writeActivity} from './project-write-storage.js';

const fields=(p,key)=>{
  const projectId=text(p.projectId),id=text(p[key]);
  if (!projectId||!id) throw failure('Choose a project and record.');
  return {projectId,id};
};
const sources={site_punch_ins:'punchId',project_meetings:'id',execution_visits:'visitPlanId'};
async function one(tx,table,id,projectId,optional=false) {
  const field=sources[table];
  if (!field) throw Error('Unknown visit table.');
  const rows=await tx.rows('SELECT record_id,cells FROM enlighten_operational.'+table+
    ' WHERE cells->>$1=$2 AND cells->>\'projectId\'=$3 LIMIT 2 FOR UPDATE',[field,id,projectId]);
  if (optional&&!rows.length) return null;
  if (rows.length!==1) throw failure('Record not found for this project.',404);
  return rows[0];
}

export async function saveSitePunchIn(p,{user,database=db}) {
  const projectId=text(p.projectId),uid=text(p.userId),id=text(p.punchId);
  const role=requireProject(user,projectId,{write:true});
  if (!uid||!p.checkInAt) throw failure('Choose a team member and enter check-in time.');
  if (role!=='Admin'&&uid!==String(user.userId)) throw failure('You can save only your own punch-in records.',403);
  const start=new Date(p.checkInAt),end=p.checkOutAt?new Date(p.checkOutAt):null;
  if (!Number.isFinite(+start)||end&&(!Number.isFinite(+end)||+end<+start)) throw failure('Enter valid entry/exit dates; exit cannot precede entry.');
  return database.transaction(async tx=>{
    if (!await projectRow(tx,projectId)) throw failure('Project not found.',404);
    const people=await tx.rows("SELECT cells FROM enlighten_operational.people WHERE cells->>'userId'=$1 LIMIT 2",[uid]);
    if (people.length!==1||!active(people[0].cells.active)) throw failure('Choose an active team member.');
    const prior=id?await one(tx,'site_punch_ins',id,projectId):null;
    if (prior&&role!=='Admin'&&String(prior.cells.userId)!==uid) throw failure('You can edit only your own punch-in records.',403);
    const row={punchId:id||await nextEntityId(tx,'site_punch_ins'),projectId,userId:uid,person:people[0].cells.name,
      purpose:String(p.purpose||''),status:end?'Checked out':'Checked in',checkInAt:start.toISOString(),checkOutAt:end?.toISOString()||'',
      checkInLocation:prior?.cells.checkInLocation||'',checkOutLocation:prior?.cells.checkOutLocation||'',updatedAt:now(),updatedBy:actor(user)};
    if (prior) await updateRecord(tx,'site_punch_ins',prior.record_id,row);
    else await insertRecord(tx,'site_punch_ins',row);
    await writeActivity(tx,user,'SAVE','SitePunchIn',row.punchId,projectId,prior?.cells,row);
    return row;
  });
}

export async function deleteSitePunchIn(p,{user,database=db}) {
  const {projectId,id}=fields(p,'punchId');
  requireProject(user,projectId,{write:true,admin:true});
  return database.transaction(async tx=>{
    if (!await projectRow(tx,projectId)) throw failure('Project not found.',404);
    const prior=await one(tx,'site_punch_ins',id,projectId);
    await writeActivity(tx,user,'DELETE','SitePunchIn',id,projectId,prior.cells,null);
    await tx.query('DELETE FROM enlighten_operational.site_punch_ins WHERE record_id=$1',[prior.record_id]);
    return {deleted:true};
  });
}

export async function saveActualMeetingTimes(p,{user,database=db,clock=Date.now}) {
  requireSystemAdmin(user);
  const {projectId,id}=fields(p,'id');
  const valid=/^(?:[01]\d|2[0-3]):[0-5]\d$/;
  return database.transaction(async tx=>{
    const meeting=await one(tx,'project_meetings',id,projectId);
    if (!active(meeting.cells.active)) throw failure('Meeting not found.',404);
    const day=String(meeting.cells.date||'').slice(0,10);
    const start=valid.test(p.start)?Date.parse(day+'T'+p.start+':00+05:30'):NaN;
    const end=valid.test(p.end)?Date.parse(day+'T'+p.end+':00+05:30'):NaN;
    if (!Number.isFinite(start)||!Number.isFinite(end)||end<=start||end>clock()) {
      throw failure('Enter actual start and end times on the meeting date, ending by now.');
    }
    const patch={actualStartAt:new Date(start).toISOString(),actualEndAt:new Date(end).toISOString(),
      actualTimesUpdatedAt:new Date(clock()).toISOString(),actualTimesUpdatedBy:user.email};
    await updateRecord(tx,'project_meetings',meeting.record_id,patch);
    return {...meeting.cells,...patch};
  });
}

export async function deleteProjectMeeting(p,{user,database=db}) {
  const {projectId,id}=fields(p,'id');
  requireProject(user,projectId,{write:true});
  return database.transaction(async tx=>{
    if (!await projectRow(tx,projectId)) throw failure('Project not found.',404);
    const meeting=await one(tx,'project_meetings',id,projectId);
    const meta={updatedAt:now(),updatedBy:actor(user)};
    const visit=meeting.cells.visitPlanId?await one(tx,'execution_visits',String(meeting.cells.visitPlanId),projectId,true):null;
    if (visit&&visit.cells.scheduledDate&&String(visit.cells.scheduledDate).slice(0,10)===String(meeting.cells.date).slice(0,10)) {
      await updateRecord(tx,'execution_visits',visit.record_id,{...meta,scheduledDate:''});
    }
    await updateRecord(tx,'project_meetings',meeting.record_id,{...meta,active:false});
    return {id,deleted:true};
  });
}

export async function requireExecutionSignoff(tx,projectId,visit) {
  if (!/^Execution Phase$/i.test(String(visit?.stage||''))) return;
  const [row]=await tx.rows(`SELECT
    EXISTS (SELECT 1 FROM enlighten_operational.design_tasks WHERE cells->>'projectId'=$1 AND
      coalesce(nullif(cells->>'parentTask',''),cells->>'taskType','') ~* 'lighting layout|wiring drawings|rcp/flr/cir') OR
    EXISTS (SELECT 1 FROM enlighten_operational.design_dashboard WHERE cells->>'projectId'=$1 AND lower(cells->>'lightStatus') IN ('completed','done')) AS required,
    EXISTS (SELECT 1 FROM enlighten_operational.architectural_lighting_milestones WHERE project_id=$1) AS signed`,[projectId]);
  if (row.required&&!row.signed) throw failure('Sign off Finalise Architectural Lighting in Line of Work before starting execution.',409);
}

export async function saveProjectMeeting(p,{user,database=db}) {
  const {projectId,id}=fields(p,'id'),title=text(p.title);
  const role=requireProject(user,projectId,{write:true});
  if (!title||!validVisitDate(p.date)) throw failure('Enter a meeting title and valid date.');
  return database.transaction(async tx=>{
    if (!await projectRow(tx,projectId)) throw failure('Project not found.',404);
    await tx.query('SELECT pg_advisory_xact_lock(hashtextextended($1,0))',['project-meeting:'+id]);
    const existing=await tx.rows("SELECT record_id,cells FROM enlighten_operational.project_meetings WHERE cells->>'id'=$1 LIMIT 2 FOR UPDATE",[id]);
    const found=existing[0],prior=found?.cells;
    if (existing.length>1||prior&&String(prior.projectId)!==projectId) throw failure('Meeting belongs to another project or is duplicated.',409);
    const author=prior?.scheduledByUserId?String(prior.scheduledByUserId)===String(user.userId):Boolean(prior?.createdBy)&&
      [user.name,user.email].some(value=>text(value).toLowerCase()===text(prior.createdBy).toLowerCase());
    if (prior&&(prior.visitPlanId||/site|physical/i.test(String(prior.meetingMode)))&&role!=='Admin'&&!author) {
      throw failure('Only an admin or the person who scheduled this visit can edit it.',403);
    }
    const visitPlanId=text(p.visitPlanId);
    let coverage,visit;
    if (visitPlanId) {
      coverage={workItems:visitCoverageList(p.workItems,''),floors:visitCoverageList(p.floors,'')};
      if (!coverage.workItems.length||!coverage.floors.length) throw failure('Select work stages and floors.');
      if (role!=='Admin'&&!author) throw failure('Project admin required to schedule execution visits.',403);
      visit=await one(tx,'execution_visits',visitPlanId,projectId,true);
      if (!visit&&String(p.visitSeed?.projectId)===projectId&&String(p.visitSeed?.visitPlanId)===visitPlanId) {
        await writeVisitPlans(tx,projectId,cleanVisitPlans([p.visitSeed]),{user,initializeOnly:true});
        visit=await one(tx,'execution_visits',visitPlanId,projectId,true);
      }
      if (!visit||String(visit.cells.active).toLowerCase()==='false') throw failure('Visit not found.',404);
      await requireExecutionSignoff(tx,projectId,visit.cells);
    }
    const meetingMode=text(p.meetingMode||prior?.meetingMode||'Physical on-site meeting');
    if (!['Zoom call','Physical on-site meeting'].includes(meetingMode)) throw failure('Choose Zoom call or Physical on-site meeting.');
    const people=(await tx.rows('SELECT cells FROM enlighten_operational.people')).map(row=>row.cells);
    const contacts=(await tx.rows("SELECT cells FROM enlighten_operational.project_contacts WHERE cells->>'projectId'=$1",[projectId])).map(row=>row.cells);
    const leadInput=text(p.visitLeadId??prior?.visitLeadId);
    const lead=meetingMode==='Physical on-site meeting'&&leadInput?resolveSiteVisitLead_([leadInput],people):null;
    if (meetingMode==='Physical on-site meeting'&&leadInput&&!lead) throw failure('Enter the team member full name for the site visit.');
    const time=meetingClockCell_(p.time||'',''),endTime=meetingClockCell_(p.endTime??prior?.endTime??'','');
    if (time&&!isVisitClock_(time)||endTime&&!isVisitClock_(endTime)) throw failure('Choose valid meeting start and end times.');
    if (time&&endTime&&endTime<=time) throw failure('Meeting end time must be after its start time.');
    const at=now(),by=actor(user);
    const row={id,projectId,visitPlanId,workItems:coverage?JSON.stringify(coverage.workItems):'',floors:coverage?JSON.stringify(coverage.floors):'',
      date:p.date,time,endTime,title,participants:meetingParticipantDisplay_(p.participants??prior?.participants??''),
      scheduledByUserId:prior?(prior.scheduledByUserId||(author?String(user.userId||''):'')):String(user.userId||''),
      visitLeadId:lead?String(lead.userId):'',meetingMode,location:String(p.location||''),agenda:String(p.agenda||''),happened:active(p.happened),
      mom:String(p.mom||''),actionItems:String(p.actionItems||''),nextDate:String(p.nextDate||''),active:true,
      createdAt:prior?.createdAt||at,createdBy:prior?.createdBy||by,updatedAt:at,updatedBy:by};
    row.participantUserIds=JSON.stringify(resolveSiteVisitParticipants_({projectId,participants:row.participants},people,contacts).map(person=>String(person.userId)));
    if (found) await updateRecord(tx,'project_meetings',found.record_id,row);
    else await insertRecord(tx,'project_meetings',row);
    if (visit) {
      const datePatch=row.happened?(String(visit.cells.scheduledDate||'').slice(0,10)===row.date?{scheduledDate:''}:{}):{scheduledDate:row.date};
      await updateRecord(tx,'execution_visits',visit.record_id,{...datePatch,title,updatedAt:at,updatedBy:by});
    }
    return {...prior,...row};
  });
}
