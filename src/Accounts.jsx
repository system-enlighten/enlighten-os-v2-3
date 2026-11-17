import React, { useEffect, useRef, useState } from 'react';
import './Accounts.css';
import {parseStatement,statementSuggestion} from './AccountsStatement.js';
import wordmark from './AccountsWordmark.svg?raw';

export const accountsPages = ['Payment Dashboard','Invoicing','Debit / Credit','Reconciliation','Chart of Accounts','Payroll','Financial Reports'];
const banks=['IDFC','Kotak','Cash'];
const today=()=>new Date().toLocaleDateString('sv-SE',{timeZone:'Asia/Kolkata'});
const money=n=>new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR'}).format((n||0)/100);
const total=(rows,key)=>rows.reduce((sum,row)=>sum+(row[key]||0),0);
const freshItem=()=>({description:'',sac:'99839',unit:'LS',quantity:1,rate:''});
const makeDraft=kind=>({kind,id:crypto.randomUUID(),date:today(),bank:'IDFC',direction:'Outflow',documentType:'Invoice',
  ...(kind==='invoice'?{items:[freshItem()]}:{}),...(kind==='payroll'?{method:'Working days',multiplier:1}:{} )});

function Table({columns,rows,empty='No records yet.'}){
  return <div className="accounts-scroll"><table><thead><tr>{columns.map(x=><th key={x} scope="col">{x}</th>)}</tr></thead>
    <tbody>{rows.length?rows.map((row,i)=><tr key={row.key||i} data-status={row.status}>{row.cells.map((x,j)=><td key={j}>{x}</td>)}</tr>):
      <tr><td colSpan={columns.length}>{empty}</td></tr>}</tbody></table></div>;
}

function printMarkup(node,title){
  const popup=window.open('','_blank','width=920,height=900');
  if(!popup)throw Error('Allow pop-ups to open the print preview.');
  popup.opener=null;
  popup.document.title=title;
  const style=popup.document.createElement('style');
  style.textContent=`@page{size:A4;margin:15mm}body{font:11pt Arial,sans-serif;color:#222;margin:0}h1,h2{text-align:center;margin:10px 0 4px}
    .invoice-brand{font-size:30pt;font-weight:300;letter-spacing:.1em;border-bottom:1px solid #333;margin:0 0 6px}
    .invoice-brand svg{width:185px;height:auto}.invoice-address{text-align:center;line-height:1.45}.invoice-meta{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin:26px 0}
    .invoice-meta p{margin:5px 0;white-space:pre-line}table{width:100%;border-collapse:collapse}th,td{text-align:left;vertical-align:top;padding:7px 4px;border-bottom:1px solid #bbb}
    th{background:#eee;print-color-adjust:exact}tr,.invoice-footer{break-inside:avoid}td:first-child,td:nth-child(n+3){white-space:nowrap}
    .invoice-totals{text-align:right;line-height:1.7;margin-top:10px}.invoice-footer{margin-top:25px;line-height:1.5}`;
  popup.document.head.append(style);
  popup.document.body.append(node.cloneNode(true));
  popup.focus();
  popup.print();
}

function numberWords(n){
  const small=['Zero','One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten','Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen'];
  const tens=['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety'];
  if(n<20)return small[n];
  if(n<100)return tens[Math.floor(n/10)]+(n%10?' '+small[n%10]:'');
  const [size,label]=[[10000000,'Crore'],[100000,'Lakh'],[1000,'Thousand'],[100,'Hundred']].find(([size])=>n>=size);
  return numberWords(Math.floor(n/size))+' '+label+(n%size?' '+numberWords(n%size):'');
}

function Invoice({invoice:r,printRef}){
  const date=value=>value?.split('-').reverse().join('.')||'—';
  const words=numberWords(Math.floor(r.amount/100))+(r.amount%100?' and '+numberWords(r.amount%100)+' Paise':'')+' Only';
  return <article className="accounts-invoice" ref={printRef}>
    <h1 className="invoice-brand"><span dangerouslySetInnerHTML={{__html:wordmark.replace('#fff0cf','#252525')}}/></h1>
    <div className="invoice-address">E-256, Naraina Vihar, New Delhi 110028<br/>Phone +91 9999277482 · design.enlighten@gmail.com<br/>GSTIN 07AAKFE5187A1ZI</div>
    <h2>{r.documentType.toUpperCase()}</h2><div className="invoice-address">{date(r.date)}</div>
    <div className="invoice-meta"><div><p>To,</p><p>{r.client}</p><p>Address · {r.address}</p><p>State · {r.state}</p><p>State Code · {r.stateCode}</p><p>GSTIN · {r.gstin}</p></div>
      <div><p>Purchase Order/Ref. No. · {r.po||'—'}</p><p>Invoice No. · {r.number}</p><p>Contract/Order Date · {date(r.orderDate)}</p><p>Project Name · {r.projectName}</p><p>Contact Person · {r.contact}</p><p>Contact No. · {r.phone}</p></div></div>
    <Table columns={['S. No.','Description of Services','SAC Code','Unit','Qty','Unit Rate','Total Amount']} rows={r.items.map((i,j)=>({cells:[j+1,i.description,i.sac,i.unit,i.quantity,money(i.rate),money(i.amount)]}))}/>
    <div className="invoice-totals">Subtotal &nbsp; {money(r.amount)}<br/><strong>Total &nbsp; {money(r.amount)}</strong></div>
    <div className="invoice-footer"><p>Rupees: {words}</p><p>Declaration: Composition taxable person, not eligible to collect taxes on supplies</p>
      <p>Kindly note our Bank Account Number and IFSC for INR remittances.</p>
      <p>NAME: Enlighten Designs<br/>A/C#: 10148974324<br/>IFSC: IDFB0020126<br/>BANK: IDFC First, Punjabi Bagh</p>
      <p style={{textAlign:'right',marginTop:34}}>Shivam Gupta<br/>Partner</p></div>
  </article>;
}

