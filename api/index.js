// enLIGHTen OS v2.11.13: Vercel -> Google Apps Script JSON proxy.
// Use the existing Apps Script Web App deployment (Version 26).
const APPS_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbzGv61Bh4uJL2RUMPv7FAQp26mEBNXzCbPFl6TSndx768_kzaBV74GGinUnqPocH93P/exec";

async function fetchAppsScript(url, options, maxRedirects = 8) {
  let currentUrl = url;
  let currentOptions = { ...options, headers: { ...(options.headers || {}) } };
  for (let i = 0; i <= maxRedirects; i++) {
    const response = await fetch(currentUrl, { ...currentOptions, redirect: "manual" });
    if (![301, 302, 303, 307, 308].includes(response.status)) return response;
    const location = response.headers.get("location");
    if (!location) throw new Error(`Google redirect ${response.status} had no Location header`);
    const nextUrl = new URL(location, currentUrl);
    if (nextUrl.protocol !== "https:" || !(
      nextUrl.hostname === "script.google.com" ||
      nextUrl.hostname === "script.googleusercontent.com" ||
      nextUrl.hostname.endsWith(".googleusercontent.com")
    )) throw new Error("Unexpected Google Apps Script redirect destination");
    currentUrl = nextUrl.toString();
    const method = (currentOptions.method || "GET").toUpperCase();
    if (response.status === 303 || ((response.status === 301 || response.status === 302) && method === "POST")) {
      // Apps Script's ContentService redirects to a read-only content URL.
      currentOptions = { method: "GET", headers: {} };
    }
  }
  throw new Error("Too many redirects while contacting Google Apps Script");
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store, max-age=0");
  try {
    const method = (req.method || "GET").toUpperCase();
    if (!["GET", "POST"].includes(method)) {
      res.setHeader("Allow", "GET, POST");
      return res.status(405).json({ ok: false, error: { message: "Only GET and POST are supported" } });
    }
    const target = new URL(APPS_SCRIPT_URL);
    for (const [key, value] of Object.entries(req.query || {})) {
      if (Array.isArray(value)) value.forEach(v => target.searchParams.append(key, String(v)));
      else if (value != null) target.searchParams.set(key, String(value));
    }
    const options = { method, headers: {} };
    if (method === "POST") {
      let body = req.body;
      if (body == null) return res.status(400).json({ ok: false, error: { message: "Missing POST body" } });
      if (typeof body !== "string") body = JSON.stringify(body);
      options.body = body;
      options.headers["Content-Type"] = "text/plain;charset=utf-8";
    }
    const upstream = await fetchAppsScript(target.toString(), options);
    const raw = await upstream.text();
    let parsed;
    try { parsed = JSON.parse(raw); } catch (_) {
      return res.status(502).json({
        ok: false,
        error: {
          message: `Apps Script returned non-JSON (HTTP ${upstream.status}). Check deployment access and Vercel logs.`,
          upstreamStatus: upstream.status
        }
      });
    }
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    return res.status(upstream.ok ? 200 : 502).send(JSON.stringify(parsed));
  } catch (err) {
    return res.status(502).json({ ok: false, error: { message: `Apps Script proxy error: ${err.message}` } });
  }
}
