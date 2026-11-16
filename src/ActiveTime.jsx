import React,{useEffect,useRef,useState} from 'react';

const titles={project:'Project',dashboard:'Dashboard',design:'Dashboard',wih:'WIH Sheet',drawingRegister:'Received / Sent',drive:'Drive',diary:'Diary',performance:'Performance',technical:'Technical Table',feedback:'Feedback'};
export function useActiveTime(userId,view,request){
 const current=useRef(view);current.current=view;
 useEffect(()=>{
  if(!userId||!navigator.locks||!crypto.randomUUID)return;
  const key='enlighten-active-time:'+userId;
  let lastInput=0,lastTick=Date.now(),pending={},seconds=0,flight=null,sending=false,closed=false,projectId='';
  const active=e=>{lastInput=Date.now();const row=e.target?.closest?.('[data-activity-project]');if(row)projectId=row.dataset.activityProject;};
  let section=view;
  const flush=async()=>{
   if(sending)return;
   if(!flight&&seconds){flight={batchId:crypto.randomUUID(),rows:Object.entries(pending).map(([key,seconds])=>{const [section,projectId]=JSON.parse(key);return {section,projectId,seconds};})};pending={};seconds=0;}
   if(!flight)return;
   sending=true;
   try{await request('logActiveTime',flight,'POST',20000);flight=null;}catch{}finally{sending=false;}
  };
  const tick=()=>{
   const now=Date.now(),elapsed=Math.min(5,Math.max(0,Math.floor((now-lastTick)/1000)));lastTick=now;
   if(section!==current.current){section=current.current;projectId='';}
   if(!elapsed||document.hidden||!document.hasFocus()||now-lastInput>60000||seconds>=115)return;
   const selected=projectId;
   navigator.locks.request(key,{ifAvailable:true},lock=>{
    if(!lock||closed||document.hidden||!document.hasFocus())return;
    try{const previous=Number(localStorage.getItem(key)||0);if(now-previous<4500)return;localStorage.setItem(key,String(now));}catch{return;}
    const id=JSON.stringify([section,selected]);pending[id]=(pending[id]||0)+elapsed;seconds+=elapsed;
   }).catch(()=>{});
  };
  const events=['pointerdown','keydown','wheel','touchstart','pointermove'];
  events.forEach(e=>window.addEventListener(e,active,{passive:true,capture:true}));
  const visibility=()=>{lastTick=Date.now();if(document.hidden)void flush();};
  document.addEventListener('visibilitychange',visibility);
  const sampler=setInterval(tick,5000),sender=setInterval(flush,30000);
  return()=>{closed=true;clearInterval(sampler);clearInterval(sender);document.removeEventListener('visibilitychange',visibility);events.forEach(e=>window.removeEventListener(e,active,true));};
 },[userId,request]);
}
export function ActiveTimeReport({request,projects,employee}){
 const [rows,setRows]=useState([]),[error,setError]=useState(''),[loading,setLoading]=useState(true),[revision,setRevision]=useState(0);
 useEffect(()=>{let live=true;setLoading(true);setError('');request('listActiveTime',{},'POST').then(data=>{if(live)setRows(Array.isArray(data)?data:[]);}).catch(e=>{if(live)setError(e.message);}).finally(()=>{if(live)setLoading(false);});return()=>{live=false;};},[request,revision]);
 const visible=rows.filter(r=>employee==='all'||String(r.userId)===String(employee));
 const duration=s=>s<60? s+' sec':Math.floor(s/3600)+' h '+Math.floor(s%3600/60)+' min';
 return <section aria-label="Active time in enLIGHTen OS" style={{margin:'0 0 24px',padding:12,border:'1px solid #d2cdc1'}}>
 <h3>Active time in enLIGHTen OS</h3><p>Last 30 days · Counts time in the focused app tab while you’re active. Pauses after one minute without interaction. WIH task timers are reported separately.</p>
 <button type="button" disabled={loading} onClick={()=>setRevision(n=>n+1)}>Refresh active time</button>
 {error&&<p role="alert">{error}</p>}{loading&&<p role="status">Loading activity…</p>}
 {!loading&&!error&&!visible.length&&<p>No active time recorded for this selection yet.</p>}
 {!!visible.length&&<div style={{overflowX:'auto'}}><table style={{width:'100%',textAlign:'left',borderCollapse:'collapse',fontSize:12}}><thead><tr>{['Team member','App section','Project','Active time'].map(h=><th key={h} style={{padding:8,background:'#d2cdc1'}}>{h}</th>)}</tr></thead><tbody>{visible.map(r=><tr key={JSON.stringify([r.userId,r.section,r.projectId])}>{[r.name,titles[r.section]||r.section,projects.find(p=>String(p.id)===String(r.projectId))?.name||(r.projectId?'Project':'—'),duration(r.seconds)].map((v,i)=><td key={i} style={{padding:8,borderBottom:'1px solid #d2cdc1'}}>{v}</td>)}</tr>)}</tbody></table></div>}
 </section>;
}
