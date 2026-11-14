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
export function DepartmentPicker({choose}){return <main className="studio-home" style={{padding:28}}><h1>Choose a department</h1><div className="studio-home-grid">{Object.entries(departments).map(([id,[name]])=><button key={id} className="studio-home-card" style={{textAlign:'left',font:'inherit',cursor:'pointer'}} onClick={()=>choose(id)}>{name}</button>)}</div></main>;}
export function DepartmentWorkspace({id,user,request,buttonStyle,inputStyle,switchDepartment}){
 const [page,setPage]=useState('Home'),[log,setLog]=useState(null),[team,setTeam]=useState(null),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 const load=async(action)=>{setBusy(true);setError('');try{setLog(await request(action?'saveStudioDay':'getStudioDay',action?{action}:{},'POST'));}catch(e){setError(e.message);}finally{setBusy(false);}};
 useEffect(()=>{load();},[id]);
 useEffect(()=>{if(page==='Team & Tasks')request('departmentTeam',{department:id},'POST').then(setTeam).catch(e=>setError(e.message));},[page,id]);
 const fmt=s=>new Date(s).toLocaleTimeString('en-IN',{timeZone:'Asia/Kolkata',hour:'numeric',minute:'2-digit'});
 return <div style={{display:'flex',flexWrap:'wrap',minHeight:560,background:'#f4f0e6',fontFamily:'Inter,system-ui,sans-serif'}}><aside style={{background:'#102235',color:'#fff',padding:20,minWidth:190}}><strong>{departments[id][0]}</strong><nav style={{display:'grid',gap:8,marginTop:16}}>{['Home','Team & Tasks','Performance',...departments[id][1]].map(x=><button key={x} style={buttonStyle} aria-current={page===x?'page':undefined} onClick={()=>{setError('');setPage(x);}}>{x}</button>)}{switchDepartment&&<button style={buttonStyle} onClick={switchDepartment}>Switch department</button>}</nav></aside><main className="studio-home" style={{flex:'1 1 420px',minWidth:0,padding:24}}><h1>{page==='Home'?departments[id][0]:page}</h1>{error&&<p role="alert">{error}</p>}
 {page==='Home'&&<section className="studio-home-attendance"><div><strong>Attendance</strong><p>{!log?'Loading attendance…':log.checkOut?'Checked out':log.breakStart?'On break':log.checkIn?'Checked in':'Ready to check in'}</p>{log?.checkIn&&<p>{fmt(log.checkIn)}{log.checkOut?' – '+fmt(log.checkOut):''} · IST</p>}</div><div>{log?.checkIn&&!log.checkOut&&<button style={buttonStyle} disabled={busy} onClick={()=>load(log.breakStart?'resume':'break')}>{log.breakStart?'Resume work':'Pause for break'}</button>} <button style={buttonStyle} disabled={!log||busy||!!log.checkOut} onClick={()=>load(log.checkIn?'out':'in')}>{log?.checkOut?'Day closed':log?.checkIn?'Check out':'Check in'}</button></div></section>}
 {['Performance','Attendance'].includes(page)&&<PerformanceAttendance request={request} user={user} buttonStyle={buttonStyle} inputStyle={inputStyle}/>}
 {page==='Team & Tasks'&&<section className="studio-home-card">{!team&&!error&&<p>Loading department team…</p>}{team&&<><h2>People</h2>{team.people.length?team.people.map(p=><p key={p.id}>{p.name} · {p.role||'Team member'}</p>):<p>No employees assigned to this department.</p>}<h2>Tasks</h2>{team.tasks.length?team.tasks.map(t=><p key={t.id}>{t.title} · {t.status}</p>):<p>No tasks to show.</p>}</>}</section>}
 {!['Home','Performance','Attendance','Team & Tasks'].includes(page)&&<p>This section is reserved for the department’s next workflow update.</p>}</main></div>;
}
