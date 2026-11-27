import {db} from './supabase-db.js';
import {requireSystemAdmin} from './permissions.js';
import {listDepartments,listDrawingTaskMaster} from './bootstrap-operational.js';
import {active,failure,now,text} from './project-write-storage.js';

const known=new Set(['people','departments','designations','drawing_task_master']);
const tableName=table=>{
  if (!known.has(table)) throw Error('Unknown team table.');
  return 'enlighten_operational.'+table;
};
async function put(tx,table,prior,item) {
  const name=tableName(table);
  if (prior) await tx.query('UPDATE '+name+' SET cells=cells||$1::jsonb,updated_at=clock_timestamp() WHERE record_id=$2',
    [JSON.stringify(item),prior.record_id]);
  else await tx.query('INSERT INTO '+name+' (cells) VALUES ($1::jsonb)',[JSON.stringify(item)]);
}
const load=(tx,table)=>tx.rows('SELECT record_id,cells FROM '+tableName(table)+' ORDER BY source_row_number NULLS LAST,record_id');
const enabled=value=>value!==false&&text(value).toLowerCase()!=='false';
const lower=value=>text(value).toLowerCase();
const numericId=(rows,key,prefix,width)=>{
  const highest=rows.reduce((value,row)=>Math.max(value,Number(text(row.cells[key]).replace(/\D/g,''))||0),0);
  return prefix+'-'+String(highest+1).padStart(width,'0');
};
async function settings(database,user,run) {
  requireSystemAdmin(user);
  return database.transaction(async tx=>{
    await tx.query("SELECT pg_advisory_xact_lock(hashtext('enlighten_team_settings'))");
    return run(tx);
  });
}

export async function saveTeamMember(p,{user,database=db}) {
  return settings(database,user,async tx=>{
    const rows=await load(tx,'people');
    let userId=text(p.userId);
    if (!userId) {
      const first=Number(numericId(rows,'userId','USR',4).slice(4));
      const [counter]=await tx.rows(`INSERT INTO enlighten_operational.project_entity_sequences AS seq (entity,value)
        VALUES ('team_members',$1) ON CONFLICT (entity) DO UPDATE SET value=greatest(seq.value+1,excluded.value) RETURNING value`,[first]);
      userId='USR-'+String(counter.value).padStart(4,'0');
    }
    const previous=rows.find(row=>String(row.cells.userId)===userId);
    const reportingUserId=text(p.reportingUserId??previous?.cells.reportingUserId);
    const chain=new Set([userId]);
    let manager=reportingUserId;
    while (manager) {
      if (chain.has(manager)) throw failure('Reporting relationships cannot form a loop.',409);
      chain.add(manager);
      const match=rows.find(row=>String(row.cells.userId)===manager)?.cells;
      if (!match||!active(match.active)) throw failure('Choose an active reporting person.');
      manager=text(match.reportingUserId);
    }
    const updatedAt=now();
    const member={reportingUserId,userId,name:text(p.name),email:text(p.email),mobile:text(p.mobile),role:text(p.role),
      department:text(p.department),active:enabled(p.active),appAccess:text(p.appAccess)||'User',driveEmail:text(p.driveEmail),
      createdAt:previous?.cells.createdAt||updatedAt,updatedAt};
    if (!member.name) throw failure('Team member name is required.');
    if (member.email&&rows.some(row=>row!==previous&&lower(row.cells.email)===lower(member.email))) throw failure('This email is already assigned.',409);
    const identityPatch=previous&&lower(previous.cells.email)!==lower(member.email)?{googleSubject:''}:{};
    await put(tx,'people',previous,{...member,...identityPatch});
    return {member};
  });
}

export async function deleteTeamMember(p,{user,database=db}) {
  const userId=text(p.userId);
  if (!userId) throw failure('Missing userId.');
  return settings(database,user,async tx=>{
    const people=await load(tx,'people');
    const previous=people.find(row=>String(row.cells.userId)===userId);
    if (!previous) throw failure('Team member not found.',404);
    if (userId===String(user.userId)) throw failure('The system administrator cannot remove their own account.',409);
    if (people.some(row=>String(row.cells.reportingUserId)===userId)) throw failure('Reassign employees reporting to this person first.',409);
    await tx.query('DELETE FROM enlighten_operational.people WHERE record_id=$1',[previous.record_id]);
    await tx.query(`UPDATE enlighten_operational.project_roles SET cells=cells||'{"active":false}'::jsonb,updated_at=clock_timestamp()
      WHERE cells->>'userId'=$1`,[userId]);
    return {deleted:true,userId};
  });
}

