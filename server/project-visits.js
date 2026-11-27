import {db} from './supabase-db.js';
import {checkProjectRead,requireProject,visibleProjectIds} from './permissions.js';

const active = value => !['false','no','0','n',''].includes(String(value ?? '').trim().toLowerCase());
const invalid = message => Object.assign(new Error(message),{statusCode:400});

export async function listSitePunchIns(payload,{user,database=db}) {
  const ids=visibleProjectIds(user);
  const projectId=String(payload.projectId||'');
  return database.transaction(async tx=>{
    await checkProjectRead(tx,user,projectId);
    const rows=await tx.rows(`SELECT cells FROM enlighten_operational.site_punch_ins
      WHERE ($1='' OR cells->>'projectId'=$1) AND ($2::text[] IS NULL OR cells->>'projectId'=ANY($2))
      ORDER BY source_row_number NULLS LAST,record_id`,[projectId,ids]);
    return rows.map(row=>row.cells);
  },{readOnly:true});
}

export async function listMomTasks(payload,{user,database=db}) {
  const projectId=String(payload.projectId||'');
  if (!projectId) throw invalid('Choose a project.');
  return database.transaction(async tx=>{
    await checkProjectRead(tx,user,projectId);
    const rows=await tx.rows(`SELECT cells FROM enlighten_operational.mom_tasks WHERE cells->>'projectId'=$1
      ORDER BY coalesce(cells->>'createdAt','') DESC,source_row_number NULLS LAST,record_id`,[projectId]);
    return rows.map(row=>row.cells);
  },{readOnly:true});
}

export async function listExecutionVisits(payload,{user,database=db}) {
  const projectId=String(payload.projectId||'');
  if (!projectId) throw invalid('Choose a project.');
  return database.transaction(async tx=>{
    await checkProjectRead(tx,user,projectId);
    return executionVisits(tx,projectId);
  },{readOnly:true});
}

async function findVisit(tx,projectId,visitPlanId) {
  const rows=await tx.rows(`SELECT cells FROM enlighten_operational.execution_visits
    WHERE cells->>'projectId'=$1 AND cells->>'visitPlanId'=$2 LIMIT 2`,[projectId,visitPlanId]);
  if (rows.length!==1) throw Object.assign(new Error('Visit plan not found for this project.'),{statusCode:404});
  return rows[0].cells;
}

export async function getVisitMomContext(payload,{user,database=db}) {
  const projectId=String(payload.projectId||''),visitPlanId=String(payload.visitPlanId||'');
  if (!visitPlanId) throw invalid('Choose a visit plan.');
  requireProject(user,projectId,{write:true,admin:true});
  return database.transaction(async tx=>{
    const visit=await findVisit(tx,projectId,visitPlanId);
    if (String(visit.active).toLowerCase()==='false') throw Object.assign(new Error('Visit plan not found for this project.'),{statusCode:404});
    const [project]=await tx.rows("SELECT cells FROM enlighten_operational.projects WHERE cells->>'projectId'=$1",[projectId]);
    if (!project) throw Object.assign(new Error('Project not found.'),{statusCode:404});
    return {projectName:String(project.cells.projectName||''),milestone:String(visit.milestone||''),floor:String(visit.floor||'')};
  },{readOnly:true});
}

async function visitPoints(tx,projectId,visitId) {
  const rows=await tx.rows(`SELECT cells FROM enlighten_operational.mom_visit_points
    WHERE cells->>'projectId'=$1 AND cells->>'visitId'=$2 ORDER BY source_row_number NULLS LAST,record_id`,[projectId,visitId]);
  return rows.map(row=>row.cells).sort((a,b)=>Number(a.position)-Number(b.position)).map(row=>{
    try { return JSON.parse(row.recordJson); }
    catch { throw Object.assign(new Error('Saved MOM point could not be read.'),{statusCode:409}); }
  });
}

