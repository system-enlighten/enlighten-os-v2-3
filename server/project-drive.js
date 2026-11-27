import {db} from './supabase-db.js';
import {createDriveAttachments,projectsDriveRoot} from './drive-attachments.js';
import {requireAdmin,requireProject} from './permissions.js';
import {active,actor,failure,now,projectRow,text,updateRecord} from './project-write-storage.js';

const folderMime='application/vnd.google-apps.folder';
const drive=createDriveAttachments();
export const projectCategories={Base:['Base'],Output:['Output','02 Design Output'],
  Received:['Received','Recieved','received','01 Received Drawings'],Sent:['Sent','03 Sent Drawings']};
const dayName=/^\d{4}-\d{2}-\d{2}$/;
const link=id=>'https://drive.google.com/file/d/'+encodeURIComponent(id)+'/view';

function folderId(input) {
  const value=text(input);
  const match=value.match(/^https:\/\/drive\.google\.com\/drive\/(?:u\/\d+\/)?folders\/([A-Za-z0-9_-]+)/);
  const id=match?.[1]||value;
  if (!/^[A-Za-z0-9_-]{5,200}$/.test(id)) throw failure('Paste a Google Drive folder link or folder ID.');
  return id;
}

export async function configuredDriveRoot(database,env) {
  const rows=await database.rows("SELECT value FROM enlighten_operational.drive_configuration WHERE key='project-root'");
  return rows[0]?.value?.id||projectsDriveRoot(env)||'';
}

async function safeFolder(files,id,env,{allowRoot=false}={}) {
  const previewRoot=projectsDriveRoot(env);
  if (!previewRoot) throw failure('Configure the preview Drive root.',503);
  const candidate=await files.metadata(id);
  if (candidate.mimeType!==folderMime||candidate.trashed) throw failure('Choose an active Google Drive folder.');
  if (!(allowRoot&&id===previewRoot)&&!await files.within(candidate,previewRoot)) throw failure('Choose a folder inside the preview Drive root.',403);
  return candidate;
}

async function libraryConfig(id,files,env) {
  if (!id) return {rootId:'',rootName:'',folders:[]};
  const parent=await safeFolder(files,id,env,{allowRoot:true});
  const page=await files.children(id,{foldersOnly:true,pageSize:500});
  return {rootId:id,rootName:parent.name,folders:page.files.map(({id,name})=>({id,name})).sort((a,b)=>a.name.localeCompare(b.name)),
    limited:Boolean(page.nextPageToken)};
}

export async function getDriveLibraryConfig(_payload,{user,database=db,files=drive,env=process.env}) {
  requireAdmin(user);
  return libraryConfig(await configuredDriveRoot(database,env),files,env);
}

export async function setDriveLibraryRoot(payload,{user,database=db,files=drive,env=process.env}) {
  requireAdmin(user);
  const id=folderId(payload.folder);
  const result=await libraryConfig(id,files,env);
  await database.query(`INSERT INTO enlighten_operational.drive_configuration (key,value)
    VALUES ('project-root',$1::jsonb) ON CONFLICT (key) DO UPDATE SET value=excluded.value,updated_at=clock_timestamp()`,
  [JSON.stringify({id})]);
  return result;
}

export async function linkProjectDrive(payload,{user,database=db,files=drive,env=process.env}) {
  requireAdmin(user);
  const projectId=text(payload.projectId),id=folderId(payload.folder);
  if (!projectId) throw failure('Choose a project.');
  return database.transaction(async tx=>{
    await tx.query('SELECT pg_advisory_xact_lock(hashtextextended($1,0))',['link-project-folder:'+id]);
    const project=await projectRow(tx,projectId);
    if (!project) throw failure('Project not found.',404);
    const folder=await safeFolder(files,id,env);
    const parent=await configuredDriveRoot(tx,env);
    if (!parent||id===parent||!await files.within(folder,parent)) throw failure('Choose a project folder inside the linked projects root.',403);
    const duplicate=await tx.rows("SELECT 1 FROM enlighten_operational.projects WHERE cells->>'projectId'<>$1 AND cells->>'driveFolderId'=$2 LIMIT 1",[projectId,id]);
    if (duplicate.length) throw failure('This folder is already linked to another project.',409);
    for (const [category,names] of Object.entries(projectCategories)) {
      if (!(await files.findFolders(id,names)).length) await files.getOrCreateFolder(id,category);
    }
    await updateRecord(tx,'projects',project.record_id,{driveFolderId:id,
      driveFolderUrl:'https://drive.google.com/drive/folders/'+encodeURIComponent(id),updatedAt:now(),updatedBy:actor(user)});
    return {projectId,driveFolderId:id};
  });
}

