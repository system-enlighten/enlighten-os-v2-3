import {statementReconciliation} from './reconciliation.mjs';
import React, {useState} from 'react';
import {ArrowUpRight, Banknote, CalendarDays, ChartNoAxesCombined, Landmark, TrendingUp, ShieldCheck, FileCheck, Info} from 'lucide-react';

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

function ActivityChart({rows,labels,loading=false,selectedMonth,onSelect}){
  const display=value=>loading?'—':amount(value);
  const values=rows.flatMap(r=>[r.first,r.second]);
  const top=Math.max(1,...values),bottom=Math.min(0,...values),range=top-bottom||1;
  return <>
    <div className="accounts-chart-legend"><span>{labels[0]}</span><span>{labels[1]}</span></div>
    <div className="accounts-chart" aria-hidden={onSelect?undefined:true} style={{gridTemplateColumns:'repeat('+rows.length+',minmax(0,1fr))'}}>
      {rows.map(row=>{
        const bars=<><div className="accounts-chart-bars" aria-hidden="true">
          {[row.first,row.second].map((value,index)=><span key={index} title={row.label+' · '+labels[index]+' · '+display(value)}
            style={{height:Math.abs(value)/range*100+'%',bottom:(Math.min(0,value)-bottom)/range*100+'%'}}/>)}
        </div><small>{row.label}</small></>;
        return <div key={row.label}>{onSelect?
          <button type="button" className="accounts-month-bar" aria-pressed={selectedMonth===row.key}
            aria-label={row.label+' · '+labels[0]+' '+display(row.first)+' · '+labels[1]+' '+display(row.second)}
            disabled={loading} onClick={()=>onSelect(row.key)}>{bars}</button>:bars}</div>;
      })}
    </div>
    <details className="accounts-chart-values"><summary>View chart values</summary>
      <div className="accounts-scroll"><table><thead><tr><th>Period</th><th>{labels[0]}</th><th>{labels[1]}</th>{onSelect&&<th>Closing balance</th>}</tr></thead>
        <tbody>{rows.map(row=><tr key={row.label}><td>{row.label}</td><td>{display(row.first)}</td><td>{display(row.second)}</td>{onSelect&&<td>{display(row.closing)}</td>}</tr>)}</tbody>
      </table></div>
    </details>
  </>;
}

