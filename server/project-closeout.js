import {db} from './supabase-db.js';
import {createDriveAttachments} from './drive-attachments.js';
import {previewProjectFolder} from './drawing-publishing.js';
import {checkProjectRead,requireProject} from './permissions.js';
import {applyDelegation} from './workflow-management.js';
import {completeProjectRecord} from './project-writes.js';
import {active,actor,failure,insertRecord,now,projectChildren,projectRow,text,updateRecord} from './project-write-storage.js';

const defaultCloseout=projectId=>({projectId,compiled:false,certificateSigned:false,responsibleId:'',responsibleName:''});
const folderNames={AsBuilt:'As-Built Drawings',Certificate:'Completion Certificate',SitePictures:'Site Pictures'};
const formats={AsBuilt:/\.(pdf|dwg|dxf|dwt|dwf|zip)$/i,Certificate:/\.(pdf|jpg|jpeg|png|webp)$/i,SitePictures:/\.(jpg|jpeg|png|webp|heic|heif)$/i};
const drive=createDriveAttachments();

async function closeout(tx,projectId) {
  const byProject=table=>tx.rows(`SELECT cells FROM enlighten_operational.${table} WHERE cells->>'projectId'=$1 ORDER BY source_row_number NULLS LAST,record_id`,[projectId]);
  const [saved]=await byProject('project_closeout'),stored=saved?.cells||defaultCloseout(projectId);
  const delegation=await tx.rows(`SELECT cells FROM enlighten_operational.workflow_delegations
    WHERE cells->>'projectId' IN ($1,'*') AND lower(btrim(cells->>'task'))='project closeout'
      AND lower(btrim(cells->>'subtask'))='compile as-built drawings'
    ORDER BY source_row_number NULLS LAST,record_id`,[projectId]);
  const rule=delegation.find(row=>row.cells.projectId===projectId)?.cells||
    (!stored.responsibleId?delegation.find(row=>row.cells.projectId==='*')?.cells:null);
  const files=(await byProject('files')).map(row=>row.cells).filter(row=>row.linkedEntityType==='Project Closeout'&&!active(row.trashed))
    .map(row=>({...row,closeoutKind:String(row.linkedEntityId).split(':').at(-1)}));
  return {...stored,...(rule?{responsibleId:rule.responsibleId||'',responsibleName:rule.responsibleName||''}:{}),files};
}

export async function getProjectCloseout(payload,{user,database=db}) {
  const id=text(payload.projectId);
  if (!id) throw failure('Choose a project.');
  return database.transaction(async tx=>{
    await checkProjectRead(tx,user,id);
    return closeout(tx,id);
  },{readOnly:true});
}

export async function saveProjectCloseout(payload,{user,database=db}) {
  const id=text(payload.projectId),role=requireProject(user,id,{write:true});
  const assign=Object.hasOwn(payload,'responsibleId'),compiled=Object.hasOwn(payload,'compiled'),signed=Object.hasOwn(payload,'certificateSigned');
  if (assign&&role!=='Admin') throw failure('Project Admin required to delegate closeout.',403);
  if (signed&&role!=='Admin') throw failure('Project Admin confirms the signed certificate.',403);
  if ([compiled&&'compiled',signed&&'certificateSigned'].filter(Boolean).some(field=>typeof payload[field]!=='boolean')) {
    throw failure('Choose a valid checkbox value.');
  }
  return database.transaction(async tx=>{
    if (!await projectRow(tx,id)) throw failure('Project not found.',404);
    const before=await closeout(tx,id);
    if (compiled&&role!=='Admin'&&String(before.responsibleId)!==String(user.userId)) {
      throw failure('Only the responsible person or Project Admin can complete this task.',403);
    }
    if (payload.certificateSigned&&!before.files.some(file=>file.closeoutKind==='Certificate')) throw failure('Upload the signed completion certificate first.');
    let person;
    if (assign&&payload.responsibleId) {
      const rows=await tx.rows("SELECT cells FROM enlighten_operational.people WHERE cells->>'userId'=$1",[String(payload.responsibleId)]);
      person=rows.find(row=>active(row.cells.active))?.cells;
      if (!person) throw failure('Choose an active team member.');
    }
    if (assign) await applyDelegation(tx,id,[{task:'Project Closeout',subtask:'Compile As-Built Drawings',responsibleId:payload.responsibleId||''}],user);
    const [prior]=await projectChildren(tx,'project_closeout',id);
    const row={...(prior?.cells||defaultCloseout(id)),...(assign?{responsibleId:person?.userId||'',responsibleName:person?.name||''}:{}),
      ...(compiled?{compiled:payload.compiled}:{}),...(signed?{certificateSigned:payload.certificateSigned}:{}),updatedAt:now(),updatedBy:actor(user)};
    if (prior) await updateRecord(tx,'project_closeout',prior.record_id,row);
    else await insertRecord(tx,'project_closeout',row);
    return closeout(tx,id);
  });
}

