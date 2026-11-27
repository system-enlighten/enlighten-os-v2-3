import {createDriveAttachments} from './drive-attachments.js';
import {previewProjectFolder} from './drawing-publishing.js';
import {randomUUID} from 'node:crypto';
import {db} from './supabase-db.js';
import {isSystemAdmin,requireStudio} from './permissions.js';

const active=value=>!['false','no','0','n',''].includes(String(value??'').trim().toLowerCase());
const complete=project=>active(project.completed)||String(project.projectStatus||'').toLowerCase()==='completed';
const failure=(message,statusCode=400)=>Object.assign(new Error(message),{statusCode});
const assetsUrl=/^(?:https:\/\/[^\s]+|\/(?:technical-library|application-library)\/[\w.-]+)$/;
const tables=new Set(['projects','studio_journal','project_books','files','studio_threads','project_meetings','execution_visits','mom_tasks']);
const groups=new Map([['Very very urgent',0],['Very urgent',1],['Urgent',2]]);

function bookAccess(user,id,write=false) {
  requireStudio(user);
  const role=Object.hasOwn(user.projectRoles||{},id)?user.projectRoles[id]:'';
  if (!id||!isSystemAdmin(user)&&!role) throw failure('Project access required.',403);
  if (write&&(String(user.appAccess).toLowerCase()==='viewer'||!isSystemAdmin(user)&&role!=='Admin')) {
    throw failure('Project Admin access required to generate or edit a book.',403);
  }
}

async function projectRows(tx,table,ids=null) {
  if (!tables.has(table)) throw Error('Unsupported studio journal table.');
  return tx.rows(`SELECT record_id,cells FROM enlighten_operational."${table}"
    WHERE ($1::text[] IS NULL OR cells->>'projectId'=ANY($1)) ORDER BY source_row_number NULLS LAST,record_id`,[ids]);
}

async function project(tx,id) {
  const rows=await projectRows(tx,'projects',[id]);
  if (rows.length!==1) throw failure('Project not found.',404);
  return rows[0].cells;
}

async function persist(tx,table,prior,row) {
  if (!tables.has(table)) throw Error('Unsupported studio journal table.');
  if (prior) await tx.query(`UPDATE enlighten_operational."${table}" SET cells=cells||$1::jsonb,updated_at=clock_timestamp() WHERE record_id=$2::bigint`,[JSON.stringify(row),prior.record_id]);
  else await tx.query(`INSERT INTO enlighten_operational."${table}" (cells) VALUES ($1::jsonb)`,[JSON.stringify(row)]);
}

function publication(project,entry,book) {
  return complete(project)&&active(entry?.bookPublished)&&Boolean(book)&&entry.publishedVersion===book.version;
}

export async function getProjectBook(payload,{user,database=db}) {
  const id=String(payload.projectId||'');
  bookAccess(user,id);
  return database.transaction(async tx=>{
    const info=await project(tx,id);
    const [book]=await projectRows(tx,'project_books',[id]);
    if (!book) return null;
    const [entry]=await projectRows(tx,'studio_journal',[id]);
    const row=book.cells;
    return {projectId:id,version:row.version,book:JSON.parse(row.bookJson),sources:JSON.parse(row.sourcesJson||'[]'),
      updatedAt:row.updatedAt,published:publication(info,entry?.cells,row)};
  },{readOnly:true});
}

export async function saveProjectBook(payload,{user,database=db}) {
  const id=String(payload.projectId||'');
  bookAccess(user,id,true);
  const book=payload.book;
  if (!book||typeof book.title!=='string'||!Array.isArray(book.chapters)||book.chapters.length>15||
      book.chapters.some(chapter=>typeof chapter?.title!=='string'||typeof chapter.text!=='string'||!Array.isArray(chapter.sourceIds))) {
    throw failure('Invalid project book.');
  }
  const sources=payload.sources||[];
  if (!Array.isArray(sources)) throw failure('Invalid project book sources.');
  const bookJson=JSON.stringify(book),sourcesJson=JSON.stringify(sources);
  if (bookJson.length>40000||sourcesJson.length>45000) throw failure('Book is too large. Use shorter chapters or fewer sources.');
  return database.transaction(async tx=>{
    await tx.query('SELECT pg_advisory_xact_lock(hashtextextended($1,0))',['studio-journal:'+id]);
    await project(tx,id);
    const prior=await projectRows(tx,'project_books',[id]);
    if (prior.length>1||String(prior[0]?.cells.version||'')!==String(payload.expectedVersion||'')) throw failure('This book has changed. Reopen it before saving.',409);
    const row={projectId:id,version:randomUUID(),bookJson,sourcesJson,updatedAt:new Date().toISOString(),updatedBy:user.name||user.email};
    await persist(tx,'project_books',prior[0],row);
    return {version:row.version,book,sources,updatedAt:row.updatedAt};
  });
}

