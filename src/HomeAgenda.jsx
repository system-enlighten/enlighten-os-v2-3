import React,{useEffect,useState} from 'react';

const time=value=>new Date(value).toLocaleTimeString('en-IN',{timeZone:'Asia/Kolkata',hour:'numeric',minute:'2-digit'});
const date=value=>new Date(value+'T12:00:00+05:30').toLocaleDateString('en-IN',{timeZone:'Asia/Kolkata',day:'numeric',month:'short'});
export function scheduledTime(value){
 const text=String(value??'').trim();
 if(!text)return '';
 if(/^\d{4}-\d{2}-\d{2}T/.test(text)){
  const timestamp=Date.parse(text);
  if(!Number.isFinite(timestamp))return '';
  // Sheets stores time-only cells on an 1899 date. Render them at the modern IST offset.
  return new Date(timestamp+330*60000).toLocaleTimeString('en-IN',{timeZone:'UTC',hour:'numeric',minute:'2-digit'});
 }
 return /^\d{1,2}:\d{2}(?::\d{2})?(?:\s*[ap]m)?$/i.test(text)?text:'';
}

export function editableTime(value){
 const text=scheduledTime(value);
 const match=text.match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*([ap]m)?$/i);
 if(!match)return '';
 const hours=match[3]?Number(match[1])%12+(match[3].toLowerCase()==='pm'?12:0):Number(match[1]);
 return String(hours).padStart(2,'0')+':'+match[2];
}

function nextStep(item){
 if(item.startAt)return ['end',item.site?'Check out from site':'End meeting'];
 if(item.site&&!item.departedAt)return ['depart','Leave for site'];
 return ['start',item.site?'Check in at site':'Start meeting'];
}

function captureSiteLocation(){
 return new Promise((resolve,reject)=>{
  if(!navigator.geolocation){reject(new Error('Location is unavailable in this browser.'));return;}
  navigator.geolocation.getCurrentPosition(({coords})=>resolve({
   latitude:coords.latitude,longitude:coords.longitude,accuracy:coords.accuracy
  }),()=>reject(new Error('Allow location access and try the site punch again.')),
  {enableHighAccuracy:true,timeout:15000,maximumAge:0});
 });
}

export default function HomeAgenda({request,buttonStyle,readOnly,day,onItemsChange}){
 const [items,setItems]=useState([]),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 const update=async(action='list',item)=>{
  setBusy(true);setError('');
  try{const location=item?.site&&['start','end'].includes(action)?await captureSiteLocation():undefined;const result=await request('homeAgenda',{action,id:item?.id,projectId:item?.projectId,location},'POST');setItems(result);onItemsChange?.(result);if(item?.site&&['start','end'].includes(action))window.dispatchEvent(new Event('enlighten-attendance-change'));}
  catch(e){setError(e.message);}
  finally{setBusy(false);}
 };
 useEffect(()=>{update();},[request,day]);
 if(!items.length&&!error)return null;
 return <section aria-label="Meetings and site visits" className="studio-home-agenda">
  
  {error&&<p role="alert">{error}</p>}
  {items.map(item=>{
   const [action,label]=nextStep(item);
   const today=item.availableToday!==false;
   const hours=[scheduledTime(item.time),scheduledTime(item.endTime)].filter(Boolean).join(' – ');
   const schedule=[today?'Today':date(item.day),hours].filter(Boolean).join(' · ');
   const key=item.projectId+':'+item.id;
   const address=item.projectName||item.title;
   if(item.site)return <div className="studio-home-attendance studio-home-site-card" key={key}>
    <div>
     <p className="studio-home-kicker">Site visit</p>
     <strong className="studio-site-address" title={address}>{address}</strong>
     <small>{schedule}{item.endAt?' · Checked out':''}</small>

    </div>
    {!readOnly&&item.canAct===true&&today&&!item.endAt
     ?<button type="button" className="studio-home-check" disabled={busy} onClick={()=>update(action,item)}>{label}</button>
     :!item.endAt&&<span className="studio-site-assignment">{item.assignee?<><span>Scheduled for</span>{' '}<span>{item.assignee}</span></>:'Visit lead not assigned'}</span>}
   </div>;
   return <article key={key}>
    <small>Meeting · {schedule}</small>
    <strong>{item.title}</strong>
    <p>{item.projectName}</p>
    {item.startAt&&<p>Started at {time(item.startAt)}</p>}
    {item.endAt&&<p>Ended at {time(item.endAt)}</p>}
    <div className="studio-home-agenda-actions">
     {today&&!readOnly&&!item.endAt&&<button type="button" style={buttonStyle} disabled={busy} onClick={()=>update(action,item)}>{label}</button>}
     {item.startAt&&!item.endAt&&/^https:\/\//i.test(item.link)&&<a href={item.link} target="_blank" rel="noopener noreferrer">Join meeting</a>}
    </div>
   </article>;
  })}
 </section>;
}
