// server/permissions.js — preview-only permission primitives.
// Never authorize production requests from an imported snapshot.
// identity MUST come from the existing verified Google/session middleware.
import { db } from './supabase-db.js';
const email = v => String(v || '').trim().toLowerCase();
const active = v => v === true || ['true','yes','1','y'].includes(String(v ?? '').trim().toLowerCase());
const deny = message => Object.assign(new Error(message), {statusCode:403});
export function projectRoleMap(rows, userId) {
  const roles = Object.create(null);
  if (!userId) return roles;
  for (const r of rows) {
    if (String(r.userId) !== userId || !active(r.active) || !['Admin','User'].includes(r.projectRole) || !r.projectId) continue;
    const id = String(r.projectId);
    roles[id] = roles[id] && roles[id] !== r.projectRole ? 'User' : r.projectRole;
  }
  return roles;
}
export function requireStudio(user) {
  if (!user?.authorized || !user.active || !['admin','user','viewer'].includes(email(user.appAccess))) throw deny('Active studio access required.');
  return user;
}
export function projectRoleFor(user, projectId) {
  requireStudio(user);
  if (!projectId) return '';
  if (email(user.appAccess) === 'admin') return 'Admin';
  const role = Object.hasOwn(user.projectRoles || {}, String(projectId)) ? user.projectRoles[projectId] : '';
  if (!['Admin','User'].includes(role)) return '';
  return email(user.appAccess) === 'viewer' ? 'User' : role;
}
export function requireAdmin(user) {
  requireStudio(user);
  if (email(user.appAccess) !== 'admin') throw deny('Admin access required.');
  return user;
}
export function requireSystemAdmin(user) {
  requireAdmin(user);
  if (email(user.email) !== 'system.enlighten@gmail.com') throw deny('System administrator required.');
  return user;
}
export function requireProject(user, projectId, {write=false, admin=false} = {}) {
  const role = projectRoleFor(user, projectId);
  if (!role || (admin && role !== 'Admin')) throw deny('Project access required.');
  if ((write || admin) && email(user.appAccess) === 'viewer') throw deny('View only access.');
  return role;
}
// Caller must additionally verify that the project exists and that any resource belongs to it.
export function requireAssignedTask(user, task, wih, {assign=false} = {}) {
  if (!task?.designTaskId || task.mergedIntoTaskId) throw deny('Task unavailable.');
  const role = requireProject(user, task.projectId, {write:true,admin:assign});
  if (role !== 'Admin' && (!user.userId || !wih || String(wih.designTaskId) !== String(task.designTaskId) || String(task.assigneeUserId) !== user.userId || String(wih.assigneeUserId) !== user.userId)) throw deny('You can update only your assigned WIH tasks.');
  return user;
}
// Snapshot inspection only. No first-login binding, contractor portal or department routing.
export async function loadPreviewUser(identity, {exportId, database=db} = {}) {
  if (process.env.VERCEL_ENV !== 'preview') throw deny('Snapshot permissions are preview only.');
  if (!identity?.email || !identity?.sub || !exportId) throw deny('Verified identity and export ID required.');
  return database.transaction(async tx => {
    const members = await tx.rows(`SELECT cells FROM enlighten_import.people WHERE export_id=$1 AND lower(btrim(cells->>'email'))=$2 LIMIT 2`, [exportId,email(identity.email)]);
    if (members.length !== 1) throw deny('Account not uniquely registered.');
    const m = members[0].cells;
    if (!active(m.active) || !m.userId || !m.googleSubject || String(m.googleSubject) !== String(identity.sub)) throw deny('Inactive or unbound Google account.');
    const appAccess = String(m.appAccess || 'User').trim();
    if (!['admin','user','viewer'].includes(email(appAccess))) throw deny('No studio access.');
    const roles = await tx.rows(`SELECT cells FROM enlighten_import.project_roles WHERE export_id=$1 AND cells->>'userId'=$2`, [exportId,String(m.userId)]);
    return {authenticated:true,authorized:true,active:true,email:email(identity.email),googleSubject:String(identity.sub),userId:String(m.userId),name:String(m.name||''),role:String(m.role||''),department:String(m.department||''),appAccess,projectRoles:projectRoleMap(roles.map(r=>r.cells),String(m.userId)),permissions:email(appAccess)==='admin'?{projects:'edit',wih:'all'}:email(appAccess)==='user'?{projects:'view',wih:'own-edit'}:{projects:'view',wih:'own-view'}};
  }, {readOnly:true});
}
// No generic action authorization: unmigrated actions must retain existing authorization.

// Operational authorization remains administrator-only during migration.
// liveUser must be obtained server-side from the existing getCurrentUser action.
// Never accept identity or liveUser from request payloads.
export async function loadOperationalUser(identity, {liveUser, database=db} = {}) {
  if (process.env.VERCEL_ENV !== 'preview' || process.env.SUPABASE_OPERATIONAL_ACCESS !== '1') throw deny('Operational access disabled.');
  const address = email(identity?.email);
  if (!address || !identity?.sub || address !== email(process.env.MIGRATION_ADMIN_EMAIL)) throw deny('Migration administrator required.');
  requireSystemAdmin(liveUser);
  if (email(liveUser.email) !== address || !liveUser.userId) throw deny('Live identity mismatch.');
  return database.transaction(async tx => {
    const members = await tx.rows(`SELECT cells FROM enlighten_operational.people WHERE lower(btrim(cells->>'email'))=$1 LIMIT 2`, [address]);
    if (members.length !== 1) throw deny('Operational account not uniquely registered.');
    const m = members[0].cells;
    if (!active(m.active) || !m.userId || String(m.userId) !== String(liveUser.userId) || !m.googleSubject || String(m.googleSubject) !== String(identity.sub) || email(m.appAccess) !== 'admin') throw deny('Operational identity or access mismatch.');
    const roles = await tx.rows(`SELECT cells FROM enlighten_operational.project_roles WHERE cells->>'userId'=$1`, [String(m.userId)]);
    const user = {authenticated:true,authorized:true,active:true,email:address,googleSubject:String(identity.sub),userId:String(m.userId),name:String(m.name||''),role:String(m.role||''),department:String(m.department||''),appAccess:'Admin',projectRoles:projectRoleMap(roles.map(r=>r.cells),String(m.userId)),permissions:{projects:'edit',wih:'all'}};
    return requireSystemAdmin(user);
  }, {readOnly:true});
}
