import React,{useEffect,useState} from 'react';
const time=v=>new Date(v).toLocaleTimeString('en-IN',{timeZone:'Asia/Kolkata',hour:'numeric',minute:'2-digit'});
export default function HomeAgenda({request,buttonStyle,readOnly,day}){
 const [items,setItems]=useState([]),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 const update=async(action='list',item)=>{setBusy(true);setError('');try{setItems(await request('homeAgenda',{action,id:item?.id,projectId:item?.projectId},'POST'));}catch(e){setError(e.message);}finally{setBusy(false);}};
 useEffect(()=>{update();},[request,day]);
 if(!items.length&&!error)return null;
 return <section aria-label="Today’s meetings and site visits" style={{gridColumn:'1/-1'}} className="studio-home-card"><h2>Today’s meetings and site visits</h2>{error&&<p role="alert">{error}</p>}{items.map(x=><div className="studio-home-task-row" key={x.projectId+':'+x.id}><div><small>{x.site?'Site visit':'Meeting'}{x.time?' · '+x.time:''}{x.endTime?' – '+x.endTime:''}</small><div><strong>{x.title}</strong> · {x.projectName}</div>{x.startAt&&<p>{x.site?'Checked in':'Started'} at {time(x.startAt)}{x.endAt?' · '+(x.site?'Checked out':'Ended')+' at '+time(x.endAt):''}</p>}</div><div>{!readOnly&&!x.endAt&&<button type="button" style={buttonStyle} disabled={busy} onClick={()=>update(x.startAt?'end':'start',x)}>{x.site?(x.startAt?'Check out from site':'Check in at site'):(x.startAt?'End meeting':'Start meeting')}</button>}{!x.site&&x.startAt&&!x.endAt&&/^https:\/\//i.test(x.link)&&<a style={{marginLeft:8}} href={x.link} target="_blank" rel="noopener noreferrer">Join meeting</a>}</div></div>)}</section>;
}
