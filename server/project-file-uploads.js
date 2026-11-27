import {db} from './supabase-db.js';
import {createDriveAttachments} from './drive-attachments.js';
import {previewProjectFolder} from './drawing-publishing.js';
import {projectCategories} from './project-drive.js';
import {requireProject,wihProjectRole} from './permissions.js';
import {active,actor,failure,insertRecord,nextEntityId,now,projectRow,text} from './project-write-storage.js';

const drive=createDriveAttachments(),maxSize=3*1024*1024;
function decode(value) {
  const encoded=String(value||'').replace(/^data:[^;]+;base64,/,'');
  if (!encoded||encoded.length>4*1024*1024||!/^[A-Za-z0-9+/]+={0,2}$/.test(encoded)) throw failure('Use a valid attachment up to 3 MB.');
  const bytes=Buffer.from(encoded,'base64');
  if (!bytes.length||bytes.length>maxSize||bytes.toString('base64').replace(/=+$/,'')!==encoded.replace(/=+$/,'')) {
    throw failure('Use a valid attachment up to 3 MB.');
  }
  return bytes;
}

async function categoryFolder(root,category,files) {
  const key=Object.keys(projectCategories).find(key=>projectCategories[key].includes(category));
  const folders=await files.findFolders(root,key?projectCategories[key]:[category]);
  return folders[0]?.id||files.getOrCreateFolder(root,key||category);
}

export async function uploadFile(p,{user,database=db,files=drive,env=process.env}) {
  const projectId=text(p.projectId),fileName=text(p.fileName),direction=text(p.direction),mimeType=text(p.mimeType);
  requireProject(user,projectId,{write:true});
  if (!fileName||fileName.length>250||/[\x00-\x1f]/.test(fileName)||mimeType&&!/^[\w.+-]+\/[\w.+-]+$/.test(mimeType)) {
    throw failure('Invalid file name or MIME type.');
  }
  const folderCategory=/^sent$/i.test(direction)?'Sent':/^received$/i.test(direction)?'Received':text(p.folderCategory)||'Received';
  if (folderCategory.length>120||/[\x00-\x1f/\\]/.test(folderCategory)) throw failure('Invalid project folder name.');
  const bytes=decode(p.fileBase64);
  let uploaded;
  try {
    return await database.transaction(async tx=>{
      const project=await projectRow(tx,projectId);
      if (!project) throw failure('Project not found.',404);
      if (active(project.cells.completed)||/^completed$/i.test(text(project.cells.projectStatus))) throw failure('The project is completed.',409);
      const root=await previewProjectFolder(project.cells,files,env);
      let folder=await categoryFolder(root,folderCategory,files);
      if (projectCategories.Received.includes(folderCategory)) {
        const date=text(p.receivedSentDate).slice(0,10)||new Date(Date.now()+19800000).toISOString().slice(0,10);
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date)||!Number.isFinite(Date.parse(date))||new Date(date).toISOString().slice(0,10)!==date) {
          throw failure('Valid received date required.');
        }
        folder=await files.getOrCreateFolder(folder,date);
      }
      uploaded=await files.upload(folder,{name:fileName,mimeType:mimeType||'application/octet-stream',bytes});
      const row={fileId:await nextEntityId(tx,'files'),projectId,linkedEntityType:text(p.linkedEntityType)||'Project',
        linkedEntityId:text(p.linkedEntityId)||projectId,folderCategory,fileName,mimeType,driveFileId:uploaded.id,
        driveUrl:uploaded.webViewLink||'https://drive.google.com/file/d/'+encodeURIComponent(uploaded.id)+'/view',
        drawingType:text(p.drawingType),floor:text(p.floor),area:text(p.area),revisionNo:text(p.revisionNo),direction,
        uploadedAt:now(),uploadedBy:actor(user)};
      await insertRecord(tx,'files',row);
      return row;
    });
  } catch(error) {
    if (uploaded) await files.trash(uploaded.id).catch(()=>{});
    throw error;
  }
}

