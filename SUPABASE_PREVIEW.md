# Consolidated Supabase Preview

Use the `supabase-consolidated` Git branch and a separate Supabase project and Google Drive test root. Keep `main` as the production branch in Vercel. Never promote the Preview deployment during validation.

## Database setup

1. Confirm the Supabase project ref belongs to the disposable Preview project. The existing operational project ref is blocked by the API. Keep this connection separate from the production and existing operational credentials.
2. Apply every file under `supabase/migrations/` in filename order, from `202611260000_operational_base.sql` through `202611270019_technical_sheet_exports.sql`. If you restored a schema that already contains earlier migrations, check its migration history before applying new migrations. Use the Preview project's SQL editor or a migration client pointed at Preview.
3. Run the workbook inventory and then the read-only synchronization. Use a private copy of the export. Review conflicts, totals, journal balances, and the existing 198 historical references to missing projects. Preserve those source rows and identifiers.
4. Populate only the approved isolated Preview project. An explicit apply requires the SHA-256 printed by the dry run. Repeat the dry run afterwards and confirm there are no new writes or unresolved conflicts. Preserve source IDs and keep the workbook out of Git.

```sh
node scripts/reconcile-operational-workbook.mjs /private/workbook.xlsx
node scripts/sync-operational-workbook.mjs /private/workbook.xlsx
node scripts/sync-operational-workbook.mjs /private/workbook.xlsx --apply=<dry-run-sha256>
node scripts/sync-operational-workbook.mjs /private/workbook.xlsx
```

The local migration command expects `SUPABASE_DATABASE_URL` and `SUPABASE_DB_CA` in the operator's shell. Verify the isolated connection before running it. Vercel uses the separate Preview-specific URL below. Machine attendance and other sources listed by the inventory require independent reconciliation if those features are exercised against historical data.

## Vercel settings

In the existing Vercel project, scope the following to **Preview** and the `supabase-consolidated` branch. Enable Vercel system environment variables so Git deployments provide `VERCEL_ENV` and `VERCEL_GIT_COMMIT_REF`.

| Variables | Preview values |
|---|---|
| `SUPABASE_PREVIEW_PROJECT_REF`, `SUPABASE_PREVIEW_DATABASE_URL`, `SUPABASE_DB_CA` | Isolated project ref, its PostgreSQL connection URL, and the trusted Supabase certificate. For a shared pooler URL, the username must end in the isolated project ref. |
| `SUPABASE_OPERATIONAL_ACCESS`, `SUPABASE_DIRECT_OPERATIONAL_READS` | `1` after the isolated database is ready. |
| `SUPABASE_DIRECT_OPERATIONAL_WRITES` | `1` only after confirming that the Preview contains the test dataset and only Preview Drive resources are writable. |
| `SUPABASE_LINEAR_BACKFILL_VERIFIED`, `SUPABASE_ACCOUNTS_BACKFILL_VERIFIED`, `SUPABASE_DIARY_BACKFILL_VERIFIED`, `SUPABASE_PAYROLL_BACKFILL_VERIFIED`, `SUPABASE_TECHNICAL_DOCUMENTATION_BACKFILL_VERIFIED` | Set each verified module to `1` after checking that module's isolated dataset. |
| `GOOGLE_CLIENT_ID`, `ENLIGHTEN_PROXY_SECRET` | Google Sign-In web client ID and a separate random secret of at least 32 characters. Authorize the exact Preview origin in the Google OAuth client. |
| `GOOGLE_DRIVE_CLIENT_ID`, `GOOGLE_DRIVE_CLIENT_SECRET`, `GOOGLE_DRIVE_REFRESH_TOKEN`, `GOOGLE_DRIVE_FOLDER_ID`, `SUPABASE_PREVIEW_DRIVE_ROOT_ID` | OAuth for a test account or mailbox with write access to the dedicated test root. Set both root IDs to the same dedicated folder. Leave legacy module-specific folder overrides unset. |
| `TECHNICAL_TEMPLATE_ID`, `TECHNICAL_DATABASE_URL` | Preview copies of the workbook template and technical document URL. Use workbook copies under the test root for linked Project Technical workbooks. |
| `TECHNICAL_IMAGE_BRIDGE_URL`, `TECHNICAL_IMAGE_BRIDGE_SECRET` | Standalone image bridge URL and a second, distinct random secret shared with that deployment. |

