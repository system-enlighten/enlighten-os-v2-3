import {db} from './supabase-db.js';
import {checkProjectRead,requireProject,requireStudio,wihProjectRole} from './permissions.js';
import {createTask,loadDrawingWork,repairStages,resolveLine} from './drawing-classification.js';
import {drawingBatchKind_,drawingEligibleTaskViews_,drawingReceiptMetadata_,taskBatchCoverage_} from './drawing-rules.js';
import {defaultDocumentationRows} from './workflow-defaults.js';
import {receivedSourceForTask_,wihDelegationResolver_} from './wih-projections.js';
import {active,failure,insertRecord,nextEntityId,now,projectChildren,projectRow,text} from './project-write-storage.js';

const label=value=>text(value).toLowerCase();
const typeDecorative=value=>label(value)==='decorative selection';
const internal=id=>/^__(?:internal_(?:os|center|ops|discussion|custom_[a-f0-9-]{36})|admin_work)__$/.test(String(id));
const completed=value=>/^completed$|^done$/i.test(String(value||''));
const isDrawingReceived=row=>!active(row.trashed)&&label(row.direction||'Received')==='received';
const projectClosed=project=>active(project.completed)||label(project.projectStatus)==='completed';
const pairKey=(floor,area)=>JSON.stringify([label(floor),label(area)]);

export const rootTasks=state=>state.tasks.map(row=>row.cells).filter(task=>!task.parentDesignTaskId&&!task.mergedIntoTaskId);
export const isWiringTask=task=>/lighting layout|wiring drawings|rcp\/flr\/cir/i.test(String(task.parentTask||task.taskType||''));

export function completedWiring(state) {
  const {dashboard}=state;
  const roots=rootTasks(state);
  const wiring=roots.filter(task=>isWiringTask(task)&&
    completed(task.status)&&taskBatchCoverage_(task).length);
  const covered=new Set(wiring.flatMap(task=>taskBatchCoverage_(task)).map(({floor,area})=>pairKey(floor,area)));
  const remaining=dashboard.map(row=>row.cells).filter(row=>row.floor&&row.area&&completed(row.lightStatus)&&!covered.has(pairKey(row.floor,row.area)));
  if (remaining.length) wiring.push({designTaskId:'legacy-wiring',workflowCoverage:JSON.stringify(remaining.map(({floor,area})=>({floor,area})))});
  return wiring;
}

export function documentationTemplates({lines,project,rules}) {
  const custom=lines.filter(row=>String(row.workflowVersion)==='2'&&label(row.tasks)==='documentation'&&row.subtask&&row.triggerTaskType);
  return custom.length?custom:defaultDocumentationRows.map(row=>resolveLine(row,project.projectId,rules));
}

export async function syncDocumentation(state) {
  const roots=rootTasks(state),wiring=completedWiring(state);
  if (!wiring.length) return;
  const templates=documentationTemplates(state);
  const byTask=new Map();
  for (const row of templates) {
    if (!byTask.has(row.triggerTaskType)) byTask.set(row.triggerTaskType,[]);
    byTask.get(row.triggerTaskType).push(row);
  }
  const existing=new Set(roots.map(task=>String(task.workflowActivationKey||'')));
  const signature=areas=>JSON.stringify(areas.map(area=>[area.floor,area.area]).sort());
  for (const item of wiring) for (const [taskType,templates] of byTask) {
    let coverage=taskBatchCoverage_(item),key='documentation:'+item.designTaskId+':'+taskType;
    if (item.designTaskId==='legacy-wiring') {
      const old=new Set(roots.filter(task=>label(task.taskType)===label(taskType)).flatMap(task=>taskBatchCoverage_(task))
        .map(({floor,area})=>pairKey(floor,area)));
      coverage=coverage.filter(area=>!old.has(pairKey(area.floor,area.area)));
      if (!coverage.length) continue;
      key+=':'+coverage.map(area=>area.floor+'|'+area.area).sort().join(';');
    }
    if (existing.has(key)||roots.some(task=>label(task.taskType)===label(taskType)&&signature(taskBatchCoverage_(task))===signature(coverage))) continue;
    const first=templates[0];
    await createTask(state,{taskType,dependencyDrawingType:'MANUAL',workflowVersion:'2',workflowScope:'Stage',
      workflowCoverage:JSON.stringify(coverage),workflowActivationKey:key,workflowTemplateSnapshot:JSON.stringify(templates),
      lineWorkId:first.lineWorkId,assigneeName:first.responsible||item.assigneeName,assigneeUserId:item.assigneeUserId,completionUploadRequired:false});
  }
}

