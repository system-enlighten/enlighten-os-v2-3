import { Pool } from 'pg';
import { readAppSession } from './index.js';

// Stage 11 — Preview-only, admin-only, READ-ONLY source verification worksheet.
// Save as api/supabase-stage11.js on branch supabase-migration.
// This endpoint does NOT access live Google Sheets or approve mappings.
const SCHEMA = 'enlighten_import';
const TARGETS = ['floor_zones', 'drawing_register', 'files', 'design_tasks', 'wih',
  'line_of_work', 'workflow_delegations', 'project_roles', 'received_drawings',
  'issued_drawings', 'project_contacts', 'design_dashboard', 'technical_workbooks',
  'studio_attendance'];
const KEYS = ['projectId', 'project_id', 'Project ID', 'projectID'];
const q = s => '"' + s.replace(/"/g, '""') + '"';
const tbl = name => `${q(SCHEMA)}.${q(name)}`;
const errorResponse = (res, status, message) =>
  res.status(status).json({ ok: false, error: { message } });
const cells = alias => `CASE WHEN jsonb_typeof(${alias}.cells::jsonb) = 'object' THEN ${alias}.cells::jsonb ELSE '{}'::jsonb END`;

function classify(tableName, reference) {
  if (tableName === 'workflow_delegations' && reference === '*')
    return { category: 'global-workflow', proposedAction: 'VERIFY_WILDCARD_IN_APP_CODE' };
  if (/^__internal_.*__$/.test(reference))
    return { category: 'internal-work', proposedAction: 'VERIFY_INTERNAL_WORK_OWNER_AND_SCOPE' };
  return { category: 'unresolved-project', proposedAction: 'VERIFY_ORIGINAL_GOOGLE_SHEETS_ROW' };
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'private, no-store, max-age=0');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  if (process.env.VERCEL_ENV !== 'preview') return errorResponse(res, 404, 'Not available');
  if (req.method !== 'GET') return errorResponse(res, 405, 'Method not allowed');
  const secret = process.env.ENLIGHTEN_PROXY_SECRET;
  const audience = process.env.GOOGLE_CLIENT_ID;
  const admin = String(process.env.MIGRATION_ADMIN_EMAIL || '').trim().toLowerCase();
  if (!secret || !audience || !admin || !process.env.SUPABASE_DATABASE_URL)
    return errorResponse(res, 503, 'Preview migration audit configuration incomplete');
  const identity = readAppSession(req, secret, audience);
  if (!identity) return errorResponse(res, 401, 'Sign in to Preview first');
  if (String(identity.email || '').trim().toLowerCase() !== admin)
    return errorResponse(res, 403, 'Migration audit restricted to configured administrator');
  const ca = String(process.env.SUPABASE_DB_CA || '').replace(/\\n/g, '\n').trim();
  if (!ca.includes('-----BEGIN CERTIFICATE-----') || !ca.includes('-----END CERTIFICATE-----'))
    return errorResponse(res, 503, 'Database CA configuration incomplete');

  let pool;
  try {
    const url = new URL(process.env.SUPABASE_DATABASE_URL.trim());
    if (!['postgres:', 'postgresql:'].includes(url.protocol))
      return errorResponse(res, 503, 'Invalid database URL');
    for (const key of ['sslmode', 'sslcert', 'sslkey', 'sslrootcert']) url.searchParams.delete(key);
    pool = new Pool({ connectionString: url.toString(),
      ssl: { ca, rejectUnauthorized: true }, max: 1,
      connectionTimeoutMillis: 10000, statement_timeout: 20000 });
    const client = await pool.connect();
    try {
      await client.query('BEGIN READ ONLY');
      const { rows: cols } = await client.query(`
        SELECT table_name, column_name, data_type FROM information_schema.columns
        WHERE table_schema = $1 AND table_name = ANY($2::text[])
      `, [SCHEMA, ['projects', ...TARGETS]]);
      const columns = new Map();
      for (const c of cols) {
        if (!columns.has(c.table_name)) columns.set(c.table_name, new Map());
        columns.get(c.table_name).set(c.column_name, c.data_type);
      }
      const hasCells = name => ['json', 'jsonb'].includes(columns.get(name)?.get('cells'));
      if (!hasCells('projects')) {
        await client.query('ROLLBACK');
        return errorResponse(res, 422, 'Imported projects cells unavailable');
      }
      const { rows: projectKeys } = await client.query(`
        SELECT DISTINCT k.key FROM ${tbl('projects')} p
        CROSS JOIN LATERAL jsonb_object_keys(${cells('p')}) AS k(key)
        WHERE k.key = ANY($1::text[])
      `, [KEYS]);
      const projectIdKey = KEYS.find(k => projectKeys.some(r => r.key === k));
      if (!projectIdKey) {
        await client.query('ROLLBACK');
        return errorResponse(res, 422, 'Project ID field not found');
      }
      const { rows: projects } = await client.query(`
        SELECT NULLIF(btrim(${cells('p')} ->> $1), '') AS id,
          NULLIF(btrim(${cells('p')} ->> 'projectNo'), '') AS project_no,
          NULLIF(btrim(${cells('p')} ->> 'projectName'), '') AS project_name,
          NULLIF(btrim(${cells('p')} ->> 'projectStatus'), '') AS status,
          p.source_sheet_id, p.source_row_number
        FROM ${tbl('projects')} p
      `, [projectIdKey]);
      const validIds = new Set(projects.map(p => p.id).filter(Boolean));
      const reports = [];
      const reviewMap = new Map();
      for (const name of TARGETS) {
        if (!hasCells(name)) {
          reports.push({ table: name, status: 'skipped', reason: 'Table or JSON cells unavailable' });
          continue;
        }
        const { rows: keys } = await client.query(`
          SELECT DISTINCT k.key FROM ${tbl(name)} t
          CROSS JOIN LATERAL jsonb_object_keys(${cells('t')}) AS k(key)
          WHERE k.key = ANY($1::text[])
        `, [KEYS]);
        const refKey = KEYS.find(k => keys.some(r => r.key === k));
        if (!refKey) {
          reports.push({ table: name, status: 'skipped', reason: 'No recognized project reference field' });
          continue;
        }
        // Return only source pointers and reference values, not private row payloads.
        const { rows } = await client.query(`
          SELECT NULLIF(btrim(${cells('t')} ->> $1), '') AS reference,
            t.source_sheet_id, t.source_row_number
          FROM ${tbl(name)} t
          WHERE NULLIF(btrim(${cells('t')} ->> $1), '') IS NOT NULL
          ORDER BY t.source_row_number NULLS LAST
        `, [refKey]);
        let unmatched = 0;
        for (const r of rows) {
          if (validIds.has(r.reference)) continue;
          unmatched++;
          const info = classify(name, r.reference);
          const mapKey = `${info.category}:${r.reference}`;
          if (!reviewMap.has(mapKey)) reviewMap.set(mapKey, {
            reference: r.reference, category: info.category,
            proposedAction: info.proposedAction, occurrences: 0,
            sourceLocations: [], tables: new Set(),
            possibleCanonicalProjects: [], verifiedAgainstLiveSheets: false,
            manuallyApproved: false, safeToMapAutomatically: false
          });
          const item = reviewMap.get(mapKey);
          item.occurrences++;
          item.tables.add(name);
          if (item.sourceLocations.length < 25) item.sourceLocations.push({
            table: name, sourceSheetId: r.source_sheet_id,
            sourceRow: r.source_row_number
          });
        }
        reports.push({ table: name, status: 'checked', referenceKey: refKey,
          unmatchedOccurrences: unmatched });
      }
      await client.query('COMMIT');
      const reviewQueue = [...reviewMap.values()].map(item => {
        const possible = projects.filter(p => p.id && (
          p.project_no === item.reference ||
          p.id.toLowerCase() === item.reference.toLowerCase() ||
          (p.project_no && p.project_no.toLowerCase() === item.reference.toLowerCase())
        ));
        return { ...item, tables: [...item.tables],
          sourceLocationsTruncated: item.occurrences > item.sourceLocations.length,
          possibleCanonicalProjects: possible.slice(0, 5).map(p => ({
            projectId: p.id, projectNo: p.project_no,
            projectName: p.project_name, status: p.status,
            sourceSheetId: p.source_sheet_id, sourceRow: p.source_row_number
          })),
          possibleMatchesTruncated: possible.length > 5,
          reviewChecklist: item.category === 'unresolved-project'
            ? ['Locate source rows in original Google Sheets',
               'Check archived/deleted/legacy projects',
               'Confirm whether to retain as historical reference or approve explicit mapping']
            : item.category === 'internal-work'
              ? ['Confirm internal work owner and intended scope',
                 'Do not convert internal identifier into a client project ID']
              : ['Inspect application code for wildcard semantics',
                 'Confirm whether global delegation intentionally applies to all projects']
        };
      }).sort((a, b) => b.occurrences - a.occurrences);
      const categories = Object.fromEntries(['unresolved-project', 'internal-work', 'global-workflow']
        .map(category => [category, reviewQueue.filter(x => x.category === category)
          .reduce((n, x) => n + x.occurrences, 0)]));
      return res.status(200).json({
        ok: true, source: 'supabase-preview', stage: '11', schema: SCHEMA,
        readOnly: true, approvalRequired: true, status: 'external-source-verification-required',
        summary: { canonicalProjects: validIds.size,
          checkedTables: reports.filter(x => x.status === 'checked').length,
          skippedTables: reports.filter(x => x.status === 'skipped').length,
          unmatchedOccurrences: reviewQueue.reduce((n, x) => n + x.occurrences, 0),
          distinctReviewItems: reviewQueue.length, categories },
        reviewQueue, tables: reports,
        nextSteps: [
          'Use sourceSheetId and sourceRow to locate each record in the original Google Sheets export.',
          'Manually determine whether PRJ-000007, PRJ-000008 and PRJ-000009 were deleted, archived, or omitted.',
          'Verify __internal_*__ identifiers and wildcard * against application semantics.',
          'Record explicit approval decisions outside this endpoint; do not auto-map or delete records.',
          'After manual verification, implement a separate reviewed migration plan and tests.'
        ],
        note: 'Imported Supabase data only. This report does NOT verify live Google Sheets or application wildcard semantics. No data was modified.'
      });
    } catch (err) {
      await client.query('ROLLBACK').catch(() => {});
      throw err;
    } finally { client.release(); }
  } catch (err) {
    console.error('Stage 11 report failed', { code: err?.code });
    return errorResponse(res, 502, 'Could not complete Stage 11 source verification report');
  } finally { if (pool) await pool.end().catch(() => {}); }
}
