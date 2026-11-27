import {db} from './supabase-db.js';
import {attachmentFolder,createDriveAttachments,projectsDriveRoot} from './drive-attachments.js';
import {requireProject} from './permissions.js';
import {drawingFormat,drawingIssueContext} from './drawing-issue-context.js';
import {active,actor,failure,insertRecord,now,projectRow,text,updateRecord} from './project-write-storage.js';

const drive=createDriveAttachments();
const knownPackages=new Set(['General','Electrical','POP','Furniture','Kitchen','Stone']);
const categories={Sent:['Sent','03 Sent Drawings'],Output:['Output','02 Design Output']};

function packages(value) {
  if (Array.isArray(value)) return value;
  try {
    const parsed=JSON.parse(value||'[]');
    return Array.isArray(parsed)?parsed:[];
  } catch { return []; }
}

export async function previewProjectFolder(project,files,env) {
  const root=projectsDriveRoot(env);
  if (!root||!project.driveFolderId||project.driveFolderId===root) throw failure('Configure and link a project folder inside the preview Drive root.',503);
  const folder=await files.metadata(project.driveFolderId);
  if (folder.trashed||!await files.within(folder,root)) throw failure('The linked project folder is outside the preview Drive root.',403);
  return project.driveFolderId;
}

async function inAny(file,folders,files) {
  for (const folder of folders) if (await files.within(file,folder.id)) return true;
  return false;
}

async function cleanup(work) {
  try { await work(); } catch(error) { console.error('Drawing Drive cleanup could not be confirmed',error.name); }
}

export async function publishPortalDrawing(payload,{user,database=db,files=drive,env=process.env}) {
  const projectId=text(payload.projectId),driveFileId=text(payload.driveFileId),issueId=text(payload.issueId);
  if (!projectId||!driveFileId||!issueId) throw failure('Choose a project, source file and issue ID.');
  requireProject(user,projectId,{write:true,admin:true});
  const selected=packages(payload.packages);
  if (!selected.length||selected.some(item=>!knownPackages.has(item))) throw failure('Select one or more drawing packages.');
  let archive,previousParents,sentFolder,readyToCommit=false;
  try {
    return await database.transaction(async tx=>{
      await tx.query('SELECT pg_advisory_xact_lock(hashtextextended($1,0))',['issued-drawing:'+issueId]);
      const project=await projectRow(tx,projectId);
      if (!project) throw failure('Project not found.',404);
      const matches=await tx.rows("SELECT record_id,cells FROM enlighten_operational.issued_drawings WHERE cells->>'issueId'=$1 LIMIT 2 FOR UPDATE",[issueId]);
      if (matches.length>1||matches[0]&&(String(matches[0].cells.projectId)!==projectId||String(matches[0].cells.sourceFileId)!==driveFileId)) {
        throw failure('Issue ID belongs to another drawing.',409);
      }
      if (matches[0]&&!active(matches[0].cells.active)) throw failure('This issued drawing was withdrawn. Upload a fresh Output drawing.',409);
      const current=matches[0]||(await tx.rows(`SELECT record_id,cells FROM enlighten_operational.issued_drawings
        WHERE cells->>'projectId'=$1 AND cells->>'sourceFileId'=$2 ORDER BY source_row_number NULLS LAST,record_id FOR UPDATE`,
      [projectId,driveFileId])).find(row=>active(row.cells.active));
      if (current) {
        await updateRecord(tx,'issued_drawings',current.record_id,{packages:JSON.stringify([...new Set([...packages(current.cells.packages),...selected])])});
        return {issueId:current.cells.issueId,revision:current.cells.revision,saved:true};
      }
      const {details,source,task,revision}=await drawingIssueContext(tx,projectId,driveFileId);
      const folder=await previewProjectFolder(project.cells,files,env);

      const file=await files.metadata(driveFileId);
      const format=drawingFormat(file.name);
      const size=Number(file.size);
      if (!format||file.trashed||!Number.isInteger(size)||size<1||size>100*1024*1024) throw failure('Issue a PDF or CAD drawing of up to 100 MB.');
      const [sent,output]=await Promise.all([files.findFolders(folder,categories.Sent),files.findFolders(folder,categories.Output)]);
      const inSent=await inAny(file,sent,files);
      if (!inSent&&!await inAny(file,output,files)) throw failure('Only drawings in this project’s Output or Sent folders can be issued.',403);
      archive=await files.copy(driveFileId,await attachmentFolder(files,env.PORTAL_ARCHIVE_FOLDER_ID,env,'Drawing Portal Archive'),file.name);
      if (!inSent) {
        sentFolder=sent[0]?.id||await files.getOrCreateFolder(folder,'Sent');
        previousParents=(file.parents||[]).filter(parent=>parent!==sentFolder);
        await files.move(driveFileId,{add:[sentFolder],remove:previousParents});
      }
      const at=now(),name=actor(user),issuedDate=new Date(Date.now()+330*60000).toISOString().slice(0,10);
      const sentRecord={projectId,sourceDrawingId:source.cells.sourceDrawingId||task?.sourceDrawingId||'',folderCategory:'Sent',
        drawingCode:details.drawingCode,fileName:file.name,mimeType:file.mimeType||'',driveFileId,
        driveUrl:'https://drive.google.com/file/d/'+encodeURIComponent(driveFileId)+'/view',drawingType:details.drawingCode,
        floor:details.floor,area:details.area,revisionNo:revision,receivedSentDate:issuedDate,direction:'Sent',uploadedAt:at,uploadedBy:name};
      await updateRecord(tx,'files',source.record_id,sentRecord);
      await insertRecord(tx,'issued_drawings',{issueId,projectId,sourceFileId:driveFileId,archiveFileId:archive.id,
        fileName:archive.name||file.name,mimeType:archive.mimeType||file.mimeType||'',size:Number(archive.size||size),format,
        packages:JSON.stringify([...new Set(selected)]),drawingCode:details.drawingCode,floor:details.floor,area:details.area,
        revision,issuedDate,active:true,createdAt:at,createdBy:name});
      readyToCommit=true;
      return {issueId,revision,saved:true};
    });
  } catch(error) {
    if (archive) await cleanup(async()=>{
      const committed=readyToCommit&&await database.one("SELECT 1 FROM enlighten_operational.issued_drawings WHERE cells->>'issueId'=$1 AND cells->>'archiveFileId'=$2",[issueId,archive.id]);
      if (!committed) {
        if (sentFolder&&previousParents?.length) await cleanup(()=>files.move(driveFileId,{add:previousParents,remove:[sentFolder]}));
        await files.trash(archive.id);
      }
    });
    throw error;
  }
}

