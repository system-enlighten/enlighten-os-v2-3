import {db} from './supabase-db.js';
import {createDriveAttachments} from './drive-attachments.js';
import {requireProject} from './permissions.js';
import {classifyDrawing} from './drawing-classification.js';
import {previewProjectFolder} from './drawing-publishing.js';
import {projectCategories} from './project-drive.js';
import {active,actor,failure,insertRecord,nextEntityId,now,projectRow,text,writeActivity} from './project-write-storage.js';

const drive=createDriveAttachments();
const today=()=>new Date(Date.now()+330*60000).toISOString().slice(0,10);
const fileUrl=id=>'https://drive.google.com/file/d/'+encodeURIComponent(id)+'/view';

function validDate(value) {
  const date=String(value||today()).slice(0,10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)||!Number.isFinite(Date.parse(date))||new Date(date).toISOString().slice(0,10)!==date) {
    throw failure('Valid received date required.');
  }
  return date;
}

function validate(payload) {
  const floors=[...new Set((Array.isArray(payload.floors)?payload.floors:[payload.floor]).map(text).filter(Boolean))];
  const drawingType=text(payload.drawingType),fileName=String(payload.fileName||'');
  if (!floors.length||!drawingType||!fileName||fileName.length>250||/[\u0000-\u001f]/.test(fileName)) throw failure('Choose drawing floors, type and file.');
  const mimeType=text(payload.mimeType)||'application/octet-stream';
  if (!/^[\w.+-]+\/[\w.+-]+$/.test(mimeType)) throw failure('Invalid drawing file type.');
  let parts=[{floors,drawingType,coverage:[]}];
  if (payload.drawingParts!==undefined) {
    if (!Array.isArray(payload.drawingParts)||!payload.drawingParts.length||payload.drawingParts.length>20) throw failure('Use 1 to 20 drawing parts.');
    parts=payload.drawingParts.map(item=>{
      const floors=[...new Set((Array.isArray(item?.floors)?item.floors:[]).map(text).filter(Boolean))];
      const drawingType=text(item?.drawingType);
      if (!floors.length||!drawingType) throw failure('Select a drawing type and floors for each part.');
      const coverage=(Array.isArray(item.coverage)?item.coverage:[]).map(area=>({floor:text(area?.floor),area:text(area?.area)}));
      if (coverage.some(area=>!area.area||!floors.includes(area.floor))) throw failure('Select valid floors and areas for each drawing part.');
      return {floors,drawingType,coverage};
    });
  }
  return {...payload,floors,drawingType,fileName,mimeType,parts,date:validDate(payload.receivedSentDate)};
}

function decode(value) {
  const encoded=typeof value==='string'?value.replace(/^data:[^;]+;base64,/,''):'';
  if (!encoded||encoded.length>4194304||!/^[A-Za-z0-9+/]+={0,2}$/.test(encoded)) throw failure('Choose a valid drawing file or use the resumable upload.');
  const bytes=Buffer.from(encoded,'base64');
  if (!bytes.length||bytes.length>3145728) throw failure('Choose a drawing under 3 MB or use the resumable upload.');
  return bytes;
}

async function receivedRoots(project,files,env,create=false) {
  const root=await previewProjectFolder(project,files,env);
  const categories=await files.findFolders(root,projectCategories.Received);
  return categories.length||!create?categories:[{id:await files.getOrCreateFolder(root,'Received')}];
}

async function findReceived(tx,id,projectId) {
  if (!id) return null;
  const seen=new Set();
  let drawingId=String(id);
  while (drawingId&&!seen.has(drawingId)&&seen.size<11) {
    seen.add(drawingId);
    const rows=await tx.rows("SELECT cells FROM enlighten_operational.drawing_register WHERE cells->>'drawingId'=$1 LIMIT 2",[drawingId]);
    if (rows.length>1) throw failure('Drawing ID is duplicated.',409);
    const row=rows[0]?.cells;
    if (row) {
      if (String(row.projectId)!==projectId) throw failure('Drawing ID belongs to another project.',409);
      if (!row.duplicateOf) return row;
      drawingId=String(row.duplicateOf);
      continue;
    }
    if (seen.size!==1) return null;
    const [alias]=await tx.rows("SELECT cells FROM enlighten_operational.received_upload_aliases WHERE cells->>'uploadId'=$1 LIMIT 1",[drawingId]);
    if (!alias) return null;
    if (String(alias.cells.projectId)!==projectId) throw failure('Upload belongs to another project.',409);
    drawingId=alias.cells.drawingId;
  }
  throw failure('The drawing duplicate chain is invalid.',409);
}

