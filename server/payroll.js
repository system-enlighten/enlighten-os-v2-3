import { db } from './supabase-db.js';
import { requireAccounts } from './permissions.js';

export async function readPayrollMachineAttendance({year}, {user, database=db} = {}) {
  requireAccounts(user);
  if (!/^20\d{2}$/.test(String(year ?? ''))) throw Object.assign(new Error('Select a valid year.'), {statusCode:400});
  return database.rows(`SELECT employee_id AS "employeeId", to_char(attendance_date,'YYYY-MM-DD') AS date,
    coalesce(to_char(check_in,'HH24:MI'),'') AS "checkIn",
    coalesce(to_char(check_out,'HH24:MI'),'') AS "checkOut"
    FROM enlighten_operational.payroll_machine_attendance
    WHERE attendance_date >= make_date($1::integer,1,1) AND attendance_date < make_date($1::integer+1,1,1)
    ORDER BY attendance_date,employee_id`, [Number(year)]);
}

export async function importPayrollMachineAttendance({rows}, {user, database=db} = {}) {
  requireAccounts(user, {write:true});
  return database.transaction(async tx => {
    const people = await tx.rows("SELECT cells FROM enlighten_operational.people WHERE NULLIF(cells->>'userId','') IS NOT NULL FOR SHARE");
    const staff = new Set(people.filter(({cells})=>!['false','no','0','n',''].includes(String(cells.active ?? '').trim().toLowerCase())).map(({cells})=>String(cells.userId)));
    let punches;
    try {
      punches = validatePayrollPunches(rows, staff);
    } catch (error) {
      error.statusCode=400;
      throw error;
    }
    const result = await tx.query(`INSERT INTO enlighten_operational.payroll_machine_attendance AS existing
      (employee_id,attendance_date,check_in,check_out)
      SELECT "employeeId",date::date,nullif("checkIn",'')::time,nullif("checkOut",'')::time
      FROM jsonb_to_recordset($1::jsonb) AS punch("employeeId" text,date text,"checkIn" text,"checkOut" text)
      ORDER BY "employeeId",date
      ON CONFLICT (employee_id,attendance_date) DO UPDATE
      SET check_in=excluded.check_in,check_out=excluded.check_out,updated_at=clock_timestamp()
      WHERE (existing.check_in,existing.check_out) IS DISTINCT FROM (excluded.check_in,excluded.check_out)`, [JSON.stringify(punches)]);
    return {saved:result.rowCount};
  });
}

export function validatePayrollPunches(rows, activeEmployeeIds) {
  if (!Array.isArray(rows) || !rows.length || rows.length > 5000) throw new Error('Import between 1 and 5,000 employee days.');
  if (!(activeEmployeeIds instanceof Set)) throw new Error('Active employee set required.');
  const incoming = new Map();
  const time = value => {
    if (typeof value !== 'string' || (value && !/^([01]\d|2[0-3]):[0-5]\d$/.test(value))) throw new Error('Invalid attendance time.');
    return value;
  };
  for (const entry of rows) {
    const employeeId = String(entry?.employeeId || '');
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
