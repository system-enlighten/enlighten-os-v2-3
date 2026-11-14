import React,{useEffect,useState} from 'react';

const time=value=>new Date(value).toLocaleTimeString('en-IN',{timeZone:'Asia/Kolkata',hour:'numeric',minute:'2-digit'});
const date=value=>new Date(value+'T12:00:00+05:30').toLocaleDateString('en-IN',{timeZone:'Asia/Kolkata',day:'numeric',month:'short'});
function nextStep(item){
 if(item.startAt)return ['end',item.site?'Check out from site':'End meeting'];
 if(item.site&&!item.departedAt)return ['depart','Leave for site'];
 return ['start',item.site?'Check in at site':'Start meeting'];
}

export default function HomeAgenda({request,buttonStyle,readOnly,day}){
 const [items,setItems]=useState([]),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 const update=async(action='list',item)=>{
  setBusy(true);setError('');
  try{setItems(await request('homeAgenda',{action,id:item?.id,projectId:item?.projectId},'POST'));}
  catch(e){setError(e.message);}
  finally{setBusy(false);}
 };
 useEffect(()=>{update();},[request,day]);
 if(!items.length&&!error)return null;
 return <section aria-label="Meetings and site visits" className="studio-home-agenda">
  <h2>Meetings and site visits</h2>
  {error&&<p role="alert">{error}</p>}
  {items.map(item=>{
   const [action,label]=nextStep(item);
   const today=item.availableToday!==false;
   return <article key={item.projectId+':'+item.id}>
    <small>{item.site?'Site visit':'Meeting'} · {today?'Today':date(item.day)}{item.time?' · '+item.time:''}{item.endTime?' – '+item.endTime:''}</small>
    <strong>{item.title}</strong>
    <p>{item.projectName}</p>
    {item.departedAt&&<p>Left for site at {time(item.departedAt)}</p>}
    {item.startAt&&<p>{item.site?'Checked in':'Started'} at {time(item.startAt)}</p>}
    {item.endAt&&<p>{item.site?'Checked out':'Ended'} at {time(item.endAt)}</p>}
    <div className="studio-home-agenda-actions">
     {today&&!readOnly&&!item.endAt&&<button type="button" style={buttonStyle} disabled={busy} onClick={()=>update(action,item)}>{label}</button>}
     {!item.site&&item.startAt&&!item.endAt&&/^https:\/\//i.test(item.link)&&<a href={item.link} target="_blank" rel="noopener noreferrer">Join meeting</a>}
    </div>
   </article>;
  })}
 </section>;
}
