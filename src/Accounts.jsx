import BalanceSheet from './BalanceSheet.jsx';
import PayrollAttendance from './PayrollAttendance.jsx';
import OfficePolicy from './OfficePolicy.jsx';
import {partyLedger} from './party-ledger.mjs';
import DesignTransactions from './DesignTransactions.jsx';
import StudioHeading from './StudioHeading.jsx';
import AccountsReconciliation from './AccountsReconciliation.jsx';
import {ProjectBilling} from './ProjectBilling.jsx';
import {invoiceForDisplay} from './InvoiceHistory.js';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import './Accounts.css';
import PaymentDashboard from './PaymentDashboard.jsx';
import {AccountsDashboard, BankingOverview, GstOverview, bankAccounts, studioGstin} from './AccountsOverview.jsx';
import PagesInvoice, {printPagesInvoice} from './PagesInvoice.jsx';
import { Mail, Share2, Printer, Edit3, DollarSign, Download, Search, CheckCircle, ArrowRight, X } from 'lucide-react';

export const accountsPages = ['Projects & Clients','Payment Dashboard','Estimates','Invoices','Debit / Credit','Banking','GST','Chart of Accounts','Party Ledger','Payroll','Financial Reports'];
const banks = bankAccounts;
const today = () => new Date().toLocaleDateString('sv-SE',{timeZone:'Asia/Kolkata'});
const money = n => new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR'}).format((n||0)/100);
const total = (rows,key) => rows.reduce((sum,row)=>sum+(Number(row[key])||0),0);
const freshItem = () => ({description:'',sac:'99839',unit:'LS',quantity:1,rate:''});

const makeDraft = kind => ({
  kind,
  id: crypto.randomUUID(),
  date: today(),
  bank: 'IDFC',
  direction: 'Outflow',
  documentType: 'Invoice',
  ...(kind==='invoice'?{items:[freshItem()]}:{}),
  ...(kind==='payroll'?{method:'Working days',multiplier:1}:{})
});

function Table({columns,rows,empty='No records yet.'}){
  return <div className="accounts-scroll"><table><thead><tr>{columns.map(x=><th key={x} scope="col">{x}</th>)}</tr></thead>
    <tbody>{rows.length?rows.map((row,i)=><tr key={row.key||i} data-status={row.status} style={row.style}>{row.cells.map((x,j)=><td key={j}>{x}</td>)}</tr>):
      <tr><td colSpan={columns.length}>{empty}</td></tr>}</tbody></table></div>;
}

// In-page iframe print helper that bypasses browser pop-up blockers completely
function printMarkup(node, title){
  if(node?.shadowRoot) { printPagesInvoice(node,title); return; }
  try {
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow.document;
    doc.title = title || 'Enlighten Document';
    doc.head.innerHTML = `<style>
      @page { size: A4; margin: 14mm; }
      body { font: 10pt Arial, sans-serif; color: #222; margin: 0; background: #fff; }
      h1, h2 { text-align: center; margin: 10px 0 4px; }
      .invoice-brand { font-size: 28pt; font-weight: 300; letter-spacing: .1em; border-bottom: 1px solid #333; margin: 0 0 6px; }
      .invoice-brand svg { width: 380px; max-width:100%; height:auto; }
      .invoice-address { text-align: center; line-height: 1.45; font-size: 9pt; }
      .invoice-meta { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin: 34px 0 20px; font-size: 9.5pt; }
      .invoice-meta p { margin: 4px 0; white-space: pre-line; }
      table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 9.5pt; }
      th, td { text-align: left; vertical-align: top; padding: 7px 5px; border-bottom: 1px solid #bbb; }
      th { background: #252525; color:#fff; print-color-adjust: exact; -webkit-print-color-adjust: exact; font-weight: 600; }
      tr, .invoice-footer { break-inside: avoid; }
      td:first-child, td:nth-child(n+3) { white-space: nowrap; }
      .invoice-totals { text-align: right; line-height: 1.7; margin-top: 12px; font-size: 10pt; }
      .invoice-footer { margin-top: 25px; line-height: 1.5; font-size: 9pt; }
    </style>`;

    doc.body.appendChild(node.cloneNode(true));
    iframe.contentWindow.focus();
    iframe.contentWindow.print();
    setTimeout(() => {
      try { document.body.removeChild(iframe); } catch(e){}
    }, 2500);
  } catch(e) {
    const popup = window.open('','_blank','width=920,height=900');
    if (!popup) throw Error('Please allow pop-ups to print this document.');
    popup.document.title = title;
    popup.document.body.appendChild(node.cloneNode(true));
    popup.focus();
    popup.print();
  }
}

function numberWords(n){
  const small=['Zero','One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten','Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen'];
  const tens=['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety'];
  if(n<20)return small[n];
  if(n<100)return tens[Math.floor(n/10)]+(n%10?' '+small[n%10]:'');
  const [size,label]=[[10000000,'Crore'],[100000,'Lakh'],[1000,'Thousand'],[100,'Hundred']].find(([size])=>n>=size);
  return numberWords(Math.floor(n/size))+' '+label+(n%size?' '+numberWords(n%size):'');
}

function Invoice({invoice,printRef}){
  const words=invoice.words||(numberWords(Math.floor(invoice.amount/100))+(invoice.amount%100?' and '+numberWords(invoice.amount%100)+' Paise':'')+' Only');
  return <PagesInvoice invoice={{...invoice,words}} printRef={printRef}/>;
}

function draftInvoice(draft,projects){
  const items=(draft.items||[]).map(item=>{
    const qty=Number(item.quantity),unitRate=Math.round(Number(String(item.rate).replace(/,/g,''))*100);
    const quantity=Number.isSafeInteger(qty)&&qty>0&&qty<=10000?qty:0;
    const rate=Number.isSafeInteger(unitRate)&&unitRate>0&&Number.isSafeInteger(unitRate*quantity)?unitRate:0;
    return {...item,quantity,rate,amount:quantity*rate};
  });
  return {...draft,number:draft.number||'Draft · assigned when saved',projectName:projects.find(project=>project.id===draft.projectId)?.name||draft.projectName,items,amount:total(items,'amount')};
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
  const displayed=invoiceForDisplay(invoice);
  const clean=value=>String(value||'').replace(/\s/g,'');
  const numberDiff=displayed.completeHistory&&clean(displayed.number)!==clean(displayed.registerNumber);
  const amountDiff=displayed.completeHistory&&displayed.amount!==displayed.registerAmount;
  return <>
    {(numberDiff||amountDiff||displayed.sourceWarning)&&<div className="invoice-source-notice" role="note">
      {numberDiff&&<p>PDF invoice number {displayed.number} · Register number {displayed.registerNumber}</p>}
      {amountDiff&&<p>PDF total {money(displayed.amount)} · Register total {money(displayed.registerAmount)}</p>}
      {displayed.sourceWarning&&<p>{displayed.sourceWarning}</p>}
      {displayed.sourceUrl&&<a href={displayed.sourceUrl} target="_blank" rel="noreferrer">View source PDF</a>}
    </div>}
    <Invoice invoice={displayed} printRef={documentRef}/>
  </>;
}

