import SalesCRM, {salesNavigation} from './SalesCRM.jsx';
import Marketing, {marketingNavigation} from './Marketing.jsx';
import {LegalContracts} from './ProjectBilling.jsx';
import OfficePolicy from './OfficePolicy.jsx';
import ExecutiveAssistant from './ExecutiveAssistant.jsx';
import {StudioHeadingText} from './StudioHeading.jsx';
import Accounts, {accountsPages} from './Accounts.jsx';
import TeamAvailability from './TeamAvailability.jsx';
import './DepartmentDirectory.css';
import React,{useCallback,useEffect,useState} from 'react';
import {BookOpen, ChartNoAxesColumnIncreasing, ClipboardList, FileText, Landmark, Receipt, ReceiptIndianRupee, Timer, Users, Wallet} from 'lucide-react';
import PerformanceAttendance,{MissedCheckoutNotice} from './PerformanceAttendance.jsx';
export const departments={
 studio:['Studio · Operations',[]],
 sales:['Business Development & Sales',salesNavigation.map(item=>item.id)],
 marketing:['Marketing',marketingNavigation.map(item=>item.id)],
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
 {id:'Projects & Clients',label:'Projects & Clients',group:'BILLING',icon:Users},
 {id:'Estimates',label:'Estimates',group:'BILLING',icon:FileText},
 {id:'Invoices',label:'Invoices',group:'BILLING',icon:Receipt},
 {id:'Debit / Credit',label:'Debit / Credit',group:'BOOKKEEPING',icon:Receipt},
 {id:'Banking',label:'Banking',group:'BOOKKEEPING',icon:Landmark},
 {id:'Chart of Accounts',label:'Chart of Accounts',group:'BOOKKEEPING',icon:BookOpen},
 {id:'Party Ledger',label:'Party Ledger',group:'BOOKKEEPING',icon:BookOpen},
 {id:'Financial Reports',label:'Financial Reports',group:'BOOKKEEPING',icon:ChartNoAxesColumnIncreasing},
 {id:'GST',label:'GST',group:'FILING & COMPLIANCE',icon:ReceiptIndianRupee},
 {id:'Office Policy',label:'Office Policy',group:'PEOPLE',icon:BookOpen},
 {id:'Payroll',label:'Payroll',group:'PEOPLE',icon:Users},
 {id:'Performance',label:'Performance',group:'PEOPLE',icon:ChartNoAxesColumnIncreasing},
 {id:'Timeline',label:'Timeline',group:'PEOPLE',icon:Timer},
 {id:'Team & Tasks',label:'Team & Tasks',group:'PEOPLE',icon:ClipboardList},
];

