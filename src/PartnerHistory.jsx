import React,{useState} from 'react';
import './PartnerHistory.css';

const sections=[
 ['supply','Products supplied','Delivered on'],
 ['sample','Sample requests processed','Processed on'],
 ['mockup','Mockup requests processed','Processed on'],
 ['purchase-order','Purchase orders received','Received on'],
 ['service','Service requests','Received on'],
];
const days=(start,end)=>Math.round((Date.parse(end)-Date.parse(start))/86400000);
const today=()=>new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Kolkata'}).format(new Date());

export default function PartnerHistory({history,product,fitting,group,context,canEdit,request,projectId,onSaved,onOpenDraft}){
 const [entry,setEntry]=useState(null),[saving,setSaving]=useState(false),[error,setError]=useState('');
 const records=history?.records||[];
 const terms=records.find(r=>r.kind==='terms');
 const currentTerms=records.find(r=>r.kind==='terms'&&r.editable);
 const warranty=product.specs?.warranty;
 const article=product.specs?.article||product.model;
 function open(kind,row){
  setError('');
  setEntry(row||{id:'partner-'+crypto.randomUUID(),kind,date:today(),article,code:group.code,site:context.area||'',unit:group.unit,quantity:'',projectId,brand:product.brand});
 }
 async function save(event){
  event.preventDefault();setSaving(true);setError('');
  try{
   const saved=await request('saveProductPartnerHistory',{...entry,expectedVersion:entry.version||''},'POST',90000);
   onSaved({...saved,project:context.project,editable:true});
   setEntry(null);
  }catch(e){setError(e.message);}
  finally{setSaving(false);}
 }
 if(!history)return <p role="status">Loading partner history…</p>;
 const input=(key,label,type='text',required=false)=><label>{label}<input type={type} required={required} min={type==='number'?'0.000001':undefined} step={type==='number'?'any':undefined} value={entry[key]??''} onChange={e=>setEntry({...entry,[key]:e.target.value})}/></label>;
 const textarea=(key,label,required=false)=><label>{label}<textarea required={required} value={entry[key]??''} onChange={e=>setEntry({...entry,[key]:e.target.value})}/></label>;
 return <section className="partner-history">
  <header><h3>{product.brand} · Partner history</h3></header>
  <section className="partner-terms">
   <div><strong>Warranty</strong><p>{terms?.warranty||(warranty?`${warranty} years for ${article}`:'—')}</p></div>
   <div><strong>Service offered</strong><p>{terms?.service||'—'}</p></div>
   {canEdit&&<button type="button" disabled={saving} onClick={()=>open('terms',currentTerms)}>Edit warranty &amp; service</button>}
  </section>
  {entry&&<form className="partner-entry" onSubmit={save}>
   <h4>{entry.kind==='terms'?'Warranty & service':sections.find(([kind])=>kind===entry.kind)?.[1]}</h4>
   {error&&<p role="alert">{error}</p>}
   <div className="partner-fields">
    {input('date',entry.kind==='terms'?'Effective date':sections.find(([kind])=>kind===entry.kind)?.[2],'date',true)}
    {entry.kind==='terms'?<>{textarea('warranty','Warranty coverage')}{textarea('service','Service offered')}</>:<>
     {input('site','Site / location')}{input('article','Article number')}{input('reference',entry.kind==='purchase-order'?'PO number':'Reference')}
     {entry.kind==='service'?input('resolved','Resolved on','date'):<>{input('quantity','Quantity','number',true)}{input('unit','Unit')}</>}
     {textarea('notes',entry.kind==='service'?'Service issue and outcome':'Notes',entry.kind==='service')}
    </>}
   </div>
   <div className="partner-actions"><button type="submit" className="partner-primary" disabled={saving}>{saving?'Saving…':'Save record'}</button><button type="button" disabled={saving} onClick={()=>setEntry(null)}>Cancel</button></div>
  </form>}
  {sections.map(([kind,title,dateLabel])=>{
   const rows=records.filter(r=>r.kind===kind);
   const service=kind==='service';
   const columns=['Icon','Thumbnail','Article / fitting','Project / site',...(service?['Issue','Resolved on','Resolution time']:['Quantity']),dateLabel,'Reference'];
   return <section key={kind} className="partner-history-block">
    <header><h4>{title}</h4>{canEdit&&<button type="button" disabled={saving} onClick={()=>open(kind)}>+ Add record</button>}</header>
    <div className="partner-table-wrap"><table aria-label={title}><thead><tr>{columns.map(col=><th key={col}>{col}</th>)}{canEdit&&<th>Action</th>}</tr></thead>
    <tbody>{rows.length?rows.map(r=><tr key={r.id}>
     <td>{r.code===group.code&&fitting.iconUrl&&<img src={fitting.iconUrl} alt=""/>}</td>
     <td>{r.article===article&&(product.imageUrl||fitting.thumbnailUrl)&&<img src={product.imageUrl||fitting.thumbnailUrl} alt=""/>}</td>
     <td>{r.article||r.code||'—'}</td><td>{r.project||'—'}{r.site&&<small>{r.site}</small>}</td>
     {service?<><td>{r.notes}</td><td>{r.resolved||'Open'}</td><td>{r.resolved?`${days(r.date,r.resolved)} days`:'—'}</td></>:<td>{r.quantity} {r.unit}</td>}
     <td>{r.date}</td><td>{r.reference||'—'}</td>
     {canEdit&&<td>{r.editable&&<button type="button" disabled={saving} onClick={()=>open(kind,r)}>Edit</button>}</td>}
    </tr>):<tr><td colSpan={columns.length+Number(canEdit)}>No records yet.</td></tr>}</tbody></table></div>
   </section>;
  })}
  {!!history.drafts?.length&&<details><summary>Project drafts and product list ({history.drafts.length})</summary>
   <ul>{history.drafts.map(r=><li key={r.id}>{r.article} · {r.kind.replaceAll('-',' ')} · {r.status} {canEdit&&<button type="button" onClick={()=>onOpenDraft(r)}>Open</button>}</li>)}</ul>
  </details>}
 </section>;
}
