import PartnerContactCard from './PartnerContactCard.jsx';
import ProductRequestTable from './ProductRequestTable.jsx';
import PartnerHistory from './PartnerHistory.jsx';
import {ProductFamily,ProductFamilyEditor} from './ProductFamily.jsx';
import {Pencil,Trash2,X,Package,FilePlus,FileDown,MessageSquare,Link2,Megaphone,FileCheck,FileQuestion} from 'lucide-react';
import React,{useEffect,useState} from 'react';
import {CatalogueSpecEditor as ProductForm} from './CatalogueSpecEditor.jsx';
import ProductSpecSheet from './ProductSpecSheet.jsx';
import {manufacturerSpecUrl} from './product-assessment.mjs';
const actions=[
 ['sample',Package,'Request Sample'],
 ['mockup',FilePlus,'Request Mockup'],
 ['datasheet',FileDown,'Data sheet (PDF)'],
 ['contact',MessageSquare,'Contact partner'],
 ['product-list',Link2,'Add to product list'],
 ['purchase-order',Megaphone,'Release PO']
];
export default function AssessmentProductPreview({product,fitting,group,projectId,request,canEdit,onClose,onEdit,onDelete,onUpload,onAi,context={},catalogue=[],review,onReview,initialView='sheet'}){
 const [view,setView]=useState(initialView),[history,setHistory]=useState(null),[error,setError]=useState(''),[draft,setDraft]=useState(null),[busy,setBusy]=useState(false),[message,setMessage]=useState('');
 useEffect(()=>{let alive=true;request('getProductWorkflow',{projectId,brand:product.brand},'POST',90000).then(r=>{if(alive)setHistory(r)}).catch(e=>{if(alive)setError(e.message)});return()=>{alive=false}},[projectId,product.brand]);
 const article=product.specs?.article||product.model,url=manufacturerSpecUrl(product);
 const partnerRecord=[...(history?.drafts||[])].filter(row=>row.kind==='contact'&&row.partnerDetails)
  .sort((a,b)=>String(b.updatedAt).localeCompare(String(a.updatedAt)))[0];
 const spec=product.specs||{};
 const documents=[
  ['Photometric data (IES)',spec.ies],
  ['LM-80 report',spec.lm80],
  ['TM-30 report',spec.tm30],
  ['Test certificate',spec.certificate],
 ];
 function draftDocumentRequest(label){
  setError('');setMessage('');
  const partner=partnerRecord?.partnerDetails;
  setDraft({id:'product-action-'+crypto.randomUUID(),kind:'contact',fittingId:fitting.id,productId:product.id,code:group.code,brand:product.brand,article,quantity:0,unit:group.unit||'',partner:partner?.name||product.brand,contact:partner?.email||'',notes:`Hello ${partner?.name||product.brand},\n\nPlease share the ${label} for article ${article}${context.project?' for '+context.project:''}.\n\nThank you.`,version:'',documentLabel:label});
  setView('action');
 }
 function start(kind){setMessage('');setError('');if(['sample','mockup','purchase-order','contact'].includes(kind)){setView(kind);return;}setDraft({id:'product-action-'+crypto.randomUUID(),kind,fittingId:fitting.id,productId:product.id,code:group.code,brand:product.brand,article,quantity:group.quantity,unit:group.unit,rate:product.specs?.price??'',currency:product.specs?.currency||'INR',partner:'',contact:'',billing:'',notes:'',version:''});setView('action');}
 async function save(e){e.preventDefault();setBusy(true);setError('');try{const saved=await request('saveProductWorkflowDraft',{...draft,projectId,expectedVersion:draft.version},'POST',90000);setDraft({...saved,documentLabel:draft.documentLabel});setHistory(h=>({...h,drafts:[...(h?.drafts||[]).filter(r=>r.id!==saved.id),saved]}));setMessage(draft.kind==='product-list'?'Added to this project’s product list.':'Draft saved. It has not been sent or released.');}catch(e){setError(e.message)}finally{setBusy(false)}}
 async function saveRequest(row){
  setBusy(true);setError('');setMessage('');
  try{
   const saved=await request('saveProductWorkflowDraft',{...row,expectedVersion:row.version||''},'POST',90000);
   setHistory(current=>({...current,drafts:[...(current?.drafts||[]).filter(record=>record.id!==saved.id),saved]}));
   setMessage(saved.status==='contact'?'Partner details saved.':saved.status==='closed'?'Request closed with result.':'Request saved.');
   return saved;
  }catch(e){setError(e.message);}
  finally{setBusy(false);}
 }
 async function edit(value){
  setBusy(true);setError('');
  try{await onEdit(value);setView(view==='family-edit'?'product':'sheet');setMessage('Product details saved to Product Database.');}
  catch(e){setError(e.message);}
  finally{setBusy(false);}
 }
 async function remove(){
  if(!window.confirm(`Delete ${product.brand} · ${article} from Product Database? It will be removed from assessments that use this fitting type.`))return;
  setBusy(true);setError('');
  try{await onDelete();}
  catch(e){setError(e.message);}
  finally{setBusy(false);}
 }
 const editing=view==='edit'||view==='family-edit';
 const cornerActions=(
   <div className="assessment-corner-actions" aria-label="Product actions">
    {!editing&&canEdit&&onEdit&&<button type="button" disabled={busy} onClick={()=>{setMessage('');setError('');setView(view==='product'?'family-edit':'edit')}}><Pencil size={14}/>Edit</button>}
    {!editing&&canEdit&&onDelete&&<button type="button" className="assessment-delete-product" disabled={busy} onClick={remove}><Trash2 size={14}/>Delete</button>}
    <button type="button" aria-label="Close product" title="Close" disabled={busy} onClick={onClose}><X size={18}/></button>
   </div>
 );
 return <div className="assessment-modal" role="dialog" aria-modal="true" aria-label={`${product.brand} ${article} product preview`}><div className="assessment-preview">
  <header className="assessment-preview-header">
   <div><small>{group.code} · {group.quantity} {group.unit}</small><h2>{product.brand} · {article}</h2></div>
   {view!=='sheet'&&cornerActions}
  </header>
  {!editing&&<nav className="assessment-preview-tabs" aria-label="Product preview sections">{[['sheet','Spec sheet'],['product','Family view'],['brand','Partner history']].map(([key,label])=><button type="button" key={key} disabled={busy} aria-pressed={view===key} onClick={()=>setView(key)}>{label}</button>)}</nav>}
  {error&&<p role="alert" className="assessment-error">{error}</p>}{message&&<p role="status">{message}</p>}
  {view==='edit'&&canEdit&&<ProductForm key={product.id} product={product} fitting={fitting} brands={[]} busy={busy} onUpload={onUpload} onAi={onAi} onCancel={()=>setView('sheet')} onSave={edit}/>}
  {view==='family-edit'&&canEdit&&<ProductFamilyEditor key={product.id} product={product} busy={busy} onCancel={()=>setView('product')} onSave={edit}/>}
  {view==='product'&&<ProductFamily product={product} catalogue={catalogue}/>}
  {view==='sheet'&&<ProductSpecSheet product={product} fitting={fitting} initialContext={context} review={review} onReview={canEdit?onReview:undefined} catalogue={catalogue} compact cornerActions={cornerActions} renderSheetActions={printPdf=><nav className="assessment-sheet-rail" aria-label="Spec sheet actions">
   {actions.map(([key,Icon,label])=>{
    const content=<><Icon size={19} aria-hidden="true"/><span>{label}</span></>;
    if(key==='datasheet'&&url)return <a key={key} href={url} target="_blank" rel="noopener noreferrer">{content}</a>;
    return <button key={key} type="button" disabled={busy||(!['datasheet','contact'].includes(key)&&!canEdit)} onClick={key==='datasheet'?printPdf:()=>start(key)}>{content}</button>;
   })}
   <div className="assessment-document-status">
    <strong>Manufacturer documents</strong>
    <ul>{documents.map(([label,link])=><li key={label}>{link
     ?<a href={link} target="_blank" rel="noopener noreferrer" aria-label={label+' received, view document'}><FileCheck size={17} aria-hidden="true"/><span>{label}<small>Received</small></span></a>
     :<button type="button" disabled={busy||!canEdit} aria-label={'Draft request for '+label} onClick={()=>draftDocumentRequest(label)}><FileQuestion size={17} aria-hidden="true"/><span>{label}<small>Missing</small></span></button>}
    </li>)}</ul>
   </div>
  </nav>}/>}
  {view==='brand'&&(history||!error)&&<PartnerHistory history={history} product={product} fitting={fitting} group={group} context={context} projectId={projectId} canEdit={canEdit} request={request} onSaved={record=>setHistory(h=>({...h,records:[record,...(h.records||[]).filter(r=>r.id!==record.id)]}))} onOpenDraft={r=>{setDraft(r);setView(['sample','mockup','purchase-order'].includes(r.kind)||r.status==='contact'?r.kind:'action');setMessage('')}}/>}
  {['sample','mockup','purchase-order'].includes(view)&&<ProductRequestTable key={view} kind={view} records={history?.drafts||[]} product={product} fitting={fitting} group={group} context={context} projectId={projectId} busy={busy} onSave={saveRequest} onBack={()=>setView('sheet')}/>}
  {view==='contact'&&<PartnerContactCard record={[...(history?.drafts||[])].filter(row=>row.kind==='contact').sort((a,b)=>Number(!!b.partnerDetails)-Number(!!a.partnerDetails)||String(b.updatedAt).localeCompare(String(a.updatedAt)))[0]} product={product} fitting={fitting} group={group} projectId={projectId} busy={busy} canEdit={canEdit} onSave={saveRequest} onBack={()=>setView('sheet')}/>}
  {view==='action'&&draft&&<form className="assessment-request-form" onSubmit={save}><h3>{draft.documentLabel?'Request '+draft.documentLabel:actions.find(a=>a[0]===draft.kind)?.[2]}</h3><p>{draft.kind==='product-list'?'Save this product to the project product list.':'Prepare and save a draft. Email delivery, supplier notifications and PO release are not connected yet.'}</p><div className="assessment-request-fields">{[['partner','Supplier / partner'],['contact','Manufacturer contact / email']].map(([key,label])=><label key={key}>{label}<input maxLength={300} value={draft[key]} onChange={e=>setDraft(d=>({...d,[key]:e.target.value}))}/></label>)}{draft.kind==='purchase-order'&&<><label>Negotiated unit price ({draft.currency})<input type="number" min="0" max="100000000" step="any" value={draft.rate} onChange={e=>setDraft(d=>({...d,rate:e.target.value}))}/></label><label>Billing details<textarea maxLength={2000} value={draft.billing} onChange={e=>setDraft(d=>({...d,billing:e.target.value}))}/></label></>}</div><label>{draft.kind==='mockup'?'Mockup area, date and requirements':'Message / requirements'}<textarea rows={4} maxLength={4000} value={draft.notes} onChange={e=>setDraft(d=>({...d,notes:e.target.value}))}/></label><button type="submit" disabled={!canEdit||busy}>{busy?'Saving…':draft.kind==='product-list'?'Save to product list':'Save draft'}</button><button type="button" onClick={()=>setView('sheet')}>Back to spec sheet</button></form>}
 </div></div>;
}
