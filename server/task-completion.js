import {db} from './supabase-db.js';
import {createDriveAttachments} from './drive-attachments.js';
import {previewProjectFolder} from './drawing-publishing.js';
import {loadDrawingWork} from './drawing-classification.js';
import {taskBatchCoverage_} from './drawing-rules.js';
import {syncDocumentation} from './design-workspace.js';
import {workflowTemplates} from './workflow-subtasks.js';
import {assertPredecessors,loadTimer,syncTaskDashboard,unlockSuccessors,updateTimer} from './wih-timers.js';
import {active,actor,failure,insertRecord,nextEntityId,now,projectChildren,text,updateRecord,writeActivity} from './project-write-storage.js';
import {workDrawingMetadata} from './work-drawing-metadata.js';

const client=createDriveAttachments();
const hours=minutes=>Math.round(minutes*100/60)/100;
const studioDay=value=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(value));
const zoneKey=area=>JSON.stringify([text(area.floor).toLowerCase(),text(area.area).toLowerCase()]);
const validMetadata=(task,p)=>{
  try {return workDrawingMetadata(task,p);} catch(error) {throw failure(error.message);}
};

function assertCompletable(state,notes,lines) {
  const {task,tasks}=state;
  assertPredecessors(task.cells,tasks);
  if (!task.cells.parentDesignTaskId&&!task.cells.revisionOf) {
    const children=tasks.filter(row=>String(row.cells.parentDesignTaskId)===String(task.cells.designTaskId));
    if (!children.length&&workflowTemplates(task.cells,lines).length) throw failure('Start this task first to open its workflow subtasks.',409);
    if (children.some(row=>row.cells.status!=='Completed')) throw failure('Complete all workflow subtasks before completing the parent task.',409);
  }
  if (task.cells.taskCategory==='Meeting'&&!notes) throw failure('Record meeting minutes / outcome before completing this meeting.');
}

function outputFile(files,id,allowed) {
  const matches=files.filter(row=>String(row.cells.fileId)===id);
  if (matches.length!==1||active(matches[0].cells.trashed)||matches[0].cells.direction!=='Output'||
      !allowed.includes(String(matches[0].cells.linkedEntityId))) throw failure('Select an Output drawing uploaded for these tasks.',409);
  return matches[0];
}

async function finish(tx,state,p,user,file) {
  const {task,timer,tasks,project,projectId}=state,id=String(task.cells.designTaskId);
  if (task.cells.status==='Completed'&&text(task.cells.completedFileId)===text(file?.fileId)) return {task:task.cells,wih:timer.cells};
  if (task.cells.status==='Completed') throw failure('This task already has a different completion file.',409);
  const row=timer.cells,timestamp=now(),notes=text(p.notes);
  if (row.sharedSession&&row.status==='In Progress') throw failure('Pause the shared session before completing a task.',409);
  if (!file&&active(row.completionUploadRequired)) throw failure('Completion drawing/file is required before task can be completed.');
  const minutes=row.status==='In Progress'&&row.startAt?Math.max(0,Math.round((Date.parse(timestamp)-Date.parse(row.startAt))/60000)||0):0;
  if (minutes) await insertRecord(tx,'work_log',{workLogId:await nextEntityId(tx,'work_log'),wihId:row.wihId,designTaskId:id,projectId,
    userId:row.assigneeUserId||user.userId,userName:row.assigneeName||actor(user),sessionDate:studioDay(timestamp),
    startAt:row.startAt,endAt:timestamp,minutes,hours:hours(minutes),action:'COMPLETE',notes,createdAt:timestamp});
  const manual=Number(p.actualHours),total=Number.isFinite(manual)&&manual>0?Math.round(manual*60):(Number(row.totalMinutes)||0)+minutes;
  const fileId=file?.fileId||'';
  const bundle=await updateTimer(tx,task,timer,
    {status:'Completed',completedAt:timestamp,actualHours:hours(total),completedFileId:fileId,remarks:notes||task.cells.remarks||'',updatedAt:timestamp,updatedBy:actor(user)},
    {status:'Completed',stopAt:timestamp,currentSessionMinutes:0,totalMinutes:total,completionFileId:fileId,notes:notes||row.notes||'',updatedAt:timestamp});
  await syncTaskDashboard(tx,projectId,id,'Completed',timestamp,user);
  await unlockSuccessors(tx,tasks,projectId,id,timestamp);
  if (!task.cells.parentDesignTaskId&&/lighting layout|wiring drawings|rcp\/flr\/cir/i.test(String(task.cells.parentTask||task.cells.taskType||''))) {
    await syncDocumentation(await loadDrawingWork(tx,project.cells,user));
  }
  await writeActivity(tx,user,'COMPLETE','DesignTask',id,projectId,task.cells,{...task.cells,status:'Completed'});
  return bundle;
}

