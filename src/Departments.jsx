import Accounts, {accountsPages} from './Accounts.jsx';
import TeamAvailability from './TeamAvailability.jsx';
import './DepartmentDirectory.css';
import React,{useCallback,useEffect,useState} from 'react';
import {BookOpen, Calendar, ChartBar, ClipboardList, FileText, Landmark, Receipt, Users, Wallet} from 'lucide-react';
import PerformanceAttendance,{MissedCheckoutNotice} from './PerformanceAttendance.jsx';
export const departments={
 studio:['Studio · Operations',[]],
 sales:['Business Development & Sales',['CRM','Design Sales']],
 marketing:['Marketing · Document & Showcase',['Project journals','Narratives','Showcase']],
 accounts:['Accounts',accountsPages],
 legal:['Legal & Contracts',['Contracts','Policies','Renewals']],
 hr:['HR & Team Building',['Onboarding','Training modules']]
};
export function departmentFor(name){const s=String(name||'').toLowerCase();return /account|finance/.test(s)?'accounts':/legal|contract/.test(s)?'legal':/marketing|showcase/.test(s)?'marketing':/\bhr\b|human resources|team building/.test(s)?'hr':/sales|business development/.test(s)?'sales':'studio';}
const labels={studio:'Projects, drawings and delivery',sales:'Relationships and design opportunities',marketing:'Project narratives and showcase',accounts:'Attendance and finance',legal:'Contracts and policies',hr:'People and learning'};
export function DepartmentPicker({choose,directory=departments}){
 return <main className="department-directory"><header><span>enLIGHTen OS / WORKSPACE INDEX</span><h1>Choose a department</h1><p>Open the workspace you want to work in.</p></header><div className="department-grid">{Object.entries(directory).map(([id,[name]],i)=><button type="button" key={id} onClick={()=>choose(id)}><span className="department-number">{String(i+1).padStart(2,'0')} / {id.toUpperCase()}</span><svg viewBox="0 0 60 44" width="60" height="44" aria-hidden="true" fill="none" stroke="currentColor"><path d={['M3 40V8h45v32H3m0-16h45M22 8v32','M5 40L30 6l25 34H5m10-12h30','M3 39h53V7H3v32m8-7L34 13l15 19','M6 38h48M9 31V12h10v19m8 0V6h10v25m8 0V19h10v12','M5 38h50M9 34V17l21-11 21 11v17M22 34V18m16 16V18','M7 39V10h46v29M7 25h46M23 10v29m13-29v29'][Object.keys(departments).indexOf(id)]}/></svg><strong>{name}</strong><small>{labels[id]}</small><span className="department-arrow" aria-hidden="true">↗</span></button>)}</div></main>;
}
const accountsNavigation=[
 {id:'Payment Dashboard',label:'Payment Dashboard',group:'BILLING',icon:Wallet},
 {id:'Invoicing',label:'Invoicing',group:'BILLING',icon:FileText},
 {id:'Debit / Credit',label:'Debit / Credit',group:'BOOKKEEPING',icon:Receipt},
 {id:'Reconciliation',label:'Reconciliation',group:'BOOKKEEPING',icon:Landmark},
 {id:'Chart of Accounts',label:'Chart of Accounts',group:'BOOKKEEPING',icon:BookOpen},
 {id:'Financial Reports',label:'Financial Reports',group:'BOOKKEEPING',icon:ChartBar},
 {id:'Payroll',label:'Payroll',group:'PEOPLE',icon:Users},
 {id:'Performance',label:'Performance',group:'PEOPLE',icon:ChartBar},
 {id:'Timeline',label:'Timeline',group:'PEOPLE',icon:Calendar},
 {id:'Team & Tasks',label:'Team & Tasks',group:'PEOPLE',icon:ClipboardList},
];

