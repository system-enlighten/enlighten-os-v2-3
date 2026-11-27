import {randomUUID} from 'node:crypto';
import {db} from './supabase-db.js';
import {checkProjectRead,requireAdmin,requireProject} from './permissions.js';
import {normalizeType} from './received-edit.js';
import {active,actor,failure,insertRecord,nextEntityId,now,projectChildren,projectRow,text,updateRecord} from './project-write-storage.js';

const key=(task,subtask)=>JSON.stringify([text(task).toLowerCase(),text(subtask).toLowerCase()]);
const onboarding=[['folder','Folder Setup'],['sheet','Sheet Setup'],['zoning','Zoning & Keypad Location'],
  ['technical','Technical Table Setup'],['zones','Zone Table with Area and Status']];
const orderRows=(a,b)=>Number(a.seq||a.sourceRow||0)-Number(b.seq||b.sourceRow||0);

export async function getProjectWorkflowTasks(payload,{user,database=db}) {
  const projectId=text(payload.projectId);
  if (!projectId) throw failure('Choose a project.');
  return database.transaction(async tx=>{
    await checkProjectRead(tx,user,projectId);
    const wih=await tx.rows("SELECT cells FROM enlighten_operational.wih WHERE cells->>'projectId'=$1 ORDER BY source_row_number NULLS LAST,record_id",[projectId]);
    const status=new Map();
    for (const {cells} of wih) if (!status.has(cells.designTaskId)) status.set(cells.designTaskId,cells.status);
    const tasks=await tx.rows(`SELECT cells FROM enlighten_operational.design_tasks
      WHERE cells->>'projectId'=$1 AND nullif(cells->>'parentDesignTaskId','') IS NOT NULL
      ORDER BY source_row_number NULLS LAST,record_id`,[projectId]);
    return tasks.map(({cells})=>({...cells,actualStatus:status.get(cells.designTaskId)||cells.status}));
  },{readOnly:true});
}

export async function updateWorkflowSchedule(payload,{user,database=db}) {
  const projectId=text(payload.projectId),id=text(payload.designTaskId);
  if (!projectId||!id) throw failure('Choose a project and subtask.');
  requireProject(user,projectId,{write:true,admin:true});
  const start=String(payload.plannedStartDate||''),end=String(payload.plannedCompletionDate||'');
  if (Boolean(start)!==Boolean(end)) throw failure('Enter both planned start and finish, or clear both.');
  if ([start,end].some(date=>date&&(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!Number.isFinite(Date.parse(date))||
      new Date(date).toISOString().slice(0,10)!==date))||end<start) throw failure('Enter valid start and finish dates with finish on or after start.');
  return database.transaction(async tx=>{
    if (!await projectRow(tx,projectId)) throw failure('Project not found.',404);
    const rows=await tx.rows(`SELECT record_id,cells FROM enlighten_operational.design_tasks
      WHERE cells->>'designTaskId'=$1 AND cells->>'projectId'=$2 LIMIT 2 FOR UPDATE`,[id,projectId]);
    const found=rows[0];
    if (rows.length!==1||!found.cells.parentDesignTaskId) throw failure('Select a subtask in this project.',404);
    let meetingChannel='',meetingLink='';
    if (found.cells.taskCategory==='Meeting') {
      meetingChannel=String(payload.meetingChannel||'In person');
      if (!['In person','Phone','Zoom'].includes(meetingChannel)) throw failure('Choose a valid meeting channel.');
      if (found.cells.meetingMode!=='Phone / Zoom allowed'&&meetingChannel!=='In person') throw failure('This PDF meeting is in person.');
      meetingLink=text(payload.meetingLink);
      if (meetingLink&&!/^https:\/\/[^\s]+$/i.test(meetingLink)) throw failure('Meeting link must be an HTTPS URL.');
    }
    const patch={plannedStartDate:start,plannedCompletionDate:end,meetingChannel,meetingLink,updatedAt:now(),updatedBy:actor(user)};
    await updateRecord(tx,'design_tasks',found.record_id,patch);
    return {...found.cells,...patch};
  });
}

