const APPS_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbzsB8YOAO0J8WY7h7sxThnG9Tz8r-ojaXJbMtPjcfCCQy4t5HVTVLMQKylZPsybHXH8/exec";

async function fetchAppsScript(url, options, maxRedirects = 8) {
  let currentUrl = url;
  let currentOptions = { ...options };
  for (let i = 0; i <= maxRedirects; i++) {
    const response = await fetch(currentUrl, { ...currentOptions, redirect: "manual" });
    if (![301, 302, 303, 307, 308].includes(response.status)) return response;
    const location = response.headers.get("location");
    if (!location) return response;
    currentUrl = new URL(location, currentUrl).toString();
    if (response.status === 303) currentOptions = { ...currentOptions, method: "GET", body: undefined };
  }
  throw new Error("Too many redirects while contacting Google Apps Script.");
}

export default async function handler(req, res) {
  try {
    const targetUrl = new URL(APPS_SCRIPT_URL);
    if (req.query) {
      for (const [key, value] of Object.entries(req.query)) {
        if (Array.isArray(value)) value.forEach(v => targetUrl.searchParams.append(key, String(v)));
        else if (value !== undefined) targetUrl.searchParams.set(key, String(value));
      }
    }

    const method = (req.method || "GET").toUpperCase();
    const options = { method, headers: {} };
    if (method !== "GET" && method !== "HEAD") {
      let body = req.body;
      if (body !== undefined && body !== null) {
        if (typeof body !== "string") body = JSON.stringify(body);
        options.body = body;
        options.headers["content-type"] = req.headers["content-type"] || "text/plain;charset=utf-8";
      }
    }

    const response = await fetchAppsScript(targetUrl.toString(), options);
    const text = await response.text();
    res.status(response.status);
    res.setHeader("Content-Type", response.headers.get("content-type") || "application/json; charset=utf-8");
    res.setHeader("Cache-Control", "no-store, max-age=0");
    return res.send(text);
  } catch (error) {
    res.status(502).setHeader("Content-Type", "application/json; charset=utf-8");
    return res.send(JSON.stringify({ ok: false, error: { message: `Google Apps Script proxy error: ${error.message}` } }));
  }
}