export async function getDesignDashboard(payload,{user,database=db}) {
  const id=text(payload.projectId);
  requireProject(user,id);
  return database.transaction(async tx=>{
    const project=await projectRow(tx,id);
    if (!project) throw failure('Project not found.',404);
    if (projectClosed(project.cells)) throw failure('The project is completed.',409);
    const state=await loadDrawingWork(tx,project.cells,user);
    await syncDocumentation(state);
    const drawings=(await projectChildren(tx,'drawing_register',id)).map(row=>row.cells);
    const files=state.files.map(row=>row.cells);
    const receivedDrawings=drawingReceiptMetadata_(drawings.filter(row=>active(row.classified)&&isDrawingReceived(row)),files);
    return {project:project.cells,rows:state.dashboard.map(row=>row.cells),
      tasks:drawingEligibleTaskViews_(state.tasks.map(row=>row.cells).filter(row=>!row.mergedIntoTaskId),receivedDrawings),
      floorZones:(await projectChildren(tx,'floor_zones',id)).map(row=>row.cells).filter(row=>active(row.active))
        .sort((a,b)=>Number(a.seq||0)-Number(b.seq||0)),sentFiles:files.filter(row=>label(row.direction)==='sent'),receivedDrawings};
  });
}

const globalTables=new Set(['projects','drawing_register','files','design_tasks','wih','wih_plans','workflow_delegations','line_of_work','people']);
async function all(tx,table) {
  if (!globalTables.has(table)) throw Error('Unsupported workspace table.');
  return (await tx.rows(`SELECT cells FROM enlighten_operational.${table} ORDER BY source_row_number NULLS LAST,record_id`)).map(row=>row.cells);
}

const visibleTask=(user,row)=>{const role=wihProjectRole(user,row.projectId);return role==='Admin'||role&&user.userId&&String(row.assigneeUserId)===String(user.userId);};
const projected=task=>({wihId:'',designTaskId:task.designTaskId,projectId:task.projectId,assigneeUserId:task.assigneeUserId||'',
  assigneeName:task.assigneeName||'',status:task.status||'Not Started',startAt:'',stopAt:'',totalMinutes:0,completionUploadRequired:task.completionUploadRequired});

