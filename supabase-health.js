// Read-only Supabase connectivity check for Vercel Preview.
// This does not access application records or change Google Apps Script routes.
export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'GET') return res.status(405).json({ ok: false, error: 'Method not allowed' });
  if (process.env.VERCEL_ENV !== 'preview') return res.status(404).json({ ok: false, error: 'Not available' });
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) return res.status(503).json({ ok: false, error: 'Supabase server configuration missing' });
  try {
    const base = new URL(url);
    if (base.protocol !== 'https:' || !base.hostname.endsWith('.supabase.co') || base.pathname !== '/') {
      return res.status(503).json({ ok: false, error: 'Invalid Supabase project URL' });
    }
    // Read-only Auth service health check; no table data is exposed.
    const response = await fetch(new URL('/auth/v1/health', base), {
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
