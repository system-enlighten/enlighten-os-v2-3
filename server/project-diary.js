import {randomUUID} from 'node:crypto';
import {db} from './supabase-db.js';
import {projectRoleFor,requireProject,requireStudio} from './permissions.js';
import {executionVisits} from './project-visits.js';
import {diaryAttachmentFolder,uploadDiaryFile} from './drive-attachments.js';
import {diaryArray_,diaryMeetingParticipant_,diaryMinutes_,diaryTimelineEvents_,meetingRecordTiming_,projectDrawingHistory_,recordDate_} from './diary-projections.js';

const active=value=>!['false','no','0','n',''].includes(String(value??'').trim().toLowerCase());
const failure=(message,statusCode=400)=>Object.assign(new Error(message),{statusCode});
const allowedTables=new Set(['projects','project_meetings','execution_visits','diary_entries','mom_tasks','mom_visit_points','historical_workflow_meetings',
  'home_agenda_sessions','drawing_register','files','design_tasks','issued_drawings','people']);

async function rows(tx,table,projectIds=null) {
  if (!allowedTables.has(table)) throw Error('Unsupported diary data source.');
  const records=await tx.rows(`SELECT cells FROM enlighten_operational."${table}"
    WHERE ($1::text[] IS NULL OR cells->>'projectId'=ANY($1))
    ORDER BY source_row_number NULLS LAST,record_id`,[projectIds]);
  return records.map(record=>record.cells);
}

async function diary(tx,payload,user) {
  requireStudio(user);
  const requested=String(payload.projectId||'');
  const requestedIds=requested?[requested]:null;
  const projectAccess=id=>Boolean(projectRoleFor(user,String(id)));
  const source=await rows(tx,'project_meetings',requestedIds);
  const invited=source.filter(meeting=>diaryMeetingParticipant_(user,meeting));
  const invitedProjects=new Set(invited.map(meeting=>String(meeting.projectId)));
  if (requested&&!projectAccess(requested)&&!invitedProjects.has(requested)) throw failure('Project access required.',403);
  const projects=(await rows(tx,'projects')).filter(row=>projectAccess(row.projectId)||invitedProjects.has(String(row.projectId)));
  const projectIds=new Set(projects.map(row=>String(row.projectId)));
  const allMeetings=source.filter(row=>projectIds.has(String(row.projectId))&&
    (projectAccess(row.projectId)||diaryMeetingParticipant_(user,row)));
  const meetings=allMeetings.filter(row=>active(row.active));
  const fullIds=[...projectIds].filter(projectAccess);
  const visits=requested?(projectAccess(requested)?await executionVisits(tx,requested):[]):await rows(tx,'execution_visits',fullIds);
  const accessibleIds=requested?[requested]:[...projectIds];
  const meetingKeys=new Set(allMeetings.map(row=>'meeting:'+row.id));
  const details=(await rows(tx,'diary_entries',accessibleIds)).filter(row=>projectAccess(row.projectId)||meetingKeys.has(String(row.entryId)));
  const tasks=await rows(tx,'mom_tasks',accessibleIds);
  const points=await rows(tx,'mom_visit_points',accessibleIds);
  const writable=String(user.appAccess).toLowerCase()!=='viewer';
  const timeline=diaryMinutes_(diaryTimelineEvents_(allMeetings,visits,details,user),tasks,points)
    .map(event=>({...event,canOpenWorkflow:projectAccess(event.projectId),
      canLogMom:writable&&projectRoleFor(user,event.projectId)==='Admin',canManageMomTasks:writable&&projectAccess(event.projectId)}));
  return {projects:projects.map(row=>({id:String(row.projectId),no:row.projectNo,name:row.projectName})),meetings,visits,timeline};
}

export async function getProjectDiary(payload,{user,database=db}) {
  return database.transaction(tx=>diary(tx,payload,user),{readOnly:true});
}

export async function getProjectRecords(payload,{user,database=db}) {
  return database.transaction(async tx=>{
    const state=await diary(tx,payload,user);
    const ids=state.projects.map(row=>row.id).filter(id=>(!payload.projectId||String(payload.projectId)===id)&&projectRoleFor(user,id));
    const historical=(await rows(tx,'historical_workflow_meetings',ids)).filter(row=>row.date||row.notes)
      .map(row=>({id:'historical:'+String(row.key||row.lineWorkId),projectId:String(row.projectId),title:row.title||'Historical meeting',
        date:recordDate_(row.date).slice(0,10),time:'',endTime:'',happened:true,notes:row.notes||'',actions:'',
        detail:{photos:[],documents:[]},minutePoints:[],canManageMomTasks:false,historical:true}));
    const meetings=[...state.timeline,...historical];
    const sessions=await rows(tx,'home_agenda_sessions');
    const people=new Map((await rows(tx,'people')).map(row=>[String(row.userId),String(row.name||'Team member')]));
    const history=meetings.map(event=>{
      const timing=meetingRecordTiming_(event,sessions,meetings);
      timing.sessions=timing.sessions.map(session=>({...session,name:people.get(session.userId)||'Team member'}));
      return {id:'record:'+event.id,projectId:event.projectId,kind:'meeting',date:timing.source==='recorded'?timing.start:event.date,title:event.title,meeting:{...event,timing}};
    });
    const [drawings,files,tasks,issued]=await Promise.all(['drawing_register','files','design_tasks','issued_drawings'].map(table=>rows(tx,table,ids)));
    history.push(...projectDrawingHistory_(drawings,files,tasks,issued));
    history.sort((a,b)=>(recordDate_(b.date)?Date.parse(b.date):0)-(recordDate_(a.date)?Date.parse(a.date):0)||String(a.id).localeCompare(String(b.id)));
    return {projects:state.projects,history};
  },{readOnly:true});
}