function inlineBytes(value) {
  if (typeof value!=='string'||value.length>4*1024*1024||!/^[A-Za-z0-9+/]+={0,2}$/.test(value)) throw failure('Use a valid drawing upload under 3 MB.');
  const bytes=Buffer.from(value,'base64');
  if (!bytes.length||bytes.toString('base64').replace(/=+$/,'')!==value.replace(/=+$/,'')) throw failure('Invalid drawing upload.');
  return bytes;
}

export async function completeTask(p,{user,database=db,files=client,env=process.env}) {
  const id=text(p.designTaskId);
  if (!id) throw failure('designTaskId is required.');
  let uploaded;
  try {
    return await database.transaction(async tx=>{
      await tx.query("SELECT pg_advisory_xact_lock(hashtext('enlighten_work_timers'))");
      const state=await loadTimer(tx,id,user),{task,project,projectId}=state;
      const lines=(await loadDrawingWork(tx,project.cells,user)).lines;
      assertCompletable(state,text(p.notes),lines);
      let file;
      if (p.fileBase64&&p.fileName) {
        if (task.cells.status==='Completed') throw failure('This task is already completed.',409);
        const name=text(p.fileName),mimeType=text(p.mimeType)||'application/octet-stream';
        if (!name||name.length>250||!/^[\w.+-]+\/[\w.+-]+$/.test(mimeType)) throw failure('Invalid drawing filename or MIME type.');
        const bytes=inlineBytes(p.fileBase64),meta=validMetadata(task.cells,p);
        const root=await previewProjectFolder(project.cells,files,env);
        const folders=await files.findFolders(root,['Output','02 Design Output']);
        const target=folders[0]?.id||await files.getOrCreateFolder(root,'Output');
        uploaded=await files.upload(target,{name,mimeType,bytes});
        file={fileId:await nextEntityId(tx,'files'),projectId,linkedEntityType:'Design Task',linkedEntityId:id,folderCategory:'Output',
          fileName:name,mimeType,driveFileId:uploaded.id,driveUrl:uploaded.webViewLink||'https://drive.google.com/file/d/'+encodeURIComponent(uploaded.id)+'/view',
          drawingType:task.cells.taskType,...meta,revisionNo:text(p.revisionNo),direction:'Output',uploadedAt:now(),uploadedBy:actor(user)};
        await insertRecord(tx,'files',file);
      } else if (p.completionFileId) {
        const saved=outputFile(await projectChildren(tx,'files',projectId),text(p.completionFileId),[id]);
        file=saved.cells;
        if (p.fileName) {
          const patch={...validMetadata(task.cells,p),drawingType:task.cells.taskType,revisionNo:text(p.revisionNo)||file.revisionNo||''};
          await updateRecord(tx,'files',saved.record_id,patch);
          file={...file,...patch};
        }
      }
      return finish(tx,state,p,user,file);
    });
  } catch(error) {
    if (uploaded) await files.trash(uploaded.id).catch(()=>{});
    throw error;
  }
}

