import { Pool } from 'pg';
import { readAppSession } from './index.js';

// Stage 7: Preview-only, administrator-only, READ-ONLY project-reference reconciliation.
// This endpoint never updates, deletes, inserts, or automatically maps references.
const SCHEMA = 'enlighten_import';
const TARGETS = ['floor_zones','drawing_register','files','design_tasks','wih','line_of_work',
  'workflow_delegations','project_roles','received_drawings','issued_drawings',
  'project_contacts','design_dashboard','technical_workbooks','studio_attendance'];
const KEYS = ['projectId', 'project_id', 'Project ID', 'projectID'];
const qi = value => '"' + String(value).replace(/"/g, '""') + '"';
const tbl = name => `${qi(SCHEMA)}.${qi(name)}`;
const fail = (res, status, message) => res.status(status).json({ ok: false, error: { message } });

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
    const { rows: columns } = await pool.query(`
      SELECT table_name, column_name, data_type FROM information_schema.columns
      WHERE table_schema = $1 AND table_name = ANY($2::text[])
    `, [SCHEMA, ['projects', ...TARGETS]]);
    const byTable = new Map();
    for (const col of columns) {
      if (!byTable.has(col.table_name)) byTable.set(col.table_name, []);
      byTable.get(col.table_name).push(col);
    }
    const hasCells = name => (byTable.get(name) || []).some(
      c => c.column_name === 'cells' && ['json','jsonb'].includes(c.data_type));
    if (!hasCells('projects')) return fail(res, 422, 'Projects table has no JSON cells');

    const { rows: projectFields } = await pool.query(`
      SELECT DISTINCT k.key FROM ${tbl('projects')} p
      CROSS JOIN LATERAL jsonb_object_keys(CASE WHEN jsonb_typeof(p.cells::jsonb) = 'object'
        THEN p.cells::jsonb ELSE '{}'::jsonb END) AS k(key)
      WHERE k.key = ANY($1::text[])
    `, [KEYS]);
    const idKey = KEYS.find(k => projectFields.some(row => row.key === k));
    if (!idKey) return fail(res, 422, 'No recognized project ID key');

    const reports = [];
    for (const name of TARGETS) {
      if (!hasCells(name)) {
        reports.push({ table: name, status: 'skipped', reason: byTable.has(name) ? 'No JSON cells' : 'Table missing' });
        continue;
      }
      const { rows: fields } = await pool.query(`
        SELECT DISTINCT k.key FROM ${tbl(name)} t
        CROSS JOIN LATERAL jsonb_object_keys(CASE WHEN jsonb_typeof(t.cells::jsonb) = 'object'
          THEN t.cells::jsonb ELSE '{}'::jsonb END) AS k(key)
        WHERE k.key = ANY($1::text[])
      `, [KEYS]);
      const refKey = KEYS.find(k => fields.some(row => row.key === k));
      if (!refKey) {
        reports.push({ table: name, status: 'skipped', reason: 'No recognized project ID reference field' });
        continue;
      }
      // Only nonblank, unmatched reference values. The grouped count prevents duplicate
      // records being mistaken for distinct missing projects. No project names are exposed.
      const { rows: mismatches } = await pool.query(`
        WITH projects AS (
          SELECT DISTINCT NULLIF(btrim(cells::jsonb ->> $1), '') AS id,
            NULLIF(btrim(cells::jsonb ->> 'projectNo'), '') AS project_no
          FROM ${tbl('projects')}
          WHERE jsonb_typeof(cells::jsonb) = 'object'
        ), refs AS (
          SELECT NULLIF(btrim(cells::jsonb ->> $2), '') AS ref
          FROM ${tbl(name)} WHERE jsonb_typeof(cells::jsonb) = 'object'
        ), unmatched AS (
          SELECT ref, COUNT(*)::int AS occurrences FROM refs
          WHERE ref IS NOT NULL AND NOT EXISTS (SELECT 1 FROM projects p WHERE p.id = refs.ref)
          GROUP BY ref
        )
        SELECT u.ref AS reference, u.occurrences,
          EXISTS (SELECT 1 FROM projects p WHERE lower(p.id) = lower(u.ref)) AS case_only_id_match,
          EXISTS (SELECT 1 FROM projects p WHERE p.project_no = u.ref) AS matches_project_number,
          EXISTS (SELECT 1 FROM projects p WHERE lower(p.project_no) = lower(u.ref)) AS case_insensitive_project_number_match
        FROM unmatched u ORDER BY u.occurrences DESC, u.ref ASC
      `, [idKey, refKey]);
      reports.push({ table: name, status: 'checked', referenceKey: refKey,
        unmatchedRows: mismatches.reduce((sum, r) => sum + r.occurrences, 0),
        distinctUnmatchedReferences: mismatches.length,
        candidates: mismatches.slice(0, 100),
        truncated: mismatches.length > 100 });
    }
    const checked = reports.filter(r => r.status === 'checked');
    return res.status(200).json({ ok: true, source: 'supabase-preview', stage: '7', readOnly: true,
      schema: SCHEMA, status: 'review-required', projectIdKey: idKey,
      summary: { checkedTables: checked.length, skippedTables: reports.length - checked.length,
        unmatchedRows: checked.reduce((sum, r) => sum + r.unmatchedRows, 0),
        distinctReferencesByTable: checked.reduce((sum, r) => sum + r.distinctUnmatchedReferences, 0) },
      tables: reports,
      note: 'Candidate matches are hints only, not approved mappings. No records changed. Review unmatched references before any migration write or cutover.' });
  } catch (error) {
    console.error('Stage 7 reconciliation failed', { code: error?.code });
    return fail(res, 502, 'Could not complete Stage 7 reconciliation');
  } finally {
    if (pool) await pool.end().catch(() => {});
  }
}
