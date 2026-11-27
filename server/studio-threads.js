import {randomUUID} from 'node:crypto';
import {db} from './supabase-db.js';
import {isSystemAdmin,requireStudio} from './permissions.js';
import {actor,failure,now,text} from './project-write-storage.js';

const urgencyRank=new Map([['Very very urgent',0],['Very urgent',1],['Urgent',2]]);
const canManage=(user,row)=>isSystemAdmin(user)||String(row.authorId)===String(user.userId)||
  String(user.appAccess).toLowerCase()!=='viewer'&&Boolean(row.projectId)&&user.projectRoles?.[row.projectId]==='Admin';
const validId=id=>/^[A-Za-z0-9_-]{1,120}$/.test(id);
function member(user,write=false) {
  requireStudio(user);
  if (!user.userId) throw failure('Registered team identity required.',403);
  if (write&&String(user.appAccess).toLowerCase()==='viewer') throw failure('View only access.',403);
}
const threads='enlighten_operational.studio_threads',comments='enlighten_operational.studio_thread_comments';
async function lookup(tx,table,key,id,lock=false) {
  const rows=await tx.rows('SELECT record_id,cells FROM '+table+' WHERE cells->>$1=$2 LIMIT 2'+(lock?' FOR UPDATE':''),[key,id]);
  if (rows.length>1) throw failure('Record identifier is duplicated.',409);
  return rows[0];
}
async function write(tx,table,prior,row) {
  if (prior) await tx.query('UPDATE '+table+' SET cells=cells||$1::jsonb,updated_at=clock_timestamp() WHERE record_id=$2',[JSON.stringify(row),prior.record_id]);
  else await tx.query('INSERT INTO '+table+' (cells) VALUES ($1::jsonb)',[JSON.stringify(row)]);
}
const lock=(tx,key)=>tx.query('SELECT pg_advisory_xact_lock(hashtextextended($1,0))',[key]);

export async function listStudioThreads(p,{user,database=db}) {
  member(user);
  const chosenId=text(p.threadId),offset=Math.max(0,Math.floor(Number(p.offset)||0));
  return database.transaction(async tx=>{
    const source=(await tx.rows('SELECT cells FROM '+threads+' ORDER BY source_row_number NULLS LAST,record_id')).map(({cells})=>({
      ...cells,urgency:urgencyRank.has(cells.urgency)?cells.urgency:'Urgent'
    }));
    const all=source.filter(row=>(!p.projectId||String(row.projectId)===String(p.projectId))&&(!p.urgency||row.urgency===p.urgency)&&
      (!p.status||p.status==='All'||(p.status==='Resolved'?row.status==='Resolved':row.status!=='Resolved')))
      .sort((a,b)=>urgencyRank.get(a.urgency)-urgencyRank.get(b.urgency)||String(b.updatedAt).localeCompare(String(a.updatedAt)));
    const page=all.slice(offset,offset+200);
    let messages=[];
    if (chosenId) {
      const chosen=source.find(row=>String(row.threadId)===chosenId);
      if (!chosen) throw failure('Thread not found.',404);
      if (!page.includes(chosen)) page.push(chosen);
      messages=(await tx.rows("SELECT cells FROM "+comments+" WHERE cells->>'threadId'=$1 ORDER BY cells->>'createdAt',record_id",[chosenId])).map(row=>row.cells);
    }
    const projects=[...new Map(source.filter(row=>row.projectId).map(row=>[String(row.projectId),{id:String(row.projectId),label:row.projectLabel||String(row.projectId)}])).values()];
    return {threads:page.map(row=>({...row,canManage:canManage(user,row)})),comments:messages,projects,total:all.length,nextOffset:offset+200,hasMore:offset+200<all.length};
  },{readOnly:true});
}

export async function saveStudioThread(p,{user,database=db}) {
  member(user,true);
  const id=text(p.threadId),title=text(p.title),description=text(p.description),nextStep=text(p.nextStep);
  const status=text(p.status)||'Open',urgency=text(p.urgency)||'Urgent';
  if (!validId(id)) throw failure('Invalid thread identifier.');
  if (!urgencyRank.has(urgency)) throw failure('Choose a valid urgency.');
  if (!title||title.length>200||description.length>10000||nextStep.length>3000||
      !['Open','In progress','Waiting','Resolved'].includes(status)) throw failure('Enter a title and valid thread details.');
  return database.transaction(async tx=>{
    await lock(tx,'studio-thread:'+id);
    const previous=await lookup(tx,threads,'threadId',id,true),old=previous?.cells;
    if (old&&!canManage(user,old)) throw failure('Only the author, project admin or system admin can update this issue.',403);
    if (old&&String(old.version)!==text(p.expectedVersion)) throw failure('Thread changed. Refresh before saving.',409);
    const projectId=old?text(old.projectId):text(p.projectId);
    let projectLabel=old?.projectLabel||'';
    if (!old&&projectId) {
      if (!isSystemAdmin(user)&&!Object.hasOwn(user.projectRoles||{},projectId)) throw failure('Project access required.',403);
      const project=await lookup(tx,'enlighten_operational.projects','projectId',projectId);
      if (!project) throw failure('Project not found.',404);
      projectLabel=[project.cells.projectNo,project.cells.projectName].filter(Boolean).join(' \u00b7 ');
    }
    const updatedAt=now();
    const row={threadId:id,projectId,projectLabel,title,description,status,urgency,nextStep,authorId:old?.authorId||String(user.userId),
      authorName:old?.authorName||actor(user),createdAt:old?.createdAt||updatedAt,updatedAt,version:randomUUID()};
    await write(tx,threads,previous,row);
    return {...row,canManage:true};
  });
}

export async function addStudioThreadComment(p,{user,database=db}) {
  member(user,true);
  const id=text(p.commentId),threadId=text(p.threadId),message=text(p.text);
  if (!validId(id)||!message||message.length>5000) throw failure('Enter a comment up to 5000 characters.');
  return database.transaction(async tx=>{
    await lock(tx,'studio-thread:'+threadId);
    const thread=await lookup(tx,threads,'threadId',threadId,true);
    if (!thread) throw failure('Thread not found.',404);
    await lock(tx,'studio-thread-comment:'+id);
    const previous=(await lookup(tx,comments,'commentId',id))?.cells;
    if (previous) {
      if (String(previous.authorId)!==String(user.userId)||String(previous.threadId)!==threadId||previous.text!==message) {
        throw failure('Comment identifier already used.',409);
      }
      return previous;
    }
    const createdAt=now(),row={commentId:id,threadId,text:message,authorId:String(user.userId),authorName:actor(user),createdAt};
    await write(tx,comments,null,row);
    await write(tx,threads,thread,{updatedAt:createdAt});
    return row;
  });
}