async function upload(payload,{user,database=db,files=drive,env=process.env},finish) {
  const id=text(payload.projectId),uploadId=text(payload.uploadId),kind=text(payload.closeoutKind),name=String(payload.fileName||'');
  requireProject(user,id,{write:true});
  if (!uploadId||!Object.hasOwn(formats,kind)||!formats[kind].test(name)||name.length>250||/[\u0000-\u001f]/.test(name)||
      !Number.isSafeInteger(payload.fileSize)||payload.fileSize<1||payload.fileSize>100*1024*1024) throw failure('Choose a supported closeout file up to 100 MB.');
  const mimeType=text(payload.mimeType)||'application/octet-stream';
  if (!/^[\w.+-]+\/[\w.+-]+$/.test(mimeType)) throw failure('Invalid file type.');
  return database.transaction(async tx=>{
    await tx.query('SELECT pg_advisory_xact_lock(hashtextextended($1,0))',['drawing-upload:'+uploadId]);
    const project=await projectRow(tx,id);
    if (!project) throw failure('Project not found.',404);
    const records=await tx.rows("SELECT cells FROM enlighten_operational.files WHERE cells->>'fileId'=$1 LIMIT 2",[uploadId]);
    const existing=records[0]?.cells,linkedEntityId=id+':'+kind;
    if (records.length>1||existing&&(String(existing.projectId)!==id||existing.linkedEntityType!=='Project Closeout'||
      existing.linkedEntityId!==linkedEntityId||active(existing.trashed))) throw failure('Upload mismatch.',409);
    if (existing) return finish?existing:{file:existing};
    const root=await previewProjectFolder(project.cells,files,env);
    const output=(await files.findFolders(root,['Output','02 Design Output']))[0]?.id||await files.getOrCreateFolder(root,'Output');
    const parent=await files.getOrCreateFolder(output,'Project Closeout');
    const folder=await files.getOrCreateFolder(parent,folderNames[kind]);
    if (!finish) return files.startResumable(folder,{name,mimeType,size:payload.fileSize});
    const driveFileId=text(payload.driveFileId),file=await files.metadata(driveFileId);
    if (file.trashed||file.name!==name||Number(file.size)!==payload.fileSize||!file.parents?.includes(folder)) {
      throw failure('Closeout upload does not match the selected project or file.',409);
    }
    const row={fileId:uploadId,projectId:id,linkedEntityType:'Project Closeout',linkedEntityId,folderCategory:'Output',
      direction:'Output',fileName:name,mimeType:payload.mimeType||'',driveFileId,driveUrl:'https://drive.google.com/file/d/'+encodeURIComponent(driveFileId)+'/view',
      uploadedAt:now(),uploadedBy:actor(user)};
    await insertRecord(tx,'files',row);
    return row;
  });
}

export const beginCloseoutUpload=(payload,context)=>upload(payload,context,false);
export const finishCloseoutUpload=(payload,context)=>upload(payload,context,true);

export async function completeProjectCloseout(payload,{user,database=db,files=drive}) {
  const id=text(payload.projectId);
  requireProject(user,id,{write:true,admin:true});
  return database.transaction(async tx=>{
    const project=await projectRow(tx,id);
    if (!project) throw failure('Project not found.',404);
    const view=await closeout(tx,id);
    let ready=active(view.compiled)&&active(view.certificateSigned);
    if (ready) {
      for (const kind of Object.keys(folderNames)) {
        let found=false;
        for (const row of view.files.filter(file=>file.closeoutKind===kind)) {
          try {
            const file=await files.metadata(row.driveFileId);
            if (!file.trashed&&Number(file.size)>0) {found=true;break;}
          } catch {}
        }
        if (!found) {ready=false;break;}
      }
    }
    if (!ready) throw failure('Complete the as-built task, add as-built drawings and site pictures, and confirm the signed certificate before closing the project.',409);
    return completeProjectRecord(tx,project,payload.completionOutcome,user);
  });
}