async function* folderContents(files,id) {
  let next;
  do {
    const page=await files.children(id,{pageToken:next});
    yield* page.files;
    next=page.nextPageToken;
  } while (next);
}

export async function listProjectDrive(payload,{user,database=db,files=drive}) {
  const projectId=text(payload.projectId);
  requireProject(user,projectId);
  const found=await database.rows("SELECT cells FROM enlighten_operational.projects WHERE cells->>'projectId'=$1 LIMIT 2",[projectId]);
  if (found.length!==1) throw failure('Project not found.',404);
  const root=found[0].cells.driveFolderId;
  const category=String(payload.category||'');
  if (!category||!root) return {linked:Boolean(root),categories:Object.keys(projectCategories),entries:[]};
  if (!Object.hasOwn(projectCategories,category)) throw failure('Unknown project folder category.');
  const parent=await files.metadata(root);
  if (parent.trashed) throw failure('The linked project folder is in trash.');
  const roots=await files.findFolders(root,projectCategories[category]);
  const selected=payload.folderId?await files.metadata(folderId(payload.folderId)):null;
  if (selected) {
    let belongs=false;
    for (const folder of roots) {
      if (selected.id===folder.id||await files.within(selected,folder.id)) {belongs=true;break;}
    }
    if (!belongs||selected.trashed||selected.mimeType!==folderMime) throw failure('Folder is outside this project category.',403);
  }
  const offset=Number(payload.offset||0);
  if (!Number.isInteger(offset)||offset<0||offset>10000) throw failure('Invalid folder page.');
  const search=String(payload.query||'').toLowerCase().slice(0,150),entries=new Map();
  const add=(file,receivedDate='')=>{
    if (file.trashed||entries.has(file.id)||search&&!String(file.name).toLowerCase().includes(search)) return;
    if (entries.size>=10000) throw failure('Too many files. Search within a smaller folder.');
    const kind=file.mimeType===folderMime?'folder':'file';
    entries.set(file.id,{id:file.id,name:file.name,kind,mimeType:file.mimeType,size:kind==='file'?Number(file.size||0):null,
      created:file.createdTime||'',modified:file.modifiedTime||'',receivedDate,url:kind==='file'?file.webViewLink||link(file.id):''});
  };
  for (const folder of selected?[selected]:roots) {
    for await (const child of folderContents(files,folder.id)) {
      if (category==='Received'&&!selected&&child.mimeType===folderMime&&dayName.test(child.name)) {
        for await (const file of folderContents(files,child.id)) if (file.mimeType!==folderMime) add(file,child.name);
      } else add(child,category==='Received'&&child.mimeType!==folderMime&&dayName.test(folder.name)?folder.name:'');
    }
  }
  const stamp=entry=>Date.parse(entry.receivedDate||entry.created||entry.modified)||0;
  const ordered=[...entries.values()].sort((a,b)=>stamp(b)-stamp(a)||(Date.parse(b.created)||0)-(Date.parse(a.created)||0)||
    a.name.localeCompare(b.name)||a.id.localeCompare(b.id));
  return {linked:true,entries:ordered.slice(offset,offset+100),nextOffset:offset+100<ordered.length?offset+100:null};
}

