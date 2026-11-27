import {db} from './supabase-db.js';
import {requireProject,wihProjectRole} from './permissions.js';
import {normalizeType} from './received-edit.js';
import {DRAWING_RULES,drawingBatchKind_,taskBatchCoverage_,batchCoveragePatch_,drawingReceiptMetadata_,drawingStageEligible_} from './drawing-rules.js';
import {wihDelegationResolver_} from './wih-projections.js';
import {active,actor,failure,insertRecord,insertReturning,nextEntityId,now,projectChildren,projectRow,text,updateRecord,writeActivity} from './project-write-storage.js';

const label=value=>text(value).toLowerCase();
const sameArea=(a,b)=>label(a.floor)===label(b.floor)&&label(a.area)===label(b.area);
const decorative=type=>label(type)==='decorative selection';
const receipts=['layoutReceived','weReceived','fcReceived','detailReceived','3dReceived'];
const stages=['concept','prelimBudget','renders3d','decorativeSelection','wallElectrical','falseCeiling','light','slabElectrical',
  'facadeElevation','bathroomElevation','documentationBoq','furniture'];

function drawingRule(type,project,master,lines) {
  const fixed=DRAWING_RULES[type];
  const matches=master.filter(row=>normalizeType(row.drawingType)===type);
  const defaults=matches.length?{receiptColumn:fixed?.receiptColumn||'',tasks:matches.filter(row=>text(row.taskTitle))
    .sort((a,b)=>Number(a.taskSequence||999)-Number(b.taskSequence||999)).map(row=>{
      const prior=fixed?.tasks.find(task=>label(task.taskType)===label(row.taskTitle));
      return {...prior,taskType:text(row.taskTitle),assignee:text(row.defaultAssignee)};
    })}:fixed;
  if (lines.some(row=>String(row.workflowVersion)==='2'&&normalizeType(row.triggerDrawingType)===type)) {
    return {receiptColumn:defaults?.receiptColumn||'',tasks:[]};
  }
  const custom=lines.filter(row=>String(row.workflowVersion)==='1'&&row.scope!=='Project'&&row.subtask&&row.triggerTaskType&&normalizeType(row.triggerDrawingType)===type);
  if (!defaults&&!custom.length) return null;
  const tasks=(defaults?.tasks||[]).map(row=>({...row}));
  for (const row of custom) if (!tasks.some(task=>label(task.taskType)===label(row.triggerTaskType))) {
    tasks.push({taskType:row.triggerTaskType,assignee:row.responsible||''});
  }
  const extra={'facade elevation drawings':'facadeElevation','furniture / joinery':'furniture',
    'lighting layout / wiring':'light','technical table / documentation':'documentationBoq'};
  for (const task of tasks) {
    const name=extra[label(task.taskType)];
    if (name&&!task.taskIdCol) Object.assign(task,{taskIdCol:name+'TaskId',designNoCol:name+'DesignNo',statusCol:name+'Status'});
  }
  return {receiptColumn:defaults?.receiptColumn||'',tasks:tasks.filter(task=>active(project.artCuration)||!decorative(task.taskType))};
}

async function designNo(tx,project,floor,type) {
  const prefix=[String(project.projectNo||project.projectId||'PRJ').replace(/^PRJ-/,''),floor||'NA',type,''].join('/');
  const key=JSON.stringify(['design',project.projectId,floor||'',type]);
  const [{value}]=await tx.rows(`INSERT INTO enlighten_operational.project_entity_sequences AS counters (entity,value)
    SELECT $1,coalesce(max(substring(cells->>'designNo' from '/([0-9]+)$')::bigint),0)+1
    FROM enlighten_operational.design_tasks WHERE cells->>'projectId'=$2 AND left(cells->>'designNo',length($3))=$3
    ON CONFLICT (entity) DO UPDATE SET value=greatest(counters.value+1,excluded.value) RETURNING value`,
  [key,project.projectId,prefix]);
  return prefix+value;
}