async function saveMaster(p,{user,database=db},kind) {
  const department=kind==='department',table=department?'departments':'designations';
  const name=text(p.name);
  if (!name) throw failure('Name is required.');
  return settings(database,user,async tx=>{
    const rows=await load(tx,table),masterId=text(p.masterId)||numericId(rows,'masterId',department?'DEP':'ROL',3);
    const previous=rows.find(row=>String(row.cells.masterId)===masterId);
    const all=department?await listDepartments({}, {user,database:tx}):rows.map(row=>row.cells);
    if (department&&all.some(row=>String(row.masterId)!==masterId&&lower(row.name)===lower(name))) {
      throw failure('That department name already exists.',409);
    }
    const oldName=text(all.find(row=>String(row.masterId)===masterId)?.name),updatedAt=now();
    const item={masterId,name,active:enabled(p.active),createdAt:previous?.cells.createdAt||updatedAt,updatedAt};
    await put(tx,table,previous,item);
    if (oldName&&oldName!==name) {
      const field=department?'department':'role';
      await tx.query(`UPDATE enlighten_operational.people SET cells=cells||jsonb_build_object($1::text,$2::text,'updatedAt',$3::text),
        updated_at=clock_timestamp() WHERE cells->>$1=$4`,[field,name,updatedAt,oldName]);
    }
    return {item,oldName};
  });
}
export const saveDepartment=(p,context)=>saveMaster(p,context,'department');
export const saveDesignation=(p,context)=>saveMaster(p,context,'designation');

export async function deleteDepartment(p,{user,database=db}) {
  const id=text(p.masterId);
  if (!id||/^WS-/i.test(id)) throw failure('Built-in departments cannot be deleted.');
  return settings(database,user,async tx=>{
    const target=(await load(tx,'departments')).find(row=>String(row.cells.masterId)===id);
    if (!target) throw failure('Department not found.',404);
    if ((await load(tx,'people')).some(row=>lower(row.cells.department)===lower(target.cells.name))) {
      throw failure('Reassign employees in this department before deleting it.',409);
    }
    await tx.query('DELETE FROM enlighten_operational.departments WHERE record_id=$1',[target.record_id]);
    return {departments:await listDepartments({}, {user,database:tx})};
  });
}

export async function saveDrawingTaskMaster(p,{user,database=db}) {
  if (!Array.isArray(p.templates)||!p.templates.length) throw failure('At least one drawing type is required.');
  return settings(database,user,async tx=>{
    const rows=p.templates.flatMap((template,index)=>{
      const drawingType=text(template.drawingType);
      if (!drawingType) return [];
      const seq=String(index+1).padStart(3,'0');
      const common={drawingTypeId:text(template.drawingTypeId)||'DT-'+seq,drawingType,drawingSequence:index+1,active:template.active!==false};
      const tasks=Array.isArray(template.tasks)?template.tasks:[];
      if (!tasks.length) return [{...common,taskId:'',taskTitle:'',taskSequence:'',defaultAssignee:''}];
      return tasks.map((task,position)=>({...common,taskId:text(task.taskId)||'TSK-'+seq+'-'+String(position+1).padStart(2,'0'),
        taskTitle:text(task.title),taskSequence:position+1,defaultAssignee:text(task.assignee)}));
    });
    if (!rows.length) throw failure('At least one drawing type is required.');
    await tx.query('DELETE FROM enlighten_operational.drawing_task_master');
    await tx.query('INSERT INTO enlighten_operational.drawing_task_master (cells) SELECT value FROM jsonb_array_elements($1::jsonb)',[JSON.stringify(rows)]);
    return {templates:await listDrawingTaskMaster({}, {user,database:tx})};
  });
}
