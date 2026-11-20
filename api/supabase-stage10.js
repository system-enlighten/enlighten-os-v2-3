import { Pool } from 'pg';
import { readAppSession } from './index.js';

// Stage 10 — Preview-only, administrator-only, READ-ONLY reference resolution report.
// Upload this text as api/supabase-stage10.js on the supabase-migration branch.
// No automatic mappings or data modifications are performed.
const SCHEMA = 'enlighten_import';
const TARGETS = ['floor_zones','drawing_register','files','design_tasks','wih','line_of_work',
  'workflow_delegations','project_roles','received_drawings','issued_drawings',
  'project_contacts','design_dashboard','technical_workbooks','studio_attendance'];
const KEYS = ['projectId', 'project_id', 'Project ID', 'projectID'];
const qi = s => '"' + s.replace(/"/g, '""') + '"';
const table = name => `${qi(SCHEMA)}.${qi(name)}`;
const fail = (res, status, message) => res.status(status).json({ ok: false, error: { message } });
const cell = alias => `CASE WHEN jsonb_typeof(${alias}.cells::jsonb)='object' THEN ${alias}.cells::jsonb ELSE '{}'::jsonb END`;

function classification(tableName, ref) {
  if (tableName === 'workflow_delegations' && ref === '*')
    return { category: 'global-workflow', decision: 'VERIFY_WILDCARD_SEMANTICS', safeToMap: false };
  if (/^__internal_.*__$/.test(ref))
    return { category: 'internal-work', decision: 'VERIFY_INTERNAL_WORK_SCOPE', safeToMap: false };
  return { category: 'unresolved-project', decision: 'VERIFY_ORIGINAL_SOURCE', safeToMap: false };
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'private, no-store, max-age=0');
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
    for (const key of ['sslmode', 'sslcert', 'sslkey', 'sslrootcert']) url.searchParams.delete(key);
    pool = new Pool({ connectionString: url.toString(), ssl: { ca, rejectUnauthorized: true },
      max: 1, connectionTimeoutMillis: 10000, statement_timeout: 20000 });
    const client = await pool.connect();
    try {
      await client.query('BEGIN READ ONLY');
      const { rows: cols } = await client.query(`
        SELECT table_name, column_name, data_type FROM information_schema.columns
        WHERE table_schema=$1 AND table_name=ANY($2::text[])
      `, [SCHEMA, ['projects', ...TARGETS]]);
      const columns = new Map();
      for (const col of cols) {
        if (!columns.has(col.table_name)) columns.set(col.table_name, new Map());
        columns.get(col.table_name).set(col.column_name, col.data_type);
      }
      const hasCells = name => ['json', 'jsonb'].includes(columns.get(name)?.get('cells'));
      if (!hasCells('projects')) { await client.query('ROLLBACK'); return fail(res, 422, 'Projects JSON cells unavailable'); }
      const { rows: projectKeys } = await client.query(`
        SELECT DISTINCT k.key FROM ${table('projects')} p
        CROSS JOIN LATERAL jsonb_object_keys(${cell('p')}) AS k(key)
        WHERE k.key=ANY($1::text[])
      `, [KEYS]);
      const idKey = KEYS.find(k => projectKeys.some(x => x.key === k));
      if (!idKey) { await client.query('ROLLBACK'); return fail(res, 422, 'Project ID field not found'); }
      const { rows: projectRows } = await client.query(`
        SELECT NULLIF(btrim(${cell('p')} ->> $1),'') AS id,
          NULLIF(btrim(${cell('p')} ->> 'projectNo'),'') AS project_no,
          NULLIF(btrim(${cell('p')} ->> 'projectName'),'') AS project_name,
          NULLIF(btrim(${cell('p')} ->> 'projectStatus'),'') AS project_status,
          p.source_sheet_id, p.source_row_number
        FROM ${table('projects')} p
      `, [idKey]);
      const canonical = projectRows.filter(p => p.id);
      const canonicalIds = new Set(canonical.map(p => p.id));
      const reports = [];
      for (const name of TARGETS) {
        if (!hasCells(name)) {
          reports.push({ table: name, status: 'skipped', reason: 'Table missing or JSON cells unavailable' });
          continue;
        }
        const { rows: keys } = await client.query(`
          SELECT DISTINCT k.key FROM ${table(name)} t
          CROSS JOIN LATERAL jsonb_object_keys(${cell('t')}) AS k(key)
          WHERE k.key=ANY($1::text[])
        `, [KEYS]);
        const refKey = KEYS.find(k => keys.some(x => x.key === k));
        if (!refKey) {
          reports.push({ table: name, status: 'skipped', reason: 'No recognized project reference field' });
          continue;
        }
        const { rows: refs } = await client.query(`
          SELECT NULLIF(btrim(${cell('t')} ->> $1),'') AS ref,
            COUNT(*)::int AS occurrences,
            MIN(t.source_row_number) AS first_source_row,
            MAX(t.source_row_number) AS last_source_row,
            COUNT(DISTINCT t.source_sheet_id)::int AS source_sheet_count
          FROM ${table(name)} t
          GROUP BY NULLIF(btrim(${cell('t')} ->> $1),'')
        `, [refKey]);
        const unresolved = refs.filter(r => r.ref && !canonicalIds.has(r.ref));
        const entries = unresolved.map(r => {
          const info = classification(name, r.ref);
          const exactNumber = canonical.filter(p => p.project_no === r.ref);
          const caseId = canonical.filter(p => p.id.toLowerCase() === r.ref.toLowerCase());
          const caseNumber = canonical.filter(p => p.project_no && p.project_no.toLowerCase() === r.ref.toLowerCase());
          const possible = [...new Map([...exactNumber, ...caseId, ...caseNumber].map(p => [p.id, p])).values()];
          return { reference: r.ref, occurrences: r.occurrences,
            sourceEvidence: { firstRow: r.first_source_row, lastRow: r.last_source_row,
              sourceSheetCount: r.source_sheet_count },
            ...info,
            possibleCanonicalProjects: possible.slice(0, 5).map(p => ({ projectId: p.id,
              projectNo: p.project_no, projectName: p.project_name, status: p.project_status,
              sourceSheetId: p.source_sheet_id, sourceRow: p.source_row_number })),
            possibleMatchesTruncated: possible.length > 5,
            requiresManualApproval: true };
        });
        reports.push({ table: name, status: 'checked', referenceKey: refKey,
          unmatchedRows: entries.reduce((n, r) => n + r.occurrences, 0),
          distinctUnmatchedReferences: entries.length, entries });
      }
      await client.query('COMMIT');
      const review = new Map();
      for (const report of reports) for (const entry of report.entries || []) {
        const key = `${entry.category}:${entry.reference}`;
        if (!review.has(key)) review.set(key, { reference: entry.reference,
          category: entry.category, occurrences: 0, tables: [], decision: entry.decision,
          requiresManualApproval: true });
        const item = review.get(key);
        item.occurrences += entry.occurrences;
        item.tables.push(report.table);
      }
      const queue = [...review.values()].sort((a, b) => b.occurrences - a.occurrences);
      return res.status(200).json({ ok: true, source: 'supabase-preview', stage: '10',
        schema: SCHEMA, readOnly: true, status: 'manual-review-required',
        summary: { canonicalProjects: canonical.length,
          checkedTables: reports.filter(r => r.status === 'checked').length,
          skippedTables: reports.filter(r => r.status === 'skipped').length,
          unmatchedRows: reports.reduce((n, r) => n + (r.unmatchedRows || 0), 0),
          distinctReviewItems: queue.length }, reviewQueue: queue, tables: reports,
        nextSteps: [
          'Check the original Google Sheets rows for each unresolved PRJ reference.',
          'Confirm whether PRJ references represent missing, deleted, archived or legacy projects.',
          'Confirm __internal_*__ IDs represent studio work, not client projects.',
          'Confirm * means a global workflow in application code.',
          'Document explicit, manually approved decisions before implementing any mapping.'
        ], note: 'Read-only diagnostic. Possible matches are evidence, NOT approved mappings. No records were modified.' });
    } catch (error) {
      await client.query('ROLLBACK').catch(() => {});
      throw error;
    } finally { client.release(); }
  } catch (error) {
    console.error('Stage 10 report failed', { code: error?.code });
    return fail(res, 502, 'Could not complete Stage 10 reference report');
  } finally { if (pool) await pool.end().catch(() => {}); }
}
