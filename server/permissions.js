// server/permissions.js — preview-only permission primitives.
// Never authorize production requests from an imported snapshot.
// identity MUST come from the existing verified Google/session middleware.
import { db } from './supabase-db.js';
const email = v => String(v || '').trim().toLowerCase();
const active = v => v === true || ['true','yes','1','y'].includes(String(v ?? '').trim().toLowerCase());
const deny = message => Object.assign(new Error(message), {statusCode:403});
const sheetBoolean = value => {
  const normalized = email(value);
  return ['false','no','0','n',''].includes(normalized) ? false : Boolean(value);
};

function departmentKey(name, departments) {
  const normalized = String(name || '').toLowerCase();
  const department = departments.find(row => String(row.name || '').toLowerCase() === normalized);
  if (String(department?.masterId || '').startsWith('WS-')) return department.masterId.slice(3);
  if (/account|finance/.test(normalized)) return 'accounts';
  if (/legal|contract/.test(normalized)) return 'legal';
  if (/marketing|showcase/.test(normalized)) return 'marketing';
  if (/\bhr\b|human resources|team building/.test(normalized)) return 'hr';
  if (/sales|business development/.test(normalized)) return 'sales';
  return 'studio';
}

export async function loadOperationalIdentity(identity, {database=db, env=process.env} = {}) {
  if (env.VERCEL_ENV !== 'preview' || env.SUPABASE_OPERATIONAL_ACCESS !== '1') throw deny('Operational access disabled.');
  const address = email(identity?.email);
  const subject = String(identity?.sub || '');
  if (!address || !subject) throw deny('Sign in with Google through the application.');
  return database.transaction(async tx => {
    const members = await tx.rows(
      "SELECT record_id, cells FROM enlighten_operational.people WHERE lower(btrim(cells->>'email'))=$1 LIMIT 2 FOR UPDATE",
      [address]
    );
    if (members.length === 0) {
      const grants = await tx.rows(
        `SELECT c.cells, s.cells AS setting FROM enlighten_operational.project_contacts c
         LEFT JOIN LATERAL (
           SELECT a.cells FROM enlighten_operational.drawing_portal_access a
           WHERE a.cells->>'contactId'=c.cells->>'contactId' AND a.cells->>'projectId'=c.cells->>'projectId'
           ORDER BY a.source_row_number NULLS LAST, a.record_id LIMIT 1
         ) s ON true
         WHERE lower(btrim(c.cells->>'email'))=$1
         ORDER BY c.source_row_number NULLS LAST, c.record_id`,
        [address]
      );
      const grant = grants.find(({cells, setting}) => sheetBoolean(cells.active) && (!setting || sheetBoolean(setting.enabled)));
      if (grant) return {authenticated:true,authorized:true,email:address,googleSubject:subject,userId:'portal:'+subject,name:String(grant.cells.name||address),appAccess:'Contractor',projectRoles:{},permissions:{portal:'issued-only'}};
    }
    if (members.length !== 1) throw deny('This Google account is not uniquely registered in Team Master.');
    const {record_id: recordId, cells: member} = members[0];
    if (member.googleSubject && String(member.googleSubject) !== subject) throw deny('Google account identity does not match the registered member.');
    const userId = String(member.userId || '');
    const appAccess = String(member.appAccess || 'User').trim();
    const access = email(appAccess);
    if (!userId || !sheetBoolean(member.active) || !['admin','user','viewer'].includes(access)) {
      throw deny('Your account is inactive or has No Access.');
    }
    if (!member.googleSubject) {
      await tx.query(
        `UPDATE enlighten_operational.people
         SET cells=jsonb_set(cells, '{googleSubject}', to_jsonb($1::text)), updated_at=clock_timestamp()
         WHERE record_id=$2::bigint`,
        [subject, recordId]
      );
    }
    const roles = await tx.rows("SELECT cells FROM enlighten_operational.project_roles WHERE cells->>'userId'=$1", [userId]);
    const departments = await tx.rows("SELECT cells FROM enlighten_operational.departments WHERE lower(cells->>'name')=$1 ORDER BY source_row_number NULLS LAST, record_id", [String(member.department || '').toLowerCase()]);
    return {
      authenticated:true, authorized:true, active:true, email:address, googleSubject:subject, userId,
      name:String(member.name || ''), role:String(member.role || ''), department:String(member.department || ''),
      departmentKey:departmentKey(member.department, departments.map(row => row.cells)),
      canChooseDepartment:access==='admin' && address==='system.enlighten@gmail.com',
      appAccess, projectRoles:projectRoleMap(roles.map(row => row.cells), userId),
      permissions:access==='admin'?{projects:'edit',wih:'all'}:{projects:'view',wih:access==='user'?'own-edit':'own-view'},
      message:'Access granted.'
    };
  });
}

