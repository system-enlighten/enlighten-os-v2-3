// server/directory.js — read-only Preview snapshot; not production authorization.
import { db } from './supabase-db.js';
import { requireSystemAdmin } from './permissions.js';
const norm = v => String(v ?? '').trim().toLowerCase();
const active = v => v === true || ['true','yes','1','y'].includes(norm(v));
export function resolveContactStaff(contact, people) {
  if (!['principal lighting designer','lighting designer','lighting engineer','process coordinator'].includes(norm(contact.role))) return '';
  const staff = people.filter(p => p.userId && active(p.active) && ['admin','user','viewer'].includes(norm(p.appAccess || 'User')));
  const email = norm(contact.email), id = String(contact.staffUserId || '');
  const matches = staff.filter(p => email ? norm(p.email) === email : id ? String(p.userId) === id : norm(p.name) === norm(contact.name));
  return matches.length === 1 ? matches[0].userId : '';
}
// Caller must first verify Google session and current live Apps Script authorization.
export async function listProjectContacts(payload = {}, {user, exportId, database = db} = {}) {
  if (process.env.VERCEL_ENV !== 'preview' || process.env.SUPABASE_IMPORTED_PROJECT_READS !== '1') throw new Error('Snapshot reads disabled');
  requireSystemAdmin(user);
  if (typeof exportId !== 'string' || !exportId.trim()) throw new Error('Explicit export ID required');
  const projectId = String(payload.projectId || '').trim();
  return database.transaction(async tx => {
    const contacts = await tx.rows(`SELECT cells FROM enlighten_import.project_contacts WHERE export_id=$1 AND ($2='' OR cells->>'projectId'=$2) ORDER BY source_row_number,import_id`, [exportId,projectId]);
    const people = await tx.rows(`SELECT cells FROM enlighten_import.people WHERE export_id=$1 ORDER BY source_row_number,import_id`, [exportId]);
    const staff = people.map(r => r.cells);
    return contacts.map(r => r.cells).filter(r => active(r.active)).map(r => ({...r,staffUserId:resolveContactStaff(r,staff)}));
  }, {readOnly:true});
}
// Writes, merge, ratings and drawing portal grants remain on the existing backend.
// Do not route these actions to this module until operational storage is implemented.
