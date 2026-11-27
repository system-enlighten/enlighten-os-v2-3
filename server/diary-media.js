import {createHash,randomUUID} from 'node:crypto';
import {db} from './supabase-db.js';
import {createDriveAttachments,projectsDriveRoot} from './drive-attachments.js';
import {previewProjectFolder} from './drawing-publishing.js';
import {projectDiaryState} from './project-diary.js';
import {checkProjectRead,requireProject} from './permissions.js';
import {actor,failure,now,text} from './project-write-storage.js';

const drive=createDriveAttachments(),recordings='enlighten_operational.diary_recording_chunks',maxAudio=2*1024*1024;
const array=value=>{
  try {const result=JSON.parse(value||'[]');return Array.isArray(result)?result:[];} catch {return [];}
};
export async function diaryPhotoReference(tx,projectId,entryId,fileId) {
  const rows=await tx.rows("SELECT cells FROM enlighten_operational.diary_entries WHERE cells->>'projectId'=$1 AND cells->>'entryId'=$2 LIMIT 2",[projectId,entryId]);
  if (rows.length!==1) throw failure('Diary picture is not part of this project.',404);
  const photo=array(rows[0].cells.photosJson).find(row=>String(row.fileId)===fileId);
  if (!photo) throw failure('Save the picture in the Diary before linking it to a MOM point.',404);
  const url='https://drive.google.com/file/d/'+encodeURIComponent(photo.fileId)+'/view';
  return {...photo,sourceDiaryEntryId:entryId,viewUrl:url,originalFileId:photo.fileId,originalUrl:url,marked:false};
}
export async function getDiaryPhotos(p,{user,database=db}) {
  const projectId=text(p.projectId);
  requireProject(user,projectId);
  return database.transaction(async tx=>{
    await checkProjectRead(tx,user,projectId);
    return (await tx.rows("SELECT cells FROM enlighten_operational.diary_entries WHERE cells->>'projectId'=$1 ORDER BY source_row_number NULLS LAST,record_id",[projectId]))
      .flatMap(({cells})=>array(cells.photosJson).filter(row=>row.fileId).map(row=>({...row,sourceDiaryEntryId:String(cells.entryId),
        meetingSummary:String(cells.summary||''),date:String(cells.updatedAt||'').slice(0,10)})));
  },{readOnly:true});
}
export async function getDiaryPhotoData(p,{user,database=db,files=drive}) {
  const projectId=text(p.projectId);
  requireProject(user,projectId);
  const photo=await database.transaction(async tx=>{
    await checkProjectRead(tx,user,projectId);
    return diaryPhotoReference(tx,projectId,text(p.entryId),text(p.fileId));
  },{readOnly:true});
  const file=await files.metadata(photo.fileId);
  if (file.trashed||!['image/png','image/jpeg','image/webp'].includes(file.mimeType)) throw failure('Diary picture is unavailable.',404);
  const bytes=await files.download(photo.fileId,{limit:3*1024*1024,file});
  return {name:photo.name,mimeType:file.mimeType,base64:bytes.toString('base64')};
}

