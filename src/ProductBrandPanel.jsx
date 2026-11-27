import ManufacturerFamilyEditor from './ManufacturerFamilyEditor.jsx';
import ProductComparison,{ratingCriteria} from './ProductComparison.jsx';
import {CatalogueSpecEditor as ProductForm} from './CatalogueSpecEditor.jsx';
import {ProductOverview} from './ProductDetails.jsx';
import './ProductDetails.css';
import './ProductDialog.css';
import React,{useEffect,useState} from 'react';
export default function ProductBrandPanel({fitting,admin,onClose,onSave,onEditFitting,renderImage,onUpload,onAi,brands=[],application,applications,request,startAdding=false,startProductId='',linearContext=null,catalogueTheme=false}){
 const [tab,setTab]=useState('products'),[draft,setDraft]=useState(()=>{if(startProductId){const existing=(fitting.products||[]).find(p=>p.id===startProductId);if(existing)return {...existing};}return startAdding?{id:'product-'+Date.now()+'-'+Math.random().toString(36).slice(2,8),brand:'',model:'',imageUrl:'',notes:'',rating:0,...(linearContext?{linearApplicationIds:linearContext.selected}:{})}:null;}),[busy,setBusy]=useState(false),[error,setError]=useState(''),[view,setView]=useState(null);
 const [familyMode,setFamilyMode]=useState(false),[entryLevel,setEntryLevel]=useState(''),[parentId,setParentId]=useState('');
 const [choosing,setChoosing]=useState(false),[query,setQuery]=useState(''),[history,setHistory]=useState({rows:[],loading:false,error:''});
 useEffect(()=>{
  if(tab!=='ratings'||!request||!fitting.products?.length)return;
  let active=true;
  setHistory({rows:[],loading:true,error:''});
  request('listProductAssessmentReviews',{fittingId:fitting.id},'POST',90000)
   .then(rows=>{if(active)setHistory({rows,loading:false,error:''});})
   .catch(e=>{if(active)setHistory({rows:[],loading:false,error:e.message});});
  return()=>{active=false;};
 },[tab,request,fitting.id,fitting.products]);
 async function chooseApplication(record){
  setBusy(true);setError('');
  try{await onSave({...fitting,applicationImageId:String(record.id)});setChoosing(false);}
  catch(e){setError(e.message);}
  finally{setBusy(false);}
 }
 const matchingApplications=(applications||[]).filter(a=>a.imageUrl&&[a.title,a.category,a.fittingType].join(' ').toLowerCase().includes(query.trim().toLowerCase()));
 const products=[...(fitting.products||[])].sort((a,b)=>Number(b.id===fitting.preferredProductId)-Number(a.id===fitting.preferredProductId));
 const button={padding:'8px 12px',border:'1px solid #8c9dac',background:'#fff',color:'#102238',font:'inherit',cursor:'pointer'};
 const save=async(next,selection=fitting.preferredProductId||'')=>{setBusy(true);setError('');try{await onSave({...fitting,products:next,preferredProductId:selection});if(startProductId){onClose();return;}setView(catalogueTheme?null:next.find(v=>v.id===draft?.id)?.id||null);if(catalogueTheme&&draft){setTab('products');setEntryLevel('');setParentId('');setFamilyMode(false);}setDraft(null);}catch(e){setError(e.message);}finally{setBusy(false);}};
 const remove=product=>{
  if(!window.confirm(`Delete ${product.brand} · ${product.model} from Product Database? It will be removed from assessments that use this fitting type.`))return;
  return save(products.filter(p=>p.id!==product.id),fitting.preferredProductId===product.id?'':fitting.preferredProductId);
 };
 const isExistingDraft=Boolean(draft&&(fitting.products||[]).some(v=>v.id===draft.id));
 return <div role="dialog" aria-modal="true" aria-label={`Products for ${fitting.fittingType}`} className="product-dialog-overlay"><section className={"product-panel product-dialog"+(catalogueTheme?" catalogue-product-dialog":"")}><header className="product-dialog-header"><div><span className="product-dialog-eyebrow">Product comparison</span><h2>{fitting.fittingType}</h2><p>{fitting.category||'Luminaire products'}</p></div><button className="product-dialog-close" type="button" disabled={busy} onClick={onClose}>Close <span aria-hidden="true">×</span></button></header>{!draft&&<div className="product-dialog-tools"><div role="tablist" aria-label="Product comparison sections" className="product-dialog-tabs">{(catalogueTheme?[['products','Products'],['comparison','Comparison'],['ratings','Ratings']]:[['products','Products'],['ratings','Ratings']]).map(([id,label])=><button type="button" key={id} role="tab" aria-selected={tab===id} style={{...button,background:tab===id?'#102238':'#fff',color:tab===id?'#fff':'#102238'}} onClick={()=>{setTab(id);setView(null)}}>{label}</button>)}</div><div className="product-dialog-tool-actions">{admin&&onEditFitting&&!draft&&!view&&<button className="product-dialog-add" type="button" disabled={busy} onClick={onEditFitting}>Edit fitting code, icon &amp; image</button>}{admin&&tab==='products'&&!draft&&!view&&<button className="product-dialog-add" type="button" disabled={busy} onClick={()=>{setEntryLevel('');setFamilyMode(false);setDraft({id:'product-'+Date.now()+'-'+Math.random().toString(36).slice(2,8),brand:'',model:'',imageUrl:'',notes:'',rating:0,...(linearContext?{linearApplicationIds:linearContext.selected}:{})})}}>+ Add product</button>}</div></div>}{error&&<p role="alert">{error}</p>}{tab==='products'&&<>{draft&&<>{!entryLevel&&!isExistingDraft&&<section className="manufacturer-family-editor"><h2>Is it a family, product or variant?</h2><div className="family-level-strip family-entry-choices">{[['family','Family'],['product','Product'],['variant','Variant']].map(([id,label])=><button type="button" key={id} onClick={()=>{setEntryLevel(id);setFamilyMode(true);setParentId('')}}>{label}</button>)}</div></section>}{entryLevel&&entryLevel!=='family'&&!isExistingDraft&&<div className="manufacturer-family-editor family-link-choice"><label>{entryLevel==='product'?'Select family (optional)':'Link to existing product or family (optional)'}<select value={parentId} onChange={e=>setParentId(e.target.value)}><option value="">{entryLevel==='product'?'Standalone product':'Standalone variant'}</option>{products.filter(p=>p.recordKind!=='variant'&&(entryLevel==='variant'||p.specs?.manufacturerFamily?.level==='family')).map(p=><option key={p.id} value={p.id}>{p.brand} · {p.family||p.model}</option>)}</select></label><button type="button" disabled={!parentId} onClick={()=>setDraft({...products.find(p=>p.id===parentId)})}>{entryLevel==='product'?'Open family':'Link existing'}</button><button type="button" onClick={()=>{setEntryLevel('');setParentId('')}}>Back</button></div>}{(entryLevel||isExistingDraft)&&<>{(entryLevel!=='variant'||isExistingDraft)&&draft.recordKind!=='variant'&&<div className="product-actions"><button type="button" onClick={()=>setFamilyMode(v=>!v)}>{familyMode||draft.specs?.manufacturerFamily?"Manufacturer family editor":"Switch to manufacturer family editor"}</button></div>}{(entryLevel!=='variant'||isExistingDraft)&&(familyMode||draft.specs?.manufacturerFamily)&&draft.recordKind!=='variant'?<ManufacturerFamilyEditor entryLevel={entryLevel||'family'} key={draft.id} product={draft} fitting={fitting} linearChoices={isExistingDraft&&!entryLevel?linearContext?.choices:null} busy={busy} onUpload={onUpload} onAi={onAi} onCancel={()=>startProductId?onClose():setDraft(null)} onSave={value=>save([...(fitting.products||[]).filter(v=>v.id!==value.id),value])}/>:<ProductForm linearChoices={isExistingDraft&&!entryLevel?linearContext?.choices:null} fitting={fitting} key={draft.id} product={draft} brands={brands} busy={busy} onAi={onAi} onUpload={onUpload} onCancel={()=>startProductId?onClose():setDraft(null)} onSave={value=>save([...(fitting.products||[]).filter(v=>v.id!==value.id),{...value,...((entryLevel==='variant'||draft.recordKind==='variant')?{recordKind:'variant'}:{})}])}/>}</>}</>}</>}{view&&!draft&&<ProductOverview fitting={fitting} product={products.find(v=>v.id===view)||{}} renderImage={renderImage} admin={admin} onBack={()=>setView(null)} onEdit={()=>{setTab('products');setEntryLevel('');setDraft({...products.find(v=>v.id===view)})}} onDelete={()=>remove(products.find(v=>v.id===view))}/>}{!view&&!draft&&(tab==='products'||tab==='comparison')&&<ProductComparison catalogueTheme={catalogueTheme} detailed={tab==='comparison'} fitting={fitting} products={products} admin={admin} busy={busy} renderImage={renderImage} application={application} onView={setView} onEdit={p=>{setTab('products');setEntryLevel('');setDraft({...p})}} onDelete={remove} onPreferred={id=>save(fitting.products||[],id)} onChooseApplication={admin&&applications?()=>{setQuery('');setChoosing(true)}:undefined}/>}{!view&&!draft&&tab==='ratings'&&!products.length&&<div className="product-dialog-empty-ratings">Ratings will appear after a brand product is added.</div>} {choosing&&<section className="comparison-image-picker" aria-label="Application Database">
  <header><input type="search" aria-label="Search application images" placeholder="Search application images" value={query} onChange={e=>setQuery(e.target.value)}/><button className="product-dialog-add" type="button" disabled={busy} onClick={()=>setChoosing(false)}>Cancel</button></header>
  {!matchingApplications.length&&<p>No application images found.</p>}
  <div className="comparison-image-options">
   {matchingApplications.map(a=><button key={a.id} type="button" disabled={busy} aria-label={a.title||a.fittingType||'Select application image'} aria-pressed={String(a.id)===String(application?.id)} onClick={()=>chooseApplication(a)}>
    <img src={a.imageUrl} alt="" loading="lazy"/>
   </button>)}
  </div>
 </section>}
 {!view&&!draft&&tab==='ratings'&&products.length>0&&<section className="comparison-review-list">
  {history.loading&&<p role="status">Loading project reviews…</p>}
  {history.error&&<p role="alert">{history.error}</p>}
  {products.map(p=>{
   const reviews=history.rows.filter(row=>row.productId===p.id);
   const ratings=[...ratingCriteria,['studio','Studio rating']];
   return <article key={p.id}>
    <h3>{p.brand} · {p.specs?.article||p.model}</h3>
    <div className="comparison-rating-grid">{ratings.map(([key,label])=>{
     const rating=(key==='studio'?p.rating:p.ratings?.[key])||0;
     return <div key={key}><span>{label}</span><span>{[1,2,3,4,5].map(n=><button type="button" key={n} disabled={!admin||busy} aria-label={label+' · '+n+' stars'} aria-pressed={n===rating} onClick={()=>save(products.map(v=>v.id!==p.id?v:key==='studio'?{...v,rating:n===rating?0:n}:{...v,ratings:{...v.ratings,[key]:n===rating?0:n}}))}>{n<=rating?'★':'☆'}</button>)}</span></div>;
    })}</div>
    <h4>Project reviews</h4>
    {reviews.map((review,index)=><div key={index} className="comparison-project-review">
     <strong>{review.project} · {review.fittingCode}</strong>
     {review.area&&<p>{review.area}</p>}
     {review.remarks&&<p>{review.remarks}</p>}
     {review.customization&&<p>{review.customization}</p>}
     {review.ratings.some(Boolean)&&<small>{ratingCriteria.map(([,label],i)=>review.ratings[i]?`${label} ${review.ratings[i]}/5`:'').filter(Boolean).join(' · ')}</small>}
    </div>)}
    {!reviews.length&&!history.loading&&!history.error&&<p>No saved reviews in your accessible projects.</p>}
   </article>;
  })}
 </section>}</section></div>;
}