export function DepartmentWorkspace({id,name=departments[id][0],user,request:apiRequest,buttonStyle,switchDepartment,PerformanceView,performanceState,WorkspaceShell,theme,inputStyle}){
 const [attendanceDay,setAttendanceDay]=useState('');
 const [assigned,setAssigned]=useState(false),[teamBusy,setTeamBusy]=useState(false);
 const [reconciliationBank,setReconciliationBank]=useState();
 const [page,setPage]=useState('Home'),[log,setLog]=useState(null),[team,setTeam]=useState(null),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 const isAccounts=id==='accounts';
 const activityPage=isAccounts?'accounts:'+page:undefined;
 const request=useCallback((action,payload,method,timeout)=>apiRequest(action,payload,method,timeout,action==='getAccounts'&&isAccounts?'accounts:shared':activityPage),[apiRequest,activityPage,isAccounts]);
 const load=async(action)=>{setBusy(true);setError('');try{const result=await request(action?'saveStudioDay':'getStudioDay',action?{action}:{},'POST');setLog(action?{...result,missedDay:log?.missedDay}:result);if(action)window.dispatchEvent(new Event('enlighten-attendance-change'));}catch(e){setError(e.message);}finally{setBusy(false);}};
 useEffect(()=>{if(page==='Home'&&!['marketing','sales'].includes(id))load();},[id,page]);
 useEffect(()=>{if(page==='Team & Tasks'||page==='Home'&&assigned){let live=true;setTeamBusy(true);request('departmentTeam',{department:id},'POST').then(result=>{if(live)setTeam(result);}).catch(e=>{if(live)setError(e.message);}).finally(()=>{if(live)setTeamBusy(false);});return()=>{live=false;};}},[page,id,assigned,request]);
 const go=(next,bank)=>{setError('');setAttendanceDay('');setReconciliationBank(bank);setPage(next);};
 const fmt=s=>new Date(s).toLocaleTimeString('en-IN',{timeZone:'Asia/Kolkata',hour:'numeric',minute:'2-digit'});
 if(id==='sales')return <WorkspaceShell name={name} switchDepartment={switchDepartment} currentUser={user}
   view={page==='Home'?'home':page} viewLabel={page} items={salesNavigation}
   onChange={next=>go(next==='home'?'Home':next)}>
   <SalesCRM page={page} onNavigate={go} request={request} user={user}/>
 </WorkspaceShell>;
 if(id==='marketing')return <WorkspaceShell name={name} switchDepartment={switchDepartment} currentUser={user}
   view={page==='Home'?'home':page} viewLabel={page} items={marketingNavigation}
   onChange={next=>go(next==='home'?'Home':next)}>
   <Marketing page={page} onNavigate={go} request={request} user={user}/>
 </WorkspaceShell>;
 const content=<>
 {page!=='Timeline'&&(!isAccounts||!['Home','Performance','Payment Dashboard','Projects & Clients','Banking','Party Ledger','Payroll','Financial Reports'].includes(page))&&<h1 className={isAccounts?'studio-page-heading':undefined}>{page==='Home'?name:page}</h1>}
 {error&&<p role="alert">{error}</p>}
 {isAccounts&&page==='Home'&&<div className="studio-home accounts-home-intro">
   <header className="studio-home-intro">
     <StudioHeadingText title="Accounts overview" department="Accounts"/>
     <div className="studio-home-attendance-stack"><section aria-label="Attendance" className="studio-home-attendance">
   <div><p className="studio-home-kicker">Attendance</p><strong>{!log?'—':log.checkOut?'Checked out':log.breakStart?'On break':log.checkIn?'Checked in':'Ready to check in'}</strong>{log?.checkIn&&<small>{fmt(log.checkIn)}{log.checkOut?' – '+fmt(log.checkOut):' · IST'}</small>}</div>
   <div style={{display:'grid',gap:6}}>
     {log?.checkIn&&!log.checkOut&&<button type="button" style={buttonStyle} disabled={busy} onClick={()=>load(log.breakStart?'resume':'break')}>{log.breakStart?'Resume work':'Pause for break'}</button>}
     <button type="button" className="studio-home-check" disabled={!log||busy||!!log.checkOut} onClick={()=>load(log.checkIn?'out':'in')}>{busy?'Saving…':log?.checkOut?'Day closed':log?.checkIn?'Check out':'Check in'}</button>
   </div>
 </section>
       <MissedCheckoutNotice day={log?.missedDay} onReview={day=>{setAttendanceDay(day);setPage('Timeline');}} buttonStyle={buttonStyle}/>
     </div>
     <div className="studio-home-utilities">
       <ExecutiveAssistant profileApi={request} workRequest={request} workUser={user} workProjects={performanceState.projects||[]} userId={user.userId}
         sections={accountsNavigation} onNavigate={go} theme={theme} buttonStyle={buttonStyle} inputStyle={inputStyle}/>
       <button type="button" style={buttonStyle} aria-expanded={assigned} aria-controls="accounts-assigned-requests" onClick={()=>setAssigned(!assigned)}>Assigned requests</button>
     </div>
   </header>
   {assigned&&<section id="accounts-assigned-requests" className="studio-home-card">
     <h2>Assigned requests</h2>
     {team?.tasks?.length?team.tasks.map((task,index)=><div key={task.id||index} className="studio-home-task-row"><div><strong>{task.title}</strong><p>{[task.assigneeName,task.status].filter(Boolean).join(' · ')}</p></div></div>):team&&!teamBusy&&<p>No assigned requests to show.</p>}
   </section>}
 </div>}
 {page==='Home'&&!isAccounts&&<section className="studio-home-attendance"><div><strong>Attendance</strong><p>{!log?'Loading attendance…':log.checkOut?'Checked out':log.breakStart?'On break':log.checkIn?'Checked in':'Ready to check in'}</p>{log?.checkIn&&<p>{fmt(log.checkIn)}{log.checkOut?' – '+fmt(log.checkOut):''} · IST</p>}</div><div>{log?.checkIn&&!log.checkOut&&<button style={buttonStyle} disabled={busy} onClick={()=>load(log.breakStart?'resume':'break')}>{log.breakStart?'Resume work':'Pause for break'}</button>} <button style={buttonStyle} disabled={!log||busy||!!log.checkOut} onClick={()=>load(log.checkIn?'out':'in')}>{log?.checkOut?'Day closed':log?.checkIn?'Check out':'Check in'}</button></div></section>}
 {page==='Home'&&!isAccounts&&<MissedCheckoutNotice day={log?.missedDay} onReview={day=>{setAttendanceDay(day);setPage('Timeline');}} buttonStyle={buttonStyle}/>}
 {isAccounts&&(page==='Home'||accountsPages.includes(page))&&<Accounts page={page} request={request} user={user} onNavigate={go} reconciliationBank={reconciliationBank}/>}
 {page==='Home'&&<TeamAvailability request={request} department={id} buttonStyle={buttonStyle}/>}
 {isAccounts&&page==='Office Policy'&&<OfficePolicy/>}
 {page==='Timeline'&&<PerformanceAttendance initialDay={attendanceDay} request={request} user={user}/>}
 {page==='Performance'&&(!isAccounts ? <PerformanceView state={performanceState} request={request}/> : (
  <section className="studio-home-card">
    <h2>Accounts Operational Performance</h2>
    <p>Department KPIs for billing speed, collections, and compliance.</p>
    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))',gap:12,margin:'16px 0'}}>
      <div style={{background:'#f9f9f9',padding:12,border:'1px solid #ddd'}}>
        <strong style={{fontSize:14}}>Billing Turnaround</strong>
        <p style={{margin:'4px 0',fontSize:13}}>Milestones invoiced within 2 working days</p>
      </div>
      <div style={{background:'#f9f9f9',padding:12,border:'1px solid #ddd'}}>
        <strong style={{fontSize:14}}>Bank Reconciliation</strong>
        <p style={{margin:'4px 0',fontSize:13}}>IDFC statement matched weekly</p>
      </div>
      <div style={{background:'#f9f9f9',padding:12,border:'1px solid #ddd'}}>
        <strong style={{fontSize:14}}>Payroll Punctuality</strong>
        <p style={{margin:'4px 0',fontSize:13}}>Disbursed on or before 1st of month</p>
      </div>
      <div style={{background:'#f9f9f9',padding:12,border:'1px solid #ddd'}}>
        <strong style={{fontSize:14}}>GST Compliance</strong>
        <p style={{margin:'4px 0',fontSize:13}}>Quarterly CMP-08 paid on schedule</p>
      </div>
    </div>
  </section>
 ))}
 {page==='Team & Tasks'&&<section className="studio-home-card">

    <h2>{isAccounts?'Accounts Team Members':'People'}</h2>
    {team?.people.length?team.people.map(p=><p key={p.id}><strong>{p.name}</strong> · {p.role||'Team member'}</p>):team&&<p>No employees assigned to this department.</p>}
    <h2 style={{marginTop:20}}>{isAccounts?'Department Recurring Responsibilities':'Tasks'}</h2>
    {team?.tasks.length?team.tasks.map(t=><p key={t.id}>{t.title} · {t.status}</p>):(
      isAccounts ? (
        <div style={{fontSize:13,lineHeight:1.8}}>
          <p>✓ <strong>Client Billing:</strong> Issue tax invoices on milestone achievements &amp; track payment collections.</p>
          <p>✓ <strong>Bank Reconciliation:</strong> Import IDFC First Bank CSV statements &amp; clear pending entries.</p>
          <p>✓ <strong>Monthly Payroll:</strong> Load attendance, compute allowances/deductions &amp; disburse salaries.</p>
          <p>✓ <strong>GST Compliance:</strong> Calculate quarterly CMP-08 composition tax &amp; file annual GSTR-4.</p>
        </div>
      ) : team&&<p>No tasks to show.</p>
    )}
 </section>}
 {id==='legal'&&page==='Contracts'&&<LegalContracts request={request} user={user}/>}
 {!['Home','Performance','Timeline','Team & Tasks'].includes(page)&&id!=='accounts'&&!(id==='legal'&&page==='Contracts')&&<p>This section is reserved for the department’s next workflow update.</p>}
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
 const shortNames={studio:'Studio',sales:'Sales',marketing:'Marketing',accounts:'Accounts',legal:'Legal',hr:'Human Resources'};
 const heading=shortNames[departmentFor(name)];
 return onChoose?<button type="button" onClick={onChoose} aria-label={name+' — choose a department'} style={{border:0,padding:0,background:'transparent',color:'inherit',font:'inherit',fontWeight:650,textAlign:'left',cursor:'pointer',display:'inline-flex',alignItems:'center',gap:6}}>{heading}</button>:<strong>{heading}</strong>;
}
