// server/payroll.js — Preview-only payroll migration preflight.
// The imported schema supplied for this migration does not contain the
// Payroll Machine Attendance sheet. Never substitute studio attendance.
import { db } from './supabase-db.js';
import { requireSystemAdmin } from './permissions.js';

export async function readPayrollMachineAttendance({user, exportId, year, database = db} = {}) {
  if (process.env.VERCEL_ENV !== 'preview' || process.env.SUPABASE_IMPORTED_PROJECT_READS !== '1') throw new Error('Snapshot reads disabled');
  requireSystemAdmin(user);
  if (typeof exportId !== 'string' || !exportId.trim()) throw new Error('Explicit export ID required');
  if (!/^20\d{2}$/.test(String(year ?? ''))) throw new Error('Select a valid year.');
  const result = await database.one("SELECT to_regclass('enlighten_import.payroll_machine_attendance') IS NOT NULL AS present");
  if (!result?.present) throw new Error('Payroll Machine Attendance is missing from the imported schema. Retain the existing Apps Script payroll route.');
  // Even if the table is subsequently created, its source headers and export
  // completeness must be verified before implementing a payroll reader.
  throw new Error('Payroll snapshot mapping is not validated. Retain the existing Apps Script payroll route.');
}
// Pure validation matching the existing import's punch format.
// Does not authorize or persist any records.
export function validatePayrollPunches(rows, activeEmployeeIds) {
  if (!Array.isArray(rows) || !rows.length || rows.length > 5000) throw new Error('Import between 1 and 5,000 employee days.');
  if (!(activeEmployeeIds instanceof Set)) throw new Error('Active employee set required.');
  const incoming = new Map();
  const time = value => {
    if (typeof value !== 'string' || (value && !/^([01]\d|2[0-3]):[0-5]\d$/.test(value))) throw new Error('Invalid attendance time.');
    return value;
  };
  for (const entry of rows) {
    const employeeId = String(entry.employeeId || '');
    if (!activeEmployeeIds.has(employeeId)) throw new Error('Map punches to active team members before importing.');
    const date = String(entry.date || '');
    const parsed = new Date(date+'T00:00:00Z');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(+parsed) || parsed.toISOString().slice(0,10)!==date) throw new Error('Invalid attendance date.');
    const row = {employeeId,date,checkIn:time(entry.checkIn),checkOut:time(entry.checkOut)};
    if (!row.checkIn && !row.checkOut) throw new Error('An imported date must contain a punch.');
    const key = JSON.stringify([employeeId,date]);
    if (incoming.has(key) && JSON.stringify(incoming.get(key))!==JSON.stringify(row)) throw new Error('Conflicting punches for the same employee and date.');
    incoming.set(key,row);
  }
  return [...incoming.values()];
}
