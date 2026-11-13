import React,{useEffect,useState} from 'react';
import {dashboardReceivedPlan,completeDashboardReceivedUpload} from './dashboard-received-upload.js';
export default function DashboardReceivedUpload({projectId,selections,files,zones,generation,getGeneration,onClear,onSaved,services,today,buttonStyle,inputStyle,font}){
 const options=[...new Map(zones.map(z=>[JSON.stringify([z.floor,z.area||z.room]),{floor:z.floor,area:z.area||z.room,drawingType:selections[0].drawingType}])).values()];
 const [tags,setTags]=useState(()=>files.map(()=>selections));
 const [date,setDate]=useState(today),[error,setError]=useState('');
 const submit=()=>{
  try{
   const jobs=files.map((file,i)=>({file,entry:{id:'DRW-UPL-'+crypto.randomUUID(),plan:dashboardReceivedPlan(projectId,tags[i],file,date)},generation,getGeneration,services:Object.fromEntries(Object.entries(services).map(([k,fn])=>[k,(...args)=>{if(getGeneration()!==generation)throw Error("Sign-in changed.");return fn(...args);} ])),onSaved}));
   enqueue(jobs);onClear();
  }catch(e){setError(e.message);}
 };
 return <div style={{position:'fixed',inset:0,zIndex:15000,background:'rgba(8,25,45,.45)',display:'grid',placeItems:'center',padding:16}}><section role="dialog" aria-modal="true" aria-label="Upload received drawings" style={{width:'min(680px,100%)',maxHeight:'90vh',overflow:'auto',background:'#FAF9F5',padding:18,fontFamily:font,fontSize:13,boxSizing:'border-box'}}>
 <h3>Upload received drawings · {selections[0].drawingType}</h3>
 <label>Received date <input type="date" value={date} max={today}  onChange={e=>setDate(e.target.value)} style={{...inputStyle,width:150}}/></label>
 {files.map((file,i)=><fieldset key={i} style={{margin:'12px 0',minWidth:0,overflowWrap:'anywhere'}}><legend>{file.name}</legend><div style={{maxHeight:150,overflow:'auto'}}>{options.map(z=>{
  const matches=v=>v.floor===z.floor&&v.area===z.area;
  return <label key={JSON.stringify(z)} style={{display:'block',padding:4}}><input type="checkbox" checked={tags[i].some(matches)} onChange={e=>{const checked=e.target.checked;setTags(list=>list.map((row,n)=>n!==i?row:checked?[...row,z]:row.filter(v=>!matches(v))));}}/> {z.floor} · {z.area}</label>;
 })}</div></fieldset>)}
 {error&&<p role="alert">{error}</p>}
 <div style={{position:'sticky',bottom:0,background:'#FAF9F5',padding:8,display:'flex',gap:8}}><button type="button" style={buttonStyle} onClick={onClear}>Cancel</button><button type="button" style={buttonStyle} disabled={!date||date>today||tags.some(row=>!row.length)} onClick={submit}>{files.length===1?'Upload drawing':'Upload '+files.length+' drawings'}</button></div>
 </section></div>;
}

const queue=[];
const listeners=new Set();
let active=0,writeChain=Promise.resolve();
const publish=()=>listeners.forEach(fn=>fn([...queue]));
function enqueue(jobs){queue.push(...jobs.map(j=>({...j,status:'Waiting'})));publish();pump();}
function commit(work){const next=writeChain.then(work);writeChain=next.catch(()=>{});return next;}
function pump(){
 while(active<2){
  const job=queue.find(j=>j.status==='Waiting');if(!job)return;
  active++;job.status='Preparing';publish();
  completeDashboardReceivedUpload(job.entry,job.file,job.services,msg=>{job.status=msg;publish();},commit).then(()=>{
   job.status='Uploaded';job.finished=true;
   window.dispatchEvent(new CustomEvent('enlighten-received-saved',{detail:{projectId:job.entry.plan.metadata.projectId}}));
  }).catch(e=>{
   if(!job.entry.saved&&/session.*expired|invalid or expired/i.test(e.message)){job.entry.session=null;job.entry.completion=null;job.entry.transferStarted=false;job.entry.directFailed=false;}
   job.status=e.message;job.failed=true;
  }).finally(()=>{
   active--;publish();
   if(!active&&!queue.some(j=>j.status==='Waiting')&&queue.some(j=>j.finished&&!j.refreshed)){
    const refresh=new Map();for(const j of queue)if(j.finished&&!j.refreshed&&j.getGeneration()===j.generation){j.refreshed=true;refresh.set(j.entry.plan.metadata.projectId,j.onSaved);}
    for(const fn of refresh.values())Promise.resolve().then(fn).catch(()=>{});
   }
   pump();
  });
 }
}
export function DashboardUploadProgress({generation}){
 const [allJobs,setJobs]=useState(()=>[...queue]);
 useEffect(()=>{listeners.add(setJobs);return()=>listeners.delete(setJobs);},[]);
 const jobs=allJobs.filter(j=>j.generation===generation);
 if(!jobs.length)return null;
 const done=jobs.filter(j=>j.finished).length;
 return <details open style={{position:'fixed',right:12,bottom:12,zIndex:1200,width:'min(340px,90vw)',background:'#FAF9F5',border:'1px solid #D2CDC1',padding:10,fontSize:13,boxShadow:'0 2px 10px #0002'}}>
 <summary>Drawing uploads · {done}/{jobs.length} complete</summary>
 <p style={{margin:'6px 0'}}>You can keep working. Leave this tab open.</p>
 <div style={{maxHeight:'24vh',overflow:'auto'}}>{jobs.map(j=><div key={j.entry.id} style={{padding:'4px 0',overflowWrap:'anywhere'}}><strong>{j.file.name}</strong> · {j.status} {j.failed&&<button type="button" onClick={()=>{j.failed=false;j.status='Waiting';publish();pump();}}>Retry</button>}</div>)}</div>
 {done>0&&<button type="button" onClick={()=>{for(let i=queue.length-1;i>=0;i--)if(queue[i].finished)queue.splice(i,1);publish();}}>Clear completed</button>}
 </details>;
}
