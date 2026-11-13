import React,{useRef,useState} from 'react';
import {dashboardReceivedPlan,completeDashboardReceivedUpload} from './dashboard-received-upload.js';
export default function DashboardReceivedUpload({projectId,selections,files,zones,onClear,onBusy,onSaved,services,today,buttonStyle,inputStyle,font}){
 const options=[...new Map(zones.map(z=>[JSON.stringify([z.floor,z.area||z.room]),{floor:z.floor,area:z.area||z.room,drawingType:selections[0].drawingType}])).values()];
 const [tags,setTags]=useState(()=>files.map(()=>selections));
 const [date,setDate]=useState(today),[busy,setBusy]=useState(false),[phase,setPhase]=useState(''),[errors,setErrors]=useState({}),[done,setDone]=useState([]);
 const jobs=useRef([]),lock=useRef(false);
 const submit=async()=>{
  if(lock.current)return;lock.current=true;setBusy(true);onBusy(true);
  const failed={},completed=[...done];let changed=false;
  try{
   for(const [i,file] of files.entries()){
    if(completed.includes(i))continue;
    try{
     const entry=jobs.current[i]??=( {id:'DRW-UPL-'+crypto.randomUUID(),plan:dashboardReceivedPlan(projectId,tags[i],file,date)} );
     await completeDashboardReceivedUpload(entry,file,services,msg=>setPhase(file.name+' · '+msg));
     completed.push(i);changed=true;setDone([...completed]);
    }catch(e){
     const job=jobs.current[i];
     if(job&&!job.saved&&/session.*expired|invalid or expired/i.test(e.message)){job.session=null;job.completion=null;job.transferStarted=false;job.directFailed=false;}
     failed[i]=e.message;
    }
   }
   if(changed){window.dispatchEvent(new CustomEvent('enlighten-received-saved',{detail:{projectId}}));await onSaved();}
   if(completed.length===files.length)onClear();
  }finally{setErrors(failed);setPhase('');lock.current=false;setBusy(false);onBusy(false);}
 };
 return <div style={{position:'fixed',inset:0,zIndex:15000,background:'rgba(8,25,45,.45)',display:'grid',placeItems:'center',padding:16}}><section role="dialog" aria-modal="true" aria-label="Upload received drawings" style={{width:'min(680px,100%)',maxHeight:'90vh',overflow:'auto',background:'#FAF9F5',padding:18,fontFamily:font,fontSize:13,boxSizing:'border-box'}}>
 <h3>Upload received drawings · {selections[0].drawingType}</h3>
 <label>Received date <input type="date" value={date} max={today} disabled={busy||jobs.current.some(Boolean)} onChange={e=>setDate(e.target.value)} style={{...inputStyle,width:150}}/></label>
 {files.map((file,i)=><fieldset key={i} style={{margin:'12px 0',minWidth:0,overflowWrap:'anywhere'}} disabled={busy||!!jobs.current[i]}><legend>{file.name}{done.includes(i)?' · Uploaded':''}</legend><div style={{maxHeight:150,overflow:'auto'}}>{options.map(z=>{
  const matches=v=>v.floor===z.floor&&v.area===z.area;
  return <label key={JSON.stringify(z)} style={{display:'block',padding:4}}><input type="checkbox" checked={tags[i].some(matches)} onChange={e=>{const checked=e.target.checked;setTags(list=>list.map((row,n)=>n!==i?row:checked?[...row,z]:row.filter(v=>!matches(v))));}}/> {z.floor} · {z.area}</label>;
 })}</div>{errors[i]&&<p role="alert">{errors[i]}</p>}</fieldset>)}
 {phase&&<p role="status">{phase}</p>}
 <div style={{position:'sticky',bottom:0,background:'#FAF9F5',padding:8,display:'flex',gap:8}}><button type="button" style={buttonStyle} disabled={busy} onClick={onClear}>{done.length?'Close':'Cancel'}</button><button type="button" style={buttonStyle} disabled={busy||!date||date>today||tags.some(row=>!row.length)} onClick={submit}>{busy?'Uploading…':Object.keys(errors).length?'Retry remaining files':files.length===1?'Upload drawing':'Upload '+files.length+' drawings'}</button></div>
 </section></div>;
}
