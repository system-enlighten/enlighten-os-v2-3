import { Pool } from 'pg';
import { readAppSession } from './index.js';

// Stage 5: read-only, admin-only imported table inventory.
// Does not modify production, imported records, or React UI.
const fail = (res, status, message) => res.status(status).json({ ok: false, error: { message } });

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  if (process.env.VERCEL_ENV !== 'preview') return fail(res, 404, 'Not available');
  if (req.method !== 'GET') return fail(res, 405, 'Method not allowed');

  const secret = process.env.ENLIGHTEN_PROXY_SECRET;
  const audience = process.env.GOOGLE_CLIENT_ID;
  const admin = String(process.env.MIGRATION_ADMIN_EMAIL || '').trim().toLowerCase();
  if (!secret || !audience || !admin || !process.env.SUPABASE_DATABASE_URL) {
    return fail(res, 503, 'Preview migration audit configuration incomplete');
  }
  const identity = readAppSession(req, secret, audience);
  if (!identity) return fail(res, 401, 'Sign in to Preview first');
  if (String(identity.email || '').trim().toLowerCase() !== admin) {
    return fail(res, 403, 'Migration audit restricted to configured administrator');
  }

  const ca = String(process.env.SUPABASE_DB_CA || '').replace(/\\n/g, '\n').trim();
  if (!ca.includes('-----BEGIN CERTIFICATE-----') || !ca.includes('-----END CERTIFICATE-----')) {
    return fail(res, 503, 'Database CA configuration incomplete');
  }
  let pool;
  try {
    const url = new URL(process.env.SUPABASE_DATABASE_URL.trim());
    if (!['postgres:', 'postgresql:'].includes(url.protocol)) return fail(res, 503, 'Invalid database URL');
    for (const key of ['sslmode', 'sslcert', 'sslkey', 'sslrootcert']) url.searchParams.delete(key);
    pool = new Pool({ connectionString: url.toString(), ssl: { ca, rejectUnauthorized: true }, max: 1, connectionTimeoutMillis: 10000 });
    const { rows: tables } = await pool.query(`
      SELECT t.table_name,
        EXISTS (SELECT 1 FROM information_schema.columns c
                WHERE c.table_schema = t.table_schema AND c.table_name = t.table_name
                  AND c.column_name = 'cells' AND c.data_type IN ('json','jsonb')) AS has_cells
      FROM information_schema.tables t
      WHERE t.table_schema = 'enlighten_import' AND t.table_type = 'BASE TABLE'
      ORDER BY t.table_name
    `);
    const results = [];
    for (const table of tables) {
      // Names originate from the database catalog, not request parameters.
      const quoted = '"' + table.table_name.replace(/"/g, '""') + '"';
      const { rows } = await pool.query(`SELECT COUNT(*)::bigint AS n FROM enlighten_import.${quoted}`);
      results.push({ table: table.table_name, rows: Number(rows[0].n), hasCells: table.has_cells });
    }
    return res.status(200).json({
      ok: true, source: 'supabase-preview', readOnly: true,
      stage: 5, schema: 'enlighten_import',
      summary: { tables: results.length, totalRows: results.reduce((sum, x) => sum + x.rows, 0),
        tablesWithoutCells: results.filter(x => !x.hasCells).map(x => x.table) },
      tables: results,
      note: 'Table inventory only. Does not certify Google Sheets parity, relationships, authorization, or writes.'
    });
  } catch (error) {
    console.error('Stage 5 inventory failed', { code: error?.code });
    return fail(res, 502, 'Could not complete imported table inventory');
  } finally {
    if (pool) await pool.end().catch(() => {});
  }
}
