import {createHmac,randomUUID,timingSafeEqual} from 'node:crypto';
import {db} from './supabase-db.js';
import {createDriveAttachments,projectsDriveRoot} from './drive-attachments.js';
import {previewProjectFolder} from './drawing-publishing.js';
import {getTechnicalDocumentation} from './technical-documentation.js';
import {checkProjectRead,requireProject} from './permissions.js';
import {actor,failure,now,projectRow,text} from './project-write-storage.js';
import {buildSiteExecution,siteExecutionStored_} from './site-execution-rules.js';

const drive=createDriveAttachments(),table='enlighten_operational.site_execution_items';
const signWith=env=>{
  const secret=env.SITE_EXECUTION_SIGNING_SECRET||env.ENLIGHTEN_PROXY_SECRET;
  if (!secret) throw failure('Site execution signing is unavailable.',503);
  return data=>createHmac('sha256',secret).update('site-execution:'+data).digest('base64url');
};
async function workbook(tx,projectId) {
  const rows=await tx.rows("SELECT cells FROM enlighten_operational.technical_workbooks WHERE cells->>'projectId'=$1 LIMIT 2",[projectId]);
  if (rows.length>1) throw failure('Workbook link is duplicated.',409);
  return rows.length?String(JSON.parse(rows[0].cells.dataJson||'{}').workbookId||''):'';
}
export async function getSiteExecution(p,{user,database=db,env=process.env,clock=Date.now}) {
  const projectId=text(p.projectId);
  requireProject(user,projectId);
  return database.transaction(async tx=>{
    const output=await getTechnicalDocumentation({projectId},{user,database:{transaction:work=>work(tx)}});
    const rows=async name=>(await tx.rows("SELECT cells FROM enlighten_operational."+name+" WHERE cells->>'projectId'=$1 ORDER BY source_row_number NULLS LAST,record_id",[projectId])).map(row=>row.cells);
    return buildSiteExecution({projectId,workbookId:await workbook(tx,projectId),output,zones:await rows('floor_zones'),
      records:await rows('site_execution_items'),tasks:await rows('mom_tasks'),points:await rows('mom_visit_points'),user,sign:signWith(env),now:clock()});
  },{readOnly:true});
}
export async function verifySiteExecution(tx,projectId,token,{user,env=process.env,clock=Date.now}) {
  requireProject(user,projectId,{write:true});
  const [encoded,signature,extra]=String(token||'').split('.');
  if (!encoded||!signature||extra!==undefined||encoded.length>5000||!/^[A-Za-z0-9_-]+$/.test(encoded)||!/^[A-Za-z0-9_-]{43}$/.test(signature)||
    !timingSafeEqual(Buffer.from(signature),Buffer.from(signWith(env)(encoded)))) throw failure('Invalid row selection. Refresh the execution sheet.',403);
  let metadata;
  try {metadata=JSON.parse(Buffer.from(encoded,'base64url').toString('utf8'));} catch {throw failure('Invalid row token.');}
  if (metadata.projectId!==projectId||!metadata.itemKey||!Number.isFinite(metadata.expires)||metadata.expires<=clock()) {
    throw failure('Row selection expired. Refresh the execution sheet.',409);
  }
  await checkProjectRead(tx,user,projectId);
  if (metadata.workbookId!=='product-circuit'&&await workbook(tx,projectId)!==metadata.workbookId) throw failure('The project workbook changed. Refresh before saving.',409);
  return metadata;
}
export async function getMomPointCircuits(p,context) {
  const {items}=await getSiteExecution(p,context);
  return items.filter(row=>row.editable&&row.token).map(row=>({key:row.itemKey,token:row.token,label:[row.floor,row.zone,row.cn].filter(Boolean).join(' \u00b7 ')}));
}

