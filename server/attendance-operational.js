// Operational Preview reader. No production routing or persistent business writes.
// server/attendance.js — private read-only Preview snapshot inspection.
// user must be supplied by verified live authorization; exportId is server-selected.
import { db } from './supabase-db.js';
import { requireSystemAdmin } from './permissions.js';

export async function readAttendanceSnapshot({user, exportId, userId, database = db} = {}) {
  if (process.env.VERCEL_ENV !== 'preview' || process.env.SUPABASE_OPERATIONAL_ACCESS !== '1') throw new Error('Snapshot reads disabled');
  requireSystemAdmin(user);
  if (exportId !== 'operational') throw new Error('Explicit export ID required');
  if (typeof userId !== 'string' || !userId.trim()) throw new Error('Employee ID required');
  return database.transaction(async tx => {
    const rows = await tx.rows(`SELECT source_row_number, cells FROM enlighten_operational.studio_attendance WHERE ($1::text = $$operational$$) AND cells->>'userId'=$2 ORDER BY source_row_number, record_id`, [exportId,userId]);
    const corrections = await tx.rows(`SELECT cells FROM enlighten_operational.studio_attendance_corrections WHERE ($1::text = $$operational$$) AND left(cells->>'key',length($2)+1)=$2||'|' ORDER BY source_row_number, record_id`, [exportId,userId]);
    const records = [], warnings = [], keys = new Set();
    const parseArray = value => {
      const result = typeof value === 'string' ? JSON.parse(value || '[]') : (value ?? []);
      if (!Array.isArray(result)) throw new Error('Expected array');
      return result;
    };
    for (const {cells:c,source_row_number:n} of rows) {
      try {
        const key = String(c.key || ''), day = key.slice(userId.length+1);
        if (key !== userId+'|'+day || !/^\d{4}-\d{2}-\d{2}$/.test(day) || keys.has(key)) throw new Error('Invalid attendance key');
        const date = new Date(day+'T00:00:00Z');
        if (!Number.isFinite(+date) || date.toISOString().slice(0,10)!==day) throw new Error('Invalid date');
        const entries = parseArray(c.entriesJson), breaks = parseArray(c.breaksJson);
        keys.add(key);
        records.push({...c,day,entries,breaks});
      } catch { warnings.push(`Attendance row ${n} has invalid or duplicate data.`); }
    }
    records.sort((a,b)=>b.day.localeCompare(a.day));
    return {records,corrections:corrections.map(r=>r.cells),warnings,complete:warnings.length===0};
  }, {readOnly:true});
}
// Not an attendanceDay_ replacement: live tracking, leave, site visits, punch writes,
// corrections, missed checkout calculation and payroll machine import remain unmigrated.
