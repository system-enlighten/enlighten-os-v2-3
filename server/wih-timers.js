import {openTaskSubtasks} from './workflow-subtasks.js';
import {db} from './supabase-db.js';
import {requireAssignedTask} from './permissions.js';
import {active,actor,failure,insertRecord,nextEntityId,now,projectChildren,projectRow,text,updateRecord,writeActivity} from './project-write-storage.js';

const running='In Progress';
const dateInStudio=timestamp=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(timestamp));
const roundHours=minutes=>Math.round(minutes*100/60)/100;

export async function loadTimer(tx,id,user,{attendanceOwner}={}) {
  const matches=await tx.rows("SELECT record_id,cells FROM enlighten_operational.design_tasks WHERE cells->>'designTaskId'=$1 LIMIT 2",[id]);
  if (matches.length!==1) throw failure('Design task is missing or duplicated.',matches.length?409:404);
  const projectId=text(matches[0].cells.projectId);
  const project=await projectRow(tx,projectId);
  if (!project&&!attendanceOwner) throw failure('Project not found.',404);
  const tasks=await projectChildren(tx,'design_tasks',projectId);
  const task=tasks.find(row=>row.record_id===matches[0].record_id);
  const timers=(await projectChildren(tx,'wih',projectId)).filter(row=>String(row.cells.designTaskId)===id);
  if (!task||timers.length!==1) throw failure('The design task requires one linked WIH row.',409);
  if (attendanceOwner) {
    if (String(timers[0].cells.assigneeUserId)!==String(attendanceOwner)) throw failure('Timer owner mismatch.',403);
  } else requireAssignedTask(user,task.cells,timers[0].cells);
  return {project,task,timer:timers[0],tasks,projectId};
}

export function predecessors(task) {
  let ids;
  try {ids=JSON.parse(task.predecessorTaskIds||'[]');} catch {ids=[];}
  return [...new Set([...(Array.isArray(ids)?ids.map(String):[]),...(task.predecessorTaskId?[String(task.predecessorTaskId)]:[])])];
}

export function assertPredecessors(task,tasks) {
  const complete=id=>tasks.some(row=>String(row.cells.designTaskId)===String(id)&&row.cells.status==='Completed');
  if (predecessors(task).some(id=>!complete(id))) throw failure('Complete the preceding workflow subtask on all covered floors first.',409);
  if (task.predecessorTaskId&&!complete(task.predecessorTaskId)) throw failure('Complete the preceding workflow subtask first.',409);
  if (task.status==='Blocked') throw failure('This subtask is waiting for its predecessor.',409);
}

export async function updateTimer(tx,task,timer,taskPatch,timerPatch) {
  await updateRecord(tx,'design_tasks',task.record_id,taskPatch);
  await updateRecord(tx,'wih',timer.record_id,timerPatch);
  return {task:{...task.cells,...taskPatch},wih:{...timer.cells,...timerPatch}};
}

async function resume(tx,state,user,timestamp,start) {
  const {project,task,timer,tasks,projectId}=state,{designTaskId}=task.cells;
  if (start&&task.cells.status==='Completed') throw failure('Completed task cannot be started.',409);
  if (!start&&!['Paused','Not Started'].includes(timer.cells.status)) throw failure('Task is not paused/not started.',409);
  const root=task.cells.parentDesignTaskId?tasks.find(row=>String(row.cells.designTaskId)===String(task.cells.parentDesignTaskId))?.cells:task.cells;
  if (!root) throw failure('Parent design task not found.',409);
  if (text(root.taskType).toLowerCase()==='decorative selection'&&!active(project.cells.artCuration)) {
    throw failure('Enable Art Curation in Project & Scope to open Decorative Selection.',409);
  }
  const owner=text(timer.cells.assigneeUserId);
  if (owner) {
    const [briefing]=await tx.rows("SELECT cells FROM enlighten_operational.studio_briefings WHERE cells->>'openUserId'=$1 LIMIT 1",[owner]);
    if (briefing&&!briefing.cells.end) throw failure('End your discussion before starting another task timer.',409);
    const [day]=await tx.rows("SELECT cells FROM enlighten_operational.studio_attendance WHERE cells->>'key'=$1 LIMIT 1",[owner+'|'+dateInStudio(timestamp)]);
    if (day?.cells.checkOut) throw failure('Task timers are unavailable after attendance checkout.',409);
    if (day?.cells.breakStart) throw failure('Resume work from Attendance before starting a task timer.',409);
    const other=await tx.rows("SELECT 1 FROM enlighten_operational.wih WHERE cells->>'assigneeUserId'=$1 AND cells->>'designTaskId'<>$2 AND cells->>'status'=$3 LIMIT 1",[owner,designTaskId,running]);
    if (other.length) throw failure('Pause or stop the current timer first.',409);
  }
  assertPredecessors(task.cells,tasks);
  if (start&&timer.cells.status===running) return {task:task.cells,wih:timer.cells};
  if (start) await openTaskSubtasks(tx,project.cells,task.cells,user);
  await syncTaskDashboard(tx,projectId,designTaskId,running,timestamp,user);
  const bundle=await updateTimer(tx,task,timer,{status:running,updatedAt:timestamp,updatedBy:actor(user),
    ...(start?{startedAt:task.cells.startedAt||timestamp}:{})},
    {status:running,startAt:timestamp,updatedAt:timestamp,...(start?{workDate:dateInStudio(timestamp),lastPauseAt:'',stopAt:''}:{})});
  if (start) await writeActivity(tx,user,'START','DesignTask',designTaskId,projectId,task.cells,{...task.cells,status:running});
  return bundle;
}

