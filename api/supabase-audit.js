import { Pool } from 'pg';
import { readAppSession } from './index.js';
const schema='enlighten_import';
const quote=s=>'"'+s.replace(/"/g,'""')+'"';
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');
 res.setHeader('X-Content-Type-Options','nosniff');
 const fail=(n,message)=>res.status(n).json({ok:false,error:{message}});
 if(process.env.VERCEL_ENV!=='preview')return fail(404,'Not available');
 if(req.method!=='GET')return fail(405,'GET required');
 const {ENLIGHTEN_PROXY_SECRET:secret,GOOGLE_CLIENT_ID:audience,MIGRATION_ADMIN_EMAIL:admin,SUPABASE_DATABASE_URL:url,SUPABASE_DB_CA:rawCA}=process.env;
 if(!secret||secret.length<32||!audience||!admin||!url||!rawCA)return fail(503,'Preview configuration incomplete');
 let pool,client;
 try{
 const identity=readAppSession(req,secret,audience);
 if(!identity)return fail(401,'Sign in to Preview first');
 if(String(identity.email).trim().toLowerCase()!==admin.trim().toLowerCase())return fail(403,'Migration administrator required');
 const parsed=new URL(url);if(!['postgres:','postgresql:'].includes(parsed.protocol))return fail(503,'Invalid database URL');
 for(const k of ['sslmode','sslcert','sslkey','sslrootcert'])parsed.searchParams.delete(k);
 const ca=rawCA.replace(/\\n/g,'\n').trim();if(!ca.includes('-----BEGIN CERTIFICATE-----'))return fail(503,'Invalid CA');
 pool=new Pool({connectionString:parsed.toString(),ssl:{ca,rejectUnauthorized:true},max:1,connectionTimeoutMillis:10000});
 client=await pool.connect();await client.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');await client.query("SET LOCAL statement_timeout = '10000ms'");
 const {rows:tables}=await client.query(`SELECT table_name, array_agg(column_name) AS columns FROM information_schema.columns WHERE table_schema=$1 GROUP BY table_name ORDER BY table_name`,[schema]);
 const projectTable=tables.find(t=>t.table_name==='projects'&&t.columns.includes('cells'));if(!projectTable)throw Error('Projects missing');
 const {rows:[projects]}=await client.query(`SELECT count(*)::int AS rows,count(DISTINCT NULLIF(cells->>'projectId',''))::int AS distinct_ids,count(*) FILTER (WHERE NULLIF(cells->>'projectId','') IS NULL)::int AS missing_ids FROM enlighten_import.projects`);
 const inventory=[],review=[];
 for(const t of tables){
 const name=quote(schema)+'.'+quote(t.table_name);
 const {rows:[count]}=await client.query(`SELECT count(*)::int AS rows FROM ${name}`);
 const item={table:t.table_name,rows:count.rows,columns:t.columns};inventory.push(item);
 if(!t.columns.includes('cells')||t.table_name==='projects')continue;
 const {rows:refs}=await client.query(`SELECT r.cells->>'projectId' AS reference,count(*)::int AS occurrences FROM ${name} r WHERE NULLIF(r.cells->>'projectId','') IS NOT NULL AND NOT EXISTS (SELECT 1 FROM enlighten_import.projects p WHERE p.cells->>'projectId'=r.cells->>'projectId') GROUP BY 1 ORDER BY 1`);
 for(const r of refs)review.push({table:t.table_name,...r,category:r.reference==='*'?'global-workflow-candidate':r.reference.startsWith('__internal_')?'internal-work-candidate':'unresolved-project',approved:false});
 }
 let batches=null;if(tables.some(t=>t.table_name==='import_batches'&&t.columns.includes('export_complete'))){const q=await client.query('SELECT export_complete,count(*)::int AS batches FROM enlighten_import.import_batches GROUP BY export_complete');batches=q.rows;}
 await client.query('COMMIT');
 return res.status(200).json({ok:true,readOnly:true,source:'supabase-preview',status:'manual-review-required',projects,inventory,review,importBatches:batches,summary:{tables:inventory.length,rows:inventory.reduce((n,t)=>n+t.rows,0),unmatchedOccurrences:review.reduce((n,r)=>n+r.occurrences,0)},cutoverReady:false,blockers:['Verify source export completeness and current Sheets parity','Approve reference semantics','Port and test business logic and permissions','Rehearse final synchronization and rollback']});
 }catch(e){console.error('Migration audit failed',{code:e.code||'AUDIT_ERROR'});return fail(502,'Audit failed; inspect Vercel runtime logs');}finally{if(client){await client.query('ROLLBACK').catch(()=>{});client.release();}if(pool)await pool.end().catch(()=>{});}
}
