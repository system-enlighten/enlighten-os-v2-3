import {db} from './supabase-db.js';
import {requireStudio,wihProjectRole} from './permissions.js';
import {loadDrawingWork} from './drawing-classification.js';
import {getWIH} from './design-workspace.js';
import {batchCoveragePatch_,drawingBatchKind_,taskBatchCoverage_} from './drawing-rules.js';
import {predecessors} from './wih-timers.js';
import {active,failure,now,projectRow,text,updateRecord} from './project-write-storage.js';

const lower=value=>text(value).toLowerCase();
const open=value=>['not started','ready','pending','open'].includes(lower(value));

export async function reconcileWihProject(p,{user,database=db}) {
  requireStudio(user);
  const id=text(p.projectId),role=wihProjectRole(user,id);
  if (!id||!role||lower(user.appAccess)==='viewer') throw failure('Project edit access required for Work in Hand recovery.',403);
  return database.transaction(async tx=>{
    await tx.query("SELECT pg_advisory_xact_lock(hashtext('enlighten_work_timers'))");
    const project=await projectRow(tx,id);
    if (!project) throw failure('Project not found.',404);
    await getWIH({projectId:id,includeCompleted:true},{user,database:{transaction:work=>work(tx)}});
    if (role==='Admin') {
      const state=await loadDrawingWork(tx,project.cells,user);
      const timers=new Map(state.wih.map(row=>[String(row.cells.designTaskId),row]));
      for (const row of state.tasks) {
        const task=row.cells,timer=timers.get(String(task.designTaskId));
        const work=timer?.cells;
        if (task.assigneeUserId||task.startedAt||work&&(work.assigneeUserId||work.startAt||Number(work.totalMinutes)>0||
          /completed|progress|paused/i.test(String(work.status)))) continue;
        const delegated=state.resolve(task);
        if (!delegated.assigneeUserId) continue;
        const patch={assigneeUserId:delegated.assigneeUserId,assigneeName:delegated.assigneeName,updatedAt:now()};
        if (timer) await updateRecord(tx,'wih',timer.record_id,patch);
        await updateRecord(tx,'design_tasks',row.record_id,patch);
      }
    }
    return {projectId:id,reconciled:true};
  });
}

export async function consolidateOpenDrawingTasks(_p,{user,database=db}) {
  requireStudio(user);
  if (lower(user.appAccess)==='viewer') throw failure('Project admin access required.',403);
  return database.transaction(async tx=>{
    await tx.query("SELECT pg_advisory_xact_lock(hashtext('enlighten_work_timers'))");
    const projects=(await tx.rows('SELECT cells FROM enlighten_operational.projects ORDER BY record_id')).map(row=>row.cells)
      .filter(row=>!active(row.completed)&&lower(row.projectStatus)!=='completed'&&wihProjectRole(user,String(row.projectId))==='Admin');
    let merged=0;
    for (const project of projects) {
      const id=String(project.projectId);
      if (!await projectRow(tx,id)) continue;
      const state=await loadDrawingWork(tx,project,user),protectedIds=new Set(state.plans);
      for (const table of ['work_log','assigned_work_comments','assigned_work_acceptance']) {
        const rows=await tx.rows("SELECT cells->>'designTaskId' AS id FROM enlighten_operational."+table+" WHERE cells->>'projectId'=$1",[id]);
        for (const row of rows) protectedIds.add(row.id);
      }
      for (const {cells} of state.tasks) {
        for (const related of [cells.parentDesignTaskId,...predecessors(cells)]) if (related) protectedIds.add(String(related));
      }
      const timers=new Map(state.wih.map(row=>[String(row.cells.designTaskId),row.cells])),groups=new Map();
      for (const row of state.tasks) {
        const task=row.cells,taskId=String(task.designTaskId),kind=drawingBatchKind_(task),timer=timers.get(taskId);
        if (!kind||task.revisionOf||task.mergedIntoTaskId||predecessors(task).length||protectedIds.has(taskId)||!open(task.status)||task.completedFileId||
          timer&&(timer.startAt||timer.stopAt||Number(timer.totalMinutes)>0||!open(timer.status)||timer.completionFileId)) continue;
        const key=JSON.stringify([kind,String(task.assigneeUserId||lower(task.assigneeName)),String(task.workflowTemplateSnapshot||'')]);
        if (!groups.has(key)) groups.set(key,[]);
        groups.get(key).push(row);
      }
      const links=new Map(),hasTimer=row=>timers.has(String(row.cells.designTaskId)),stage=row=>String(row.cells.workflowVersion)==='2';
      for (const group of groups.values()) {
        if (group.length<2||!group.some(hasTimer)) continue;
        group.sort((a,b)=>Number(hasTimer(b))-Number(hasTimer(a))||Number(stage(b))-Number(stage(a)));
        const [anchor,...others]=group,target=anchor.cells;
        const patch=batchCoveragePatch_(target,others.flatMap(row=>taskBatchCoverage_(row.cells)));
        const source=others.find(row=>row.cells.sourceDrawingId)?.cells.sourceDrawingId;
        if (!target.sourceDrawingId&&source) patch.sourceDrawingId=source;
        await updateRecord(tx,'design_tasks',anchor.record_id,patch);
        for (const row of others) {
          links.set(String(row.cells.designTaskId),target);
          await updateRecord(tx,'design_tasks',row.record_id,{mergedIntoTaskId:target.designTaskId});
          merged++;
        }
      }
      for (const row of state.dashboard) {
        const patch={};
        for (const [key,value] of Object.entries(row.cells)) {
          const anchor=key.endsWith('TaskId')&&links.get(String(value));
          if (!anchor) continue;
          const prefix=key.slice(0,-6);
          Object.assign(patch,{[key]:anchor.designTaskId,[prefix+'DesignNo']:anchor.designNo||'',[prefix+'Status']:anchor.status});
        }
        if (Object.keys(patch).length) await updateRecord(tx,'design_dashboard',row.record_id,patch);
      }
    }
    return {merged};
  });
}
