import TaskDiscussion from './TaskDiscussion.jsx';
import WihMetrics from './WihMetrics.jsx';
import './StudioHome.css';
import React,{useEffect,useState} from 'react';
const tz='Asia/Kolkata', day=d=>new Intl.DateTimeFormat('en-CA',{timeZone:tz,year:'numeric',month:'2-digit',day:'2-digit'}).format(d);
const stamp=t=>new Date(t).toLocaleTimeString('en-IN',{timeZone:tz,hour:'numeric',minute:'2-digit'});
const done=r=>/^(completed|done)$/i.test(r.status||r.task?.status||'');
const running=r=>/in.?progress|running/i.test(r.status||r.task?.status||'');
const title=r=>r.task?.taskType||r.title||'Work item';
export default function StudioHome({state,user,request,loadWork,navigate,theme:T,buttonStyle,assistant}){
 const [rows,setRows]=useState([]),[log,setLog]=useState(null),[error,setError]=useState(''),[busy,setBusy]=useState(false),[note,setNote]=useState(''),[start,setStart]=useState(''),[end,setEnd]=useState(''),[ready,setReady]=useState(false);
 const [period,setPeriod]=useState('week'),[assignment,setAssignment]=useState(null),[assignmentBusy,setAssignmentBusy]=useState(false),[assigned,setAssigned]=useState(false),[thread,setThread]=useState(null),[comment,setComment]=useState(''),[threadBusy,setThreadBusy]=useState(false),[threadError,setThreadError]=useState('');
 const changeThread=async(row,action)=>{
  setThreadBusy(true);setThreadError('');
  if(action==='read'){setThread({row});setComment('');}
  try{const data=await request('assignedWorkThread',{designTaskId:row.designTaskId,action,comment:action==='comment'?comment:undefined},'POST');setThread({row,...data});if(action==='comment')setComment('');}
  catch(e){setThreadError(e.message);}finally{setThreadBusy(false);}
 };
 const today=day(new Date()),admin=String(user?.appAccess).toLowerCase()==='admin';
 useEffect(()=>{let live=true;loadWork().then(r=>{if(live){setRows(Array.isArray(r)?r:[]);setReady(true);}}).catch(e=>{if(live)setError(e.message);});request('getStudioDay',{},'POST').then(r=>{if(live)setLog(r);}).catch(e=>{if(live)setError(e.message);});return()=>{live=false;};},[request,loadWork]);
 const save=async(action)=>{if(busy)return;setBusy(true);setError('');try{setLog(await request('saveStudioDay',{action,note,start,end},'POST'));if(action==='entry'){setNote('');setStart('');setEnd('');}}catch(e){setError(e.message);}finally{setBusy(false);}};
 const [timerBusy,setTimerBusy]=useState(''),[timerError,setTimerError]=useState(''),[clock,setClock]=useState(Date.now());
 const [taskLimit,setTaskLimit]=useState(20);
 useEffect(()=>{const tick=setInterval(()=>setClock(Date.now()),1000);return()=>clearInterval(tick);},[]);
 const timerAction=async(row)=>{
  if(timerBusy)return;
  setTimerBusy(row.designTaskId);setTimerError('');
  const action=running(row)?'pauseTask':/paused/i.test(row.status||'')?'resumeTask':'startTask';
  try{await request(action,{designTaskId:row.designTaskId},'POST');}
  catch(e){setTimerError(e.message);setTimerBusy('');return;}
  setRows(list=>list.map(r=>r.designTaskId===row.designTaskId?{...r,status:action==='pauseTask'?'Paused':'In Progress',startAt:action==='pauseTask'?'':new Date().toISOString(),totalMinutes:Number(r.totalMinutes||0)+(action==='pauseTask'&&r.startAt?Math.max(0,Math.round((Date.now()-Date.parse(r.startAt))/60000)):0)}:r));
  try{const updated=await loadWork();if(Array.isArray(updated))setRows(updated);}catch{setTimerError('Timer updated. Refresh Home to check the latest saved totals.');}finally{setTimerBusy('');}
 };
 const own=r=>String(r.assigneeUserId||'')===String(user?.userId);
 const work=admin?rows:rows.filter(own);
 const chooseAssignee=async row=>{setAssignment({row,people:[],id:''});setAssignmentBusy(true);setError('');try{const people=await request('reportingAssignment',{designTaskId:row.designTaskId,action:'options'},'POST');setAssignment({row,people,id:''});}catch(e){setError(e.message);}finally{setAssignmentBusy(false);}};
 useEffect(()=>{let active=true;const update=()=>loadWork().then(r=>{if(active&&Array.isArray(r))setRows(r);}).catch(e=>{if(active)setError(e.message);});window.addEventListener("enlighten-assistant-work",update);return()=>{active=false;window.removeEventListener("enlighten-assistant-work",update);};},[loadWork]);
 const assign=async()=>{setAssignmentBusy(true);setError('');try{await request('reportingAssignment',{designTaskId:assignment.row.designTaskId,action:'assign',assigneeUserId:assignment.id},'POST');setAssignment(null);setRows(await loadWork());}catch(e){setError(e.message);}finally{setAssignmentBusy(false);}};
 const projectName=r=>(state.projects||[]).find(p=>String(p.id)===String(r.projectId))?.name||'Project';
 const openMine=rows.filter(r=>own(r)&&!done(r)).sort((a,b)=>Number(running(b))-Number(running(a)));
 const todayMine=openMine.filter(r=>r.plan?.plannedStart&&day(new Date(r.plan.plannedStart))===today);
 const homeTasks=todayMine.length?openMine.filter(r=>running(r)||todayMine.includes(r)):openMine.filter(r=>running(r)||!r.plan?.plannedStart);
 const filteredMine=homeTasks;
 const elapsed=r=>{const startAt=Date.parse(r.startAt),seconds=Math.floor((Number(r.totalMinutes)||0)*60+(running(r)&&Number.isFinite(startAt)?Math.max(0,clock-startAt)/1000:0));return [Math.floor(seconds/3600),Math.floor(seconds/60)%60,seconds%60].map(v=>String(v).padStart(2,'0')).join(':');};
 const ownSchedule=rows.filter(r=>(admin||own(r))&&!done(r)&&r.plan?.plannedStart&&day(new Date(r.plan.plannedStart))===today).map(r=>({time:stamp(r.plan.plannedStart),end:r.plan.plannedEnd?stamp(r.plan.plannedEnd):'',title:title(r)}));
 const panel={background:'#fff',border:'1px solid '+T.line,padding:16,minWidth:0};
 return <main className="studio-home">
 <header className="studio-home-intro">
  <div><p className="studio-home-kicker">enLIGHTen / Studio desk</p><h1>{admin?'Studio overview':'My work'}</h1><p>{new Intl.DateTimeFormat('en-IN',{timeZone:tz,dateStyle:'full'}).format(new Date())}</p></div>
  <section aria-label="Attendance" className="studio-home-attendance">
   <div><p className="studio-home-kicker">Attendance</p><strong>{!log?'Attendance unavailable':log.checkOut?'Checked out':log.breakStart?'On break':log.checkIn?'Checked in':'Ready to check in'}</strong>{log?.checkIn&&<small>{stamp(log.checkIn)}{log.checkOut?' – '+stamp(log.checkOut):' · IST'}</small>}</div>
   <div style={{display:'grid',gap:6}}>
    {log?.checkIn&&!log.checkOut&&<button type="button" style={buttonStyle} disabled={busy} onClick={()=>save(log.breakStart?'resume':'break')}>{log.breakStart?'Resume work':'Pause for break'}</button>}
   <button type="button" className="studio-home-check" disabled={!log||busy||!!log.checkOut} onClick={()=>save(log.checkIn?'out':'in')}>{busy?'Saving…':log?.checkOut?'Day closed':log?.checkIn?'Check out':'Check in'}</button></div>
  </section>
  <div className="studio-home-utilities">{assistant}<button type="button" style={buttonStyle} aria-expanded={assigned} onClick={()=>setAssigned(!assigned)}>Assigned requests</button></div>
 </header>
 {error&&<p role="alert" style={{color:T.redline}}>{error}</p>}
 {assigned&&<section className="studio-home-card"> {assigned&&<><h2>{admin?'Assigned work · accessible team':'My assigned work'}</h2>{!work.some(r=>!done(r)&&(admin||own(r)))&&<p>No assigned work to review.</p>}{work.filter(r=>!done(r)&&(admin||own(r))).map(r=><div key={r.designTaskId} style={{padding:'8px 0',borderTop:'1px solid '+T.line}}><strong>{title(r)}</strong> · {(state.projects||[]).find(p=>String(p.id)===String(r.projectId))?.name||'Project'} · {r.assigneeName} <button type="button" style={buttonStyle} disabled={threadBusy} onClick={()=>changeThread(r,'read')}>Comments{own(r)?' / accept':''}</button> <button type="button" style={buttonStyle} disabled={assignmentBusy} onClick={()=>chooseAssignee(r)}>Assign work</button></div>)}</>}
 </section>}
 {assignment&&<section style={{...panel,marginBottom:14}} aria-label="Assign work"><h3>Assign · {title(assignment.row)}</h3>{assignmentBusy?<p>Updating…</p>:assignment.people.length?<select aria-label="Assignee" value={assignment.id} onChange={e=>setAssignment({...assignment,id:e.target.value})}><option value="">Select team member</option>{assignment.people.map(m=><option key={m.userId} value={m.userId}>{m.name}</option>)}</select>:<p>No eligible direct reports or project members for this task.</p>} <button type="button" style={buttonStyle} disabled={assignmentBusy||!assignment.id} onClick={assign}>Assign</button> <button type="button" style={buttonStyle} disabled={assignmentBusy} onClick={()=>setAssignment(null)}>Cancel</button></section>}
 {thread&&<div style={{position:'fixed',inset:0,zIndex:15000,display:'grid',placeItems:'center',padding:16,background:'#08192d77'}}><section role="dialog" aria-modal="true" aria-label="Assigned work comments" style={{...panel,width:'min(600px,100%)',boxSizing:'border-box',maxHeight:'90vh',overflow:'auto'}}>
 <h2>{title(thread.row)}</h2>{threadBusy&&<p role="status">Updating…</p>}{threadError&&<p role="alert">{threadError}</p>}
 {thread.acceptedAt?<p>Accepted by {thread.acceptedBy} · {stamp(thread.acceptedAt)}</p>:thread.canAccept&&<button type="button" style={buttonStyle} disabled={threadBusy} onClick={()=>changeThread(thread.row,'accept')}>Accept assignment</button>}
 <h3>Comments and questions</h3>{(thread.comments||[]).map(c=><div key={c.id} style={{borderTop:'1px solid '+T.line,padding:'8px 0'}}><strong>{c.author}</strong> · {day(new Date(c.at))} {stamp(c.at)}<p style={{whiteSpace:'pre-wrap',overflowWrap:'anywhere'}}>{c.text}</p></div>)}
 {thread.canComment&&<><label style={{display:'block'}}>Ask a question or leave a comment<textarea style={{display:'block',width:'100%',boxSizing:'border-box'}} value={comment} maxLength={2000} onChange={e=>setComment(e.target.value)}/></label><button type="button" style={buttonStyle} disabled={threadBusy||!comment.trim()} onClick={()=>changeThread(thread.row,'comment')}>Post comment</button>{' '}</>}
 <button type="button" style={buttonStyle} disabled={threadBusy} onClick={()=>setThread(null)}>Close</button></section></div>}
 <section className="studio-home-card" aria-label="My open tasks" style={{marginTop:14}}>
 <h2>{todayMine.length?"Today’s assigned work":"Unscheduled work"} · {homeTasks.length}</h2><p>{todayMine.length?"Work scheduled for today.":"No scheduled work today."}</p>
 {timerError&&<p role="alert" style={{color:T.redline}}>{timerError}</p>}
 {!filteredMine.length&&<p>{!ready?'Loading your tasks…':homeTasks.length?'No matching tasks.':'No tasks to show.'}</p>}
 {filteredMine.slice(0,taskLimit).map(r=><div key={r.designTaskId} className="studio-home-task-row"><div><strong>{title(r)}</strong><p>{[projectName(r),r.task?.floor,r.task?.area,r.status].filter(Boolean).join(' · ')}</p></div><div style={{display:'flex',gap:10,alignItems:'center'}}><span aria-label="Time logged" style={{fontVariantNumeric:'tabular-nums'}}>{elapsed(r)}</span><button type="button" style={buttonStyle} disabled={!!timerBusy||String(user?.appAccess).toLowerCase()==='viewer'} onClick={()=>timerAction(r)}>{timerBusy===r.designTaskId?'Updating…':running(r)?'Pause logging':/paused/i.test(r.status||'')?'Resume logging':'Start logging'}</button></div></div>)}
 {filteredMine.length>taskLimit&&<button type="button" style={buttonStyle} onClick={()=>setTaskLimit(n=>n+20)}>Show more tasks</button>}
 </section>
 <div className="studio-home-band"><div><p className="studio-home-kicker">01 / Performance</p><h2>Work overview</h2><p>{ready?(admin?'Studio tasks':'My tasks'):'Loading work…'}</p></div><div className="studio-home-period" role="group" aria-label="Chart period">{[['week','Weekly'],['month','Monthly']].map(([id,label])=><button type="button" aria-pressed={period===id} key={id} onClick={()=>setPeriod(id)}>{label}</button>)}</div></div>
 <WihMetrics tasks={work} now={clock} period={period} loading={!ready}/>
 <div className="studio-home-band"><div><p className="studio-home-kicker">02 / Daily plan</p><h2>Today’s work</h2></div></div><div className="studio-home-grid"><section className="studio-home-card"><h2>In progress</h2>{work.filter(r=>running(r)&&!done(r)).length?<ul>{work.filter(r=>running(r)&&!done(r)).map(r=><li key={r.designTaskId}>{title(r)} · {r.assigneeName||user?.name}</li>)}</ul>:<p>No work in progress.</p>}<button type="button" style={buttonStyle} onClick={()=>navigate('timesheet')}>Open Tasks</button></section>
 <section className="studio-home-card"><h2>Today’s schedule</h2>{ownSchedule.length?<ol>{ownSchedule.map((r,i)=><li key={i}>{r.time}{r.end?' – '+r.end:''} · {r.title}</li>)}</ol>:<p>No scheduled work today.</p>}
 <details className="studio-home-log"><summary>Log unrecorded time</summary>{(log?.entries||[]).map((r,i)=><p key={i}>{r.start} – {r.end} · {r.note}</p>)}<div style={{display:'flex',gap:8,flexWrap:'wrap'}}><label>From <input type="time" value={start} onChange={e=>setStart(e.target.value)}/></label><label>To <input type="time" value={end} onChange={e=>setEnd(e.target.value)}/></label></div><label style={{display:'block',margin:'8px 0'}}>Activity <input value={note} maxLength={250} onChange={e=>setNote(e.target.value)}/></label><button type="button" style={buttonStyle} disabled={busy||!log?.checkIn||!start||!end||!note.trim()} onClick={()=>save('entry')}>Log time</button></details></section>
 </div><TaskDiscussion request={request} buttonStyle={buttonStyle}/></main>;
}