export async function getMomVisitPoints(payload,{user,database=db}) {
  const projectId=String(payload.projectId||'');
  if (!projectId) throw invalid('Choose a project.');
  return database.transaction(async tx=>{
    await checkProjectRead(tx,user,projectId);
    if (payload.visitId) return visitPoints(tx,projectId,String(payload.visitId));
    if (!payload.visitPlanId||!payload.date) throw invalid('Choose a visit plan and date.');
    const visit=await findVisit(tx,projectId,String(payload.visitPlanId));
    let history;
    try {
      history=JSON.parse(visit.history||'[]');
      if (!Array.isArray(history)) throw Error();
    } catch {
      throw Object.assign(new Error('Visit history could not be read.'),{statusCode:409});
    }
    const visits=history.filter(item=>item.pointsVersion&&String(item.date).slice(0,10)===String(payload.date).slice(0,10));
    return (await Promise.all(visits.map(item=>visitPoints(tx,projectId,String(item.visitId))))).flat();
  },{readOnly:true});
}

export async function executionVisits(tx,projectId) {
  const meetings=await tx.rows(`SELECT cells FROM enlighten_operational.project_meetings WHERE cells->>'projectId'=$1
    ORDER BY source_row_number NULLS LAST,record_id`,[projectId]);
  const visitKey=(id,date)=>JSON.stringify([String(id),String(date||'').slice(0,10)]);
  const byVisit=new Map();
  for (const {cells:meeting} of meetings) {
    if (!meeting.visitPlanId || active(meeting.happened) || String(meeting.active).toLowerCase()==='false') continue;
    const key=visitKey(meeting.visitPlanId,meeting.date);
    const previous=byVisit.get(key);
    if (!previous || String(meeting.updatedAt||meeting.createdAt||'')>=String(previous.updatedAt||previous.createdAt||'')) byVisit.set(key,meeting);
  }
  const visits=await tx.rows(`SELECT cells FROM enlighten_operational.execution_visits WHERE cells->>'projectId'=$1
    ORDER BY source_row_number NULLS LAST,record_id`,[projectId]);
  return visits.map(({cells:visit})=>({...visit,scheduledDate:String(visit.scheduledDate||'').slice(0,10),
    scheduledMeeting:byVisit.get(visitKey(visit.visitPlanId,visit.scheduledDate))||null}));
}

export async function deleteExecutionVisit(payload,{user,database=db}) {
  const projectId=String(payload.projectId||'');
  const visitPlanId=String(payload.visitPlanId||'');
  if (!visitPlanId) throw invalid('Choose a visit plan.');
  requireProject(user,projectId,{write:true,admin:true});
  return database.transaction(async tx=>{
    await checkProjectRead(tx,user,projectId);
    const matches=await tx.rows(`SELECT record_id FROM enlighten_operational.execution_visits
      WHERE cells->>'projectId'=$1 AND cells->>'visitPlanId'=$2 LIMIT 2 FOR UPDATE`,[projectId,visitPlanId]);
    if (matches.length!==1) throw Object.assign(new Error('Visit not found for this project.'),{statusCode:404});
    const at=new Date().toISOString(), actor=user.name||user.email;
    const patch={active:false,deletedAt:at,deletedBy:actor,updatedAt:at,updatedBy:actor};
    await tx.query('UPDATE enlighten_operational.execution_visits SET cells=cells||$1::jsonb,updated_at=clock_timestamp() WHERE record_id=$2::bigint',[JSON.stringify(patch),matches[0].record_id]);
    return executionVisits(tx,projectId);
  });
}

export function visitCoverageList(raw,fallback) {
  let list=raw;
  if (typeof raw==='string') {
    try {list=JSON.parse(raw);} catch {list=null;}
  }
  if (!Array.isArray(list)) list=String(fallback||'').split(/\s+\+\s+|,/);
  list=[...new Set(list.map(value=>String(value).trim()).filter(Boolean))];
  if (list.length>30||list.some(value=>value.length>120)) throw invalid('Use up to 30 short work/floor labels.');
  return list;
}

