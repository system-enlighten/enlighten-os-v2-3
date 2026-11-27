import {createHash,randomUUID} from 'node:crypto';
import {db} from './supabase-db.js';
import {attachmentFolder,createDriveAttachments} from './drive-attachments.js';
import {isSystemAdmin} from './permissions.js';
import {studioMember} from './studio-settings.js';
import {actor,failure,now,text} from './project-write-storage.js';

const drive=createDriveAttachments(),limit=3*1024*1024;
const digest=value=>createHash('sha256').update(value).digest('hex');
const reports='enlighten_operational.app_feedback',assets='enlighten_operational.feedback_attachments';
function idOf(value) {
  const id=String(value||'');
  if (!/^[A-Za-z0-9_-]{1,120}$/.test(id)) throw failure('Invalid feedback reference.');
  return id;
}
async function find(tx,table,field,id) {
  const rows=await tx.rows('SELECT record_id,cells FROM '+table+' WHERE cells->>$1=$2 LIMIT 2',[field,id]);
  if (rows.length>1) throw failure('Feedback reference is duplicated.',409);
  return rows[0];
}
const lock=(tx,id)=>tx.query('SELECT pg_advisory_xact_lock(hashtextextended($1,0))',['feedback:'+id]);
const insert=(tx,table,row)=>tx.query('INSERT INTO '+table+' (cells) VALUES ($1::jsonb)',[JSON.stringify(row)]);
const owned=(row,reporterId,feedbackId)=>row&&String(row.reporterId)===reporterId&&String(row.feedbackId)===feedbackId;
const attachmentMeta=row=>({uploadId:row.uploadId,fileId:row.fileId,kind:row.kind,name:row.name,mimeType:row.mimeType,size:Number(row.size)});

export async function uploadFeedbackAttachment(p,{user,database=db,files=drive,env=process.env}) {
  const reporterId=studioMember(user),feedbackId=idOf(p.feedbackId),uploadId=idOf(p.uploadId),kind=text(p.kind);
  const raw=text(p.mimeType).split(';')[0].trim().toLowerCase(),mime=({'audio/x-m4a':'audio/mp4','audio/mp3':'audio/mpeg','audio/wave':'audio/wav'})[raw]||raw;
  const allowed=kind==='screenshot'?['image/png','image/jpeg','image/webp']:kind==='voice'?['audio/webm','audio/mp4','audio/mpeg','audio/ogg','audio/wav','audio/x-wav']:[];
  const name=String(p.name||'').replace(/[\x00-\x1f/\\]/g,'_').slice(0,180),encoded=p.base64;
  if (!name||!allowed.includes(mime)||typeof encoded!=='string'||encoded.length>4200000||!/^[A-Za-z0-9+/]+={0,2}$/.test(encoded)) {
    throw failure('Use PNG/JPEG/WebP screenshots or an audio file under 3 MB.');
  }
  const bytes=Buffer.from(encoded,'base64');
  if (!bytes.length||bytes.length>limit||bytes.toString('base64').replace(/=+$/,'')!==encoded.replace(/=+$/,'')) {
    throw failure('Invalid attachment or attachment exceeds 3 MB.');
  }
  const hash=digest(bytes);
  let uploaded;
  try {
    return await database.transaction(async tx=>{
      await lock(tx,'report:'+feedbackId);
      await lock(tx,'upload:'+uploadId);
      const prior=(await find(tx,assets,'uploadId',uploadId))?.cells;
      if (prior) {
        if (!owned(prior,reporterId,feedbackId)||prior.digest!==hash) throw failure('Attachment reference already used.',409);
        return attachmentMeta(prior);
      }
      if (await find(tx,reports,'feedbackId',feedbackId)) throw failure('This report is already submitted. Start a new report.',409);
      const pending=await tx.rows("SELECT cells FROM "+assets+" WHERE cells->>'feedbackId'=$1 LIMIT 21",[feedbackId]);
      if (pending.some(row=>!owned(row.cells,reporterId,feedbackId))) throw failure('Feedback reference belongs to another account.',403);
      if (pending.length>=20) throw failure('Too many replacement attachments. Start a new feedback report.');
      const folder=await attachmentFolder(files,env.APP_FEEDBACK_FOLDER_ID,env,'enLIGHTen App Feedback');
      uploaded=await files.upload(folder,{name,mimeType:mime,bytes});
      const row={uploadId,feedbackId,reporterId,fileId:uploaded.id,kind,name,mimeType:mime,size:bytes.length,digest:hash,createdAt:now()};
      await insert(tx,assets,row);
      return attachmentMeta(row);
    });
  } catch(error) {
    if (uploaded) await files.trash(uploaded.id).catch(()=>{});
    throw error;
  }
}

