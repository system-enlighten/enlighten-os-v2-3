import {randomUUID} from 'node:crypto';
import {db} from './supabase-db.js';
import {requireAdmin,requireStudio,wihProjectRole,isSystemAdmin} from './permissions.js';
import {active,failure,text} from './project-write-storage.js';

const tables=new Set(['internal_work_areas','assistant_profiles','design_tasks','wih','people','studio_briefings']);
export async function studioRows(tx,table) {
  if (!tables.has(table)) throw Error('Unknown studio table.');
  return tx.rows('SELECT record_id,cells FROM enlighten_operational.'+table+' ORDER BY source_row_number NULLS LAST,record_id');
}
export async function saveStudioRecord(tx,table,existing,row) {
  if (!tables.has(table)) throw Error('Unknown studio table.');
  if (existing) await tx.query('UPDATE enlighten_operational.'+table+' SET cells=cells||$1::jsonb,updated_at=clock_timestamp() WHERE record_id=$2',
    [JSON.stringify(row),existing.record_id]);
  else await tx.query('INSERT INTO enlighten_operational.'+table+' (cells) VALUES ($1::jsonb)',[JSON.stringify(row)]);
}
export function studioMember(user) {
  requireStudio(user);
  if (!user.userId) throw failure('Team member account required.',403);
  return String(user.userId);
}
export async function internalAreaRows(tx) {
  const areas=new Map([
    ['__internal_os__','Enlighten OS Development'],['__internal_center__','Narayana Experience Center'],
    ['__internal_ops__','Studio Operations'],['__admin_work__','Legacy admin work']
  ].map(([id,name])=>[id,{id,name,active:id!=='__admin_work__'}]));
  for (const {cells} of await studioRows(tx,'internal_work_areas')) {
    areas.set(String(cells.id),{id:String(cells.id),name:String(cells.name),active:active(cells.active)});
  }
  if (!areas.has('__internal_discussion__')&&![...areas.values()].some(row=>text(row.name).toLowerCase()==='discussion')) {
    areas.set('__internal_discussion__',{id:'__internal_discussion__',name:'Discussion',active:true});
  }
  return [...areas.values()];
}

export async function assistantProfile(p,{user,database=db}) {
  const userId=studioMember(user);
  if (p.action==='read') {
    const rows=await database.rows("SELECT cells FROM enlighten_operational.assistant_profiles WHERE cells->>'userId'=$1 LIMIT 1",[userId]);
    return {name:text(rows[0]?.cells.name)};
  }
  const name=text(p.name);
  if (p.action!=='save'||!name||name.length>32||/^[=+@-]/.test(name)) throw failure('Enter a valid assistant name up to 32 characters.');
  return database.transaction(async tx=>{
    await tx.query('SELECT pg_advisory_xact_lock(hashtextextended($1,0))',['assistant-profile:'+userId]);
    const rows=await tx.rows("SELECT record_id FROM enlighten_operational.assistant_profiles WHERE cells->>'userId'=$1 LIMIT 2",[userId]);
    if (rows.length>1) throw failure('Assistant profile is duplicated.',409);
    await saveStudioRecord(tx,'assistant_profiles',rows[0],{userId,name});
    return {name};
  });
}

export async function departmentTeam(p,{user,database=db}) {
  const uid=studioMember(user),department=text(p.department),admin=text(user.appAccess).toLowerCase()==='admin';
  if (!['studio','sales','marketing','accounts','legal','hr'].includes(department)||(!isSystemAdmin(user)&&user.departmentKey!==department)) {
    throw failure('Department access required.',403);
  }
  return database.transaction(async tx=>{
    const definitions=await tx.rows("SELECT cells FROM enlighten_operational.departments WHERE cells->>'masterId' LIKE 'WS-%'");
    const names=new Map(definitions.map(({cells})=>[text(cells.name).toLowerCase(),String(cells.masterId).slice(3)]));
    const people=(await studioRows(tx,'people')).map(row=>row.cells).filter(row=>active(row.active)&&assignedDepartment(row.department,names)===department)
      .map(row=>({id:String(row.userId),name:row.name,role:row.role}));
    const ids=new Set(people.map(row=>row.id));
    const tasks=(await studioRows(tx,'design_tasks')).map(row=>row.cells).filter(row=>ids.has(String(row.assigneeUserId))&&
      (String(row.assigneeUserId)===uid||admin&&wihProjectRole(user,row.projectId)))
      .map(row=>({id:row.designTaskId,title:row.taskType,status:row.status}));
    return {people,tasks};
  },{readOnly:true});
}

