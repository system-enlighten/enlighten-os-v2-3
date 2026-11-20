
import { Pool } from 'pg';
import { readAppSession } from './index.js';

// Stage 6A: Preview-only, administrator-only, read-only relationship discovery.
// Examines JSON structure and candidate reference key names; does not read out values.
const fail = (res, status, message) => res.status(status).json({ ok: false, error: { message } });
const SCHEMA = 'enlighten_import';
const TARGETS = [
  'projects', 'floor_zones', 'drawing_register', 'files', 'design_tasks',
  'wih', 'line_of_work', 'workflow_delegations', 'project_roles',
  'received_drawings', 'issued_drawings', 'project_contacts',
  'design_dashboard', 'technical_workbooks', 'studio_attendance'
];
const quoteIdent = value => '"' + String(value).replace(/"/g, '""') + '"';
const referencePattern = /(^id$|_id$|^project|^parent|^task|^drawing|^floor|^zone|^area|^file|^member|^user|^person|^employee|^role|^assigned|^responsible|^milestone|^work)/i;

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
    pool = new Pool({
      connectionString: url.toString(), ssl: { ca, rejectUnauthorized: true },
      max: 1, connectionTimeoutMillis: 10000,
      statement_timeout: 15000
    });
    const { rows: columns } = await pool.query(`
      SELECT table_name, column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = $1 AND table_name = ANY($2::text[])
      ORDER BY table_name, ordinal_position
    `, [SCHEMA, TARGETS]);
    const byTable = new Map();
    for (const col of columns) {
      if (!byTable.has(col.table_name)) byTable.set(col.table_name, []);
      byTable.get(col.table_name).push(col);
    }
    const results = [];
    for (const name of TARGETS) {
      const cols = byTable.get(name);
      if (!cols) {
        results.push({ table: name, exists: false });
        continue;
      }
      const qualified = `${quoteIdent(SCHEMA)}.${quoteIdent(name)}`;
      const hasCells = cols.some(c => c.column_name === 'cells' && ['json', 'jsonb'].includes(c.data_type));
      const { rows: counts } = await pool.query(`SELECT COUNT(*)::int AS n FROM ${qualified}`);
      const entry = {
        table: name, exists: true, rows: counts[0].n,
        columns: cols.map(c => ({ name: c.column_name, type: c.data_type, nullable: c.is_nullable === 'YES' })),
        candidateReferenceColumns: cols.map(c => c.column_name).filter(k => referencePattern.test(k)),
        hasCells
      };
      if (hasCells) {
        const { rows: shapes } = await pool.query(`
          SELECT jsonb_typeof(cells::jsonb) AS shape, COUNT(*)::int AS n
          FROM ${qualified} GROUP BY 1 ORDER BY 1
        `);
        entry.cellsShapes = shapes.map(s => ({ shape: s.shape || 'sql-null', rows: s.n }));
        // Inspect only JSON key names, never cell values. Limit work to a small sample.
        const { rows: sample } = await pool.query(`
          SELECT cells::jsonb AS cells FROM ${qualified}
          WHERE cells IS NOT NULL LIMIT 25
        `);
        const keys = new Set();
        let arrayRows = 0;
        let objectRows = 0;
        for (const { cells } of sample) {
          if (Array.isArray(cells)) {
            arrayRows++;
            for (const cell of cells.slice(0, 30)) {
              if (cell && typeof cell === 'object' && !Array.isArray(cell)) {
                for (const key of Object.keys(cell)) keys.add(key);
              }
            }
          } else if (cells && typeof cells === 'object') {
            objectRows++;
            for (const key of Object.keys(cells)) keys.add(key);
          }
        }
        entry.sample = { rowsExamined: sample.length, arrayRows, objectRows };
        entry.sampleJsonKeys = [...keys].sort().slice(0, 60);
        entry.candidateReferenceJsonKeys = entry.sampleJsonKeys.filter(k => referencePattern.test(k));
      }
      results.push(entry);
    }
    return res.status(200).json({
      ok: true, source: 'supabase-preview', readOnly: true, stage: '6A', schema: SCHEMA,
      summary: {
        requestedTables: TARGETS.length,
        existingTables: results.filter(x => x.exists).length,
        tablesWithCells: results.filter(x => x.hasCells).length,
        tablesMissing: results.filter(x => !x.exists).map(x => x.table)
      },
      tables: results,
      note: 'Structure and candidate-reference discovery only. Sampled key names do not prove foreign-key relationships or data parity. No values or records are returned. No writes performed.'
    });
  } catch (error) {
    console.error('Stage 6A discovery failed', { code: error?.code });
    return fail(res, 502, 'Could not complete Stage 6A relationship discovery');
  } finally {
    if (pool) await pool.end().catch(() => {});
  }
}