export async function trashProjectDrawing(payload,{user,database=db,files=drive,env=process.env}) {
  const projectId=text(payload.projectId),driveFileId=text(payload.driveFileId);
  if (!projectId||!driveFileId) throw failure('Choose a project and drawing.');
  requireProject(user,projectId,{write:true,admin:true});
  let changed=false,readyToCommit=false;
  try {
    return await database.transaction(async tx=>{
      const project=await projectRow(tx,projectId);
      if (!project) throw failure('Project not found.',404);
      const folder=await previewProjectFolder(project.cells,files,env);
      const file=await files.metadata(driveFileId);
      const [known]=await tx.rows("SELECT 1 FROM enlighten_operational.files WHERE cells->>'projectId'=$1 AND cells->>'driveFileId'=$2 LIMIT 1",[projectId,driveFileId]);
      if (!await files.within(file,folder)&&!(file.trashed&&known)) throw failure('This drawing does not belong to the selected project.',403);
      if (!file.trashed) {
        await files.trash(driveFileId);
        changed=true;
      }
      const patch={trashed:true,trashedAt:now(),trashedBy:actor(user)};
      for (const table of ['files','drawing_register']) {
        await tx.query(`UPDATE enlighten_operational.${table} SET cells=cells||$3::jsonb,updated_at=clock_timestamp()
          WHERE cells->>'projectId'=$1 AND cells->>'driveFileId'=$2`,[projectId,driveFileId,JSON.stringify(patch)]);
      }
      await tx.query(`UPDATE enlighten_operational.issued_drawings SET cells=cells||'{"active":false}'::jsonb,updated_at=clock_timestamp()
        WHERE cells->>'projectId'=$1 AND cells->>'sourceFileId'=$2`,[projectId,driveFileId]);
      readyToCommit=true;
      return {trashed:true,driveFileId};
    });
  } catch(error) {
    if (changed&&!readyToCommit) await cleanup(()=>files.setTrashed(driveFileId,false));
    throw error;
  }
}
