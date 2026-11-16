import React,{useState} from 'react';
import {voiceWorkIntent} from './voiceWorkIntent.mjs';
const scope='https://www.googleapis.com/auth/calendar.events.owned';
export default function AssistantWork({words,request,projects,user,buttonStyle,inputStyle}){
 const [review,setReview]=useState(null),[choice,setChoice]=useState(''),[pid,setPid]=useState(''),[title,setTitle]=useState(''),[busy,setBusy]=useState(false),[note,setNote]=useState('');
 const key='enlighten-work-calendar:'+user.userId;
 const [pending,setPending]=useState(()=>{try{return JSON.parse(localStorage.getItem(key)||'[]')}catch{return []}});
 const call=(command,params={})=>request('assistantWork',{command,...params},'POST');
 const prepare=async()=>{
  setBusy(true);setNote('');setReview(null);
  try{
   const intent=voiceWorkIntent(words);
   if(!intent)throw Error('Try “Start working on lighting layout”, “Pause logging”, or “Stop logging”.');
   const {tasks}=await call('list');
   const norm=s=>String(s).toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
   const candidates=tasks.filter(t=>intent.command==='start'||(intent.command==='resume'?/paused/i.test(t.status):/progress/i.test(t.status)||intent.command==='stop'&&/paused/i.test(t.status)));
   const matches=candidates.filter(t=>intent.title&&norm(t.title).includes(norm(intent.title)));
   if(!candidates.length&&intent.command!=='start')throw Error('No matching timer. Start or select a task first.');
   setReview({...intent,tasks:candidates,source:words});setChoice(matches.length===1?matches[0].id:candidates.length===1&&intent.command!=='start'?candidates[0].id:'');setTitle(intent.title);setPid(projects.length===1?projects[0].id:'');
  }catch(e){setNote(e.message)}finally{setBusy(false)}
 };
 const remember=items=>{setPending(items);try{localStorage.setItem(key,JSON.stringify(items));return true}catch{return false}};
 const confirm=async()=>{
  if(busy||!review||review.source!==words)return;
  setBusy(true);setNote('');
  try{
   const result=await call(review.command,choice?{id:choice}:{projectId:pid,title});
   const {task,segment}=result;
   if(segment){const saved=remember([...pending,{...segment,task}]);setNote('Saved '+segment.minutes+' min to your work log. '+(saved?'Sync to Google Calendar below.':'Keep this panel open until you sync to Calendar.'))}
   else setNote((/start|resume/.test(review.command)?'Timer running: ':review.command==='pause'?'Paused: ':'Stopped: ')+task.title);
   setReview(null);window.dispatchEvent(new Event('enlighten-assistant-work'));
  }catch(e){setNote(e.message)}finally{setBusy(false)}
 };
 const sync=async()=>{
  setBusy(true);setNote('');
  try{
   const r=await fetch('/api?action=authConfig',{credentials:'same-origin'}), cfg=await r.json();
   if(!window.google?.accounts?.oauth2||!cfg.data?.clientId)throw Error('Google Calendar connection is unavailable. Reload and try again.');
   const token=await new Promise((resolve,reject)=>{
    const client=window.google.accounts.oauth2.initTokenClient({client_id:cfg.data.clientId,scope:'openid email '+scope,login_hint:user.email,error_callback:()=>reject(Error('Google sign-in did not finish.')),callback:x=>x.access_token?resolve(x.access_token):reject(Error('Calendar permission was not granted.'))});
    client.requestAccessToken();
   });
   const headers={Authorization:'Bearer '+token,'Content-Type':'application/json'};
   const identity=await fetch('https://openidconnect.googleapis.com/v1/userinfo',{headers});const who=await identity.json();
   if(!identity.ok||who.email_verified!==true||String(who.email).toLowerCase()!==String(user.email).toLowerCase())throw Error('Connect the same Google account you use for enLIGHTen OS.');
   const base='https://www.googleapis.com/calendar/v3/calendars/primary/events';
   let remaining=[...pending];
   for(const x of pending){
    const hash=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(user.userId+'|'+x.task.id+'|'+x.start));
    const id='ew'+Array.from(new Uint8Array(hash),b=>b.toString(16).padStart(2,'0')).join('');
    const resp=await fetch(base+'?sendUpdates=none',{method:'POST',headers,body:JSON.stringify({id,summary:x.task.title,description:'enLIGHTen OS · '+x.minutes+' min logged',start:{dateTime:x.start},end:{dateTime:x.end},visibility:'private'})});
    if(!resp.ok&&resp.status!==409)throw Error('Calendar sync failed. Your work log is saved; retry here.');
    remaining=remaining.filter(i=>i!==x);remember(remaining);
   }
   setNote('Work sessions synced to your calendar.');
  }catch(e){setNote(e.message)}finally{setBusy(false)}
 };
 return <section style={{margin:'12px 0',padding:'12px 0',borderTop:'1px solid #d8d0bf'}}>
  <button type="button" style={buttonStyle} disabled={busy||!words.trim()} onClick={prepare}>Review voice action</button>
  {review&&review.source===words&&<div style={{display:'grid',gap:8,marginTop:8}}>
   <label>Task <select style={inputStyle} value={choice} onChange={e=>setChoice(e.target.value)}><option value="">{review.command==='start'?'Create a new task':'Choose a task'}</option>{review.tasks.map(t=><option key={t.id} value={t.id}>{t.title} · {projects.find(p=>String(p.id)===t.projectId)?.name||t.projectId}</option>)}</select></label>
   {!choice&&review.command==='start'&&<><label>Project <select style={inputStyle} value={pid} onChange={e=>setPid(e.target.value)}><option value="">Choose a project</option>{projects.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label><label>Task name <input style={inputStyle} maxLength={120} value={title} onChange={e=>setTitle(e.target.value)}/></label></>}
   <button type="button" style={buttonStyle} disabled={busy||!(choice||review.command==='start'&&pid&&title.trim())} onClick={confirm}>{review.command==='start'?(choice?'Start timer':'Create task and start'):review.command==='stop'?'Stop and save time':review.command==='pause'?'Pause and save time':'Resume timer'}</button>
  </div>}
  {pending.length>0&&<button type="button" style={buttonStyle} disabled={busy} onClick={sync}>Sync work to Google Calendar ({pending.length})</button>}
  {note&&<p role="status">{note}</p>}
 </section>;
}
