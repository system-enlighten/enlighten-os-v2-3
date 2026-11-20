import { Pool } from 'pg';
import { readAppSession } from './index.js';

// Stage 8: Preview-only, admin-only, read-only classification of project references.
// Classification is advisory: no mapping, INSERT, UPDATE or DELETE is performed.
const SCHEMA = 'enlighten_import';
const TARGETS = ['floor_zones','drawing_register','files','design_tasks','wih','line_of_work',
  'workflow_delegations','project_roles','received_drawings','issued_drawings',
  'project_contacts','design_dashboard','technical_workbooks','studio_attendance'];
const KEYS = ['projectId', 'project_id', 'Project ID', 'projectID'];
const qi = s => '"' + String(s).replace(/"/g, '""') + '"';
const table = s => `${qi(SCHEMA)}.${qi(s)}`;
const fail = (res, status, message) => res.status(status).json({ ok: false, error: { message } });

function classify(tableName, reference, projectNumberMatch, caseOnlyIdMatch) {
  if (tableName === 'workflow_delegations' && reference === '*')
    return { category: 'global-workflow-candidate', action: 'Verify wildcard semantics in application code' };
  if (reference.startsWith('__internal_') && reference.endsWith('__'))
    return { category: 'internal-work-candidate', action: 'Verify internal-work owner and intended scope' };
  if (projectNumberMatch || caseOnlyIdMatch)
    return { category: 'possible-alias', action: 'Review before proposing any mapping' };
  return { category: 'unresolved-project-reference', action: 'Investigate legacy, deleted, or missing project' };
}

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
    const client = await pool.connect();
    try {
      await client.query('BEGIN READ ONLY');
      const { rows: columns } = await client.query(`
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
      if (!hasCells('projects')) { await client.query('ROLLBACK'); return fail(res, 422, 'Projects table has no JSON cells'); }
      const { rows: projectFields } = await client.query(`
        SELECT DISTINCT k.key FROM ${table('projects')} p
        CROSS JOIN LATERAL jsonb_object_keys(CASE WHEN jsonb_typeof(p.cells::jsonb) = 'object'
          THEN p.cells::jsonb ELSE '{}'::jsonb END) AS k(key)
        WHERE k.key = ANY($1::text[])
      `, [KEYS]);
      const idKey = KEYS.find(k => projectFields.some(row => row.key === k));
      if (!idKey) { await client.query('ROLLBACK'); return fail(res, 422, 'No recognized project ID key'); }
      const reports = [];
      for (const name of TARGETS) {
        if (!hasCells(name)) {
          reports.push({ table: name, status: 'skipped', reason: byTable.has(name) ? 'No JSON cells' : 'Table missing' });
          continue;
        }
        const { rows: fields } = await client.query(`
          SELECT DISTINCT k.key FROM ${table(name)} t
          CROSS JOIN LATERAL jsonb_object_keys(CASE WHEN jsonb_typeof(t.cells::jsonb) = 'object'
            THEN t.cells::jsonb ELSE '{}'::jsonb END) AS k(key)
          WHERE k.key = ANY($1::text[])
        `, [KEYS]);
        const refKey = KEYS.find(k => fields.some(row => row.key === k));
        if (!refKey) {
          reports.push({ table: name, status: 'skipped', reason: 'No recognized project ID reference field' });
          continue;
        }
        const { rows: mismatches } = await client.query(`
          WITH projects AS (
            SELECT DISTINCT NULLIF(btrim(cells::jsonb ->> $1), '') AS id,
              NULLIF(btrim(cells::jsonb ->> 'projectNo'), '') AS project_no
            FROM ${table('projects')} WHERE jsonb_typeof(cells::jsonb) = 'object'
          ), refs AS (
            SELECT NULLIF(btrim(cells::jsonb ->> $2), '') AS ref
            FROM ${table(name)} WHERE jsonb_typeof(cells::jsonb) = 'object'
          ), unmatched AS (
            SELECT ref, COUNT(*)::int AS occurrences FROM refs
            WHERE ref IS NOT NULL AND NOT EXISTS (SELECT 1 FROM projects p WHERE p.id = refs.ref)
            GROUP BY ref
          )
          SELECT u.ref AS reference, u.occurrences,
            EXISTS (SELECT 1 FROM projects p WHERE lower(p.id) = lower(u.ref)) AS case_only_id_match,
            EXISTS (SELECT 1 FROM projects p WHERE p.project_no = u.ref OR lower(p.project_no) = lower(u.ref)) AS project_number_match
          FROM unmatched u ORDER BY u.occurrences DESC, u.ref ASC
        `, [idKey, refKey]);
        const candidates = mismatches.map(row => ({
          reference: row.reference, occurrences: row.occurrences,
          ...classify(name, row.reference, row.project_number_match, row.case_only_id_match)
        }));
        reports.push({ table: name, status: 'checked', referenceKey: refKey,
          unmatchedRows: candidates.reduce((sum, row) => sum + row.occurrences, 0),
          distinctUnmatchedReferences: candidates.length, candidates: candidates.slice(0, 100),
          truncated: candidates.length > 100 });
      }
      await client.query('COMMIT');
      const counts = {};
      for (const report of reports) for (const item of (report.candidates || []))
        counts[item.category] = (counts[item.category] || 0) + item.occurrences;
      return res.status(200).json({ ok: true, source: 'supabase-preview', stage: '8',
        schema: SCHEMA, readOnly: true, status: 'review-required', projectIdKey: idKey,
        summary: { checkedTables: reports.filter(r => r.status === 'checked').length,
          skippedTables: reports.filter(r => r.status === 'skipped').length,
          unmatchedRows: reports.reduce((sum, r) => sum + (r.unmatchedRows || 0), 0),
          categories: counts }, tables: reports,
        note: 'Categories are heuristic candidates, not approved mappings. No records changed. Review unresolved IDs and confirm system-level semantics before any writes.' });
    } catch (error) {
      await client.query('ROLLBACK').catch(() => {});
      throw error;
    } finally { client.release(); }
  } catch (error) {
    console.error('Stage 8 classification failed', { code: error?.code });
    return fail(res, 502, 'Could not complete Stage 8 classification');
  } finally { if (pool) await pool.end().catch(() => {}); }
}
