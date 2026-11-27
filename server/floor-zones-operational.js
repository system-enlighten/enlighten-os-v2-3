// Operational Preview reader. No production routing or persistent business writes.
// server/floor-zones.js — read-only Preview snapshot.
import { db } from './supabase-db.js';
import { checkProjectRead, visibleProjectIds } from './permissions.js';

export async function listFloorZones(payload = {}, { user, exportId, database = db } = {}) {
  if (process.env.VERCEL_ENV !== 'preview' || process.env.SUPABASE_OPERATIONAL_ACCESS !== '1') {
    throw new Error('Snapshot reads disabled');
  }
  const ids = visibleProjectIds(user);
  if (exportId !== 'operational') throw new Error('Explicit export ID required');
  const projectId = String(payload.projectId || '').trim();
  return database.transaction(async tx => {
    await checkProjectRead(tx,user,projectId);
    const rows = await tx.rows(`SELECT cells FROM enlighten_operational.floor_zones
      WHERE ($1::text[] IS NULL OR cells->>'projectId'=ANY($1)) AND ($2 = '' OR cells->>'projectId' = $2)
      ORDER BY source_row_number NULLS LAST, record_id`, [ids, projectId]);
    return rows.map(({ cells }) => {
      if (!cells || typeof cells !== 'object' || Array.isArray(cells)) throw new Error('Invalid floor zone record');
      return cells;
    }).filter(r => active(r.active)).sort((a,b) => Number(a.seq || 0) - Number(b.seq || 0));
  }, { readOnly: true });
}
function active(v) {
  if (typeof v === 'boolean') return v;
  return ['true', 'yes', '1', 'y'].includes(String(v ?? '').trim().toLowerCase());
}
// saveFloorZones and deleteFloorZones are not migrated. Keep snapshot immutable.
