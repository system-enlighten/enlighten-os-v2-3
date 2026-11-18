# Enlighten OS — Supabase Preview Integration

This is a copy of the user-uploaded `supabase-migration` branch with one new file:
`api/supabase-projects.js`.

## Required Preview-only Vercel environment variables
- `SUPABASE_DATABASE_URL`: PostgreSQL session pooler URI, including percent-encoded password
- `ENLIGHTEN_PROXY_SECRET`, `GOOGLE_CLIENT_ID`, `APPS_SCRIPT_URL`: existing auth/backend variables

Never commit connection strings, passwords, service keys, or tokens to GitHub.

## Test
1. Commit changes to `supabase-migration`, not `main`.
2. Wait for the Vercel Preview deployment.
3. Sign in to the Preview website with Google.
4. Open `/api/supabase-projects?projectId=EXISTING_PROJECT_ID` on the same Preview host.
5. Expected: `ok:true` with one authorized project. A `401` means not signed in, `403` means the existing backend did not authorize access, `502` means the access backend or database failed.

The endpoint is Preview-only and read-only. It does NOT switch the React app from Apps Script to Supabase, change Google Drive storage, or implement the full migration. The existing `api/index.js` and application are unchanged.

`pg` was already present in the uploaded package.json. The archive did not contain package-lock.json. If your deployment uses `npm ci`, regenerate and commit a lockfile using `npm install --package-lock-only` in a local checkout.