export async function submitAppFeedback(p,{user,database=db}) {
  const reporterId=studioMember(user),feedbackId=idOf(p.feedbackId),message=text(p.message),section=String(p.section||'General').trim();
  const browser=String(p.browser||''),path=String(p.path||'');
  if (message.length>6000||section.length>150||browser.length>600||path.length>300) throw failure('Feedback details are too long.');
  if (!Array.isArray(p.attachmentIds)||p.attachmentIds.length>4||new Set(p.attachmentIds).size!==p.attachmentIds.length) throw failure('Invalid attachments.');
  const attachmentIds=p.attachmentIds.map(idOf);
  return database.transaction(async tx=>{
    await lock(tx,'report:'+feedbackId);
    const attachments=[];
    for (const id of attachmentIds) {
      const row=(await find(tx,assets,'uploadId',id))?.cells;
      if (!owned(row,reporterId,feedbackId)) throw failure('Attachment does not belong to this report.',403);
      attachments.push(row);
    }
    if (attachments.filter(row=>row.kind==='voice').length>1||attachments.filter(row=>row.kind==='screenshot').length>3) throw failure('Use up to 3 screenshots and 1 voice note.');
    if (!message&&!attachments.some(row=>row.kind==='voice')) throw failure('Add a description or voice note.');
    const submissionDigest=digest(JSON.stringify({reporterId,message,section,browser,path,attachmentIds:[...attachmentIds].sort()}));
    const prior=(await find(tx,reports,'feedbackId',feedbackId))?.cells;
    if (prior) {
      if (!owned(prior,reporterId,feedbackId)||prior.submissionDigest!==submissionDigest) throw failure('This report was already submitted. Refresh your reports.',409);
      return {feedbackId,status:prior.status,createdAt:prior.createdAt};
    }
    const createdAt=now(),status='Submitted';
    await insert(tx,reports,{feedbackId,reporterId,reporterName:actor(user),reporterEmail:user.email,section,message,browser,path,
      attachmentIdsJson:JSON.stringify(attachmentIds),submissionDigest,status,adminNotes:'',version:randomUUID(),createdAt,updatedAt:createdAt});
    return {feedbackId,status,createdAt};
  });
}

export async function listAppFeedback(p,{user,database=db}) {
  const uid=studioMember(user),canReview=isSystemAdmin(user),offset=Math.min(2147483547,Math.max(0,Math.floor(Number(p.offset)||0)));
  return database.transaction(async tx=>{
    const rows=await tx.rows(`SELECT cells FROM ${reports} WHERE ($1::boolean OR cells->>'reporterId'=$2)
      AND ($3 IN ('','All') OR cells->>'status'=$3) ORDER BY cells->>'createdAt' DESC,record_id DESC LIMIT 101 OFFSET $4`,[canReview,uid,text(p.status),offset]);
    const page=rows.slice(0,100).map(row=>{
      const {reporterId,submissionDigest,attachmentIdsJson,...values}=row.cells;
      let ids=[];
      try {const value=JSON.parse(attachmentIdsJson||'[]');if (Array.isArray(value)) ids=value;} catch {}
      return {reporterId,values,ids};
    });
    const all=[...new Set(page.flatMap(row=>row.ids))];
    const attachments=new Map((await tx.rows("SELECT cells FROM "+assets+" WHERE cells->>'uploadId'=ANY($1::text[])",[all]))
      .map(({cells})=>[cells.uploadId,cells]));
    return {reports:page.map(({reporterId,values,ids})=>({...values,attachments:ids.map(id=>attachments.get(id))
      .filter(row=>owned(row,reporterId,String(values.feedbackId))).map(attachmentMeta)})),canReview,hasMore:rows.length>100,nextOffset:offset+100};
  },{readOnly:true});
}

export async function getFeedbackAttachment(p,{user,database=db,files=drive}) {
  const uid=studioMember(user),id=idOf(p.uploadId);
  const asset=await database.transaction(async tx=>{
    const row=(await find(tx,assets,'uploadId',id))?.cells;
    if (!row||row.reporterId!==uid&&!isSystemAdmin(user)) throw failure('Attachment access denied.',403);
    const report=(await find(tx,reports,'feedbackId',row.feedbackId))?.cells;
    if (!report||report.reporterId!==row.reporterId) throw failure('Report attachment not available.',404);
    return row;
  },{readOnly:true});
  const bytes=await files.download(asset.fileId,{limit});
  return {base64:bytes.toString('base64'),mimeType:asset.mimeType,name:asset.name};
}

export async function reviewAppFeedback(p,{user,database=db}) {
  studioMember(user);
  if (!isSystemAdmin(user)) throw failure('System admin review required.',403);
  const id=idOf(p.feedbackId),adminNotes=String(p.adminNotes||'');
  if (!['Submitted','In review','Resolved'].includes(p.status)||adminNotes.length>4000) throw failure('Choose a valid review status and note.');
  return database.transaction(async tx=>{
    await lock(tx,'report:'+id);
    const prior=await find(tx,reports,'feedbackId',id);
    if (!prior) throw failure('Feedback not found.',404);
    if (prior.cells.version!==p.expectedVersion) throw failure('This report changed. Refresh before updating.',409);
    const patch={status:p.status,adminNotes,version:randomUUID(),updatedAt:now()};
    await tx.query('UPDATE '+reports+' SET cells=cells||$1::jsonb,updated_at=clock_timestamp() WHERE record_id=$2',[JSON.stringify(patch),prior.record_id]);
    return patch;
  });
}
