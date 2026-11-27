import {Plus, Upload, MessageCircle, Download, Filter, RotateCcw} from 'lucide-react';
import {transactionBillSource} from './transaction-bill.mjs';
import React,{useEffect,useRef,useState} from 'react';
import {downloadTransactionTemplate,readDesignTransactionFile,transactionErrors} from './design-transactions.mjs';
import {reconciliationIds} from './reconciliation.mjs';
import './DesignTransactions.css';
const money=n=>new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR'}).format((n||0)/100),today=()=>new Date().toLocaleDateString('sv-SE',{timeZone:'Asia/Kolkata'});
const modes=['Cash','UPI','NEFT/RTGS/IMPS','Cheque','Debit Card','Credit Card','Other'];
function TransactionReviewTable({children}) {
 const viewport=useRef(null),table=useRef(null);
 const [position,setPosition]=useState({offset:0,max:0});
 useEffect(()=>{
  const element=viewport.current;
  const sync=()=>setPosition({offset:element.scrollLeft,max:Math.max(0,element.scrollWidth-element.clientWidth)});
  const observer=new ResizeObserver(sync);
  observer.observe(element);
  observer.observe(table.current);
  element.addEventListener('scroll',sync,{passive:true});
  sync();
  return()=>{observer.disconnect();element.removeEventListener('scroll',sync);};
 },[]);
 return <div className="transaction-review-grid">
  {position.max>0&&<label className="transaction-review-scroll-control">
   <span>Scroll columns</span>
   <input type="range" min="0" max={position.max} step="any" value={Math.min(position.offset,position.max)}
     onChange={event=>{viewport.current.scrollLeft=Number(event.target.value);}}/>
  </label>}
  <div className="transaction-preview-scroll transaction-review-viewport" ref={viewport} tabIndex={0}
    role="region" aria-label="Import review table">
   <table ref={table}>{children}</table>
  </div>
 </div>;
}

