
// Enlighten OS — Supabase Preview Project API
// Read-only testing endpoint. Production remains unchanged.
//
// GET /api/supabase-projects?check=connection
// GET /api/supabase-projects?check=session
// GET /api/supabase-projects?check=inventory
// GET /api/supabase-projects?projectId=PROJECT_ID

import { Pool } from 'pg';
import {
  readAppSession,
  cookieValue,
  verifyGoogleIdentity,
  signRequest,
  fetchAppsScript,
} from './index.js';

// Secure PostgreSQL connection using the Supabase CA certificate.
function databaseConnection(url) {
  const ca = String(process.env.SUPABASE_DB_CA || '')
    .replace(/\\n/g, '\n')
    .trim();

  if (
    !ca.includes('-----BEGIN CERTIFICATE-----') ||
    !ca.includes('-----END CERTIFICATE-----')
  ) {
    throw Object.assign(
      new Error('Database CA configuration missing or invalid'),
      { code: 'ERR_DB_CA_CONFIG' }
    );
  }

  const parsed = new URL(String(url || '').trim());

  if (!['postgres:', 'postgresql:'].includes(parsed.protocol)) {
    throw Object.assign(
      new Error('Invalid database URL protocol'),
      { code: 'ERR_INVALID_URL' }
    );
  }

  // Prevent connection-string SSL options from overriding our CA.
  for (const key of [
    'sslmode',
    'sslcert',
    'sslkey',
    'sslrootcert',
  ]) {
    parsed.searchParams.delete(key);
  }

  return {
    connectionString: parsed.toString(),
    ssl: {
      ca,
      rejectUnauthorized: true,
    },
  };
}

function createPool(databaseUrl) {
  return new Pool({
    ...databaseConnection(databaseUrl),
    max: 1,
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 1000,
  });
}

