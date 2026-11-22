import React,{useEffect,useRef,useState} from 'react';
import {escapeSpecHtml} from './spec-sheet.mjs';

export function luminaireOfferLink(token,id){
 return location.origin+'/#luminaire-equivalent?'+new URLSearchParams({invite:token,item:id});
}
export function vendorScheduleDocument(rows,project,token){
 const text=escapeSpecHtml;
 const img=path=>{
  if(!path)return '';
  const url=new URL(path,location.origin);
  return /^https?:$/.test(url.protocol)?`<img src="${text(url.href)}" alt="">`:'';
 };
 return `<!doctype html><html lang="en"><meta charset="utf-8"><title>Luminaire Schedule — ${text(project)}</title><style>body{font:14px system-ui;color:#142238;margin:32px}h1{margin:0}table{border-collapse:collapse;width:100%}td,th{border:1px solid #d6cfc1;padding:8px;text-align:left}th{background:#e5eee9}img{width:75px;height:55px;object-fit:contain}@media print{tr{break-inside:avoid}}</style><h1>Luminaire Schedule</h1><p>${text(project)}</p><table><thead><tr>${['No.','Control','Photo','Code','Make','Article','Equivalent make','Qty','Unit','Vendor response'].map(h=>`<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.map(r=>{const link=text(luminaireOfferLink(token,r.id));return `<tr><td>${text(r.serial)}</td><td>${text(r.control)}</td><td>${img(r.image)}</td><td><a href="${link}">${text(r.code)}</a></td><td>${text(r.make)}</td><td>${text(r.article)}</td><td>${text(r.equivalents)}</td><td>${text(r.quantity)}</td><td>${text(r.unit)}</td><td><a href="${link}">Add Equivalent</a></td></tr>`;}).join('')}</tbody></table></html>`;
}
async function call(action,payload,signal){
 const r=await fetch('/api',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action,payload}),signal});
 const body=await r.json();if(!r.ok||!body.ok)throw Error(body.error?.message||'Could not open the invitation.');return body.data;
}
export default function LuminaireEquivalentForm(){
 const submission=useRef('');
 const params=new URLSearchParams(location.hash.split('?')[1]);
 const token=params.get('invite'),itemId=params.get('item');
 const [item,setItem]=useState(null),[error,setError]=useState(''),[receipt,setReceipt]=useState(''),[busy,setBusy]=useState(false),[documents,setDocuments]=useState([]),[retry,setRetry]=useState(0);
 useEffect(()=>{const controller=new AbortController();setError('');call('getVendorLuminaireItem',{token,itemId},controller.signal).then(data=>setItem(data.item)).catch(e=>{if(!controller.signal.aborted)setError(e.message);});return()=>controller.abort();},[token,itemId,retry]);
 async function submit(e){
  e.preventDefault();if(busy)return;const values=Object.fromEntries(new FormData(e.currentTarget));setBusy(true);setError('');
  try{submission.current||=crypto.randomUUID();const result=await call('submitVendorLuminaireOffer',{token,itemId,submissionId:submission.current,offer:{...values,documents}});setReceipt(result.offerId);}
  catch(err){setError(err.message);}finally{setBusy(false);}
 }
 return <main className="vendor-equivalent-page"><h1>Offer a luminaire equivalent</h1>{item&&<p><strong>{item.code}</strong> · {item.quantity} {item.unit}</p>}{error&&<p role="alert">{error}</p>}
 {!item&&(error?<button type="button" onClick={()=>setRetry(n=>n+1)}>Retry</button>:<p role="status">Loading invitation…</p>)}
 {receipt?<p role="status">Offer submitted. Reference {receipt}</p>:item&&<form onSubmit={submit}>
 <fieldset><legend>Vendor and product</legend><div className="vendor-equivalent-grid">{[['vendor','Company','text'],['email','Contact email','email'],['brand','Manufacturer','text'],['model','Model / article number','text']].map(([key,label,type])=><label key={key}>{label}<input name={key} type={type} maxLength={key==='email'?240:180} required/></label>)}</div></fieldset>
 <fieldset><legend>Technical submission</legend>{[['specifications','Construction, dimensions, CCT, CRI, wattage and control'],['photometry','Beam angles, lumen output, photometric data and test conditions'],['compliance','Compliance standards and certificate references']].map(([key,label])=><label key={key}>{label}<textarea name={key} maxLength={3000} rows={3}/></label>)}
 {documents.map((doc,i)=><div key={i} className="vendor-equivalent-grid"><label>Document name<input required maxLength={180} value={doc.name} onChange={e=>setDocuments(d=>d.map((v,j)=>j===i?{...v,name:e.target.value}:v))}/></label><label>HTTPS document link<input type="url" required maxLength={1500} value={doc.url} onChange={e=>setDocuments(d=>d.map((v,j)=>j===i?{...v,url:e.target.value}:v))}/></label><button type="button" onClick={()=>setDocuments(d=>d.filter((_,j)=>j!==i))}>Remove document</button></div>)}
 <button type="button" disabled={documents.length>=20} onClick={()=>setDocuments(d=>[...d,{name:'',url:''}])}>Add named document</button><p>Provide links to datasheets, IES/LDT files, test reports and named certificates.</p></fieldset>
 <fieldset><legend>Warranty and commercial terms</legend><div className="vendor-equivalent-grid"><label>Unit price<input name="price" type="number" min="0" max="1000000000" step=".01" required/></label><label>Currency<input name="currency" defaultValue="INR" pattern="[A-Za-z]{3}" maxLength={3} required/></label></div>
 <label>Warranty duration, coverage and terms<textarea name="warranty" maxLength={3000} rows={3} required/></label><label>Taxes, lead time, delivery, quote validity and payment terms<textarea name="commercial" maxLength={3000} rows={3}/></label></fieldset>
 <button disabled={busy}>{busy?'Submitting…':'Submit equivalent offer'}</button>
 </form>}
 </main>;
}