Enable Drive and Sheets APIs for the Drive OAuth client. For enabled integrations, use `MOM_MAIL_CLIENT_ID`, `MOM_MAIL_CLIENT_SECRET`, `MOM_MAIL_REFRESH_TOKEN` for MOM email, and `INTAKE_MAIL_CLIENT_ID`, `INTAKE_MAIL_CLIENT_SECRET`, `INTAKE_MAIL_REFRESH_TOKEN`, `EMAIL_INTAKE_ADDRESS` for drawing mail. Use test Gmail identities and fixture recipients. Configure the existing `APS_CLIENT_ID`, `APS_CLIENT_SECRET`, `APS_BUCKET` for CAD and the existing `OPENAI_API_KEY` for AI-assisted modules only if testing them. WhatsApp validation needs its existing Meta Graph settings, test phone and mapping, and a Preview `PUBLIC_APP_URL`.

Deploy from the branch as a Git Preview, then verify the project name, Git ref, commit SHA and deployment environment in Vercel before opening the URL. An authenticated `listProjects` call should return `X-Enlighten-Data-Source: supabase-operational`. The API fails closed when the branch, database, or Drive root fails the isolation check.

## Private Technical Sheet export

The application creates and styles the editable native sheet through Drive and Sheets APIs. PostgreSQL holds the export owner, job version, status and manifest. Only binary over-grid image insertion and checking image keys use the standalone Apps Script in `integrations/technical-image-bridge/Code.gs`.

1. Create a separate Apps Script project, paste the bridge file, and set Script Properties `TECHNICAL_IMAGE_BRIDGE_SECRET` and `TECHNICAL_IMAGE_BRIDGE_ROOT_ID`. The root must match the dedicated Preview Drive root.
2. Deploy it as a web app running as a Preview-only Drive identity. Allow HTTPS calls from the server. The bridge authenticates the HMAC and independently checks the folder ancestry before opening the workbook. Copy its `/exec` URL to the branch-scoped Vercel variable.
3. Export one fixture with a private PNG, merged cells, widths, row heights, styled headings, and literal formula-like text. Confirm the editable Google Sheet retains the original image dimensions and location after refresh. Repeating the same image batch should yield one image for each key. Verify that the private source image and exported workbook have their intended sharing settings.
4. Validate Schedule and native Technical reads with HTTPS `IMAGE()` cells and a workbook containing native in-cell images. The Sheets API reader currently resolves formula images. Native in-cell image parity remains a Preview validation item.
5. Google documents Excel-to-Sheets conversion but does not establish that conversion preserves the private images and exact editable layout used here. Online conversion was not verified. Use the bridge for image exports until an isolated conversion fixture proves parity.

## Functional validation

- Sign in as a system admin, project admin, employee, viewer and contractor. Verify negative cases across projects, project roles and external vendor invitations.
- Create a disposable project, update zones, upload and classify a drawing, advance a WIH task, publish and withdraw a test drawing, and check audit records. Confirm the Drive mutations stay under the test root.
- Run Accounts reconciliation, invoice dependencies, Contra and permissions checks using fixtures. Validate attendance, payroll, MOM, Diary, meetings and session timing against the isolated records.
- Import Output into a dedicated workbook copy. Check Output backups, protected formula columns, CAL sequence and gaps, row separators, and Schedule and Spec output. Reopen the resulting workbook and edit a normal cell.
- Verify technical export ownership, private image dates and source sharing, image retries, and direct Google token refresh. Verify Gmail submission and follow-up against fixtures. Existing mailbox polling and ingestion still require a separate non-Apps-Script worker before retiring the old mailbox job.
- Keep production traffic on its existing deployment. For Preview rollback, disable the read and write flags, or redeploy the last approved Preview commit. Keep the isolated database and workbook export for reconciliation.