export async function getStudioJournal(_payload,{user,database=db}) {
  requireStudio(user);
  const ids=isSystemAdmin(user)?null:Object.keys(user.projectRoles||{});
  return database.transaction(async tx=>{
    const [projects,journals,books,files,threads]=await Promise.all(['projects','studio_journal','project_books','files','studio_threads']
      .map(table=>projectRows(tx,table,ids)));
    const byProject=list=>new Map(list.map(({cells})=>[String(cells.projectId),cells]));
    const journalByProject=byProject(journals),booksByProject=byProject(books);
    const photos=new Map();
    const imageUrl=id=>'https://drive.google.com/thumbnail?id='+encodeURIComponent(id)+'&sz=w1600';
    for (const {cells:file} of files) {
      if (active(file.trashed)||!(/^image\//i.test(file.mimeType||'')||/\.(jpg|jpeg|png|webp)$/i.test(file.fileName||''))) continue;
      const id=String(file.projectId);
      if (!photos.has(id)) photos.set(id,[]);
      photos.get(id).push({url:file.driveFileId?imageUrl(file.driveFileId):file.driveUrl||'',title:file.fileName||'Project image'});
    }
    const selected=projects.map(({cells:row})=>{
      const id=String(row.projectId),entry=journalByProject.get(id)||{},record=booksByProject.get(id);
      let book=null,sources=[];
      try {
        book=record?JSON.parse(record.bookJson):null;
        const parsed=record?JSON.parse(record.sourcesJson||'[]'):[];
        if (Array.isArray(parsed)) sources=parsed;
      } catch {}
      const images=[...new Map([...(photos.get(id)||[]),...sources.filter(source=>source.image&&source.driveFileId)
        .map(source=>({url:imageUrl(source.driveFileId),title:source.title||'Project image'}))].filter(item=>item.url).map(item=>[item.url,item])).values()].slice(0,25);
      const published=publication(row,entry,record);
      return {id,no:row.projectNo,name:row.projectName,completed:complete(row),completedDate:row.completedDate||'',
        canEdit:String(user.appAccess).toLowerCase()!=='viewer'&&(isSystemAdmin(user)||user.projectRoles?.[id]==='Admin'),images,
        journal:{...entry,featured:active(entry.featured),bookPublished:published,version:entry.version||''},
        book:book?{title:book.title,version:record.version,updatedAt:record.updatedAt,published,
          publishedAt:published?entry.publishedAt:'',excerpt:String(book.chapters?.[0]?.text||'').slice(0,300)}:null};
    });
    const open=threads.map(({cells:row})=>({id:row.threadId,projectId:String(row.projectId),title:row.title,
      description:String(row.description||'').slice(0,1600),nextStep:String(row.nextStep||'').slice(0,1600),
      status:row.status,urgency:row.urgency||'Urgent',updatedAt:row.updatedAt}));
    const recent=(a,b)=>String(b.updatedAt).localeCompare(String(a.updatedAt));
    const now=new Date();
    return {editionDate:new Date(+now+330*60000).toISOString().slice(0,10),updatedAt:now.toISOString(),projects:selected,
      challenges:open.filter(row=>row.status!=='Resolved').sort((a,b)=>(groups.get(a.urgency)??2)-(groups.get(b.urgency)??2)||recent(a,b)).slice(0,12),
      resolved:open.filter(row=>row.status==='Resolved').sort(recent).slice(0,12)};
  },{readOnly:true});
}

export async function saveStudioJournal(payload,{user,database=db}) {
  const id=String(payload.projectId||'');
  bookAccess(user,id,true);
  const input=payload.entry||{};
  const row={projectId:id};
  for (const [field,limit] of [['headline',200],['lightingIdea',4000],['completionStory',5000],['learningStory',7000]]) {
    row[field]=String(input[field]||'').trim();
    if (row[field].length>limit) throw failure(field+' is too long.');
  }
  row.coverUrl=String(input.coverUrl||'').trim();
  if (row.coverUrl&&(row.coverUrl.length>2000||!assetsUrl.test(row.coverUrl))) throw failure('Use an HTTPS asset URL.');
  row.shootDate=String(input.shootDate||'');
  if (row.shootDate&&!/^\d{4}-\d{2}-\d{2}$/.test(row.shootDate)) throw failure('Use a valid shoot date.');
  row.featured=input.featured===true;
  row.bookPublished=input.bookPublished===true;
  if (row.featured&&(!row.coverUrl||!row.shootDate)) throw failure('Choose a photo and shoot date to feature a photographed project.');
  return database.transaction(async tx=>{
    await tx.query('SELECT pg_advisory_xact_lock(hashtextextended($1,0))',['studio-journal:'+id]);
    const info=await project(tx,id);
    const prior=await projectRows(tx,'studio_journal',[id]);
    const now=new Date().toISOString();
    if (prior.length>1||String(prior[0]?.cells.version||'')!==String(payload.expectedVersion||'')) throw failure('This journal entry changed. Refresh before saving.',409);
    row.publishedVersion='';
    row.publishedAt='';
    if (row.bookPublished) {
      if (!complete(info)) throw failure('Complete the project before publishing its final book.');
      const [book]=await projectRows(tx,'project_books',[id]);
      if (!book||book.cells.version!==payload.expectedBookVersion) throw failure('The book changed or is missing. Review the latest book before publishing.',409);
      row.publishedVersion=book.cells.version;
      row.publishedAt=prior[0]?.cells.publishedVersion===row.publishedVersion?prior[0].cells.publishedAt:now;
    }
    Object.assign(row,{version:randomUUID(),updatedAt:now,updatedBy:user.name||user.email});
    await persist(tx,'studio_journal',prior[0],row);
    return row;
  });
}

const projectBookDrive=createDriveAttachments();

export async function getProjectBookContext(payload,{user,database=db,files=projectBookDrive,env=process.env}) {
  const projectId=String(payload.projectId||'');
  bookAccess(user,projectId,true);
  const source=await database.transaction(async tx=>{
    const info=await project(tx,projectId);
    const [book]=await projectRows(tx,'project_books',[projectId]);
    const data={};
    for (const table of ['project_meetings','execution_visits','mom_tasks','files']) {
      data[table]=(await projectRows(tx,table,[projectId])).map(row=>row.cells);
    }
    return {info,version:book?.cells.version||'',data};
  },{readOnly:true});
  const {info,version,data}=source,sources=[],known=new Set();
  let limited=false,chars=0;
  const add=(kind,title,raw,extra={})=>{
    const text=String(raw||'');
    if (sources.length>=180||chars>=65000) {
      limited=true;
      return;
    }
    const clipped=text.slice(0,Math.min(4000,65000-chars));
    chars+=clipped.length;
    sources.push({id:'S'+String(sources.length+1),kind,title:String(title||''),text:clipped,...extra});
    if (clipped.length<text.length) limited=true;
  };
  add('project','Project brief',JSON.stringify({number:info.projectNo,name:info.projectName,type:info.projectType,
    start:info.startDate,completed:info.completedDate,address:info.address,scope:{bath:info.bathElevation,
      furniture:info.wardrobe,artCuration:info.artCuration},notes:info.notes||''}));
  for (const meeting of data.project_meetings.filter(row=>active(row.active))) {
    add('minutes',meeting.title,JSON.stringify({date:meeting.date,minutes:meeting.mom,actions:meeting.actionItems,nextDate:meeting.nextDate}));
  }
  for (const visit of data.execution_visits.filter(row=>String(row.active)!=='false')) add('visit',visit.title||visit.milestone,visit.history||'');
  for (const task of data.mom_tasks) {
    add('action',task.title,JSON.stringify({owner:task.owner,dueDate:task.dueDate,completed:task.completed,kind:task.kind}));
  }
  for (const file of data.files.filter(row=>!active(row.trashed))) {
    const id=String(file.driveFileId||'');
    if (known.has(id)) continue;
    known.add(id);
    add('file',file.fileName,JSON.stringify({folder:file.folderCategory,type:file.drawingType,floor:file.floor,area:file.area,
      revision:file.revisionNo,date:file.receivedSentDate||file.uploadedAt}),{driveFileId:id,url:file.driveUrl||'',
      image:/^image\//i.test(file.mimeType||'')||/\.(jpg|jpeg|png|webp)$/i.test(file.fileName||'')});
  }
  if (info.driveFolderId) {
    const root=await previewProjectFolder(info,files,env),rootMetadata=await files.metadata(root);
    const pending=[rootMetadata],seen=new Set();
    let scanned=0,pages=0;
    while (pending.length&&pages<100&&seen.size<80&&scanned<300&&sources.length<180) {
      const folder=pending.shift();
      if (seen.has(folder.id)) continue;
      seen.add(folder.id);
      let pageToken;
      do {
        pages++;
        const page=await files.children(folder.id,{pageToken,pageSize:100});
        pageToken=page.nextPageToken;
        for (const item of page.files) {
          if (item.mimeType==='application/vnd.google-apps.folder') {
            if (pending.length<80) pending.push(item);
            else limited=true;
            continue;
          }
          if (scanned>=300||sources.length>=180) {
            limited=true;
            break;
          }
          scanned++;
          if (known.has(item.id)) continue;
          known.add(item.id);
          let text='Folder: '+folder.name+'; modified: '+(item.modifiedTime||'')+'; type: '+item.mimeType;
          if (/\.(txt|md|csv)$/i.test(item.name)&&Number(item.size)>0&&Number(item.size)<100000) {
            text+='\n'+(await files.download(item.id,{limit:100000,file:item})).toString('utf8').slice(0,4000);
          }
          add('file',item.name,text,{driveFileId:item.id,url:item.webViewLink||'https://drive.google.com/open?id='+encodeURIComponent(item.id),
            image:/^image\//i.test(item.mimeType)});
        }
      } while (pageToken&&pages<100&&scanned<300&&sources.length<180);
      if (pageToken) limited=true;
    }
    if (pending.length) limited=true;
  }
  return {projectId,projectName:info.projectName,version,sources,limited,
    coverage:'Saved project records, meeting/visit notes, actions, registered files and linked folder filenames/metadata; text files where supported. PDF/DWG/Dialux contents and image pixels are not analysed.'};
}
