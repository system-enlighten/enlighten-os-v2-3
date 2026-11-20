
import { Pool } from 'pg';
import { readAppSession } from './index.js';

// Stage 6B: Preview-only, admin-only, read-only relationship audit.
// Reports counts only. Never changes data or returns identifying values.
const SCHEMA = 'enlighten_import';
const TARGETS = ['floor_zones','drawing_register','files','design_tasks','wih','line_of_work',
  'workflow_delegations','project_roles','received_drawings','issued_drawings',
  'project_contacts','design_dashboard','technical_workbooks','studio_attendance'];
const fail = (res, status, message) => res.status(status).json({ ok: false, error: { message } });
const qi = s => '"' + String(s).replace(/"/g, '""') + '"';
const table = s => `${qi(SCHEMA)}.${qi(s)}`;
const KEYS = ['projectId', 'project_id', 'Project ID', 'projectID'];

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  if (process.env.VERCEL_ENV !== 'preview') return fail(res, 404, 'Not available');
  if (req.method !== 'GET') return fail(res, 405, 'Method not allowed');
  const secret = process.env.ENLIGHTEN_PROXY_SECRET;
  const audience = process.env.GOOGLE_CLIENT_ID;
  const admin = String(process.env.MIGRATION_ADMIN_EMAIL || '').trim().toLowerCase();
  if (!secret || !audience || !admin || !process.env.SUPABASE_DATABASE_URL)
    return fail(res, 503, 'Preview migration audit configuration incomplete');
  const identity = readAppSession(req, secret, audience);
  if (!identity) return fail(res, 401, 'Sign in to Preview first');
  if (String(identity.email || '').trim().toLowerCase() !== admin)
    return fail(res, 403, 'Migration audit restricted to configured administrator');
  const ca = String(process.env.SUPABASE_DB_CA || '').replace(/\\n/g, '\n').trim();
  if (!ca.includes('-----BEGIN CERTIFICATE-----') || !ca.includes('-----END CERTIFICATE-----'))
    return fail(res, 503, 'Database CA configuration incomplete');

  let pool;
  try {
    const url = new URL(process.env.SUPABASE_DATABASE_URL.trim());
    if (!['postgres:', 'postgresql:'].includes(url.protocol)) return fail(res, 503, 'Invalid database URL');
    for (const key of ['sslmode','sslcert','sslkey','sslrootcert']) url.searchParams.delete(key);
    pool = new Pool({ connectionString: url.toString(), ssl: { ca, rejectUnauthorized: true },
      max: 1, connectionTimeoutMillis: 10000, statement_timeout: 20000 });
    const { rows: cols } = await pool.query(`
      SELECT table_name, column_name, data_type FROM information_schema.columns
      WHERE table_schema = $1 AND table_name = ANY($2::text[])
    `, [SCHEMA, ['projects', ...TARGETS]]);
    const byTable = new Map();
    for (const c of cols) {
      if (!byTable.has(c.table_name)) byTable.set(c.table_name, []);
      byTable.get(c.table_name).push(c);
    }
    const hasCells = name => (byTable.get(name) || []).some(c => c.column_name === 'cells' && ['json','jsonb'].includes(c.data_type));
    if (!hasCells('projects')) return fail(res, 422, 'Projects table has no JSON cells; cannot validate relationships');

    // Use the actual project ID field if present; never assume projectNo is an ID.
    const { rows: projectKeys } = await pool.query(`
      SELECT DISTINCT k.key FROM ${table('projects')} p
      CROSS JOIN LATERAL jsonb_object_keys(
        CASE WHEN jsonb_typeof(p.cells::jsonb) = 'object' THEN p.cells::jsonb ELSE '{}'::jsonb END
      ) AS k(key) WHERE k.key = ANY($1::text[])
    `, [KEYS]);
    const key = KEYS.find(k => projectKeys.some(x => x.key === k));
    if (!key) return res.status(200).json({ ok: true, stage: '6B', readOnly: true,
      status: 'inconclusive', reason: 'No recognized project ID key in projects.cells',
      recognizedKeys: KEYS, note: 'No orphan claims made; inspect Stage 6A keys before mapping.' });

    const { rows: projectStats } = await pool.query(`
      WITH ids AS (
        SELECT NULLIF(btrim(cells::jsonb ->> $1), '') AS id
        FROM ${table('projects')} WHERE jsonb_typeof(cells::jsonb) = 'object'
      ) SELECT COUNT(*)::int AS object_rows,
        COUNT(id)::int AS nonblank_ids,
        COUNT(DISTINCT id)::int AS distinct_ids
      FROM ids
    `, [key]);
    const projectIds = projectStats[0];
    const results = [];
    for (const name of TARGETS) {
      if (!byTable.has(name)) { results.push({ table: name, status: 'skipped', reason: 'Table missing' }); continue; }
      if (!hasCells(name)) { results.push({ table: name, status: 'skipped', reason: 'No JSON cells column' }); continue; }
      // Discover keys in all object rows. Do not infer an FK from a field name alone.
      const { rows: found } = await pool.query(`
        SELECT DISTINCT k.key FROM ${table(name)} t
        CROSS JOIN LATERAL jsonb_object_keys(
          CASE WHEN jsonb_typeof(t.cells::jsonb) = 'object' THEN t.cells::jsonb ELSE '{}'::jsonb END
        ) AS k(key) WHERE k.key = ANY($1::text[])
      `, [KEYS]);
      const refKey = KEYS.find(k => found.some(x => x.key === k));
      if (!refKey) {
        const { rows: counts } = await pool.query(`SELECT COUNT(*)::int AS n FROM ${table(name)}`);
        results.push({ table: name, rows: counts[0].n, status: 'skipped', reason: 'No recognized project ID reference field' });
        continue;
      }
      const { rows } = await pool.query(`
        WITH source AS (
          SELECT NULLIF(btrim(cells::jsonb ->> $1), '') AS ref
          FROM ${table(name)} WHERE jsonb_typeof(cells::jsonb) = 'object'
        ), valid_ids AS (
          SELECT DISTINCT NULLIF(btrim(cells::jsonb ->> $2), '') AS id
          FROM ${table('projects')} WHERE jsonb_typeof(cells::jsonb) = 'object'
        )
        SELECT COUNT(*)::int AS object_rows,
          COUNT(*) FILTER (WHERE ref IS NULL)::int AS blank_references,
          COUNT(*) FILTER (WHERE ref IS NOT NULL AND NOT EXISTS
            (SELECT 1 FROM valid_ids p WHERE p.id = source.ref))::int AS unmatched_references
        FROM source
      `, [refKey, key]);
      const { rows: count } = await pool.query(`SELECT COUNT(*)::int AS n FROM ${table(name)}`);
      results.push({ table: name, rows: count[0].n, referenceKey: refKey,
        status: 'checked', ...rows[0], nonObjectRows: count[0].n - rows[0].object_rows });
    }
    return res.status(200).json({ ok: true, source: 'supabase-preview', readOnly: true,
      stage: '6B', schema: SCHEMA, status: 'preliminary',
      projects: { idKey: key, ...projectIds, duplicateIds: projectIds.nonblank_ids - projectIds.distinct_ids },
      summary: { checked: results.filter(r => r.status === 'checked').length,
        skipped: results.filter(r => r.status === 'skipped').length,
        unmatchedReferences: results.reduce((s,r) => s + (r.unmatched_references || 0), 0) },
      tables: results,
      note: 'Preliminary JSON project-ID reference checks only. Missing or unmatched fields may be legitimate. Other relationships, permissions, Google Sheets parity and writes are NOT certified.' });
  } catch (error) {
    console.error('Stage 6B audit failed', { code: error?.code });
    return fail(res, 502, 'Could not complete Stage 6B relationship audit');
  } finally {
    if (pool) await pool.end().catch(() => {});
  }
}