export async function pauseTimer(tx,state,user,timestamp,notes) {
  const {task,timer}=state,row=timer.cells;
  const duration=row.startAt?Math.max(0,Math.round((Date.parse(timestamp)-Date.parse(row.startAt))/60000)||0):0;
  const count=Math.max(1,Number(row.sharedTaskCount)||1);
  const minutes=Math.floor(duration/count)+((Number(row.sharedTaskIndex)||0)<duration%count?1:0);
  const total=(Number(row.totalMinutes)||0)+minutes;
  if (minutes>0) await insertRecord(tx,'work_log',{workLogId:await nextEntityId(tx,'work_log'),wihId:row.wihId,
    designTaskId:task.cells.designTaskId,projectId:task.cells.projectId,userId:row.assigneeUserId||user.userId,userName:row.assigneeName||actor(user),
    sessionDate:dateInStudio(timestamp),startAt:row.startAt,endAt:timestamp,minutes,hours:roundHours(minutes),action:'PAUSE',
    notes:row.sessionRemarks||notes,createdAt:timestamp});
  return updateTimer(tx,task,timer,{status:running,pausedAt:timestamp,actualHours:roundHours(total),updatedAt:timestamp,updatedBy:actor(user)},
    {status:'Paused',startAt:'',lastPauseAt:timestamp,currentSessionMinutes:0,totalMinutes:total,updatedAt:timestamp,
      ...(row.sharedSession?{sharedSession:'',sharedTaskCount:'',sharedTaskIndex:'',sessionRemarks:'',notes:row.sessionRemarks||row.notes||''}:{})});
}

async function skip(tx,state,user,timestamp) {
  const {task,timer,tasks,projectId}=state, id=String(task.cells.designTaskId);
  if (!task.cells.parentDesignTaskId||!active(task.cells.optional)) throw failure('Only optional workflow subtasks may be skipped.',409);
  assertPredecessors(task.cells,tasks);
  if (task.cells.status==='Completed') return {task:task.cells,wih:timer.cells};
  if ([running,'Paused'].includes(task.cells.status)) throw failure('Complete work already started; skip is only for steps not required.',409);
  const notes='Skipped: optional step not required';
  const bundle=await updateTimer(tx,task,timer,{status:'Completed',completedAt:timestamp,remarks:notes,updatedAt:timestamp,updatedBy:actor(user)},
    {status:'Completed',stopAt:timestamp,notes,updatedAt:timestamp});
  await unlockSuccessors(tx,tasks,projectId,id,timestamp);
  await writeActivity(tx,user,'SKIP_OPTIONAL','DesignTask',id,projectId,task.cells,{status:'Completed'});
  return bundle;
}

async function change(payload,{user,database=db},mode) {
  const id=text(payload.designTaskId);
  if (!id) throw failure('designTaskId is required.');
  return database.transaction(async tx=>{
    await tx.query("SELECT pg_advisory_xact_lock(hashtext('enlighten_work_timers'))");
    const state=await loadTimer(tx,id,user),timestamp=now();
    if (mode==='skip') return skip(tx,state,user,timestamp);
    if (mode!=='pause') return resume(tx,state,user,timestamp,mode==='start');
    if (state.timer.cells.status!==running) throw failure('Task is not currently in progress.',409);
    const session=state.timer.cells.sharedSession;
    if (session) {
      const members=await tx.rows("SELECT cells->>'designTaskId' AS id FROM enlighten_operational.wih WHERE cells->>'sharedSession'=$1 AND cells->>'status'=$2 ORDER BY record_id",[session,running]);
      for (const member of members) {
        if (member.id===id) continue;
        const sibling=await loadTimer(tx,member.id,user);
        await pauseTimer(tx,sibling,user,timestamp,'');
      }
    }
    return pauseTimer(tx,state,user,timestamp,text(payload.notes));
  });
}

export const resumeTask=(payload,context)=>change(payload,context,'resume');
export const pauseTask=(payload,context)=>change(payload,context,'pause');

export const startTask=(payload,context)=>change(payload,context,'start');

export const skipWorkflowSubtask=(payload,context)=>change(payload,context,'skip');

export async function unlockSuccessors(tx,tasks,projectId,id,timestamp) {
  const completedIds=new Set([id,...tasks.filter(row=>row.cells.status==='Completed').map(row=>String(row.cells.designTaskId))]);
  const successors=tasks.filter(row=>row.cells.status==='Blocked'&&predecessors(row.cells).includes(id)&&
    predecessors(row.cells).every(predecessor=>completedIds.has(predecessor)));
  if (successors.length) {
    const timers=await projectChildren(tx,'wih',projectId);
    for (const successor of successors) {
      const matches=timers.filter(row=>String(row.cells.designTaskId)===String(successor.cells.designTaskId));
      if (matches.length!==1) throw failure('A successor requires one linked WIH row.',409);
      await updateTimer(tx,successor,matches[0],{status:'Ready',updatedAt:timestamp},{status:'Not Started',updatedAt:timestamp});
    }
  }
}

export async function syncTaskDashboard(tx,projectId,designTaskId,status,timestamp,user) {
  for (const row of await projectChildren(tx,'design_dashboard',projectId)) {
    const statuses=Object.fromEntries(Object.entries(row.cells).filter(([key,value])=>key.endsWith('TaskId')&&String(value)===String(designTaskId))
      .map(([key])=>[key.replace(/TaskId$/,'Status'),status]));
    if (Object.keys(statuses).length) await updateRecord(tx,'design_dashboard',row.record_id,{...statuses,updatedAt:timestamp,updatedBy:actor(user)});
  }
}
