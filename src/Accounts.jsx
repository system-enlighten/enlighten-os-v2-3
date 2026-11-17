import React, { useEffect, useMemo, useRef, useState } from 'react';
import './Accounts.css';
import PaymentDashboard from './PaymentDashboard.jsx';
import {AccountsDashboard, BankingOverview, GstOverview, bankAccounts, studioGstin} from './AccountsOverview.jsx';
import {parseStatement, statementSuggestion} from './AccountsStatement.js';
import wordmark from './AccountsWordmark.svg?raw';
import { Mail, Share2, Printer, Edit3, DollarSign, Download, Search, CheckCircle, ArrowRight, X } from 'lucide-react';

export const accountsPages = ['Payment Dashboard','Invoicing','Debit / Credit','Banking','Reconciliation','GST','Chart of Accounts','Payroll','Financial Reports'];
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
      .invoice-brand svg { width: 185px; height: auto; }
      .invoice-address { text-align: center; line-height: 1.45; font-size: 9pt; }
      .invoice-meta { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin: 20px 0; font-size: 9.5pt; }
      .invoice-meta p { margin: 4px 0; white-space: pre-line; }
      table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 9.5pt; }
      th, td { text-align: left; vertical-align: top; padding: 7px 5px; border-bottom: 1px solid #bbb; }
      th { background: #f0f0f0; print-color-adjust: exact; -webkit-print-color-adjust: exact; font-weight: 600; }
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

function Invoice({invoice:r,printRef}){
  const date=value=>value?.split('-').reverse().join('.')||'—';
  const words=numberWords(Math.floor(r.amount/100))+(r.amount%100?' and '+numberWords(r.amount%100)+' Paise':'')+' Only';
  return <article className="accounts-invoice" ref={printRef}>
    <h1 className="invoice-brand"><span dangerouslySetInnerHTML={{__html:wordmark.replace('#fff0cf','#252525')}}/></h1>
    <div className="invoice-address">E-256, Naraina Vihar, New Delhi 110028<br/>Phone +91 9999277482 · design.enlighten@gmail.com<br/>GSTIN {studioGstin}</div>
    <h2>{r.documentType.toUpperCase()}</h2><div className="invoice-address">{date(r.date)}</div>
    <div className="invoice-meta"><div><p>To,</p><p><strong>{r.client}</strong></p><p>Address · {r.address}</p><p>State · {r.state}</p><p>State Code · {r.stateCode}</p><p>GSTIN · {r.gstin}</p></div>
      <div><p>Purchase Order/Ref. No. · {r.po||'—'}</p><p>Invoice No. · <strong>{r.number}</strong></p><p>Contract/Order Date · {date(r.orderDate)}</p><p>Project Name · {r.projectName}</p><p>Contact Person · {r.contact}</p><p>Contact No. · {r.phone}</p></div></div>
    <Table columns={['S. No.','Description of Services','SAC Code','Unit','Qty','Unit Rate','Total Amount']} rows={r.items.map((i,j)=>({cells:[j+1,i.description,i.sac,i.unit,i.quantity,money(i.rate),money(i.amount)]}))}/>
    <div className="invoice-totals">Subtotal &nbsp; {money(r.amount)}<br/><strong>Total Amount Due &nbsp; {money(r.amount)}</strong></div>
    <div className="invoice-footer"><p>Rupees: <strong>{words}</strong></p><p>Declaration: Composition taxable person, not eligible to collect taxes on supplies</p>
      <div style={{background:'#f9f9f9',padding:10,border:'1px solid #eee',margin:'10px 0'}}>
        <p style={{margin:0,fontWeight:600}}>Kindly note our Bank Account Number and IFSC for INR remittances:</p>
        <p style={{margin:'4px 0 0'}}>NAME: Enlighten Designs<br/>A/C#: 10148974324<br/>IFSC: IDFB0020126<br/>BANK: IDFC First, Punjabi Bagh</p>
      </div>
      <p style={{textAlign:'right',marginTop:26}}>Shivam Gupta<br/><strong>Partner</strong></p></div>
  </article>;
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
  if(invoice.kind!=='legacyInvoice')return <Invoice invoice={invoice} printRef={documentRef}/>;
  const original=originalInvoice(invoice.attachment);
  if(original.preview)return <div className="invoice-original-window">
    <iframe className="invoice-original-frame" title="Original invoice document" src={original.preview}/>
  </div>;
  return <article className="accounts-invoice invoice-history-paper" ref={documentRef}>
    <h1>Enlighten Designs</h1>
    <h2>Imported invoice record</h2>
    <dl>{[['Invoice number',invoice.sourceNumber||invoice.number],['Date',invoice.date],['Project',invoice.projectName],['Client',invoice.client],['Total',money(invoice.amount)]].map(([label,value])=><div key={label}><dt>{label}</dt><dd>{value||'—'}</dd></div>)}</dl>
    <p>Original invoice PDF unavailable.{invoice.attachment&&' File reference: '+invoice.attachment}</p>
  </article>;
}

function InvoiceWorkspace({records,invoice,editing,busy,form,onChoose,onNew,onEdit,onClose,onPayment,canPay,sent,onMarkSent}){
  const documentRef=useRef(null), editorRef=useRef(null);
  const [message,setMessage]=useState('');
  const [query,setQuery]=useState('');
  const [sendOpen,setSendOpen]=useState(false);

  const number=invoice?.sourceNumber||invoice?.number;
  useEffect(()=>{setMessage('');setSendOpen(false);},[invoice?.id]);
  const original=invoice?.kind==='legacyInvoice'?originalInvoice(invoice.attachment):{};
  const summary=invoice?[number,invoice.client,invoice.projectName,money(invoice.amount)].filter(Boolean).join(' · '):'';

  const shareText = useMemo(() => {
    if (!invoice) return '';
    return `*Invoice ${number} from Enlighten Designs*\n` +
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
  }, [invoice, number, original]);

  const share=async()=>{
    try{
      if(navigator.clipboard){
        await navigator.clipboard.writeText(shareText);
        setMessage('✓ Invoice & bank remittance details copied to clipboard!');
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
  const emailSubject = `Invoice ${number} - Enlighten Designs - ${invoice?.projectName || ''}`;
  const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(recipientEmail)}&su=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(shareText)}`;
  const mailtoUrl = `mailto:${encodeURIComponent(recipientEmail)}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(shareText)}`;

  const search=query.trim().toLowerCase();
  const visible=records.filter(record=>[record.number,record.sourceNumber,record.client,record.projectName].some(value=>String(value||'').toLowerCase().includes(search)));

  return <div className="invoice-workspace">
    <aside className="invoice-list" aria-label="Invoice list">
      <header><h2>All Invoices</h2>{onNew&&<button type="button" disabled={editing} onClick={onNew}>＋ New invoice</button>}</header>
      <input type="search" className="invoice-search" aria-label="Search invoices" placeholder="Search invoices by client, project, or no..." value={query} onChange={e=>setQuery(e.target.value)}/>
      {visible.map(record=><button className="invoice-list-row" type="button" key={record.id} disabled={editing||busy} aria-current={invoice?.id===record.id?'true':undefined} onClick={()=>onChoose(record)}>
        <strong>{record.client||record.projectName||record.number}</strong><strong>{money(record.amount)}</strong>
        <span>{[record.sourceNumber||record.number,record.date].filter(Boolean).join(' · ')}</span>
        <small>{record.kind==='legacyInvoice'?'Imported':record.documentType}</small>
      </button>)}
      {!visible.length&&<p>{search?'No matching invoices.':'No invoices yet.'}</p>}
    </aside>

    <section className="invoice-detail" aria-label="Invoice detail">
      {invoice?<><header className="invoice-detail-heading">
        <div>
          <small>{invoice.projectName||invoice.client||'Invoice'}</small>
          <h2>{editing?'New invoice':number}</h2>
        </div>
        {onClose&&<button type="button" onClick={onClose} aria-label={editing?'Cancel invoice draft':'Close invoice'}>×</button>}
      </header>

        <nav className="invoice-toolbar" aria-label="Invoice actions">
          {editing ? (
            <button type="button" onClick={()=>editorRef.current?.querySelector('input,select')?.focus()} title="Jump to draft fields">Jump to Form</button>
          ) : (
            <button type="button" onClick={()=>onEdit?.(invoice)} title="Edit invoice details">
              <Edit3 size={13} style={{marginRight:4}}/> Edit Invoice
            </button>
          )}

          <button type="button" disabled={editing} onClick={()=>setSendOpen(!sendOpen)} style={{background:sendOpen?'#eee':undefined}}>
            <Mail size={13} style={{marginRight:4}}/> Send Invoice
          </button>

          <button type="button" disabled={editing} onClick={share} title="Copy WhatsApp/Slack summary with remittance details">
            <Share2 size={13} style={{marginRight:4}}/> Share Details
          </button>

          <button type="button" disabled={editing} onClick={print}>
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
              <strong>Send Invoice {number} to Client</strong>
              <button type="button" onClick={()=>setSendOpen(false)} style={{border:0,background:'transparent',cursor:'pointer',fontSize:16}}>×</button>
            </div>
            <p style={{margin:'0 0 10px',color:'#555'}}>Choose how you want to dispatch this invoice:</p>
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
      </>:<p className="invoice-action-message">Select an invoice to preview it.</p>}
    </section>
  </div>;
}

export default function Accounts({page,request,user,onNavigate,reconciliationBank}){
  const [data,setData]=useState(null),[draft,setDraft]=useState(null),[selected,setSelected]=useState(null);
  const [busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState('');
  const [asOf,setAsOf]=useState(today);
  const [reportFY,setReportFY]=useState('current');
  const [payMonth,setPayMonth]=useState(()=>today().slice(0,7)),[staffQuery,setStaffQuery]=useState('');
  const [coaQuery,setCoaQuery]=useState('');
  const [ledgerHead,setLedgerHead]=useState(null);
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
  useEffect(()=>{if(page==='Reconciliation'&&reconciliationBank&&reconciliationBank!=='Cash')setBank(reconciliationBank);},[page,reconciliationBank]);
  useEffect(()=>{setDraft(null);setSelected(null);setInvoiceClosed(false);setNotice('');setError('');setLedgerHead(null);},[page]);

  const save=async e=>{
    if(e?.preventDefault)e.preventDefault();
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
      setNotice(`Imported ${rows.length} statement rows for review.`);
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
          const [suggestedHead]=statementSuggestion(row);
          const headToUse=row.head||suggestedHead||'';
          const result=await request('saveAccounts',{...row,kind:'reconciliation',head:headToUse});
          setData(d=>({...d,records:[...d.records.filter(r=>r.id!==result.id),result]}));
          matched++;
        }catch(e){remaining.set(row.id,e.message);}
      }
      const ids=new Set(rows.map(r=>r.id));
      setStaged(previous=>previous.flatMap(row=>!ids.has(row.id)?[row]:remaining.has(row.id)?[{...row,issue:remaining.get(row.id)}]:[]));
      setNotice(matched+' matched · '+remaining.size+' need manual categorization.');
    }finally{saving.current=false;setBusy(false);}
  };

  const print=()=>{
    try{printMarkup(printRef.current,selected?.number||'Document');}
    catch(e){setError(e.message);}
  };

  if(!data)return <>{error?<><p role="alert">{error}</p><button onClick={load}>Retry</button></>:<p role="status">Loading Accounts…</p>}</>;

  const {records,projects,employees}=data;
  const heads=data.heads.filter(([head])=>head!=='Kotak');
  const invoices=records.filter(r=>['invoice','legacyInvoice'].includes(r.kind)&&r.documentType!=='Proforma Invoice');
  const receipts=records.filter(r=>r.kind==='receipt');
  const paid=id=>total(receipts.filter(r=>r.invoiceId===id),'amount');

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
      setNotice('Invoice marked as sent.');
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
        invoice: draft.isEdit ? 'Edit invoice' : 'Raise invoice',
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
      {['milestone','invoice','transaction'].includes(draft.kind)&&options('Project','projectId',projectOptions,draft.kind!=='transaction',id=>{
        if(draft.kind==='invoice'){
          const proj = projects.find(p=>p.id===id);
          update('client',proj?.client||'');
          update('address',proj?.clientAddress||'');
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
      {draft.kind==='transaction'&&<>{field('Value date','valueDate','date')}{field('Beneficiary','beneficiary')}{options('Classification','classification',['Project direct cost','Studio overhead','Owner drawings'])}{draft.head==='Employee Advances'&&options('Employee','employeeId',employees.map(e=>[e.id,e.name]),true)}</>}
      {draft.kind==='invoice'&&<>
        {options('Document type','documentType',['Proforma Invoice','Invoice','Bill of Supply'],true)}
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
      <div className="accounts-actions"><button type="submit">{busy?'Saving…':draft.kind==='invoice'?(draft.isEdit?'Update invoice':'Save invoice'):'Save'}</button><button type="button" onClick={()=>setDraft(null)}>Cancel</button></div></fieldset>
    </form>;

  return <section className="accounts">
    {error&&<p role="alert" className="accounts-error">{error}</p>}{notice&&<p role="status" style={{background:'#e8f5e9',padding:8,borderRadius:3,color:'#1b5e20'}}>{notice}</p>}
    
    {page==='Home'&&<AccountsDashboard data={data} today={today()} onNavigate={onNavigate}/>}
    {page==='Banking'&&<BankingOverview records={records} today={today()} staged={staged} onNavigate={onNavigate}/>}
    {page==='GST'&&<GstOverview records={records} today={today()} onRecord={readOnly||busy?null:period=>begin('gstFiling',{period})}/>}
    
    {page==='Payment Dashboard'&&<>
      <PaymentDashboard projects={projects} milestones={milestones} receipts={receipts} invoices={invoices} money={money}/>
      <details className="payment-sheet-actions" open>
        <summary>Billing &amp; Payment Action Center</summary>
        <div style={{display:'flex',gap:10,margin:'12px 0'}}>
          {!readOnly&&<button onClick={()=>begin('milestone')}>＋ Add milestone</button>}
          {!readOnly&&<button className="accounts-overview-primary" onClick={()=>{ onNavigate('Invoicing'); begin('invoice'); }}>＋ Raise new invoice</button>}
        </div>
      <Table columns={['Project','Milestone / invoice','Due','Amount','Received','Outstanding','Status','Action']} rows={[
        ...milestones.filter(m=>!invoices.some(r=>r.milestoneId===m.id)).map(m=>({key:m.id,cells:[m.projectName,m.description,m.date,money(m.amount),'—','—','Scheduled',!readOnly&&<button onClick={()=>{
          onNavigate('Invoicing');
          begin('invoice',{projectId:m.projectId,milestoneId:m.id,client:projects.find(p=>p.id===m.projectId)?.client,items:[{...freshItem(),description:m.description,rate:m.amount/100}]});
        }}>Raise invoice</button>]})),
        ...invoices.map(r=>({key:r.id,status:settled(r)?'settled':'outstanding',cells:[r.projectName,r.number,r.dueDate||r.date,money(r.amount),money(paid(r.id)),money(Math.max(0,r.amount-paid(r.id))),settled(r)?'Settled':age(r)?'Overdue':'Awaiting payment',!readOnly&&!settled(r)&&<button onClick={()=>begin('receipt',{invoiceId:r.id,direction:'Inflow',amount:((r.amount-paid(r.id))/100).toFixed(2),targetInvoice:r})}>Record receipt</button>]}))
      ]}/>
      </details>
    </>}

    {page==='Invoicing'&&<InvoiceWorkspace
      records={invoiceList}
      invoice={activeInvoice}
      editing={draft?.kind==='invoice'}
      busy={busy}
      form={editor}
      sent={sent}
      onMarkSent={!readOnly&&!draft?markSent:undefined}
      onChoose={record=>{setSelected(record);setInvoiceClosed(false);setDraft(null);}}
      onNew={readOnly||busy?undefined:()=>begin('invoice')}
      onEdit={invoice=>{
        begin('invoice',{
          ...invoice,
          isEdit: true,
          items: invoice.items.map(i=>({...i, rate: (i.rate/100).toFixed(2)}))
        });
      }}
      onClose={busy?undefined:()=>{if(draft)setDraft(null);else{setSelected(null);setInvoiceClosed(true);}}}
      canPay={!readOnly&&!busy&&!draft&&activeInvoice&&(activeInvoice.amount>paid(activeInvoice.id))}
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

    {page==='Debit / Credit'&&<>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',margin:'12px 0'}}>
        {!readOnly&&<button className="accounts-overview-primary" onClick={()=>begin('transaction')}>＋ New transaction</button>}
      </div>
      <Table columns={['Date','Value date','Account','Direction','Ledger head','Project','Reference','Amount']} rows={records.filter(r=>r.kind==='transaction').map(r=>({key:r.id,cells:[r.date,r.valueDate||r.date,r.bank,r.direction,r.head,r.projectName||'Studio',r.reference||'—',money(r.amount)]}))}/>
    </>}

    {page==='Reconciliation'&&<>
      <p>Import an Enlighten bank statement CSV, match posted entries, or classify pending transactions.</p>
      {!readOnly&&<div className="accounts-toolbar">
        <label>Statement account <select value={bank} onChange={e=>setBank(e.target.value)} disabled={busy}>{banks.filter(b=>b!=='Cash').map(name=><option key={name}>{name}</option>)}</select></label>
        <label className="accounts-overview-primary" style={{cursor:'pointer',padding:'7px 10px',borderRadius:2}}>
          Import Bank CSV <input type="file" accept=".csv,text/csv" onChange={importStatement} disabled={busy} style={{display:'none'}}/>
        </label>
        <a download="Enlighten_Statement_Template.csv" href="data:text/csv;charset=utf-8,Date%2CReference%2CDescription%2CDebit%2CCredit%0A">Download CSV template</a>
        <button onClick={()=>begin('reconciliation',{bank})} disabled={busy}>Enter single statement line</button>
      </div>}

      {staged.length>0&&<>
        <h2>Statement review · {staged.length} lines</h2>
        <div style={{display:'flex',gap:10,marginBottom:10}}>
          <button className="accounts-overview-primary" disabled={busy} onClick={()=>matchStatement(staged)}>
            {busy?'Matching…':'Match & Clear Staged Entries'}
          </button>
        </div>
        <Table columns={['Date','Account','Reference / description','Amount','Suggested head / Status','Action']} rows={staged.map(row=>{
          const [head,classification]=statementSuggestion(row);
          return {
            key:row.id,
            status:head?'routine':undefined,
            cells:[
              row.date,
              row.bank,
              <>{row.reference}<br/><small style={{color:'#666'}}>{row.description}</small></>,
              money(Number(row.amount)*100),
              [classification,row.issue].filter(Boolean).join(' · ')||(head?`Suggested: ${head}`:'Ready to match'),
              <button disabled={busy} onClick={()=>begin('reconciliation',{...row,importId:row.id,head:head||''})}>Review &amp; Clear</button>
            ]
          };
        })}/>
      </>}

      <h2>Reconciled entries</h2>
      <Table columns={['Date','Account','Direction','Reference','Amount','Match status / Ledger head']} rows={records.filter(r=>r.kind==='reconciliation').map(r=>({key:r.id,cells:[r.date,r.bank,r.direction,r.reference,money(r.amount),r.matchId?'✓ Matched journal entry':r.head]}))}/>
    </>}

    {page==='Chart of Accounts'&&<>
      <div className="accounts-toolbar" style={{justifyContent:'space-between'}}>
        <div style={{display:'inline-flex',alignItems:'center',gap:8}}>
          <Search size={15} color="#888"/>
          <input type="search" placeholder="Search ledger head or type..." value={coaQuery} onChange={e=>setCoaQuery(e.target.value)}/>
        </div>
        <span style={{fontSize:12,color:'#555'}}>Click any ledger head to view its transaction statement.</span>
      </div>

      <Table columns={['Division','Type','Head','Sub Head','Action']} rows={heads.filter(([h,t,s])=>[h,t,s].filter(Boolean).join(' ').toLowerCase().includes(coaQuery.trim().toLowerCase())).map(([head,type,subhead])=>({
        cells:[
          'Design',
          type,
          <strong style={{cursor:'pointer',color:'#102235'}} onClick={()=>setLedgerHead(head)}>{head}</strong>,
          subhead||'—',
          <button type="button" onClick={()=>setLedgerHead(head)}>View Statement</button>
        ]
      }))}/>

      {/* Ledger statement drilldown modal */}
      {ledgerHead&&(
        <section className="accounts-preview" style={{marginTop:24}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
            <h2>General Ledger: {ledgerHead}</h2>
            <button type="button" onClick={()=>setLedgerHead(null)}>Close Statement</button>
          </div>
          {(()=>{
            const entries = records.flatMap(r=>(r.postings||[]).filter(p=>p.head===ledgerHead).map(p=>({
              date: r.date,
              reference: r.reference || r.number || '—',
              description: r.description || r.projectName || r.client || r.kind,
              debit: p.debit || 0,
              credit: p.credit || 0
            }))).sort((a,b)=>a.date.localeCompare(b.date));

            let running = 0;
            const rows = entries.map(e=>{
              running += (e.debit - e.credit);
              return {
                cells: [e.date, e.reference, e.description, e.debit ? money(e.debit) : '—', e.credit ? money(e.credit) : '—', money(running)]
              };
            });

            return (
              <>
                <p>Total Debit: <strong>{money(total(entries,'debit'))}</strong> &nbsp;|&nbsp; Total Credit: <strong>{money(total(entries,'credit'))}</strong> &nbsp;|&nbsp; Net Closing Balance: <strong>{money(running)}</strong></p>
                <Table columns={['Date','Reference','Description','Debit','Credit','Running Balance']} rows={rows} empty="No transactions posted to this ledger head."/>
              </>
            );
          })()}
        </section>
      )}
    </>}

    {page==='Payroll'&&<>
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
    </>}

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

      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:24}}>
        <h2>Balance sheet (as of {asOf})</h2>
        <button type="button" onClick={()=>exportCsv('Balance_Sheet.csv',['Measure','Amount'],[['Assets',balance('Asset')/100],['Liabilities',-balance('Liability')/100],['Equity including earnings',(-balance('Equity')+surplus)/100]])}>
          <Download size={13} style={{marginRight:4}}/> Export CSV
        </button>
      </div>
      <Table columns={['Measure','Amount']} rows={[[ 'Assets',balance('Asset')],['Liabilities',-balance('Liability')],['Equity including earnings',-balance('Equity')+surplus]].map(([k,v])=>({cells:[k,money(v)]}))}/>

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

    {page!=='Invoicing'&&draft?.kind!=='invoice'&&editor}

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
