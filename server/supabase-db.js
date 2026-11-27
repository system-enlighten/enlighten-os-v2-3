// Server-only PostgreSQL adapter for Enlighten OS (ES modules).
// Never expose this module or its credentials to the browser.
import { Pool } from 'pg';

export function createDatabase({env = process.env, PoolClass = Pool} = {}) {
  let pool;
  function getPool() {
    if (pool) return pool;
    const url = new URL((env.VERCEL_ENV==='preview'?env.SUPABASE_PREVIEW_DATABASE_URL:env.SUPABASE_DATABASE_URL)||'');
    if (!['postgres:', 'postgresql:'].includes(url.protocol)) throw new Error('Invalid database protocol');
    const ca = String(env.SUPABASE_DB_CA || '').replace(/\\n/g, '\n').trim();
    if (!ca.includes('-----BEGIN CERTIFICATE-----')) throw new Error('SUPABASE_DB_CA is required');
    for (const key of ['sslmode','sslcert','sslkey','sslrootcert','ssl']) url.searchParams.delete(key);
    pool = new PoolClass({connectionString:url.toString(), ssl:{ca,rejectUnauthorized:true}, max:2, connectionTimeoutMillis:5000, idleTimeoutMillis:10000, statement_timeout:15000});
    pool.on('error', () => console.error('Enlighten database idle connection error'));
    return pool;
  }
  function validate(sql, values) {
    if (typeof sql !== 'string' || !sql.trim() || !Array.isArray(values)) throw new TypeError('Expected SQL and parameter array');
  }
  // SQL must be authored by trusted server modules, never supplied by a browser.
  async function query(sql, values = []) {
    validate(sql, values);
    return getPool().query(sql, values);
  }
  async function rows(sql, values = []) { return (await query(sql, values)).rows; }
  async function one(sql, values = []) {
    const result = await rows(sql, values);
    if (result.length > 1) throw new Error('Expected at most one record');
    return result[0] ?? null;
  }
  async function transaction(work, {readOnly = false} = {}) {
    if (typeof work !== 'function') throw new TypeError('Transaction callback required');
    const client = await getPool().connect();
    let broken = false, active = true;
    const txQuery = async (sql, values = []) => {
      if (!active) throw new Error('Transaction has ended');
      validate(sql, values);
      return client.query(sql, values);
    };
    try {
      await client.query(readOnly ? 'BEGIN READ ONLY' : 'BEGIN');
      const result = await work(Object.freeze({query:txQuery, rows:async (sql,values=[]) => (await txQuery(sql,values)).rows}));
      active = false;
      await client.query('COMMIT');
      return result;
    } catch (error) {
      active = false;
      try { await client.query('ROLLBACK'); } catch { broken = true; }
      throw error;
    } finally { client.release(broken); }
  }
  // Staging imports are snapshots, not operational tables. Read only here.
  async function readImportedRows(table, {exportId, limit = 1000, offset = 0} = {}) {
    if (!/^[a-z][a-z0-9_]{0,62}$/.test(table) || ['sheet_catalog','import_batches'].includes(table)) throw new Error('Invalid import table');
    if (typeof exportId !== 'string' || !exportId.trim()) throw new Error('Explicit export ID required');
    if (!Number.isSafeInteger(limit) || limit < 1 || limit > 5000 || !Number.isSafeInteger(offset) || offset < 0) throw new Error('Invalid pagination');
    return rows(`SELECT import_id, source_row_number, cells FROM enlighten_import."${table}" WHERE export_id = $1 ORDER BY source_row_number, import_id LIMIT $2 OFFSET $3`, [exportId,limit,offset]);
  }
  // Operational access is opt-in and Preview-only until final cutover.
  const operationalTables = new Set(['readme', 'home_agenda_sessions', 'studio_briefings', 'assistant_profiles', 'studio_attendance_corrections', 'line_of_work_comments', 'internal_work_areas', 'assigned_work_acceptance', 'assigned_work_comments', 'studio_attendance', 'active_time', 'app_feedback', 'feedback_attachments', 'diary_entries', 'studio_journal', 'site_execution_items', 'wih_plans', 'application_images', 'studio_threads', 'studio_thread_comments', 'project_books', 'project_closeout', 'workflow_delegations', 'email_drawing_intakes', 'email_intake_messages', 'project_onboarding', 'technical_workbooks', 'technical_tables', 'technical_table_chunks', 'technical_fittings', 'duplicate_drawing_cleanup', 'drawing_portal_access', 'issued_drawings', 'mom_tasks', 'execution_visits', 'project_meetings', 'site_punch_ins', 'project_roles', 'drawing_task_master', 'designations', 'departments', 'projects', 'project_contacts', 'line_of_work', 'floor_zones', 'people', 'contacts', 'drawing_register', 'design_dashboard', 'design_tasks', 'wih', 'work_log', 'execution', 'meetings', 'mom', 'site_visits', 'files', 'activity_log', 'lookups', 'accounts_journal']);
  function operationalTable(table) {
    if (env.VERCEL_ENV !== 'preview' || env.SUPABASE_OPERATIONAL_ACCESS !== '1') throw new Error('Operational access disabled');
    if (!operationalTables.has(table)) throw new Error('Unknown operational table');
    return `enlighten_operational."${table}"`;
  }
  // Trusted server callers must authorize the user and validate business fields first.
  async function readOperationalRows(table, {limit=1000, offset=0, projectId}={}) {
    const name=operationalTable(table);
    if (!Number.isSafeInteger(limit) || limit<1 || limit>5000 || !Number.isSafeInteger(offset) || offset<0) throw new Error('Invalid pagination');
    if (projectId !== undefined && (typeof projectId !== 'string' || !projectId.trim())) throw new Error('Invalid project ID');
    return rows(`SELECT record_id, source_export_id, source_row_number, cells, updated_at::text AS updated_at FROM ${name} ${projectId===undefined?'':"WHERE cells->>'projectId'=$3"} ORDER BY source_row_number NULLS LAST, record_id LIMIT $1 OFFSET $2`, projectId===undefined?[limit,offset]:[limit,offset,projectId]);
  }
  // Optimistic concurrency: reject stale edits. Use only after module-level authorization.
  async function updateOperationalRecord(table, {recordId, expectedUpdatedAt, cells}, executor={query}) {
    const name=writeTable(table);
    if (!/^[1-9][0-9]*$/.test(String(recordId)) || !expectedUpdatedAt || !cells || typeof cells!=='object' || Array.isArray(cells)) throw new Error('Invalid record update');
    const result=await executor.query(`UPDATE ${name} SET cells=$1::jsonb, updated_at=GREATEST(clock_timestamp(),updated_at+interval '1 millisecond') WHERE record_id=$2::bigint AND updated_at=$3::timestamptz RETURNING record_id,cells,updated_at::text AS updated_at`,[JSON.stringify(cells),String(recordId),expectedUpdatedAt]);
    if(result.rowCount!==1) throw new Error('Record missing or changed; reload before editing');
    return result.rows[0];
  }
  // Internal primitives only. No browser-facing generic CRUD endpoint.
  function writeTable(table) {
    if (env.SUPABASE_DIRECT_OPERATIONAL_WRITES !== '1') throw new Error('Operational writes disabled');
    return operationalTable(table);
  }
  async function insertOperationalRecord(table, {cells}, executor={query}) {
    const name=writeTable(table);
    if (!cells || typeof cells !== 'object' || Array.isArray(cells)) throw new Error('Invalid record');
    const result=await executor.query(`INSERT INTO ${name} (cells) VALUES ($1::jsonb) RETURNING record_id,cells,updated_at::text AS updated_at`,[JSON.stringify(cells)]);
    return result.rows[0];
  }
  async function deleteOperationalRecord(table, {recordId,expectedUpdatedAt}, executor={query}) {
    const name=writeTable(table);
    if (!/^[1-9][0-9]*$/.test(String(recordId)) || typeof expectedUpdatedAt !== 'string' || !expectedUpdatedAt) throw new Error('Invalid record deletion');
    const result=await executor.query(`DELETE FROM ${name} WHERE record_id=$1::bigint AND updated_at=$2::timestamptz RETURNING record_id`,[String(recordId),expectedUpdatedAt]);
    if(result.rowCount!==1) throw new Error('Record missing or changed; reload before deleting');
    return result.rows[0];
  }
  async function close() { if (pool) { const old = pool; pool = undefined; await old.end(); } }
  return Object.freeze({query,rows,one,transaction,readImportedRows,readOperationalRows,updateOperationalRecord,insertOperationalRecord,deleteOperationalRecord,close});
}
export const db = createDatabase();
export default db;
