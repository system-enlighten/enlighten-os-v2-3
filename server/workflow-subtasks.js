import {createTask,loadDrawingWork} from './drawing-classification.js';
import {drawingEligibleTaskViews_,drawingReceiptMetadata_,taskBatchCoverage_} from './drawing-rules.js';
import {active,failure,projectChildren,text,writeActivity} from './project-write-storage.js';

const lower=value=>text(value).toLowerCase();

export async function openTaskSubtasks(tx,project,parent,user) {
  if (parent.parentDesignTaskId||parent.revisionOf) return;
  const state=await loadDrawingWork(tx,project,user);
  const stage=String(parent.workflowVersion)==='2';
  const templates=workflowTemplates(parent,state.lines);
  let coverage=[];
  if (stage) {
    const drawings=(await projectChildren(tx,'drawing_register',project.projectId)).map(row=>row.cells);
    const [eligible]=drawingEligibleTaskViews_([parent],drawingReceiptMetadata_(drawings,state.files.map(row=>row.cells)));
    if (!eligible) throw failure('Upload the required CAD drawing for an eligible area first.',409);
    coverage=taskBatchCoverage_(eligible);
    if (!coverage.length) throw failure('Stage coverage is missing. Activate the stage from Line of Work.',409);
  }
  const children=state.tasks.map(row=>row.cells).filter(row=>String(row.parentDesignTaskId)===String(parent.designTaskId));
  const created=[],groups=new Map();
  let previous=[];
  for (const row of templates) {
    const group=lower(row.milestone)+'|'+lower(row.tasks),meeting=stage&&row.taskCategory==='Meeting';
    const targets=stage?(meeting?[{floor:'',area:''}]:coverage):[{floor:parent.floor||'',area:parent.area||''}];
    const prior=stage?previous:groups.get(group)||[];
    const phase=[];
    for (const {floor,area} of targets) {
      const known=children.find(task=>String(task.lineWorkId)===String(row.lineWorkId)&&
        (!stage||String(task.floor||'')===floor&&String(task.area||'')===area));
      if (known) {
        phase.push(known);
        continue;
      }
      const assignee=text(row.responsible||parent.assigneeName);
      const person=state.people.find(item=>lower(item.name)===lower(assignee)&&(!stage||active(item.active)));
      const status=prior.length&&(stage||prior.some(task=>task.status!=='Completed'))?'Blocked':'Ready';
      const child=await createTask(state,{floor,area,taskType:row.subtask,dependencyDrawingType:parent.dependencyDrawingType,
        sourceDrawingId:stage?'':parent.sourceDrawingId,parentDesignTaskId:parent.designTaskId,lineWorkId:row.lineWorkId,
        milestone:row.milestone,parentTask:row.tasks,subtaskOrder:row.subtaskOrder,workflowVersion:stage?'2':'',
        workflowScope:stage?(meeting?'Project':'Floor / Area'):row.scope||'Area',taskCategory:stage?(meeting?'Meeting':'Design'):'',
        meetingMode:row.meetingMode,startingMilestone:row.startingMilestone,predecessorTaskId:prior[0]?.designTaskId||'',
        predecessorTaskIds:stage?JSON.stringify(prior.map(task=>task.designTaskId)):'',status,
        assigneeName:assignee,assigneeUserId:person?.userId||'',estimatedHours:row.hours,
        completionUploadRequired:stage?!meeting&&lower(row.completionUploadRequired)!=='false':active(row.completionUploadRequired),optional:active(row.optional)});
      phase.push(child);
      created.push(child.designTaskId);
    }
    if (stage) previous=phase;
    else groups.set(group,phase);
  }
  if (created.length&&!stage) await writeActivity(tx,user,'OPEN_WORKFLOW','DesignTask',parent.designTaskId,project.projectId,null,{subtasks:created});
}

export function workflowTemplates(parent,lines) {
  const stage=String(parent.workflowVersion)==='2';
  let snapshot;
  try {snapshot=JSON.parse(parent.workflowTemplateSnapshot||'[]');} catch {snapshot=[];}
  return stage&&Array.isArray(snapshot)&&snapshot.length?snapshot:lines.filter(row=>
    String(row.workflowVersion)===(stage?'2':'1')&&lower(row.triggerTaskType)===lower(parent.taskType)&&
    lower(row.triggerDrawingType)===lower(parent.dependencyDrawingType)&&
    (stage||row.subtask&&(row.scope==='Project'?!parent.floor&&!parent.area:Boolean(parent.area))))
    .sort((a,b)=>Number(a.seq||0)-Number(b.seq||0));
}
