import {db} from './supabase-db.js';
import {isSystemAdmin,requireAdmin,requireStudio} from './permissions.js';
import {resolveLine} from './drawing-classification.js';
import {active,failure} from './project-write-storage.js';

export async function getTeamsTasksScope(_p,{user,database=db}) {
  requireStudio(user);
  const all=isSystemAdmin(user),ids=Object.entries(user.projectRoles||{}).filter(([,role])=>role==='Admin').map(([id])=>id);
  if (String(user.appAccess).toLowerCase()==='viewer'||!all&&!ids.length) throw failure('Project Admin access required.',403);
  return database.transaction(async tx=>{
    const rows=(await tx.rows(`SELECT cells FROM enlighten_operational.projects
      WHERE ($1::boolean OR cells->>'projectId'=ANY($2::text[])) ORDER BY source_row_number NULLS LAST,record_id`,[all,ids])).map(row=>row.cells);
    const projects=rows.map(row=>({projectId:String(row.projectId),projectNo:row.projectNo,projectName:row.projectName}));
    const allowed=projects.map(row=>row.projectId);
    const scopes=(await tx.rows("SELECT cells FROM enlighten_operational.project_roles WHERE cells->>'projectId'=ANY($1::text[])",
      [allowed])).map(row=>row.cells).filter(row=>active(row.active));
    const members=[...new Set(scopes.map(row=>String(row.userId)))];
    const people=(await tx.rows("SELECT cells FROM enlighten_operational.people WHERE ($1::boolean OR cells->>'userId'=ANY($2::text[]))",
      [all,members])).map(row=>row.cells).filter(row=>active(row.active))
      .map(row=>({userId:String(row.userId),name:row.name,role:row.role,department:row.department}));
    const rules=(await tx.rows("SELECT cells FROM enlighten_operational.workflow_delegations WHERE cells->>'projectId'='*' OR cells->>'projectId'=ANY($1::text[])",
      [allowed])).map(row=>row.cells);
    const tasks=(await tx.rows(`SELECT cells FROM enlighten_operational.line_of_work WHERE cells->>'projectId'=ANY($1::text[])
      ORDER BY source_row_number NULLS LAST,record_id`,[allowed])).map(row=>row.cells).filter(row=>active(row.active))
      .map(row=>resolveLine(row,String(row.projectId),rules)).map(row=>({projectId:String(row.projectId),tasks:row.tasks,subtask:row.subtask,responsible:row.responsible}));
    return {projects,people,tasks,roles:scopes.map(row=>({projectId:String(row.projectId),userId:String(row.userId),projectRole:row.projectRole}))};
  },{readOnly:true});
}

export function getProductImportAccess(_p,{user}) {
  requireAdmin(user);
  return {allowed:true};
}

export function operationalHealth() {
  return {service:'enLIGHTen OS PostgreSQL API',version:'2.44.1',signedLoginRequired:true};
}
