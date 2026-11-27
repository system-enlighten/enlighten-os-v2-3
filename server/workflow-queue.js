import {db} from './supabase-db.js';
import {requireProject} from './permissions.js';
import {createTask,loadDrawingWork} from './drawing-classification.js';
import {drawingReceiptMetadata_,drawingStageEligible_,taskBatchCoverage_} from './drawing-rules.js';
import {normalizeType} from './received-edit.js';
import {active,failure,projectChildren,projectRow,text} from './project-write-storage.js';

const lower=value=>text(value).toLowerCase();
const same=(a,b)=>lower(a)===lower(b);

export async function queueWorkflowTask(p,{user,database=db}) {
  const projectId=text(p.projectId),lineId=text(p.lineWorkId);
  if (!projectId||!lineId) throw failure('Choose a project and workflow row.');
  requireProject(user,projectId,{write:true,admin:true});
  return database.transaction(async tx=>{
    const project=await projectRow(tx,projectId);
    if (!project) throw failure('Project not found.',404);
    if (active(project.cells.completed)||same(project.cells.projectStatus,'Completed')) throw failure('The project is completed.',409);
    const state=await loadDrawingWork(tx,project.cells,user);
    const row=state.lines.find(item=>String(item.lineWorkId)===lineId&&['1','2'].includes(String(item.workflowVersion)));
    if (!row) throw failure('Save the workflow template before queueing this task.',409);
    const type=normalizeType(row.triggerDrawingType),version=String(row.workflowVersion);
    const drawings=drawingReceiptMetadata_((await projectChildren(tx,'drawing_register',projectId)).map(item=>item.cells),
      state.files.map(item=>item.cells)).filter(item=>active(item.classified)&&!active(item.trashed));
    const eligible=area=>drawings.filter(item=>same(item.floor,area.floor)&&(version==='2'&&!item.area||same(item.area,area.area))&&
      drawingStageEligible_(item,type,row.triggerTaskType,area.area));
    if (version==='1') {
      const projectScope=row.scope==='Project',floor=projectScope?'':text(p.floor),area=projectScope?'':text(p.area);
      if (!projectScope&&(!floor||!area)) throw failure('Select a floor and area.');
      if (!projectScope&&type!=='MANUAL'&&!eligible({floor,area}).length) throw failure('Classify the required drawing for this area first.',409);
      return createTask(state,{floor,area,taskType:row.triggerTaskType,dependencyDrawingType:type,assigneeName:row.responsible||'',workflowScope:row.scope});
    }
    if (p.milestoneConfirmed!==true) throw failure('Confirm the starting milestone / approvals before activating this stage.');
    const coverage=new Map();
    for (const item of Array.isArray(p.coverage)?p.coverage:[]) {
      const floor=text(item?.floor),area=text(item?.area);
      if (!floor||!area) throw failure('Select a floor and area for each coverage row.');
      coverage.set(JSON.stringify([floor,area]),{floor,area});
    }
    const areas=[...coverage.values()];
    if (!areas.length) throw failure('Select at least one floor / area.');
    if (same(row.tasks,'Documentation')) {
      const done=state.tasks.map(item=>item.cells).filter(task=>!task.parentDesignTaskId&&!task.mergedIntoTaskId&&
        /^(completed|done)$/i.test(task.status)&&/lighting layout|wiring drawings|rcp\/flr\/cir/i.test(String(task.parentTask||task.taskType||''))).flatMap(taskBatchCoverage_);
      const dashboard=state.dashboard.map(item=>item.cells).filter(item=>/^(completed|done)$/i.test(item.lightStatus));
      if (areas.some(area=>![...done,...dashboard].some(item=>same(area.floor,item.floor)&&same(area.area,item.area)))) {
        throw failure('Complete Wiring Drawings for these floors and zones first.',409);
      }
    }
    const zones=(await projectChildren(tx,'floor_zones',projectId)).map(item=>item.cells).filter(item=>active(item.active));
    if (areas.some(area=>!zones.some(zone=>same(area.floor,zone.floor)&&same(area.area,zone.area)))) {
      throw failure('Use floors and areas saved in Floor & Zone.');
    }
    const receipts=[];
    if (type!=='MANUAL') for (const area of areas) {
      const matches=eligible(area);
      if (!matches.length) throw failure('Classify the required '+type+' drawing for '+area.floor+' / '+area.area+' before activation.',409);
      receipts.push(String(matches.at(-1).drawingId));
    }
    const key=JSON.stringify([row.triggerTaskType,type,areas.map(area=>area.floor+'|'+area.area).sort(),receipts.sort(),String(p.activationReference||'')]);
    const templates=state.lines.filter(item=>String(item.workflowVersion)==='2'&&item.triggerTaskType===row.triggerTaskType&&normalizeType(item.triggerDrawingType)===type);
    return createTask(state,{taskType:row.triggerTaskType,dependencyDrawingType:type,workflowVersion:'2',workflowScope:'Stage',
      workflowCoverage:JSON.stringify(areas),workflowActivationKey:key,workflowTemplateSnapshot:JSON.stringify(templates),
      lineWorkId:lineId,startingMilestone:row.startingMilestone,completionUploadRequired:false,assigneeName:row.responsible||''});
  });
}