export async function createTask(state,input) {
  const {tx,project,tasks,wih,plans,lines,people,resolve,user}=state;
  let p=input;
  const kind=drawingBatchKind_(p);
  if (!p.parentDesignTaskId&&kind&&p.sourceDrawingId&&p.floor&&p.area) {
    const matching=tasks.filter(row=>!row.cells.mergedIntoTaskId&&drawingBatchKind_(row.cells)===kind);
    const source=String(p.sourceDrawingId);
    const known=matching.find(row=>taskBatchCoverage_(row.cells).some(area=>area.drawingIds.includes(source)));
    if (known) return known.cells;
    const batch=matching.find(({cells})=>{
      const timer=wih.find(row=>String(row.cells.designTaskId)===String(cells.designTaskId))?.cells;
      return String(cells.workflowActivationKey||'').startsWith('drawing-batch:')&&cells.status==='Not Started'&&
        timer?.status==='Not Started'&&!timer.startAt&&!timer.stopAt&&!Number(timer.totalMinutes)&&!plans.has(String(cells.designTaskId));
    });
    const coverage=[{floor:p.floor,area:p.area,drawingIds:[source]}];
    if (batch) {
      const patch=batchCoveragePatch_(batch.cells,coverage);
      await updateRecord(tx,'design_tasks',batch.record_id,patch);
      Object.assign(batch.cells,patch);
      return batch.cells;
    }
    p={...p,floor:'',area:'',workflowScope:'Stage',workflowCoverage:JSON.stringify(coverage),workflowActivationKey:'drawing-batch:'+kind+':'+source};
  }
  const prior=!p.parentDesignTaskId&&tasks.find(({cells})=>!cells.parentDesignTaskId&&String(cells.workflowActivationKey||'')===String(p.workflowActivationKey||'')&&
    sameArea(cells,p)&&label(cells.taskType)===label(p.taskType)&&normalizeType(cells.dependencyDrawingType)===normalizeType(p.dependencyDrawingType));
  if (prior) {
    if (p.sourceDrawingId&&String(prior.cells.latestSourceDrawingId||prior.cells.sourceDrawingId)!==String(p.sourceDrawingId)) {
      const patch={latestSourceDrawingId:p.sourceDrawingId,drawingReviewRequired:true,updatedAt:now()};
      await updateRecord(tx,'design_tasks',prior.record_id,patch);
      Object.assign(prior.cells,patch);
    }
    return prior.cells;
  }
  const version=String(p.workflowVersion||'');
  const template=!p.parentDesignTaskId&&lines.find(row=>String(row.workflowVersion)===(version==='2'?'2':'1')&&label(row.triggerTaskType)===label(p.taskType)&&
    normalizeType(row.triggerDrawingType)===normalizeType(p.dependencyDrawingType)&&
    (version==='2'||Boolean(row.subtask)&&(row.scope==='Project'?!p.floor&&!p.area:Boolean(p.area))));
  if (template) {
    const who=text(template.responsible||p.assigneeName);
    p={...p,assigneeName:who,assigneeUserId:people.find(person=>label(person.name)===label(who))?.userId||'',
      estimatedHours:template.hours||'',milestone:template.milestone,parentTask:template.tasks};
  }
  const id=await nextEntityId(tx,'design_tasks'),at=now(),name=actor(user);
  const task=resolve({designTaskId:id,projectId:project.projectId,floor:p.floor||'',area:p.area||'',taskType:p.taskType||'',
    dependencyDrawingType:p.dependencyDrawingType||'',designNo:await designNo(tx,project,p.floor,p.dependencyDrawingType||''),
    assigneeUserId:p.assigneeUserId||'',assigneeName:p.assigneeName||'',status:p.status||'Ready',
    latestSourceDrawingId:p.sourceDrawingId||'',drawingReviewRequired:false,lineWorkId:p.lineWorkId||'',parentDesignTaskId:p.parentDesignTaskId||'',
    milestone:p.milestone||'',parentTask:p.parentTask||'',subtaskOrder:p.subtaskOrder||'',predecessorTaskId:p.predecessorTaskId||'',
    workflowScope:p.workflowScope||'Area',workflowVersion:version,workflowCoverage:p.workflowCoverage||'',
    workflowActivationKey:p.workflowActivationKey||'',workflowTemplateSnapshot:p.workflowTemplateSnapshot||'',predecessorTaskIds:p.predecessorTaskIds||'',taskCategory:p.taskCategory||'',
    meetingMode:p.meetingMode||'',startingMilestone:p.startingMilestone||'',meetingChannel:'',meetingLink:'',
    completionUploadRequired:p.completionUploadRequired!==false,optional:Boolean(p.optional),priority:'Normal',plannedStartDate:'',
    plannedCompletionDate:'',startedAt:'',pausedAt:'',completedAt:'',estimatedHours:p.estimatedHours||'',actualHours:0,
    sourceDrawingId:p.sourceDrawingId||'',completedFileId:'',sentFileId:'',remarks:p.narration||'',revisionOf:p.revisionOf||'',
    createdAt:at,createdBy:name,updatedAt:at,updatedBy:name});
  tasks.push(await insertReturning(tx,'design_tasks',task));
  wih.push(await insertReturning(tx,'wih',{wihId:await nextEntityId(tx,'wih'),designTaskId:id,projectId:project.projectId,
    assigneeUserId:task.assigneeUserId,assigneeName:task.assigneeName,status:p.status==='Blocked'?'Blocked':'Not Started',
    workDate:'',startAt:'',lastPauseAt:'',stopAt:'',currentSessionMinutes:0,totalMinutes:0,completionUploadRequired:task.completionUploadRequired,
    completionFileId:'',notes:'',updatedAt:at}));
  return task;
}