function InvoiceWorkspace({records,invoice,editing,busy,form,onChoose,onNew,onEdit,onClose,onPayment,canPay,sent,onMarkSent,isEstimate,onConvert,converted}){
  const documentRef=useRef(null), editorRef=useRef(null);
  const [message,setMessage]=useState('');
  const [query,setQuery]=useState('');
  const [sendOpen,setSendOpen]=useState(false);

  const documentLabel=isEstimate?'Estimate':'Invoice';
  const number=invoice?invoiceForDisplay(invoice).number:undefined;
  useEffect(()=>{setMessage('');setSendOpen(false);},[invoice?.id]);
  const original=invoice?.kind==='legacyInvoice'?originalInvoice(invoiceForDisplay(invoice).sourceUrl||invoice.attachment):{};
  const summary=invoice?[number,invoice.client,invoice.projectName,money(invoice.amount)].filter(Boolean).join(' · '):'';

  const shareText = useMemo(() => {
    if (!invoice) return '';
    return `*${documentLabel} ${number} from Enlighten Designs*\n` +
      `Client: ${invoice.client || '—'}\n` +
      `Project: ${invoice.projectName || '—'}\n` +
      `Amount Due: ${money(invoice.amount)}\n` +
      `Date: ${invoice.date || '—'}\n\n` +
      `*Bank Remittance Details:*\n` +
      `Account: Enlighten Designs\n` +
      `Bank: IDFC First Bank, Punjabi Bagh\n` +
      `A/C#: 10148974324\n` +
      `IFSC: IDFB0020126\n` +
      (original.url ? `\nView Document: ${original.url}` : '');
  }, [invoice, number, original, documentLabel]);

  const share=async()=>{
    try{
      if(navigator.clipboard){
        await navigator.clipboard.writeText(shareText);
        setMessage('✓ Document and bank remittance details copied to clipboard!');
      } else if(navigator.share){
        await navigator.share({title:number,text:shareText,...(original.url?{url:original.url}:{})});
      }
    }catch(e){
      if(e.name!=='AbortError') setMessage('Could not copy details.');
    }
  };

  const print=()=>{
    setMessage('');
    try{
      printMarkup(documentRef.current, number);
      setMessage('✓ Document sent to printer.');
    } catch(e){
      setMessage(e.message);
    }
  };

  // Gmail direct compose URL (works flawlessly in browser without requiring Apple Mail desktop app)
  const recipientEmail = invoice?.contactEmail || '';
  const emailSubject = `${documentLabel} ${number} - Enlighten Designs - ${invoice?.projectName || ''}`;
  const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(recipientEmail)}&su=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(shareText)}`;
  const mailtoUrl = `mailto:${encodeURIComponent(recipientEmail)}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(shareText)}`;

  const search=query.trim().toLowerCase();
  const visible=records.filter(record=>[record.number,record.sourceNumber,record.client,record.projectName].some(value=>String(value||'').toLowerCase().includes(search)));

  return <div className="invoice-workspace">
    <aside className="invoice-list" aria-label={documentLabel+" list"}>
      <header><h2>{isEstimate?"Estimates":"Invoices"}</h2>{onNew&&<button type="button" disabled={editing} onClick={onNew}>＋ Add New Estimate</button>}</header>
      <input type="search" className="invoice-search" aria-label={`Search ${documentLabel.toLowerCase()}s`} placeholder="Search by client, project, or number…" value={query} onChange={e=>setQuery(e.target.value)}/>
      {visible.map(record=><button className="invoice-list-row" type="button" key={record.id} disabled={editing||busy} aria-current={invoice?.id===record.id?'true':undefined} onClick={()=>onChoose(record)}>
        <strong>{record.client||record.projectName||record.number}</strong><strong>{money(record.amount)}</strong>
        <span>{[record.sourceNumber||record.number,record.date].filter(Boolean).join(' · ')}</span>
        <small>{record.kind==='legacyInvoice'?'Imported':record.documentType}</small>
      </button>)}
      {!visible.length&&<p>{search?`No matching ${documentLabel.toLowerCase()}s.`:`No ${documentLabel.toLowerCase()}s yet.`}</p>}
    </aside>

    <section className="invoice-detail" aria-label="Invoice detail">
      {invoice?<><header className="invoice-detail-heading">
        <div>
          <small>{invoice.projectName||invoice.client||'Invoice'}</small>
          <h2>{editing?(converted?'Invoice draft':`${invoice.isEdit?'Edit':'New'} ${documentLabel.toLowerCase()}`):number}</h2>
        </div>
        {onClose&&<button type="button" onClick={onClose} aria-label={editing?'Cancel invoice draft':'Close invoice'}>×</button>}
      </header>

        <nav className="invoice-toolbar" aria-label="Invoice actions">
          {editing ? (
            <button type="button" onClick={()=>editorRef.current?.querySelector('input,select')?.focus()} title="Jump to draft fields">Jump to Form</button>
          ) : (
            <button type="button" disabled={!onEdit||busy} onClick={()=>onEdit?.(invoice)} title={`Edit ${documentLabel.toLowerCase()} details`}>
              <Edit3 size={13} style={{marginRight:4}}/> Edit {documentLabel}
            </button>
          )}

          <button type="button" disabled={editing} onClick={()=>setSendOpen(!sendOpen)} style={{background:sendOpen?'#eee':undefined}}>
            <Mail size={13} style={{marginRight:4}}/> Send {documentLabel}
          </button>

          {!editing&&isEstimate&&onConvert&&<button type="button" disabled={busy} onClick={onConvert}><ArrowRight size={13}/> {converted?'View Invoice':'Convert to Invoice'}</button>}

          <button type="button" disabled={editing} onClick={share} title="Copy WhatsApp/Slack summary with remittance details">
            <Share2 size={13} style={{marginRight:4}}/> Share Details
          </button>

          <button type="button" disabled={editing||invoiceForDisplay(invoice).incompleteHistory} onClick={print}>
            <Printer size={13} style={{marginRight:4}}/> Print / Save PDF
          </button>

          <button type="button" disabled={!canPay} onClick={onPayment} style={{fontWeight:600,color:canPay?'#2e7d32':undefined}}>
            <DollarSign size={13} style={{marginRight:2}}/> Record Payment
          </button>
        </nav>

        {message&&<p className="invoice-action-message" role="status" style={{background:'#e8f5e9',padding:'8px 12px',borderRadius:3,color:'#1b5e20'}}>{message}</p>}

        {/* Send Invoice Modal / Drawer */}
        {sendOpen && !editing && (
          <div style={{background:'#fbfbfb',borderBottom:'2px solid #ddd',padding:14,fontSize:13}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
              <strong>Send {documentLabel} {number} to Client</strong>
              <button type="button" onClick={()=>setSendOpen(false)} style={{border:0,background:'transparent',cursor:'pointer',fontSize:16}}>×</button>
            </div>
            <p style={{margin:'0 0 10px',color:'#555'}}>Choose how you want to send this {documentLabel.toLowerCase()}:</p>
            <div style={{display:'flex',flexWrap:'wrap',gap:8,alignItems:'center'}}>
              <a href={gmailUrl} target="_blank" rel="noreferrer" className="accounts-overview-primary" style={{textDecoration:'none',padding:'7px 12px',display:'inline-flex',alignItems:'center',gap:6}}>
                <Mail size={14}/> Open in Gmail Web
              </a>
              <button type="button" onClick={share}>Copy Full Email Draft</button>
              <a href={mailtoUrl} style={{textDecoration:'none',padding:'7px 12px',border:'1px solid #ccc',background:'#fff',color:'#333'}}>Open Default Mail Client</a>
              {!sent && onMarkSent && <button type="button" onClick={onMarkSent} disabled={busy}>Mark As Sent</button>}
              {sent && <span style={{color:'#2e7d32',fontWeight:600}}>✓ Marked sent on {sent.date}</span>}
            </div>
          </div>
        )}

        {!editing&&form}

        <div className={editing?'invoice-live invoice-live-editing':'invoice-live'}>
          {editing&&form&&<div ref={editorRef}>{form}</div>}
          <div className="invoice-paper-pane">
            {editing&&<div className="invoice-draft-label">Draft · Live preview</div>}
            <InvoiceDocument invoice={invoice} documentRef={documentRef}/>
          </div>
        </div>
      </>:<p className="invoice-action-message">Select {isEstimate?"an estimate":"an invoice"} to preview it.</p>}
    </section>
  </div>;
}

export default function Accounts({page,request,user,onNavigate,reconciliationBank}){
  const [data,setData]=useState(null),[draft,setDraft]=useState(null),[selected,setSelected]=useState(null);
  const [busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState('');
  const [asOf,setAsOf]=useState(today);
  const [reportFY,setReportFY]=useState('current');
  const [payrollTab,setPayrollTab]=useState('payroll');
  const [payMonth,setPayMonth]=useState(()=>today().slice(0,7)),[staffQuery,setStaffQuery]=useState('');
  const [coaQuery,setCoaQuery]=useState('');
  const [headDraft,setHeadDraft]=useState(null),[partyKey,setPartyKey]=useState('');
  const parties=useMemo(()=>partyLedger(page==='Party Ledger'?data?.records||[]:[]),[data,page]);
  const [bank,setBank]=useState('IDFC');
  const [cashFrom,setCashFrom]=useState(()=>String(Number(today().slice(0,4))-(today().slice(5,7)<'04'?1:0))+'-04-01');
  const printRef=useRef(null), saving=useRef(false);
  const invoiceToOpen=useRef(null);
  const [invoiceClosed,setInvoiceClosed]=useState(false);

  const readOnly=/^viewer$/i.test(user.appAccess);

  const load=async()=>{
    setError('');
    try{setData(await request('getAccounts'));}
    catch(e){setError(e.message);}
  };

  useEffect(()=>{load();},[]);
  useEffect(()=>{if(page==='Banking'&&reconciliationBank)setBank(reconciliationBank);},[page,reconciliationBank]);
  useEffect(()=>{setDraft(null);setSelected(invoiceToOpen.current);invoiceToOpen.current=null;setInvoiceClosed(false);setNotice('');setHeadDraft(null);setPartyKey('');},[page]);

  const save=async e=>{
    if(e?.preventDefault)e.preventDefault();
    if(saving.current)return;
    saving.current=true;
    setBusy(true);setError('');setNotice('');
    try{
      const record=await request('saveAccounts',draft);
      setData(d=>({...d,records:[...d.records.filter(r=>r.id!==record.id),record]}));
      if(record.kind==='receipt')await load();
      setDraft(null);setNotice(record.generatedInvoiceId?'Payment received. Invoice automatically issued for the payment date.':'Saved to Accounts.');
      if(draft.convertedFromEstimateId){
        invoiceToOpen.current=record;
        onNavigate('Invoices');
      }else if(['invoice','payroll'].includes(record.kind))setSelected(record);
    }catch(e){setError(e.message);}
    finally{saving.current=false;setBusy(false);}
  };

  const saveHead=async(remove=false)=>{
    if(saving.current||readOnly)return;
    saving.current=true;
    setBusy(true);setError('');setNotice('');
    try{
      const heads=await request('saveAccountsHead',{...headDraft,remove});
      setData(current=>({...current,heads}));
      setHeadDraft(null);
      setNotice(remove?'Account head deleted.':'Account head saved.');
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

  const print=()=>{
    try{printMarkup(printRef.current,selected?.number||'Document');}
    catch(e){setError(e.message);}
  };

  if(!data&&page==='Home')return <section className="accounts">{error&&<p role="alert" className="accounts-error">{error} <button onClick={load}>Retry</button></p>}<AccountsDashboard data={{records:[],heads:[],projects:[]}} today={today()} onNavigate={onNavigate} loading/></section>;
  if(!data)return <>{error?<><p role="alert">{error}</p><button onClick={load}>Retry</button></>:<p role="status">Loading Accounts…</p>}</>;

  const {records,projects,employees}=data;
  const heads=data.heads.filter(([head])=>head!=='Kotak');
  const invoices=records.filter(r=>['invoice','legacyInvoice'].includes(r.kind)&&r.documentType!=='Proforma Invoice');
  const receipts=records.filter(r=>r.kind==='receipt');
  const paid=id=>total(receipts.filter(r=>r.invoiceId===id||r.proformaId===id),'amount');

  const begin=(kind,fields={})=>{
    setSelected(null);
    setDraft({...makeDraft(kind),...fields});
    setError('');setNotice('');
    setTimeout(()=>document.querySelector('.accounts-form')?.scrollIntoView({behavior:'smooth',block:'nearest'}),100);
  };

  const update=(key,value)=>setDraft(d=>({...d,[key]:value}));
  const field=(label,key,type='text',required=false,options={})=><label>{label}<input type={type} required={required} value={draft[key]??''} onChange={e=>update(key,e.target.value)} {...options}/></label>;
  const options=(label,key,values,required=false,callback)=><label>{label}<select value={draft[key]??''} required={required} onChange={e=>{update(key,e.target.value);callback?.(e.target.value);}}><option value="">Select</option>
    {values.map(v=>{const [value,name]=Array.isArray(v)?v:[v,v];return <option key={value} value={value}>{name}</option>;})}</select></label>;

  const projectOptions=projects.map(p=>[p.id,p.name]);
  const milestones=records.filter(r=>r.kind==='milestone');
  const age=r=>Math.max(0,Math.floor((Date.parse(today())-Date.parse(r.dueDate||r.date))/86400000));
  const settled=r=>r.amount<=paid(r.id);

  // Financial Reports filtering by Fiscal Year
  const currentFiscalYear = Number(today().slice(0,4)) - (today().slice(5,7) < '04' ? 1 : 0);
  const fyYears = [currentFiscalYear, currentFiscalYear - 1, currentFiscalYear - 2];
  
  let reportStartDate = '2000-01-01';
  let reportEndDate = asOf;
  if (reportFY !== 'all') {
    const y = Number(reportFY === 'current' ? currentFiscalYear : reportFY);
    reportStartDate = `${y}-04-01`;
    reportEndDate = `${y + 1}-03-31`;
  }

  const reportRecords = records.filter(r => r.date >= reportStartDate && r.date <= reportEndDate);
  const report=reportRecords.flatMap(r=>r.postings||[]);
  const headRows=heads.map(([name,type])=>{
    const entries=report.filter(r=>r.head===name);
    return {name,type,balance:total(entries,'debit')-total(entries,'credit')};
  });
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

  const invoiceList=records.filter(r=>['invoice','legacyInvoice'].includes(r.kind)&&(page==='Estimates'?r.documentType==='Proforma Invoice':r.documentType!=='Proforma Invoice'))
    .sort((a,b)=>String(b.date||'').localeCompare(String(a.date||'')));
  const activeInvoice=draft?.kind==='receipt'?draft.targetInvoice:draft?.kind==='invoice'?draftInvoice(draft,projects):
    ['invoice','legacyInvoice'].includes(selected?.kind)?selected:invoiceClosed?null:invoiceList[0];
  const convertedId=activeInvoice?.id&&`${activeInvoice.id}-INVOICE`;
  const convertedInvoice=invoices.find(row=>row.id===convertedId);
  const canConvert=page==='Estimates'&&!readOnly&&!draft&&activeInvoice?.kind==='invoice'
    &&activeInvoice.items?.length>0&&(convertedInvoice||paid(activeInvoice.id)===0);
  const convertEstimate=()=>{
    if(convertedInvoice){
      invoiceToOpen.current=convertedInvoice;
      onNavigate('Invoices');
      return;
    }
    const details=Object.fromEntries(['projectId','projectName','client','address','state','stateCode','gstin','po','orderDate','contact','contactEmail','phone','dueDate','milestoneId'].map(key=>[key,activeInvoice[key]??'']));
    begin('invoice',{
      ...details,id:convertedId,convertedFromEstimateId:activeInvoice.id,
      items:activeInvoice.items.map(({description,sac,unit,quantity,rate})=>({description,sac,unit,quantity,rate:(rate/100).toFixed(2)}))
    });
  };
  const sent=records.find(r=>r.kind==='invoiceDispatch'&&r.sentInvoiceId===activeInvoice?.id);

  const markSent=async()=>{
    if(saving.current)return;
    saving.current=true;
    setBusy(true);setError('');setNotice('');
    try{
      const record=await request('saveAccounts',{kind:'invoiceDispatch',id:crypto.randomUUID(),date:today(),sentInvoiceId:activeInvoice.id});
      setData(current=>({...current,records:[...current.records.filter(r=>r.id!==record.id),record]}));
      setNotice(page==='Estimates'?'Estimate marked as sent.':'Invoice marked as sent.');
    }catch(e){setError(e.message);}
    finally{saving.current=false;setBusy(false);}
  };

  // Salary Disbursement action
  const disburseSalary=run=>{
    begin('transaction',{
      bank:'IDFC',
      direction:'Outflow',
      head:'Payroll Payable',
      amount:(run.amount/100).toFixed(2),
      beneficiary:run.employee,
      description:`Salary disbursement for ${run.employee} (${run.date.slice(0,7)})`,
      reference:`SALARY-${run.date.slice(0,7)}-${run.employee.split(' ')[0].toUpperCase()}`
    });
  };

  // Export report to CSV
  const exportCsv=(filename, headers, rows)=>{
    const content = [headers.join(','), ...rows.map(r=>r.join(','))].join('\n');
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const editor=draft&&<form onSubmit={save} className="accounts-form">
      <h2>{({
        milestone:'Schedule milestone',
        invoice: draft.documentType==='Proforma Invoice' ? (draft.isEdit?'Edit estimate':'New estimate') : (draft.isEdit?'Edit invoice':'New invoice'),
        receipt: draft.targetInvoice ? `Record receipt · ${draft.targetInvoice.number}` : 'Record receipt',
        transaction:'Record transaction',
        payroll: draft.isEdit ? 'Edit payroll' : 'Post payroll',
        reconciliation:'Reconcile statement line',
        opening:'Add opening journal',
        gstFiling:'Record GST filing'
      })[draft.kind]}</h2>

      {draft.kind==='receipt'&&draft.targetInvoice&&(
        <div style={{background:'#e8f5e9',border:'1px solid #c8e6c9',padding:10,borderRadius:4,marginBottom:12,fontSize:13}}>
          <strong>Invoice:</strong> {draft.targetInvoice.number} · <strong>Client:</strong> {draft.targetInvoice.client}<br/>
          <strong>Total Amount:</strong> {money(draft.targetInvoice.amount)} &nbsp;|&nbsp; <strong>Already Received:</strong> {money(paid(draft.targetInvoice.id))} &nbsp;|&nbsp; <strong style={{color:'#c62828'}}>Outstanding Balance:</strong> {money(draft.targetInvoice.amount - paid(draft.targetInvoice.id))}
        </div>
      )}

      <fieldset disabled={busy}><div className="accounts-fields">
      {field(draft.kind==='milestone'?'Scheduled date':'Date','date','date',true)}
      {['milestone','invoice','transaction','reconciliation'].includes(draft.kind)&&options('Project','projectId',projectOptions,['milestone','invoice'].includes(draft.kind),id=>{
        if(draft.kind==='invoice'){
          const proj = projects.find(p=>p.id===id);
          update('client',proj?.client||'');
          update('address',proj?.clientAddress||'');
          for(const key of ['state','stateCode','gstin','contact','contactEmail','phone'])update(key,proj?.billing?.[key]||'');
          update('orderDate',proj?.contractDate||'');
          update('milestoneId','');
        }
      })}
      {['milestone','receipt','transaction','reconciliation','opening'].includes(draft.kind)&&field('Amount (INR)','amount','number',true,{min:'0.01',step:'0.01'})}
      {['transaction','reconciliation','receipt'].includes(draft.kind)&&<>{options('Source account','bank',banks,true)}{field('UTR / cheque / reference','reference','text',draft.kind==='reconciliation')}</>}
      {['transaction','reconciliation'].includes(draft.kind)&&<>
        {options('Flow direction','direction',[['Outflow','Debit · outflow'],['Inflow','Credit · inflow']],true)}
        {options(draft.kind==='reconciliation'?'Clearing ledger if unmatched':'Ledger head','head',heads.filter(([h])=>h!==draft.bank).map(([h])=>h),draft.kind==='transaction')}
      </>}
      {['milestone','transaction','reconciliation'].includes(draft.kind)&&field('Description','description','text',draft.kind==='milestone')}
      {draft.kind==='gstFiling'&&<>
        {field('Reporting period','period','month',true)}
        {options('Form','returnType',['CMP-08 (Quarterly Challan)','GSTR-4 (Annual Return)','GSTR-1','IMS','GSTR-2B','GSTR-3B'],true)}
        {field('Filing / challan reference','reference','text',true,{maxLength:100})}
      </>}
      {draft.kind==='opening'&&<>{options('Debit head','debitHead',heads.map(([h])=>h),true)}{options('Credit head','creditHead',heads.map(([h])=>h),true)}{field('Opening reference','description','text',true)}</>}
      {['transaction','reconciliation'].includes(draft.kind)&&<>{field('Value date','valueDate','date')}{field('Beneficiary','beneficiary')}{options('Classification','classification',['Project direct cost','Studio overhead','Owner drawings'])}{draft.head==='Employee Advances'&&options('Employee','employeeId',employees.map(e=>[e.id,e.name]),true)}</>}
      {draft.kind==='invoice'&&<>
        {options('Document type','documentType',(page==='Estimates'&&!draft.convertedFromEstimateId?['Proforma Invoice']:['Invoice','Bill of Supply']),true)}
        {options('Milestone','milestoneId',milestones.filter(m=>m.projectId===draft.projectId&&!invoices.some(r=>r.milestoneId===m.id)).map(m=>[m.id,m.description]),false,id=>{const m=milestones.find(r=>r.id===id);if(m)update('items',[{...freshItem(),description:m.description,rate:m.amount/100}]);})}
        {field('Due date','dueDate','date')}{field('Client','client','text',true)}
        <label>Billing address<textarea required value={draft.address||''} onChange={e=>update('address',e.target.value)}/></label>
        {field('State','state')}{field('State code','stateCode')}{field('Client GSTIN','gstin')}{field('PO / Reference','po')}{field('Contract / order date','orderDate','date')}{field('Contact person','contact')}{field('Contact email','contactEmail','email')}{field('Contact number','phone','tel')}
      </>}
      {draft.kind==='payroll'&&<>
        {options('Employee','employeeId',employees.map(e=>[e.id,e.name]),true,id=>{
          const lastRun=records.filter(r=>r.kind==='payroll'&&r.employeeId===id).pop();
          if(lastRun&&!draft.gross)update('gross',(lastRun.gross/100).toFixed(2));
        })}{options('Daily wage basis','method',['Working days','Calendar days'],true)}
        {field('Monthly gross (INR)','gross','number',true,{min:'0.01',step:'0.01'})}
        {[['Working days','working',1],['Present days','present',.5],['Paid leave','leave',.5],['Overtime hours','hours',.25],['Overtime multiplier','multiplier',.01],['Allowances (INR)','allowances',.01],['Other deductions (INR)','deductions',.01],['Advance recovery (INR)','advance',.01]].map(([label,key,step],i)=><React.Fragment key={key}>{field(label,key,'number',i===0,{min:0,step})}</React.Fragment>)}
      </>}
      </div>
      {draft.kind==='payroll'&&<div className="accounts-actions"><button type="button" disabled={!draft.employeeId||!draft.date} onClick={useAttendance}>Load monthly attendance</button><span>Review working days, holidays, paid leave and overtime before posting.</span></div>}
      {draft.kind==='invoice'&&<><h3>Service lines</h3>{draft.items.map((line,i)=><div className="accounts-fields accounts-line" key={i}>
        {[['Description','description','text'],['SAC','sac','text'],['Unit','unit','text'],['Quantity','quantity','number'],['Unit rate (INR)','rate','number']].map(([label,key,type])=><label key={key}>{label}<input required type={type} min={type==='number'?(key==='rate'?.01:1):undefined} step={key==='rate'?.01:undefined} value={line[key]} onChange={e=>update('items',draft.items.map((other,j)=>j===i?{...other,[key]:e.target.value}:other))}/></label>)}
        <button type="button" disabled={draft.items.length===1} onClick={()=>update('items',draft.items.filter((_,j)=>i!==j))}>Remove line</button></div>)}
      <button type="button" disabled={draft.items.length>=25} onClick={()=>update('items',[...draft.items,freshItem()])}>Add line</button></>}
      <div className="accounts-actions"><button type="submit">{busy?'Saving…':draft.kind==='invoice'?(draft.documentType==='Proforma Invoice'?(draft.isEdit?'Update estimate':'Save estimate'):(draft.isEdit?'Update invoice':'Save invoice')):'Save'}</button><button type="button" onClick={()=>setDraft(null)}>Cancel</button></div></fieldset>
    </form>;

  return <section className="accounts">
    {data.warnings?.length>0&&<div role="alert" className="accounts-error">{data.warnings.map((warning,i)=><p key={i}>{warning}</p>)}</div>}
    {error&&<p role="alert" className="accounts-error">{error}</p>}{notice&&<p role="status" style={{background:'#e8f5e9',padding:8,borderRadius:3,color:'#1b5e20'}}>{notice}</p>}
    
    {page==='Home'&&<AccountsDashboard data={data} today={today()} onNavigate={onNavigate}/>}
    {page==='Banking'&&<>
      {!reconciliationBank&&<StudioHeading title="Banking" department="Accounts"/>}
      <nav className={'accounts-banking-tabs'+(reconciliationBank?' banking-reconciliation-tabs':'')} aria-label="Banking views" data-sheet-tabs>
        <button type="button" aria-pressed={!reconciliationBank} onClick={()=>onNavigate('Banking')}>Overview</button>
        <button type="button" aria-pressed={Boolean(reconciliationBank)} onClick={()=>onNavigate('Banking',bank)}>Reconciliation</button>
      </nav>
      {reconciliationBank
        ? <AccountsReconciliation records={records} projects={projects} heads={heads} bank={bank} setBank={setBank} request={request} onSaved={load} readOnly={readOnly} onNavigate={onNavigate}/>
        : <BankingOverview records={records} today={today()} onNavigate={onNavigate}/>}
    </>}
    {page==='GST'&&<GstOverview records={records} today={today()} onRecord={readOnly||busy?null:period=>begin('gstFiling',{period})}/>}
    
    {page==='Projects & Clients'&&<ProjectBilling projects={projects} request={request} onSaved={load} readOnly={readOnly}/>}
    {page==='Invoices'&&<p>Invoices created from estimates or issued when an estimate payment is recorded appear here with historical invoices.</p>}
    {page==='Payment Dashboard'&&<>
      <PaymentDashboard projects={projects} milestones={milestones} receipts={receipts} invoices={records.filter(r=>['invoice','legacyInvoice'].includes(r.kind))} money={money}/>
      <details className="payment-sheet-actions" open>
        <summary>Billing &amp; Payment Action Center</summary>
        <div style={{display:'flex',gap:10,margin:'12px 0'}}>
          {!readOnly&&<button onClick={()=>begin('milestone')}>＋ Add milestone</button>}
          {!readOnly&&<button className="accounts-overview-primary" onClick={()=>{ onNavigate('Estimates'); }}>＋ Add New Estimate</button>}
        </div>
      <Table columns={['Project','Milestone / invoice','Due','Amount','Received','Outstanding','Status','Action']} rows={[
        ...milestones.filter(m=>!invoices.some(r=>r.milestoneId===m.id)).map(m=>({key:m.id,cells:[m.projectName,m.description,m.date,money(m.amount),'—','—','Scheduled',!readOnly&&<button onClick={()=>{
          onNavigate('Estimates');
          
        }}>Open estimates</button>]})),
        ...invoices.map(r=>({key:r.id,status:settled(r)?'settled':'outstanding',cells:[r.projectName,r.number,r.dueDate||r.date,money(r.amount),money(paid(r.id)),money(Math.max(0,r.amount-paid(r.id))),settled(r)?'Settled':age(r)?'Overdue':'Awaiting payment',!readOnly&&!settled(r)&&<button onClick={()=>begin('receipt',{invoiceId:r.id,direction:'Inflow',amount:((r.amount-paid(r.id))/100).toFixed(2),targetInvoice:r})}>Record receipt</button>]}))
      ]}/>
      </details>
    </>}

    {['Estimates','Invoices'].includes(page)&&<InvoiceWorkspace
      isEstimate={page==='Estimates'}
      onConvert={canConvert?convertEstimate:undefined}
      converted={Boolean(convertedInvoice||draft?.convertedFromEstimateId)}
      records={invoiceList}
      invoice={activeInvoice}
      editing={draft?.kind==='invoice'}
      busy={busy}
      form={editor}
      sent={sent}
      onMarkSent={!readOnly&&!draft?markSent:undefined}
      onChoose={record=>{setSelected(record);setInvoiceClosed(false);setDraft(null);}}
      onNew={readOnly||busy||page!=='Estimates'?undefined:()=>begin('invoice',{documentType:'Proforma Invoice'})}
      onEdit={readOnly||!!draft||activeInvoice?.generatedFromReceiptId||paid(activeInvoice?.id)>0?undefined:invoice=>{
        begin('invoice',{
          ...invoice,
          isEdit: true,
          items: invoice.items.map(i=>({...i, rate: (i.rate/100).toFixed(2)}))
        });
      }}
      onClose={busy?undefined:()=>{if(draft)setDraft(null);else{setSelected(null);setInvoiceClosed(true);}}}
      canPay={!readOnly&&!busy&&!draft&&!convertedInvoice&&activeInvoice&&(activeInvoice.amount>paid(activeInvoice.id))}
      onPayment={()=>{
        begin('receipt',{
          invoiceId:activeInvoice.id,
          direction:'Inflow',
          amount:((activeInvoice.amount-paid(activeInvoice.id))/100).toFixed(2),
          targetInvoice:activeInvoice
        });
      }}
    />}

    {page==='Debit / Credit'&&records.some(r=>r.kind==='legacyDesign')&&<details>
      <summary>Imported Design transactions</summary>
      <Table columns={['Date','Type','Project','Description','Ledger head','Amount','IDFC']} rows={records.filter(r=>r.kind==='legacyDesign').map(r=>({key:r.id,cells:[r.date,r.type,r.projectName,r.description,r.head,money(r.amount),r.idfc?'Matched':'—']}))}/>
    </details>}

    {page==='Debit / Credit'&&<DesignTransactions records={records} projects={projects} heads={heads} request={request} onSaved={load} readOnly={readOnly}/>}


    {page==='Chart of Accounts'&&<>
      <div className="accounts-toolbar">
        <Search size={15} aria-hidden="true"/>
        <input type="search" aria-label="Search accounts" placeholder="Search type, head or sub-head" value={coaQuery} onChange={e=>setCoaQuery(e.target.value)}/>
        {!readOnly&&<button type="button" disabled={busy} onClick={()=>setHeadDraft({head:'',type:'',subhead:''})}>Add Head</button>}
      </div>
      {headDraft&&<form className="accounts-preview" onSubmit={event=>{event.preventDefault();saveHead();}}>
        <h2>{headDraft.previous?'Edit Head':'Add Head'}</h2>
        <div className="accounts-toolbar">
          <label>Type <select required value={headDraft.type} onChange={e=>setHeadDraft({...headDraft,type:e.target.value})}>
            <option value="">Select type</option>
            {['Asset','Liability','Equity','Revenue','Direct expense','Expense'].map(type=><option key={type}>{type}</option>)}
          </select></label>
          <label>Head <input required maxLength={120} value={headDraft.head} onChange={e=>setHeadDraft({...headDraft,head:e.target.value})}/></label>
          <label>Sub-head <input maxLength={120} value={headDraft.subhead} onChange={e=>setHeadDraft({...headDraft,subhead:e.target.value})}/></label>
          <button type="submit" disabled={busy}>Save Head</button>
          <button type="button" disabled={busy} onClick={()=>setHeadDraft(null)}>Cancel</button>
          {headDraft.previous&&<button type="button" disabled={busy} onClick={()=>{
            if(window.confirm(`Delete the account head “${headDraft.previous}”?`))saveHead(true);
          }}>Delete Head</button>}
        </div>
      </form>}
      {(()=>{
        const query=coaQuery.trim().toLowerCase();
        const categories=new Map(['Asset','Liability','Income','Expense','Equity'].map(label=>[label,[]]));
        for(const row of data.heads){
          const type=row[1];
          const category=type==='Revenue'?'Income':type==='Direct expense'?'Expense':type;
          if(![category,...row].join(' ').toLowerCase().includes(query))continue;
          if(!categories.has(category))categories.set(category,[]);
          categories.get(category).push(row);
        }
        const visible=[...categories].filter(([,rows])=>!query||rows.length);
        return visible.length?<div className="accounts-chart-groups" key={query}>{visible.map(([label,rows])=>
          <details key={label} open={query?true:undefined}>
            <summary>{label}</summary>
            <div className="accounts-chart-children">
      <Table columns={['Type','Head','Sub-head',...(!readOnly?['Action']:[])]}
        rows={rows.map(row=>{
          const [head,type,subhead='']=row;
          return {key:head,cells:[type,<strong>{head}</strong>,subhead||'—',...(!readOnly?[
            <button type="button" disabled={busy} onClick={()=>setHeadDraft({previous:head,expected:[head,type,subhead],head,type,subhead})}>Edit</button>
          ]:[])]};
        })}/>
            </div>
          </details>
        )}</div>:<p>No account heads match your search.</p>;
      })()}
    </>}

    {page==='Party Ledger'&&<div className="invoice-workspace">
      <aside className="invoice-list" aria-label="Party list">
        <header><h2>Parties</h2></header>
        {[...parties].sort(([,a],[,b])=>a.name.localeCompare(b.name)).map(([key,party])=>
          <button type="button" className="invoice-list-row" key={key} aria-current={partyKey===key?'true':undefined} onClick={()=>setPartyKey(key)}>
            <strong>{party.name}</strong>
          </button>
        )}
        {!parties.size&&<p>No posted transactions have a client or beneficiary yet.</p>}
      </aside>
      <section className="invoice-detail" aria-label="Selected party ledger">
        {parties.has(partyKey)?(()=>{
          const party=parties.get(partyKey);
          return <>
            <header className="invoice-detail-heading"><h2>{party.name}</h2></header>
            <div className="party-ledger-content">
              <p>Total debit <strong>{money(party.debit)}</strong> · Total credit <strong>{money(party.credit)}</strong> · Closing balance <strong>{money(party.debit-party.credit)}</strong></p>
              <Table columns={['Date','Reference','Project','Description','Debit','Credit','Running balance']} rows={party.entries.map(({record,debit,credit,balance})=>({
                key:record.id,cells:[record.date,record.reference||record.number||'—',record.projectName||'—',record.description||record.documentType||record.kind,debit?money(debit):'—',credit?money(credit):'—',money(balance)]
              }))}/>
            </div>
          </>;
        })():<p className="party-ledger-content">Select a party to see its posted transactions.</p>}
      </section>
    </div>}

    {page==='Payroll'&&<>
      <div className="accounts-toolbar" role="tablist" aria-label="Payroll sections">{[['payroll','Payroll'],['attendance','Attendance'],['salary-policy','Salary Policy']].map(([id,label])=><button type="button" key={id} role="tab" aria-selected={payrollTab===id} onClick={()=>setPayrollTab(id)} style={{background:payrollTab===id?'#102238':'#fff',color:payrollTab===id?'#fff':'#142238',padding:'10px 18px',border:'1px solid #d2cdc1'}}>{label}</button>)}</div>
      {payrollTab==='attendance'?<PayrollAttendance employees={employees} request={request} readOnly={readOnly}/>:payrollTab==='salary-policy'?<OfficePolicy salaryOnly/>:<>
      <div className="accounts-toolbar">
        <label>Payroll month <input type="month" value={payMonth} onChange={e=>setPayMonth(e.target.value)}/></label>
        <label>Find employee <input type="search" value={staffQuery} onChange={e=>setStaffQuery(e.target.value)} placeholder="Name or department"/></label>
      </div>

      <Table columns={['Employee','Department','Role','Status','Net pay','Action']} rows={employees.filter(e=>[e.name,e.department,e.role].filter(Boolean).join(' ').toLowerCase().includes(staffQuery.trim().toLowerCase())).map(e=>{
        const run=payroll.find(r=>r.employeeId===e.id);
        const lastRun=records.filter(r=>r.kind==='payroll'&&r.employeeId===e.id).pop();
        const isDisbursed = run && records.some(r=>r.kind==='transaction'&&r.head==='Payroll Payable'&&r.date.startsWith(payMonth)&&Math.abs(r.amount - run.amount) <= 100);

        return {
          key:e.id,
          cells:[
            e.name,
            e.department||'—',
            e.role||'—',
            run ? (isDisbursed ? <span style={{color:'#2e7d32',fontWeight:600}}>✓ Disbursed</span> : <span style={{color:'#b86a36',fontWeight:600}}>Posted (Payable)</span>) : 'To prepare',
            run ? money(run.amount) : '—',
            run ? (
              <div style={{display:'flex',gap:6}}>
                <button onClick={()=>setSelected(run)}>Payslip</button>
                {!isDisbursed && !readOnly && <button onClick={()=>disburseSalary(run)} style={{color:'#2e7d32',fontWeight:600}}>Disburse</button>}
              </div>
            ) : !readOnly&&<button disabled={!payMonth} onClick={()=>begin('payroll',{employeeId:e.id,date:payMonth+'-01',gross:lastRun?(lastRun.gross/100).toFixed(2):''})}>Prepare payroll</button>
          ]
        };
      })}/>

      <h2>Payroll history</h2>
      <Table columns={['Employee','Month','Earned','Overtime','Deductions','Advance recovery','Net pay','Action']} rows={records.filter(r=>r.kind==='payroll').slice().reverse().map(r=>({key:r.id,cells:[r.employee,r.date.slice(0,7),money(r.earned),money(r.overtime),money(r.deductions),money(r.advance),money(r.amount),<button onClick={()=>setSelected(r)}>Payslip</button>]}))}/>
    </>}</>}

    {page==='Financial Reports'&&<>
      <div className="accounts-toolbar" style={{justifyContent:'space-between',marginBottom:16}}>
        <div style={{display:'flex',gap:12,alignItems:'center',flexWrap:'wrap'}}>
          <label>Period: <select value={reportFY} onChange={e=>setReportFY(e.target.value)}>
            <option value="current">Current FY ({currentFiscalYear}-{String(currentFiscalYear+1).slice(2)})</option>
            <option value={String(currentFiscalYear-1)}>Previous FY ({currentFiscalYear-1}-{String(currentFiscalYear).slice(2)})</option>
            <option value="all">All Time (Cumulative)</option>
          </select></label>
          <label>As of date: <input type="date" value={asOf} onChange={e=>setAsOf(e.target.value)}/></label>
        </div>
        <div style={{display:'flex',gap:8}}>
          {!readOnly&&<button className="accounts-overview-primary" onClick={()=>begin('opening')}>＋ Add opening journal</button>}
        </div>
      </div>

      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <h2>Trial balance ({reportFY==='all'?'Cumulative':`FY ${reportStartDate} to ${reportEndDate}`})</h2>
        <button type="button" onClick={()=>exportCsv('Trial_Balance.csv',['Head','Type','Closing Debit','Closing Credit'],headRows.map(r=>[r.name,r.type,r.balance>0?r.balance/100:0,r.balance<0?-r.balance/100:0]))}>
          <Download size={13} style={{marginRight:4}}/> Export CSV
        </button>
      </div>
      <p role="status" style={{fontWeight:600,color:total(report,'debit')===total(report,'credit')?'#2e7d32':'#c62828'}}>
        {total(report,'debit')===total(report,'credit')?'✓ Balanced':'⚠ Discrepancy detected'} · Debit: {money(total(report,'debit'))} | Credit: {money(total(report,'credit'))}
      </p>
      <Table columns={['Head','Type','Closing debit','Closing credit']} rows={headRows.map(r=>({cells:[r.name,r.type,r.balance>0?money(r.balance):'—',r.balance<0?money(-r.balance):'—']}))}/>

      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:24}}>
        <h2>Profit &amp; Loss ({reportFY==='all'?'Cumulative':`FY ${reportStartDate} to ${reportEndDate}`})</h2>
        <button type="button" onClick={()=>exportCsv('Profit_and_Loss.csv',['Metric','Amount'],[['Design Revenue',-balance('Revenue')/100],['Direct Costs',balance('Direct expense')/100],['Gross Profit',margin/100],['Operating Expenses',balance('Expense')/100],['Net Profit',surplus/100]])}>
          <Download size={13} style={{marginRight:4}}/> Export CSV
        </button>
      </div>
      <Table columns={['Measure','Amount']} rows={[[ 'Design revenue',-balance('Revenue')],['Direct costs',balance('Direct expense')],['Gross profit',margin],['Operating expenses',balance('Expense')],['Net profit',surplus]].map(([k,v])=>({cells:[k,money(v)]}))}/>

      <BalanceSheet asOf={asOf || today()} heads={heads} records={records} money={money} exportCsv={exportCsv}/>

      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:24}}>
        <h2>Cash flow by activity</h2>
        <button type="button" onClick={()=>exportCsv('Cash_Flow.csv',['Activity','Net Flow'],Object.entries(cashFlows).map(([k,v])=>[k,v/100]))}>
          <Download size={13} style={{marginRight:4}}/> Export CSV
        </button>
      </div>
      <label>Cash-flow start date: <input type="date" value={cashFrom} max={asOf} onChange={e=>setCashFrom(e.target.value)}/></label>
      <Table columns={['Activity','Net cash flow']} rows={Object.entries(cashFlows).map(([type,amount])=>({cells:[type,money(amount)]}))}/>

      <h2>Cash movement by account through {asOf}</h2>
      <Table columns={['Cash / bank','Inflows','Outflows','Net']} rows={banks.map(b=>{
        const rows=report.filter(r=>r.head===b), debit=total(rows,'debit'), credit=total(rows,'credit');
        return {cells:[b,money(debit),money(credit),money(debit-credit)]};
      })}/>
    </>}

    {!['Estimates','Invoices'].includes(page)&&draft?.kind!=='invoice'&&editor}

    {selected?.kind==='payroll'&&<section className="accounts-preview">
      <div className="accounts-actions">
        <button onClick={print}>Print / Save as PDF</button>
        <button onClick={()=>setSelected(null)}>Close Payslip</button>
      </div>
      <article ref={printRef} style={{background:'#fff',padding:20,border:'1px solid #ddd',maxWidth:650,margin:'auto'}}>
        <div style={{textAlign:'center',borderBottom:'2px solid #222',paddingBottom:10,marginBottom:15}}>
          <h1 style={{margin:0,fontSize:20}}>Enlighten Designs</h1>
          <p style={{margin:'4px 0',fontSize:12}}>E-256, Naraina Vihar, New Delhi 110028 · GSTIN {studioGstin}</p>
          <h2 style={{margin:'6px 0 0',fontSize:15,letterSpacing:'.05em'}}>PAYSLIP FOR {monthLabel(selected.date.slice(0,7)).toUpperCase()}</h2>
        </div>

        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,fontSize:12,marginBottom:16,borderBottom:'1px solid #eee',paddingBottom:12}}>
          <div>
            <p style={{margin:'2px 0'}}><strong>Employee Name:</strong> {selected.employee}</p>
            <p style={{margin:'2px 0'}}><strong>Department:</strong> {employees.find(e=>e.id===selected.employeeId)?.department || 'Studio'}</p>
            <p style={{margin:'2px 0'}}><strong>Designation:</strong> {employees.find(e=>e.id===selected.employeeId)?.role || 'Team Member'}</p>
          </div>
          <div>
            <p style={{margin:'2px 0'}}><strong>Working Days:</strong> {selected.working}</p>
            <p style={{margin:'2px 0'}}><strong>Present Days:</strong> {selected.present}</p>
            <p style={{margin:'2px 0'}}><strong>Paid Leave:</strong> {selected.leave}</p>
            {selected.hours > 0 && <p style={{margin:'2px 0'}}><strong>Overtime Hours:</strong> {selected.hours}</p>}
          </div>
        </div>

        <Table columns={['Pay Component','Earnings (INR)','Deductions (INR)']} rows={[
          {cells:['Basic & Earned Pay', money(selected.earned), '—']},
          {cells:['Allowances', selected.allowances ? money(selected.allowances) : '—', '—']},
          {cells:['Overtime', selected.overtime ? money(selected.overtime) : '—', '—']},
          {cells:['Deductions', '—', selected.deductions ? money(selected.deductions) : '—']},
          {cells:['Advance Recovery', '—', selected.advance ? money(selected.advance) : '—']},
          {style:{fontWeight:700,background:'#f0f0f0'}, cells:['Net Salary Payable', money(selected.amount), '']}
        ]}/>

        <div style={{marginTop:20,fontSize:12,lineHeight:1.6}}>
          <p>Net Amount in Words: <strong>{numberWords(Math.floor(selected.amount/100))} Rupees Only</strong></p>
          <div style={{display:'flex',justifyContent:'space-between',marginTop:40}}>
            <div>________________________<br/>Employee Signature</div>
            <div style={{textAlign:'right'}}>________________________<br/>Authorized Signatory</div>
          </div>
        </div>
      </article>
    </section>}
  </section>;
}