export async function applyDelegation(tx,projectId,rows,user) {
  if (!Array.isArray(rows)||rows.length>200) throw failure('Provide up to 200 delegation rows.');
  await tx.query('SELECT pg_advisory_xact_lock(hashtextextended($1,0))',['workflow-delegation:'+projectId]);
  const people=(await tx.rows('SELECT cells FROM enlighten_operational.people')).map(row=>row.cells);
  const changes=new Set();
  for (const input of rows) {
    const task=text(input?.task).slice(0,200),subtask=text(input?.subtask).slice(0,300);
    if (!task||!subtask) throw failure('Task and subtask are required.');
    const person=input.responsibleId?people.find(row=>String(row.userId)===String(input.responsibleId)&&active(row.active)):null;
    if (input.responsibleId&&!person) throw failure('Choose an active team member.');
    changes.add(key(task,subtask));
    await tx.query(`DELETE FROM enlighten_operational.workflow_delegations
      WHERE cells->>'projectId'=$1 AND lower(btrim(cells->>'task'))=lower($2) AND lower(btrim(cells->>'subtask'))=lower($3)`,[projectId,task,subtask]);
    if (input.inherit!==true) await insertRecord(tx,'workflow_delegations',{delegationId:randomUUID(),projectId,task,subtask,
      responsibleId:String(person?.userId||''),responsibleName:String(person?.name||''),updatedAt:now(),updatedBy:actor(user)});
  }
  if (projectId==='*'||!changes.size) return;
  if (changes.has(key('Project Closeout','Compile As-Built Drawings'))) {
    const past=await projectChildren(tx,'project_closeout',projectId);
    if (past[0]) await updateRecord(tx,'project_closeout',past[0].record_id,{responsibleId:'',responsibleName:''});
  }
  for (const row of await projectChildren(tx,'project_onboarding',projectId)) {
    const label=onboarding.find(([taskKey])=>taskKey===row.cells.taskKey)?.[1];
    if (label&&changes.has(key('Onboarding',label))) await updateRecord(tx,'project_onboarding',row.record_id,{responsibleId:'',responsibleName:''});
  }
  for (const row of await projectChildren(tx,'line_of_work',projectId)) {
    if (changes.has(key(row.cells.tasks,row.cells.subtask))) await updateRecord(tx,'line_of_work',row.record_id,{responsible:''});
  }
}

export async function saveWorkflowDelegation(payload,{user,database=db}) {
  const projectId=text(payload.projectId)||'*';
  if (projectId==='*') requireAdmin(user);
  else requireProject(user,projectId,{write:true,admin:true});
  return database.transaction(async tx=>{
    if (projectId!=='*'&&!await projectRow(tx,projectId)) throw failure('Project not found.',404);
    await applyDelegation(tx,projectId,payload.rows,user);
    return {saved:true};
  });
}

export async function getProjectOnboarding(payload,{user,database=db}) {
  const projectId=text(payload.projectId);
  if (!projectId) throw failure('Choose a project.');
  return database.transaction(async tx=>{
    await checkProjectRead(tx,user,projectId);
    const saved=(await tx.rows("SELECT cells FROM enlighten_operational.project_onboarding WHERE cells->>'projectId'=$1 ORDER BY source_row_number NULLS LAST,record_id",[projectId])).map(row=>row.cells);
    const rules=(await tx.rows("SELECT cells FROM enlighten_operational.workflow_delegations WHERE cells->>'projectId' IN ($1,'*') ORDER BY source_row_number NULLS LAST,record_id",[projectId])).map(row=>row.cells);
    return onboarding.map(([taskKey,label])=>{
      const row=saved.find(item=>item.taskKey===taskKey)||{taskKey,projectId,completed:false,responsibleId:'',responsibleName:''};
      const matches=rule=>key(rule.task,rule.subtask)===key('Onboarding',label);
      const rule=rules.find(value=>value.projectId===projectId&&matches(value))||
        (!row.responsibleId?rules.find(value=>value.projectId==='*'&&matches(value)):null);
      return rule?{...row,responsibleId:rule.responsibleId||'',responsibleName:rule.responsibleName||''}:row;
    });
  },{readOnly:true});
}