async function work(tx,payload,user) {
  const projects=await all(tx,'projects');
  const projectIds=new Set(projects.map(row=>String(row.projectId)));
  const drawings=await all(tx,'drawing_register'),fast=String(payload.fastRead)==='true';
  const requested=text(payload.projectId);
  const repairIds=requested?[requested]:[...projectIds].sort();
  if (requested&&!internal(requested)) await checkProjectRead(tx,user,requested);
  const administrator=label(user.appAccess)!=='viewer';
  if (!fast&&administrator) {
    for (const id of repairIds) {
      if (!projectIds.has(id)||wihProjectRole(user,id)!=='Admin') continue;
      const project=await projectRow(tx,id);
      if (project&&!projectClosed(project.cells)&&drawings.some(row=>String(row.projectId)===id&&active(row.classified)&&isDrawingReceived(row))) {
        await repairStages(await loadDrawingWork(tx,project.cells,user),drawings.filter(row=>String(row.projectId)===id));
      }
    }
  }
  const [designTasks,files,rules,lines,people,stored,plans]=await Promise.all(['design_tasks','files','workflow_delegations','line_of_work',
    'people','wih','wih_plans'].map(table=>all(tx,table)));
  const art=new Set(projects.filter(row=>active(row.artCuration)).map(row=>String(row.projectId)));
  const excluded=new Set(designTasks.filter(row=>typeDecorative(row.taskType)&&!art.has(String(row.projectId))).map(row=>String(row.designTaskId)));
  const tasks=drawingEligibleTaskViews_(designTasks.filter(row=>!row.mergedIntoTaskId&&!excluded.has(String(row.designTaskId))&&
    !excluded.has(String(row.parentDesignTaskId))),drawingReceiptMetadata_(drawings,files)).map(wihDelegationResolver_(rules,lines,people));
  const taskMap=Object.fromEntries(tasks.map(task=>[String(task.designTaskId),task]));
  const receiving=new Map(drawings.filter(isDrawingReceived).map(row=>[JSON.stringify([String(row.projectId),String(row.drawingId)]),row]));
  const grouped=new Map();
  for (const drawing of drawings) {
    const id=String(drawing.projectId);
    if (!grouped.has(id)) grouped.set(id,[]);
    grouped.get(id).push(drawing);
  }
  const receiptCache=new Map();
  const receiptFor=task=>{
    const id=String(task.designTaskId),pid=String(task.projectId),source=task.latestSourceDrawingId||task.sourceDrawingId;
    if (!receiptCache.has(id)) receiptCache.set(id,source?receiving.get(JSON.stringify([pid,String(source)]))||null:
      receivedSourceForTask_(task,taskMap,grouped.get(pid)||[]));
    return receiptCache.get(id);
  };
  const known=new Set(stored.map(row=>String(row.designTaskId)));
  if (!fast&&administrator) {
    for (const task of tasks.filter(row=>repairIds.includes(String(row.projectId))&&!known.has(String(row.designTaskId))&&visibleTask(user,row)&&receiptFor(row))) {
      await tx.query('SELECT pg_advisory_xact_lock(hashtextextended($1,0))',['ensure-wih:'+task.designTaskId]);
      const prior=await tx.rows("SELECT cells FROM enlighten_operational.wih WHERE cells->>'designTaskId'=$1 LIMIT 1",[String(task.designTaskId)]);
      const row=prior[0]?.cells||{...projected(task),wihId:await nextEntityId(tx,'wih'),workDate:'',lastPauseAt:'',currentSessionMinutes:0,
        completionUploadRequired:String(task.completionUploadRequired)!=='false',completionFileId:task.completedFileId||'',notes:'',updatedAt:now()};
      if (!prior.length) await insertRecord(tx,'wih',row);
      stored.push(row);
      known.add(String(task.designTaskId));
    }
  }
  const workRows=[...stored,...tasks.filter(task=>!known.has(String(task.designTaskId))).map(projected)];
  const plansByTask=new Map(plans.map(plan=>[String(plan.designTaskId),plan]));
  const result=[];
  for (const row of workRows) {
    const id=String(row.designTaskId),pid=String(row.projectId),task=taskMap[id];
    if (!task||String(task.projectId)!==pid||!projectIds.has(pid)&&!internal(pid)) continue;
    const entry=task.assigneeUserId?{...row,assigneeUserId:task.assigneeUserId,assigneeName:task.assigneeName}:row;
    let limited=false;
    if (internal(pid)) {if (!user.userId||String(entry.assigneeUserId)!==String(user.userId)) continue;}
    else if (!visibleTask(user,entry)) {
      limited=String(payload.includeRevisionSources)==='true'&&label(user.appAccess)==='user'&&wihProjectRole(user,pid)&&entry.status==='Completed';
      if (!limited) continue;
    }
    if (payload.userId&&(limited||entry.assigneeUserId!==payload.userId)||payload.userName&&(limited||entry.assigneeName!==payload.userName)||
        requested&&pid!==requested||label(payload.includeCompleted)!=='true'&&label(row.status)==='completed') continue;
    if (limited) result.push({designTaskId:row.designTaskId,projectId:row.projectId,status:row.status,revisionSourceOnly:true,
      task:{taskType:task.taskType,floor:task.floor,area:task.area,workflowCoverage:task.workflowCoverage,dependencyDrawingType:task.dependencyDrawingType},receipt:null});
    else {
      const receipt=receiptFor(task),plan=plansByTask.get(id);
      result.push({...entry,task,receipt:receipt?{drawingId:receipt.drawingId,fileName:receipt.fileName||'',
        receivedDate:String(receipt.receivedSentDate||receipt.createdAt||'').slice(0,10)}:null,
        plan:plan&&(String(plan.sourceDrawingId)===String(receipt?.drawingId)||String(payload.homeDeadlines)==='true'&&String(plan.projectId)===pid&&plan.internalDueDate)?plan:null});
    }
  }
  if (String(payload.includeDiagnostics)!=='true') return result;
  const pending=drawings.filter(row=>wihProjectRole(user,row.projectId)&&isDrawingReceived(row)&&!active(row.classified));
  const visible=tasks.filter(row=>projectIds.has(String(row.projectId))&&visibleTask(user,row));
  const repairs=new Map();
  const add=(pid,item)=>{
    if (!repairs.has(pid)) repairs.set(pid,[]);
    repairs.get(pid).push(item);
  };
  if (fast&&administrator) {
    for (const row of drawings.filter(row=>projectIds.has(String(row.projectId))&&(!requested||String(row.projectId)===requested)&&
      wihProjectRole(user,row.projectId)&&active(row.classified)&&isDrawingReceived(row)&&!active(row.historicalImport)&&
      (row.driveFileId||row.fileId)&&row.floor&&row.area)) {
      add(String(row.projectId),[String(row.drawingId),String(row.floor),String(row.area),String(row.drawingType),String(row.updatedAt||'')]);
    }
  }
  if (fast) for (const task of visible.filter(task=>drawingBatchKind_(task)&&['Ready','Not Started'].includes(task.status)&&
    (!requested||String(task.projectId)===requested)&&wihProjectRole(user,task.projectId)==='Admin')) {
    add(String(task.projectId),['open-drawing-task',String(task.designTaskId),String(task.updatedAt||'')]);
  }
  const repairCandidates=[...repairs].map(([projectId,items])=>({projectId,revision:JSON.stringify(items.sort((a,b)=>JSON.stringify(a).localeCompare(JSON.stringify(b))))}));
  return {rows:result,diagnostics:{pendingClassification:pending.length,visibleDesignTasks:visible.length,linkedWorkTasks:result.length,
    missingReceivedLink:visible.filter(task=>!receiptFor(task)).length,repairCandidates}};
}

export async function getWIH(payload,{user,database=db}) {
  requireStudio(user);
  const readOnly=String(payload.fastRead)==='true'||label(user.appAccess)==='viewer';
  return database.transaction(tx=>work(tx,payload,user),{readOnly});
}