function draftInvoice(draft,projects){
  const items=draft.items.map(item=>{
    const qty=Number(item.quantity),unitRate=Math.round(Number(item.rate)*100);
    const quantity=Number.isSafeInteger(qty)&&qty>0&&qty<=10000?qty:0;
    const rate=Number.isSafeInteger(unitRate)&&unitRate>0&&Number.isSafeInteger(unitRate*quantity)?unitRate:0;
    return {...item,quantity,rate,amount:quantity*rate};
  });
  return {...draft,number:'Draft · assigned when saved',projectName:projects.find(project=>project.id===draft.projectId)?.name,items,amount:total(items,'amount')};
}

function originalInvoice(attachment){
  const url=/^https:\/\/drive\.google\.com\//i.test(attachment||'')?new URL(attachment):null;
  const id=url?.pathname.match(/^\/file\/d\/([\w-]+)/)?.[1]||url?.searchParams.get('id');
  if(!id||!/^[-\w]+$/.test(id))return {};
  const preview=new URL('https://drive.google.com/file/d/'+id+'/preview');
  const key=url.searchParams.get('resourcekey');
  if(key)preview.searchParams.set('resourcekey',key);
  return {url:url.href,preview:preview.href};
}

function InvoiceDocument({invoice,documentRef}){
  if(invoice.kind!=='legacyInvoice')return <Invoice invoice={invoice} printRef={documentRef}/>;
  const original=originalInvoice(invoice.attachment);
  if(original.preview)return <iframe className="invoice-original-frame" title="Original invoice document" src={original.preview}/>;
  return <article className="accounts-invoice invoice-history-paper" ref={documentRef}>
    <h1>Enlighten Designs</h1>
    <h2>Imported invoice record</h2>
    <dl>{[['Invoice number',invoice.sourceNumber||invoice.number],['Date',invoice.date],['Project',invoice.projectName],['Client',invoice.client],['Total',money(invoice.amount)]].map(([label,value])=><div key={label}><dt>{label}</dt><dd>{value||'—'}</dd></div>)}</dl>
    <p>Original invoice PDF unavailable.{invoice.attachment&&' File reference: '+invoice.attachment}</p>
  </article>;
}

