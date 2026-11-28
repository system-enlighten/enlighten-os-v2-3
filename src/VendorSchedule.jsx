import React,{useEffect,useMemo,useState} from 'react';
import {assessmentGroups} from './product-assessment.mjs';
import {applicationCategory,categoryOrder} from './linear-lineup.mjs';
import {buildColumnTable} from './technical-column-logic.mjs';
import {designRequirements,requirementSections} from './vendor-schedule-requirements.mjs';
import ManufacturerFamilyEditor from './ManufacturerFamilyEditor.jsx';
import ProductSpecSheet from './ProductSpecSheet.jsx';
import {CatalogueSpecEditor} from './CatalogueSpecEditor.jsx';
import './TechnicalDocumentation.css';
import './VendorSchedule.css';

const invitationLink=id=>location.origin+location.pathname+'#vendor-schedule='+encodeURIComponent(id);
const freshProduct=()=>({id:'product-'+crypto.randomUUID(),brand:'',model:'',family:'',specs:{}});
const readFile=file=>new Promise((resolve,reject)=>{
 if(!file||file.size>3*1024*1024){reject(Error('Choose a file under 3 MB.'));return;}
 const reader=new FileReader();reader.onload=()=>resolve(String(reader.result).split(',')[1]);reader.onerror=()=>reject(Error('Could not read file.'));reader.readAsDataURL(file);
});
function ScheduleHeading({project}){
 return <header className="technical-document-heading vendor-document-heading">
  <h1>Luminaire Schedule</h1>
  {project?.name&&<h2>{project.name}</h2>}
  <p>Lights with a specific character are a part of the <strong>exhibit designers’ BOQ</strong> &amp; not this Luminaire Schedule.<br/>For detailed description, refer luminaire specification sheets.</p>
 </header>;
}
function DesignRequirements({text}){
 const sections=requirementSections(text);
 return <div className="vendor-requirements">{sections.map(({label,values},i)=><div key={i}>{label&&<strong>{label} · </strong>}{values.join(' · ')}</div>)}</div>;
}
function ScheduleRows({items,products=[],onAdd,onEdit}){
 return <div className="vendor-schedule-scroll"><table><thead><tr><th>Application</th><th>Fitting type</th><th>Design requirements</th><th>Quantity</th><th>Manufacturer products</th></tr></thead><tbody>{items.map(item=><tr key={item.id}><td>{item.icon&&<img src={item.icon} alt=""/>}<div>{item.category}</div></td><td><strong>{item.code}</strong><div>{item.type}</div></td><td><DesignRequirements text={item.requirements}/></td><td>{item.quantity} {item.unit}</td><td>{products.filter(p=>p.itemId===item.id).map(p=><div key={p.id}>{onEdit?<button type="button" onClick={()=>onEdit(item,p)}>{p.product.brand} · {p.product.model}</button>:<span>{p.product.brand} · {p.product.model}</span>}</div>)}{onAdd&&<button type="button" onClick={()=>onAdd(item)}>+ Add Manufacturer Product</button>}</td></tr>)}</tbody></table></div>;
}
function EntryEditor({entry,request,onClose,onSave,invitationId,projectId}){
 const level=entry.existing&&entry.product.specs?.manufacturerFamily?.level||'variant';
 const [busy,setBusy]=useState(false),[error,setError]=useState('');
 const upload=async file=>request(invitationId?'uploadVendorScheduleAsset':'uploadTechnicalProductAsset',{...(invitationId?{invitationId}:{projectId}),name:file.name,mimeType:file.type,base64:await readFile(file)},'POST',120000);
 const ai=payload=>request('draftProductFromSpreadsheet',{...payload,...(invitationId?{invitationId}:{}),fittingCode:entry.item.code},'POST',180000);
 const save=async product=>{setBusy(true);setError('');try{await onSave({...product,...(level==='variant'?{recordKind:'variant'}:{})});onClose();}catch(e){setError(e.message);}finally{setBusy(false);}};
 return <div className="vendor-editor-overlay"><section className="vendor-editor" role="dialog" aria-modal="true" aria-label="Manufacturer product"><header><h2>{entry.item.code} · Manufacturer product</h2><button disabled={busy} onClick={onClose}>Close ×</button></header>{level!=='variant'?<ManufacturerFamilyEditor entryLevel={level} fitting={{fittingType:entry.item.code}} product={entry.product} onSave={save} onCancel={onClose} onUpload={upload} onAi={ai} busy={busy} saveError={error}/>:<CatalogueSpecEditor product={entry.product} onSave={save} onCancel={onClose} onUpload={upload} onAi={ai} busy={busy} saveError={error}/>}</section></div>;
}
export function VendorSchedulePortal({request,invitationId}){
 const [data,setData]=useState(null),[entry,setEntry]=useState(null),[error,setError]=useState(''),[busy,setBusy]=useState(false),[preview,setPreview]=useState(null);
 const load=()=>request('getVendorSchedule',{invitationId},'POST',90000).then(setData).catch(e=>setError(e.message));
 useEffect(()=>{load();},[invitationId]);
 const editable=['draft','revision','in progress'].includes(data?.status);
 const submit=async()=>{const missing=data.items.filter(item=>!data.products.some(p=>p.itemId===item.id)).length;if(missing&&!window.confirm('Submit with '+missing+' fitting(s) without an offer?'))return;setBusy(true);setError('');try{await request('submitVendorSchedule',{invitationId});await load();}catch(e){setError(e.message);}finally{setBusy(false);}};
 return <main className="vendor-schedule"><h1>Luminaire Schedule | Design</h1>{error&&<p role="alert">{error}</p>}{!data&&!error&&<p>Loading invitation…</p>}{data&&<><ScheduleHeading project={data.project}/><header className="vendor-toolbar"><h2>{data.vendor}</h2><span>{data.status==='draft'?'Not started':data.status}</span><span>{data.items.filter(item=>data.products.some(p=>p.itemId===item.id)).length} / {data.items.length} fittings offered</span>{editable&&<button className="vendor-primary" disabled={busy||!data.products.length} onClick={submit}>Submit for review</button>}</header>{data.feedback&&<p role="status">{data.feedback}</p>}<ScheduleRows items={data.items} products={data.products} onAdd={editable?item=>setEntry({item,product:freshProduct()}):undefined} onEdit={(item,p)=>editable?setEntry({item,product:p.product,existing:true}):setPreview({item,product:p.product})}/>{preview&&<div className="vendor-editor-overlay"><section className="vendor-editor"><ProductSpecSheet fitting={{fittingType:preview.item.code}} product={preview.product} onClose={()=>setPreview(null)}/></section></div>}{entry&&<EntryEditor entry={entry} request={request} invitationId={invitationId} onClose={()=>setEntry(null)} onSave={async product=>{await request('saveVendorScheduleProduct',{invitationId,itemId:entry.item.id,product},'POST',90000);await load();}}/>}</>}</main>;
}
export default function VendorSchedule({projectId,project,request,canEdit,onAssessment}){
 const [data,setData]=useState(null),[invitations,setInvitations]=useState({invitations:[],products:[]}),[vendor,setVendor]=useState(''),[email,setEmail]=useState(''),[entry,setEntry]=useState(null),[busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState(''),[reviewProduct,setReviewProduct]=useState(null);
 const [loadRevision,setLoadRevision]=useState(0),[detailsLoading,setDetailsLoading]=useState(true),[vendorLoading,setVendorLoading]=useState(true),[detailsError,setDetailsError]=useState(''),[vendorError,setVendorError]=useState('');
 useEffect(()=>{
  let live=true;
  setData(null);setError('');setDetailsError('');setVendorError('');setDetailsLoading(true);setVendorLoading(true);setNotice('');setEntry(null);setReviewProduct(null);
  if(!projectId)return;
  const seedPromise=fetch('/technical-library/database.json').then(r=>{if(!r.ok)throw Error('Product Database could not load.');return r.json();});
  const designPromise=request('getTechnicalDocumentation',{projectId},'POST',90000);
  Promise.all([designPromise,seedPromise]).then(([d,seed])=>{
   if(!live)return;
   setData({d,z:[],fittings:seed.fittings.filter(f=>!f.deleted)});
   return Promise.allSettled([request('listFloorZones',{projectId},'POST',90000),request('listTechnicalFittings',{},'GET',90000)]).then(([zones,updates])=>{
    if(!live)return;
    const all=new Map(seed.fittings.map(f=>[f.id,f]));
    if(updates.status==='fulfilled')updates.value.forEach(f=>all.set(f.id,{...all.get(f.id),...f}));
    setData({d,z:zones.status==='fulfilled'?zones.value:[],fittings:[...all.values()].filter(f=>!f.deleted)});
    const failed=[zones,updates].filter(r=>r.status==='rejected');
    if(failed.length)setDetailsError(failed.map(r=>r.reason?.message||'Additional design details could not load.').join(' · '));
   });
  }).catch(e=>live&&setError(e.message)).finally(()=>live&&setDetailsLoading(false));
  request('listVendorSchedules',{projectId},'POST',90000).then(v=>live&&setInvitations(v)).catch(e=>live&&setVendorError(e.message)).finally(()=>live&&setVendorLoading(false));
  return()=>{live=false;};
 },[projectId,loadRevision,request]);
 const items=useMemo(()=>{
  if(!data)return [];
  const fittings=data.fittings.map(({id,fittingType,category,iconUrl})=>({id,fittingType,category,iconUrl}));
  const rows=buildColumnTable(data.d,data.z,fittings).rows;
  const bySource=new Map(rows.flatMap(r=>r.sourceIndices.map(i=>[i,r])));
  const byCode=new Map(fittings.map(f=>[String(f.fittingType).trim().toUpperCase().replace(/\s/g,''),f]));
  return assessmentGroups(data.d,fittings,{includeMedia:false}).groups.map(g=>{
   const fitting=byCode.get(String(g.code).trim().toUpperCase().replace(/\s/g,''));
   const related=[...new Set(g.sourceIndices.map(i=>bySource.get(i)).filter(Boolean))];
   return {id:g.id,code:g.code,type:g.type,quantity:g.quantity,unit:g.unit,category:applicationCategory(fitting,g.type),icon:g.icon,requirements:designRequirements(data.d,g,related)};
  }).sort((a,b)=>categoryOrder(a.category)-categoryOrder(b.category));
 },[data]);
 const reload=async()=>setInvitations(await request('listVendorSchedules',{projectId},'POST',90000));
 const perform=async action=>{setBusy(true);setError('');setNotice('');try{await action();}catch(e){setError(e.message);}finally{setBusy(false);}};
 const invite=()=>perform(async()=>{const result=await request('createVendorSchedule',{projectId,vendor,email,items});setNotice(invitationLink(result.id));setVendor('');setEmail('');await reload();});
 const publish=async(item,product)=>{
  const all=new Map(data.fittings.map(f=>[f.id,f]));
  const updates=await (request.fresh?request.fresh('listTechnicalFittings',{},'GET',90000):request('listTechnicalFittings',{},'GET',90000));
  updates.forEach(f=>all.set(f.id,{...all.get(f.id),...f}));
  const fitting=[...all.values()].find(f=>!f.deleted&&String(f.fittingType).trim().toUpperCase()===String(item.code).trim().toUpperCase())||{id:'fitting-'+crypto.randomUUID(),fittingType:item.code,category:item.category,products:[]};
  const saved=await request('saveTechnicalFitting',{projectId,fitting:{...fitting,products:[...(fitting.products||[]).filter(p=>p.id!==product.id),product]},expectedCatalogVersion:fitting.catalogVersion||''},'POST',90000);
  setData(old=>({...old,fittings:[...old.fittings.filter(f=>f.id!==saved.id),saved]}));request.invalidate?.('listTechnicalFittings');
 };

 return <section className="vendor-schedule"><ScheduleHeading project={project}/>{error&&<p role="alert">{error} <button onClick={()=>setLoadRevision(n=>n+1)}>Retry</button></p>}{!data&&!error&&<p>Loading design schedule…</p>}{data&&<><header className="vendor-toolbar"><span>{items.length} fitting types</span>{detailsLoading&&<span role="status">Loading additional design details…</span>}{detailsError&&<span role="alert">{detailsError} <button onClick={()=>setLoadRevision(n=>n+1)}>Retry</button></span>}<button onClick={onAssessment}>Open Product Assessment</button></header><ScheduleRows items={items} products={invitations.products} onEdit={(item,p)=>setReviewProduct({item,product:p.product})} onAdd={canEdit?item=>setEntry({item,product:freshProduct()}):undefined}/>{canEdit&&<section className="vendor-invite"><h3>Invite vendor</h3><label>Vendor<input value={vendor} onChange={e=>setVendor(e.target.value)}/></label><label>Google account email<input type="email" value={email} onChange={e=>setEmail(e.target.value)}/></label><button className="vendor-primary" disabled={busy||detailsLoading||!!detailsError||!items.length||!vendor||!email} onClick={invite}>Create invitation link</button>{notice&&(notice.startsWith("http")?<div><input readOnly value={notice}/><button onClick={()=>navigator.clipboard.writeText(notice)}>Copy link</button></div>:<span role="status">{notice}</span>)}</section>}<h3>Vendor submissions</h3>{vendorLoading&&<p role="status">Loading vendor submissions…</p>}{vendorError&&<p role="alert">{vendorError} <button onClick={()=>setLoadRevision(n=>n+1)}>Retry</button></p>}<div className="vendor-schedule-scroll"><table><thead><tr><th>Vendor</th><th>Status</th><th>Link</th><th>Review</th></tr></thead><tbody>{invitations.invitations.map(i=><tr key={i.id}><td>{i.vendor}<div>{i.email}</div></td><td>{i.status}{i.feedback&&<div>{i.feedback}</div>}</td><td><button onClick={()=>navigator.clipboard.writeText(invitationLink(i.id))}>Copy link</button></td><td>{canEdit&&i.status==='submitted'&&['revision','approved','rejected'].map(status=><button key={status} disabled={busy} onClick={()=>perform(async()=>{const feedback=status==='revision'?window.prompt('What should the vendor revise?'):'';if(status==='revision'&&!feedback)return;await request('reviewVendorSchedule',{projectId,invitationId:i.id,status,feedback});await reload();})}>{status==='revision'?'Request revision':status==='approved'?'Approve for project':'Reject'}</button>)}{canEdit&&i.status==='approved'&&invitations.products.filter(p=>p.invitationId===i.id).map(p=><button key={p.id} disabled={busy} onClick={()=>perform(async()=>{await publish({code:p.code,category:p.category},p.product);setNotice('Added to Application Database');})}>Add {p.product.model} to database</button>)}{canEdit&&i.status!=='revoked'&&<button disabled={busy} onClick={()=>perform(async()=>{await request('reviewVendorSchedule',{projectId,invitationId:i.id,status:'revoked'});await reload();})}>Revoke link</button>}</td></tr>)}</tbody></table></div>{reviewProduct&&<div className="vendor-editor-overlay"><section className="vendor-editor"><ProductSpecSheet fitting={{fittingType:reviewProduct.item.code}} product={reviewProduct.product} onClose={()=>setReviewProduct(null)}/></section></div>}{entry&&<EntryEditor entry={entry} request={request} projectId={projectId} onClose={()=>setEntry(null)} onSave={product=>publish(entry.item,product)}/>}</>}</section>;
}
