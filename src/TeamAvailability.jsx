import React,{useEffect,useId,useRef,useState} from 'react';

import {createPortal} from 'react-dom';

const statuses=['Available','Busy','Offline'];

export default function TeamAvailability({request,department,buttonStyle}){
 const [state,setState]=useState(null),[error,setError]=useState(''),[saving,setSaving]=useState(false);
 const [expanded,setExpanded]=useState(false),panelId=useId();
 const toggleRef=useRef(null);
 const sequence=useRef(0),mutation=useRef(false);
 const load=async(action='list',busy)=>{
  if(action==='list'&&mutation.current)return;
  const revision=++sequence.current;
  try{
   const result=await request('teamAvailability',{action,department,busy},'POST');
   if(revision===sequence.current){setState(result);setError('');}
  }catch(e){if(revision===sequence.current)setError(e.message);}
 };
 useEffect(()=>{
  const refresh=()=>{if(document.visibilityState==='visible')load();};
  load();
  const timer=setInterval(refresh,30000);
  document.addEventListener('visibilitychange',refresh);
  window.addEventListener('enlighten-attendance-change',refresh);
  return ()=>{
   ++sequence.current;
   clearInterval(timer);
   document.removeEventListener('visibilitychange',refresh);
   window.removeEventListener('enlighten-attendance-change',refresh);
  };
 },[department,request]);
 const toggle=async()=>{
  if(mutation.current)return;
  mutation.current=true;setSaving(true);
  try{await load('setBusy',!state.busy);}
  finally{mutation.current=false;setSaving(false);}
 };
 return createPortal(<section className="studio-team-availability" aria-label="Team availability" onKeyDown={event=>{
  if(event.key==='Escape'&&expanded){event.stopPropagation();setExpanded(false);toggleRef.current?.focus();}
 }}>
  <button ref={toggleRef} type="button" className="studio-availability-toggle" aria-expanded={expanded} aria-controls={panelId} onClick={()=>setExpanded(!expanded)}>
   <span>Team availability</span>
   {state&&<small>{state.people.filter(person=>person.status==='Available').length} available</small>}
   <span aria-hidden="true">{expanded?'−':'⌃'}</span>
  </button>
  <div id={panelId} className="studio-availability-panel" hidden={!expanded}>
  <div className="studio-team-availability-header">
   <div>{state&&<p>Your status · <strong>{state.status}</strong>{state.busy&&" · Please don't disturb"}</p>}</div>
   {state?.canSet&&<button type="button" style={buttonStyle} disabled={saving} onClick={toggle}>{state.busy?'Clear busy status':'Set busy'}</button>}
  </div>
  {error&&<p role="alert">{error}</p>}
  {state?.people.length>0&&<div className="studio-availability-groups">{statuses.map(status=>{
   const members=state.people.filter(person=>person.status===status);
   return <details key={status} open={status!=='Offline'}><summary><span data-availability={status}/>{status} · {members.length}</summary>
    {members.length?<ul>{members.map(person=><li key={person.id}>{person.name}{person.department&&<small>{person.department}</small>}{person.note&&<small>{person.note}</small>}{person.activeWork?.map(task=><small className="studio-availability-active-work" key={task.id}><strong>Logging</strong> · {task.title}{task.project&&' · '+task.project}</small>)}</li>)}</ul>:<p>No teammates</p>}
   </details>;
  })}</div>}
  </div>
 </section>,document.body);
}
