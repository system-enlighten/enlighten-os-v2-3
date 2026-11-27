import {active as bool_,now as nowIso_} from './project-write-storage.js';

import {normalizeType as normalizeDrawingType_} from './received-edit.js';

const workflowText_ = value => String(value ?? '').trim().toLowerCase();

const DRAWING_RULES = Object.freeze({
  'LAYOUT': {
    receiptColumn: 'layoutReceived',
    tasks: [
      { key: 'concept', taskType: 'Concept | 2D', taskIdCol: 'conceptTaskId', designNoCol: 'conceptDesignNo', statusCol: 'conceptStatus' },
      { key: 'prelimBudget', taskType: 'Preliminary Budgeting', taskIdCol: 'prelimBudgetTaskId', designNoCol: 'prelimBudgetDesignNo', statusCol: 'prelimBudgetStatus' },
      { key: 'decorativeSelection', taskType: 'Decorative Selection', taskIdCol: 'decorativeSelectionTaskId', designNoCol: 'decorativeSelectionDesignNo', statusCol: 'decorativeSelectionStatus' }
    ]
  },
  'WE': {
    receiptColumn: 'weReceived',
    tasks: [
      { key: 'wallElectrical', taskType: 'Wall Electrical Drawings', taskIdCol: 'wallElectricalTaskId', designNoCol: 'wallElectricalDesignNo', statusCol: 'wallElectricalStatus' }
    ]
  },
  'FC': {
    receiptColumn: 'fcReceived',
    tasks: [
      { key: 'falseCeiling', taskType: 'False Ceiling Drawings', taskIdCol: 'falseCeilingTaskId', designNoCol: 'falseCeilingDesignNo', statusCol: 'falseCeilingStatus' }
    ]
  },
  'DETAIL': {
    receiptColumn: 'detailReceived',
    tasks: [
      { key: 'bathroomElevation', taskType: 'Bathroom Elevation', taskIdCol: 'bathroomElevationTaskId', designNoCol: 'bathroomElevationDesignNo', statusCol: 'bathroomElevationStatus' }
    ]
  },
  '3D': {
    receiptColumn: '3dReceived',
    tasks: [
      { key: 'renders3d', taskType: '3D Renders', taskIdCol: 'renders3dTaskId', designNoCol: 'renders3dDesignNo', statusCol: 'renders3dStatus' }
    ]
  }
});



function drawingBatchKind_(task){
 if(task.parentDesignTaskId||String(task.workflowActivationKey||'').startsWith('assistant:'))return '';
 const title=workflowText_(task.taskType);
 if(/^concept\s*\|\s*(2d|freeze products)$/.test(title)||title==='initial concept'||title==='concept')return 'concept';
 if(/^control finali[sz]ation$|^finali[sz]e controls$/.test(title))return 'controls';
 if(/^preliminary budgeting$|^prelim(?:inary)? budget$/.test(title))return 'budget';
 if(/^decorative(?: lighting)? selection$|^finali[sz]e decorative lighting$/.test(title))return 'decorative';
 return '';
}

function taskBatchCoverage_(task){
 let areas=[];
 try{areas=JSON.parse(task.workflowCoverage||'[]');}catch{}
 if(!Array.isArray(areas))areas=[];
 if(task.floor&&task.area)areas.push({floor:task.floor,area:task.area,drawingIds:[task.sourceDrawingId,task.latestSourceDrawingId].filter(Boolean)});
 const combined=new Map();
 for(const area of areas){
  if(!area?.floor||!area.area)continue;
  const key=JSON.stringify([workflowText_(area.floor),workflowText_(area.area)]);
  const existing=combined.get(key);
  combined.set(key,{floor:area.floor,area:area.area,drawingIds:[...new Set([...(existing?.drawingIds||[]),...(Array.isArray(area.drawingIds)?area.drawingIds:[])].map(String))]});
 }
 return [...combined.values()];
}

function batchCoveragePatch_(task,coverage){
 return {floor:'',area:'',workflowCoverage:JSON.stringify(taskBatchCoverage_({workflowCoverage:JSON.stringify([...taskBatchCoverage_(task),...coverage])})),updatedAt:nowIso_()};
}

function drawingReceiptMetadata_(drawings,files){
 const byDrive=new Map();
 files.filter(f=>!bool_(f.trashed)&&f.fileName).forEach(f=>byDrive.set(String(f.driveFileId||f.fileId),f));
 return drawings.map(d=>{const f=byDrive.get(String(d.driveFileId||d.fileId))||{};return {...d,fileName:d.fileName||f.fileName||'',mimeType:d.mimeType||f.mimeType||''};});
}
function bathroomDrawingArea_(area){return /\b(bathrooms?|bath\s*rooms?|toilets?|powder(?:\s*rooms?)?|pdr|wc)\b/i.test(String(area||''));}
function drawingStageEligible_(d,type,task,area){
 const actual=normalizeDrawingType_(d.drawingType), furniture=/furniture|joinery/i.test(task),bath=/bathroom|bath elevation/i.test(task);
 if(bath&&!bathroomDrawingArea_(area||d.area))return false;
 if(actual!==type&&!(furniture&&['DETAIL','FURNITURE'].includes(actual))&&!(bath&&actual==='FURNITURE'&&type==='DETAIL'))return false;
 if(['FC','DETAIL','FURNITURE'].includes(actual))return /\.(dwg|dxf)$/i.test(d.fileName||'')||/dwg|dxf/i.test(d.mimeType||'');
 return true;
}
function drawingEligibleTaskViews_(tasks,drawings){
 const receipts=drawings.filter(d=>bool_(d.classified)&&!bool_(d.trashed)&&String(d.direction||'Received').toLowerCase()==='received');
 const roots=new Map(tasks.map(t=>[String(t.designTaskId),t]));
 return tasks.flatMap(t=>{
  const root=roots.get(String(t.parentDesignTaskId))||t;
  const type=normalizeDrawingType_(root.dependencyDrawingType),task=root.taskType;
  if(!['FC','DETAIL','FURNITURE'].includes(type)&&!/bathroom|bath elevation|furniture|joinery/i.test(task))return [t];
  if(/completed|^done$|progress|paused/i.test(String(t.status))||t.startedAt||t.completedAt)return [t];
  const coverage=taskBatchCoverage_(t);
  const areas=coverage.filter(a=>receipts.some(d=>String(d.projectId)===String(t.projectId)&&workflowText_(d.floor)===workflowText_(a.floor)&&workflowText_(d.area)===workflowText_(a.area)&&drawingStageEligible_(d,type,task,a.area)));
  if(!coverage.length)return [t];
  if(!areas.length)return [];
  return [{...t,workflowCoverage:JSON.stringify(areas)}];
 });
}

export {DRAWING_RULES,drawingBatchKind_,taskBatchCoverage_,batchCoveragePatch_,drawingReceiptMetadata_,drawingStageEligible_,drawingEligibleTaskViews_};