function InvoiceWorkspace({records,invoice,editing,busy,form,onChoose,onNew,onClose,onPayment,canPay,sent,onMarkSent}){
  const documentRef=useRef(null),editorRef=useRef(null),[message,setMessage]=useState('');
  const [query,setQuery]=useState('');
  const number=invoice?.sourceNumber||invoice?.number;
  useEffect(()=>{setMessage('');},[invoice?.id]);
  const original=invoice?.kind==='legacyInvoice'?originalInvoice(invoice.attachment):{};
  const summary=invoice?[number,invoice.client,invoice.projectName,money(invoice.amount)].filter(Boolean).join(' · '):'';
  const share=async()=>{
    try{
      if(navigator.share)await navigator.share({title:number,text:summary,...(original.url?{url:original.url}:{})});
      else{await navigator.clipboard.writeText([summary,original.url].filter(Boolean).join('\n'));setMessage('Invoice details copied.');}
    }catch(e){if(e.name!=='AbortError')setMessage('Sharing was unavailable.');}
  };
  const print=()=>{
    setMessage('');
    try{printMarkup(documentRef.current,number);}
    catch(e){setMessage(e.message);}
  };
  const mail=invoice&&!editing?'mailto:?subject='+encodeURIComponent('Invoice '+number)+'&body='+encodeURIComponent([summary,original.url].filter(Boolean).join('\n\n')):undefined;
  const search=query.trim().toLowerCase();
  const visible=records.filter(record=>[record.number,record.sourceNumber,record.client,record.projectName].some(value=>String(value||'').toLowerCase().includes(search)));
  return <div className="invoice-workspace">
    <aside className="invoice-list" aria-label="Invoice list">
      <header><h2>All Invoices</h2>{onNew&&<button type="button" disabled={editing} onClick={onNew}>＋ New invoice</button>}</header>
      <input type="search" className="invoice-search" aria-label="Search invoices" placeholder="Search invoices" value={query} onChange={e=>setQuery(e.target.value)}/>
      {visible.map(record=><button className="invoice-list-row" type="button" key={record.id} disabled={editing||busy} aria-current={invoice?.id===record.id?'true':undefined} onClick={()=>onChoose(record)}>
        <strong>{record.client||record.projectName||record.number}</strong><strong>{money(record.amount)}</strong>
        <span>{[record.sourceNumber||record.number,record.date].filter(Boolean).join(' · ')}</span>
        <small>{record.kind==='legacyInvoice'?'Imported':record.documentType}</small>
      </button>)}
      {!visible.length&&<p>{search?'No matching invoices.':'No invoices yet.'}</p>}
    </aside>
    <section className="invoice-detail" aria-label="Invoice detail">
      {invoice?<><header className="invoice-detail-heading"><div><small>{invoice.projectName||invoice.client||'Invoice'}</small><h2>{editing?'New invoice':number}</h2></div>{onClose&&<button type="button" onClick={onClose} aria-label={editing?'Cancel invoice draft':'Close invoice'}>×</button>}</header>
        <nav className="invoice-toolbar" aria-label="Invoice actions">
          <button type="button" disabled={!editing} title={editing?'Go to draft fields':'Only unsaved drafts can be edited'} onClick={()=>editorRef.current?.querySelector('input,select')?.focus()}>Edit</button>
          {mail?<a href={mail} title="Open an email draft with invoice details">Send</a>:<button type="button" disabled>Send</button>}
          <button type="button" disabled={editing} onClick={share}>Share</button>
          {original.url?<a href={original.url} target="_blank" rel="noreferrer">PDF/Print</a>:<button type="button" disabled={editing||invoice.kind==='legacyInvoice'} onClick={print}>PDF/Print</button>}
          <button type="button" disabled={!canPay} onClick={onPayment}>Record Payment</button>
        </nav>
        {message&&<p className="invoice-action-message" role="status">{message}</p>}
        {mail&&<div className="invoice-next">
          {sent?<strong>Marked as sent · {sent.date}</strong>:<a href={mail}>Send Invoice</a>}
          {!sent&&onMarkSent&&<button type="button" disabled={busy} onClick={onMarkSent}>Mark As Sent</button>}
          {!sent&&<span>Email opens in your mail app{original.url?' with the original link':'. Attach the PDF before sending'}.</span>}
        </div>}
        {!editing&&form}
        <div className={editing?'invoice-live invoice-live-editing':'invoice-live'}>
          {editing&&form&&<div ref={editorRef}>{form}</div>}
          <div className="invoice-paper-pane">{editing&&<div className="invoice-draft-label">Draft · Live preview</div>}<InvoiceDocument invoice={invoice} documentRef={documentRef}/></div>
        </div>
      </>:<p className="invoice-action-message">Select an invoice to preview it.</p>}
    </section>
  </div>;
}