export async function saveProjectOnboarding(payload,{user,database=db}) {
  const projectId=text(payload.projectId),taskKey=payload.taskKey,label=onboarding.find(([id])=>id===taskKey)?.[1];
  const check=Object.hasOwn(payload,'completed'),assign=Object.hasOwn(payload,'responsibleId');
  if (!label||!check&&!assign||check&&typeof payload.completed!=='boolean') throw failure('Choose a valid onboarding change.');
  requireProject(user,projectId,{write:true,admin:true});
  return database.transaction(async tx=>{
    if (!await projectRow(tx,projectId)) throw failure('Project not found.',404);
    let person;
    if (assign&&payload.responsibleId) {
      const people=await tx.rows("SELECT cells FROM enlighten_operational.people WHERE cells->>'userId'=$1",[String(payload.responsibleId)]);
      person=people.find(row=>active(row.cells.active))?.cells;
      if (!person) throw failure('Choose an active team member.');
    }
    if (assign) await applyDelegation(tx,projectId,[{task:'Onboarding',subtask:label,responsibleId:payload.responsibleId||''}],user);
    const checklistId=projectId+':'+taskKey;
    const rows=await projectChildren(tx,'project_onboarding',projectId);
    const prior=rows.find(row=>row.cells.checklistId===checklistId);
    const row={...(prior?.cells||{completed:false,responsibleId:'',responsibleName:''}),checklistId,projectId,taskKey,
      ...(check?{completed:payload.completed}:{}),...(assign?{responsibleId:String(person?.userId||''),responsibleName:String(person?.name||'')}:{}),
      updatedAt:now(),updatedBy:actor(user)};
    if (prior) await updateRecord(tx,'project_onboarding',prior.record_id,row);
    else await insertRecord(tx,'project_onboarding',row);
    return row;
  });
}

async function ensureWorkflowTypes(tx,rows) {
  const types=new Set(rows.filter(row=>['1','2'].includes(row.workflowVersion)).map(row=>normalizeType(row.triggerDrawingType)));
  types.delete('');
  types.delete('MANUAL');
  if (!types.size) return;
  await tx.query('SELECT pg_advisory_xact_lock(hashtextextended($1,0))',['workflow-drawing-types']);
  const master=(await tx.rows('SELECT cells FROM enlighten_operational.drawing_task_master')).map(row=>row.cells);
  const known=new Set(master.map(row=>normalizeType(row.drawingType)).filter(Boolean));
  for (const type of types) {
    if (known.has(type)) continue;
    await insertRecord(tx,'drawing_task_master',{drawingTypeId:await nextEntityId(tx,'drawing_task_master'),drawingType:type,
      drawingSequence:known.size+1,active:true,taskId:'',taskTitle:'',taskSequence:'',defaultAssignee:''});
    known.add(type);
  }
}

