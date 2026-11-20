import { Pool } from 'pg';
import { readAppSession } from './index.js';

// Preview-only, admin-only, read-only migration diagnostic.
const SCHEMA = 'enlighten_import';
const TARGETS = ['floor_zones','drawing_register','files','design_tasks','wih','line_of_work','workflow_delegations','project_roles','received_drawings','issued_drawings','project_contacts','design_dashboard','technical_workbooks','studio_attendance'];
const KEYS = ['projectId','project_id','Project ID','projectID'];
const quote = value => '"' + String(value).replace(/"/g, '""') + '"';
const table = name => `${quote(SCHEMA)}.${quote(name)}`;
const fail = (res, code, message) => res.status(code).json({ok:false,error:{message}});

async function runAudit(req,res,stage,makeResult) {
  res.setHeader('Cache-Control','no-store, max-age=0');
  res.setHeader('X-Content-Type-Options','nosniff');
  if (process.env.VERCEL_ENV !== 'preview') return fail(res,404,'Not available');
  if (req.method !== 'GET') return fail(res,405,'Method not allowed');
  const secret = process.env.ENLIGHTEN_PROXY_SECRET;
  const audience = process.env.GOOGLE_CLIENT_ID;
  const admin = String(process.env.MIGRATION_ADMIN_EMAIL || '').trim().toLowerCase();
  if (!secret || !audience || !admin || !process.env.SUPABASE_DATABASE_URL)
    return fail(res,503,'Preview migration audit configuration incomplete');
  const identity = readAppSession(req,secret,audience);
  if (!identity) return fail(res,401,'Sign in to Preview first');
  if (String(identity.email || '').trim().toLowerCase() !== admin)
    return fail(res,403,'Migration audit restricted to configured administrator');
  const ca = String(process.env.SUPABASE_DB_CA || '').replace(/\\n/g,'\n').trim();
  if (!ca.includes('-----BEGIN CERTIFICATE-----') || !ca.includes('-----END CERTIFICATE-----'))
    return fail(res,503,'Database CA configuration incomplete');
  let pool;
  try {
    const url = new URL(process.env.SUPABASE_DATABASE_URL.trim());
    if (!['postgres:','postgresql:'].includes(url.protocol)) return fail(res,503,'Invalid database URL');
    for (const key of ['sslmode','sslcert','sslkey','sslrootcert']) url.searchParams.delete(key);
    pool = new Pool({connectionString:url.toString(),ssl:{ca,rejectUnauthorized:true},max:1,connectionTimeoutMillis:10000,statement_timeout:20000});
    const client = await pool.connect();
    try {
      await client.query('BEGIN READ ONLY');
      const {rows: columns} = await client.query(`SELECT table_name,column_name,data_type FROM information_schema.columns WHERE table_schema=$1 AND table_name=ANY($2::text[])`,[SCHEMA,['projects',...TARGETS]]);
      const byTable = new Map();
      for (const col of columns) {
        if (!byTable.has(col.table_name)) byTable.set(col.table_name,[]);
        byTable.get(col.table_name).push(col);
      }
      const hasCells = name => (byTable.get(name)||[]).some(c=>c.column_name==='cells' && ['json','jsonb'].includes(c.data_type));
      if (!hasCells('projects')) return fail(res,422,'Imported projects JSON cells missing');
      const {rows: fields} = await client.query(`SELECT DISTINCT k.key FROM ${table('projects')} p CROSS JOIN LATERAL jsonb_object_keys(CASE WHEN jsonb_typeof(p.cells::jsonb)='object' THEN p.cells::jsonb ELSE '{}'::jsonb END) AS k(key) WHERE k.key=ANY($1::text[])`,[KEYS]);
      const idKey = KEYS.find(k=>fields.some(r=>r.key===k));
      if (!idKey) return fail(res,422,'Imported project ID field missing');
      const {rows: projects} = await client.query(`SELECT NULLIF(btrim(cells::jsonb->>$1),'') AS id, NULLIF(btrim(cells::jsonb->>'projectNo'),'') AS project_no, NULLIF(btrim(cells::jsonb->>'projectName'),'') AS project_name FROM ${table('projects')} WHERE jsonb_typeof(cells::jsonb)='object'`,[idKey]);
      const known = new Set(projects.map(p=>p.id).filter(Boolean));
      const reports=[];
      for (const name of TARGETS) {
        if (!hasCells(name)) { reports.push({table:name,status:'skipped',reason:'Missing table or JSON cells'});continue; }
        const {rows: refFields} = await client.query(`SELECT DISTINCT k.key FROM ${table(name)} t CROSS JOIN LATERAL jsonb_object_keys(CASE WHEN jsonb_typeof(t.cells::jsonb)='object' THEN t.cells::jsonb ELSE '{}'::jsonb END) AS k(key) WHERE k.key=ANY($1::text[])`,[KEYS]);
        const refKey = KEYS.find(k=>refFields.some(r=>r.key===k));
        if (!refKey) {reports.push({table:name,status:'skipped',reason:'No recognized project reference field'});continue;}
        const {rows: refs} = await client.query(`SELECT NULLIF(btrim(cells::jsonb->>$1),'') AS reference, COUNT(*)::int AS occurrences, MIN(source_row_number) AS first_source_row, MAX(source_row_number) AS last_source_row, COUNT(DISTINCT source_sheet_id)::int AS source_sheet_count FROM ${table(name)} WHERE jsonb_typeof(cells::jsonb)='object' GROUP BY 1`,[refKey]);
        const unmatched = refs.filter(r=>r.reference && !known.has(r.reference));
        reports.push({table:name,status:'checked',referenceKey:refKey,unmatchedOccurrences:unmatched.reduce((n,r)=>n+r.occurrences,0),references:unmatched.map(r=>({reference:r.reference,occurrences:r.occurrences,firstSourceRow:r.first_source_row,lastSourceRow:r.last_source_row,sourceSheetCount:r.source_sheet_count}))});
      }
      const result = makeResult({projects,reports,idKey});
      await client.query('COMMIT');
      return res.status(200).json({ok:true,source:'supabase-preview',stage,schema:SCHEMA,readOnly:true,...result});
    } catch(error) {await client.query('ROLLBACK').catch(()=>{});throw error;}
    finally {client.release();}
  } catch(error) {console.error(`Stage ${stage} audit failed`,{code:error?.code});return fail(res,502,`Stage ${stage} audit failed`);}
  finally {if(pool) await pool.end().catch(()=>{});}
}

export default async function handler(req,res) {
  return runAudit(req,res,'13',({projects,reports,idKey})=>{
    const unresolved = new Map();
    for (const report of reports) for (const row of report.references||[]) unresolved.set(row.reference,(unresolved.get(row.reference)||0)+row.occurrences);
    const entries=[...unresolved].map(([reference,occurrences])=>({reference,occurrences,category:reference==='*'?'global-workflow':reference.startsWith('__internal_')?'internal-work':'unresolved-project',resolution:'not-approved'}));
    const blockers=[
      {code:'SOURCE_VERIFICATION',passed:false,detail:'Original Google Sheets source rows have not been verified by this API'},
      {code:'REFERENCE_APPROVAL',passed:entries.length===0,detail:`${entries.length} distinct unmatched references; no approved decision registry is configured`},
      {code:'WRITE_PATH_TESTS',passed:false,detail:'Create/edit/complete/rollback and conflict tests not certified'},
      {code:'AUTHORIZATION_AND_RLS',passed:false,detail:'User/project authorization and database row-level security not certified'},
      {code:'FILE_STORAGE',passed:false,detail:'File uploads and file permissions not certified'},
      {code:'FULL_PARITY',passed:false,detail:'All tables, relationships, and live Sheets parity not certified'},
      {code:'CUTOVER_AND_ROLLBACK',passed:false,detail:'Production cutover and rollback rehearsal not certified'}
    ];
    return {status:'not-ready-for-cutover',approvedForWrites:false,approvedForProduction:false,approvalRequired:true,projectIdKey:idKey,summary:{canonicalProjects:projects.length,checkedTables:reports.filter(r=>r.status==='checked').length,skippedTables:reports.filter(r=>r.status==='skipped').length,unmatchedOccurrences:entries.reduce((n,r)=>n+r.occurrences,0),distinctUnmatchedReferences:entries.length,passedGates:blockers.filter(b=>b.passed).length,totalGates:blockers.length},unresolvedReferences:entries,readinessGates:blockers,nextSteps:['Verify original Google Sheets source records and document decisions','Implement durable, auditable approvals separately; do not treat this report as approval','Verify referential integrity after approved changes','Test writes and permissions in an isolated staging database','Perform production cutover only after independent sign-off'],note:'Conservative read-only readiness gate. This endpoint never approves a mapping or a production cutover and never changes database records.'};
  });
}