async function ensureLink(tx,row,payload,user) {
  const exists=await tx.rows("SELECT 1 FROM enlighten_operational.files WHERE cells->>'projectId'=$1 AND cells->>'linkedEntityId'=$2 LIMIT 1",
    [row.projectId,row.drawingId]);
  if (exists.length) return;
  await insertRecord(tx,'files',{fileId:row.fileId||await nextEntityId(tx,'files'),projectId:row.projectId,
    linkedEntityType:'Drawing',linkedEntityId:row.drawingId,folderCategory:'Received',fileName:payload.fileName||'',mimeType:payload.mimeType||'',
    driveFileId:row.driveFileId||'',driveUrl:row.driveUrl||'',drawingType:row.drawingType,floor:row.floor,
    floorTags:row.floorTags||'',area:row.area||'',revisionNo:row.revisionNo||'R0',direction:'Received',uploadedAt:now(),uploadedBy:actor(user)});
}

async function register(tx,project,payload,part,id,file,user,{combined=false,linked=true}={}) {
  const projectId=project.projectId;
  const prior=await findReceived(tx,id,projectId);
  if (prior) {
    if (linked) await ensureLink(tx,prior,payload,user);
    return prior;
  }
  const row={drawingId:id||await nextEntityId(tx,'drawing_register'),projectId,direction:'Received',receivedSentDate:payload.date,
    drawingType:part.drawingType,floor:part.floors.join(', '),floorTags:JSON.stringify(part.floors),area:payload.area||'',
    revisionNo:payload.revisionNo||'R0',fileId:linked?await nextEntityId(tx,'files'):payload.fileId||'',
    driveFileId:file?.id||'',driveUrl:file?.id?(file.webViewLink||fileUrl(file.id)):'',
    receivedFromSentTo:payload.receivedFrom||payload.receivedFromSentTo||'',classified:false,status:'Awaiting Classification',
    notes:payload.notes||'',createdAt:now(),createdBy:actor(user)};
  await insertRecord(tx,'drawing_register',row);
  if (linked) await ensureLink(tx,row,payload,user);
  if (!combined) await writeActivity(tx,user,'RECEIVE','Drawing',row.drawingId,projectId,null,row);
  return row;
}

async function registerParts(tx,project,payload,file,user) {
  let shared=file;
  const rows=[];
  for (const [index,part] of payload.parts.entries()) {
    if (part.coverage.length) {
      const zones=(await tx.rows("SELECT cells FROM enlighten_operational.floor_zones WHERE cells->>'projectId'=$1",[project.projectId])).map(row=>row.cells);
      const norm=value=>text(value).toLowerCase();
      if (part.coverage.some(area=>!zones.some(zone=>active(zone.active)&&norm(zone.floor)===norm(area.floor)&&norm(zone.area)===norm(area.area)))) {
        throw failure('Select areas saved in Floor & Zone.');
      }
    }
    const partId=index?String(payload.drawingId)+'-PART-'+index:payload.drawingId;
    let row=await register(tx,project,payload,part,partId,shared,user);
    if (part.coverage.length) {
      const result=await classifyDrawing(tx,project,{drawingId:row.drawingId,drawingType:part.drawingType,coverage:part.coverage},user);
      row=result.drawings[0];
    }
    rows.push(row);
    shared={id:row.driveFileId,webViewLink:row.driveUrl};
  }
  return {...rows[0],parts:rows};
}

async function transact(payload,{user,database=db,files=drive,env=process.env},work) {
  const id=text(payload.projectId);
  requireProject(user,id,{write:true});
  return database.transaction(async tx=>{
    if (payload.drawingId) await tx.query('SELECT pg_advisory_xact_lock(hashtextextended($1,0))',['received:'+payload.drawingId]);
    const project=await projectRow(tx,id);
    if (!project) throw failure('Project not found.',404);
    if (active(project.cells.completed)||text(project.cells.projectStatus).toLowerCase()==='completed') throw failure('The project is completed.',409);
    return work(tx,project.cells,files,env);
  });
}

export async function beginReceivedUpload(input,context) {
  const payload=validate(input);
  if (!text(payload.drawingId)||!Number.isSafeInteger(payload.fileSize)||payload.fileSize<1) throw failure('Choose a non-empty drawing file.');
  return transact(payload,context,async(tx,project,files,env)=>{
    const prior=await findReceived(tx,payload.drawingId,project.projectId);
    if (prior) return {drawing:await registerParts(tx,project,payload,{id:prior.driveFileId,webViewLink:prior.driveUrl},context.user)};
    const [root]=await receivedRoots(project,files,env,true);
    const folder=await files.getOrCreateFolder(root.id,payload.date);
    return files.startResumable(folder,{name:payload.fileName,mimeType:payload.mimeType,size:payload.fileSize});
  });
}