export async function saveLineOfWork(payload,{user,database=db}) {
  const projectId=text(payload.projectId);
  requireProject(user,projectId,{write:true,admin:true});
  const incoming=Array.isArray(payload.rows)?payload.rows:[];
  return database.transaction(async tx=>{
    const project=await projectRow(tx,projectId);
    if (!project) throw failure('Project not found.',404);
    const existing=await projectChildren(tx,'line_of_work',projectId);
    const indexed=new Map(existing.filter(row=>row.cells.lineWorkId).map(row=>[String(row.cells.lineWorkId),row]));
    const requested=new Set(),kept=new Set(),rows=[],at=now(),name=actor(user);
    for (const [index,input] of incoming.entries()) {
      const requestedId=text(input.lineWorkId||input.id);
      if (requestedId&&requested.has(requestedId)) throw failure('Duplicate workflow row ID: '+requestedId);
      if (requestedId) requested.add(requestedId);
      const stable=requestedId?'LOW-'+encodeURIComponent(projectId)+'@'+encodeURIComponent(requestedId):'';
      const prior=indexed.get(requestedId)||indexed.get(stable);
      const lineWorkId=prior?.cells.lineWorkId||stable||await nextEntityId(tx,'line_of_work');
      kept.add(lineWorkId);
      const seq=index+1,meeting=input.taskCategory==='Meeting';
      const preserve=input.delegationSource==='default'&&String(input.responsible||'')===String(input.delegationValue||'');
      const hours=input.hours===''?'':Number(input.hours||0);
      if (hours!==''&&!Number.isFinite(hours)) throw failure('Enter valid workflow hours.');
      const row={lineWorkId,projectId,projectNo:project.cells.projectNo||'',projectName:project.cells.projectName||'',seq,sourceRow:input.sourceRow||seq,
        drawings:text(input.drawings||input.title),tasks:text(input.tasks||input.task),time:String(input.time||''),hours,
        plannedStart:String(input.plannedStart||input.plannedStartDate||''),plannedCompletion:String(input.plannedCompletion||input.plannedCompletionDate||''),
        responsible:text((preserve?input.delegationRawResponsible:input.responsible)||input.responsiblePerson||input.assignee),
        status:String(input.status||input.taskStatus||'Not Started'),milestone:String(input.milestone||''),floor:String(input.floor||input.floorZone||input.zone||''),
        workflowVersion:String(input.workflowVersion||''),subtask:text(input.subtask),triggerDrawingType:text(input.triggerDrawingType),
        triggerTaskType:text(input.triggerTaskType),startingMilestone:String(input.startingMilestone||''),taskCategory:meeting?'Meeting':'Design',
        meetingMode:meeting?(input.meetingMode==='Phone / Zoom allowed'?'Phone / Zoom allowed':'In person'):'',
        scope:String(input.workflowVersion)==='2'?'Stage':input.scope==='Project'?'Project':'Area',subtaskOrder:Number(input.subtaskOrder||seq),
        completionUploadRequired:String(input.completionUploadRequired)!=='false',executionNote:String(input.executionNote||''),
        optional:active(input.optional),workflowOrderMode:input.workflowOrderMode==='manual'?'manual':'drawing',
        visits:input.visits||'',visitBy:String(input.visitBy||''),active:true};
      if (!Number.isFinite(row.subtaskOrder)) throw failure('Enter a valid subtask order.');
      if (!prior) await insertRecord(tx,'line_of_work',{...row,createdAt:at,createdBy:name,updatedAt:at,updatedBy:name});
      else if (Object.entries(row).some(([field,value])=>JSON.stringify(prior.cells[field]??'')!==JSON.stringify(value))) {
        await updateRecord(tx,'line_of_work',prior.record_id,{...row,updatedAt:at,updatedBy:name});
      }
      rows.push(row);
    }
    for (const prior of existing) {
      if (prior.cells.lineWorkId&&!kept.has(prior.cells.lineWorkId)&&active(prior.cells.active)) {
        await updateRecord(tx,'line_of_work',prior.record_id,{active:false,updatedAt:at,updatedBy:name});
      }
    }
    const edits=incoming.filter(row=>row.delegationSource&&text(row.responsible)!==text(row.delegationValue));
    if (edits.length) {
      const people=(await tx.rows('SELECT cells FROM enlighten_operational.people')).map(row=>row.cells);
      await applyDelegation(tx,projectId,edits.map(row=>{
        const person=people.find(item=>String(item.name||'')===String(row.responsible||'')&&active(item.active));
        if (row.responsible&&!person) throw failure('Choose an active team member.');
        return {task:row.tasks,subtask:row.subtask,responsibleId:person?.userId||''};
      }),user);
    }
    await ensureWorkflowTypes(tx,rows);
    return (await projectChildren(tx,'line_of_work',projectId)).map(row=>row.cells).filter(row=>active(row.active)).sort(orderRows);
  });
}