export async function diaryEvent(tx,p,user,write=false) {
  const projectId=text(p.projectId),entryId=text(p.entryId);
  if (write) requireProject(user,projectId,{write:true});
  const state=await projectDiaryState(tx,{projectId},user);
  const event=state.timeline.find(row=>row.id===entryId||row.detail?.entryId===entryId||(row.aliases||[]).includes(entryId));
  if (!event) throw failure('Meeting/visit no longer exists. Refresh the diary.',404);
  return event;
}
export async function getDiaryRecordingContext(p,{user,database=db}) {
  return database.transaction(async tx=>{
    const event=await diaryEvent(tx,p,user,true);
    const [project]=await tx.rows("SELECT cells FROM enlighten_operational.projects WHERE cells->>'projectId'=$1",[event.projectId]);
    return {entryId:event.detail?.entryId||event.id,projectName:project?.cells.projectName||'',title:event.title};
  },{readOnly:true});
}
export async function getDiaryRecordings(p,{user,database=db}) {
  return database.transaction(async tx=>{
    const event=await diaryEvent(tx,p,user);
    const rows=await tx.rows("SELECT cells FROM "+recordings+" WHERE project_id=$1 AND entry_id=$2 ORDER BY cells->>'createdAt',(cells->>'sequence')::integer",
      [event.projectId,event.detail?.entryId||event.id]);
    return rows.map(({cells:row})=>({recordingId:row.recordingId,sequence:Number(row.sequence),fileId:row.fileId,url:row.url,text:row.text||'',createdAt:row.createdAt}));
  },{readOnly:true});
}
function segment(p,event) {
  const recordingId=text(p.recordingId),sequence=Number(p.sequence);
  if (!/^[A-Za-z0-9_-]{1,100}$/.test(recordingId)||p.sequence==null||p.sequence===''||
      !Number.isInteger(sequence)||sequence<0||sequence>10000) throw failure('Invalid meeting recording segment.');
  const projectId=event.projectId,entryId=event.detail?.entryId||event.id;
  return {projectId,entryId,recordingId,sequence,chunkKey:[projectId,entryId,recordingId,sequence].join('|')};
}
const read=(tx,key)=>tx.rows('SELECT cells FROM '+recordings+' WHERE chunk_key=$1',[key]);
const lock=(tx,key)=>tx.query('SELECT pg_advisory_xact_lock(hashtextextended($1,0))',['diary-recording:'+key]);
export async function uploadDiaryRecordingChunk(p,{user,database=db,files=drive,env=process.env}) {
  const mimeType=text(p.mimeType).split(';')[0],ext=({'audio/webm':'webm','audio/mp4':'m4a','audio/mpeg':'mp3',
    'audio/wav':'wav','audio/x-wav':'wav','audio/x-m4a':'m4a'})[mimeType];
  if (!ext||typeof p.audio!=='string'||p.audio.length>2800000||!/^[A-Za-z0-9+/]+={0,2}$/.test(p.audio)) throw failure('Invalid meeting recording segment.');
  const bytes=Buffer.from(p.audio,'base64');
  if (!bytes.length||bytes.length>maxAudio||bytes.toString('base64').replace(/=+$/,'')!==p.audio.replace(/=+$/,'')) throw failure('Invalid recording or segment exceeds 2 MB.');
  const hash=createHash('sha256').update(bytes).digest('hex');
  let uploaded;
  try {
    return await database.transaction(async tx=>{
      const keys=segment(p,await diaryEvent(tx,p,user,true));
      await lock(tx,keys.chunkKey);
      const [prior]=await read(tx,keys.chunkKey);
      if (prior) {
        if (prior.cells.hash!==hash) throw failure('Recording segment changed.',409);
        return {...prior.cells,sequence:keys.sequence};
      }
      const [project]=await tx.rows("SELECT cells FROM enlighten_operational.projects WHERE cells->>'projectId'=$1",[keys.projectId]);
      const root=project.cells.driveFolderId?await previewProjectFolder(project.cells,files,env):projectsDriveRoot(env);
      const folder=await files.getOrCreateFolder(root,project.cells.driveFolderId?'Diary Recordings':'Diary Recordings - '+keys.projectId);
      uploaded=await files.upload(folder,{name:'Meeting '+keys.recordingId+' part '+String(keys.sequence+1).padStart(4,'0')+'.'+ext,mimeType,bytes});
      const row={...keys,fileId:uploaded.id,url:uploaded.webViewLink||'https://drive.google.com/file/d/'+encodeURIComponent(uploaded.id)+'/view',
        mimeType,hash,text:'',createdAt:now(),createdBy:actor(user)};
      await tx.query('INSERT INTO '+recordings+' (chunk_key,project_id,entry_id,cells) VALUES ($1,$2,$3,$4::jsonb)',
        [keys.chunkKey,keys.projectId,keys.entryId,JSON.stringify(row)]);
      return row;
    });
  } catch(error) {
    if (uploaded) await files.trash(uploaded.id).catch(()=>{});
    throw error;
  }
}
export async function saveDiaryTranscriptChunk(p,{user,database=db}) {
  const transcript=String(p.text||'');
  if (!transcript.trim()||transcript.length>20000) throw failure('Invalid transcript segment.');
  return database.transaction(async tx=>{
    const keys=segment(p,await diaryEvent(tx,p,user,true));
    await lock(tx,keys.chunkKey);
    const [row]=await read(tx,keys.chunkKey);
    if (!row) throw failure('Save the audio segment first.',404);
    if (row.cells.text) return {...row.cells,sequence:keys.sequence};
    await tx.query("UPDATE "+recordings+" SET cells=jsonb_set(cells,'{text}',to_jsonb($2::text)) WHERE chunk_key=$1",[keys.chunkKey,transcript]);
    return {...row.cells,text:transcript,sequence:keys.sequence};
  });
}
export async function getDiaryRecordingAudio(p,{user,database=db,files=drive}) {
  const row=await database.transaction(async tx=>{
    const keys=segment(p,await diaryEvent(tx,p,user,true));
    const [saved]=await read(tx,keys.chunkKey);
    if (!saved) throw failure('Recording segment not found.',404);
    return saved.cells;
  },{readOnly:true});
  if (row.text) return row;
  const bytes=await files.download(row.fileId,{limit:maxAudio});
  return {...row,audio:bytes.toString('base64')};
}

