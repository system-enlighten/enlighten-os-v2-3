import {Pool} from 'pg';
import {randomUUID} from 'node:crypto';
import {readAppSession} from './index.js';
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');
 const fail=(n,message)=>res.status(n).json({ok:false,error:{message}});
 if(process.env.VERCEL_ENV!=='preview')return fail(404,'Not available');
 if(req.method!=='GET')return fail(405,'GET required');
 const {ENLIGHTEN_PROXY_SECRET:s,GOOGLE_CLIENT_ID:a,MIGRATION_ADMIN_EMAIL:m,SUPABASE_DATABASE_URL:u,SUPABASE_DB_CA:c}=process.env;
 if(!s||s.length<32||!a||!m||!u||!c)return fail(503,'Preview configuration incomplete');
 const identity=readAppSession(req,s,a);
 if(!identity)return fail(401,'Sign in first');
 if(identity.email.trim().toLowerCase()!==m.trim().toLowerCase())return fail(403,'Migration administrator required');
 let pool,client;
 try{
 const url=new URL(u); if(!['postgres:','postgresql:'].includes(url.protocol))throw Error('Invalid URL');
 for(const k of ['sslmode','sslcert','sslkey','sslrootcert'])url.searchParams.delete(k);
 pool=new Pool({connectionString:url.toString(),ssl:{ca:c.replace(/\\n/g,'\n').trim(),rejectUnauthorized:true},max:1,connectionTimeoutMillis:10000});
 client=await pool.connect(); await client.query('BEGIN'); await client.query("SET LOCAL statement_timeout='10000ms'");
 const {rows}=await client.query('SELECT count(*)::int AS projects FROM enlighten_import.projects');
 const id=randomUUID(); await client.query('INSERT INTO enlighten_preview.write_probe VALUES ($1,$2)',[id,JSON.stringify({test:true})]);
 await client.query('UPDATE enlighten_preview.write_probe SET payload=$2 WHERE id=$1',[id,JSON.stringify({updated:true})]);
 const read=await client.query('SELECT payload FROM enlighten_preview.write_probe WHERE id=$1',[id]);
 if(read.rows[0]?.payload?.updated!==true)throw Error('Probe mismatch');
 const deleted=await client.query('DELETE FROM enlighten_preview.write_probe WHERE id=$1',[id]); if(deleted.rowCount!==1)throw Error('Delete mismatch');
 await client.query('ROLLBACK');
 return res.status(200).json({ok:true,projects:rows[0].projects,isolatedCrudProbe:'passed',rolledBack:true,applicationBackend:'google-sheets',cutoverReady:false});
 }catch(e){console.error('Preview probe failed',{code:e.code||'PROBE'});return fail(502,'Preview probe failed; inspect logs');}finally{if(client){await client.query('ROLLBACK').catch(()=>{});client.release();}if(pool)await pool.end().catch(()=>{});}
}
