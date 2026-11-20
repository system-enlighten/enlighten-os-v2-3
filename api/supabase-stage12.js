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

const SPECIAL = new Set(['__internal_center__','__internal_os__','*']);
export default async function handler(req,res) {
  return runAudit(req,res,'12',({projects,reports,idKey})=>{
    const queue = new Map();
    for (const report of reports) for (const row of report.references||[]) {
      if (!queue.has(row.reference)) queue.set(row.reference,{reference:row.reference,occurrences:0,tables:[],classification:row.reference==='*'?'global-workflow':row.reference.startsWith('__internal_')?'internal-work':'unresolved-project',proposedCanonicalId:null,approval:'pending',verifiedAgainstLiveSheets:false});
      const entry=queue.get(row.reference);
      entry.occurrences+=row.occurrences;
      entry.tables.push({table:report.table,occurrences:row.occurrences,firstSourceRow:row.firstSourceRow,lastSourceRow:row.lastSourceRow,sourceSheetCount:row.sourceSheetCount});
    }
    const reviewQueue=[...queue.values()].sort((a,b)=>b.occurrences-a.occurrences);
    return {status:'manual-source-review-required',approvalRequired:true,projectIdKey:idKey,canonicalProjectCount:projects.length,summary:{distinctReferences:reviewQueue.length,unmatchedOccurrences:reviewQueue.reduce((n,r)=>n+r.occurrences,0),checkedTables:reports.filter(r=>r.status==='checked').length,skippedTables:reports.filter(r=>r.status==='skipped').length},reviewQueue,manualDecisionTemplate:reviewQueue.map(x=>({reference:x.reference,decision:'PENDING',canonicalProjectId:null,evidence:'',reviewer:'',reviewedAt:null})),allowedDecisions:['RETAIN_LEGACY_REFERENCE','MAP_TO_EXISTING_PROJECT','CONFIRM_INTERNAL_WORK','CONFIRM_GLOBAL_WORKFLOW','EXCLUDE_WITH_EVIDENCE'],requirements:['Verify source rows in original Google Sheets; this API cannot read live Sheets','Confirm source record identity and business meaning','Record human reviewer and evidence for every distinct reference','Do not map internal or global references to a client project'],tables:reports.map(({table,status,reason,unmatchedOccurrences})=>({table,status,reason,unmatchedOccurrences})),note:'Read-only evidence and review template. No decisions saved, no live Google Sheets verification, no automatic mappings, no records modified.'};
  });
}
