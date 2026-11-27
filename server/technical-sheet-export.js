import {createHash,createHmac} from 'node:crypto';
import {db} from './supabase-db.js';
import {createDriveAttachments,projectsDriveRoot} from './drive-attachments.js';
import {previewProjectFolder} from './drawing-publishing.js';
import {projectCategories} from './project-drive.js';
import {checkProjectRead,requireProject} from './permissions.js';
import {failure,now,projectRow,text} from './project-write-storage.js';
import {validateTechnicalSheetModel} from './technical-export-rules.js';

const drive=createDriveAttachments(),relation='enlighten_operational.technical_sheet_exports';
const link=id=>'https://docs.google.com/spreadsheets/d/'+id+'/edit';
const digest=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
const idOf=value=>{
  const id=text(value);
  if (!/^[a-zA-Z0-9-]{1,80}$/.test(id)) throw failure('Invalid export identifier.');
  return id;
};
const color=hex=>Object.fromEntries(['red','green','blue'].map((key,i)=>[key,parseInt(hex.slice(i*2,i*2+2),16)/255]));
function layout(model,sheetId) {
  const count=model.rows.length;
  const range=(rowStart,rowEnd,columnStart,columnEnd)=>({sheetId,startRowIndex:rowStart,endRowIndex:rowEnd,startColumnIndex:columnStart,endColumnIndex:columnEnd});
  const border={style:'SOLID',colorStyle:{rgbColor:color('b8b4aa')}};
  const requests=[{updateSheetProperties:{properties:{sheetId,title:'Technical Table',gridProperties:{
    rowCount:count,columnCount:13,frozenRowCount:1,hideGridlines:true
  }},fields:'title,gridProperties'}},
  {updateCells:{start:{sheetId,rowIndex:0,columnIndex:0},fields:'userEnteredValue,userEnteredFormat',rows:model.rows.map(row=>({
    values:row.values.map((value,index)=>({userEnteredValue:{stringValue:value},userEnteredFormat:{
      numberFormat:{type:'TEXT'},horizontalAlignment:row.kind==='category'&&index>0?'LEFT':'CENTER',verticalAlignment:'MIDDLE',wrapStrategy:'WRAP',
      backgroundColor:color(row.kind==='header'?'bff81c':row.kind==='divider'?'000000':row.kind==='category'||index===0?'e5e5e5':'ffffff'),
      textFormat:{fontFamily:'Helvetica Neue',fontSize:13,foregroundColor:color('142238'),bold:row.kind==='header'||row.kind==='category'||index===0}
    }}))
  }))}},
  {updateBorders:{range:range(0,count,0,13),top:border,bottom:border,left:border,right:border,innerHorizontal:border,innerVertical:border}}];
  const dimension=(kind,start,end,pixelSize)=>({updateDimensionProperties:{range:{sheetId,dimension:kind,startIndex:start,endIndex:end},properties:{pixelSize},fields:'pixelSize'}});
  for (const [index,width] of model.widths.entries()) requests.push(dimension('COLUMNS',index,index+1,width));
  requests.push(dimension('ROWS',0,count,180));
  for (const [index,row] of model.rows.entries()) if (row.kind!=='data') requests.push(dimension('ROWS',index,index+1,row.height));
  for (const merge of model.merges) requests.push({mergeCells:{range:range(merge.row-1,merge.row-1+merge.rowSpan,merge.column-1,
    merge.column-1+merge.colSpan),mergeType:'MERGE_ALL'}});
  return requests;
}

async function useJob(tx,p,user) {
  const id=idOf(p.exportId),projectId=text(p.projectId);
  requireProject(user,projectId,{write:true,admin:true});
  const [job]=await tx.rows('SELECT * FROM '+relation+' WHERE export_id=$1 AND project_id=$2 FOR UPDATE',[id,projectId]);
  if (!job) throw failure('Export is outside this project or does not exist.',404);
  if (job.created_by!==text(user.email).toLowerCase()) throw failure('Only the export creator can continue this export.',403);
  return job;
}

export async function runTechnicalImageBridge(action,payload,{env=process.env,request=fetch}={}) {
  const url=String(env.TECHNICAL_IMAGE_BRIDGE_URL||''),secret=String(env.TECHNICAL_IMAGE_BRIDGE_SECRET||'');
  if (!/^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(url)||secret.length<32) {
    throw failure('Private image export bridge is unavailable.',503);
  }
  const body=JSON.stringify({action,at:Date.now(),payload});
  const signature=createHmac('sha256',secret).update(body).digest('hex');
  const first=await request(url,{method:'POST',redirect:'manual',headers:{'Content-Type':'text/plain;charset=utf-8'},
    body:JSON.stringify({body,signature}),signal:AbortSignal.timeout(60000)});
  let response=first;
  if ([302,303].includes(first.status)) {
    const next=new URL(first.headers.get('location')||'https://invalid.example');
    if (next.protocol!=='https:'||next.host!=='script.googleusercontent.com'||next.username||next.password) throw failure('Invalid image bridge response.',503);
    response=await request(next,{redirect:'error',signal:AbortSignal.timeout(60000)});
  }
  const result=await response.json().catch(()=>({}));
  if (!response.ok||!result.ok) throw failure('Private image export could not be completed.',503);
  return result.data;
}

