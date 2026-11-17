import React, {useState} from 'react';
import {ArrowUpRight, Banknote, CalendarDays, ChartNoAxesCombined, Landmark, TrendingUp} from 'lucide-react';

export const studioGstin='07AAKFE5187A1ZI';
export const bankAccounts=['IDFC','Cash'];
const bankLabel={IDFC:'IDFC First Bank',Cash:'Cash in Hand'};
const money=new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR'});
const amount=n=>money.format(n/100);
const sum=(rows,fn)=>rows.reduce((n,row)=>n+fn(row),0);
const movement=(record,heads)=>sum(record.postings||[],p=>heads.includes(p.head)?(p.debit||0)-(p.credit||0):0);
const fiscalStart=date=>Number(date.slice(0,4))-(date.slice(5,7)<'04'?1:0);
const iso=date=>date.toISOString().slice(0,10);
const monthLabel=key=>new Intl.DateTimeFormat('en-IN',{month:'short',year:'2-digit',timeZone:'UTC'}).format(new Date(key+'-01'));
const monthsFor=year=>Array.from({length:12},(_,i)=>iso(new Date(Date.UTC(year,3+i,1))).slice(0,7));

function Card({title,action,children,wide=false}){
  return <section className={'accounts-overview-card'+(wide?' is-wide':'')}>
    <header><h2>{title}</h2>{action}</header><div className="accounts-overview-body">{children}</div>
  </section>;
}

function ActivityChart({rows,labels}){
  const values=rows.flatMap(r=>[r.first,r.second]);
  const top=Math.max(1,...values),bottom=Math.min(0,...values),range=top-bottom;
  return <>
    <div className="accounts-chart-legend"><span>{labels[0]}</span><span>{labels[1]}</span></div>
    <div className="accounts-chart" aria-hidden="true" style={{gridTemplateColumns:'repeat('+rows.length+',minmax(0,1fr))'}}>
      {rows.map(row=><div key={row.label}><div className="accounts-chart-bars">
        {[row.first,row.second].map((value,index)=><span key={index} title={row.label+' · '+labels[index]+' · '+amount(value)}
          style={{height:Math.abs(value)/range*100+'%',bottom:(Math.min(0,value)-bottom)/range*100+'%'}}/>)}
      </div><small>{row.label}</small></div>)}
    </div>
    <details className="accounts-chart-values"><summary>View chart values</summary>
      <div className="accounts-scroll"><table><thead><tr><th>Period</th><th>{labels[0]}</th><th>{labels[1]}</th></tr></thead>
        <tbody>{rows.map(row=><tr key={row.label}><td>{row.label}</td><td>{amount(row.first)}</td><td>{amount(row.second)}</td></tr>)}</tbody>
      </table></div>
    </details>
  </>;
}