export async function repairStages(state,drawings) {
  const {tx,project,user,lines,tasks,files}=state;
  const projectId=project.projectId;
  if (wihProjectRole(user,projectId)!=='Admin') return;
  const scoped=drawingReceiptMetadata_(drawings,files.map(row=>row.cells)).filter(row=>!active(row.trashed)&&!active(row.historicalImport)&&active(row.classified)&&
    (row.driveFileId||row.fileId)&&label(row.direction||'Received')==='received'&&row.floor&&row.area);
  const visited=new Set();
  for (const line of lines.filter(row=>String(row.workflowVersion)==='2')) {
    const type=normalizeType(line.triggerDrawingType),title=String(line.triggerTaskType||'');
    const control=type==='MANUAL'&&/control.*final|final.*control|^concept$/i.test(title);
    if (type==='MANUAL'&&!control||decorative(title)&&!active(project.artCuration)) continue;
    const key=label(title)+'|'+type;
    if (visited.has(key)) continue;
    visited.add(key);
    const linked=scoped.filter(row=>drawingStageEligible_(row,control?'LAYOUT':type,title));
    if (!linked.length) continue;
    const roots=tasks.filter(({cells})=>!cells.parentDesignTaskId&&label(cells.taskType)===label(title));
    const covered=roots.flatMap(row=>taskBatchCoverage_(row.cells));
    if (control&&/control.*final|final.*control/i.test(title)) {
      for (const root of roots.filter(row=>!row.cells.latestSourceDrawingId&&!row.cells.sourceDrawingId)) {
        const source=linked.find(row=>taskBatchCoverage_(root.cells).some(area=>sameArea(row,area)));
        if (!source) continue;
        const patch={sourceDrawingId:source.drawingId,latestSourceDrawingId:source.drawingId};
        await updateRecord(tx,'design_tasks',root.record_id,patch);
        Object.assign(root.cells,patch);
      }
    }
    const remaining=linked.filter(row=>!covered.some(area=>sameArea(row,area)));
    const coverage=[];
    for (const row of remaining) if (!coverage.some(area=>sameArea(area,row))) coverage.push({floor:row.floor,area:row.area});
    if (!coverage.length) continue;
    remaining.sort((a,b)=>String(b.receivedSentDate||b.createdAt||'').localeCompare(String(a.receivedSentDate||a.createdAt||'')));
    await createTask(state,{taskType:title,dependencyDrawingType:type,workflowVersion:'2',workflowScope:'Stage',workflowCoverage:JSON.stringify(coverage),
      workflowActivationKey:JSON.stringify(['receipt-repair',title,type,coverage]),sourceDrawingId:remaining[0].drawingId,
      lineWorkId:line.lineWorkId,startingMilestone:line.startingMilestone,completionUploadRequired:false,assigneeName:line.responsible||''});
  }
}

