import './DepartmentDirectory.css';
import React,{useEffect,useState} from 'react';
import PerformanceAttendance from './PerformanceAttendance.jsx';
export const departments={
 studio:['Studio · Operations',[]],
 sales:['Business Development & Sales',['CRM','Design Sales']],
 marketing:['Marketing · Document & Showcase',['Project journals','Narratives','Showcase']],
 accounts:['Accounts',['Attendance','Payroll','Expenses','GST & Compliance']],
 legal:['Legal & Contracts',['Contracts','Policies','Renewals']],
 hr:['HR & Team Building',['Onboarding','Training modules']]
};
export function departmentFor(name){const s=String(name||'').toLowerCase();return /account|finance/.test(s)?'accounts':/legal|contract/.test(s)?'legal':/marketing|showcase/.test(s)?'marketing':/\bhr\b|human resources|team building/.test(s)?'hr':/sales|business development/.test(s)?'sales':'studio';}
const labels={studio:'Projects, drawings and delivery',sales:'Relationships and design opportunities',marketing:'Project narratives and showcase',accounts:'Attendance and finance',legal:'Contracts and policies',hr:'People and learning'};
export function DepartmentPicker({choose,directory=departments}){
 return <main className="department-directory"><header><span>enLIGHTen OS / WORKSPACE INDEX</span><h1>Choose a department</h1><p>Open the workspace you want to work in.</p></header><div className="department-grid">{Object.entries(directory).map(([id,[name]],i)=><button type="button" key={id} onClick={()=>choose(id)}><span className="department-number">{String(i+1).padStart(2,'0')} / {id.toUpperCase()}</span><svg viewBox="0 0 60 44" width="60" height="44" aria-hidden="true" fill="none" stroke="currentColor"><path d={['M3 40V8h45v32H3m0-16h45M22 8v32','M5 40L30 6l25 34H5m10-12h30','M3 39h53V7H3v32m8-7L34 13l15 19','M6 38h48M9 31V12h10v19m8 0V6h10v25m8 0V19h10v12','M5 38h50M9 34V17l21-11 21 11v17M22 34V18m16 16V18','M7 39V10h46v29M7 25h46M23 10v29m13-29v29'][Object.keys(departments).indexOf(id)]}/></svg><strong>{name}</strong><small>{labels[id]}</small><span className="department-arrow" aria-hidden="true">↗</span></button>)}</div></main>;
}
export function DepartmentWorkspace({id,name=departments[id][0],user,request,buttonStyle,inputStyle,switchDepartment}){
 const [page,setPage]=useState('Home'),[log,setLog]=useState(null),[team,setTeam]=useState(null),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 const load=async(action)=>{setBusy(true);setError('');try{setLog(await request(action?'saveStudioDay':'getStudioDay',action?{action}:{},'POST'));}catch(e){setError(e.message);}finally{setBusy(false);}};
 useEffect(()=>{load();},[id]);
 useEffect(()=>{if(page==='Team & Tasks')request('departmentTeam',{department:id},'POST').then(setTeam).catch(e=>setError(e.message));},[page,id]);
 const fmt=s=>new Date(s).toLocaleTimeString('en-IN',{timeZone:'Asia/Kolkata',hour:'numeric',minute:'2-digit'});
 return <div style={{display:'flex',flexWrap:'wrap',minHeight:560,background:'#f4f0e6',fontFamily:'Inter,system-ui,sans-serif'}}><aside style={{background:'#102235',color:'#fff',padding:20,minWidth:190}}><DepartmentHeading name={name} onChoose={switchDepartment}/><nav style={{display:'grid',gap:8,marginTop:16}}>{['Home','Team & Tasks','Performance',...departments[id][1]].map(x=><button key={x} style={buttonStyle} aria-current={page===x?'page':undefined} onClick={()=>{setError('');setPage(x);}}>{x}</button>)}</nav></aside><main className="studio-home" style={{flex:'1 1 420px',minWidth:0,padding:24}}><h1>{page==='Home'?name:page}</h1>{error&&<p role="alert">{error}</p>}
 {page==='Home'&&<section className="studio-home-attendance"><div><strong>Attendance</strong><p>{!log?'Loading attendance…':log.checkOut?'Checked out':log.breakStart?'On break':log.checkIn?'Checked in':'Ready to check in'}</p>{log?.checkIn&&<p>{fmt(log.checkIn)}{log.checkOut?' – '+fmt(log.checkOut):''} · IST</p>}</div><div>{log?.checkIn&&!log.checkOut&&<button style={buttonStyle} disabled={busy} onClick={()=>load(log.breakStart?'resume':'break')}>{log.breakStart?'Resume work':'Pause for break'}</button>} <button style={buttonStyle} disabled={!log||busy||!!log.checkOut} onClick={()=>load(log.checkIn?'out':'in')}>{log?.checkOut?'Day closed':log?.checkIn?'Check out':'Check in'}</button></div></section>}
 {['Performance','Attendance'].includes(page)&&<PerformanceAttendance request={request} user={user} buttonStyle={buttonStyle} inputStyle={inputStyle}/>}
 {page==='Team & Tasks'&&<section className="studio-home-card">{!team&&!error&&<p>Loading department team…</p>}{team&&<><h2>People</h2>{team.people.length?team.people.map(p=><p key={p.id}>{p.name} · {p.role||'Team member'}</p>):<p>No employees assigned to this department.</p>}<h2>Tasks</h2>{team.tasks.length?team.tasks.map(t=><p key={t.id}>{t.title} · {t.status}</p>):<p>No tasks to show.</p>}</>}</section>}
 {!['Home','Performance','Attendance','Team & Tasks'].includes(page)&&<p>This section is reserved for the department’s next workflow update.</p>}</main></div>;
}

export function DepartmentHeading({name,onChoose}){
 return onChoose?<button type="button" onClick={onChoose} aria-label={name+' — choose a department'} style={{border:0,padding:0,background:'transparent',color:'inherit',font:'inherit',fontWeight:650,textAlign:'left',cursor:'pointer',display:'inline-flex',alignItems:'center',gap:6}}>{name}</button>:<strong>{name}</strong>;
}