export async function uploadTechnicalFixtureImage(p,{user,database=db,files=drive,env=process.env}) {
  const projectId=text(p.projectId);
  requireProject(user,projectId,{write:true});
  if (!wihProjectRole(user,projectId)) throw failure('Project staff access required to edit the Technical Table.',403);
  const name=text(p.name).replace(/[\x00-\x1f/\\]/g,'_').slice(0,150);
  const mimeType=/\.png$/i.test(name)?'image/png':/\.jpe?g$/i.test(name)?'image/jpeg':/\.webp$/i.test(name)?'image/webp':'';
  if (!mimeType) throw failure('Use a PNG, JPEG or WebP smaller than 3 MB.');
  const bytes=decode(p.base64);
  const rows=await database.rows("SELECT cells FROM enlighten_operational.projects WHERE cells->>'projectId'=$1 LIMIT 2",[projectId]);
  if (rows.length!==1) throw failure('Project not found.',404);
  const root=await previewProjectFolder(rows[0].cells,files,env);
  const folder=await categoryFolder(root,'Received',files);
  const file=await files.upload(folder,{name,mimeType,bytes});
  return {id:file.id,driveFileId:file.id,label:name,url:'https://drive.google.com/thumbnail?id='+encodeURIComponent(file.id)+'&sz=w1600'};
}

async function pastWork(p,{user,database=db,files=drive,env=process.env},finish) {
  const projectId=text(p.projectId),id=text(p.uploadId),name=String(p.fileName||''),destination=text(p.destination);
  requireProject(user,projectId,{write:true,admin:true});
  const mimeType=text(p.mimeType),date=text(p.originalDate);
  if (!Object.hasOwn(projectCategories,destination)||!id||!name||name.length>250||/[\x00-\x1f]/.test(name)) throw failure('Choose a valid archive folder and file.');
  if (!Number.isSafeInteger(p.fileSize)||p.fileSize<1||p.fileSize>100*1024*1024) throw failure('Choose files up to 100 MB each.');
  if (mimeType&&!/^[\w.+-]+\/[\w.+-]+$/.test(mimeType)) throw failure('Invalid file MIME type.');
  if (date&&(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!Number.isFinite(Date.parse(date))||new Date(date).toISOString().slice(0,10)!==date)) {
    throw failure('Enter a valid original date or leave it unknown.');
  }
  const meta=Object.fromEntries(['drawingCode','floor','area','revisionNo'].map(key=>[key,String(p[key]||'')]));
  if (Object.values(meta).some(value=>value.length>500)) throw failure('Drawing details are too long.');
  return database.transaction(async tx=>{
    await tx.query('SELECT pg_advisory_xact_lock(hashtextextended($1,0))',['drawing-upload:'+id]);
    const project=await projectRow(tx,projectId);
    if (!project) throw failure('Project not found.',404);
    const rows=await tx.rows("SELECT cells FROM enlighten_operational.files WHERE cells->>'fileId'=$1 LIMIT 2",[id]);
    const prior=rows[0]?.cells;
    if (rows.length>1||prior&&(String(prior.projectId)!==projectId||prior.direction!==destination||!active(prior.historicalImport)||active(prior.trashed))) {
      throw failure('Archive upload ID mismatch.',409);
    }
    if (prior) return finish?prior:{file:prior};
    const root=await previewProjectFolder(project.cells,files,env);
    let folder=await categoryFolder(root,destination,files);
    if (destination==='Received') folder=await files.getOrCreateFolder(folder,date||'Undated');
    if (!finish) return files.startResumable(folder,{name,mimeType:mimeType||'application/octet-stream',size:p.fileSize});
    const driveId=text(p.driveFileId);
    if (!driveId) throw failure('Upload completion has not been verified.',403);
    const file=await files.metadata(driveId);
    if (file.trashed||file.name!==name||Number(file.size)!==p.fileSize||!file.parents?.includes(folder)) {
      throw failure('Archive file does not match the selected project/upload.',409);
    }
    const row={fileId:id,projectId,linkedEntityType:'Historical Import',linkedEntityId:id,folderCategory:destination,fileName:name,mimeType,
      driveFileId:file.id,driveUrl:file.webViewLink||'https://drive.google.com/file/d/'+encodeURIComponent(file.id)+'/view',direction:destination,
      historicalImport:true,...meta,drawingType:meta.drawingCode,receivedSentDate:date,originalDate:date,uploadedAt:now(),uploadedBy:actor(user)};
    await insertRecord(tx,'files',row);
    return row;
  });
}

export const beginPastWorkUpload=(p,context)=>pastWork(p,context,false);
export const finishPastWorkUpload=(p,context)=>pastWork(p,context,true);
