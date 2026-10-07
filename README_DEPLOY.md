# enLIGHTen OS v2.3 — Vercel deployment

This package contains the current frontend from `enLIGHTen_OS_v2.3_google_sheets_projects_connected.jsx`.

## Important
The frontend is already configured with the live Google Apps Script Web App endpoint used by the current v2.3 frontend. Do not replace it unless your Apps Script `/exec` URL changes.

## Vercel setup — easiest method
1. Sign in to Vercel.
2. Choose **Add New → Project**.
3. If using GitHub, upload this project to a GitHub repository first, then import that repository in Vercel.
4. Framework Preset: **Vite**.
5. Build Command: `npm run build`.
6. Output Directory: `dist`.
7. Install Command: `npm install`.
8. Click **Deploy**.
9. Vercel will provide a public `vercel.app` URL.

## Local test (optional)
Run:
`npm install`
`npm run dev`

## Backend
The app's current backend URL is the Google Apps Script Web App `/exec` endpoint hardcoded in `src/App.jsx`.