export function resolveLine(row,projectId,rules) {
  const match=rule=>label(rule.task)===label(row.tasks)&&label(rule.subtask)===label(row.subtask);
  const override=rules.find(rule=>rule.projectId===projectId&&match(rule));
  const fallback=rules.find(rule=>rule.projectId==='*'&&match(rule));
  const rule=override?.responsibleId?override:override||!text(row.responsible)?fallback:null;
  return {...row,responsible:rule?rule.responsibleName||'':text(row.responsible)};
}

export async function loadDrawingWork(tx,project,user) {
  const projectId=project.projectId;
  const [lineRows,taskRows,timers,planning,files,dashboard,master,delegation,staff]=await Promise.all([
    ...['line_of_work','design_tasks','wih','wih_plans','files','design_dashboard'].map(table=>projectChildren(tx,table,projectId)),
    tx.rows('SELECT cells FROM enlighten_operational.drawing_task_master ORDER BY source_row_number NULLS LAST,record_id'),
    tx.rows("SELECT cells FROM enlighten_operational.workflow_delegations WHERE cells->>'projectId' IN ($1,'*') ORDER BY source_row_number NULLS LAST,record_id",[projectId]),
    tx.rows('SELECT cells FROM enlighten_operational.people ORDER BY source_row_number NULLS LAST,record_id')
  ]);
  const rules=delegation.map(row=>row.cells),people=staff.map(row=>row.cells);
  const lines=lineRows.map(row=>row.cells).filter(row=>active(row.active)).map(row=>resolveLine(row,projectId,rules))
    .sort((a,b)=>Number(a.seq||a.sourceRow||0)-Number(b.seq||b.sourceRow||0));
  return {tx,project,user,lines,tasks:taskRows,wih:timers,plans:new Set(planning.map(row=>String(row.cells.designTaskId))),files,people,
    dashboard,master:master.map(row=>row.cells),rules,
    resolve:wihDelegationResolver_(rules,lineRows.map(row=>row.cells),people)};
}