export function discussionLogs(rows) {
  const groups=new Map();
  for (const row of rows) {
    if (!row.areaId||row.openUserId||!row.end) continue;
    const id=String(row.discussionId||row.id);
    if (!groups.has(id)) groups.set(id,{id,projectId:String(row.areaId),start:row.start,end:row.end,participants:new Set(),notes:new Set()});
    const group=groups.get(id);
    if (Date.parse(row.start)<Date.parse(group.start)) group.start=row.start;
    if (Date.parse(row.end)>Date.parse(group.end)) group.end=row.end;
    for (const uid of JSON.parse(row.participantIds||'[]')) group.participants.add(String(uid));
    if (row.narration) group.notes.add(String(row.narration));
  }
  return [...groups.values()].map(group=>({...group,narration:[...group.notes].join('\n\n')}));
}

export async function internalAreas(p,{user,database=db}) {
  const uid=studioMember(user),admin=text(user.appAccess).toLowerCase()==='admin';
  if (!['list','save','review'].includes(p.action)) throw failure('Unknown internal work action.');
  if (p.action==='save') requireAdmin(user);
  return database.transaction(async tx=>{
    if (p.action==='save') await tx.query("SELECT pg_advisory_xact_lock(hashtext('enlighten_internal_areas'))");
    const areas=await internalAreaRows(tx);
    if (p.action==='list') return {areas};
    if (p.action==='save') {
      const id=p.id?String(p.id):'__internal_custom_'+randomUUID()+'__',name=text(p.name);
      if (p.id&&!areas.some(area=>area.id===id)) throw failure('Work area not found.',404);
      if (!name||name.length>100||/^[=+@-]/.test(name)||typeof p.active!=='boolean') throw failure('Enter a valid work area name.');
      if (areas.some(area=>area.id!==id&&text(area.name).toLowerCase()===name.toLowerCase())) throw failure('That work area name already exists.',409);
      const existing=(await studioRows(tx,'internal_work_areas')).find(row=>String(row.cells.id)===id);
      const row={id,name,active:p.active};
      await saveStudioRecord(tx,'internal_work_areas',existing,row);
      return row;
    }
    const ids=new Set(areas.map(area=>area.id));
    const timers=new Map((await studioRows(tx,'wih')).map(row=>row.cells).filter(row=>ids.has(String(row.projectId))&&
      (admin||String(row.assigneeUserId)===uid)).map(row=>[String(row.designTaskId),row]));
    const tasks=(await studioRows(tx,'design_tasks')).map(row=>row.cells).flatMap(task=>{
      const timer=timers.get(String(task.designTaskId));
      if (!timer||String(timer.projectId)!==String(task.projectId)) return [];
      return [{id:task.designTaskId,projectId:task.projectId,title:task.taskType,narration:task.remarks,
        activity:task.taskCategory==='Meeting / Discussion'?'Meeting / Discussion':'Work',owner:timer.assigneeName,
        status:timer.status,minutes:Number(timer.totalMinutes)||0}];
    }).reverse();
    const people=new Map((await studioRows(tx,'people')).map(row=>row.cells)
      .filter(row=>row.userId&&active(row.active)&&/^(admin|user|viewer)$/i.test(text(row.appAccess)||'User'))
      .map(row=>[String(row.userId),text(row.name)||String(row.userId)]));
    const discussions=discussionLogs((await studioRows(tx,'studio_briefings')).map(row=>row.cells)).reverse().flatMap(log=>
      [...log.participants].filter(person=>admin||person===uid).map(person=>({id:'discussion:'+log.id+':'+person,projectId:log.projectId,
        title:'Discussion',narration:log.narration,activity:'Meeting / Discussion',owner:people.get(person)||person,status:'Completed',
        minutes:Math.max(0,Math.round((Date.parse(log.end)-Date.parse(log.start))/60000)||0)})));
    return {areas,tasks:[...discussions,...tasks]};
  },{readOnly:p.action!=='save'});
}

export function assignedDepartment(value,definitions) {
  const label=text(value).toLowerCase();
  return definitions.get(label)||(/account|finance/.test(label)?'accounts':/legal|contract/.test(label)?'legal':
    /marketing|showcase/.test(label)?'marketing':/\bhr\b|human resources|team building/.test(label)?'hr':
    /sales|business development/.test(label)?'sales':'studio');
}
