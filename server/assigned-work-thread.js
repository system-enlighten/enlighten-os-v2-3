import {randomUUID} from 'node:crypto';
import {db} from './supabase-db.js';
import {projectRoleMap,wihProjectRole} from './permissions.js';
import {studioMember} from './studio-settings.js';
import {wihDelegationResolver_} from './wih-projections.js';
import {active,actor,failure,now,text} from './project-write-storage.js';

const byKey=(project,key)=>JSON.stringify([String(project),String(key)]);
const parseComment=row=>{try{return JSON.parse(row.textJson).text;}catch{return String(row.text||'');}};
const relation=new Set(['projects','people','project_roles','design_tasks','line_of_work','execution_visits','workflow_delegations',
  'assigned_work_comments','assigned_work_acceptance','line_of_work_comments','mom_tasks']);
async function rows(tx,table,projectId) {
  if (!relation.has(table)) throw Error('Invalid assigned-work table.');
  return (await tx.rows('SELECT cells FROM enlighten_operational.'+table+
    (projectId===undefined?'':" WHERE cells->>'projectId'=$1")+' ORDER BY source_row_number NULLS LAST,record_id',
    projectId===undefined?[]:[projectId])).map(row=>row.cells);
}
async function insert(tx,table,row) {
  if (!relation.has(table)) throw Error('Invalid assigned-work table.');
  await tx.query('INSERT INTO enlighten_operational.'+table+' (cells) VALUES ($1::jsonb)',[JSON.stringify(row)]);
}
const shortComment=({id,author,at,text,priority})=>({id,author,at,text,priority:active(priority)});
async function mentions(tx,pid,assignedId,assignedName,staff) {
  const grants=await rows(tx,'project_roles',pid),lower=value=>text(value).toLowerCase();
  return staff.flatMap(member=>{
    const id=String(member.userId||''),name=text(member.name).replace(/[\[\]\r\n]/g,'');
    if (!id||!name||!active(member.active)||!/^(admin|user|viewer)$/i.test(member.appAccess)) return [];
    const candidate={...member,authorized:true,active:true,projectRoles:projectRoleMap(grants,id)};
    if (!wihProjectRole(candidate,pid)) return [];
    const assigned=assignedId?id===String(assignedId):Boolean(assignedName)&&lower(assignedName)===lower(member.name);
    return [{id,name,assigned}];
  }).sort((a,b)=>Number(b.assigned)-Number(a.assigned)||a.name.localeCompare(b.name));
}
async function feed(tx,p,user) {
  const projects=new Map((await rows(tx,'projects')).filter(row=>wihProjectRole(user,String(row.projectId))).map(row=>[String(row.projectId),row.projectName]));
  const tasks=new Map((await rows(tx,'design_tasks')).filter(row=>projects.has(String(row.projectId))).map(row=>[byKey(row.projectId,row.designTaskId),row]));
  const lineTitles=new Map((await rows(tx,'line_of_work')).map(row=>[byKey(row.projectId,'subtask:'+row.lineWorkId),row.subtask]));
  for (const row of await rows(tx,'execution_visits')) lineTitles.set(byKey(row.projectId,'meeting:'+row.visitPlanId),row.title||row.milestone);
  const workflow=await rows(tx,'line_of_work_comments');
  const posts=[];
  const add=(row,fields)=>{
    const projectId=String(row.projectId);
    posts.push({...shortComment(row),projectId,projectName:projects.get(projectId)||'',...fields});
  };
  for (const row of await rows(tx,'assigned_work_comments')) {
    const task=tasks.get(byKey(row.projectId,row.designTaskId));
    if (task) add(row,{designTaskId:row.designTaskId,title:task.taskType||'Task'});
  }
  for (const row of workflow) if (projects.has(String(row.projectId))&&!String(row.threadKey||'').startsWith('mom:')) {
    add(row,{threadKey:row.threadKey,title:row.title||lineTitles.get(byKey(row.projectId,row.threadKey))||'Line of Work discussion'});
  }
  const momTasks=new Map((await rows(tx,'mom_tasks')).map(row=>[byKey(row.projectId,row.momTaskId),row]));
  for (const {cells:flag} of await tx.rows('SELECT cells FROM enlighten_operational.mom_discussion_flags')) {
    const pid=String(flag.projectId),id=String(flag.momTaskId),task=momTasks.get(byKey(pid,id));
    if (!projects.has(pid)||!task||!active(flag.flagged)) continue;
    const last=workflow.filter(row=>String(row.projectId)===pid&&row.threadKey==='mom:'+id&&!row.deletedAt)
      .sort((a,b)=>String(b.at).localeCompare(String(a.at)))[0];
    add(flag,{id:'mom:'+id,momTaskId:id,threadKey:'mom:'+id,author:last?.author||flag.updatedByName,
      at:last&&String(last.at)>String(flag.updatedAt)?last.at:flag.updatedAt,
      text:last?parseComment(last):'MOM point flagged for discussion.',priority:true,title:'MOM \u00b7 '+task.title});
  }
  const offset=Math.max(0,Math.floor(Number(p.offset)||0));
  return posts.filter(row=>!p.projectId||row.projectId===String(p.projectId)).sort((a,b)=>
    (p.recent===true?0:Number(b.priority)-Number(a.priority))||(Date.parse(b.at)||0)-(Date.parse(a.at)||0))
    .slice(offset,offset+(p.recent===true?5:50));
}