export async function classifyDrawing(tx,project,payload,user,{combined=false,linkFile=true}={}) {
  if (active(project.completed)||label(project.projectStatus)==='completed') throw failure('The project is completed.',409);
  const projectId=project.projectId,id=text(payload.drawingId),type=normalizeType(payload.drawingType);
  const raw=Array.isArray(payload.coverage)?payload.coverage:(Array.isArray(payload.areas)?payload.areas:String(payload.area||'').split(','))
    .map(area=>({floor:payload.floor,area}));
  const coverage=[];
  for (const item of raw) {
    const area={floor:text(item?.floor),area:text(item?.area)};
    if (area.floor&&area.area&&!coverage.some(prior=>sameArea(prior,area))) coverage.push(area);
  }
  if (!id||!type||!coverage.length) throw failure('Select a drawing type and at least one floor / area during classification.');
  const registry=await projectChildren(tx,'drawing_register',projectId);
  const found=registry.find(row=>String(row.cells.drawingId)===id);
  if (!found) throw failure('Received drawing not found.',404);
  const base={...found.cells};
  if (active(base.trashed)||base.duplicateOf) throw failure('This drawing is in trash or was merged. Refresh Classify.',409);
  const state=await loadDrawingWork(tx,project,user);
  const {dashboard,files,lines,master}=state;
  const rule=drawingRule(type,project,master,lines);
  if (!rule) throw failure('Unsupported drawing type: '+payload.drawingType);
  const drawings=[],tasks=[],dashboardRows=[];
  for (const [index,area] of coverage.entries()) {
    const prior=!combined&&base.driveFileId?registry.find(({cells})=>String(cells.driveFileId)===String(base.driveFileId)&&sameArea(cells,area)&&
      String(cells.revisionNo)===String(base.revisionNo)&&normalizeType(cells.drawingType)===type&&active(cells.classified)):null;
    const reuse=index===0&&!active(base.classified),saved=prior||(reuse?found:null);
    const drawingId=saved?saved.cells.drawingId:await nextEntityId(tx,'drawing_register');
    const row={...base,...area,drawingId,drawingType:type,classified:true,status:'Ready'};
    if (saved) {await updateRecord(tx,'drawing_register',saved.record_id,row);saved.cells=row;}
    else registry.push(await insertReturning(tx,'drawing_register',row));
    drawings.push(row);
    let target=dashboard.find(({cells})=>String(cells.floor)===area.floor&&String(cells.area)===area.area);
    if (!target) {
      const initial={dashboardRowId:await nextEntityId(tx,'design_dashboard'),projectId,...area,
        ...Object.fromEntries(receipts.map(key=>[key,false])),...Object.fromEntries(stages.map(stage=>[stage+'Status','Not Started'])),
        updatedAt:now(),updatedBy:'system'};
      target=await insertReturning(tx,'design_dashboard',initial);
      dashboard.push(target);
    }
    const patch={updatedAt:now(),updatedBy:actor(user)};
    if (rule.receiptColumn) patch[rule.receiptColumn]=true;
    const [receipt]=drawingReceiptMetadata_([combined?{...row,fileName:payload.fileName,mimeType:payload.mimeType}:row],files.map(item=>item.cells));
    for (const dependency of rule.tasks) {
      if (!drawingStageEligible_(receipt,type,dependency.taskType,area.area)) continue;
      const task=await createTask(state,{...area,taskType:dependency.taskType,dependencyDrawingType:type,sourceDrawingId:drawingId,
        assigneeName:combined?payload.assigneeName||dependency.assignee||'':dependency.assignee||'',assigneeUserId:combined?payload.assigneeUserId||'':''});
      if (dependency.taskIdCol) Object.assign(patch,{[dependency.taskIdCol]:task.designTaskId,
        [dependency.designNoCol]:task.designNo,[dependency.statusCol]:task.status});
      tasks.push(task);
    }
    await updateRecord(tx,'design_dashboard',target.record_id,patch);
    dashboardRows.push({...target.cells,...patch});
    if (linkFile&&!saved&&base.driveFileId) files.push(await insertReturning(tx,'files',{fileId:await nextEntityId(tx,'files'),projectId,
      linkedEntityType:'Drawing',linkedEntityId:drawingId,folderCategory:'Received',fileName:combined?payload.fileName||'':'',
      mimeType:combined?payload.mimeType||'':'',driveFileId:base.driveFileId,
      driveUrl:base.driveUrl||'',drawingType:type,...area,revisionNo:base.revisionNo||'R0',direction:'Received',uploadedAt:now(),uploadedBy:actor(user)}));
  }
  if (combined) {
    for (const [index,row] of drawings.entries()) await writeActivity(tx,user,'RECEIVE_CLASSIFY','Drawing',row.drawingId,projectId,null,
      {drawing:row,dashboardPatch:dashboardRows[index]});
  } else {
    await writeActivity(tx,user,'CLASSIFY','Drawing',id,projectId,base,{coverage,drawingType:type});
    await repairStages(state,drawings);
  }
  return {drawings,tasks,dashboardRows};
}

export async function classifyReceivedDrawing(payload,{user,database=db}) {
  const id=text(payload.projectId);
  requireProject(user,id,{write:true});
  return database.transaction(async tx=>{
    const project=await projectRow(tx,id);
    if (!project) throw failure('Project not found.',404);
    const {drawings,tasks}=await classifyDrawing(tx,project.cells,payload,user);
    return {drawings,tasks};
  });
}

export const hasIntakeDrawingRule=(state,type)=>Boolean(drawingRule(normalizeType(type),state.project,state.master,state.lines));
