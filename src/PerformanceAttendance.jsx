import React,{useEffect,useState} from 'react';
const tz='Asia/Kolkata',today=()=>new Intl.DateTimeFormat('en-CA',{timeZone:tz,year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
const stamp=x=>x?new Date(x).toLocaleTimeString('en-IN',{timeZone:tz,hour:'numeric',minute:'2-digit'}):'—';
const dur=ms=>{const m=Math.floor(Math.max(0,ms)/60000);return Math.floor(m/60)+' h '+m%60+' min';};
function totals(d){
 const points=[d.lo,d.hi,...[...d.breaks,...d.tracked,...d.entries].flatMap(x=>[x.start,x.end])].filter(x=>x>=d.lo&&x<=d.hi).sort((a,b)=>a-b),out={breaks:0,tracked:0,entries:0,gap:0,gaps:[]};
 if(d.lo==null)return out;
 for(let i=1;i<points.length;i++){
  const a=points[i-1],b=points[i];if(b<=a)continue;
  const k=['breaks','tracked','entries'].find(k=>d[k].some(x=>x.start<b&&x.end>a))||'gap';out[k]+=b-a;
  if(k==='gap'){const last=out.gaps.at(-1);if(last?.end===a)last.end=b;else out.gaps.push({start:a,end:b});}
 }
 return out;
}
export default function PerformanceAttendance({request,user,buttonStyle,inputStyle}){
 const [day,setDay]=useState(today),[uid,setUid]=useState(''),[data,setData]=useState(null),[people,setPeople]=useState([]),[busy,setBusy]=useState(false),[error,setError]=useState(''),[start,setStart]=useState(''),[end,setEnd]=useState(''),[note,setNote]=useState(''),[reason,setReason]=useState('');
 const load=async(action='read')=>{setBusy(true);setError('');if(action==='read')setData(null);try{const d=await request('attendanceDay',{action,day,userId:uid,start,end,note,reason},'POST');setData(d);setPeople(d.people);if(action==='entry'){setStart('');setEnd('');setNote('');}if(action==='reopen')setReason('');}catch(e){setError(e.message);}finally{setBusy(false);}};
 useEffect(()=>{if(day)load();},[day,uid]);
 const t=data&&totals(data);
 return <section className="studio-home-card"><h2>Attendance</h2><div style={{display:'flex',gap:12,flexWrap:'wrap'}}><label>Date <input type="date" style={inputStyle} max={today()} value={day} disabled={busy} onChange={e=>setDay(e.target.value)}/></label>{people.length>0&&<label>Employee <select style={inputStyle} disabled={busy} value={uid} onChange={e=>setUid(e.target.value)}><option value="">My attendance</option>{people.filter(x=>x.id!==String(user?.userId)).map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select></label>}<button style={buttonStyle} disabled={busy||!day} onClick={()=>load()}>Refresh</button></div>
 {busy&&<p role="status">Updating attendance…</p>}{error&&<p role="alert">{error}</p>}
 {data&&<><p>Check-in: <strong>{stamp(data.checkIn)}</strong> · Check-out: <strong>{stamp(data.checkOut)}</strong> · IST</p>{data.lo==null?<p>No check-in recorded for this day.</p>:<div className="studio-home-grid">
 <section className="studio-home-card"><h3>Daily totals</h3><p>On duty: {dur(t.tracked+t.entries+t.gap)}</p><p>Breaks: {dur(t.breaks)}</p><p>Tracked work: {dur(t.tracked)}</p><p>Manual work: {dur(t.entries)}</p><p>Untracked: {dur(t.gap)}</p><h4>Untracked gaps</h4>{t.gaps.map(x=><p key={x.start}>{stamp(x.start)} – {stamp(x.end)} · {dur(x.end-x.start)}</p>)}</section>
 <section className="studio-home-card"><h3>Recorded work and breaks</h3>{[...data.tracked,...data.entries,...data.breaks.map(x=>({...x,title:'Break'}))].sort((a,b)=>a.start-b.start).map((x,i)=><p key={i}><strong>{x.title||x.note}</strong> · {stamp(x.start)} – {stamp(x.end)} · {dur(x.end-x.start)}{x.running?' · Running':''}</p>)}
 {String(user?.appAccess).toLowerCase()!=='viewer'&&<form onSubmit={e=>{e.preventDefault();if(!busy)load('entry');}}><h4>Log untracked time</h4><label>From <input required type="time" style={inputStyle} value={start} onChange={e=>setStart(e.target.value)}/></label><label>To <input required type="time" style={inputStyle} value={end} onChange={e=>setEnd(e.target.value)}/></label><label>Activity <input required maxLength={250} style={inputStyle} value={note} onChange={e=>setNote(e.target.value)}/></label><button style={buttonStyle} disabled={busy||!note.trim()}>Save time</button></form>}</section></div>}
 {data.admin&&data.checkOut&&<form onSubmit={e=>{e.preventDefault();if(!busy&&reason.trim())load('reopen');}}><h3>Correct a mistaken checkout</h3><label>Reason <input required maxLength={250} style={inputStyle} value={reason} onChange={e=>setReason(e.target.value)}/></label><button style={buttonStyle} disabled={busy||!reason.trim()}>Reopen day</button></form>}
 {data.history.length>0&&<section><h3>Correction history</h3>{data.history.map((x,i)=><p key={i}>{x.by} reopened the day at {stamp(x.at)} · Previous checkout: {stamp(x.previous)} · {x.reason}</p>)}</section>}</>}
 </section>;
}
