// Preview-only, read-only Supabase project record endpoint.
// GET /api/supabase-projects?projectId=YOUR_PROJECT_ID
// Requires the existing Enlighten session or a Google ID token and
// independently authorizes the requested project via Apps Script.
import { Pool } from 'pg';
import { verifyAppSession, verifyGoogleIdentity, signRequest, fetchAppsScript } from './index.js';

const cookieName = 'enlighten_session';
function sessionCookie(req) {
  return String(req.headers.cookie || '').split(';').map(x => x.trim())
    .find(x => x.startsWith(cookieName + '='))?.slice(cookieName.length + 1) || '';
}
function respond(res, status, message) {
  return res.status(status).json({ ok: false, error: { message } });
}
export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  if (process.env.VERCEL_ENV !== 'preview') return respond(res, 404, 'Not available');
  if (req.method !== 'GET') return respond(res, 405, 'Method not allowed');
  const secret = process.env.ENLIGHTEN_PROXY_SECRET;
  const audience = process.env.GOOGLE_CLIENT_ID;
  const appsScriptUrl = process.env.APPS_SCRIPT_URL;
  const dbUrl = process.env.SUPABASE_DATABASE_URL;
  if (!secret || secret.length < 32 || !audience || !appsScriptUrl || !dbUrl)
    return respond(res, 503, 'Preview server configuration is incomplete');
  const host = String(req.headers.host || '').toLowerCase();
  let identity = verifyAppSession(sessionCookie(req), secret, audience, host);
  const bearer = /^Bearer ([^\s]+)$/.exec(String(req.headers.authorization || ''));
  if (bearer) {
    try { identity = await verifyGoogleIdentity(bearer[1], audience); }
    catch { return respond(res, 401, 'Invalid Google identity token'); }
  }
  if (!identity) return respond(res, 401, 'Sign in to the Preview website first');
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
      connectionString: dbUrl.trim(),
      ssl: { rejectUnauthorized: true },
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