export function DepartmentWorkspace({id,name=departments[id][0],user,request:apiRequest,buttonStyle,switchDepartment,PerformanceView,performanceState,WorkspaceShell}){
 const [attendanceDay,setAttendanceDay]=useState('');
 const [page,setPage]=useState('Home'),[log,setLog]=useState(null),[team,setTeam]=useState(null),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 const isAccounts=id==='accounts';
 const activityPage=isAccounts?'accounts:'+page:undefined;
 const request=useCallback((action,payload,method,timeout)=>apiRequest(action,payload,method,timeout,activityPage),[apiRequest,activityPage]);
 const load=async(action)=>{setBusy(true);setError('');try{const result=await request(action?'saveStudioDay':'getStudioDay',action?{action}:{},'POST');setLog(action?{...result,missedDay:log?.missedDay}:result);if(action)window.dispatchEvent(new Event('enlighten-attendance-change'));}catch(e){setError(e.message);}finally{setBusy(false);}};
 useEffect(()=>{if(page==='Home')load();},[id,page]);
 useEffect(()=>{if(page==='Team & Tasks')request('departmentTeam',{department:id},'POST').then(setTeam).catch(e=>setError(e.message));},[page,id]);
 const go=next=>{setError('');setAttendanceDay('');setPage(next);};
 const fmt=s=>new Date(s).toLocaleTimeString('en-IN',{timeZone:'Asia/Kolkata',hour:'numeric',minute:'2-digit'});
 const content=<>
 {page!=='Timeline'&&(!isAccounts||page!=='Performance')&&<h1 className={isAccounts?'studio-page-heading':undefined}>{page==='Home'?name:page}</h1>}
 {error&&<p role="alert">{error}</p>}
 {page==='Home'&&<section className="studio-home-attendance"><div><strong>Attendance</strong><p>{!log?'Loading attendance…':log.checkOut?'Checked out':log.breakStart?'On break':log.checkIn?'Checked in':'Ready to check in'}</p>{log?.checkIn&&<p>{fmt(log.checkIn)}{log.checkOut?' – '+fmt(log.checkOut):''} · IST</p>}</div><div>{log?.checkIn&&!log.checkOut&&<button style={buttonStyle} disabled={busy} onClick={()=>load(log.breakStart?'resume':'break')}>{log.breakStart?'Resume work':'Pause for break'}</button>} <button style={buttonStyle} disabled={!log||busy||!!log.checkOut} onClick={()=>load(log.checkIn?'out':'in')}>{log?.checkOut?'Day closed':log?.checkIn?'Check out':'Check in'}</button></div></section>}
 {page==='Home'&&<MissedCheckoutNotice day={log?.missedDay} onReview={day=>{setAttendanceDay(day);setPage('Timeline');}} buttonStyle={buttonStyle}/>}
 {isAccounts&&page==='Home'&&<div className="accounts-home-links">{[['Payment Dashboard','Review outstanding invoices and record receipts.'],['Invoicing','Create or print a client invoice.'],['Debit / Credit','Record a payment or receipt in the books.'],['Reconciliation','Match bank statement lines and review exceptions.'],['Payroll','View employees and prepare monthly payroll.'],['Financial Reports','Review balances, profit and cash flow.']].map(([title,description])=><button key={title} onClick={()=>go(title)}><strong>{title}</strong><span>{description}</span></button>)}</div>}
 {page==='Home'&&<TeamAvailability request={request} department={id} buttonStyle={buttonStyle}/>}
 {page==='Timeline'&&<PerformanceAttendance initialDay={attendanceDay} request={request} user={user}/>}
 {page==='Performance'&&<PerformanceView state={performanceState} request={request}/> }
 {page==='Team & Tasks'&&<section className="studio-home-card">{!team&&!error&&<p>Loading department team…</p>}{team&&<>{!isAccounts&&<><h2>People</h2>{team.people.length?team.people.map(p=><p key={p.id}>{p.name} · {p.role||'Team member'}</p>):<p>No employees assigned to this department.</p>}</>}<h2>Tasks</h2>{team.tasks.length?team.tasks.map(t=><p key={t.id}>{t.title} · {t.status}</p>):<p>No tasks to show.</p>}</>}</section>}
 {id==='accounts'&&accountsPages.includes(page)&&<Accounts page={page} request={request} user={user}/>}
 {!['Home','Performance','Timeline','Team & Tasks'].includes(page)&&id!=='accounts'&&<p>This section is reserved for the department’s next workflow update.</p>}
 </>;
 if(isAccounts)return <WorkspaceShell isAccounts name={name} switchDepartment={switchDepartment} currentUser={user}
   view={page==='Home'?'home':page} viewLabel={page} activityPage={activityPage} items={accountsNavigation}
   onChange={next=>go(next==='home'?'Home':next)}>{content}</WorkspaceShell>;
 const pages=['Home','Timeline','Team & Tasks','Performance',...departments[id][1]];
 return <div style={{display:'flex',flexWrap:'wrap',minHeight:560,background:'#f4f0e6',fontFamily:'Inter,system-ui,sans-serif'}}>
   <aside style={{background:'#102235',color:'#fff',padding:20,minWidth:190}}>
     <DepartmentHeading name={name} onChoose={switchDepartment}/>
     <nav aria-label={name} style={{display:'grid',gap:8,marginTop:16}}>
       {pages.map(x=><button key={x} type="button" style={buttonStyle} aria-current={page===x?'page':undefined} onClick={()=>go(x)}>{x}</button>)}
     </nav>
   </aside>
   <main className="studio-home" style={{flex:'1 1 420px',minWidth:0,padding:24}}>{content}</main>
 </div>;
}

export function DepartmentHeading({name,onChoose}){
 return onChoose?<button type="button" onClick={onChoose} aria-label={name+' — choose a department'} style={{border:0,padding:0,background:'transparent',color:'inherit',font:'inherit',fontWeight:650,textAlign:'left',cursor:'pointer',display:'inline-flex',alignItems:'center',gap:6}}>{name}</button>:<strong>{name}</strong>;
}