export async function prepareDiaryMom(p,{user,database=db}) {
  const projectId=text(p.projectId);
  requireProject(user,projectId,{admin:true,write:true});
  return database.transaction(async tx=>{
    await tx.query('SELECT pg_advisory_xact_lock(hashtextextended($1,0))',['diary-mom:'+projectId]);
    const event=await diaryEvent(tx,p,user,true);
    const findPlan=async id=>{
      if (!id) return null;
      const rows=await tx.rows("SELECT cells FROM enlighten_operational.execution_visits WHERE cells->>'visitPlanId'=$1 LIMIT 2 FOR UPDATE",[id]);
      const plan=rows[0]?.cells;
      if (rows.length>1||plan&&(String(plan.projectId)!==projectId||String(plan.active).toLowerCase()==='false')) {
        throw failure('The meeting plan is unavailable or archived.',409);
      }
      return plan;
    };
    let plan=await findPlan(event.visitPlanId);
    if (!plan) {
      const meetingId=event.id.startsWith('meeting:')?event.id.slice(8):'';
      const meetings=await tx.rows("SELECT record_id,cells FROM enlighten_operational.project_meetings WHERE cells->>'id'=$1 AND cells->>'projectId'=$2 LIMIT 2 FOR UPDATE",
        [meetingId,projectId]);
      if (!meetingId||meetings.length!==1||String(meetings[0].cells.active).toLowerCase()==='false') throw failure('This meeting cannot receive a new MOM.',409);
      const meeting=meetings[0],timestamp=now(),by=actor(user);
      plan=await findPlan(meeting.cells.visitPlanId);
      if (!plan) {
        const work=event.workItems?.length?event.workItems:[event.title||'Meeting'],floors=event.floors?.length?event.floors:['Project'];
        const rows=await tx.rows("SELECT cells->>'seq' AS seq FROM enlighten_operational.execution_visits WHERE cells->>'projectId'=$1",[projectId]);
        const seq=1+Math.max(0,...rows.map(row=>Number(row.seq)||0));
        plan={visitPlanId:String(meeting.cells.visitPlanId||'DIARY-'+randomUUID()),projectId,seq,stage:'Meeting',
          milestone:work.join(' + '),floor:floors.join(' + '),workItems:JSON.stringify(work),floors:JSON.stringify(floors),
          title:String(event.title||'Meeting').slice(0,160),visitType:'Meeting',plannedVisits:1,weekly:false,essential:false,
          closed:false,scheduledDate:event.happened?'':event.date,history:'[]',active:true,createdAt:timestamp,createdBy:by,updatedAt:timestamp,updatedBy:by};
        await tx.query('INSERT INTO enlighten_operational.execution_visits (cells) VALUES ($1::jsonb)',[JSON.stringify(plan)]);
      }
      await tx.query('UPDATE enlighten_operational.project_meetings SET cells=cells||$1::jsonb,updated_at=clock_timestamp() WHERE record_id=$2',
        [JSON.stringify({visitPlanId:plan.visitPlanId,updatedAt:timestamp,updatedBy:by}),meeting.record_id]);
    }
    return {row:{...plan,scheduledDate:event.date||plan.scheduledDate||''}};
  });
}
