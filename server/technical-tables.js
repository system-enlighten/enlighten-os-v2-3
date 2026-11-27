import {randomUUID} from 'node:crypto';
import {db} from './supabase-db.js';
import {checkProjectRead,requireProject,requireStudio} from './permissions.js';

const failure = (message,statusCode=400) => Object.assign(new Error(message),{statusCode});
const text = (value,limit) => String(value ?? '').trim().slice(0,limit);
const tableSql = 'SELECT record_id,cells FROM enlighten_operational.technical_tables';

async function findTable(tx,id) {
  const rows=await tx.rows(tableSql+" WHERE cells->>'tableId'=$1 LIMIT 2",[id]);
  if (rows.length!==1) throw failure('Technical table not found.',404);
  return rows[0];
}

export async function listTechnicalTables(payload,{user,database=db}) {
  const projectId=String(payload.projectId||'');
  if (!projectId) throw failure('Choose a project.');
  return database.transaction(async tx=>{
    await checkProjectRead(tx,user,projectId);
    const rows=await tx.rows(tableSql+" WHERE cells->>'projectId'=$1 ORDER BY source_row_number NULLS LAST,record_id",[projectId]);
    return rows.map(row=>row.cells);
  },{readOnly:true});
}

export async function getTechnicalTable(payload,{user,database=db}) {
  requireStudio(user);
  return database.transaction(async tx=>{
    const {cells:table}=await findTable(tx,String(payload.tableId||''));
    requireProject(user,table.projectId);
    await checkProjectRead(tx,user,table.projectId);
    const parts=await tx.rows(`SELECT cells FROM enlighten_operational.technical_table_chunks
      WHERE cells->>'tableId'=$1 AND cells->>'version'=$2`,[String(table.tableId),String(table.activeVersion)]);
    const chunks=parts.map(({cells})=>cells).sort((a,b)=>Number(a.chunkIndex)-Number(b.chunkIndex));
    if (chunks.some((chunk,index)=>chunk.chunkIndex===''||Number(chunk.chunkIndex)!==index||!/^b64:[A-Za-z0-9+/=]+$/.test(chunk.text))) {
      throw failure('Saved Output is incomplete.',409);
    }
    const rows=chunks.length?JSON.parse(Buffer.from(chunks.map(chunk=>chunk.text.slice(4)).join(''),'base64').toString('utf8')):[];
    return {...table,rows};
  },{readOnly:true});
}

export async function saveTechnicalTable(payload,{user,database=db}) {
  const projectId=String(payload.projectId||'');
  requireProject(user,projectId,{write:true});
  const {rows}=payload;
  if (!Array.isArray(rows)||!rows.length||rows.length>5000||
      rows.some(row=>!Array.isArray(row)||row.length!==14||!/^[A-Z]+\d+$/.test(String(row[0]))||row.some(value=>typeof value!=='string'||value.length>4000))) {
    throw failure('Choose a valid pasted Output with up to 5000 rows.');
  }
  const data=JSON.stringify(rows);
  if (data.length>1200000) throw failure('Output is too large; split it into separate drawings.');
  const encoded=Buffer.from(data,'utf8').toString('base64');
  return database.transaction(async tx=>{
    await checkProjectRead(tx,user,projectId);
    await tx.query('LOCK TABLE enlighten_operational.technical_tables IN SHARE ROW EXCLUSIVE MODE');
    let prior;
    if (payload.tableId) {
      prior=await findTable(tx,String(payload.tableId));
      if (String(prior.cells.projectId)!==projectId) throw failure('Table belongs to another project.',403);
      if (String(payload.expectedVersion||'')!==String(prior.cells.activeVersion)) throw failure('Someone updated this Output. Reopen it before saving again.',409);
    }
    let tableId=prior?.cells.tableId;
    if (!tableId) {
      const [{next_id:nextId}]=await tx.rows(`SELECT coalesce(max(substring(cells->>'tableId' from '^TECH-([0-9]+)$')::bigint),0)+1 AS next_id
        FROM enlighten_operational.technical_tables`);
      tableId='TECH-'+String(nextId).padStart(6,'0');
    }
    const version=randomUUID();
    const chunks=[];
    for (let offset=0;offset<encoded.length;offset+=35000) {
      chunks.push({tableId,version,chunkIndex:chunks.length,text:'b64:'+encoded.slice(offset,offset+35000)});
    }
    await tx.query(`INSERT INTO enlighten_operational.technical_table_chunks (cells)
      SELECT value FROM jsonb_array_elements($1::jsonb)`,[JSON.stringify(chunks)]);
    const now=new Date().toISOString();
    const table={tableId,projectId,title:text(payload.title,200)||'Technical Table',floor:text(payload.floor,120),
      drawingType:text(payload.drawingType,120),revision:text(payload.revision,80),activeVersion:version,
      createdAt:prior?prior.cells.createdAt:now,updatedAt:now,updatedBy:user.name||user.email};
    if (prior) {
      await tx.query('UPDATE enlighten_operational.technical_tables SET cells=cells||$1::jsonb,updated_at=clock_timestamp() WHERE record_id=$2::bigint',[JSON.stringify(table),prior.record_id]);
    } else {
      await tx.query('INSERT INTO enlighten_operational.technical_tables (cells) VALUES ($1::jsonb)',[JSON.stringify(table)]);
    }
    return table;
  });
}

export async function listTechnicalFittings(_payload,{user,database=db}) {
  requireStudio(user);
  const rows=await database.rows('SELECT cells FROM enlighten_operational.technical_fittings ORDER BY source_row_number NULLS LAST,record_id');
  return rows.map(({cells})=>({...JSON.parse(cells.dataJson),catalogVersion:String(cells.updatedAt||'')}));
}