export default function Accounts({page,request,user}){
  const [data,setData]=useState(null),[draft,setDraft]=useState(null),[selected,setSelected]=useState(null);
  const [busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState('');
  const [month,setMonth]=useState(''),[asOf,setAsOf]=useState(today);
  const [payMonth,setPayMonth]=useState(()=>today().slice(0,7)),[staffQuery,setStaffQuery]=useState('');
  const [bank,setBank]=useState('IDFC'),[staged,setStaged]=useState([]);
  const [cashFrom,setCashFrom]=useState(()=>String(Number(today().slice(0,4))-(today().slice(5,7)<'04'?1:0))+'-04-01');
  const printRef=useRef(null), saving=useRef(false);
  const [invoiceClosed,setInvoiceClosed]=useState(false);
  const readOnly=/^viewer$/i.test(user.appAccess);
  const load=async()=>{
    setError('');
    try{setData(await request('getAccounts'));}
    catch(e){setError(e.message);}
  };
  useEffect(()=>{load();},[]);
  useEffect(()=>{setDraft(null);setSelected(null);setInvoiceClosed(false);setNotice('');setError('');},[page]);
  const save=async e=>{
    e.preventDefault();
    if(saving.current)return;
    saving.current=true;
    setBusy(true);setError('');setNotice('');
    try{
      const record=await request('saveAccounts',draft);
      setData(d=>({...d,records:[...d.records.filter(r=>r.id!==record.id),record]}));
      if(draft.importId)setStaged(rows=>rows.filter(r=>r.id!==draft.importId));
      setDraft(null);setNotice('Saved to Accounts.');
      if(['invoice','payroll'].includes(record.kind))setSelected(record);
    }catch(e){setError(e.message);}
    finally{saving.current=false;setBusy(false);}
  };
  const useAttendance=async()=>{
    const id=draft.id;
    setBusy(true);setError('');
    try{
      const counts=await request('getAccountsAttendance',{employeeId:draft.employeeId,date:draft.date});
      setDraft(d=>d?.id===id?{...d,...counts}:d);
    }catch(e){setError(e.message);}finally{setBusy(false);}
  };
  const importStatement=async event=>{
    const file=event.target.files?.[0],source=bank;
    event.target.value='';
    if(!file)return;
    setError('');
    try{
      if(file.size>1024*1024)throw Error('Choose a CSV smaller than 1 MB.');
      const rows=parseStatement(await file.text()).map(row=>({...row,bank:source,id:crypto.randomUUID()}));
      setStaged(rows);
    }catch(e){setError(e.message);}
  };
  const matchStatement=async rows=>{
    if(saving.current||!rows.length)return;
    saving.current=true;setBusy(true);setError('');setNotice('');
    let matched=0;
    const remaining=new Map();
    try{
      for(const row of rows){
        try{
          const result=await request('saveAccounts',{...row,kind:'reconciliation',head:''});
          setData(d=>({...d,records:[...d.records.filter(r=>r.id!==result.id),result]}));
          matched++;
        }catch(e){remaining.set(row.id,e.message);}
      }
      const ids=new Set(rows.map(r=>r.id));
      setStaged(previous=>previous.flatMap(row=>!ids.has(row.id)?[row]:remaining.has(row.id)?[{...row,issue:remaining.get(row.id)}]:[]));
      setNotice(matched+' matched · '+remaining.size+' need review.');
    }finally{saving.current=false;setBusy(false);}
  };
  const print=()=>{try{printMarkup(printRef.current,selected.number||'Payslip');}catch(e){setError(e.message);}};
  if(!data)return <>{error?<><p role="alert">{error}</p><button onClick={load}>Retry</button></>:<p role="status">Loading Accounts…</p>}</>;
  const {records,projects,heads,employees}=data;
  const invoices=records.filter(r=>r.kind==='invoice'&&r.documentType!=='Proforma Invoice');
  const receipts=records.filter(r=>r.kind==='receipt');
  const paid=id=>total(receipts.filter(r=>r.invoiceId===id),'amount');
  const begin=(kind,fields={})=>{setSelected(null);setDraft({...makeDraft(kind),...fields});setError('');setNotice('');requestAnimationFrame(()=>document.querySelector('.accounts-form')?.scrollIntoView({block:'nearest'}));};
  const update=(key,value)=>setDraft(d=>({...d,[key]:value}));
  const field=(label,key,type='text',required=false,options={})=><label>{label}<input type={type} required={required} value={draft[key]??''} onChange={e=>update(key,e.target.value)} {...options}/></label>;
  const options=(label,key,values,required=false,callback)=><label>{label}<select value={draft[key]??''} required={required} onChange={e=>{update(key,e.target.value);callback?.(e.target.value);}}><option value="">Select</option>
    {values.map(v=>{const [value,name]=Array.isArray(v)?v:[v,v];return <option key={value} value={value}>{name}</option>;})}</select></label>;
  const projectOptions=projects.map(p=>[p.id,p.name]);
  const milestones=records.filter(r=>r.kind==='milestone');
  const age=r=>Math.max(0,Math.floor((Date.parse(today())-Date.parse(r.dueDate))/86400000));
  const open=invoices.filter(r=>r.amount>paid(r.id));
  const settled=r=>r.amount===paid(r.id);
  const selectedReceipts=month?receipts.filter(r=>r.date.startsWith(month)):receipts;
  const report=records.filter(r=>r.date<=asOf).flatMap(r=>r.postings);
  const headRows=heads.map(([name,type])=>{const entries=report.filter(r=>r.head===name);return {name,type,balance:total(entries,'debit')-total(entries,'credit')};});
  const balance=type=>total(headRows.filter(r=>r.type===type),'balance');
  const margin=-balance('Revenue')-balance('Direct expense');
  const surplus=margin-balance('Expense');
  const payroll=records.filter(r=>r.kind==='payroll'&&r.date.startsWith(payMonth));
  const cashFlows={'Operating':0,'Investing':0,'Financing':0,'Unclassified':0};
  const classifications={
    'Asset':'Unclassified','Liability':'Unclassified','Equity':'Financing',
    'Revenue':'Operating','Expense':'Operating','Direct expense':'Operating'
  };
  const cashType=head=>{
    if(/fixed assets|building renovation|hardware & software|fixed deposit/i.test(head))return 'Investing';
    if(/^(loan|intercompany clearing)$/i.test(head))return 'Financing';
    if(/accounts receivable|accounts payable|payroll payable|gst composition payable|employee advances|advance from customers|payroll deductions payable/i.test(head))return 'Operating';
    return classifications[heads.find(([h])=>h===head)?.[1]]||'Unclassified';
  };
  for(const row of records.filter(r=>r.date>=cashFrom&&r.date<=asOf&&r.kind!=='opening')){
    for(let i=0;i<row.postings.length;i+=2){
      const [dr,cr]=row.postings.slice(i,i+2);
      const debitCash=banks.includes(dr.head),creditCash=banks.includes(cr.head);
      if(debitCash!==creditCash)cashFlows[cashType(debitCash?cr.head:dr.head)]+=debitCash?dr.debit:-cr.credit;
    }
  }
  const invoiceList=records.filter(r=>['invoice','legacyInvoice'].includes(r.kind))
    .sort((a,b)=>String(b.date||'').localeCompare(String(a.date||'')));
  const activeInvoice=draft?.kind==='invoice'?draftInvoice(draft,projects):
    ['invoice','legacyInvoice'].includes(selected?.kind)?selected:invoiceClosed?null:invoiceList[0];
  const sent=records.find(r=>r.kind==='invoiceDispatch'&&r.sentInvoiceId===activeInvoice?.id);
  const markSent=async()=>{
    if(saving.current)return;
    saving.current=true;
    setBusy(true);setError('');setNotice('');
    try{
      const record=await request('saveAccounts',{kind:'invoiceDispatch',id:crypto.randomUUID(),date:today(),sentInvoiceId:activeInvoice.id});
      setData(current=>({...current,records:[...current.records.filter(r=>r.id!==record.id),record]}));
    }catch(e){setError(e.message);}
    finally{saving.current=false;setBusy(false);}
  };
  const editor=draft&&<form onSubmit={save} className="accounts-form">
      <h2>{({milestone:'Schedule milestone',invoice:'Raise invoice',receipt:'Record receipt',transaction:'Record transaction',payroll:'Post payroll',reconciliation:'Reconcile statement line',opening:'Add opening journal'})[draft.kind]}</h2>
      <fieldset disabled={busy}><div className="accounts-fields">
      {field(draft.kind==='milestone'?'Scheduled date':'Date','date','date',true)}
      {['milestone','invoice','transaction'].includes(draft.kind)&&options('Project','projectId',projectOptions,draft.kind!=='transaction',id=>{
        if(draft.kind==='invoice'){update('client',projects.find(p=>p.id===id)?.client||'');update('milestoneId','');}
      })}
      {['milestone','receipt','transaction','reconciliation','opening'].includes(draft.kind)&&field('Amount (INR)','amount','number',true,{min:'0.01',step:'0.01'})}
      {['transaction','reconciliation','receipt'].includes(draft.kind)&&<>{options('Source account','bank',banks,true)}{field('UTR / cheque / reference','reference','text',draft.kind==='reconciliation')}</>}
      {['transaction','reconciliation'].includes(draft.kind)&&<>
        {options('Flow direction','direction',[['Outflow','Debit · outflow'],['Inflow','Credit · inflow']],true)}
        {options(draft.kind==='reconciliation'?'Clearing ledger if unmatched':'Ledger head','head',heads.filter(([h])=>h!==draft.bank).map(([h])=>h),draft.kind==='transaction')}
      </>}
      {['milestone','transaction','reconciliation'].includes(draft.kind)&&field('Description','description','text',draft.kind==='milestone')}
      {draft.kind==='opening'&&<>{options('Debit head','debitHead',heads.map(([h])=>h),true)}{options('Credit head','creditHead',heads.map(([h])=>h),true)}{field('Opening reference','description','text',true)}</>}
      {draft.kind==='transaction'&&<>{field('Value date','valueDate','date')}{field('Beneficiary','beneficiary')}{options('Classification','classification',['Project direct cost','Studio overhead','Owner drawings'])}{draft.head==='Employee Advances'&&options('Employee','employeeId',employees.map(e=>[e.id,e.name]),true)}</>}
      {draft.kind==='invoice'&&<>
        {options('Document type','documentType',['Proforma Invoice','Invoice','Bill of Supply'],true)}
        {options('Milestone','milestoneId',milestones.filter(m=>m.projectId===draft.projectId&&!invoices.some(r=>r.milestoneId===m.id)).map(m=>[m.id,m.description]),false,id=>{const m=milestones.find(r=>r.id===id);if(m)update('items',[{...freshItem(),description:m.description,rate:m.amount/100}]);})}
        {field('Due date','dueDate','date')}{field('Client','client','text',true)}
        <label>Billing address<textarea required value={draft.address||''} onChange={e=>update('address',e.target.value)}/></label>
        {field('State','state')}{field('State code','stateCode')}{field('Client GSTIN','gstin')}{field('PO / Reference','po')}{field('Contract / order date','orderDate','date')}{field('Contact person','contact')}{field('Contact number','phone','tel')}
      </>}
      {draft.kind==='payroll'&&<>
        {options('Employee','employeeId',employees.map(e=>[e.id,e.name]),true)}{options('Daily wage basis','method',['Working days','Calendar days'],true)}
        {field('Monthly gross (INR)','gross','number',true,{min:'0.01',step:'0.01'})}
        {[['Working days','working',1],['Present days','present',.5],['Paid leave','leave',.5],['Overtime hours','hours',.25],['Overtime multiplier','multiplier',.01],['Allowances (INR)','allowances',.01],['Other deductions (INR)','deductions',.01],['Advance recovery (INR)','advance',.01]].map(([label,key,step],i)=><React.Fragment key={key}>{field(label,key,'number',i===0,{min:0,step})}</React.Fragment>)}
      </>}
      </div>
      {draft.kind==='payroll'&&<div className="accounts-actions"><button type="button" disabled={!draft.employeeId||!draft.date} onClick={useAttendance}>Load monthly attendance</button><span>Review working days, holidays, paid leave and overtime before posting.</span></div>}
      {draft.kind==='invoice'&&<><h3>Service lines</h3>{draft.items.map((line,i)=><div className="accounts-fields accounts-line" key={i}>
        {[['Description','description','text'],['SAC','sac','text'],['Unit','unit','text'],['Quantity','quantity','number'],['Unit rate (INR)','rate','number']].map(([label,key,type])=><label key={key}>{label}<input required type={type} min={type==='number'?(key==='rate'?.01:1):undefined} step={key==='rate'?.01:undefined} value={line[key]} onChange={e=>update('items',draft.items.map((other,j)=>j===i?{...other,[key]:e.target.value}:other))}/></label>)}
        <button type="button" disabled={draft.items.length===1} onClick={()=>update('items',draft.items.filter((_,j)=>i!==j))}>Remove line</button></div>)}
      <button type="button" disabled={draft.items.length>=25} onClick={()=>update('items',[...draft.items,freshItem()])}>Add line</button></>}
      <div className="accounts-actions"><button type="submit">{busy?'Saving…':draft.kind==='invoice'?'Save invoice':'Save'}</button><button type="button" onClick={()=>setDraft(null)}>Cancel</button></div></fieldset>
    </form>;
  return <section className="accounts">
    {error&&<p role="alert" className="accounts-error">{error}</p>}{notice&&<p role="status">{notice}</p>}
    {page==='Payment Dashboard'&&<>
      <div className="accounts-metrics">{[['Billed',total(invoices,'amount')],['Receipts',total(receipts,'amount')],['Outstanding',total(open,'amount')-open.reduce((n,r)=>n+paid(r.id),0)]].map(([key,value])=><div key={key}><span>{key}</span><strong>{money(value)}</strong></div>)}</div>
      {!readOnly&&<button onClick={()=>begin('milestone')}>Add milestone</button>}
      <h2>Project balances</h2>
      <Table columns={['Project','Client','Commitment','Received','Remaining commitment']} rows={projects.filter(p=>records.some(r=>r.projectId===p.id)).map(p=>{
        const commitment=total(milestones.filter(r=>r.projectId===p.id),'amount');
        const received=total(receipts.filter(r=>r.projectId===p.id),'amount');
        return {key:p.id,cells:[p.name,p.client||'—',commitment?money(commitment):'—',money(received),commitment?money(commitment-received):'—']};
      })}/>
      <h2>Billing milestones and receivables</h2>
      <Table columns={['Project','Milestone / invoice','Due','Amount','Received','Outstanding','Status','Action']} rows={[
        ...milestones.filter(m=>!invoices.some(r=>r.milestoneId===m.id)).map(m=>({key:m.id,cells:[m.projectName,m.description,m.date,money(m.amount),'—','—','Scheduled',!readOnly&&<button onClick={()=>begin('invoice',{projectId:m.projectId,milestoneId:m.id,client:projects.find(p=>p.id===m.projectId)?.client,items:[{...freshItem(),description:m.description,rate:m.amount/100}]})}>Raise invoice</button>]})),
        ...invoices.map(r=>({key:r.id,status:settled(r)?'settled':'outstanding',cells:[r.projectName,r.number,r.dueDate,money(r.amount),money(paid(r.id)),money(r.amount-paid(r.id)),settled(r)?'Settled':age(r)?'Overdue':'Awaiting payment',!readOnly&&!settled(r)&&<button onClick={()=>begin('receipt',{invoiceId:r.id,direction:'Inflow'})}>Record receipt</button>]}))
      ]}/>
      <h2>Aging and cash collections</h2>
      <div className="accounts-metrics">{[[0,30],[31,60],[61,Infinity]].map(([min,max])=><div key={min}><span>{max===Infinity?'61+':min+'–'+max} days</span><strong>{money(open.filter(r=>r.dueDate<=today()&&age(r)>=min&&age(r)<=max).reduce((n,r)=>n+r.amount-paid(r.id),0))}</strong></div>)}</div>
      <label>Collection month <input type="month" value={month} onChange={e=>setMonth(e.target.value)}/></label> <strong>{money(total(selectedReceipts,'amount'))}</strong>
    </>}
    {(page==='Invoicing'||draft?.kind==='invoice')&&<InvoiceWorkspace records={invoiceList} invoice={activeInvoice}
      editing={draft?.kind==='invoice'} busy={busy} form={editor} sent={sent}
      onMarkSent={!readOnly&&!draft?markSent:undefined} onChoose={record=>{setSelected(record);setInvoiceClosed(false);setDraft(null);}}
      onNew={readOnly||busy?undefined:()=>begin('invoice')}
      onClose={busy?undefined:()=>{if(draft)setDraft(null);else{setSelected(null);setInvoiceClosed(true);}}}
      canPay={!readOnly&&!busy&&!draft&&activeInvoice?.kind==='invoice'&&activeInvoice.documentType!=='Proforma Invoice'&&activeInvoice.amount>paid(activeInvoice.id)}
      onPayment={()=>{setDraft({...makeDraft('receipt'),invoiceId:activeInvoice.id,direction:'Inflow'});setError('');setNotice('');}}/>}
    {page==='Debit / Credit'&&records.some(r=>r.kind==='legacyDesign')&&<details>
      <summary>Imported Design transactions</summary>
      <Table columns={['Date','Type','Project','Description','Ledger head','Amount','IDFC']} rows={records.filter(r=>r.kind==='legacyDesign').map(r=>({key:r.id,cells:[r.date,r.type,r.projectName,r.description,r.head,money(r.amount),r.idfc?'Matched':'—']}))}/>
    </details>}
    {page==='Reconciliation'&&records.some(r=>r.kind==='legacyDesign'&&r.idfc)&&<details>
      <summary>Imported IDFC matches</summary>
      <Table columns={['Date','Value date','Description','Reference','Debit','Credit']} rows={records.filter(r=>r.kind==='legacyDesign'&&r.idfc).map(({id,idfc:r})=>({key:id,cells:[r.date,r.valueDate,r.description,r.reference,r.debit||'—',r.credit||'—']}))}/>
    </details>}
    {page==='Debit / Credit'&&<>{!readOnly&&<button onClick={()=>begin('transaction')}>New transaction</button>}<Table columns={['Date','Value date','Account','Direction','Ledger head','Project','Reference','Amount']} rows={records.filter(r=>r.kind==='transaction').map(r=>({key:r.id,cells:[r.date,r.valueDate,r.bank,r.direction,r.head,r.projectName||'Studio',r.reference,money(r.amount)]}))}/></>}
    {page==='Reconciliation'&&<>
      <p>Import an Enlighten bank statement, match posted entries, then review exceptions before posting them.</p>
      {!readOnly&&<div className="accounts-toolbar">
        <label>Statement account <select value={bank} onChange={e=>setBank(e.target.value)} disabled={busy}>{banks.map(name=><option key={name}>{name}</option>)}</select></label>
        <label>Import CSV <input type="file" accept=".csv,text/csv" onChange={importStatement} disabled={busy}/></label>
        <a download="Enlighten_Statement_Template.csv" href="data:text/csv;charset=utf-8,Date%2CReference%2CDescription%2CDebit%2CCredit%0A">CSV template</a>
        <button onClick={()=>begin('reconciliation',{bank})} disabled={busy}>Enter statement line</button>
      </div>}
      {staged.length>0&&<>
        <h2>Statement review · {staged.length} lines</h2>
        <button disabled={busy} onClick={()=>matchStatement(staged)}>{busy?'Matching…':'Match posted entries'}</button>
        <Table columns={['Date','Account','Reference / description','Amount','Review','Action']} rows={staged.map(row=>{
          const [head,classification]=statementSuggestion(row);
          return {key:row.id,status:head?'routine':undefined,cells:[row.date,row.bank,<>{row.reference}<br/>{row.description}</>,money(Number(row.amount)*100),[classification,row.issue].filter(Boolean).join(' · ')||'Ready to match',<button disabled={busy} onClick={()=>begin('reconciliation',{...row,importId:row.id,head})}>Review line</button>]};
        })}/>
      </>}
      <h2>Reconciled entries</h2>
      <Table columns={['Date','Account','Direction','Reference','Amount','Match']} rows={records.filter(r=>r.kind==='reconciliation').map(r=>({key:r.id,cells:[r.date,r.bank,r.direction,r.reference,money(r.amount),r.matchId?'Matched journal entry':r.head]}))}/>
    </>}
    {page==='Chart of Accounts'&&<Table columns={['Division','Type','Head','Sub Head']} rows={heads.map(([head,type,subhead])=>({cells:['Design',type,head,subhead||'—']}))}/>}
    {page==='Payroll'&&<>
      <div className="accounts-toolbar"><label>Payroll month <input type="month" value={payMonth} onChange={e=>setPayMonth(e.target.value)}/></label><label>Find employee <input type="search" value={staffQuery} onChange={e=>setStaffQuery(e.target.value)} placeholder="Name or department"/></label></div>
      <Table columns={['Employee','Department','Role','Status','Net pay','Action']} rows={employees.filter(e=>[e.name,e.department,e.role].filter(Boolean).join(' ').toLowerCase().includes(staffQuery.trim().toLowerCase())).map(e=>{
        const run=payroll.find(r=>r.employeeId===e.id);
        return {key:e.id,cells:[e.name,e.department||'—',e.role||'—',run?'Posted':'To prepare',run?money(run.amount):'—',run?<button onClick={()=>setSelected(run)}>Payslip</button>:!readOnly&&<button disabled={!payMonth} onClick={()=>begin('payroll',{employeeId:e.id,date:payMonth+'-01'})}>Prepare payroll</button>]};
      })}/>
      <h2>Payroll history</h2>
      <Table columns={['Employee','Month','Earned','Overtime','Deductions','Advance recovery','Net pay','Action']} rows={records.filter(r=>r.kind==='payroll').slice().reverse().map(r=>({key:r.id,cells:[r.employee,r.date.slice(0,7),money(r.earned),money(r.overtime),money(r.deductions),money(r.advance),money(r.amount),<button onClick={()=>setSelected(r)}>Payslip</button>]}))}/>
    </>}
    {page==='Financial Reports'&&<>
      <label>Balances as of <input type="date" value={asOf} onChange={e=>setAsOf(e.target.value)}/></label>
      {user.canChooseDepartment&&!readOnly&&<button onClick={()=>begin('opening')}>Add opening journal</button>}
      <h2>Trial balance</h2>
      <p role="status">{total(report,'debit')===total(report,'credit')?'Balanced':'Discrepancy'} · {money(total(report,'debit')-total(report,'credit'))}</p>
      <Table columns={['Head','Type','Closing debit','Closing credit']} rows={headRows.map(r=>({cells:[r.name,r.type,r.balance>0?money(r.balance):'—',r.balance<0?money(-r.balance):'—']}))}/>
      <h2>Profit &amp; loss</h2>
      <Table columns={['Measure','Amount']} rows={[[ 'Design revenue',-balance('Revenue')],['Direct costs',balance('Direct expense')],['Gross profit',margin],['Operating expenses',balance('Expense')],['Net profit',surplus]].map(([k,v])=>({cells:[k,money(v)]}))}/>
      <h2>Balance sheet</h2>
      <Table columns={['Measure','Amount']} rows={[[ 'Assets',balance('Asset')],['Liabilities',-balance('Liability')],['Equity including earnings',-balance('Equity')+surplus]].map(([k,v])=>({cells:[k,money(v)]}))}/>
      <h2>Cash flow by activity</h2>
      <label>Cash-flow start <input type="date" value={cashFrom} max={asOf} onChange={e=>setCashFrom(e.target.value)}/></label>
      <Table columns={['Activity','Net cash flow']} rows={Object.entries(cashFlows).map(([type,amount])=>({cells:[type,money(amount)]}))}/>
      <h2>Cash movement by account through {asOf}</h2>
      <Table columns={['Cash / bank','Inflows','Outflows','Net']} rows={banks.map(bank=>{
        const rows=report.filter(r=>r.head===bank), debit=total(rows,'debit'), credit=total(rows,'credit');
        return {cells:[bank,money(debit),money(credit),money(debit-credit)]};
      })}/>
    </>}
    {page!=='Invoicing'&&draft?.kind!=='invoice'&&editor}
    {selected?.kind==='payroll'&&<section className="accounts-preview"><div className="accounts-actions"><button onClick={print}>Print / Save as PDF</button><button onClick={()=>setSelected(null)}>Close</button></div>
      <article ref={printRef}><h1>Enlighten Designs · Payslip</h1><p>{selected.employee} · {selected.date.slice(0,7)}</p>
      <Table columns={['Pay component','Amount']} rows={[[ 'Earned pay',selected.earned],['Allowances',selected.allowances],['Overtime',selected.overtime],['Other deductions',selected.deductions],['Advance recovery',selected.advance],['Net pay',selected.amount]].map(([k,v])=>({cells:[k,money(v)]}))}/></article>
    </section>}
  </section>;
}
