import {db} from './supabase-db.js';
import {createDriveAttachments} from './drive-attachments.js';
import {requireAssignedTask,requireProject} from './permissions.js';
import {previewProjectFolder} from './drawing-publishing.js';
import {active,actor,failure,insertRecord,now,projectRow,text} from './project-write-storage.js';

const filesClient=createDriveAttachments();
const categories={Base:['Base'],Output:['Output','02 Design Output']};

async function verifyWork(tx,user,projectId,taskId) {
  const [task]=await tx.rows("SELECT cells FROM enlighten_operational.design_tasks WHERE cells->>'designTaskId'=$1 AND cells->>'projectId'=$2 LIMIT 1",[taskId,projectId]);
  const [wih]=await tx.rows("SELECT cells FROM enlighten_operational.wih WHERE cells->>'designTaskId'=$1 AND cells->>'projectId'=$2 LIMIT 1",[taskId,projectId]);
  requireAssignedTask(user,task?.cells,wih?.cells);
}

async function baseUpload(payload,{user,database=db,files=filesClient,env=process.env},destination,finish) {
  const projectId=text(payload.projectId),uploadId=text(payload.uploadId),fileName=String(payload.fileName||'');
  const mimeType=text(payload.mimeType)||'application/octet-stream',taskId=text(payload.designTaskId);
  const fileSize=payload.fileSize;
  if (!projectId||!uploadId||!fileName||fileName.length>250||/[\u0000-\u001f]/.test(fileName)||
      !Number.isSafeInteger(fileSize)||fileSize<1||fileSize>100*1024*1024) throw failure('Choose a drawing file up to 100 MB.');
  if (!/^[\w.+-]+\/[\w.+-]+$/.test(mimeType)) throw failure('Invalid drawing MIME type.');
  requireProject(user,projectId,{write:true});
  if (destination==='Output'&&!taskId) throw failure('Choose a Work in Hand task.');
  return database.transaction(async tx=>{
    await tx.query('SELECT pg_advisory_xact_lock(hashtextextended($1,0))',['drawing-upload:'+uploadId]);
    const project=await projectRow(tx,projectId);
    if (!project) throw failure('Project not found.',404);
    if (destination==='Output') await verifyWork(tx,user,projectId,taskId);
    const matches=await tx.rows("SELECT cells FROM enlighten_operational.files WHERE cells->>'fileId'=$1 LIMIT 2",[uploadId]);
    const existing=matches[0]?.cells;
    if (matches.length>1||existing&&(active(existing.trashed)||existing.projectId!==projectId||existing.direction!==destination||
         destination==='Output'&&String(existing.linkedEntityId)!==taskId)) throw failure('Upload project mismatch.',409);
    if (existing) return finish?existing:{file:existing};
    const root=await previewProjectFolder(project.cells,files,env);
    const available=await files.findFolders(root,categories[destination]);
    const target=available[0]?.id||await files.getOrCreateFolder(root,destination);
    if (!finish) return files.startResumable(target,{name:fileName,mimeType,size:fileSize});
    const driveFileId=text(payload.driveFileId);
    if (!driveFileId) throw failure('Upload completion has not been verified.',403);
    const file=await files.metadata(driveFileId);
    if (file.trashed||!file.parents?.includes(target)||file.name!==fileName||Number(file.size)!==fileSize) {
      throw failure('Drawing upload does not match this project or file.',409);
    }
    const row={fileId:uploadId,projectId,linkedEntityType:destination==='Output'?'Design Task':'Project',
      linkedEntityId:destination==='Output'?taskId:projectId,folderCategory:destination,fileName,mimeType:payload.mimeType||'',driveFileId,
      driveUrl:'https://drive.google.com/file/d/'+encodeURIComponent(driveFileId)+'/view',
      direction:destination,uploadedAt:now(),uploadedBy:actor(user)};
    await insertRecord(tx,'files',row);
    return row;
  });
}

export const beginBaseDrawingUpload=(payload,context)=>baseUpload(payload,context,'Base',false);
export const finishBaseDrawingUpload=(payload,context)=>baseUpload(payload,context,'Base',true);
export const beginWorkDrawingUpload=(payload,context)=>baseUpload(payload,context,'Output',false);
export const finishWorkDrawingUpload=(payload,context)=>baseUpload(payload,context,'Output',true);
