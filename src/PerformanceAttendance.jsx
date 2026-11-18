import PersonalMeetingCalendar from './TimelineCalendar.jsx';
import StudioHeading from './StudioHeading.jsx';
import ManualWorkFields,{emptyWork,manualWorkLabel} from './ManualWorkFields.jsx';
import React,{useEffect,useState} from 'react';
import './Attendance.css';
const tz='Asia/Kolkata',today=()=>new Intl.DateTimeFormat('en-CA',{timeZone:tz,year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
const stamp=x=>x?new Date(x).toLocaleTimeString('en-IN',{timeZone:tz,hour:'numeric',minute:'2-digit'}):'—';
const dur=ms=>{const m=Math.floor(Math.max(0,ms)/60000);return m<60?m+' min':Math.floor(m/60)+' h'+(m%60?' '+m%60+' min':'');};
function totals(d){
 const points=[d.lo,d.hi,...[...d.breaks,...d.tracked,...d.entries].flatMap(x=>[x.start,x.end])].filter(x=>x>=d.lo&&x<=d.hi).sort((a,b)=>a-b),out={breaks:0,tracked:0,entries:0,gap:0,gaps:[],segments:[]};
 if(d.lo==null)return out;
 for(let i=1;i<points.length;i++){
  const a=points[i-1],b=points[i];if(b<=a)continue;
  const k=['breaks','tracked','entries'].find(k=>d[k].some(x=>x.start<b&&x.end>a))||'gap';out[k]+=b-a;out.segments.push({kind:k,start:a,end:b});
  if(k==='gap'){const last=out.gaps.at(-1);if(last?.end===a)last.end=b;else out.gaps.push({start:a,end:b});}
 }
 return out;
}
const categories={breaks:'Break',tracked:'Tracked work',entries:'Manual work',gap:'Untracked'};
export function missedCheckoutDay(value){
 const day=String(value||'');
 return /^\d{4}-\d{2}-\d{2}$/.test(day)&&day<today()?day:'';
}

export function MissedCheckoutNotice({day,onReview,buttonStyle}){
 const missed=missedCheckoutDay(day);
 return missed?<div className="studio-checkout-notice" role="status"><strong>Missed checkout · {dateLabel(missed)}</strong><button type="button" style={buttonStyle} onClick={()=>onReview(missed)}>Enter checkout time</button></div>:null;
}

const dateLabel=d=>{const date=new Date(String(d||'').slice(0,10)+'T12:00:00+05:30');return Number.isFinite(date.getTime())?date.toLocaleDateString('en-IN',{timeZone:tz,day:'numeric',month:'short',year:'numeric'}):'Date unavailable';};
export default function PerformanceAttendance({request,user,initialDay,calendarView}){
 const [tab,setTab]=useState('Day'),[day,setDay]=useState(initialDay||today),[uid,setUid]=useState(''),[data,setData]=useState(null),[people,setPeople]=useState([]);
 const [busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState(''),[start,setStart]=useState(''),[end,setEnd]=useState(''),[note,setNote]=useState(''),[reason,setReason]=useState(''),[checkout,setCheckout]=useState('');
 const [work,setWork]=useState(emptyWork);
 const [leave,setLeave]=useState([]),[from,setFrom]=useState(''),[to,setTo]=useState(''),[leaveReason,setLeaveReason]=useState('');
 const role=String(user?.appAccess).toLowerCase();
 const load=async(action='read',extra={})=>{
  setBusy(true);setError('');setNotice('');
  try{
   const result=await request('attendanceDay',{action,day,userId:uid,...extra},'POST');
   if(action.startsWith('leave')){setLeave(result);if(action==='leaveApply'){setFrom('');setTo('');setLeaveReason('');setNotice('Leave request submitted.');}if(action==='leaveReview')setNotice('Leave request updated.');}
   else{setData(result);setPeople(result.people);if(action==='confirmCheckout'){setCheckout('');setNotice('Checkout saved.');}if(action==='entry'){setStart('');setEnd('');setNote('');setWork(emptyWork);setNotice('Work time saved.');}if(action==='reopen')setReason('');}
  }catch(e){setError(e.message);}finally{setBusy(false);}
 };
 useEffect(()=>{if(tab==='Apply leave')load('leaveList');else if(tab==='Day'&&day){setData(null);setCheckout('');load();}},[tab,day,uid]);
 const missed=missedCheckoutDay(data?.missedDay);
 const t=data&&totals(data);
 const openDay=d=>{setDay(d);setTab('Day');};
 const submit=(action,fields)=>e=>{e.preventDefault();if(!busy)load(action,fields);};
 const lastDay=data?.recent.find(r=>r.day<today());
 return <main className="attendance"><StudioHeading title="Timeline"><div className="attendance-titleblock"><small>Time zone</small><strong>India Standard Time</strong></div></StudioHeading>
 <nav aria-label="Timeline views" data-sheet-tabs>{['Day','Calendar','Apply leave'].map(x=><button key={x} disabled={busy} aria-pressed={tab===x} onClick={()=>setTab(x)}>{x}</button>)}</nav>
 {error&&<p className="attendance-error" role="alert">{error}</p>}{notice&&<p role="status">{notice}</p>}{busy&&<p role="status">Updating attendance…</p>}
 {tab==='Calendar'&&(calendarView||<PersonalMeetingCalendar request={request} user={user}/>)}
 {tab==='Apply leave'&&<div className="attendance-columns"><section className="attendance-panel"><h2>Apply leave</h2>{role==='viewer'?<p>Leave requests are available to employee accounts.</p>:<form onSubmit={submit('leaveApply',{from,to,reason:leaveReason})}><div className="attendance-fields"><label>From<input required type="date" value={from} onChange={e=>setFrom(e.target.value)}/></label><label>To<input required type="date" min={from} value={to} onChange={e=>setTo(e.target.value)}/></label></div><label>Reason<textarea required maxLength={250} value={leaveReason} onChange={e=>setLeaveReason(e.target.value)}/></label><button className="attendance-primary" disabled={busy}>Submit request</button></form>}</section><section className="attendance-panel"><h2>{role==='admin'?'Leave requests':'My requests'}</h2>{leave.length===0&&<p>No requests yet.</p>}{leave.map(r=><article className="attendance-row" key={r.id}><div><strong>{dateLabel(r.from)} – {dateLabel(r.to)}</strong><p>{role==='admin'&&r.employee+' · '}{r.reason}</p><small>{r.status}</small></div>{role==='admin'&&r.status==='Pending'&&<div className="attendance-fields">{['Approved','Declined'].map(status=><button key={status} disabled={busy} onClick={()=>load('leaveReview',{id:r.id,status})}>{status==='Approved'?'Approve':'Decline'}</button>)}</div>}</article>)}</section></div>}
 {tab==='Day'&&<>
 <div className="attendance-filters">{tab==='Day'&&<label>Date<input required type="date" max={today()} value={day} disabled={busy} onChange={e=>e.target.value&&setDay(e.target.value)}/></label>}{people.length>0&&<label>Employee<select value={uid} disabled={busy} onChange={e=>setUid(e.target.value)}><option value="">My attendance</option>{people.filter(x=>x.id!==String(user?.userId)).map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select></label>}{lastDay&&<button disabled={busy} onClick={()=>openDay(lastDay.day)}>Last attendance day · {dateLabel(lastDay.day)}</button>}</div>
 {missed&&!(tab==='Day'&&data.pending)&&<aside className="attendance-warning" role="status"><strong>Checkout needs confirmation</strong><button onClick={()=>openDay(missed)}>Review {dateLabel(missed)}</button></aside>}

 {tab==='Day'&&data&&<>
 <section className="attendance-panel attendance-drawing">
  <h2>Site visits</h2>
  {!data.siteVisits?.length&&<p>No site visits recorded for this employee on this day.</p>}
  {data.siteVisits?.map(visit=><article className="attendance-row attendance-site-visit" key={visit.id}>
   <h3>{visit.projectName}{visit.title?' · '+visit.title:''}</h3>
   <dl>{[['Left for site',visit.departedAt],['Site check-in',visit.checkInAt,visit.checkInLocation],['Site checkout',visit.checkOutAt,visit.checkOutLocation]].map(([label,at,location],index)=><div key={label}>
    <dt>{label}</dt><dd>{at?stamp(at):'Not recorded'}</dd>
    {at&&index>0&&<dd>{location?<a target="_blank" rel="noopener noreferrer" href={`https://www.google.com/maps?q=${location.latitude},${location.longitude}`}>View location{location.accuracy!=null?` (±${location.accuracy} m)`:''}</a>:<small>Location not recorded</small>}</dd>}
   </div>)}</dl>
  </article>)}
 </section>
 {data.pending&&<aside className="attendance-warning" role="status"><div><strong>Missed checkout · {dateLabel(day)}</strong><p>Enter the time you left. Totals currently run through the last recorded activity.</p></div>{role!=='viewer'&&<form className="attendance-fields" onSubmit={submit('confirmCheckout',{end:checkout})}><label>Actual checkout<input type="time" required value={checkout} onChange={e=>setCheckout(e.target.value)}/></label><button className="attendance-primary" disabled={busy}>Confirm checkout</button></form>}</aside>}
 {data.lo==null?<section className="attendance-panel">No check-in recorded for this day.</section>:<>
 <section className="attendance-panel attendance-drawing"><header><h2>Day timeline</h2><time dateTime={day}>{dateLabel(day)}</time></header><div className="attendance-metrics">{[['Check-in',stamp(data.checkIn)],['Checkout',data.pending?'Pending':stamp(data.checkOut)],['On duty',dur(t.tracked+t.entries+t.gap)],...Object.entries(categories).map(([k,label])=>[label,dur(t[k])])].map(([label,value])=><div key={label}><small>{label}</small><strong>{value}</strong></div>)}</div>
 {t.segments.length>0?<><div className="attendance-track" aria-hidden="true">{t.segments.map(x=><span key={x.start} data-kind={x.kind} style={{flexGrow:x.end-x.start}} title={categories[x.kind]+': '+stamp(x.start)+' – '+stamp(x.end)}/>)}</div><div className="attendance-axis"><span>{stamp(data.lo)}</span><span>{stamp(data.hi)}{data.pending ? " · Last recorded activity" : ""}</span></div><div className="attendance-legend">{Object.entries(categories).map(([k,label])=><span key={k}><i data-kind={k}/>{label}</span>)}</div></>:<p>No elapsed time to show.</p>}</section>
 <div className="attendance-columns"><section className="attendance-panel"><h2>Work & breaks</h2>{[...data.tracked,...data.entries,...data.breaks.map(x=>({...x,title:'Break'}))].sort((a,b)=>a.start-b.start).map((x,i)=><article className="attendance-row attendance-log-row" key={i}><div><strong>{x.title||manualWorkLabel(x)}</strong><small>{stamp(x.start)} – {stamp(x.end)}</small></div><span>{dur(x.end-x.start)}</span></article>)}{!data.tracked.length&&!data.entries.length&&!data.breaks.length&&<p>No work or breaks recorded.</p>}</section>
 <section className="attendance-panel"><h2>Untracked time</h2>{t.gaps.map(x=><article className="attendance-row" key={x.start}><span>{stamp(x.start)} – {stamp(x.end)}</span><strong>{dur(x.end-x.start)}</strong></article>)}{!t.gaps.length&&<p>No untracked gaps.</p>}
 {!data.pending&&role!=='viewer'&&<form className="attendance-log-form" onSubmit={submit('entry',{start,end,note,...work})}><h3>Log work</h3><ManualWorkFields request={request} value={work} onChange={setWork}/><div className="attendance-fields"><label>From<input required type="time" value={start} onChange={e=>setStart(e.target.value)}/></label><label>To<input required type="time" value={end} onChange={e=>setEnd(e.target.value)}/></label></div><label>Activity<input required maxLength={250} value={note} onChange={e=>setNote(e.target.value)}/></label><button className="attendance-primary" disabled={busy}>Save time</button></form>}</section></div>
 </>}
 {data.admin&&data.checkOut&&<section className="attendance-panel"><h2>Correct a mistaken checkout</h2><form className="attendance-fields" onSubmit={submit('reopen',{reason})}><label>Reason<input required maxLength={250} value={reason} onChange={e=>setReason(e.target.value)}/></label><button disabled={busy}>Reopen day</button></form></section>}
 {data.history.length>0&&<section className="attendance-panel"><h2>Correction history</h2>{data.history.map((x,i)=><p key={i}>{x.by} · {x.action==='checkout'?'Confirmed checkout at '+stamp(x.checkout):'Reopened day · Previous checkout '+stamp(x.previous)} · {x.reason}</p>)}</section>}
 {<section className="attendance-panel"><h2>Recent punch records</h2>{!data.recent.length&&<p>No punch records yet.</p>}{data.recent.map(r=><article className="attendance-row" key={r.day}><div><strong>{dateLabel(r.day)}</strong><p>In {stamp(r.checkIn)} · Out {r.pending?'Needs confirmation':stamp(r.checkOut)}</p></div><button onClick={()=>openDay(r.day)}>View day</button></article>)}</section>}
 </>}
 </>}
 </main>;
}