function respond(res, status, message) {
  return res.status(status).json({
    ok: false,
    error: { message },
  });
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Never expose this diagnostic API in Production.
  if (process.env.VERCEL_ENV !== 'preview') {
    return respond(res, 404, 'Not available');
  }

  if (req.method !== 'GET') {
    return respond(res, 405, 'Method not allowed');
  }

  const check = req.query?.check;
  const dbUrl = process.env.SUPABASE_DATABASE_URL;

  // --------------------------------------------------
  // 1. DATABASE CONNECTION TEST
  // --------------------------------------------------
  if (check === 'connection') {
    if (!dbUrl) {
      return respond(
        res,
        503,
        'Preview database configuration is missing'
      );
    }

    const pool = createPool(dbUrl);

    try {
      await pool.query(
        'SELECT 1 FROM enlighten_import.projects LIMIT 1'
      );

      return res.status(200).json({
        ok: true,
        source: 'supabase-postgresql',
        connected: true,
        schemaAccessible: true,
      });
    } catch (error) {
      console.error('Supabase connection diagnostic failed', {
        code: error?.code,
      });

      return respond(
        res,
        502,
        'Database connection or schema access failed'
      );
    } finally {
      await pool.end().catch(() => {});
    }
  }

  // --------------------------------------------------
  // 2. VERIFY LOGIN CONFIGURATION
  // --------------------------------------------------
  const secret = process.env.ENLIGHTEN_PROXY_SECRET;
  const audience = process.env.GOOGLE_CLIENT_ID;
  const appsScriptUrl = process.env.APPS_SCRIPT_URL;

  if (
    !secret ||
    secret.length < 32 ||
    !audience ||
    !appsScriptUrl ||
    !dbUrl
  ) {
    return respond(
      res,
      503,
      'Preview server configuration is incomplete'
    );
  }

  let identity = readAppSession(req, secret, audience);

  // --------------------------------------------------
  // 3. SESSION DIAGNOSTIC
  // --------------------------------------------------
  if (check === 'session') {
    return res.status(200).json({
      ok: true,
      data: {
        cookiePresent: Boolean(cookieValue(req)),
        signedIn: Boolean(identity),
        preview: true,
      },
    });
  }

  // Accept a verified Google ID token if supplied.
  const bearer = /^Bearer ([^\s]+)$/.exec(
    String(req.headers.authorization || '')
  );

  if (bearer) {
    try {
      identity = await verifyGoogleIdentity(
        bearer[1],
        audience
      );
    } catch {
      return respond(
        res,
        401,
        'Invalid Google identity token'
      );
    }
  }

  if (!identity) {
    return respond(
      res,
      401,
      'Sign in to the Preview website first'
    );
  }

  // --------------------------------------------------
  // 4. SUPABASE PROJECT INVENTORY
  // --------------------------------------------------
  // Returns counts only, not individual project data.
  if (check === 'inventory') {
    let pool;

    try {
      pool = createPool(dbUrl);

      const { rows } = await pool.query(`
        SELECT
          COUNT(*)::int AS total_rows,

          COUNT(*) FILTER (
            WHERE COALESCE(cells->>'projectId', '') = ''
          )::int AS missing_project_ids,

          COUNT(
            DISTINCT NULLIF(cells->>'projectId', '')
          )::int AS distinct_project_ids

        FROM enlighten_import.projects
      `);

      const counts = rows[0];

      const duplicateProjectIds = Math.max(
        0,
        counts.total_rows -
          counts.missing_project_ids -
          counts.distinct_project_ids
      );

      return res.status(200).json({
        ok: true,
        source: 'supabase-preview',
        readOnly: true,
        data: {
          ...counts,
          duplicate_project_ids: duplicateProjectIds,
          schema: 'enlighten_import',
          table: 'projects',
        },
      });
    } catch (error) {
      console.error('Supabase inventory diagnostic failed', {
        code: error?.code,
      });

      return respond(
        res,
        502,
        'Could not read Supabase project inventory'
      );
    } finally {
      if (pool) {
        await pool.end().catch(() => {});
      }
    }
  }

  // --------------------------------------------------
  // 5. INDIVIDUAL PROJECT LOOKUP
  // --------------------------------------------------
  const projectId = req.query?.projectId;

  if (
    typeof projectId !== 'string' ||
    !/^[A-Za-z0-9_.:-]{1,128}$/.test(projectId)
  ) {
    return respond(
      res,
      400,
      'Provide a valid projectId'
    );
  }

  // Check project authorization through the existing
  // Apps Script permissions system before returning data.
  try {
    const signed = signRequest(
      'getProjectWorkspace',
      { projectId },
      identity,
      secret
    );

    const response = await fetchAppsScript(
      appsScriptUrl,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify(signed),
        signal: AbortSignal.timeout(30000),
      }
    );

    const result = await response.json();

    if (
      !response.ok ||
      result?.ok !== true ||
      !result?.data
    ) {
      return respond(
        res,
        403,
        'Project access was not verified'
      );
    }
  } catch {
    return respond(
      res,
      502,
      'Could not verify project access'
    );
  }

  // --------------------------------------------------
  // 6. READ PROJECT FROM SUPABASE
  // --------------------------------------------------
  let pool;

  try {
    pool = createPool(dbUrl);

    const { rows } = await pool.query({
      text: `
        SELECT cells
        FROM enlighten_import.projects
        WHERE cells->>'projectId' = $1
        LIMIT 2
      `,
      values: [projectId],
    });

    if (rows.length === 0) {
      return respond(
        res,
        404,
        'Project not found in Supabase'
      );
    }

    if (rows.length > 1) {
      return respond(
        res,
        409,
        'Duplicate project IDs in Supabase'
      );
    }

    return res.status(200).json({
      ok: true,
      source: 'supabase-preview',
      data: rows[0].cells,
    });
  } catch (error) {
    console.error('Supabase projects query failed', {
      code: error?.code,
    });

    return respond(
      res,
      502,
      'Supabase database query failed'
    );
  } finally {
    if (pool) {
      await pool.end().catch(() => {});
    }
  }
}
