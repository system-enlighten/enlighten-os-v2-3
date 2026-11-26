// server/diary.js — Preview snapshot reader, not a replacement for getProjectDiary.
// Call only after verified Google session and live Apps Script authorization.
import { db } from './supabase-db.js';
import { requireSystemAdmin, requireProject } from './permissions.js';

const tables = Object.freeze({meetings:'project_meetings', visits:'execution_visits', details:'diary_entries', momTasks:'mom_tasks'});

export async function readDiarySnapshot(payload = {}, {user, exportId, database = db} = {}) {
  if (process.env.VERCEL_ENV !== 'preview' || process.env.SUPABASE_IMPORTED_PROJECT_READS !== '1') throw new Error('Snapshot reads disabled');
  requireSystemAdmin(user);
  if (typeof exportId !== 'string' || !exportId.trim()) throw new Error('Explicit server-selected export ID required');
  const projectId = String(payload.projectId ?? '').trim();
  if (!projectId) throw new Error('Project ID required');
  requireProject(user, projectId);
  return database.transaction(async tx => {
    const projects = await tx.rows(`SELECT cells FROM enlighten_import.projects WHERE export_id=$1 AND cells->>'projectId'=$2`, [exportId, projectId]);
    if (projects.length !== 1) throw new Error('Missing or ambiguous project in snapshot');
    const result = {projectId, readOnly:true};
    for (const [key, table] of Object.entries(tables)) {
      const rows = await tx.rows(`SELECT cells FROM enlighten_import."${table}" WHERE export_id=$1 AND cells->>'projectId'=$2 ORDER BY source_row_number, import_id`, [exportId, projectId]);
      result[key] = rows.map(({cells}) => {
        if (!cells || typeof cells !== 'object' || Array.isArray(cells) || String(cells.projectId) !== projectId) throw new Error('Invalid imported diary record');
        return cells;
      });
    }
    return result;
  }, {readOnly:true});
}
// Not API-compatible with getProjectDiary: timeline merging, participant-only access,
// structured MOM points, attachment handling, versioned edits and writes remain unmigrated.
// Keep existing Apps Script diary routes active. Never accept exportId or user from client payload.