export async function saveSiteExecutionItem(p,{database=db,...context}) {
  const projectId=text(p.projectId),input=p.record||{};
  if (typeof input.installed!=='boolean'||typeof input.snagClosed!=='boolean') throw failure('Invalid completion state.');
  const photos=input.photos||[];
  if (!Array.isArray(photos)||photos.length>20) throw failure('Use up to 20 photos per circuit.');
  if (photos.some(photo=>!photo||typeof photo.url!=='string'||!/^https:\/\/[^\s]+$/.test(photo.url)||
    photo.url.length>2000||String(photo.name||'').length>200)) throw failure('Invalid photo link.');
  const data=Object.fromEntries(['delivery','status','notes','responsibility'].map(key=>[key,String(input[key]||'')]));
  if (Object.values(data).some(value=>value.length>4000)) throw failure('Circuit field is too long.');
  return database.transaction(async tx=>{
    const meta=await verifySiteExecution(tx,projectId,p.token,context);
    await tx.query('SELECT pg_advisory_xact_lock(hashtextextended($1,0))',['site-execution:'+meta.itemKey]);
    const rows=await tx.rows("SELECT record_id,cells FROM "+table+" WHERE cells->>'itemKey'=$1 LIMIT 2 FOR UPDATE",[meta.itemKey]);
    const old=rows[0]?.cells;
    if (rows.length>1||old&&(String(old.projectId)!==projectId||String(old.workbookId)!==meta.workbookId)) throw failure('Row identity mismatch.',409);
    if (String(old?.version||'')!==String(p.expectedVersion||'')) throw failure('This circuit was updated by someone else. Refresh before saving.',409);
    const at=now(),{itemKey,workbookId,cn,zone,floor}=meta;
    const row={itemKey,projectId,workbookId,cn,zone,floor,...data,notes:input.notes===undefined?String(old?.notes||''):data.notes,
      installed:input.installed,installedAt:input.installed?(old?.installedAt||at):'',snagClosed:input.snagClosed,
      snagClosedAt:input.snagClosed?(old?.snagClosedAt||at):'',photosJson:JSON.stringify(photos.map(photo=>({
        url:photo.url,name:String(photo.name||''),fileId:String(photo.fileId||'')
      }))),version:randomUUID(),updatedAt:at,updatedBy:actor(context.user)};
    if (old) await tx.query('UPDATE '+table+' SET cells=cells||$1::jsonb,updated_at=clock_timestamp() WHERE record_id=$2',[JSON.stringify(row),rows[0].record_id]);
    else await tx.query('INSERT INTO '+table+' (cells) VALUES ($1::jsonb)',[JSON.stringify(row)]);
    return siteExecutionStored_(row);
  });
}
export async function uploadSiteExecutionPhoto(p,{database=db,files=drive,env=process.env,...context}) {
  const projectId=text(p.projectId),name=String(p.name||'').replace(/[\x00-\x1f/\\]/g,'_').slice(0,150);
  const extension=name.split('.').at(-1).toLowerCase(),mimeType=({png:'image/png',jpg:'image/jpeg',jpeg:'image/jpeg',webp:'image/webp'})[extension];
  if (!name.includes('.')||!mimeType||typeof p.base64!=='string'||p.base64.length>4200000||!/^[A-Za-z0-9+/]+={0,2}$/.test(p.base64)) {
    throw failure('Use a PNG, JPEG or WebP smaller than 3 MB.');
  }
  const bytes=Buffer.from(p.base64,'base64');
  if (!bytes.length||bytes.length>3*1024*1024||bytes.toString('base64').replace(/=+$/,'')!==p.base64.replace(/=+$/,'')) throw failure('Invalid photo or photo exceeds 3 MB.');
  return database.transaction(async tx=>{
    await verifySiteExecution(tx,projectId,p.token,{...context,env});
    const project=await projectRow(tx,projectId);
    const linked=project.cells.driveFolderId,root=linked?await previewProjectFolder(project.cells,files,env):projectsDriveRoot(env);
    const folder=await files.getOrCreateFolder(root,linked?'Site Photos':'Site Photos - '+(project.cells.projectNo||projectId));
    const file=await files.upload(folder,{name,mimeType,bytes});
    return {fileId:file.id,name,url:'https://drive.google.com/thumbnail?id='+encodeURIComponent(file.id)+'&sz=w1200',
      viewUrl:file.webViewLink||'https://drive.google.com/file/d/'+encodeURIComponent(file.id)+'/view'};
  });
}
