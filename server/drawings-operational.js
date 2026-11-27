// Operational Preview reader. No production routing or persistent business writes.
// server/drawings.js — read-only imported snapshot, Preview only.
// Caller must supply a verified live administrator identity and server-selected exportId.
import { db } from './supabase-db.js';
import { checkProjectRead, visibleProjectIds } from './permissions.js';

const TABLES = Object.freeze({drawings:'drawing_register', files:'files', tasks:'design_tasks'});
function bool(v) { return v === true || ['true','yes','1','y'].includes(String(v ?? '').trim().toLowerCase()); }
function guard(user, exportId) {
  if (process.env.VERCEL_ENV !== 'preview' || process.env.SUPABASE_OPERATIONAL_ACCESS !== '1') throw new Error('Snapshot reads disabled');
  const ids = visibleProjectIds(user);
  if (exportId !== 'operational') throw new Error('Explicit export ID required');
  return ids;
}
async function readRegister(projectId, {user, exportId, database = db} = {}) {
  const ids = guard(user, exportId);
  return database.transaction(async tx => {
    await checkProjectRead(tx,user,projectId);
    const result = {};
    for (const [key, table] of Object.entries(TABLES)) {
      const rows = await tx.rows(`SELECT cells FROM enlighten_operational."${table}" WHERE ($1::text[] IS NULL OR cells->>'projectId'=ANY($1)) AND ($2='' OR cells->>'projectId'=$2) ORDER BY source_row_number NULLS LAST, record_id`, [ids,projectId]);
      result[key] = rows.map(({cells}) => {
        if (!cells || typeof cells !== 'object' || Array.isArray(cells)) throw new Error('Invalid imported drawing record');
        return cells;
      }).filter(row => !bool(row.trashed));
    }
    return result;
  }, {readOnly:true});
}
export async function listDrawingRegister(payload = {}, context = {}) {
  const projectId = String(payload.projectId ?? '').trim();
  if (!projectId) throw new Error('Project ID required');
  return readRegister(projectId, context);
}
export async function listRecentDrawingRegister(_payload = {}, context = {}) {
  return readRegister('', context);
}
// Upload, classify, issue, trash, portal access and Drive operations are NOT migrated.
// Do not expose this module directly to clients or use it for contractor access.
