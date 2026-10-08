enLIGHTen OS v2.11.13 - Windows Google Sheets Backend Fix

The Google Apps Script health endpoint is working.
This build therefore uses a local Vite proxy so the browser never contacts
Google Apps Script directly. This avoids browser CORS/redirect problems.

Windows:
1. Open Command Prompt in this folder:
   project_update\Frontend
2. Run:
   npm install
3. Run:
   npm run dev
4. Open:
   http://127.0.0.1:5173

Do NOT create an .env file for the Apps Script URL in this build.
The URL is configured in vite.config.js and is proxied through /api.