export function AccountsDashboard({data,today,onNavigate,loading=false}){
  const [previous,setPrevious]=useState(false);
  const [monthSelection,setMonthSelection]=useState(null);
  const currentYear=fiscalStart(today),year=currentYear-Number(previous);
  const months=monthsFor(year).filter(key=>key<=today.slice(0,7)),start=months[0]+'-01';
  const selectedMonth=months.includes(monthSelection)?monthSelection:months.at(-1);
  const {records,heads,projects}=data;
  const posted=records.filter(r=>r.date<=today);
  const expenseHeads=heads.filter(([,type])=>['Expense','Direct expense'].includes(type)).map(([head])=>head);
  const revenueHeads=heads.filter(([,type])=>type==='Revenue').map(([head])=>head);
  const period=posted.filter(r=>months.includes(r.date?.slice(0,7)));
  const grouped=months.map(key=>period.filter(r=>r.date.startsWith(key)));
  const income=grouped.map((entries,i)=>({label:monthLabel(months[i]),first:-sum(entries,r=>movement(r,revenueHeads)),second:sum(entries,r=>movement(r,expenseHeads))}));
  let closing=sum(posted.filter(r=>r.date<start),r=>movement(r,bankAccounts));
  const flows=grouped.map((entries,i)=>{
    const movements=entries.map(r=>movement(r,bankAccounts));
    const first=sum(movements,n=>Math.max(n,0)),second=sum(movements,n=>Math.max(-n,0));
    closing+=first-second;
    return {key:months[i],label:monthLabel(months[i]),first,second,closing};
  });
  const selectedFlow=flows.find(row=>row.key===selectedMonth);
  const receipts=posted.filter(r=>r.kind==='receipt');
  const invoices=posted.filter(r=>r.kind==='invoice'&&r.documentType!=='Proforma Invoice');
  const outstanding=invoice=>Math.max(0,invoice.amount-sum(receipts.filter(r=>r.invoiceId===invoice.id),r=>r.amount||0));
  const receivable=sum(invoices,outstanding);
  const overdueInvoices=invoices.filter(r=>(r.dueDate||r.date)<today&&outstanding(r)>0);
  const overdue=sum(overdueInvoices,outstanding);
  const reconciliations=records.filter(r=>r.kind==='reconciliation');
  const pendingByBank=bankAccounts.map(bank=>({
    bank,count:records.filter(row=>row.kind==='statement'&&row.bank===bank&&!statementReconciliation(row,reconciliations)).length
  }));
  const payable=sum(posted,r=>-movement(r,['Accounts Payable']));
  const display=value=>loading?'—':amount(value);
  const expenses=expenseHeads.map(head=>({head,value:sum(period,r=>movement(r,[head]))})).filter(row=>row.value>0).sort((a,b)=>b.value-a.value).slice(0,5);
  const activeProjects=projects.filter(project=>period.some(r=>r.projectId===project.id&&r.postings?.length));
  const balances=bankAccounts.map(bank=>({bank,balance:sum(posted,r=>movement(r,[bank]))}));

  return <div className="accounts-dashboard" aria-busy={loading}>
    <nav className="accounts-overview-tools" aria-label="Dashboard controls">
      <label className="accounts-period-control">Period <select value={previous?'previous':'current'} onChange={e=>setPrevious(e.target.value==='previous')}><option value="current">This Fiscal Year (FY {currentYear}-{String(currentYear+1).slice(2)})</option><option value="previous">Previous Fiscal Year (FY {currentYear-1}-{String(currentYear).slice(2)})</option></select></label>
    </nav>
    <div className="accounts-overview-lead">
      <section className="accounts-cash-lead" aria-labelledby="overview-cash-heading">
        <div className="accounts-cash-position">
          <h2 id="overview-cash-heading">Cash position</h2>
          <strong>{display(sum(balances,row=>row.balance))}</strong>
          <small>Book balance as of {today}</small>
          <dl>{balances.map(({bank,balance})=><div key={bank}><dt>{bankLabel[bank]}</dt><dd>{display(balance)}</dd></div>)}</dl>
        </div>
        <div className="accounts-monthly-flow">
          <h2>Monthly cash flow</h2>
          <ActivityChart loading={loading} rows={flows} labels={['Incoming','Outgoing']} selectedMonth={selectedMonth} onSelect={setMonthSelection}/>
          <div className="accounts-month-summary" aria-live="polite">
            <strong>{selectedFlow.label}</strong>
            <dl>{[['Incoming',selectedFlow.first],['Outgoing',selectedFlow.second],['Closing balance',selectedFlow.closing]]
              .map(([label,value])=><div key={label}><dt>{label}</dt><dd>{display(value)}</dd></div>)}</dl>
          </div>
        </div>
      </section>
      <Card title="Needs attention">
        <ul className="accounts-attention-list">
          <li><button type="button" onClick={()=>onNavigate('Payment Dashboard')}>
            <span>Overdue invoices<small>{loading?'—':overdueInvoices.length+' overdue · '+display(receivable)+' unpaid overall'}</small></span>
            <strong data-alert={overdue>0}>{display(overdue)}</strong><ArrowUpRight size={15} aria-hidden="true"/>
          </button></li>
          <li><button type="button" onClick={()=>onNavigate('Financial Reports')}>
            <span>Accounts payable<small>Ledger balance</small></span>
            <strong data-alert={payable>0}>{display(payable)}</strong><ArrowUpRight size={15} aria-hidden="true"/>
          </button></li>
          {pendingByBank.filter(({bank,count})=>bank==='IDFC'||count>0).map(({bank,count})=><li key={bank}>
            <button type="button" onClick={()=>onNavigate('Banking',bank)}>
              <span>Bank reconciliation<small>{bankLabel[bank]}</small></span>
              <strong data-alert={count>0}>{loading?'—':count.toLocaleString('en-IN')+' pending'}</strong><ArrowUpRight size={15} aria-hidden="true"/>
            </button>
          </li>)}
        </ul>
      </Card>
    </div>
    <div className="accounts-overview-grid">
      <Card title="Income and Expense">
        <div className="accounts-overview-inline"><span>Total income <strong>{display(sum(income,r=>r.first))}</strong></span><span>Total expenses <strong>{display(sum(income,r=>r.second))}</strong></span></div>
        <ActivityChart loading={loading} rows={income} labels={['Income','Expenses']}/>
      </Card>
      <Card title="Top Expenses">
        {expenses.length?<ul className="accounts-overview-list">{expenses.map(row=><li key={row.head}><span>{row.head}</span><strong>{display(row.value)}</strong></li>)}</ul>:<p>{loading?'Loading expenses…':'No expenses recorded for this fiscal year.'}</p>}
      </Card>
      <Card title="Projects" action={<button onClick={()=>onNavigate('Payment Dashboard')}>Project balances <ArrowUpRight size={13}/></button>}>
        {activeProjects.length?<ul className="accounts-overview-list">{activeProjects.slice(0,6).map(project=><li key={project.id}><span>{project.name}</span><strong>{display(sum(invoices.filter(r=>r.projectId===project.id),outstanding))}</strong></li>)}</ul>:<p>{loading?'Loading project balances…':'No projects with posted activity this fiscal year.'}</p>}
      </Card>
    </div>
  </div>;
}

