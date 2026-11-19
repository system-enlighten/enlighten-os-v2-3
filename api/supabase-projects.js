// Preview-only, read-only Supabase project record endpoint.
// GET /api/supabase-projects?projectId=YOUR_PROJECT_ID
// Requires the existing Enlighten session or a Google ID token and
// independently authorizes the requested project via Apps Script.
import { Pool } from 'pg';
import { readAppSession, cookieValue, verifyGoogleIdentity, signRequest, fetchAppsScript } from './index.js';

// Trust the Supabase database CA supplied only to the Vercel server runtime.
// Do not disable TLS verification or expose this certificate via VITE_ variables.
function databaseConnection(url) {
  const ca = String(process.env.SUPABASE_DB_CA || '').replace(/\\n/g, '\n').trim();
  if (!ca || !ca.includes('-----BEGIN CERTIFICATE-----') || !ca.includes('-----END CERTIFICATE-----')) {
    throw Object.assign(new Error('Database CA configuration missing or invalid'), { code: 'ERR_DB_CA_CONFIG' });
  }
  const parsed = new URL(url.trim());
  if (!['postgres:', 'postgresql:'].includes(parsed.protocol)) {
    throw Object.assign(new Error('Invalid database URL protocol'), { code: 'ERR_INVALID_URL' });
  }
  // node-postgres may override the supplied ssl object if these URL options exist.
  for (const key of ['sslmode', 'sslcert', 'sslkey', 'sslrootcert']) parsed.searchParams.delete(key);
  return { connectionString: parsed.toString(), ssl: { ca, rejectUnauthorized: true } };
}

function respond(res, status, message) {
  return res.status(status).json({ ok: false, error: { message } });
}
export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  if (process.env.VERCEL_ENV !== 'preview') return respond(res, 404, 'Not available');
  if (req.method !== 'GET') return respond(res, 405, 'Method not allowed');
  // Connection-only diagnostic. Never returns records, credentials or SQL errors.
  // The project-specific route below continues to require authentication.
  if (req.query?.check === 'connection') {
    const db = process.env.SUPABASE_DATABASE_URL;
    if (!db) return respond(res, 503, 'Preview database configuration is missing');
    let diagnosticPool;
    try {
      const parsed = new URL(db.trim());
      if (!['postgres:', 'postgresql:'].includes(parsed.protocol))
        return respond(res, 503, 'Invalid database connection configuration');
      diagnosticPool = new Pool({
        ...databaseConnection(db),
        max: 1,
        connectionTimeoutMillis: 10000,
        idleTimeoutMillis: 1000,
      });
      await diagnosticPool.query('SELECT 1 FROM enlighten_import.projects LIMIT 1');
      return res.status(200).json({ ok: true, source: 'supabase-postgresql', connected: true, schemaAccessible: true });
    } catch (error) {
      console.error('Supabase connection diagnostic failed', { code: error?.code });
      return respond(res, 502, 'Database connection or schema access failed');
    } finally {
      if (diagnosticPool) await diagnosticPool.end().catch(() => {});
    }
  }
  const secret = process.env.ENLIGHTEN_PROXY_SECRET;
  const audience = process.env.GOOGLE_CLIENT_ID;
  const appsScriptUrl = process.env.APPS_SCRIPT_URL;
  const dbUrl = process.env.SUPABASE_DATABASE_URL;
  if (!secret || secret.length < 32 || !audience || !appsScriptUrl || !dbUrl)
    return respond(res, 503, 'Preview server configuration is incomplete');
  // Both API routes now use the exact same session reader and verifier.
  let identity = readAppSession(req, secret, audience);
  // Safe diagnostic: no tokens, emails, cookie values, or secrets returned.
  // Compare this with /api?action=authSession on the SAME hostname.
  if (req.query?.check === 'session') {
    return res.status(200).json({ ok: true, data: {
      cookiePresent: Boolean(cookieValue(req)), signedIn: Boolean(identity),
      preview: process.env.VERCEL_ENV === 'preview'
    }});
  }
  const bearer = /^Bearer ([^\s]+)$/.exec(String(req.headers.authorization || ''));
  if (bearer) {
    try { identity = await verifyGoogleIdentity(bearer[1], audience); }
    catch { return respond(res, 401, 'Invalid Google identity token'); }
  }
  if (!identity) return respond(res, 401, 'Sign in to the Preview website first');
  // Authenticated, read-only import inventory. No project records are exposed.
  if (req.query?.check === 'inventory') {
    let inventoryPool;
    try {
      inventoryPool = new Pool({
        ...databaseConnection(dbUrl), max: 1,
        connectionTimeoutMillis: 10000, idleTimeoutMillis: 1000,
      });
      const { rows } = await inventoryPool.query(`
        SELECT count(*)::int AS total_rows,
          count(*) FILTER (WHERE coalesce(cells->>'projectId','') = '')::int AS missing_project_ids,
          count(DISTINCT NULLIF(cells->>'projectId',''))::int AS distinct_project_ids
        FROM enlighten_import.projects
      `);
      const counts = rows[0];
      return res.status(200).json({
        ok: true, source: 'supabase-preview', readOnly: true,
        data: { ...counts,
          duplicate_project_ids: Math.max(0, counts.total_rows - counts.missing_project_ids - counts.distinct_project_ids),
          schema: 'enlighten_import', table: 'projects' }
      });
    } catch (error) {
      console.error('Supabase inventory diagnostic failed', { code: error?.code });
      return respond(res, 502, 'Could not read Supabase project inventory');
    } finally {
      if (inventoryPool) await inventoryPool.end().catch(() => {});
    }
  }
  const projectId = req.query?.projectId;
  if (typeof projectId !== 'string' || !/^[A-Za-z0-9_.:-]{1,128}$/.test(projectId))
    return respond(res, 400, 'Provide a valid projectId');

  // Authorize every requested project using the existing server-side policy.
  // Do not rely on a user-supplied email or a public projects list.
  try {
    const signed = signRequest('getProjectWorkspace', { projectId }, identity, secret);
    const check = await fetchAppsScript(appsScriptUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(signed),
      signal: AbortSignal.timeout(30000),
    });
    const result = await check.json();
    if (!check.ok || result?.ok !== true || !result?.data)
      return respond(res, 403, 'Project access was not verified');
  } catch {
    return respond(res, 502, 'Could not verify project access');
  }

  let pool;
  try {
    const uri = new URL(dbUrl.trim());
    if (!['postgres:', 'postgresql:'].includes(uri.protocol))
      return respond(res, 503, 'Invalid database connection configuration');
    pool = new Pool({
      ...databaseConnection(dbUrl),
      max: 1,
      connectionTimeoutMillis: 10000,
      idleTimeoutMillis: 1000,
    });
    const { rows } = await pool.query({
      text: `SELECT cells FROM enlighten_import.projects
             WHERE cells->>'projectId' = $1 LIMIT 2`,
      values: [projectId],
    });
    if (rows.length === 0) return respond(res, 404, 'Project not found in Supabase');
    if (rows.length !== 1) return respond(res, 409, 'Duplicate project IDs in Supabase');
    return res.status(200).json({ ok: true, source: 'supabase-preview', data: rows[0].cells });
  } catch (error) {
    console.error('Supabase projects query failed', { code: error?.code });
    return respond(res, 502, 'Supabase database query failed');
  } finally {
    if (pool) await pool.end().catch(() => {});
  }
}
