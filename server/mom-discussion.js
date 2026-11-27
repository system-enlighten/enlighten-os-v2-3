import {randomUUID} from 'node:crypto';
import {db} from './supabase-db.js';
import {isSystemAdmin,requireStudio,wihProjectRole} from './permissions.js';
import {active,actor,failure,now,projectRow,text} from './project-write-storage.js';

const message=row=>{
  try {return JSON.parse(row.textJson).text;} catch {return String(row.text||'');}
};
const mayDelete=(user,row,role)=>text(user.appAccess).toLowerCase()!=='viewer'&&
  (String(row.authorId)===String(user.userId)||isSystemAdmin(user)||role==='Admin');
const commentsTable='enlighten_operational.line_of_work_comments';

export async function momDiscussion(p,{user,database=db}) {
  requireStudio(user);
  const projectId=text(p.projectId),taskId=text(p.momTaskId),action=p.action||'list';
  const role=wihProjectRole(user,projectId),canComment=text(user.appAccess).toLowerCase()!=='viewer';
  const write=['comment','flag','delete'].includes(action);
  if (!projectId||!user.userId||!role||write&&!canComment) throw failure('Project discussion access required.',403);
  if (!['list','read','comment','flag','delete'].includes(action)) throw failure('Unknown MOM discussion action.');
  return database.transaction(async tx=>{
    if (write) {
      if (!await projectRow(tx,projectId)) throw failure('Project not found.',404);
    } else {
      const projects=await tx.rows("SELECT 1 FROM enlighten_operational.projects WHERE cells->>'projectId'=$1",[projectId]);
      if (projects.length!==1) throw failure('Project not found.',404);
    }
    const selected=action==='list'?'':taskId;
    const tasks=(await tx.rows("SELECT cells FROM enlighten_operational.mom_tasks WHERE cells->>'projectId'=$1 AND ($2='' OR cells->>'momTaskId'=$2)",
      [projectId,selected])).map(row=>row.cells);
    if (action!=='list'&&(!taskId||tasks.length!==1)) throw failure('MOM point not found in this project.',404);
    const key='mom:'+taskId,id=text(p.commentId);
    if (action==='comment'||action==='delete') {
      if (action==='comment'&&(!/^[A-Za-z0-9_-]{12,120}$/.test(id)||!text(p.text)||text(p.text).length>2000)) {
        throw failure('Enter a comment up to 2,000 characters.');
      }
      await tx.query('SELECT pg_advisory_xact_lock(hashtextextended($1,0))',['workflow-comment:'+id]);
      const rows=await tx.rows("SELECT record_id,cells FROM "+commentsTable+" WHERE cells->>'id'=$1 LIMIT 2 FOR UPDATE",[id]);
      const found=rows[0],prior=found?.cells;
      if (rows.length>1) throw failure('Comment ID is duplicated.',409);
      const matches=prior&&String(prior.projectId)===projectId&&prior.threadKey===key;
      if (action==='comment') {
        if (prior&&(!matches||String(prior.authorId)!==String(user.userId)||message(prior)!==text(p.text))) throw failure('Comment identifier already used.',409);
        if (!prior) {
          const entry={id,projectId,threadKey:key,author:actor(user),authorId:String(user.userId),at:now(),text:'',
            textJson:JSON.stringify({text:text(p.text)}),title:String(tasks[0].title||'MOM point').slice(0,160),priority:false};
          await tx.query('INSERT INTO '+commentsTable+' (cells) VALUES ($1::jsonb)',[JSON.stringify(entry)]);
        }
      } else {
        if (!matches) throw failure('Comment not found for this MOM point.',404);
        if (!mayDelete(user,prior,role)) throw failure('Only the comment author or a project/system admin can delete this comment.',403);
        if (!prior.deletedAt) await tx.query('UPDATE '+commentsTable+' SET cells=cells||$1::jsonb,updated_at=clock_timestamp() WHERE record_id=$2',
          [JSON.stringify({deletedAt:now(),deletedBy:String(user.userId)}),found.record_id]);
      }
    }
    if (action==='flag') {
      if (typeof p.flagged!=='boolean') throw failure('Flag must be true or false.');
      const [old]=await tx.rows('SELECT cells FROM enlighten_operational.mom_discussion_flags WHERE project_id=$1 AND mom_task_id=$2 FOR UPDATE',[projectId,taskId]);
      if (String(old?.cells.version||'')===String(p.expectedVersion||'')) {
        const row={momTaskId:taskId,projectId,flagged:p.flagged,updatedAt:now(),updatedBy:String(user.userId),
          updatedByName:actor(user),version:randomUUID()};
        await tx.query(`INSERT INTO enlighten_operational.mom_discussion_flags (project_id,mom_task_id,cells)
          VALUES ($1,$2,$3::jsonb) ON CONFLICT (project_id,mom_task_id) DO UPDATE SET cells=excluded.cells`,[projectId,taskId,JSON.stringify(row)]);
      } else if (!old||active(old.cells.flagged)!==p.flagged) throw failure('Flag changed. Refresh before updating.',409);
    }
    const flags=new Map((await tx.rows('SELECT mom_task_id,cells FROM enlighten_operational.mom_discussion_flags WHERE project_id=$1',[projectId]))
      .map(row=>[row.mom_task_id,row.cells]));
    const comments=(await tx.rows("SELECT cells FROM "+commentsTable+" WHERE cells->>'projectId'=$1 AND cells->>'threadKey' LIKE 'mom:%' "+
      "AND coalesce(cells->>'deletedAt','')='' ORDER BY cells->>'at',record_id",[projectId])).map(row=>row.cells);
    const threads=tasks.map(task=>{
      const flag=flags.get(String(task.momTaskId));
      return {projectId,momTaskId:String(task.momTaskId),flagged:active(flag?.flagged),version:flag?.version||'',canComment,
        comments:comments.filter(row=>row.threadKey==='mom:'+task.momTaskId).slice(-100)
          .map(row=>({id:row.id,author:row.author,at:row.at,text:message(row),canDelete:mayDelete(user,row,role)}))};
    });
    return action==='list'?{threads}:threads[0];
  },{readOnly:!write});
}
