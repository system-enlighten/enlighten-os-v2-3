import {db} from './supabase-db.js';
import {requireSystemAdmin} from './permissions.js';

const invalid = message => Object.assign(new Error(message),{statusCode:400});
const active = value => !['false','no','0','n',''].includes(String(value ?? '').trim().toLowerCase());
const rolesSql = 'SELECT record_id,cells FROM enlighten_operational.project_roles';

async function matches(tx,projectId,userId) {
  return tx.rows(rolesSql+` WHERE cells->>'projectId'=$1 AND cells->>'userId'=$2
    ORDER BY source_row_number NULLS LAST,record_id FOR UPDATE`,[projectId,userId]);
}

async function patch(tx,id,cells) {
  await tx.query('UPDATE enlighten_operational.project_roles SET cells=cells||$1::jsonb,updated_at=clock_timestamp() WHERE record_id=$2::bigint',[JSON.stringify(cells),id]);
}

async function verifyMember(tx,userId,grant) {
  const people=await tx.rows("SELECT cells FROM enlighten_operational.people WHERE cells->>'userId'=$1 LIMIT 2 FOR SHARE",[userId]);
  if (people.length!==1) throw invalid('Choose a unique team member.');
  if (grant&&!active(people[0].cells.active)) throw invalid('Activate this team member before granting project access.');
}

async function saveChanges(tx,userId,changes,user,{onlyActive=false}={}) {
  const at=()=>new Date().toISOString();
  const time=at(),actor=user.name||user.email;
  let last;
  for (const change of [...changes].sort((a,b)=>a.projectId.localeCompare(b.projectId))) {
    const {projectId,projectRole}=change;
    if (projectRole) {
      const [project]=await tx.rows("SELECT record_id FROM enlighten_operational.projects WHERE cells->>'projectId'=$1 LIMIT 1 FOR SHARE",[projectId]);
      if (!project) throw invalid('A selected project no longer exists. Refresh the project list.');
    }
    const current=await matches(tx,projectId,userId);
    const inactive={active:false,updatedAt:time,updatedBy:actor};
    if (!projectRole) {
      for (const row of current) {
        if (!onlyActive||active(row.cells.active)) await patch(tx,row.record_id,inactive);
      }
      continue;
    }
    const role={projectId,userId,projectRole,active:true,updatedAt:time,updatedBy:actor};
    if (current.length) {
      await patch(tx,current[0].record_id,role);
      for (const row of current.slice(1)) {
        if (!onlyActive||active(row.cells.active)) await patch(tx,row.record_id,inactive);
      }
    } else await tx.query('INSERT INTO enlighten_operational.project_roles (cells) VALUES ($1::jsonb)',[JSON.stringify(role)]);
    last=role;
  }
  return last;
}

async function audit(tx,user,action,entityId,projectId,newValue) {
  await tx.query('LOCK TABLE enlighten_operational.activity_log IN SHARE ROW EXCLUSIVE MODE');
  const [{next_id:nextId}]=await tx.rows(`SELECT coalesce(max(substring(cells->>'activityId' from '^ACT-([0-9]+)$')::bigint),0)+1 AS next_id
    FROM enlighten_operational.activity_log`);
  const activity={activityId:'ACT-'+String(nextId).padStart(6,'0'),timestamp:new Date().toISOString(),
    userId:user.userId,userName:user.name||user.email,action,entityType:'ProjectRole',entityId,projectId,
    oldValueJson:'',newValueJson:JSON.stringify(newValue),source:'Enlighten OS API'};
  await tx.query('INSERT INTO enlighten_operational.activity_log (cells) VALUES ($1::jsonb)',[JSON.stringify(activity)]);
}

export async function saveProjectRole(payload,{user,database=db}) {
  requireSystemAdmin(user);
  const userId=String(payload.userId||'');
  const projectId=String(payload.projectId||'');
  if (!userId||!projectId||!['Admin','User'].includes(payload.projectRole)) throw invalid('Choose a project, team member and role Admin or User.');
  return database.transaction(async tx=>{
    await tx.query('LOCK TABLE enlighten_operational.project_roles IN SHARE ROW EXCLUSIVE MODE');
    await verifyMember(tx,userId,true);
    const role=await saveChanges(tx,userId,[{projectId,projectRole:payload.projectRole}],user);
    await audit(tx,user,'SET_ROLE',userId,projectId,role);
    return role;
  });
}

export async function saveMemberProjectRoles(payload,{user,database=db}) {
  requireSystemAdmin(user);
  const userId=String(payload.userId||'');
  if (!userId) throw invalid('Choose a team member.');
  const input=Array.isArray(payload.changes)?payload.changes:[];
  const projects=new Set();
  const changes=input.map(change=>{
    const projectId=String(change?.projectId||'');
    if (!projectId.trim()||!['Admin','User',''].includes(change?.projectRole)) throw invalid('Choose a project and role Admin or User.');
    if (projects.has(projectId)) throw invalid('Duplicate project in access changes.');
    projects.add(projectId);
    return {projectId,projectRole:change.projectRole};
  });
  return database.transaction(async tx=>{
    await tx.query('LOCK TABLE enlighten_operational.project_roles IN SHARE ROW EXCLUSIVE MODE');
    await verifyMember(tx,userId,changes.some(change=>change.projectRole));
    await saveChanges(tx,userId,changes,user,{onlyActive:true});
    const roles=await tx.rows(rolesSql+" WHERE cells->>'userId'=$1 ORDER BY source_row_number NULLS LAST,record_id",[userId]);
    if (changes.length) await audit(tx,user,'SET_MEMBER_PROJECT_ACCESS',userId,'',{changes});
    return {userId,roles:roles.map(row=>row.cells)};
  });
}

export async function deleteProjectRole(payload,{user,database=db}) {
  requireSystemAdmin(user);
  const userId=String(payload.userId||'');
  const projectId=String(payload.projectId||'');
  if (!userId||!projectId) throw invalid('Choose a project and team member.');
  return database.transaction(async tx=>{
    await tx.query('LOCK TABLE enlighten_operational.project_roles IN SHARE ROW EXCLUSIVE MODE');
    await saveChanges(tx,userId,[{projectId,projectRole:''}],user);
    return {projectId,userId,removed:true};
  });
}
