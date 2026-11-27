import {active as bool_} from './project-write-storage.js';

import {normalizeType as normalizeDrawingType_} from './received-edit.js';

const workflowText_ = value => String(value ?? '').trim().toLowerCase();

const delegationKey_ = (task,subtask) => JSON.stringify([workflowText_(task),workflowText_(subtask)]);

export function wihDelegationResolver_(rules,workflow,staff) {
const lines=workflow.filter(row=>bool_(row.active));
const members=staff.filter(row=>bool_(row.active)&&row.userId);
 const active=new Map(members.map(m=>[String(m.userId),m]));
 const indexed=new Map(rules.map(r=>[JSON.stringify([String(r.projectId),delegationKey_(r.task,r.subtask)]),r]));
 const byId=new Map(lines.map(r=>[JSON.stringify([String(r.projectId),String(r.lineWorkId)]),r]));
 const pick=(pid,group,step,raw='')=>{
  const key=delegationKey_(group,step),override=indexed.get(JSON.stringify([pid,key]));
  const rule=override?.responsibleId?override:override||!String(raw).trim()?indexed.get(JSON.stringify(['*',key])):null;
  if(rule)return active.get(String(rule.responsibleId))||null;
  if(override||!raw)return null;
  const matches=members.filter(member=>workflowText_(member.name)===workflowText_(raw));
  return matches.length===1?matches[0]:null;
 };
 const aliases={
  'concept | 2d':['initial concept'],
  'false ceiling drawings':['typical section detail | draw','typical section detail / draw'],
  'lighting layout / wiring':['rcp/flr/cir | draw'],
  'control finalisation':['showcase wireless | wired options with budget']
 };
 return task=>{
  if(task.assigneeUserId||bool_(task.assignmentExplicit)||task.mergedIntoTaskId||/completed|^done$|progress|paused/i.test(String(task.status))||String(task.workflowActivationKey||'').startsWith('assistant:'))return task;
  const pid=String(task.projectId),title=workflowText_(task.taskType),parent=workflowText_(task.parentTask);
  const exact=lines.filter(r=>String(r.projectId)===pid&&workflowText_(r.subtask)===title&&(!parent||workflowText_(r.tasks)===parent));
  const linked=byId.get(JSON.stringify([pid,String(task.lineWorkId)]));
  const line=linked&&workflowText_(linked.subtask)===title?linked:exact.length===1?exact[0]:null;
  let person;
  if(line)person=pick(pid,line.tasks,line.subtask,line.responsible);
  else{
   const labels=new Set([title,...(aliases[title]||[])]);
   const candidates=rules.filter(r=>labels.has(workflowText_(r.subtask))&&[pid,'*'].includes(String(r.projectId)));
   const matched=new Map();
   for(const r of candidates){
    const owner=pick(pid,r.task,r.subtask);
    if(owner)matched.set(String(owner.userId),owner);
   }
   if(matched.size===1)person=[...matched.values()][0];
  }
  return person?{...task,assigneeUserId:person.userId,assigneeName:person.name}:task;
 };
}

export function receivedSourceForTask_(task,taskMap,drawings){
 const visited=new Set();let current=task;
 const received=drawings.filter(d=>String(d.projectId)===String(task.projectId)&&!bool_(d.trashed)&&String(d.direction||'Received').toLowerCase()==='received');
 while(current&&!visited.has(String(current.designTaskId))){
  visited.add(String(current.designTaskId));const wiringId=String(current.workflowActivationKey||'').match(/^documentation:([^:]+):/)?.[1];
  if(wiringId&&taskMap[wiringId]){current=taskMap[wiringId];continue;}
  const source=String(current.latestSourceDrawingId||current.sourceDrawingId||'');
  if(source)return received.find(d=>String(d.drawingId)===source)||null;
  const type=normalizeDrawingType_(current.dependencyDrawingType||'');let coverage=[];
  try{const parsed=JSON.parse(current.workflowCoverage||'[]');if(Array.isArray(parsed))coverage=parsed;}catch(_){}
  if(current.floor&&current.area)coverage.push({floor:current.floor,area:current.area});
  if(type&&coverage.length){
   const matches=received.filter(d=>!bool_(d.historicalImport)&&(d.driveFileId||d.fileId)&&bool_(d.classified)&&normalizeDrawingType_(d.drawingType)===type&&coverage.some(c=>workflowText_(d.floor)===workflowText_(c.floor)&&workflowText_(d.area)===workflowText_(c.area)));
   if(matches.length)return matches.sort((a,b)=>String(b.receivedSentDate||b.createdAt||'').localeCompare(String(a.receivedSentDate||a.createdAt||''))||String(a.drawingId).localeCompare(String(b.drawingId)))[0];
  }
  current=taskMap[String(current.parentDesignTaskId||'')];
 }
 return null;
}

export function wihPlanDates_(receivedDate,tatDays){const date=String(receivedDate||'').slice(0,10),days=Number(tatDays);if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||isNaN(Date.parse(date))||new Date(date).toISOString().slice(0,10)!==date)throw Error('Set the received drawing date before entering TAT.');if(!Number.isInteger(days)||days<1||days>365)throw Error('TAT must be 1 to 365 calendar days.');const add=n=>new Date(Date.parse(date+'T00:00:00Z')+n*86400000).toISOString().slice(0,10);return {receivedDate:date,tatDays:days,internalDueDate:add(days),clientDueDate:add(days+1)};}

