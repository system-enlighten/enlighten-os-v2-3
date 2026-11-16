import BriefingTimer from './BriefingTimer.jsx';
import TaskDiscussion from './TaskDiscussion.jsx';
import ManualWorkFields,{emptyWork,manualWorkLabel} from './ManualWorkFields.jsx';
import TeamAvailability from './TeamAvailability.jsx';
import {MissedCheckoutNotice} from './PerformanceAttendance.jsx';
import HomeAgenda,{scheduledTime} from './HomeAgenda.jsx';
const internalAreas={'__internal_os__':'Enlighten OS Development','__internal_center__':'Narayana Experience Center','__internal_ops__':'Studio Operations'};
import WihMetrics from './WihMetrics.jsx';
import './StudioHome.css';
import React,{useEffect,useState} from 'react';
const tz='Asia/Kolkata', day=d=>new Intl.DateTimeFormat('en-CA',{timeZone:tz,year:'numeric',month:'2-digit',day:'2-digit'}).format(d);
const stamp=t=>new Date(t).toLocaleTimeString('en-IN',{timeZone:tz,hour:'numeric',minute:'2-digit'});
const done=r=>/^(completed|done)$/i.test(r.status||r.task?.status||'');
const running=r=>/in.?progress|running/i.test(r.status||r.task?.status||'');
const title=r=>r.task?.taskType||r.title||'Work item';
const taskProjectId=r=>r.projectId||r.task?.projectId||'';
function groupPendingTasks(rows){
 const projects=new Map();
 for(const row of rows){
  const projectId=taskProjectId(row);
  const name=title(row).trim().replace(/^Bathroom Elevation Drawings$/i,'Bathroom Elevation');
  const key=name.toLowerCase();
  if(!projects.has(projectId))projects.set(projectId,new Map());
  const tasks=projects.get(projectId);
  if(!tasks.has(key))tasks.set(key,{key,name,rows:[]});
  tasks.get(key).rows.push(row);
 }
 return [...projects].map(([id,tasks])=>({id,tasks:[...tasks.values()]}));
}
const shiftDay=(value,days)=>{
 const date=new Date(value+'T12:00:00Z');
 date.setUTCDate(date.getUTCDate()+days);
 return date.toISOString().slice(0,10);
};
const firstDay=value=>shiftDay(value,-((new Date(value+'T12:00:00Z').getUTCDay()+6)%7));
const calendarLabel=(value,options)=>new Date(value+'T12:00:00Z').toLocaleDateString('en-IN',{timeZone:'UTC',...options});