export async function completeDashboardWork(p,{user,database=db}) {
  const projectId=text(p.projectId),fileId=text(p.completionFileId);
  if (!projectId||!fileId||!Array.isArray(p.taskIds)||!p.taskIds.length||p.taskIds.length>50) throw failure('Select up to 50 drawing tasks and an Output drawing.');
  const ids=[...new Set(p.taskIds.map(text))];
  return database.transaction(async tx=>{
    await tx.query("SELECT pg_advisory_xact_lock(hashtext('enlighten_work_timers'))");
    const items=[];
    for (const id of ids) {
      const item=await loadTimer(tx,id,user),coverage=taskBatchCoverage_(item.task.cells);
      if (item.projectId!==projectId||item.task.cells.taskCategory==='Meeting'||!coverage.length) throw failure('Select drawing tasks linked to a floor and area in this project.');
      if (active(item.project.cells.completed)||text(item.project.cells.projectStatus).toLowerCase()==='completed') throw failure('The project is completed.',409);
      items.push({...item,coverage});
    }
    const saved=outputFile(await projectChildren(tx,'files',projectId),fileId,ids);
    const allowed=new Map(items.flatMap(item=>item.coverage.map(area=>[zoneKey(area),area])));
    if (p.coverage!==undefined&&(!Array.isArray(p.coverage)||!p.coverage.length||p.coverage.some(area=>
      !area||typeof area.floor!=='string'||typeof area.area!=='string'||!allowed.has(zoneKey(area))))) throw failure('Select valid zones for these drawing tasks.');
    const selected=new Set(p.coverage?p.coverage.map(zoneKey):allowed.keys());
    if (items.some(item=>!item.coverage.some(area=>selected.has(zoneKey(area))))) throw failure('Each selected task must cover a selected zone.');
    const complete=items.filter(item=>item.coverage.every(area=>selected.has(zoneKey(area))));
    const {lines}=await loadDrawingWork(tx,items[0].project.cells,user);
    for (const item of complete) {
      if (item.task.cells.status==='Completed'&&String(item.task.cells.completedFileId)!==fileId) throw failure('A selected task was already completed with a different drawing.',409);
      if (item.task.cells.status!=='Completed'&&p.historical!==true) assertCompletable(item,'',lines);
    }
    const primary=items.find(item=>String(item.task.cells.designTaskId)===String(saved.cells.linkedEntityId)).task.cells;
    const covered=[...selected].map(key=>allowed.get(key));
    const meta=validMetadata(primary,{fileName:saved.cells.fileName,drawingFloor:[...new Set(covered.map(area=>area.floor))].join(', '),
      drawingArea:[...new Set(covered.map(area=>area.area))].join(', ')});
    await updateRecord(tx,'files',saved.record_id,{...meta,drawingType:primary.taskType,zoneCoverageJson:JSON.stringify(covered.map(({floor,area})=>({floor,area})))});
    for (const item of complete) if (item.task.cells.status!=='Completed') {
      await finish(tx,await loadTimer(tx,String(item.task.cells.designTaskId),user),{},user,saved.cells);
    }
    return {completed:complete.length};
  });
}

export async function completeWorkflowChecklist(p,{user,database=db}) {
  if (!Array.isArray(p.taskIds)||!p.taskIds.length||p.taskIds.length>100) throw failure('Select a workflow subtask.');
  const ids=[...new Set(p.taskIds.map(text))],projectId=text(p.projectId);
  return database.transaction(async tx=>{
    await tx.query("SELECT pg_advisory_xact_lock(hashtext('enlighten_work_timers'))");
    const states=[];
    for (const id of ids) {
      const state=await loadTimer(tx,id,user),task=state.task.cells;
      if (state.projectId!==projectId||!task.parentDesignTaskId||task.taskCategory==='Meeting'||
          active(task.completionUploadRequired)||active(state.timer.cells.completionUploadRequired)) {
        throw failure('Finish the required upload or meeting outcome in Tasks.',409);
      }
      if (task.status!=='Completed') assertCompletable(state,'',[]);
      states.push(state);
    }
    for (const state of states) if (state.task.cells.status!=='Completed') {
      await finish(tx,await loadTimer(tx,String(state.task.cells.designTaskId),user),{},user);
    }
    return {completed:states.length};
  });
}
