import {db} from './supabase-db.js';
import {isSystemAdmin,requireStudio} from './permissions.js';

const calendar=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit'});
const invalid=message=>Object.assign(new Error(message),{statusCode:400});

function dayAt(date) {
  const parts=Object.fromEntries(calendar.formatToParts(date).map(({type,value})=>[type,value]));
  return [parts.year,parts.month,parts.day].join('-');
}

export async function listActiveTime(_payload,{user,database=db,now=Date.now()}={}) {
  requireStudio(user);
  const managed=String(user.appAccess).toLowerCase()==='viewer'?[]:Object.keys(user.projectRoles||{}).filter(id=>user.projectRoles[id]==='Admin');
  const rows=await database.rows(`SELECT cells FROM enlighten_operational.active_time
    WHERE left(cells->>'day',10)>=$1 AND ($2::boolean OR cells->>'userId'=$3 OR cells->>'projectId'=ANY($4::text[]))
    ORDER BY source_row_number NULLS LAST,record_id`,[dayAt(new Date(now-29*86400000)),isSystemAdmin(user),user.userId,managed]);
  const groups=new Map();
  for (const {cells:row} of rows) {
    const {userId,name,section,projectId}=row;
    const key=JSON.stringify([userId,section,projectId]);
    const previous=groups.get(key);
    const seconds=Number(row.seconds)||0;
    if (previous) previous.seconds+=seconds;
    else groups.set(key,{userId,name,section,projectId,seconds});
  }
  return [...groups.values()].sort((a,b)=>b.seconds-a.seconds);
}

export async function logActiveTime(payload,{user,database=db,now=Date.now()}={}) {
  requireStudio(user);
  const batchId=String(payload.batchId||'');
  if (!/^[a-f0-9-]{36}$/i.test(batchId)||!Array.isArray(payload.rows)||!payload.rows.length||payload.rows.length>60) {
    throw invalid('Invalid activity batch.');
  }
  const day=dayAt(new Date(now));
  let total=0;
  const rows=payload.rows.map(row=>{
    const seconds=Number(row?.seconds),section=String(row?.section||''),project=String(row?.projectId||'');
    if (!Number.isInteger(seconds)||seconds<1||seconds>120||!/^[a-zA-Z][a-zA-Z0-9]{0,40}$/.test(section)) throw invalid('Invalid activity entry.');
    total+=seconds;
    const hasAccess=isSystemAdmin(user)||Object.hasOwn(user.projectRoles||{},project);
    const projectId=hasAccess&&/^[a-zA-Z0-9_-]{1,100}$/.test(project)?project:'';
    return {batchId,userId:String(user.userId),name:String(user.name||''),day,section,projectId,seconds};
  });
  if (total>120) throw invalid('Activity batch is too long.');
  return database.transaction(async tx=>{
    await tx.query('SELECT pg_advisory_xact_lock(hashtextextended($1,0))',['active-time:'+batchId]);
    const prior=await tx.rows("SELECT 1 FROM enlighten_operational.active_time WHERE cells->>'batchId'=$1 LIMIT 1",[batchId]);
    if (!prior.length) {
      await tx.query('INSERT INTO enlighten_operational.active_time (cells) SELECT value FROM jsonb_array_elements($1::jsonb)',[JSON.stringify(rows)]);
    }
    return {saved:true};
  });
}
