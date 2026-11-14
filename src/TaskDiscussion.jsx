import React,{useEffect,useState,useRef} from 'react';
import './TaskDiscussion.css';
const date=s=>{const d=new Date(s);return Number.isNaN(+d)?'':d.toLocaleString('en-IN',{timeZone:'Asia/Kolkata',dateStyle:'medium',timeStyle:'short'});};
export function MentionInput({text,setText,people=[]}){
 const [caret,setCaret]=useState(0),[closed,setClosed]=useState(false),[active,setActive]=useState(0),ref=useRef(null);
 const match=text.slice(0,caret).match(/(?:^|\s)@([^@\n]{0,45})$/);
 const choices=match&&!closed?people.filter(p=>p.name.toLowerCase().includes(match[1].trim().toLowerCase())).slice(0,8):[];
 const select=p=>{const start=caret-match[1].length-1,tag='@['+p.name+'] ';setText(text.slice(0,start)+tag+text.slice(caret));setClosed(true);requestAnimationFrame(()=>{ref.current?.focus();ref.current?.setSelectionRange(start+tag.length,start+tag.length);});};
 return <div style={{width:'100%',minWidth:0}}><textarea ref={ref} aria-label="Write a post" placeholder="Share an update or type @ to tag a teammate…" maxLength={2000} value={text} onClick={e=>{setCaret(e.currentTarget.selectionStart);setClosed(false);setActive(0);}} onChange={e=>{setText(e.target.value);setCaret(e.target.selectionStart);setClosed(false);setActive(0);}} onKeyDown={e=>{if(!choices.length)return;if(e.key==='Escape'){e.stopPropagation();setClosed(true);}if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();setActive(i=>(i+(e.key==='ArrowDown'?1:-1)+choices.length)%choices.length);}if(e.key==='Enter'||e.key==='Tab'&&!e.shiftKey){e.preventDefault();select(choices[active]||choices[0]);}}}/>
 {choices.length>0&&<ul aria-label="Mention a teammate" style={{listStyle:'none',margin:0,padding:4,border:'1px solid #d8cdb9',background:'#fffdf8'}}>{choices.map((p,i)=><li key={p.id}><button type="button" style={{width:'100%',textAlign:'left',padding:7,border:0,background:i===active?'#eae4d8':'transparent'}} onMouseDown={e=>e.preventDefault()} onClick={()=>select(p)}>{p.name}{p.assigned?' · Assigned':''}</button></li>)}</ul>}</div>;
}
function Post({p,children}){return <article className="task-post"><span className="task-post-avatar" aria-hidden="true">{(p.author||'?').slice(0,1).toUpperCase()}</span><div><strong>{p.author||'Team member'}</strong> <time dateTime={p.at}>{date(p.at)}</time>{children}{p.priority&&<strong style={{color:"#a13427",display:"block"}}>⚑ High priority</strong>}<p>{String(p.text||'').split(/(@\[[^\]]+\])/).map((part,i)=>part.startsWith('@[')&&part.endsWith(']')?<strong key={i} style={{color:'#24558a'}}>{'@'+part.slice(2,-1)}</strong>:part)}</p></div></article>;}
export function DiscussionDialog({task,data,error,busy,text,setText,onPost,onClose,buttonStyle,showPriority}){
 const [priority,setPriority]=useState(false);
 return <div className="task-discussion-overlay"><section className="task-discussion-dialog" role="dialog" aria-modal="true" aria-label="Task discussion" onKeyDown={e=>{if(e.key==='Escape'&&!busy)onClose();}}><header><div><small>Task discussion</small><h2>{task.title}</h2>{task.projectName&&<span>{task.projectName}</span>}</div><button autoFocus type="button" style={buttonStyle} disabled={busy} onClick={onClose}>Close</button></header>
 {error&&<p role="alert">{error}</p>}{busy&&<p role="status">Updating discussion…</p>}
 {data?.canComment&&<form onSubmit={e=>{e.preventDefault();if(!busy&&text.trim()){onPost(priority);setPriority(false);}}}><MentionInput text={text} setText={setText} people={data.mentionPeople}/>{showPriority&&<label style={{color:priority?"#a13427":undefined}}><input type="checkbox" checked={priority} onChange={e=>setPriority(e.target.checked)}/> ⚑ High priority</label>}<button style={buttonStyle} disabled={busy||!text.trim()}>Post update</button></form>}
 {!busy&&!error&&!data?.comments?.length&&<p>No updates yet.</p>}{[...(data?.comments||[])].reverse().map(p=><Post key={p.id} p={p}/>)}
 </section></div>;
}
export default function TaskDiscussion({request,buttonStyle}){
 const [posts,setPosts]=useState(null),[task,setTask]=useState(null),[data,setData]=useState(null),[error,setError]=useState(''),[threadError,setThreadError]=useState(''),[text,setText]=useState(''),[busy,setBusy]=useState(false);
 const load=async()=>{setError('');try{setPosts(await request('assignedWorkThread',{action:'feed'},'POST'));}catch(e){setError(e.message);}};
 useEffect(()=>{load();},[request]);
 const open=async(p,action='read')=>{setBusy(true);setThreadError('');if(action==='read'){setTask(p);setData(null);setText('');}
 try{setData(await request('assignedWorkThread',{designTaskId:p.designTaskId,projectId:p.projectId,threadKey:p.threadKey,priority:p.priority,title:p.title,action:p.threadKey?'workflow-'+action:action,comment:action==='comment'?text:''},'POST'));if(action==='comment'){setText('');load();}}catch(e){setThreadError(e.message);}finally{setBusy(false);}};
 return <section className="studio-home-card task-discussion-feed" aria-label="Task discussions"><header><h2>Task discussions</h2><button type="button" style={buttonStyle} onClick={load}>Refresh</button></header>
 {error?<p role="alert">{error}</p>:!posts?<p role="status">Loading discussions…</p>:!posts.length?<p>No task updates yet. Open a task’s comment icon to post one.</p>:posts.map(p=><Post key={p.id} p={p}><button type="button" className="task-post-link" disabled={busy} onClick={()=>open(p)}>{p.title}{p.projectName?' · '+p.projectName:''}</button></Post>)}
 {task&&<DiscussionDialog task={task} data={data} error={threadError} busy={busy} text={text} setText={setText} onClose={()=>setTask(null)} onPost={priority=>open({...task,priority},'comment')} showPriority={!!task.threadKey} buttonStyle={buttonStyle}/>}</section>;
}
