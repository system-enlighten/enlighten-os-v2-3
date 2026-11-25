// Read-only Supabase connectivity check. Available only on Vercel Preview.
export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'GET') return res.status(405).json({ ok: false, error: 'Method not allowed' });
  if (process.env.VERCEL_ENV !== 'preview') return res.status(404).json({ ok: false, error: 'Not available' });

  const rawUrl = (process.env.SUPABASE_URL || '').trim();
  const key = (process.env.SUPABASE_SECRET_KEY || '').trim();
  if (!rawUrl || !key) return res.status(503).json({ ok: false, error: 'Supabase server configuration missing' });

  let base;
  try {
    base = new URL(rawUrl);
  } catch {
    return res.status(503).json({ ok: false, error: 'Invalid Supabase project URL', reason: 'URL cannot be parsed' });
  }
  const hostname = base.hostname.toLowerCase();
  const validHost = /^[a-z0-9-]+\.supabase\.co$/.test(hostname);
  const validPath = ['/', '/rest/v1', '/rest/v1/'].includes(base.pathname);
  if (base.protocol !== 'https:' || !validHost || !validPath || base.username || base.password || base.port || base.search || base.hash) {
    return res.status(503).json({ ok: false, error: 'Invalid Supabase project URL', reason: 'Expected https://PROJECT_REF.supabase.co' });
  }

  try {
    const response = await fetch(`https://${hostname}/auth/v1/health`, {
      method: 'GET',
      headers: { apikey: key },
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) return res.status(502).json({ ok: false, error: 'Supabase health check failed', status: response.status });
    return res.status(200).json({ ok: true, service: 'supabase-auth', connected: true });
  } catch {
    return res.status(502).json({ ok: false, error: 'Unable to reach Supabase' });
  }
}