export function BankingOverview({records,today,onNavigate}){
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
      <button className="accounts-overview-primary" onClick={()=>onNavigate('Banking',bank==='all'?'IDFC':bank)}>Import statement / Reconcile</button>
      <button onClick={()=>onNavigate('Debit / Credit')}>Record Transaction</button>
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
      <tbody>{accounts.map(key=><tr key={key}>
        <td>{key==='Cash'?<Banknote size={17}/>:<Landmark size={17}/>} {bankLabel[key]}</td>
        <td>{records.filter(row=>row.kind==='statement'&&row.bank===key&&!statementReconciliation(row,records)).length}</td>
        <td>{key==='Cash'?'Physical cash count':'Statement reconciliation'}</td>
        <td><strong>{amount(balance(key))}</strong></td>
        <td>
          {key==='Cash'?
            <button onClick={()=>onNavigate('Debit / Credit')}>Cash Book</button>:
            <button onClick={()=>onNavigate('Banking',key)}>Reconcile</button>
          }
        </td>
      </tr>)}</tbody>
    </table></div>
  </>;
}

export function GstOverview({records,today,onRecord}){
  const [period,setPeriod]=useState(today.slice(0,7)),[history,setHistory]=useState(false);
  const entries=records.filter(r=>r.kind==='gstFiling').sort((a,b)=>b.period.localeCompare(a.period));
  const rows=history?entries:entries.filter(r=>r.period===period);
  const entriesForPeriod=records.filter(r=>r.date?.startsWith(period)&&r.kind==='invoice'&&r.documentType!=='Proforma Invoice');
  const periodTotal=sum(entriesForPeriod,r=>r.amount||0);

  // Composition Scheme (Sec 10(2A) for Service Providers: 6% total = 3% CGST + 3% SGST)
  const estTax=Math.round(periodTotal*0.06);
  const estCgst=Math.round(periodTotal*0.03);
  const estSgst=Math.round(periodTotal*0.03);

  const compositionForms=['CMP-08 (Quarterly)','GSTR-4 (Annual)'];
  const regularForms=['GSTR-1','IMS','GSTR-2B','GSTR-3B'];

  return <div className="accounts-gst-grid">
    <Card title={'GSTIN '+studioGstin} action={<label><CalendarDays size={15}/> <input aria-label="GST period" type="month" value={period} onChange={e=>{if(e.target.value)setPeriod(e.target.value);}}/></label>}>
      <p><strong>Enlighten Designs</strong> · Composition Taxable Person · New Delhi</p>
      
      <div style={{background:'#f0f7f4',padding:10,borderRadius:4,margin:'12px 0',fontSize:12,border:'1px solid #c8e6c9'}}>
        <span style={{fontWeight:600,color:'#2e7d32'}}>Composition Scheme Compliance:</span>
        <span style={{display:'block',marginTop:2}}>Not eligible to collect GST on invoices. Quarterly tax is paid via challan <strong>CMP-08</strong> and annual return is <strong>GSTR-4</strong>.</span>
      </div>

      <h3>Applicable Composition Returns</h3>
      <div className="accounts-gst-steps" style={{gridTemplateColumns:'repeat(2, minmax(130px, 1fr))'}}>
        {compositionForms.map(form=>{
          const key=form.split(' ')[0];
          const isDone=entries.some(r=>r.period===period&&r.returnType.includes(key));
          return (
            <div key={form} style={{borderColor:isDone?'#2e7d32':undefined}}>
              <strong>{form}</strong>
              <small style={{color:isDone?'#2e7d32':'#c62828',fontWeight:500}}>
                {isDone?'✓ Recorded for period':'Pending / No record'}
              </small>
            </div>
          );
        })}
      </div>

      <details style={{margin:'12px 0',fontSize:12}}>
        <summary style={{cursor:'pointer',color:'#555'}}>Other GST Forms (Regular taxpayer reference)</summary>
        <div className="accounts-gst-steps" style={{marginTop:8}}>
          {regularForms.map(form=><div key={form}><strong>{form}</strong><small>{entries.some(r=>r.period===period&&r.returnType===form)?'Recorded':'Not applicable'}</small></div>)}
        </div>
      </details>

      <div className="accounts-overview-inline" style={{marginTop:16}}>
        <button onClick={()=>setHistory(!history)}>{history?'View Selected Period':'View Filing History'}</button>
        {onRecord&&<button className="accounts-overview-primary" onClick={()=>onRecord(period)}>Record Filing</button>}
      </div>

      <h3>{history?'Filing history':monthLabel(period)+' · Period records'}</h3>
      <div className="accounts-scroll"><table><thead><tr><th>Period</th><th>Form</th><th>Recorded date</th><th>Reference</th></tr></thead>
        <tbody>{rows.length?rows.map(row=><tr key={row.id}><td>{row.period}</td><td>{row.returnType}</td><td>{row.date}</td><td>{row.reference}</td></tr>):<tr><td colSpan={4}>No filing records yet for this period.</td></tr>}</tbody>
      </table></div>
    </Card>

    <Card title="Period Turnover &amp; CMP-08 Estimate">
      <p><ChartNoAxesCombined size={17}/> Posted Tax Invoices: <strong>{entriesForPeriod.length}</strong></p>
      <p>Gross Period Turnover: <strong>{amount(periodTotal)}</strong></p>
      
      <div style={{background:'#fafafa',border:'1px solid #ddd',padding:12,margin:'12px 0',borderRadius:4}}>
        <strong style={{fontSize:13,display:'block',marginBottom:6}}>Estimated CMP-08 Tax (6%):</strong>
        <div style={{display:'flex',justifyContent:'space-between',fontSize:12,marginBottom:4}}>
          <span>CGST (3%):</span>
          <strong>{amount(estCgst)}</strong>
        </div>
        <div style={{display:'flex',justifyContent:'space-between',fontSize:12,marginBottom:4}}>
          <span>SGST (3%):</span>
          <strong>{amount(estSgst)}</strong>
        </div>
        <div style={{display:'flex',justifyContent:'space-between',fontSize:13,paddingTop:4,borderTop:'1px dashed #ccc'}}>
          <span>Total Payable:</span>
          <strong style={{color:'#c62828'}}>{amount(estTax)}</strong>
        </div>
      </div>

      <p style={{fontSize:11,color:'#666'}}>*Subject to any reverse charge mechanism (RCM) liabilities and applicable threshold limits.</p>
      <a href="https://www.gst.gov.in/" target="_blank" rel="noreferrer" style={{marginTop:8}}>Open GST Portal <ArrowUpRight size={13}/></a>
    </Card>
  </div>;
}
