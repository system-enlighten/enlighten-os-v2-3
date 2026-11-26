// Server-only PostgreSQL adapter for Enlighten OS (ES modules).
// Never expose this module or its credentials to the browser.
import { Pool } from 'pg';

export function createDatabase({env = process.env, PoolClass = Pool} = {}) {
  let pool;
  function getPool() {
    if (pool) return pool;
    const url = new URL(env.SUPABASE_DATABASE_URL || '');
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
  async function close() { if (pool) { const old = pool; pool = undefined; await old.end(); } }
  return Object.freeze({query,rows,one,transaction,readImportedRows,close});
}
export const db = createDatabase();
export default db;
