import {randomUUID} from 'node:crypto';
import {db} from './supabase-db.js';
import {projectRoleMap,projectRoleFor,requireStudio,requireProject,wihProjectRole} from './permissions.js';
import {createTask,loadDrawingWork} from './drawing-classification.js';
import {openTaskSubtasks} from './workflow-subtasks.js';
import {assertPredecessors,loadTimer,pauseTimer,syncTaskDashboard,updateTimer} from './wih-timers.js';
import {active,actor,failure,now,projectChildren,projectRow,text} from './project-write-storage.js';

const idsOf=value=>[...new Set(Array.isArray(value)?value.map(String):[])];
const lock=tx=>tx.query("SELECT pg_advisory_xact_lock(hashtext('enlighten_work_timers'))");
export async function createTaskRevisions(p,{user,database=db}) {
  const projectId=text(p.projectId),ids=idsOf(p.taskIds),remarks=text(p.remarks);
  requireProject(user,projectId,{write:true});
  if (!ids.length||ids.length>40||!remarks||remarks.length>2000||!/^[a-f0-9-]{36}$/i.test(p.requestId||'')) {
    throw failure('Select completed work and enter a revision remark.');
  }
  return database.transaction(async tx=>{
    await lock(tx);
    const project=await projectRow(tx,projectId);
    if (!project) throw failure('Project not found.',404);
    const state=await loadDrawingWork(tx,project.cells,user),tasks=state.tasks.map(row=>row.cells);
    const sources=ids.map(id=>tasks.find(task=>String(task.designTaskId)===id));
    if (sources.some(task=>!task||task.status!=='Completed'||task.mergedIntoTaskId)) throw failure('Select completed original tasks from this project.');
    const admin=wihProjectRole(user,projectId)==='Admin';
    const grants=(await tx.rows("SELECT cells FROM enlighten_operational.project_roles WHERE cells->>'projectId'=$1",[projectId])).map(row=>row.cells);
    const assignees=sources.map(source=>state.people.find(member=>active(member.active)&&
      String(member.userId)===String(admin&&p.assigneeUserId||source.assigneeUserId)));
    if (assignees.some(person=>!person)) throw failure('Choose an active assignee.');
    if (assignees.some(person=>String(person.userId)!==String(user.userId)&&!projectRoleFor({authorized:true,active:true,
      ...person,projectRoles:projectRoleMap(grants,String(person.userId))},projectId))) throw failure('The assignee needs access to this project.');
    const zoneIds=p.zoneIds===undefined?null:idsOf(p.zoneIds);
    if (zoneIds&&(!zoneIds.length||zoneIds.length>40||ids.length!==1)) throw failure('Select up to 40 zones for one task.');
    let zones=[null];
    if (zoneIds) {
      const available=(await projectChildren(tx,'floor_zones',projectId)).map(row=>row.cells).filter(row=>active(row.active));
      zones=zoneIds.map(id=>available.find(row=>String(row.floorZoneId)===id));
      if (zones.some(zone=>!zone)) throw failure('One of the selected zones is unavailable. Reopen this form and try again.');
    }
    const result=[];
    for (const [index,source] of sources.entries()) for (const zone of zones) {
      const original=tasks.find(task=>String(task.designTaskId)===String(source.revisionOf))||source;
      const activation='revision:'+p.requestId+':'+source.designTaskId+(zone?':'+zone.floorZoneId:'');
      const saved=state.tasks.find(row=>row.cells.workflowActivationKey===activation)?.cells;
      if (saved) {
        result.push(saved);
        continue;
      }
      const number=1+state.tasks.filter(row=>String(row.cells.revisionOf)===String(original.designTaskId)).length;
      result.push(await createTask(state,{floor:zone?.floor||source.floor,area:zone?.area||source.area,
        taskType:original.taskType+' \u00b7 Revision '+number,dependencyDrawingType:original.dependencyDrawingType,
        workflowActivationKey:activation,revisionOf:original.designTaskId,narration:remarks,assigneeUserId:assignees[index].userId,
        assigneeName:assignees[index].name,completionUploadRequired:active(original.completionUploadRequired)}));
    }
    return result;
  });
}