function diaryAssets(list,max) {
  if (!Array.isArray(list)||list.length>max) throw failure('Too many attachments.');
  return list.map(asset=>{
    const url=String(asset?.url||'').trim(),name=String(asset?.name||''),fileId=String(asset?.fileId||'');
    if (url.length>2000||!(/^(?:https:\/\/[^\s]+|\/(?:technical-library|application-library)\/[\w.-]+)$/.test(url))||name.length>200||fileId.length>200) {
      throw failure('Invalid attachment.');
    }
    const caption=String(asset.caption||'');
    if (caption.length>1000) throw failure('Photo caption exceeds 1,000 characters.');
    return {url,name,fileId,kind:String(asset.kind||''),caption};
  });
}

export async function saveDiaryEntry(payload,{user,database=db}) {
  const projectId=String(payload.projectId||'');
  requireProject(user,projectId,{write:true});
  const entryId=String(payload.entryId||'');
  return database.transaction(async tx=>{
    await tx.query('SELECT pg_advisory_xact_lock(hashtextextended($1,0))',['diary:'+projectId]);
    const state=await diary(tx,{projectId},user);
    const event=state.timeline.find(value=>value.id===entryId||value.detail?.entryId===entryId||value.aliases.includes(entryId));
    if (!event) throw failure('Meeting/visit no longer exists. Refresh the diary.',404);
    const input=payload.detail||{};
    const row={entryId:event.detail.entryId||event.id,projectId,
      sourceSnapshotJson:JSON.stringify(Object.fromEntries(Object.entries(event).filter(([key])=>!['detail','canEdit'].includes(key))))};
    for (const [name,max] of [['summary',3000],['workDone',5000],['decisions',5000],['momText',10000]]) {
      row[name]=String(input[name]||'');
      if (row[name].length>max) throw failure(name+' is too long.');
    }
    row.photosJson=JSON.stringify(diaryAssets(input.photos||[],20));
    row.documentsJson=JSON.stringify(diaryAssets(input.documents||[],10));
    if (JSON.stringify(row).length>44000) throw failure('Diary entry is too large.');
    const old=await tx.rows("SELECT record_id,cells FROM enlighten_operational.diary_entries WHERE cells->>'entryId'=$1 LIMIT 2 FOR UPDATE",[row.entryId]);
    if (old.length>1||old[0]&&String(old[0].cells.projectId)!==projectId) throw failure('Diary entry project mismatch.',409);
    if (String(old[0]?.cells.version||'')!==String(payload.expectedVersion||'')) throw failure('This diary entry changed. Refresh before saving.',409);
    Object.assign(row,{version:randomUUID(),updatedAt:new Date().toISOString(),updatedBy:user.name||user.email});
    if (old[0]) await tx.query('UPDATE enlighten_operational.diary_entries SET cells=cells||$1::jsonb,updated_at=clock_timestamp() WHERE record_id=$2::bigint',[JSON.stringify(row),old[0].record_id]);
    else await tx.query('INSERT INTO enlighten_operational.diary_entries (cells) VALUES ($1::jsonb)',[JSON.stringify(row)]);
    return {...row,photos:diaryArray_(row.photosJson),documents:diaryArray_(row.documentsJson)};
  });
}

export async function uploadDiaryAttachment(payload,{user,database=db,env=process.env,files}) {
  const projectId=String(payload.projectId||'');
  requireProject(user,projectId,{write:true});
  const entryId=String(payload.entryId||'');
  if (!entryId) throw failure('Choose a diary entry.');
  const resolveFolder=()=>database.transaction(async tx=>{
    const state=await diary(tx,{projectId},user);
    if (!state.timeline.some(event=>event.id===entryId||event.detail?.entryId===entryId||event.aliases.includes(entryId))) {
      throw failure('Meeting/visit no longer exists. Refresh the diary.',404);
    }
    await tx.query('SELECT pg_advisory_xact_lock(hashtextextended($1,0))',['diary-folder:'+projectId]);
    return diaryAttachmentFolder(projectId,{files,env});
  });
  return uploadDiaryFile(payload,{resolveFolder,files});
}

export {diary as projectDiaryState};
