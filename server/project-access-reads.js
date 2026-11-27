import {db} from './supabase-db.js';
import {checkProjectRead,isSystemAdmin,requireAdmin,requireStudio,visibleProjectIds} from './permissions.js';

const active = value => !['false','no','0','n',''].includes(String(value ?? '').trim().toLowerCase());
const projectRolesSql = 'SELECT cells FROM enlighten_operational.project_roles';

export async function listProjectRoles(payload,{user,database=db}) {
  requireStudio(user);
  const projectId=String(payload.projectId||'');
  return database.transaction(async tx=>{
    await checkProjectRead(tx,user,projectId);
    const assigned=String(user.appAccess).toLowerCase()==='viewer'?[]:Object.keys(user.projectRoles).filter(id=>user.projectRoles[id]==='Admin');
    const rows=await tx.rows(projectRolesSql+`
      WHERE ($1='' OR cells->>'projectId'=$1)
        AND ($2::boolean OR cells->>'userId'=$3 OR cells->>'projectId'=ANY($4::text[]))
      ORDER BY source_row_number NULLS LAST,record_id`,[projectId,isSystemAdmin(user),user.userId,assigned]);
    return rows.map(row=>row.cells);
  },{readOnly:true});
}

export async function listProjectPeople(payload,{user,database=db}) {
  const ids=visibleProjectIds(user);
  return database.transaction(async tx=>{
    await checkProjectRead(tx,user,String(payload.projectId||''));
    const roles=await tx.rows(projectRolesSql+" WHERE ($1::text[] IS NULL OR cells->>'projectId'=ANY($1))",[ids]);
    const members=[...new Set(roles.filter(row=>active(row.cells.active)).map(row=>String(row.cells.userId)))];
    const people=await tx.rows("SELECT cells FROM enlighten_operational.people WHERE cells->>'userId'=ANY($1::text[]) ORDER BY source_row_number NULLS LAST,record_id",[members]);
    return people.map(row=>row.cells).filter(person=>active(person.active)).map(({userId,name})=>({userId,name,active:true}));
  },{readOnly:true});
}

export async function listTeamMembers(_payload,{user,database=db}) {
  requireAdmin(user);
  if (isSystemAdmin(user)) {
    return (await database.rows('SELECT cells FROM enlighten_operational.people ORDER BY source_row_number NULLS LAST,record_id')).map(row=>row.cells);
  }
  return database.transaction(async tx=>{
    const managed=Object.keys(user.projectRoles).filter(id=>user.projectRoles[id]==='Admin');
    const roles=await tx.rows(projectRolesSql+" WHERE cells->>'projectId'=ANY($1::text[])",[managed]);
    const ids=[...new Set(roles.filter(row=>active(row.cells.active)).map(row=>String(row.cells.userId)))];
    const members=await tx.rows("SELECT cells FROM enlighten_operational.people WHERE cells->>'userId'=ANY($1::text[]) ORDER BY source_row_number NULLS LAST,record_id",[ids]);
    return members.map(({cells:{userId,name,role,department,active}})=>({userId,name,role,department,active}));
  },{readOnly:true});
}