export function AccountsDashboard({data,today,onNavigate}){
  const [previous,setPrevious]=useState(false);
  const year=fiscalStart(today)-Number(previous),months=monthsFor(year),start=months[0]+'-01';
  const {records,heads,projects}=data;
  const posted=records.filter(r=>r.date<=today);
  const expenseHeads=heads.filter(([,type])=>['Expense','Direct expense'].includes(type)).map(([head])=>head);
  const revenueHeads=heads.filter(([,type])=>type==='Revenue').map(([head])=>head);
  const period=posted.filter(r=>months.includes(r.date?.slice(0,7)));
  const grouped=months.map(key=>period.filter(r=>r.date.startsWith(key)));
  const income=grouped.map((entries,i)=>({label:monthLabel(months[i]),first:-sum(entries,r=>movement(r,revenueHeads)),second:sum(entries,r=>movement(r,expenseHeads))}));
  const flows=grouped.map((entries,i)=>{
    const movements=entries.map(r=>movement(r,bankAccounts));
    return {label:monthLabel(months[i]),first:sum(movements,n=>Math.max(n,0)),second:sum(movements,n=>Math.max(-n,0))};
  });
  const opening=sum(posted.filter(r=>r.date<start),r=>movement(r,bankAccounts));
  const incoming=sum(flows,r=>r.first),outgoing=sum(flows,r=>r.second);
  const receipts=posted.filter(r=>r.kind==='receipt');
  const invoices=posted.filter(r=>r.kind==='invoice'&&r.documentType!=='Proforma Invoice');
  const outstanding=invoice=>Math.max(0,invoice.amount-sum(receipts.filter(r=>r.invoiceId===invoice.id),r=>r.amount||0));
  const receivable=sum(invoices,outstanding);
  const overdue=sum(invoices.filter(r=>(r.dueDate||r.date)<today),outstanding);
  const payable=-sum(posted,r=>movement(r,['Accounts Payable']));
  const expenses=expenseHeads.map(head=>({head,value:sum(period,r=>movement(r,[head]))})).filter(row=>row.value>0).sort((a,b)=>b.value-a.value).slice(0,5);
  const activeProjects=projects.filter(project=>period.some(r=>r.projectId===project.id&&r.postings?.length));
  const balances=bankAccounts.map(bank=>({bank,balance:sum(posted,r=>movement(r,[bank]))}));
  return <div className="accounts-dashboard">
    <nav className="accounts-overview-tools" aria-label="Dashboard controls">
      <label>Period <select value={previous?'previous':'current'} onChange={e=>setPrevious(e.target.value==='previous')}><option value="current">This Fiscal Year</option><option value="previous">Previous Fiscal Year</option></select></label>
    </nav>
    <div className="accounts-overview-grid">
      <Card title="Total Receivables" action={<button onClick={()=>onNavigate('Payment Dashboard')}>View receivables <ArrowUpRight size={13}/></button>}>
        <span>Total unpaid invoices</span><strong className="accounts-balance">{amount(receivable)}</strong>
        <div className="accounts-receivables-meter"><span style={{width:(receivable?overdue/receivable*100:0)+'%'}}/></div>
        <div className="accounts-overview-inline"><span>Current <b>{amount(receivable-overdue)}</b></span><span>Overdue <b>{amount(overdue)}</b></span></div>
      </Card>
      <Card title="Total Payables" action={<button onClick={()=>onNavigate('Financial Reports')}>View reports <ArrowUpRight size={13}/></button>}>
        <span>Accounts Payable ledger balance</span><strong className="accounts-balance">{amount(payable)}</strong>
        <small>Supplier bill aging is unavailable.</small>
      </Card>
      <Card title="Cash Flow" wide>
        <div className="accounts-cash-flow"><ActivityChart rows={flows} labels={['Incoming','Outgoing']}/>
          <dl>{[['Opening cash',opening],['Incoming',incoming],['Outgoing',outgoing],['Closing cash',opening+incoming-outgoing]].map(([label,value])=><div key={label}><dt>{label}</dt><dd>{amount(value)}</dd></div>)}</dl>
        </div>
      </Card>
      <Card title="Income and Expense">
        <div className="accounts-overview-inline"><span>Total income <strong>{amount(sum(income,r=>r.first))}</strong></span><span>Total expenses <strong>{amount(sum(income,r=>r.second))}</strong></span></div>
        <ActivityChart rows={income} labels={['Income','Expenses']}/>
      </Card>
      <Card title="Top Expenses">
        {expenses.length?<ul className="accounts-overview-list">{expenses.map(row=><li key={row.head}><span>{row.head}</span><strong>{amount(row.value)}</strong></li>)}</ul>:<p>No expenses recorded for this fiscal year.</p>}
      </Card>
      <Card title="Projects" action={<button onClick={()=>onNavigate('Payment Dashboard')}>Project balances <ArrowUpRight size={13}/></button>}>
        {activeProjects.length?<ul className="accounts-overview-list">{activeProjects.slice(0,6).map(project=><li key={project.id}><span>{project.name}</span><strong>{amount(sum(invoices.filter(r=>r.projectId===project.id),outstanding))}</strong></li>)}</ul>:<p>No projects with posted activity this fiscal year.</p>}
      </Card>
      <Card title="Bank and Cash Accounts" action={<button onClick={()=>onNavigate('Banking')}>View Banking <ArrowUpRight size={13}/></button>}>
        <ul className="accounts-overview-list">{balances.map(({bank,balance})=><li key={bank}><span>{bankLabel[bank]}</span><strong>{amount(balance)}</strong></li>)}</ul>
      </Card>
    </div>
  </div>;
}