export async function assignedWorkThread(p,{user,database=db}) {
  const uid=studioMember(user),canComment=!/^viewer$/i.test(user.appAccess),action=p.action;
  if (!['feed','workflow-read','workflow-comment','read','accept','comment'].includes(action)) throw failure('Unknown task action.');
  const write=['workflow-comment','accept','comment'].includes(action);
  if (write&&!canComment) throw failure('View only access.',403);
  return database.transaction(async tx=>{
    if (action==='feed') return feed(tx,p,user);
    if (action.startsWith('workflow-')) {
      const pid=text(p.projectId),key=text(p.threadKey);
      if (!pid||!wihProjectRole(user,pid)||!/^(subtask|meeting):[^\r\n]{1,300}$/.test(key)) throw failure('Project discussion access required.',403);
      if (!(await rows(tx,'projects',pid)).length) throw failure('Project not found.',404);
      const line=key.startsWith('subtask:')?(await rows(tx,'line_of_work',pid)).find(row=>String(row.lineWorkId)===key.slice(8)):null;
      if (write) {
        const message=text(p.comment);
        if (!message||message.length>2000) throw failure('Enter an update up to 2,000 characters.');
        const escaped=value=>/^[=+@-]/.test(value)?"'"+value:value;
        await insert(tx,'line_of_work_comments',{id:randomUUID(),projectId:pid,threadKey:key,title:escaped(text(p.title).slice(0,160)),
          priority:p.priority===true,author:actor(user),at:now(),text:escaped(message)});
      }
      const comments=(await rows(tx,'line_of_work_comments',pid)).filter(row=>row.threadKey===key).slice(-100).map(shortComment);
      return {canComment,mentionPeople:canComment?await mentions(tx,pid,'',line?.responsible,await rows(tx,'people')):[],comments};
    }
    const id=text(p.designTaskId);
    if (!id) throw failure('Choose a design task.');
    const found=await tx.rows("SELECT cells FROM enlighten_operational.design_tasks WHERE cells->>'designTaskId'=$1 LIMIT 2",[id]);
    if (found.length!==1) throw failure('Design task is missing or duplicated.',404);
    const stored=found[0].cells,pid=String(stored.projectId);
    if (!wihProjectRole(user,pid)) throw failure('Project access required.',403);
    const staff=await rows(tx,'people'),lines=await rows(tx,'line_of_work',pid);
    const rules=[...await rows(tx,'workflow_delegations','*'),...await rows(tx,'workflow_delegations',pid)];
    const task=wihDelegationResolver_(rules,lines,staff)(stored);
    const canAccept=String(task.assigneeUserId)===uid&&canComment&&!/completed|^done$/i.test(String(task.status));
    if (action==='accept'&&!canAccept) throw failure('This action is not available for your account.',403);
    const key=JSON.stringify([pid,id,String(task.assigneeUserId||'')]);
    if (action==='accept') await tx.query('SELECT pg_advisory_xact_lock(hashtextextended($1,0))',['assigned-work:'+key]);
    let accepted=(await rows(tx,'assigned_work_acceptance',pid)).find(row=>row.key===key);
    if (action==='accept'&&!accepted) {
      accepted={key,designTaskId:id,projectId:pid,assigneeId:uid,acceptedBy:actor(user),acceptedAt:now()};
      await insert(tx,'assigned_work_acceptance',accepted);
    }
    if (action==='comment') {
      const message=text(p.comment);
      if (!message||message.length>2000) throw failure('Enter a comment up to 2,000 characters.');
      await insert(tx,'assigned_work_comments',{id:randomUUID(),designTaskId:id,projectId:pid,userId:uid,author:actor(user),at:now(),text:message,priority:p.priority===true});
    }
    const comments=(await rows(tx,'assigned_work_comments',pid)).filter(row=>String(row.designTaskId)===id).slice(-100).map(shortComment);
    return {canAccept,canComment,mentionPeople:canComment?await mentions(tx,pid,task.assigneeUserId,task.assigneeName,staff):[],
      acceptedAt:accepted?.acceptedAt||'',acceptedBy:accepted?.acceptedBy||'',comments};
  },{readOnly:!write});
}