export default function DesignTransactions({records,projects,heads,request,onSaved,readOnly,onReconcile}){
 const [filters,setFilters]=useState({});
 const [oldestFirst,setOldestFirst]=useState(false);
 function changeFilters(next){
  setFilters(next);
  setSelectedIds(new Set());
 }
 const [deleteTarget,setDeleteTarget]=useState(null),[selectedIds,setSelectedIds]=useState(()=>new Set());
 const [bill,setBill]=useState(null);
 useEffect(()=>{const key=e=>{if(e.key==='Escape')setBill(null)};window.addEventListener('keydown',key);return()=>window.removeEventListener('keydown',key)},[]);
 useEffect(()=>()=>{if(bill?.blob)URL.revokeObjectURL(bill.url)},[bill]);
 const [form,setForm]=useState(null),[proof,setProof]=useState(null),[preview,setPreview]=useState(null),[busy,setBusy]=useState(false),[error,setError]=useState(''),[message,setMessage]=useState(''),[autoMatch,setAutoMatch]=useState(true),[bank,setBank]=useState('IDFC');const fileRef=useRef(),saving=useRef(false);
 const patch=(key,value)=>setForm(f=>({...f,[key]:value}));
 function begin(){setError('');setMessage('');setProof(null);setForm({id:crypto.randomUUID(),company:'Design',entryType:'Payment',fromAccount:'IDFC',toAccount:'Cash',direction:'Outflow',date:today(),projectId:'',projectName:'',paymentMode:'',amount:'',description:'',head:'',bank,beneficiary:'',billNumber:'',paymentType:'',reference:'',attachmentUrl:''})}
 function edit(row){setError('');setMessage('');setProof(null);setForm({...row,company:'Design',entryType:row.entryType||'Payment',amount:(row.amount/100).toFixed(2),editFingerprint:row.deleteFingerprint,projectId:row.projectId||'',projectName:row.projectId?row.projectName||'':'',paymentMode:row.paymentMode||'',fromAccount:row.fromAccount||'IDFC',toAccount:row.toAccount||'Cash'});window.requestAnimationFrame(()=>document.querySelector('.design-transaction-form')?.scrollIntoView({block:'start'}));}
 function mapRows(rows){return rows.map(r=>{const p=projects.filter(p=>[p.id,p.name].some(v=>String(v).trim().toLowerCase()===r.projectName.toLowerCase())),h=heads.find(([h])=>h.trim().toLowerCase()===r.head.toLowerCase());return {...r,id:crypto.randomUUID(),bank:r.bank||(/^cash$/i.test(r.paymentMode)?'Cash':bank),projectId:p.length===1?p[0].id:'',head:h?.[0]||r.head,selected:true};})}
 async function upload(e){const files=[...e.target.files];e.target.value='';if(!files.length)return;setBusy(true);setError('');setMessage('');try{const rows=[],excluded=[];for(const f of files){const p=await readDesignTransactionFile(f);rows.push(...p.rows);excluded.push(...p.excluded)}if(rows.length>500)throw Error('Import up to 500 Design transactions per batch.');setPreview({rows:mapRows(rows),excluded});}catch(e){setError(e.message)}finally{setBusy(false)}}
 async function post(rows){if(saving.current)return;saving.current=true;setBusy(true);setError('');try{const editing=rows.length===1&&rows[0].editFingerprint;const result=editing?await request('editDesignTransaction',{row:rows[0],expectedFingerprint:editing},'POST',90000):await request('importDesignTransactions',{rows,autoMatch},'POST',150000);await onSaved();setMessage(editing?'Transaction updated.':`${result.imported} transactions saved · ${result.duplicates} duplicates skipped · ${result.matched} bank lines matched. ${result.unmatched} bank lines remain for review.`);setPreview(null);setForm(null);setProof(null);}catch(e){setError(e.message)}finally{saving.current=false;setBusy(false)}}
 async function save(e){e.preventDefault();if(saving.current)return;const errors=transactionErrors(form,projects,heads);if(errors.length){setError(errors.join(' · '));return;}if(proof){setBusy(true);try{if(proof.size>3*1024*1024)throw Error('Use a payment screenshot or PDF below 3 MB.');const base64=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result).split(',')[1]);reader.onerror=reject;reader.readAsDataURL(proof)});const asset=await request('uploadAccountsTransactionAttachment',{transactionId:form.id,name:proof.name,base64},'POST',120000);await post([{...form,attachmentId:asset.id}]);}catch(e){setError(e.message||'Could not upload attachment.')}finally{setBusy(false)}}else await post([form]);}
 async function openProof(row){if(!row.attachmentId){const source=transactionBillSource(row.attachmentUrl);if(source)setBill({...source,name:row.billNumber||'Payment bill'});else setError('Enter a valid HTTPS bill or Google Drive link.');return;}setBusy(true);setError('');try{const asset=await request('getAccountsTransactionAttachment',{attachmentId:row.attachmentId},'POST',90000),bytes=Uint8Array.from(atob(asset.base64),c=>c.charCodeAt(0)),url=URL.createObjectURL(new Blob([bytes],{type:asset.mimeType}));setBill({url,name:asset.name,image:asset.mimeType.startsWith('image/'),blob:true});}catch(e){setError(e.message)}finally{setBusy(false)}}

 async function readReceipt(){if(!proof)return;setBusy(true);setError('');try{const image=await new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=reject;r.readAsDataURL(proof)});const draft=await request('draftPaymentReceipt',{image},'POST',150000);setForm(f=>({...f,...draft.fields}));setMessage('Receipt read. Review detected values, choose project and payment head, then save. '+draft.notes);}catch(e){setError(e.message)}finally{setBusy(false)}}
 async function loadReceiptDrafts(){setBusy(true);setError('');try{const drafts=await request('listPaymentReceiptDrafts',{},'POST');setReceiptDrafts(drafts);}catch(e){setError(e.message)}finally{setBusy(false)}}
 async function openReceiptDraft(d){setBusy(true);setError('');try{const a=await request('getPaymentReceiptDraft',{id:d.id},'POST');setProof(null);setForm({id:a.transactionId,company:'Design',projectId:'',projectName:'',head:'',beneficiary:'',billNumber:'',paymentType:'',reference:'',attachmentUrl:'',...a.fields,attachmentId:a.attachmentId,sourceId:a.id});setMessage('WhatsApp receipt: review details and choose project and payment head. '+(a.notes||''));}catch(e){setError(e.message)}finally{setBusy(false)}}
 const [receiptDrafts,setReceiptDrafts]=useState([]);
 async function removeTransaction(){if(!deleteTarget||saving.current)return;saving.current=true;setBusy(true);setError('');try{const result=await request('deleteDesignTransaction',{transactions:deleteTarget.map(row=>({id:row.id,expectedFingerprint:row.deleteFingerprint}))},'POST',90000);setDeleteTarget(null);setSelectedIds(new Set());await onSaved();setMessage(`${result.count} transaction(s) deleted.`+(result.unmatched?' Its bank match has been reopened for review.':''));}catch(e){setError(e.message)}finally{saving.current=false;setBusy(false)}}
 const updateRow=(i,patch)=>setPreview(p=>({...p,rows:p.rows.map((r,j)=>j===i?{...r,...patch}:r)}));
 const used=reconciliationIds(records),entries=records.filter(r=>r.kind==='transaction'||r.kind==='reconciliation'&&r.postings?.length>0),selected=preview?.rows.filter(r=>r.selected)||[],invalid=selected.some(r=>transactionErrors(r,projects,heads).length);
 const isMatched=row=>used.has(row.id)||row.kind==='reconciliation';
 const fieldFilters=[
  ['Head',row=>row.entryType==='Contra'?'Contra transfers':row.head?.trim()||'Uncategorised'],
  ['Debit / Credit',row=>row.entryType==='Contra'?'Contra':row.direction==='Inflow'?'Credit':'Debit'],
  ['Project',row=>row.projectName||'Studio'],
  ['Party / Individual',row=>row.entryType==='Contra'?'(Blank)':row.beneficiary?.trim()||'(Blank)'],
  ['Account',row=>row.bank||'(Blank)'],
  ['Mode',row=>row.paymentMode||'(Blank)'],
  ['Bank status',row=>isMatched(row)?'Matched':'To Reconcile'],
 ];
 const query=filters.search?.trim().toLowerCase();
 const visible=entries.filter(row=>
  (!filters.from||row.date>=filters.from)&&(!filters.to||row.date<=filters.to)&&
  fieldFilters.every(([label,getValue])=>!filters[label]?.length||filters[label].includes(getValue(row)))&&
  (!query||[row.description,row.billNumber,row.reference,row.date,money(row.categorizedAmount??row.amount),...fieldFilters.map(([,getValue])=>getValue(row))]
    .some(value=>String(value??'').toLowerCase().includes(query)))
 ).sort((a,b)=>oldestFirst?(a.date||'').localeCompare(b.date||''):(b.date||'').localeCompare(a.date||''));
 const deletable=visible.filter(row=>row.kind==='transaction'&&row.deleteFingerprint);
 const selectedEntries=deletable.filter(row=>selectedIds.has(row.id));
 const allSelected=deletable.length>0&&selectedEntries.length===deletable.length;
 return <section className="design-transactions">
 <div className="transaction-toolbar">
  {!readOnly&&<>
   <button type="button" disabled={busy} onClick={begin}><Plus size={14}/> New transaction</button>
   <button type="button" disabled={busy} onClick={()=>fileRef.current.click()}><Upload size={14}/> Import</button>
   <button type="button" disabled={busy} onClick={loadReceiptDrafts}><MessageCircle size={14}/> WhatsApp receipts</button>
   <input hidden ref={fileRef} type="file" multiple accept=".csv,.xls,.xlsx" onChange={upload}/>
  </>}
  <div className="transaction-template-buttons" role="group" aria-label="Download template">
   <Download size={14} aria-hidden="true"/>
   {['csv','xls','xlsx'].map(format=><button type="button" key={format} disabled={busy}
    aria-label={'Download '+format.toUpperCase()+' template'} title={'Download '+format.toUpperCase()+' template'}
    onClick={()=>downloadTransactionTemplate(format).catch(e=>setError(e.message))}>{format.toUpperCase()}</button>)}
  </div>
  <label>Default account <select value={bank} onChange={e=>setBank(e.target.value)}><option>IDFC</option><option>Cash</option></select></label>
  <label className="transaction-check" title="Match unique bank lines by date, direction and exact amount">
   <input type="checkbox" checked={autoMatch} onChange={e=>setAutoMatch(e.target.checked)}/> Auto-match bank lines
  </label>
 </div>
 <p className="transaction-note">Record payments and receipts, attach bills, and track bank matching. Imports open for review before saving.</p>{error&&<p role="alert" className="transaction-error">{error}</p>}{message&&<p role="status">{message}</p>}
 {receiptDrafts.length>0&&<div className="accounts-toolbar">{receiptDrafts.map(d=><button key={d.id} onClick={()=>openReceiptDraft(d)} disabled={busy}>{d.createdAt} · {d.fields?.amount||"Review receipt"}</button>)}</div>}
 {form&&<form className="design-transaction-form" onSubmit={save}><header><small>ENLIGHTEN DESIGN CO. / PAYMENT ENTRY</small><h2>{form.editFingerprint?'Edit transaction':'New transaction'}</h2><p>Design company · record a debit or credit</p></header><fieldset disabled={busy||readOnly}><label>1. Payment screenshot / bill (optional)<input type="file" accept=".png,.jpg,.jpeg,.webp,.pdf" onChange={e=>{setProof(e.target.files?.[0]||null);if(e.target.files?.[0])patch('attachmentUrl','')}}/><small>{proof?.name||'PNG, JPG, WebP or PDF · up to 3 MB'}</small></label><button type="button" disabled={!proof||busy} onClick={readReceipt}>Read receipt automatically</button><small>Review extracted details before saving. Receipt is sent to OpenAI for reading.</small><label>Or paste a Google Drive / HTTPS bill link<input type="url" disabled={!!proof} placeholder="https://drive.google.com/file/d/…/view" value={form.attachmentUrl} onChange={e=>patch('attachmentUrl',e.target.value)}/>{form.attachmentUrl&&<button type="button" onClick={()=>openProof(form)}>Preview bill</button>}</label><label>Entry type<select value={form.entryType||'Payment'} onChange={e=>patch('entryType',e.target.value)}><option value="Payment">Payment / Receipt</option><option value="Contra">Contra · Cash ↔ Bank</option></select></label>{form.entryType==='Contra'&&<div className="transaction-fields">{[['fromAccount','From account (credit)'],['toAccount','To account (debit)']].map(([key,label])=><label key={key}>{label}<select value={form[key]||''} onChange={e=>patch(key,e.target.value)}><option value="">Choose account</option><option>IDFC</option><option>Cash</option></select></label>)}<p>One transfer updates both balances. It is excluded from income and expenses.</p></div>}<div className="transaction-fields"><label hidden={form.entryType==='Contra'}>2. Debit / Credit<select value={form.direction} onChange={e=>patch('direction',e.target.value)}><option value="">Select debit / credit</option><option value="Outflow">Debit · paid</option><option value="Inflow">Credit · received</option></select></label><label>3. Payment date<input required type="date" value={form.date} onChange={e=>patch('date',e.target.value)}/></label><label>4. Project<select value={form.projectId} onChange={e=>setForm(f=>({...f,projectId:e.target.value,projectName:''}))}><option value="">Studio / not project related</option>{projects.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label><label hidden={form.entryType==='Contra'}>5. Mode of payment<select required={form.entryType!=='Contra'} value={form.paymentMode} onChange={e=>setForm(f=>({...f,paymentMode:e.target.value,bank:e.target.value==='Cash'?'Cash':f.bank==='Cash'?'IDFC':f.bank}))}><option value="">Select payment mode</option>{[...new Set([...modes,form.paymentMode].filter(Boolean))].map(v=><option key={v}>{v}</option>)}</select></label><label>6. Amount (INR)<input required type="number" min="0.01" step="0.01" value={form.amount} onChange={e=>patch('amount',e.target.value)}/></label><label hidden={form.entryType==='Contra'}>Bank / cash account<select value={form.bank} onChange={e=>patch('bank',e.target.value)}><option value="">Select account</option><option>IDFC</option><option>Cash</option></select></label></div><label>7. Narration<textarea maxLength={1200} rows={3} value={form.description} onChange={e=>patch('description',e.target.value)}/></label><label hidden={form.entryType==='Contra'}>8. Payment head<select required={form.entryType!=='Contra'} value={form.head} onChange={e=>patch('head',e.target.value)}><option value="">Select payment head</option>{heads.filter(([h])=>!['IDFC','Cash','Kotak','Intercompany Clearing','Accounts Receivable','Employee Advances'].includes(h)).map(([h],i)=><option key={h+i}>{h}</option>)}</select></label><label>Payment type (optional)<select value={form.paymentType} onChange={e=>patch('paymentType',e.target.value)}><option value="">Select payment type</option><option>Partial payment</option><option>Full payment</option></select></label><div className="transaction-fields">{[['beneficiary','Party / Individual (optional)'],['billNumber','Bill number (optional)']].map(([key,label])=><label key={key}>{label}<input maxLength={250} value={form[key]} onChange={e=>patch(key,e.target.value)}/></label>)}</div><footer><button type="submit" className="accounts-overview-primary">{busy?'Saving…':'Save transaction'}</button><button type="button" onClick={()=>{setForm(null);setProof(null)}}>Cancel</button></footer></fieldset></form>}
 {preview&&<section className="transaction-import"><h2>Review import</h2><p>{preview.rows.length} Design rows · {preview.excluded.length} Product / Transfer rows excluded. Resolve any highlighted rows before importing. Historical attachment links are retained; files are not copied from Drive.</p><TransactionReviewTable><thead><tr>{['Import','Source row','Debit / Credit','Payment date','Project','Mode','Amount','Head','Party / Individual','Narration','Payment type','Review'].map(h=><th key={h}>{h}</th>)}</tr></thead><tbody>{preview.rows.map((r,i)=>{const errors=transactionErrors(r,projects,heads);return <tr key={r.id}><td><input type="checkbox" checked={r.selected} onChange={e=>updateRow(i,{selected:e.target.checked})}/></td><td>{r.sourceLabel} · {r.sourceRow}</td><td><select value={r.entryType==='Contra'?'Contra':r.direction} onChange={e=>updateRow(i,{direction:e.target.value==='Contra'?'':e.target.value,entryType:e.target.value==='Contra'?'Contra':'Payment'})}><option value="">Select</option><option value="Contra">Contra</option><option value="Outflow">Debit</option><option value="Inflow">Credit</option></select></td><td><input type="date" value={r.date} onChange={e=>updateRow(i,{date:e.target.value})}/></td><td><select value={r.projectId} onChange={e=>updateRow(i,{projectId:e.target.value,projectName:''})}><option value="">{r.projectName?'Unmapped: '+r.projectName:'Studio'}</option>{projects.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select>{r.projectName&&!r.projectId&&<button onClick={()=>updateRow(i,{projectName:'',projectId:''})}>Use Studio</button>}</td><td>{r.entryType==='Contra'?<>{['fromAccount','toAccount'].map(key=><label key={key}>{key==='fromAccount'?'From':'To'}<select value={r[key]||''} onChange={e=>updateRow(i,{[key]:e.target.value})}><option value="">Choose</option><option>IDFC</option><option>Cash</option></select></label>)}</>:<><input value={r.paymentMode} onChange={e=>updateRow(i,{paymentMode:e.target.value})}/><select aria-label="Row bank account" value={r.bank} onChange={e=>updateRow(i,{bank:e.target.value})}><option>IDFC</option><option>Cash</option></select></>}</td><td><input type="number" min="0.01" step="0.01" value={r.amount} onChange={e=>updateRow(i,{amount:e.target.value})}/></td><td>{r.entryType==='Contra'?'Contra · no payment head':<select value={r.head} onChange={e=>updateRow(i,{head:e.target.value})}><option value={heads.some(([h])=>h===r.head)?'':r.head}>{r.head||'Select head'}</option>{heads.map(([h],j)=><option key={h+j}>{h}</option>)}</select>}</td><td>{r.entryType==='Contra'?'—':<input aria-label={`Party / Individual for source row ${r.sourceRow}`} value={r.beneficiary||''} onChange={e=>updateRow(i,{beneficiary:e.target.value})}/>}</td><td><textarea value={r.description} onChange={e=>updateRow(i,{description:e.target.value})}/></td><td><select value={r.paymentType||''} onChange={e=>updateRow(i,{paymentType:e.target.value})}><option value="">Not supplied</option><option>Partial payment</option><option>Full payment</option></select></td><td className={errors.length?'transaction-error':''}>{errors.join(' · ')||'Ready'}</td></tr>})}</tbody></TransactionReviewTable><footer className="transaction-review-actions"><button className="accounts-overview-primary" disabled={busy||readOnly||!selected.length||invalid} onClick={()=>post(selected)}>Import {selected.length} selected transactions</button><button disabled={busy} onClick={()=>setPreview(null)}>Cancel</button></footer></section>}
 <div className="transaction-filters" role="group" aria-label="Transaction filters">
  <label>Search<input type="search" value={filters.search||''} placeholder="Party, narration, amount…" onChange={e=>changeFilters({...filters,search:e.target.value})}/></label>
  <label>From<input type="date" value={filters.from||''} onChange={e=>changeFilters({...filters,from:e.target.value})}/></label>
  <label>To<input type="date" value={filters.to||''} onChange={e=>changeFilters({...filters,to:e.target.value})}/></label>
  <label>Date order<select value={oldestFirst?'oldest':'newest'} onChange={e=>setOldestFirst(e.target.value==='oldest')}><option value="newest">Newest first</option><option value="oldest">Oldest first</option></select></label>
  {fieldFilters.map(([label,getValue])=>{
   const checked=filters[label]||[];
   const choices=[...new Set([...entries.map(getValue),...checked])].sort((a,b)=>a.localeCompare(b));
   return <details key={label}><summary aria-label={label} title={label}><Filter size={12} aria-hidden="true"/>{{'Debit / Credit':'Type','Party / Individual':'Party','Bank status':'Status'}[label]||label}{checked.length>0&&' ('+checked.length+')'}</summary>
    <div className="transaction-filter-options" role="group" aria-label={label}>
     <button type="button" disabled={!checked.length} onClick={()=>changeFilters({...filters,[label]:[]})}>Clear {label}</button>
     {choices.map(value=><label key={value}><input type="checkbox" checked={checked.includes(value)} onChange={e=>changeFilters({
      ...filters,[label]:e.target.checked?[...checked,value]:checked.filter(item=>item!==value)
     })}/>{value}</label>)}
    </div>
   </details>;
  })}
  <button type="button" aria-label="Clear filters" title="Clear filters" onClick={()=>changeFilters({})}><RotateCcw size={14} aria-hidden="true"/></button>
  <small role="status">{visible.length} of {entries.length} transactions</small>
 </div>
 {!readOnly&&selectedEntries.length>0&&<div className="accounts-toolbar"><button type="button" className="transaction-delete" disabled={busy} onClick={()=>setDeleteTarget(selectedEntries)}>Delete selected ({selectedEntries.length})</button></div>}
 <div className="transaction-preview-scroll transaction-ledger"><table><thead><tr>{!readOnly&&<th><input type="checkbox" aria-label="Select all visible transactions" checked={allSelected} disabled={busy||!deletable.length}
 ref={element=>{if(element)element.indeterminate=selectedEntries.length>0&&!allSelected;}}
 onChange={()=>setSelectedIds(allSelected?new Set():new Set(deletable.map(row=>row.id)))}/></th>}{['Payment date','Debit / Credit','Project','Party / Individual','Payment details','Account / Mode','Amount','Bank status','Actions'].map(h=><th key={h}>{h}</th>)}</tr></thead><tbody>{visible.map(r=>{const matched=isMatched(r);return <tr key={r.id}>{!readOnly&&<td>{r.kind==='transaction'&&r.deleteFingerprint&&<input type="checkbox" aria-label={`Select transaction ${r.date} · ${money(r.amount)} · ${r.id}`} checked={selectedIds.has(r.id)} disabled={busy} onChange={e=>{
  const checked=e.target.checked;
  setSelectedIds(previous=>{const next=new Set(previous);if(checked)next.add(r.id);else next.delete(r.id);return next;});
 }}/>}</td>}<td>{r.date?new Date(r.date+'T00:00:00').toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}):'—'}</td><td><span className={'transaction-direction '+(r.direction==='Inflow'?'credit':'debit')}>{r.entryType==='Contra'?'⇄ Contra':r.direction==='Inflow'?'↙ Credit':'↗ Debit'}</span></td><td>{r.projectName||'Studio'}</td><td>{r.entryType==='Contra'?'—':r.beneficiary||'—'}</td><td className="transaction-description"><strong>{r.entryType==='Contra'?r.fromAccount+' → '+r.toAccount:r.head||'Uncategorised'}</strong>{r.description&&<div>{r.description}</div>}{(r.billNumber||r.paymentType)&&<small>{[r.billNumber&&'Bill '+r.billNumber,r.paymentType].filter(Boolean).join(' · ')}</small>}</td><td>{r.bank}<small>{r.paymentMode||'—'}</small></td><td className="transaction-amount">{money(r.categorizedAmount??r.amount)}</td><td>{matched?<span className="transaction-status matched">Matched</span>:<button type="button" className="transaction-status transaction-reconcile-link" onClick={()=>onReconcile?.(r)}>To Reconcile</button>}</td><td className="transaction-actions">{(r.attachmentId||r.attachmentUrl)&&<button disabled={busy} onClick={()=>openProof(r)}>View bill</button>}{!readOnly&&r.kind==='transaction'&&r.deleteFingerprint&&<button type="button" disabled={busy} onClick={()=>edit(r)}>Edit</button>}{!readOnly&&r.kind==='transaction'&&<button className="transaction-delete" disabled={busy} onClick={()=>setDeleteTarget([r])}>Delete</button>}</td></tr>})}{!visible.length&&<tr><td colSpan={readOnly?9:10}>{entries.length?'No transactions match these filters.':'No transactions yet. Add a payment or import your transactions above.'}</td></tr>}</tbody></table></div>
 {deleteTarget&&<div className="transaction-bill-overlay" role="dialog" aria-modal="true" aria-label="Delete transaction"><section className="transaction-delete-dialog"><h2>Delete {deleteTarget.length} {deleteTarget.length===1?'transaction':'transactions'}?</h2>{deleteTarget.length===1&&<p>{deleteTarget[0].date} · {deleteTarget[0].projectName||'Studio'} · {money(deleteTarget[0].amount)}</p>}<p>This removes the selected entries from your books. Any bank match will reopen for reconciliation; the bank statement stays unchanged.</p><footer><button disabled={busy} onClick={removeTransaction}>Delete {deleteTarget.length===1?'transaction':'transactions'}</button><button disabled={busy} onClick={()=>setDeleteTarget(null)}>Cancel</button></footer></section></div>}
 {bill&&<div className="transaction-bill-overlay" role="dialog" aria-modal="true" aria-label="Bill preview"><section className="transaction-bill-panel"><header><h2>{bill.name}</h2><div>{bill.original&&<a href={bill.original} target="_blank" rel="noopener noreferrer">Open original</a>}{bill.blob&&<a href={bill.url} download={bill.name}>Download</a>}<button type="button" onClick={()=>setBill(null)}>Close ×</button></div></header>{bill.image?<img src={bill.url} alt="Payment bill"/>:<iframe title="Payment bill document" src={bill.url} sandbox="allow-scripts allow-same-origin allow-popups allow-forms"/>}{bill.original&&<p>Google Drive permissions still apply. If the preview cannot load, open the original using an account that has access.</p>}</section></div>}</section>;
}