export function projectRoleMap(rows, userId) {
  const roles = Object.create(null);
  if (!userId) return roles;
  for (const r of rows) {
    if (String(r.userId) !== userId || !sheetBoolean(r.active) || !['Admin','User'].includes(r.projectRole) || !r.projectId) continue;
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
export function wihProjectRole(user,projectId) {
  requireStudio(user);
  if (isSystemAdmin(user)) return 'Admin';
  const role=Object.hasOwn(user.projectRoles||{},String(projectId))?email(user.projectRoles[projectId]):'';
  if (!['admin','user'].includes(role)) return email(user.appAccess)==='admin'?'Admin':'';
  return role==='admin'&&email(user.appAccess)!=='viewer'?'Admin':'User';
}
export function requireAdmin(user) {
  requireStudio(user);
  if (email(user.appAccess) !== 'admin') throw deny('Admin access required.');
  return user;
}
export function requireSystemAdmin(user) {
  requireAdmin(user);
  if (!isSystemAdmin(user)) throw deny('System administrator required.');
  return user;
}
export function isSystemAdmin(user) {
  return user?.authorized === true && user.active === true && email(user.appAccess)==='admin' && email(user.email)==='system.enlighten@gmail.com';
}
export function requireAccounts(user, {write=false} = {}) {
  requireStudio(user);
  if (!isSystemAdmin(user) && user.departmentKey!=='accounts') throw deny('Accounts department access required.');
  if (write && email(user.appAccess)==='viewer') throw deny('View only access.');
  return user;
}
export function visibleProjectIds(user) {
  requireStudio(user);
  return email(user.appAccess)==='admin' ? null : Object.keys(user.projectRoles || {});
}
export async function checkProjectRead(tx, user, projectId) {
  if (!projectId) return;
  requireProject(user, projectId);
  const rows = await tx.rows("SELECT 1 FROM enlighten_operational.projects WHERE cells->>'projectId'=$1 LIMIT 1", [projectId]);
  if (!rows.length) throw Object.assign(new Error('Project not found.'), {statusCode:404});
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

// Preview reads require a verified Google identity and a pre-bound operational administrator.
export async function loadOperationalUser(identity, {database=db, env=process.env} = {}) {
  if (env.VERCEL_ENV !== 'preview' || env.SUPABASE_OPERATIONAL_ACCESS !== '1') throw deny('Operational access disabled.');
  const address = email(identity?.email);
  if (!address || !identity?.sub || address !== email(env.MIGRATION_ADMIN_EMAIL) || address !== 'system.enlighten@gmail.com') throw deny('Migration administrator required.');
  return database.transaction(async tx => {
    const members = await tx.rows(`SELECT cells FROM enlighten_operational.people WHERE lower(btrim(cells->>'email'))=$1 LIMIT 2`, [address]);
    if (members.length !== 1) throw deny('Operational account not uniquely registered.');
    const m = members[0].cells;
    if (!active(m.active) || !m.userId || !m.googleSubject || String(m.googleSubject) !== String(identity.sub) || email(m.appAccess) !== 'admin') throw deny('Operational identity or access mismatch.');
    const roles = await tx.rows(`SELECT cells FROM enlighten_operational.project_roles WHERE cells->>'userId'=$1`, [String(m.userId)]);
    const user = {authenticated:true,authorized:true,active:true,email:address,googleSubject:String(identity.sub),userId:String(m.userId),name:String(m.name||''),role:String(m.role||''),department:String(m.department||''),appAccess:'Admin',projectRoles:projectRoleMap(roles.map(r=>r.cells),String(m.userId)),permissions:{projects:'edit',wih:'all'}};
    return requireSystemAdmin(user);
  }, {readOnly:true});
}
