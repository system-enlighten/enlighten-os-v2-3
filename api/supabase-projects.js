
import { Pool } from 'pg';

import {
  readAppSession,
  cookieValue,
  verifyGoogleIdentity,
  signRequest,
  fetchAppsScript,
} from './index.js';

// Enlighten OS — Supabase Preview API
// Production remains on the existing backend.
//
// Available endpoints:
// ?check=connection
// ?check=session
// ?check=inventory
// ?projectId=YOUR_PROJECT_ID
// ?list=projects&page=1&limit=10 (authorized, paginated)

function respond(res, status, message) {
  return res.status(status).json({
    ok: false,
    error: { message },
  });
}

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

  // Prevent URL SSL parameters from overriding
  // the explicitly configured CA certificate.
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

function createPool(url) {
  return new Pool({
    ...databaseConnection(url),
    max: 1,
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 1000,
  });
}

async function closePool(pool) {
  if (pool) {
    await pool.end().catch(() => {});
  }
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // This API is intentionally limited to Preview.
  if (process.env.VERCEL_ENV !== 'preview') {
    return respond(res, 404, 'Not available');
  }

  if (req.method !== 'GET') {
    return respond(res, 405, 'Method not allowed');
  }

  const check = req.query?.check;
  const dbUrl = process.env.SUPABASE_DATABASE_URL;

  // ================================================
  // 1. DATABASE CONNECTION DIAGNOSTIC
  // ================================================
  if (check === 'connection') {
    if (!dbUrl) {
      return respond(
        res,
        503,
        'Preview database configuration is missing'
      );
    }

    let pool;

    try {
      pool = createPool(dbUrl);

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
      console.error('Supabase connection failed', {
        code: error?.code,
      });

      return respond(
        res,
        502,
        'Database connection or schema access failed'
      );
    } finally {
      await closePool(pool);
    }
  }

  // ================================================
  // 2. SERVER CONFIGURATION
  // ================================================
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

  let identity;

  try {
    identity = readAppSession(req, secret, audience);
  } catch (error) {
    console.error('Session verification failed', {
      code: error?.code,
    });

    return respond(res, 401, 'Invalid session');
  }

  // ================================================
  // 3. SESSION DIAGNOSTIC
  // ================================================
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

  // Optional Google ID token authentication.
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

  // Reuse the existing Apps Script project-level authorization.
  async function canReadProject(projectId) {
    const signed = signRequest(
      'getProjectWorkspace', { projectId }, identity, secret
    );
    const response = await fetchAppsScript(appsScriptUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(signed),
      signal: AbortSignal.timeout(15000),
    });
    const result = await response.json();
    return response.ok && result?.ok === true && Boolean(result?.data);
  }

  // ================================================
  // 4A. PAGINATED, AUTHORIZED PROJECT LIST (READ ONLY)
  // ================================================
  if (req.query?.list === 'projects') {
    const page = Number(req.query?.page ?? 1);
    const limit = Number(req.query?.limit ?? 10);
    if (!Number.isSafeInteger(page) || page < 1 || page > 10000 ||
        !Number.isSafeInteger(limit) || limit < 1 || limit > 10) {
      return respond(res, 400, 'page must be positive and limit must be 1 to 10');
    }

    let pool;
    try {
      pool = createPool(dbUrl);
      // Fetch one extra row to determine whether another page exists.
      const { rows } = await pool.query({
        text: `SELECT cells FROM enlighten_import.projects
               ORDER BY cells->>'projectId' ASC
               LIMIT $1 OFFSET $2`,
        values: [limit + 1, (page - 1) * limit],
      });
      const candidates = rows.slice(0, limit);
      const authorized = [];
      // Fail closed on authorization-service errors; never expose unchecked rows.
      for (const row of candidates) {
        const id = row.cells?.projectId;
        if (typeof id !== 'string' || !/^[A-Za-z0-9_.:-]{1,128}$/.test(id)) continue;
        try {
          if (await canReadProject(id)) authorized.push(row.cells);
        } catch (error) {
          console.error('Project list authorization unavailable', { code: error?.code });
          return respond(res, 502, 'Could not verify project access');
        }
      }
      return res.status(200).json({
        ok: true,
        source: 'supabase-preview',
        readOnly: true,
        data: authorized,
        pagination: {
          page,
          limit,
          scanned: candidates.length,
          returned: authorized.length,
          hasMore: rows.length > limit,
          nextPage: rows.length > limit ? page + 1 : null,
        },
      });
    } catch (error) {
      console.error('Supabase project list failed', { code: error?.code });
      return respond(res, 502, 'Could not read authorized Supabase projects');
    } finally {
      await closePool(pool);
    }
  }

  // ================================================
  // 4. SUPABASE INVENTORY DIAGNOSTIC
  // ================================================
  // Counts only. No project records are returned.
  if (check === 'inventory') {
    let pool;

    try {
      pool = createPool(dbUrl);

      const { rows } = await pool.query(`
        SELECT
          COUNT(*)::int AS total_rows,

          COUNT(*) FILTER (
            WHERE NULLIF(
              BTRIM(cells->>'projectId'),
              ''
            ) IS NULL
          )::int AS missing_project_ids,

          COUNT(
            DISTINCT NULLIF(
              BTRIM(cells->>'projectId'),
              ''
            )
          )::int AS distinct_project_ids

        FROM enlighten_import.projects
      `);

      const counts = rows[0];

      const duplicateRows =
        counts.total_rows -
        counts.missing_project_ids -
        counts.distinct_project_ids;

      return res.status(200).json({
        ok: true,
        source: 'supabase-preview',
        readOnly: true,
        data: {
          schema: 'enlighten_import',
          table: 'projects',
          total_rows: counts.total_rows,
          missing_project_ids:
            counts.missing_project_ids,
          distinct_project_ids:
            counts.distinct_project_ids,
          duplicate_project_ids: Math.max(
            0,
            duplicateRows
          ),
        },
      });
    } catch (error) {
      console.error('Supabase inventory failed', {
        code: error?.code,
      });

      return respond(
        res,
        502,
        'Could not read Supabase project inventory'
      );
    } finally {
      await closePool(pool);
    }
  }

  // ================================================
  // 5. VALIDATE PROJECT ID
  // ================================================
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

  // ================================================
  // 6. VERIFY PROJECT ACCESS VIA APPS SCRIPT
  // ================================================
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
  } catch (error) {
    console.error('Project authorization failed', {
      code: error?.code,
    });

    return respond(
      res,
      502,
      'Could not verify project access'
    );
  }

  // ================================================
  // 7. READ AUTHORIZED PROJECT FROM SUPABASE
  // ================================================
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
      readOnly: true,
      data: rows[0].cells,
    });
  } catch (error) {
    console.error('Supabase project query failed', {
      code: error?.code,
    });

    return respond(
      res,
      502,
      'Supabase database query failed'
    );
  } finally {
    await closePool(pool);
  }
}