export async function finishReceivedUpload(input,context) {
  const payload=validate(input);
  if (!text(payload.drawingId)||!text(payload.driveFileId)||!Number.isSafeInteger(payload.fileSize)||payload.fileSize<1) {
    throw failure('Upload completion has not been verified.',403);
  }
  return transact(payload,context,async(tx,project,files,env)=>{
    const prior=await findReceived(tx,payload.drawingId,project.projectId);
    if (prior) return registerParts(tx,project,payload,{id:prior.driveFileId,webViewLink:prior.driveUrl},context.user);
    const file=await files.metadata(payload.driveFileId);
    let belongs=false;
    for (const root of await receivedRoots(project,files,env)) if (await files.within(file,root.id)) {belongs=true;break;}
    if (!belongs||file.trashed||file.name!==payload.fileName||Number(file.size)!==payload.fileSize) {
      throw failure('The uploaded drawing does not match this project or file size.',409);
    }
    return registerParts(tx,project,payload,file,context.user);
  });
}

async function cleanupUpload(database,files,uploaded) {
  if (!uploaded?.id) return;
  try {
    const [linked]=await database.rows("SELECT 1 FROM enlighten_operational.drawing_register WHERE cells->>'driveFileId'=$1 LIMIT 1",[uploaded.id]);
    if (!linked) await files.trash(uploaded.id);
  } catch(error) {console.error('Received upload cleanup could not be confirmed',error.name);}
}

export async function receiveDrawing(input,context) {
  const payload=validate(input),bytes=decode(payload.fileBase64);
  payload.drawingId=text(payload.drawingId)||'';
  if (payload.parts.length>1&&!payload.drawingId) throw failure('A drawing ID is required for multi-part uploads.');
  let uploaded;
  try {
    return await transact(payload,context,async(tx,project,files,env)=>{
      const prior=await findReceived(tx,payload.drawingId,project.projectId);
      if (prior) return registerParts(tx,project,payload,{id:prior.driveFileId,webViewLink:prior.driveUrl},context.user);
      const [root]=await receivedRoots(project,files,env,true);
      const folder=await files.getOrCreateFolder(root.id,payload.date);
      uploaded=await files.upload(folder,{name:payload.fileName,mimeType:payload.mimeType,bytes});
      return registerParts(tx,project,payload,uploaded,context.user);
    });
  } catch(error) {
    await cleanupUpload(context.database||db,context.files||drive,uploaded);
    throw error;
  }
}

export async function receiveAndClassifyDrawing(input,context) {
  const floor=text(input.floor);
  const areas=[...new Map((Array.isArray(input.areas)?input.areas:String(input.area||'').split(','))
    .map(text).filter(Boolean).map(area=>[area.toLowerCase(),area])).values()];
  const drawingType=text(input.drawingType);
  if (!floor||!areas.length||!drawingType) throw failure('Choose a drawing type, floor and area.');
  const physical=Boolean(input.fileBase64&&input.fileName);
  const payload=physical?validate({...input,floors:[floor]}):{...input,drawingType,date:validDate(input.receivedSentDate)};
  const bytes=physical?decode(input.fileBase64):null;
  let uploaded;
  try {
    return await transact({...payload,drawingId:''},context,async(tx,project,files,env)=>{
      if (physical) {
        const [root]=await receivedRoots(project,files,env,true);
        const folder=await files.getOrCreateFolder(root.id,payload.date);
        uploaded=await files.upload(folder,{name:payload.fileName,mimeType:payload.mimeType,bytes});
      }
      const file=uploaded||(input.driveFileId?{id:String(input.driveFileId),webViewLink:input.driveUrl||''}:null);
      if (file&&!physical) {
        const metadata=await files.metadata(file.id);
        let belongs=false;
        for (const root of await receivedRoots(project,files,env)) if (await files.within(metadata,root.id)) {belongs=true;break;}
        if (!belongs||metadata.trashed) throw failure('This file does not belong to the current project.',403);
        file.webViewLink=metadata.webViewLink||fileUrl(file.id);
      }
      const base=await register(tx,project,payload,{drawingType,floors:[floor]},'',file,context.user,{combined:true,linked:physical});
      const {drawings,tasks,dashboardRows}=await classifyDrawing(tx,project,{...payload,drawingId:base.drawingId,drawingType,
        coverage:areas.map(area=>({floor,area}))},context.user,{combined:true,linkFile:physical});
      return {drawings,drawing:drawings[0]||null,driveFileId:file?.id||'',driveUrl:base.driveUrl,dashboardRows,createdTasks:tasks};
    });
  } catch(error) {
    await cleanupUpload(context.database||db,context.files||drive,uploaded);
    throw error;
  }
}

export async function registerEmailDrawing(tx,project,input,file,user) {
  const payload=validate(input);
  const prior=await findReceived(tx,payload.drawingId,project.projectId);
  if (prior&&String(prior.driveFileId)!==String(file.id)) throw failure('Drawing ID is already linked to another attachment.',409);
  return register(tx,project,payload,payload.parts[0],payload.drawingId,file,user);
}