export default function StudioHome({state,user,request,loadWork,navigate,theme:T,buttonStyle,assistant,onMissedCheckout}){
 const [agendaItems,setAgendaItems]=useState([]);
 const [areaRows,setAreaRows]=useState(null),[areaError,setAreaError]=useState('');
 useEffect(()=>{let live=true;request('internalAreas',{action:'list'},'POST').then(r=>{if(live)setAreaRows(r.areas);}).catch(e=>{if(live)setAreaError(e.message);});return()=>{live=false;};},[request]);
 const areaNames={...internalAreas,...Object.fromEntries((areaRows||[]).map(a=>[a.id,a.name]))};

 const [rows,setRows]=useState([]),[log,setLog]=useState(null),[error,setError]=useState(''),[busy,setBusy]=useState(false),[note,setNote]=useState(''),[start,setStart]=useState(''),[end,setEnd]=useState(''),[ready,setReady]=useState(false);
 const [manualWork,setManualWork]=useState(emptyWork),[manualOpen,setManualOpen]=useState(false);
 const [period,setPeriod]=useState('week'),[assignment,setAssignment]=useState(null),[assignmentBusy,setAssignmentBusy]=useState(false),[assigned,setAssigned]=useState(false),[thread,setThread]=useState(null),[comment,setComment]=useState(''),[threadBusy,setThreadBusy]=useState(false),[threadError,setThreadError]=useState('');
 const changeThread=async(row,action)=>{
  setThreadBusy(true);setThreadError('');
  if(action==='read'){setThread({row});setComment('');}
  try{const data=await request('assignedWorkThread',{designTaskId:row.designTaskId,action,comment:action==='comment'?comment:undefined},'POST');setThread({row,...data});if(action==='comment')setComment('');}
  catch(e){setThreadError(e.message);}finally{setThreadBusy(false);}
 };
 const today=day(new Date()),admin=String(user?.appAccess).toLowerCase()==='admin';
 useEffect(()=>{let live=true;loadWork().then(r=>{if(live){setRows(Array.isArray(r)?r:[]);setReady(true);}}).catch(e=>{if(live)setError(e.message);});request('getStudioDay',{},'POST').then(r=>{if(live)setLog(r);}).catch(e=>{if(live)setError(e.message);});return()=>{live=false;};},[request,loadWork]);
 const save=async(action)=>{if(busy)return;setBusy(true);setError('');try{setLog({...await request('saveStudioDay',{action,note,start,end,...(action==='entry'?manualWork:{})},'POST'),missedDay:log?.missedDay});window.dispatchEvent(new Event('enlighten-attendance-change'));if(action==='break'){try{const updated=await loadWork();if(Array.isArray(updated))setRows(updated);}catch{setError('Break saved. Refresh Home to update the task display.');}}if(action==='entry'){setNote('');setStart('');setEnd('');setManualWork(emptyWork);}}catch(e){setError(e.message);}finally{setBusy(false);}};
 const [timerBusy,setTimerBusy]=useState(''),[timerError,setTimerError]=useState(''),[clock,setClock]=useState(Date.now());
 const [weekOffset,setWeekOffset]=useState(0),[selectedDay,setSelectedDay]=useState('');
 useEffect(()=>{const tick=setInterval(()=>setClock(Date.now()),1000);return()=>clearInterval(tick);},[]);
 const [newTask,setNewTask]=useState(null),[creating,setCreating]=useState(false),[createNote,setCreateNote]=useState('');
 const createTask=async e=>{
  e.preventDefault();if(creating||!newTask?.projectId||!newTask.title.trim())return;
  setCreating(true);setCreateNote('');
  try{await request('assistantWork',{command:'create',title:newTask.title,projectId:newTask.projectId,narration:newTask.narration,activity:newTask.activity,requestId:newTask.id},'POST');setNewTask(null);setCreateNote('Task created.');}
  catch(e){setCreateNote(e.message);return;}
  finally{setCreating(false);}
  try{setRows(await loadWork());}catch{setCreateNote('Task saved. Reload Home to see it.');}
 };
 const timerAction=async(row,stop=false)=>{
  if(timerBusy)return;
  setTimerBusy(row.designTaskId);setTimerError('');
  const action=running(row)?'pauseTask':/paused/i.test(row.status||'')?'resumeTask':'startTask';
  try{if(stop||areaNames[row.projectId]||row.projectId==='__admin_work__')await request('assistantWork',{command:stop?'stop':{pauseTask:'pause',resumeTask:'resume',startTask:'start'}[action],id:row.designTaskId},'POST');else await request(action,{designTaskId:row.designTaskId},'POST');}
  catch(e){setTimerError(e.message);setTimerBusy('');return;}
  setRows(list=>list.map(r=>r.designTaskId===row.designTaskId?{...r,status:stop?'Ready':action==='pauseTask'?'Paused':'In Progress',startAt:stop||action==='pauseTask'?'':new Date().toISOString(),totalMinutes:Number(r.totalMinutes||0)+(action==='pauseTask'&&r.startAt?Math.max(0,Math.round((Date.now()-Date.parse(r.startAt))/60000)):0)}:r));
  try{const updated=await loadWork();if(Array.isArray(updated))setRows(updated);}catch{setTimerError('Timer updated. Refresh Home to check the latest saved totals.');}finally{setTimerBusy('');}
 };
 const own=r=>!!user?.userId&&String(r.assigneeUserId||'')===String(user?.userId);
 const work=admin?rows:rows.filter(own);
 const chooseAssignee=async row=>{setAssignment({row,people:[],id:''});setAssignmentBusy(true);setError('');try{const people=await request('reportingAssignment',{designTaskId:row.designTaskId,action:'options'},'POST');setAssignment({row,people,id:''});}catch(e){setError(e.message);}finally{setAssignmentBusy(false);}};
 useEffect(()=>{let active=true;const update=()=>loadWork().then(r=>{if(active&&Array.isArray(r))setRows(r);}).catch(e=>{if(active)setError(e.message);});window.addEventListener("enlighten-assistant-work",update);return()=>{active=false;window.removeEventListener("enlighten-assistant-work",update);};},[loadWork]);
 const assign=async()=>{setAssignmentBusy(true);setError('');try{await request('reportingAssignment',{designTaskId:assignment.row.designTaskId,action:'assign',assigneeUserId:assignment.id},'POST');setAssignment(null);setRows(await loadWork());}catch(e){setError(e.message);}finally{setAssignmentBusy(false);}};
 const projectName=r=>{
  const id=taskProjectId(r);
  return areaNames[id]||(id==='__admin_work__'?'Admin / Owner work':(state.projects||[]).find(p=>String(p.id)===String(id))?.name||'Project');
 };
 const openMine=rows.filter(r=>own(r)&&!done(r)).sort((a,b)=>Number(running(b))-Number(running(a)));
 const recent=rows.filter(r=>own(r)&&!running(r)&&!/paused/i.test(r.status||'')&&(r.task?.startedAt||r.startAt||r.stopAt)).sort((a,b)=>String(b.task?.completedAt||b.stopAt||b.startAt||'').localeCompare(String(a.task?.completedAt||a.stopAt||a.startAt||'')));
 const isWaiting=r=>!running(r)&&/blocked|on hold|waiting/i.test(r.status||r.task?.status||'');
 const weekStart=shiftDay(firstDay(today),weekOffset*7);
 const weekDays=Array.from({length:7},(_,index)=>shiftDay(weekStart,index));
 const activeDay=weekDays.includes(selectedDay)?selectedDay:weekDays.includes(today)?today:weekStart;
 const deadlineDate=row=>{
  const value=row.plan?.internalDueDate;
  if(typeof value==='string'&&/^\d{4}-\d{2}-\d{2}(?:$|T)/.test(value))return value.slice(0,10);
  return '';
 };
 const deadlinesByDay=new Map();
 for(const row of openMine){
  const date=deadlineDate(row);
  if(!date)continue;
  if(!deadlinesByDay.has(date))deadlinesByDay.set(date,[]);
  deadlinesByDay.get(date).push(row);
 }
 const agendaByDay=new Map();
 for(const item of agendaItems){
  if(item.endAt||item.site&&item.isAssignedToMe!==true)continue;
  if(!agendaByDay.has(item.day))agendaByDay.set(item.day,[]);
  agendaByDay.get(item.day).push(item);
 }
 const dailyAgenda=agendaByDay.get(activeDay)||[];
 const dailyDeadlines=deadlinesByDay.get(activeDay)||[];
 const overdueDeadlines=activeDay===today?[...deadlinesByDay].filter(([date])=>date<today).sort(([a],[b])=>a.localeCompare(b)).flatMap(([,tasks])=>tasks):[];
 const tomorrowDeadlines=activeDay===today?deadlinesByDay.get(shiftDay(today,1))||[]:[];
 const isInternal=r=>{
  const id=taskProjectId(r);
  return id==='__admin_work__'||String(id).startsWith('__internal_')||Object.hasOwn(areaNames,id)||r.task?.taskCategory==='Admin / Owner';
 };
 const isDiscussionArea=name=>String(name||'').trim().toLowerCase()==='discussion';
 const adminWork=work.filter(r=>!done(r)&&isInternal(r)&&!isDiscussionArea(projectName(r)))
  .sort((a,b)=>Number(running(b))-Number(running(a)));
 const pending=groupPendingTasks(work.filter(r=>!done(r)&&taskProjectId(r)&&!isInternal(r)));
 const elapsed=r=>{const startAt=Date.parse(r.startAt),seconds=Math.floor((Number(r.totalMinutes)||0)*60+(running(r)&&Number.isFinite(startAt)?Math.max(0,clock-startAt)/1000:0));return [Math.floor(seconds/3600),Math.floor(seconds/60)%60,seconds%60].map(v=>String(v).padStart(2,'0')).join(':');};
 const ownSchedule=rows.filter(r=>(admin||own(r))&&!done(r)&&r.plan?.plannedStart&&day(new Date(r.plan.plannedStart))===today).map(r=>({time:stamp(r.plan.plannedStart),end:r.plan.plannedEnd?stamp(r.plan.plannedEnd):'',title:title(r)}));
 const panel={background:'#fff',border:'1px solid '+T.line,padding:16,minWidth:0};
 const loggingButton=r=><button type="button" style={buttonStyle} title={!own(r)?'Only the assigned team member can log time':undefined} disabled={!own(r)||isWaiting(r)||busy||!!timerBusy||!!log?.breakStart&&!running(r)||String(user?.appAccess).toLowerCase()==='viewer'} onClick={()=>timerAction(r)}>{timerBusy===r.designTaskId?'Updating…':running(r)?'Pause logging':/paused/i.test(r.status||'')?'Resume logging':'Start logging'}</button>;
 const pendingRow=(r,label,showProject=true)=><div className="studio-home-task-row" key={r.designTaskId}><div><strong>{label}</strong><p>{[showProject&&projectName(r),r.assigneeName||'Unassigned',r.status,r.plan?.plannedStart&&day(new Date(r.plan.plannedStart))].filter(Boolean).join(' · ')}</p></div>{loggingButton(r)}</div>;
 const taskRow=r=>{
  const due=deadlineDate(r);
  return <div key={r.designTaskId} className="studio-home-task-row"><div><strong>{title(r)}</strong>{due&&<time dateTime={due} className={'studio-home-deadline'+(due<today?' is-overdue':'')}>Due {calendarLabel(due,{weekday:'short',day:'numeric',month:'short',year:'numeric'})}</time>}<p>{[projectName(r),isInternal(r)&&(r.assigneeName||'Unassigned'),r.task?.floor,r.task?.area,r.status].filter(Boolean).join(' · ')}</p>{['Admin / Owner','Meeting / Discussion'].includes(r.task?.taskCategory)&&r.task?.remarks&&<p style={{whiteSpace:'pre-wrap',overflowWrap:'anywhere'}}>{r.task.remarks}</p>}</div><div className="studio-home-task-controls"><span aria-label="Time logged" style={{fontVariantNumeric:'tabular-nums'}}>{elapsed(r)}</span>{loggingButton(r)}</div></div>;
 };
 return <main className="studio-home">
 <header className="studio-home-intro">
  <div><p className="studio-home-kicker">enLIGHTen / Studio desk</p><h1>{admin?'Studio overview':'My work'}</h1><p>{new Intl.DateTimeFormat('en-IN',{timeZone:tz,dateStyle:'full'}).format(new Date())}</p></div>
  <div className="studio-home-attendance-stack"><section aria-label="Attendance" className="studio-home-attendance">
   <div><p className="studio-home-kicker">Attendance</p><strong>{!log?'Attendance unavailable':log.checkOut?'Checked out':log.breakStart?'On break':log.checkIn?'Checked in':'Ready to check in'}</strong>{log?.checkIn&&<small>{stamp(log.checkIn)}{log.checkOut?' – '+stamp(log.checkOut):' · IST'}</small>}</div>
   <div style={{display:'grid',gap:6}}>
    {log?.checkIn&&!log.checkOut&&<button type="button" style={buttonStyle} disabled={busy} onClick={()=>save(log.breakStart?'resume':'break')}>{log.breakStart?'Resume work':'Pause for break'}</button>}
   <button type="button" className="studio-home-check" disabled={!log||busy||!!log.checkOut} onClick={()=>save(log.checkIn?'out':'in')}>{busy?'Saving…':log?.checkOut?'Day closed':log?.checkIn?'Check out':'Check in'}</button></div>
  </section>
  <MissedCheckoutNotice day={log?.missedDay} onReview={onMissedCheckout} buttonStyle={buttonStyle}/>
 <HomeAgenda onItemsChange={setAgendaItems} request={request} day={today} readOnly={String(user?.appAccess).toLowerCase()==="viewer"} buttonStyle={buttonStyle}/>
  <TeamAvailability request={request} department="studio" buttonStyle={buttonStyle}/>
  </div>
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
 <div className="studio-home-task-board"><section className="studio-home-card" aria-label="My open tasks">
 <div className="studio-home-task-board-heading"><h2>My tasks</h2>{/^(admin|user)$/i.test(user?.appAccess)&&<div className="studio-home-task-controls"><button type="button" style={buttonStyle} onClick={()=>{setCreateNote('');setNewTask({id:crypto.randomUUID(),title:'',projectId:'',narration:'',type:'client',activity:'Work'});}}>+ Create task</button><BriefingTimer request={request} buttonStyle={buttonStyle} onTimerChange={()=>loadWork().then(setRows).catch(e=>setError(e.message))}/></div>}</div>
 {newTask&&<div className="task-discussion-overlay"><section className="task-discussion-dialog studio-create-task" role="dialog" aria-modal="true" aria-labelledby="studio-create-title" onKeyDown={e=>{if(e.key==='Escape'&&!creating)setNewTask(null);}}><header><div><small>Work in Hand</small><h2 id="studio-create-title">Create task</h2><p>Assigned to you</p></div></header>
 <form onSubmit={createTask}>
 <label>Work type<select autoFocus value={newTask.type} onChange={e=>setNewTask({...newTask,type:e.target.value,projectId:''})}><option value="client">Client project</option><option value="internal">Admin / Internal work</option></select></label>
 <label>{newTask.type==='internal'?'Internal work area':'Project'}<select required value={newTask.projectId} onChange={e=>setNewTask({...newTask,projectId:e.target.value})}><option value="">Select an option</option>{(newTask.type==='internal'?(areaRows||[]).filter(a=>a.active).map(a=>[a.id,a.name]):(state.projects||[]).map(p=>[p.id,p.name])).map(([id,name])=><option key={id} value={id}>{name}</option>)}</select></label>
 {newTask.type==='internal'&&areaError&&<p role="alert">{areaError}</p>}<label>Activity<select value={newTask.activity} onChange={e=>setNewTask({...newTask,activity:e.target.value})}><option>Work</option><option>Meeting / Discussion</option></select></label>
 <label>Task name<input required maxLength={120} value={newTask.title} onChange={e=>setNewTask({...newTask,title:e.target.value})}/></label>
 <label>Narration <small>(optional)</small><textarea maxLength={2000} value={newTask.narration} onChange={e=>setNewTask({...newTask,narration:e.target.value})}/></label>
 {createNote&&<p role="alert">{createNote}</p>}<footer><button type="button" style={buttonStyle} disabled={creating} onClick={()=>setNewTask(null)}>Cancel</button><button style={buttonStyle} disabled={creating||!newTask.projectId||!newTask.title.trim()}>{creating?'Saving…':'Create task'}</button></footer>
 </form><section aria-label="Recent tasks"><h3>Recent tasks</h3>{!recent.length&&<p>No recent tasks yet.</p>}{recent.filter(r=>!newTask.projectId||String(r.projectId)===newTask.projectId).slice(0,8).map(r=><div className="studio-home-task-row" key={r.designTaskId}><div><strong>{title(r)}</strong><p>{projectName(r)}</p></div><button type="button" style={buttonStyle} disabled={creating||!!timerBusy} onClick={()=>{if(done(r)){setNewTask({...newTask,title:title(r),projectId:r.projectId,type:areaNames[r.projectId]?'internal':'client',activity:r.task?.taskCategory==='Meeting / Discussion'?'Meeting / Discussion':'Work'});}else{setNewTask(null);timerAction(r);}}}>{done(r)?'Use as template':'Start again'}</button></div>)}</section></section></div>}
 {!newTask&&createNote&&<p role="status">{createNote}</p>}
 {timerError&&<p role="alert" style={{color:T.redline}}>{timerError}</p>}
 {!ready&&<p>Loading your tasks…</p>}
 <section className="studio-home-task-group" aria-label="Weekly task deadlines">
 <div className="studio-home-task-board-heading"><h3>{calendarLabel(weekStart,{day:'numeric',month:'short'})} – {calendarLabel(weekDays[6],{day:'numeric',month:'short',year:'numeric'})}</h3><div className="studio-home-task-controls">
 <button type="button" style={buttonStyle} aria-label="Previous week" onClick={()=>setWeekOffset(n=>n-1)}>‹</button>
 <button type="button" style={buttonStyle} onClick={()=>{setWeekOffset(0);setSelectedDay(today);}}>This week</button>
 <button type="button" style={buttonStyle} aria-label="Next week" onClick={()=>setWeekOffset(n=>n+1)}>›</button></div></div>
 <div className="studio-week-calendar">{weekDays.map(date=>{
  const tasks=deadlinesByDay.get(date)||[];
  const events=agendaByDay.get(date)||[];
  return <button type="button" className="studio-week-day" key={date} aria-pressed={activeDay===date} aria-current={date===today?'date':undefined} onClick={()=>setSelectedDay(date)}>
   <span>{calendarLabel(date,{weekday:'short'})}</span><strong>{Number(date.slice(-2))}</strong><small>{tasks.length} {tasks.length===1?'task':'tasks'} due</small>{events.length>0&&<small>{events.length} {events.length===1?'event':'events'}</small>}
  </button>;
 })}</div>
 <h3>{calendarLabel(activeDay,{weekday:'long',day:'numeric',month:'short'})}</h3>
 {dailyDeadlines.length?dailyDeadlines.map(taskRow):ready&&<p>No tasks due on this day.</p>}
 {dailyAgenda.length>0&&<section aria-label="Scheduled meetings and site visits">
  <h3>Meetings and site visits</h3>
  {dailyAgenda.map(item=><div className="studio-home-task-row" key={item.projectId+':'+item.id}>
   <div><strong>{item.title||item.projectName}</strong>
   <p>{[item.site?'Site visit':'Meeting',[scheduledTime(item.time),scheduledTime(item.endTime)].filter(Boolean).join(' – '),item.projectName!==item.title&&item.title&&item.projectName].filter(Boolean).join(' · ')}</p></div>
  </div>)}
 </section>}
 {overdueDeadlines.length>0&&<section aria-label="Overdue tasks"><h3>Overdue · {overdueDeadlines.length}</h3>
  {overdueDeadlines.map(taskRow)}
 </section>}
 {tomorrowDeadlines.length>0&&<section aria-label="Due tomorrow"><h3>Due tomorrow · {tomorrowDeadlines.length}</h3>{tomorrowDeadlines.map(taskRow)}</section>}
 </section>
 {adminWork.length>0&&<section className="studio-home-task-group studio-home-admin" aria-label="Admin work">
 <div className="studio-home-list-scroll studio-home-admin-scroll" role="region" aria-label="Admin tasks" tabIndex={0}>{adminWork.map(taskRow)}</div>
 </section>}
 </section>
 <section className="studio-home-card" aria-label="Pending tasks">
 <h2>Pending tasks{ready?' · '+pending.reduce((count,project)=>count+project.tasks.length,0):''}</h2>
 {!ready?<p>Loading your tasks…</p>:!pending.length?<p>No pending tasks.</p>:
  <div className="studio-home-list-scroll studio-home-pending-scroll" role="region" aria-label="Pending tasks by project" tabIndex={0}>
   {pending.map(({id,tasks})=><section key={id} className="studio-home-pending-project">
    <h3>{projectName(tasks[0].rows[0])}</h3>
    {tasks.map(({key,name,rows})=>rows.length===1
     ? <React.Fragment key={key}>{pendingRow(rows[0],name,false)}</React.Fragment>
     : <details key={key} className="studio-home-task-group studio-home-pending-task">
      <summary>{name}</summary>
      {rows.map(r=>pendingRow(r,[r.task?.floor||r.floor,r.task?.area||r.area].filter(Boolean).join(' · ')||name,false))}
     </details>)}
   </section>)}
  </div>}
 </section></div>
 <div className="studio-home-band"><div><h2>Work overview</h2><p>{ready?(admin?'Studio tasks':'My tasks'):'Loading work…'}</p></div><div className="studio-home-period" role="group" aria-label="Chart period">{[['week','Weekly'],['month','Monthly']].map(([id,label])=><button type="button" aria-pressed={period===id} key={id} onClick={()=>setPeriod(id)}>{label}</button>)}</div></div>
 <WihMetrics compact tasks={work} now={clock} period={period} loading={!ready}/>
 <div className="studio-home-band"><div><h2>Today’s work</h2></div></div><div className="studio-home-grid"><section className="studio-home-card"><h2>In progress</h2>{work.filter(r=>running(r)&&!done(r)).length?<ul>{work.filter(r=>running(r)&&!done(r)).map(r=><li key={r.designTaskId}>{title(r)} · {r.assigneeName||user?.name}</li>)}</ul>:<p>No work in progress.</p>}<button type="button" style={buttonStyle} onClick={()=>navigate('timesheet')}>Open Tasks</button></section>
 <section className="studio-home-card"><h2>Today’s schedule</h2>{ownSchedule.length?<ol>{ownSchedule.map((r,i)=><li key={i}>{r.time}{r.end?' – '+r.end:''} · {r.title}</li>)}</ol>:<p>No scheduled work today.</p>}
 <details className="studio-home-log" onToggle={e=>setManualOpen(e.currentTarget.open)}><summary>Log unrecorded time</summary>{(log?.entries||[]).map((r,i)=><p key={i}>{r.start} – {r.end} · {manualWorkLabel(r)}</p>)}<div style={{display:'flex',gap:8,flexWrap:'wrap'}}><label>From <input type="time" value={start} onChange={e=>setStart(e.target.value)}/></label><label>To <input type="time" value={end} onChange={e=>setEnd(e.target.value)}/></label></div>{manualOpen&&<ManualWorkFields request={request} value={manualWork} onChange={setManualWork}/>}<label style={{display:'block',margin:'8px 0'}}>Activity <input value={note} maxLength={250} onChange={e=>setNote(e.target.value)}/></label><button type="button" style={buttonStyle} disabled={busy||!log?.checkIn||!start||!end||!manualWork.projectId||!manualWork.task.trim()||!note.trim()} onClick={()=>save('entry')}>Log time</button></details></section>
 </div><TaskDiscussion request={request} buttonStyle={buttonStyle} includeTasks recent/></main>;
}
