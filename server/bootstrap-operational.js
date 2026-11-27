// Operational Preview reader. No production routing or persistent business writes.
// server/bootstrap.js — read-only imported snapshot, Preview system admin only.
// Call after Google/session verification and operational identity resolution.
import { db } from './supabase-db.js';
import {isSystemAdmin,requireAdmin,requireStudio,visibleProjectIds} from './permissions.js';
const norm=v=>String(v||'').trim().toLowerCase();
const bool=v=>typeof v==='boolean'?v:['true','yes','1','y'].includes(norm(v))?true:['false','no','0','n',''].includes(norm(v))?false:Boolean(v);
const key=(a,b)=>JSON.stringify([norm(a),norm(b)]);
const tables=['projects','project_contacts','line_of_work','floor_zones','people','workflow_delegations','departments','designations','drawing_task_master','drawing_register','files','project_meetings'];
function guard(user,exportId){
  if(process.env.VERCEL_ENV!=='preview'||process.env.SUPABASE_OPERATIONAL_ACCESS!=='1')throw Error('Snapshot reads disabled');
  const ids=visibleProjectIds(user);
  if(exportId !== 'operational')throw Error('Explicit export ID required');
  return ids;
}
async function read(tx,table,id){
  if(!tables.includes(table))throw Error('Unsupported table');
  const rows=await tx.rows(`SELECT cells FROM enlighten_operational."${table}" WHERE ($1::text = $$operational$$) ORDER BY source_row_number,record_id`,[id]);
  return rows.map(({cells})=>{if(!cells||typeof cells!=='object'||Array.isArray(cells))throw Error('Invalid imported row');return cells;});
}
function contactStaff(c,people){
  if(!['principal lighting designer','lighting designer','lighting engineer','process coordinator'].includes(norm(c.role)))return '';
  const staff=people.filter(p=>p.userId&&bool(p.active)&&['admin','user','viewer'].includes(norm(p.appAccess||'User')));
  const matches=staff.filter(p=>norm(c.email)?norm(p.email)===norm(c.email):c.staffUserId?String(p.userId)===String(c.staffUserId):norm(p.name)===norm(c.name));
  return matches.length===1?matches[0].userId:'';
}
function delegate(row,rules){
  const k=key(row.tasks,row.subtask),project=rules.find(r=>String(r.projectId)===String(row.projectId)&&key(r.task,r.subtask)===k),base=rules.find(r=>r.projectId==='*'&&key(r.task,r.subtask)===k),raw=String(row.responsible||'').trim();
  const rule=project?.responsibleId?project:project||!raw?base:null;
  const value=rule?String(rule.responsibleName||''):raw;
  return {...row,responsible:value,delegationSource:project?.responsibleId?'project':project||!raw?(base?'default':'none'):'project',delegationValue:value,delegationRawResponsible:raw};
}
function departments(rows){
  const builtins=[['studio','Studio · Operations'],['sales','Business Development & Sales'],['marketing','Marketing · Document & Showcase'],['accounts','Accounts'],['legal','Legal & Contracts'],['hr','HR & Team Building']];
  return [...builtins.map(([k,name])=>rows.find(r=>r.masterId==='WS-'+k)||{masterId:'WS-'+k,name,active:true}),...rows.filter(r=>!String(r.masterId).startsWith('WS-')&&!/^[tuace]$/i.test(String(r.name).trim())&&!builtins.some(([,n])=>norm(n)===norm(r.name)))];
}
function drawingMaster(rows){
  const by=new Map();
  for(const r of rows){const id=String(r.drawingTypeId||'').trim(),name=String(r.drawingType||'').trim();if(!name)continue;const k=id||name;if(!by.has(k))by.set(k,{drawingTypeId:id,drawingType:name,sequence:Number(r.drawingSequence||999),active:bool(r.active),tasks:[]});if(String(r.taskTitle||'').trim())by.get(k).tasks.push({taskId:String(r.taskId||''),title:String(r.taskTitle).trim(),sequence:Number(r.taskSequence||999),assignee:String(r.defaultAssignee||'').trim()});}
  return [...by.values()].map(t=>({...t,tasks:t.tasks.sort((a,b)=>a.sequence-b.sequence)})).sort((a,b)=>a.sequence-b.sequence);
}
export async function listDepartments(_payload,{user,database=db}) {
  requireAdmin(user);
  return departments(await read(database,'departments','operational'));
}
export async function listDesignations(_payload,{user,database=db}) {
  requireAdmin(user);
  return read(database,'designations','operational');
}
export async function listDrawingTaskMaster(_payload,{user,database=db}) {
  requireStudio(user);
  return drawingMaster(await read(database,'drawing_task_master','operational'));
}
export function getWorkflowCapabilities(_payload,{user}) {
  requireStudio(user);
  return {areaWorkflowVersion:1,designFlowVersion:2,floorGantt:true,sharedStageMeetings:true,orderedSubtasks:true,
    multiFloorCoverage:true,multiFloorUpload:true};
}
export async function getBootstrap(payload={}, {user,exportId,database=db}={}){
  const allowedIds=guard(user,exportId);
  return database.transaction(async tx=>{
    const load=t=>read(tx,t,exportId);
    const [projects,contacts,workflow,zones,people,rules]=await Promise.all(tables.slice(0,6).map(load));
    const ids=new Set(projects.map(r=>r.projectId));if(!projects.length||ids.size!==projects.length||projects.some(r=>!r.projectId))throw Error('Invalid project snapshot');
    const activeOnly=String(payload.activeOnly||'true')!=='false';
    const allowed=row=>allowedIds===null||allowedIds.includes(String(row.projectId));
    let staff=people;
    if (!isSystemAdmin(user)) {
      const managed=norm(user.appAccess)==='viewer'?[]:Object.keys(user.projectRoles).filter(id=>user.projectRoles[id]==='Admin');
      const memberships=await tx.rows("SELECT cells FROM enlighten_operational.project_roles WHERE cells->>'projectId'=ANY($1::text[])",[managed]);
      const staffIds=new Set(memberships.filter(({cells})=>bool(cells.active)).map(({cells})=>String(cells.userId)));
      staff=people.filter(row=>staffIds.has(String(row.userId))).map(({userId,name,role,department,active})=>({userId,name,role,department,active}));
    }
    const result={projects:projects.filter(r=>allowed(r)&&(!activeOnly||(!bool(r.completed)&&norm(r.projectStatus)!=='completed'))),projectContacts:contacts.filter(r=>allowed(r)&&bool(r.active)).map(r=>({...r,staffUserId:contactStaff(r,people)})),lineOfWork:workflow.filter(r=>allowed(r)&&bool(r.active)).map(r=>delegate(r,rules)).sort((a,b)=>Number(a.seq||a.sourceRow||0)-Number(b.seq||b.sourceRow||0)),floorZones:zones.filter(r=>allowed(r)&&bool(r.active)).sort((a,b)=>Number(a.seq||0)-Number(b.seq||0)),people:staff.filter(r=>bool(r.active)),serverTime:new Date().toISOString()};
    if(payload.includeMaster===true||norm(payload.includeMaster)==='true'){
      const [d,s,m]=await Promise.all(['departments','designations','drawing_task_master'].map(load));
      if(!s.length||!m.length)throw Error('Missing master snapshot; do not initialize from preview');
      Object.assign(result,{departments:departments(d),designations:s,drawingTaskMaster:drawingMaster(m)});
    }
    return result;
  },{readOnly:true});
}
export async function getProjectWorkspace({user,exportId,database=db}={}){
  const allowedIds=guard(user,exportId);
  return database.transaction(async tx=>{
    const [drawings,files,meetings]=await Promise.all(['drawing_register','files','project_meetings'].map(t=>read(tx,t,exportId)));
    const allowed=row=>allowedIds===null||allowedIds.includes(String(row.projectId));
    const visibleMeetings=meetings.filter(allowed);
    return {drawings:drawings.filter(r=>allowed(r)&&!bool(r.trashed)),files:files.filter(r=>allowed(r)&&!bool(r.trashed)&&norm(r.direction)==='received'),meetings:visibleMeetings.filter(r=>bool(r.active)),meetingIds:visibleMeetings.map(r=>r.id)};
  },{readOnly:true});
}
