import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const APPS_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbzsB8YOAO0J8WY7h7sxThnG9Tz8r-ojaXJbMtPjcfCCQy4t5HVTVLMQKylZPsybHXH8/exec";

async function readRequestBody(req) {
  return await new Promise((resolve, reject) => {
    let body = "";
    req.setEncoding("utf8");
    req.on("data", chunk => { body += chunk; });
    req.on("end", () => resolve(body));
    req.on("error", reject);
  });
}

async function fetchAppsScript(url, options, maxRedirects = 8) {
  let currentUrl = url;
  let currentOptions = { ...options };

  for (let i = 0; i <= maxRedirects; i++) {
    const response = await fetch(currentUrl, {
      ...currentOptions,
      redirect: "manual"
    });

    if (![301, 302, 303, 307, 308].includes(response.status)) {
      return response;
    }

    const location = response.headers.get("location");
    if (!location) return response;

    currentUrl = new URL(location, currentUrl).toString();

    // Preserve the original method/body. This is important for Apps Script,
    // whose Web App endpoint commonly redirects to a googleusercontent URL.
    if (response.status === 303) {
      currentOptions = { ...currentOptions, method: "GET", body: undefined };
    }
  }

  throw new Error("Too many redirects while contacting Google Apps Script.");
}

const appsScriptProxy = {
  name: "enlighten-apps-script-proxy",
  configureServer(server) {
    server.middlewares.use("/api", async (req, res, next) => {
      try {
        const rawUrl = req.url || "/";
        const targetUrl = new URL(APPS_SCRIPT_URL);
        const incoming = new URL(rawUrl, "http://127.0.0.1");
        incoming.searchParams.forEach((value, key) => targetUrl.searchParams.set(key, value));

        const method = (req.method || "GET").toUpperCase();
        const options = { method, headers: {} };

        if (method !== "GET" && method !== "HEAD") {
          const body = await readRequestBody(req);
          options.body = body;
          options.headers["content-type"] = req.headers["content-type"] || "text/plain;charset=utf-8";
        }

        const response = await fetchAppsScript(targetUrl.toString(), options);
        const text = await response.text();

        res.statusCode = response.status;
        res.setHeader("Content-Type", response.headers.get("content-type") || "application/json; charset=utf-8");
        res.setHeader("Cache-Control", "no-store");
        res.end(text);
      } catch (error) {
        res.statusCode = 502;
        res.setHeader("Content-Type", "application/json; charset=utf-8");
        res.end(JSON.stringify({
          ok: false,
          error: { message: `Google Apps Script proxy error: ${error.message}` }
        }));
      }
    });
  }
};

export default defineConfig({
  plugins: [react(), appsScriptProxy],
  server: {
    host: "127.0.0.1",
    port: 5173,
    strictPort: true
  }
});