function safeDay(value,fallback) {
  const date=String(value||'').slice(0,10);
  if (dayName.test(date)&&Number.isFinite(Date.parse(date))&&new Date(date).toISOString().slice(0,10)===date) return date;
  const at=Date.parse(fallback);
  if (!Number.isFinite(at)) throw failure('A drawing has no valid received or creation date.');
  return new Date(at+330*60000).toISOString().slice(0,10);
}

export async function organizeProjectReceived(payload,{user,database=db,files=drive,env=process.env}) {
  const id=text(payload.projectId);
  requireProject(user,id,{write:true,admin:true});
  return database.transaction(async tx=>{
    const project=await projectRow(tx,id);
    if (!project?.cells.driveFolderId) throw failure('Choose a linked project folder.',404);
    const root=project.cells.driveFolderId;
    await safeFolder(files,root,env);
    const roots=await files.findFolders(root,projectCategories.Received);
    if (!roots.length) return {moved:0,skipped:0,done:true};
    const registrations=[];
    for (const table of ['files','drawing_register']) {
      const found=await tx.rows(`SELECT cells FROM enlighten_operational.${table}
        WHERE cells->>'projectId'=$1 ORDER BY source_row_number NULLS LAST,record_id`,[id]);
      registrations.push(...found.map(row=>row.cells).filter(row=>row.driveFileId&&!active(row.trashed)&&
        String(row.direction||(table==='drawing_register'?'Received':'')).toLowerCase()==='received'));
    }
    const unique=new Map(registrations.map(row=>[String(row.driveFileId),row])),known=[...unique.entries()];
    const cursorKey='received-date:'+id+':'+root;
    const [stored]=await tx.rows('SELECT value FROM enlighten_operational.drive_configuration WHERE key=$1',[cursorKey]);
    const candidate=Number(stored?.value?.cursor||0);
    const offset=Number.isSafeInteger(candidate)&&candidate>=0?Math.min(candidate,known.length):0;
    const batch=known.slice(offset,offset+12);
    let moved=0,skipped=0,looseMore=false;
    const dateFolders=new Map();
    async function move(file,date) {
      const day=safeDay(date,file.createdTime);
      if (!dateFolders.has(day)) dateFolders.set(day,await files.getOrCreateFolder(roots[0].id,day));
      const target=dateFolders.get(day);
      if (file.parents?.includes(target)) return;
      await files.move(file.id,{add:[target],remove:file.parents||[]});
      moved++;
    }
    for (const [fileId,row] of batch) {
      let file;
      try { file=await files.metadata(fileId); } catch {skipped++;continue;}
      let allowed=false;
      for (const category of roots) if (await files.within(file,category.id)) {allowed=true;break;}
      if (!allowed||file.trashed) {skipped++;continue;}
      await move(file,row.receivedSentDate||row.uploadedAt||row.createdAt);
    }
    const next=offset+batch.length;
    if (next>=known.length) {
      let capacity=12-batch.length;
      const seen=new Set(),queue=[...roots];
      outer:while (queue.length) {
        const folder=queue.shift();
        if (seen.has(folder.id)) continue;
        seen.add(folder.id);
        if (seen.size>2000) throw failure('Too many legacy received subfolders to organize in one pass.');
        for await (const child of folderContents(files,folder.id)) {
          if (child.mimeType===folderMime) {
            if (!dayName.test(child.name)) queue.push(child);
            continue;
          }
          if (unique.has(child.id)||child.trashed) continue;
          if (!capacity) {looseMore=true;break outer;}
          unique.set(child.id,null);
          await move(child,'');
          capacity--;
        }
      }
    }
    await tx.query(`INSERT INTO enlighten_operational.drive_configuration (key,value)
      VALUES ($1,$2::jsonb) ON CONFLICT (key) DO UPDATE SET value=excluded.value,updated_at=clock_timestamp()`,
    [cursorKey,JSON.stringify({cursor:next})]);
    return {moved,skipped,done:next>=known.length&&!looseMore};
  });
}