export const validVisitDate=date=>typeof date==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(date)&&
  Number.isFinite(Date.parse(date))&&new Date(date).toISOString().slice(0,10)===date;

export function cleanVisitPlans(rows) {
  if (!Array.isArray(rows)||rows.length>200) throw invalid('Provide up to 200 visit plan rows.');
  const clean=rows.map(row=>{
    if (row?.scheduledDate&&!validVisitDate(row.scheduledDate)) throw invalid('Valid scheduled date required.');
    if (!row?.visitPlanId||!String(row.milestone||'').trim()) throw invalid('Visit ID and milestone required.');
    const workItems=visitCoverageList(row.workItems,row.milestone),floors=visitCoverageList(row.floors,row.floor||'Project');
    if (!workItems.length||!floors.length) throw invalid('Select work stages and floors for the visit.');
    const title=String(row.title||'').trim(),count=Number(row.plannedVisits||1);
    if (title.length>160) throw invalid('Visit title must be 160 characters or less.');
    if (!Number.isInteger(count)||count<1||count>100) throw invalid('Planned visits must be between 1 and 100.');
    return {visitPlanId:String(row.visitPlanId),seq:Number(row.seq)||1,stage:String(row.stage||''),milestone:workItems.join(' + '),
      floor:floors.join(' + '),title,workItems:JSON.stringify(workItems),floors:JSON.stringify(floors),
      visitType:String(row.visitType||'Visit').slice(0,120),essential:active(row.essential),plannedVisits:count,weekly:active(row.weekly),
      closed:active(row.closed),...(Object.hasOwn(row,'scheduledDate')?{scheduledDate:String(row.scheduledDate||'')}:{})};
  });
  if (new Set(clean.map(row=>row.visitPlanId)).size!==clean.length) throw invalid('Duplicate visit plan ID.');
  return clean;
}

export async function writeVisitPlans(tx,projectId,clean,{user,initializeOnly}) {
  const ids=clean.map(row=>row.visitPlanId);
  for (const id of [...ids].sort()) await tx.query('SELECT pg_advisory_xact_lock(hashtextextended($1,0))',['visit-plan:'+id]);
  const existing=await tx.rows("SELECT record_id,cells FROM enlighten_operational.execution_visits WHERE cells->>'visitPlanId'=ANY($1::text[]) FOR UPDATE",[ids]);
  const prior=new Map();
  for (const row of existing) {
    if (String(row.cells.projectId)!==projectId||prior.has(String(row.cells.visitPlanId))) throw invalid('Visit belongs to another project or is duplicated.');
    prior.set(String(row.cells.visitPlanId),row);
  }
  const updatedAt=new Date().toISOString(),updatedBy=user.name||user.email;
  for (const row of clean) {
    const match=prior.get(row.visitPlanId),patch={...row,projectId,updatedAt,updatedBy};
    if (match) {
      if (initializeOnly) continue;
      if (String(match.cells.active).toLowerCase()==='false') throw invalid('This visit was removed. Add a new review instead.');
      await tx.query('UPDATE enlighten_operational.execution_visits SET cells=cells||$1::jsonb,updated_at=clock_timestamp() WHERE record_id=$2',
        [JSON.stringify(patch),match.record_id]);
    } else {
      await tx.query('INSERT INTO enlighten_operational.execution_visits (cells) VALUES ($1::jsonb)',
        [JSON.stringify({...patch,active:true,history:'[]',createdAt:updatedAt,createdBy:updatedBy})]);
    }
  }
}

export async function saveExecutionVisits(payload,{user,database=db}) {
  const projectId=String(payload.projectId||'').trim();
  requireProject(user,projectId,{write:true,admin:true});
  const clean=cleanVisitPlans(payload.rows);
  return database.transaction(async tx=>{
    await checkProjectRead(tx,user,projectId);
    await writeVisitPlans(tx,projectId,clean,{user,initializeOnly:payload.initializeOnly});
    return executionVisits(tx,projectId);
  });
}