export async function sharedWorkSession(p,{user,database=db,clock=Date.now}) {
  requireStudio(user);
  const uid=text(user.userId),ids=idsOf(p.taskIds);
  if (!uid||!['start','pause'].includes(p.mode)||!(/^(admin|user)$/i.test(user.appAccess))) throw failure('Invalid logging action.',403);
  if (!ids.length||ids.length>40) throw failure('Select up to 40 tasks.');
  return database.transaction(async tx=>{
    await lock(tx);
    const paired=[];
    for (const id of ids) {
      const item=await loadTimer(tx,id,user);
      if (!wihProjectRole(user,item.projectId)||String(item.task.cells.assigneeUserId)!==uid||String(item.timer.cells.assigneeUserId)!==uid) {
        throw failure('Select your own assigned tasks.',403);
      }
      paired.push(item);
    }
    const at=new Date(clock()).toISOString(),workDate=new Date(Date.parse(at)+19800000).toISOString().slice(0,10);
    const running=(await tx.rows("SELECT cells FROM enlighten_operational.wih WHERE cells->>'assigneeUserId'=$1 AND cells->>'status'='In Progress'",
      [uid])).map(row=>row.cells);
    const result=[];
    if (p.mode==='pause') {
      const session=paired[0].timer.cells.sharedSession,members=running.filter(row=>row.sharedSession===session);
      if (!session||members.length!==ids.length||members.some(row=>!ids.includes(String(row.designTaskId)))) {
        throw failure('The shared session changed. Refresh Work in Hand.',409);
      }
      for (const item of paired) result.push(await pauseTimer(tx,item,user,at,''));
      return result;
    }
    if (running.length) throw failure('Pause or stop the current timer first.',409);
    const [briefing]=await tx.rows("SELECT cells FROM enlighten_operational.studio_briefings WHERE cells->>'openUserId'=$1 LIMIT 1",[uid]);
    if (briefing&&!briefing.cells.end) throw failure('End your discussion before starting another task timer.',409);
    const [day]=await tx.rows("SELECT cells FROM enlighten_operational.studio_attendance WHERE cells->>'key'=$1 LIMIT 1",[uid+'|'+workDate]);
    if (day?.cells.checkOut||day?.cells.breakStart) throw failure('Check in or resume work from Attendance before starting a task timer.',409);
    const notes=text(p.remarks),taskNotes=ids.map(id=>text(p.taskRemarks?.[id]));
    if ([notes,...taskNotes].some(value=>value.length>2000)) throw failure('Keep each remark under 2,000 characters.');
    for (const {project,task,timer,tasks} of paired) {
      if (!['Ready','Not Started','Paused'].includes(timer.cells.status)||task.cells.status==='Completed') throw failure('Select pending or paused tasks.',409);
      const parent=task.cells.parentDesignTaskId?tasks.find(row=>String(row.cells.designTaskId)===String(task.cells.parentDesignTaskId))?.cells:task.cells;
      if (!parent) throw failure('Parent design task not found.',409);
      if (/^decorative selection$/i.test(text(parent.taskType))&&!active(project.cells.artCuration)) throw failure('Enable Art Curation in Project & Scope.');
      assertPredecessors(task.cells,tasks);
      if (timer.cells.status!=='Paused') await openTaskSubtasks(tx,project.cells,task.cells,user);
    }
    const sharedSession=randomUUID();
    for (const [index,{task,timer,projectId}] of paired.entries()) {
      result.push(await updateTimer(tx,task,timer,{status:'In Progress',startedAt:task.cells.startedAt||at,updatedAt:at,updatedBy:actor(user)},
        {status:'In Progress',workDate,startAt:at,lastPauseAt:'',stopAt:'',updatedAt:at,sharedSession,sharedTaskCount:paired.length,
          sharedTaskIndex:index,sessionRemarks:[notes,taskNotes[index]].filter(Boolean).join('\n')}));
      await syncTaskDashboard(tx,projectId,task.cells.designTaskId,'In Progress',at,user);
    }
    return result;
  });
}
