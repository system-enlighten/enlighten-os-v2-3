import React,{useEffect,useState} from 'react';
import './TaskDiscussion.css';
const date=s=>{const d=new Date(s);return Number.isNaN(+d)?'':d.toLocaleString('en-IN',{timeZone:'Asia/Kolkata',dateStyle:'medium',timeStyle:'short'});};
function Post({p,children}){return <article className="task-post"><span className="task-post-avatar" aria-hidden="true">{(p.author||'?').slice(0,1).toUpperCase()}</span><div><strong>{p.author||'Team member'}</strong> <time dateTime={p.at}>{date(p.at)}</time>{children}<p>{p.text}</p></div></article>;}
export function DiscussionDialog({task,data,error,busy,text,setText,onPost,onClose,buttonStyle}){
 return <div className="task-discussion-overlay"><section className="task-discussion-dialog" role="dialog" aria-modal="true" aria-label="Task discussion" onKeyDown={e=>{if(e.key==='Escape'&&!busy)onClose();}}><header><div><small>Task discussion</small><h2>{task.title}</h2>{task.projectName&&<span>{task.projectName}</span>}</div><button autoFocus type="button" style={buttonStyle} disabled={busy} onClick={onClose}>Close</button></header>
 {error&&<p role="alert">{error}</p>}{busy&&<p role="status">Updating discussion…</p>}
 {data?.canComment&&<form onSubmit={e=>{e.preventDefault();if(!busy&&text.trim())onPost();}}><textarea aria-label="Write a post" placeholder="Share an update or ask a question…" maxLength={2000} value={text} onChange={e=>setText(e.target.value)}/><button style={buttonStyle} disabled={busy||!text.trim()}>Post update</button></form>}
 {!busy&&!error&&!data?.comments?.length&&<p>No updates yet.</p>}{[...(data?.comments||[])].reverse().map(p=><Post key={p.id} p={p}/>)}
 </section></div>;
}
export default function TaskDiscussion({request,buttonStyle}){
 const [posts,setPosts]=useState(null),[task,setTask]=useState(null),[data,setData]=useState(null),[error,setError]=useState(''),[threadError,setThreadError]=useState(''),[text,setText]=useState(''),[busy,setBusy]=useState(false);
 const load=async()=>{setError('');try{setPosts(await request('assignedWorkThread',{action:'feed'},'POST'));}catch(e){setError(e.message);}};
 useEffect(()=>{load();},[request]);
 const open=async(p,action='read')=>{setBusy(true);setThreadError('');if(action==='read'){setTask(p);setData(null);setText('');}
 try{setData(await request('assignedWorkThread',{designTaskId:p.designTaskId,action,comment:action==='comment'?text:''},'POST'));if(action==='comment'){setText('');load();}}catch(e){setThreadError(e.message);}finally{setBusy(false);}};
 return <section className="studio-home-card task-discussion-feed" aria-label="Task discussions"><header><h2>Task discussions</h2><button type="button" style={buttonStyle} onClick={load}>Refresh</button></header>
 {error?<p role="alert">{error}</p>:!posts?<p role="status">Loading discussions…</p>:!posts.length?<p>No task updates yet. Open a task’s comment icon to post one.</p>:posts.map(p=><Post key={p.id} p={p}><button type="button" className="task-post-link" disabled={busy} onClick={()=>open(p)}>{p.title}{p.projectName?' · '+p.projectName:''}</button></Post>)}
 {task&&<DiscussionDialog task={task} data={data} error={threadError} busy={busy} text={text} setText={setText} onClose={()=>setTask(null)} onPost={()=>open(task,'comment')} buttonStyle={buttonStyle}/>}</section>;
}