export function BankingOverview({records,today,staged,onNavigate}){
  const [bank,setBank]=useState('all'),[days,setDays]=useState(30),[chart,setChart]=useState(false);
  const accounts=bank==='all'?bankAccounts:[bank];
  const posted=records.filter(r=>r.date<=today);
  const balance=account=>sum(posted,r=>movement(r,[account]));
  const buckets=Array.from({length:days/5},(_,i)=>{
    const from=new Date(today+'T00:00:00Z'),until=new Date(from);
    from.setUTCDate(from.getUTCDate()-days+1+i*5);
    until.setUTCDate(until.getUTCDate()-days+5+i*5);
    const values=posted.filter(r=>r.date>=iso(from)&&r.date<=iso(until)).map(r=>movement(r,accounts));
    return {label:iso(from).slice(5),first:sum(values,n=>Math.max(n,0)),second:sum(values,n=>Math.max(-n,0))};
  });
  return <>
    <nav className="accounts-overview-tools" aria-label="Banking actions">
      <button className="accounts-overview-primary" onClick={()=>onNavigate('Reconciliation',bank==='all'?undefined:bank)}>Import statement / Reconcile</button>
      <button onClick={()=>onNavigate('Chart of Accounts')}>Chart of Accounts</button>
    </nav>
    <Card title="Banking Overview" action={<label><CalendarDays size={14}/> <select aria-label="Chart period" value={days} onChange={e=>setDays(Number(e.target.value))}><option value="30">Last 30 days</option><option value="60">Last 60 days</option></select></label>}>
      <select aria-label="Bank account" value={bank} onChange={e=>setBank(e.target.value)}><option value="all">All Accounts</option>{bankAccounts.map(key=><option key={key} value={key}>{bankLabel[key]}</option>)}</select>
      <div className="accounts-bank-totals">
        {accounts.includes('Cash')&&<div><Banknote/><span>Cash in Hand<strong>{amount(balance('Cash'))}</strong></span></div>}
        {accounts.some(key=>key!=='Cash')&&<div><Landmark/><span>Bank Balance in Books<strong>{amount(sum(accounts.filter(key=>key!=='Cash'),balance))}</strong></span></div>}
      </div>
      <button type="button" aria-expanded={chart} onClick={()=>setChart(!chart)}><TrendingUp size={15}/> {chart?'Hide Chart':'Show Chart'}</button>
      {chart&&<ActivityChart rows={buckets} labels={['Money in','Money out']}/>}
    </Card>
    <h2>Active Accounts</h2>
    <div className="accounts-scroll"><table><thead><tr><th>Account details</th><th>Pending statement lines</th><th>Amount in bank</th><th>Amount in Enlighten OS</th><th>Action</th></tr></thead>
      <tbody>{accounts.map(key=><tr key={key}><td>{key==='Cash'?<Banknote size={17}/>:<Landmark size={17}/>} {bankLabel[key]}</td><td>{staged.filter(row=>row.bank===key).length}</td><td>{key==='Cash'?'—':'No bank feed'}</td><td><strong>{amount(balance(key))}</strong></td><td><button onClick={()=>onNavigate('Reconciliation',key)}>Reconcile</button></td></tr>)}</tbody>
    </table></div>
  </>;
}

export function GstOverview({records,today,onRecord}){
  const [period,setPeriod]=useState(today.slice(0,7)),[history,setHistory]=useState(false);
  const entries=records.filter(r=>r.kind==='gstFiling').sort((a,b)=>b.period.localeCompare(a.period));
  const rows=history?entries:entries.filter(r=>r.period===period);
  const entriesForPeriod=records.filter(r=>r.date?.startsWith(period)&&r.kind==='invoice'&&r.documentType!=='Proforma Invoice');
  return <div className="accounts-gst-grid">
    <Card title={'GSTIN '+studioGstin} action={<label><CalendarDays size={15}/> <input aria-label="GST period" type="month" value={period} onChange={e=>{if(e.target.value)setPeriod(e.target.value);}}/></label>}>
      <p>Enlighten Designs · New Delhi</p>
      <div className="accounts-gst-steps">{['GSTR-1','IMS','GSTR-2B','GSTR-3B','CMP-08','GSTR-4'].map(form=><div key={form}><strong>{form}</strong><small>{entries.some(r=>r.period===period&&r.returnType===form)?'Recorded':'No record'}</small></div>)}</div>
      <div className="accounts-overview-inline"><button onClick={()=>setHistory(!history)}>{history?'View Selected Period':'View Filing History'}</button>{onRecord&&<button className="accounts-overview-primary" onClick={()=>onRecord(period)}>Record Filing</button>}</div>
      <h3>{history?'Filing history':monthLabel(period)+' · Period records'}</h3>
      <div className="accounts-scroll"><table><thead><tr><th>Period</th><th>Form</th><th>Recorded date</th><th>Reference</th></tr></thead>
        <tbody>{rows.length?rows.map(row=><tr key={row.id}><td>{row.period}</td><td>{row.returnType}</td><td>{row.date}</td><td>{row.reference}</td></tr>):<tr><td colSpan={4}>No filing records yet.</td></tr>}</tbody>
      </table></div>
    </Card>
    <Card title="Period Summary">
      <p><ChartNoAxesCombined size={17}/> Posted invoices <strong>{entriesForPeriod.length}</strong></p>
      <p>Total invoice value <strong>{amount(sum(entriesForPeriod,r=>r.amount||0))}</strong></p>
      <p>Filing records are entered manually in Enlighten OS.</p>
      <a href="https://www.gst.gov.in/" target="_blank" rel="noreferrer">Open GST Portal <ArrowUpRight size={13}/></a>
    </Card>
  </div>;
}
