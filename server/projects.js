// server/projects.js — Preview snapshot reads and isolated project update rehearsal.
// Not a production replacement. Never route live project mutations here.
import { db } from './supabase-db.js';
import { requireSystemAdmin } from './permissions.js';
const norm = v => String(v ?? '').trim().toLowerCase();
const completed = r => r.completed === true || ['true','yes','1'].includes(norm(r.completed)) || norm(r.projectStatus)==='completed';
function guard(user, exportId) {
  if (process.env.VERCEL_ENV !== 'preview' || process.env.SUPABASE_IMPORTED_PROJECT_READS !== '1') throw Error('Preview only');
  requireSystemAdmin(user);
  if (typeof exportId !== 'string' || !exportId.trim()) throw Error('Explicit export ID required');
}
function outcome(v) {
  const s=String(v ?? '').trim();
  if (!['','survived','not_survived'].includes(s)) throw Error('Invalid completionOutcome');
  return s;
}
function today(now) {
  const parts=new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now);
  const get=k=>parts.find(p=>p.type===k).value;
  return `${get('year')}-${get('month')}-${get('day')}`;
}
export async function listProjects(payload={}, {user,exportId,database=db}={}) {
  guard(user,exportId);
  const rows=await database.rows('SELECT cells FROM enlighten_import.projects WHERE export_id=$1 ORDER BY source_row_number,import_id',[exportId]);
  const projects=rows.map(r=>r.cells);
  if (!projects.length || projects.some(r=>!r?.projectId) || new Set(projects.map(r=>r.projectId)).size!==projects.length) throw Error('Invalid project snapshot');
  return norm(payload.activeOnly)==='true'?projects.filter(r=>!completed(r)):projects;
}
// Pure transformation of a project row; does not persist or authorize a request.
// Only status/outcome fields are migrated here. Other edits fail closed.
export function projectStatusPatch(old,payload,actor,now=new Date()) {
  if (!old?.projectId || payload.projectId!==old.projectId || !actor) throw Error('Invalid project or actor');
  if (Object.keys(payload).some(k=>!['projectId','projectStatus','completionOutcome'].includes(k))) throw Error('Unmigrated project fields');
  const patch={updatedAt:now.toISOString(),updatedBy:actor};
  if (Object.hasOwn(payload,'completionOutcome')) patch.completionOutcome=outcome(payload.completionOutcome);
  if (Object.hasOwn(payload,'projectStatus')) {
    if (!['Ongoing','Completed'].includes(payload.projectStatus)) throw Error('Unsupported status');
    patch.projectStatus=payload.projectStatus;
    patch.completed=payload.projectStatus==='Completed';
    patch.completedDate=patch.completed?(old.completedDate||today(now)):'';
    if (!patch.completed) patch.completionOutcome='';
  }
  return {...old,...patch};
}
// Read-only rehearsal: return a proposed change without touching any database row.
export async function previewProjectStatus(payload,{user,exportId,database=db}={}) {
  guard(user,exportId);
  const rows=await database.rows("SELECT cells FROM enlighten_import.projects WHERE export_id=$1 AND cells->>'projectId'=$2 LIMIT 2",[exportId,payload.projectId]);
  if(rows.length!==1) throw Error('Project not uniquely found');
  return {persisted:false,project:projectStatusPatch(rows[0].cells,payload,user.email)};
}
// Creation requires Drive folder provisioning, contact saving and activity logging.
// Deletion requires linked contacts, workflow, zones and activity logging.
// Neither is implemented here. Do not silently fall back to Sheets for writes.
