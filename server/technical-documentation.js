import {randomUUID} from 'node:crypto';
import {db} from './supabase-db.js';
import {checkProjectRead,requireProject} from './permissions.js';
import {validateDocumentation} from './technical-documentation-rules.js';

const failure=(message,statusCode=400)=>Object.assign(new Error(message),{statusCode});
const incomplete=()=>failure('Output could not be loaded completely. Please reload.',409);

async function metadata(tx,projectId) {
  const rows=await tx.rows("SELECT record_id,cells FROM enlighten_operational.technical_documentation WHERE cells->>'projectId'=$1 LIMIT 2",[projectId]);
  if (rows.length>1) throw incomplete();
  return rows[0];
}

async function readDocumentation(tx,projectId,meta) {
  const parts=await tx.rows(`SELECT cells FROM enlighten_operational.technical_documentation_chunks
    WHERE cells->>'projectId'=$1 AND cells->>'version'=$2`,[projectId,String(meta.version)]);
  const chunks=parts.map(row=>row.cells).sort((a,b)=>Number(a.chunkIndex)-Number(b.chunkIndex));
  if (chunks.length!==Number(meta.chunkCount)||chunks.some((chunk,index)=>Number(chunk.chunkIndex)!==index||
      typeof chunk.base64!=='string'||!/^[A-Za-z0-9+/]+={0,2}$/.test(chunk.base64))) throw incomplete();
  try {
    return JSON.parse(Buffer.from(chunks.map(chunk=>chunk.base64).join(''),'base64').toString('utf8'));
  } catch { throw incomplete(); }
}

export async function getTechnicalDocumentation(payload,{user,database=db}) {
  const projectId=String(payload.projectId||'');
  if (!projectId) throw failure('Choose a project.');
  return database.transaction(async tx=>{
    await checkProjectRead(tx,user,projectId);
    const prior=await metadata(tx,projectId);
    if (!prior) return {headers:[],rows:[],rules:{},version:''};
    const data=await readDocumentation(tx,projectId,prior.cells);
    return {...data,version:String(prior.cells.version),updatedAt:String(prior.cells.updatedAt)};
  },{readOnly:true});
}

export async function saveTechnicalDocumentation(payload,{user,database=db}) {
  const projectId=String(payload.projectId||'');
  requireProject(user,projectId,{write:true});
  let data;
  try { data=validateDocumentation(payload); }
  catch (error) { throw failure(error.message); }
  return database.transaction(async tx=>{
    await checkProjectRead(tx,user,projectId);
    await tx.query('SELECT pg_advisory_xact_lock(hashtextextended($1,0))',['technical-documentation:'+projectId]);
    const prior=await metadata(tx,projectId);
    if (String(prior?.cells.version||'')!==String(payload.expectedVersion||'')) {
      throw failure('Another person updated this Output. Reload before saving to protect their changes.',409);
    }
    const optional=['manualRows','overrides','sourceText','sourceName'];
    if (prior&&optional.some(field=>payload[field]===undefined)) {
      const previous=await readDocumentation(tx,projectId,prior.cells);
      const defaults={manualRows:[],overrides:{}};
      for (const field of optional) {
        if (payload[field]===undefined) {
          const value=previous[field]??defaults[field];
          if (value!==undefined) data[field]=value;
        }
      }
    }
    const finalJson=JSON.stringify(data);
    if (finalJson.length>1200000) throw failure('Output exceeds 1.2 MB.');
    const version=randomUUID(),updatedAt=new Date().toISOString();
    const encoded=Buffer.from(finalJson,'utf8').toString('base64');
    const chunks=encoded.match(/.{1,28000}/g).map((base64,chunkIndex)=>({
      chunkKey:[projectId,version,chunkIndex].join('|'),projectId,version,chunkIndex,base64
    }));
    await tx.query('INSERT INTO enlighten_operational.technical_documentation_chunks (cells) SELECT value FROM jsonb_array_elements($1::jsonb)',[JSON.stringify(chunks)]);
    const meta={projectId,version,chunkCount:chunks.length,updatedAt,updatedBy:user.name||user.email};
    if (prior) await tx.query('UPDATE enlighten_operational.technical_documentation SET cells=cells||$1::jsonb,updated_at=clock_timestamp() WHERE record_id=$2::bigint',[JSON.stringify(meta),prior.record_id]);
    else await tx.query('INSERT INTO enlighten_operational.technical_documentation (cells) VALUES ($1::jsonb)',[JSON.stringify(meta)]);
    return {...data,version,updatedAt};
  });
}