export async function createTechnicalSheetExport(p,{user,database=db,files=drive,env=process.env}) {
  const exportId=idOf(p.exportId),projectId=text(p.projectId),email=text(user.email).toLowerCase();
  requireProject(user,projectId,{write:true,admin:true});
  if (!email) throw failure('Verified employee email is required.',403);
  const model=validateTechnicalSheetModel(p.model),modelHash=digest(model);
  let created;
  try {
    return await database.transaction(async tx=>{
      await tx.query('SELECT pg_advisory_xact_lock(hashtextextended($1,0))',['technical-sheet-export:'+exportId]);
      const [old]=await tx.rows('SELECT * FROM '+relation+' WHERE export_id=$1 FOR UPDATE',[exportId]);
      if (old) {
        if (old.project_id!==projectId||old.created_by!==email) throw failure('Export belongs to another account or project.',403);
        if (old.model_hash!==modelHash) throw failure('Export contents changed. Start a new export.',409);
        return {exportId,status:old.status};
      }
      const project=await projectRow(tx,projectId);
      if (!project) throw failure('Project not found.',404);
      const root=await previewProjectFolder(project.cells,files,env),folders=await files.findFolders(root,projectCategories.Sent);
      const folder=folders[0]?.id||await files.getOrCreateFolder(root,'Sent');
      const title=/^[a-z0-9_-]{1,80} - TECH TABLE 01(?: - REV [1-9][0-9]{0,2})?$/i.test(p.exportTitle||'')?p.exportTitle:
        'Technical Table \u00b7 '+String(project.cells.projectName||projectId).slice(0,100)+' \u00b7 '+now().slice(0,10);
      created=await files.createSpreadsheet(folder,title);
      const info=await files.spreadsheetInfo(created.id);
      const sheetId=info.sheets?.[0]?.properties?.sheetId;
      if (!Number.isInteger(sheetId)) throw failure('Google Sheet grid is unavailable.',503);
      await files.spreadsheetBatch(created.id,layout(model,sheetId));
      await tx.query('INSERT INTO '+relation+' (export_id,project_id,spreadsheet_id,status,model_hash,manifest,created_by) VALUES ($1,$2,$3,$4,$5,$6::jsonb,$7)',
        [exportId,projectId,created.id,'building',modelHash,JSON.stringify(model.images),email]);
      return {exportId,status:'building'};
    });
  } catch(error) {
    if (created) await files.trash(created.id).catch(()=>{});
    throw error;
  }
}

export async function addTechnicalSheetImages(p,{user,database=db,bridge=runTechnicalImageBridge,env=process.env}) {
  if (!Array.isArray(p.images)||!p.images.length||p.images.length>6) throw failure('Use image batches of 1 to 6.');
  return database.transaction(async tx=>{
    const job=await useJob(tx,p,user),manifest=new Map(job.manifest.map(asset=>[asset.key,asset]));
    let total=0;
    const images=p.images.map(input=>{
      const asset=manifest.get(input?.key),base64=input?.base64;
      if (!asset||typeof base64!=='string'||base64.length>2800000||!/^[A-Za-z0-9+/]+={0,2}$/.test(base64)) throw failure('Invalid export image.');
      const bytes=Buffer.from(base64,'base64');
      total+=bytes.length;
      if (bytes.length>2*1024*1024||!bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))) {
        throw failure('Use PNG images smaller than 2 MB.');
      }
      return {...asset,base64};
    });
    if (total>3500000) throw failure('Image batch is too large.');
    const data=await bridge('addImages',{spreadsheetId:job.spreadsheet_id,images,rootId:projectsDriveRoot(env)},{env});
    if (!Number.isInteger(data?.inserted)||data.inserted!==images.length) throw failure('Some images are not embedded yet.',503);
    return data;
  });
}
export async function finishTechnicalSheetExport(p,{user,database=db,bridge=runTechnicalImageBridge,env=process.env}) {
  return database.transaction(async tx=>{
    const job=await useJob(tx,p,user);
    if (job.manifest.length&&job.status!=='complete') {
      const data=await bridge('verifyImages',{spreadsheetId:job.spreadsheet_id,keys:job.manifest.map(asset=>asset.key),rootId:projectsDriveRoot(env)},{env});
      if (data?.complete!==true) throw failure('Some images are not embedded yet. Retry the export to finish.',409);
    }
    if (job.status!=='complete') await tx.query("UPDATE "+relation+" SET status='complete' WHERE export_id=$1",[job.export_id]);
    return {url:link(job.spreadsheet_id),images:job.manifest.length};
  });
}
export async function getTechnicalSheetExport(p,{user,database=db}) {
  const projectId=text(p.projectId);
  requireProject(user,projectId);
  return database.transaction(async tx=>{
    await checkProjectRead(tx,user,projectId);
    const [row]=await tx.rows("SELECT spreadsheet_id,created_at FROM "+relation+" WHERE project_id=$1 AND status='complete' ORDER BY created_at DESC,export_id LIMIT 1",[projectId]);
    return {url:row?link(row.spreadsheet_id):'',createdAt:row?new Date(row.created_at).toISOString():''};
  },{readOnly:true});
}
