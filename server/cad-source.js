import {db} from './supabase-db.js';
import {createDriveAttachments} from './drive-attachments.js';
import {previewProjectFolder} from './drawing-publishing.js';
import {requireProject} from './permissions.js';
import {failure,text} from './project-write-storage.js';

const drive=createDriveAttachments(),max=100*1024*1024,chunkMax=6*1024*1024;
export async function getCadSource(p,{user,database=db,files=drive,env=process.env}) {
  const projectId=text(p.projectId),fileId=text(p.driveFileId);
  if (!projectId||!fileId) throw failure('Choose a saved project drawing.');
  requireProject(user,projectId);
  const rows=await database.rows("SELECT cells FROM enlighten_operational.projects WHERE cells->>'projectId'=$1 LIMIT 2",[projectId]);
  if (rows.length!==1) throw failure('Project not found.',404);
  const folder=await previewProjectFolder(rows[0].cells,files,env),file=await files.metadata(fileId);
  if (file.trashed||!await files.within(file,folder)) throw failure('Drawing does not belong to this project or is in trash.',403);
  if (!/\.(dwg|dwt|dwf|dxf)$/i.test(file.name)) throw failure('Select a DWG, DWT, DWF or DXF drawing.');
  const size=Number(file.size);
  if (!Number.isSafeInteger(size)||size<1||size>max) throw failure('CAD preview supports drawings up to 100 MB.');
  if (!Number.isFinite(Date.parse(file.modifiedTime))) throw failure('Drive modification time is unavailable.',503);
  return {projectId,driveFileId:file.id,fileName:file.name,size,modified:new Date(file.modifiedTime).toISOString(),canPrepare:!/^viewer$/i.test(user.appAccess)};
}

export async function getCadSourceTransfer(p,context) {
  if (context.internal!==true) throw failure('Signed server request required.',403);
  const source=await getCadSource(p,context),files=context.files||drive;
  if (!source.canPrepare) throw failure('Project edit access required to prepare a drawing.',403);
  if (p.modified!==source.modified) throw failure('Drawing changed. Refresh and retry.',409);
  return {...source,read:async(offset,length)=>{
    if (!Number.isSafeInteger(offset)||!Number.isSafeInteger(length)||offset<0||length<1||length>chunkMax||offset+length>source.size) {
      throw failure('Invalid drawing range.');
    }
    return files.range(source.driveFileId,offset,offset+length-1,source.size);
  }};
}

export async function getCadSourceChunk(p,context) {
  const transfer=await getCadSourceTransfer(p,{...context,internal:true});
  const bytes=await transfer.read(Number(p.offset),Number(p.length));
  return {data:bytes.toString('base64')};
}
