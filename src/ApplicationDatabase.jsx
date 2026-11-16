import React,{useState,useEffect,useRef} from 'react';
import {loadApplications,applicationCategories,applicationMatches} from './application-library.js';
import './ApplicationDatabase.css';
export default function ApplicationDatabase({state,request,onOpenFitting}){
 const [rows,setRows]=useState([]),[fittings,setFittings]=useState([]),[draft,setDraft]=useState(null),[error,setError]=useState(''),[busy,setBusy]=useState(false),[query,setQuery]=useState(''),[filter,setFilter]=useState(''),[selected,setSelected]=useState(null),[limit,setLimit]=useState(36);
 useEffect(()=>{let active=true;loadApplications(request).then(r=>{if(active){setRows(r.records);setError(r.warning)}}).catch(e=>{if(active)setError(e.message)});Promise.all([fetch('/technical-library/database.json').then(r=>r.json()),request('listTechnicalFittings',{},'GET',90000)]).then(([seed,overrides])=>{const map=new Map(seed.fittings.map(f=>[f.id,f]));overrides.forEach(f=>map.set(f.id,f));if(active)setFittings([...map.values()])}).catch(e=>{if(active)setError(e.message)});return()=>{active=false}},[]);
 const categories=[...new Set(fittings.map(f=>f.category).filter(Boolean))].sort();const admin=String(state.currentUser?.appAccess).toLowerCase()==='admin';
 const save=async e=>{e.preventDefault();setBusy(true);setError('');try{const r=await request('saveApplicationImage',{record:draft},'POST',90000);setRows(a=>a.map(v=>v.id===r.id?{...v,...r}:v).some(v=>v.id===r.id)?a.map(v=>v.id===r.id?{...v,...r}:v):[...a,r]);setDraft(null)}catch(e){setError(e.message)}finally{setBusy(false)}};
 const shown=rows.filter(r=>(filter==='unassigned'?!r.category&&!r.fittingType:!filter||applicationCategories(r).includes(filter))&&[r.title,r.category,r.fittingType].join(' ').toLowerCase().includes(query.toLowerCase()));const current=rows.find(r=>r.id===selected),linked=current?fittings.filter(f=>applicationMatches(current,f)):[];
 const [view,setView]=useState('gallery');
 const detailRef=useRef(null);
 const formRef=useRef(null);
 useEffect(()=>{
   if(selected!==null)detailRef.current?.focus();
 },[selected]);
 useEffect(()=>{
   if(draft)formRef.current?.querySelector('input')?.focus();
 },[Boolean(draft)]);
 const edit=record=>{setSelected(null);setDraft({...record});};
 return <section className="application-library">
   <header className="wih-workspace wih-register-head application-library-header">
     <h1 className="studio-page-heading">Application Database</h1>
     <p className="wih-intro">Browse lighting effects and the fittings behind them.</p>
   </header>
   {error&&<p role="alert">{error}</p>}
   <div className="application-toolbar">
     <input type="search" aria-label="Search application images" placeholder="Search effects or categories" value={query} onChange={e=>{setQuery(e.target.value);setLimit(36);}}/>
     <select aria-label="Filter application category" value={filter} onChange={e=>{setFilter(e.target.value);setLimit(36);}}>
       <option value="">All categories</option><option value="unassigned">Needs category link</option>
       {categories.map(category=><option key={category}>{category}</option>)}
     </select>
     <div className="application-view-switch" role="group" aria-label="Application layout">
       {['gallery','list'].map(layout=><button key={layout} type="button" aria-pressed={view===layout} onClick={()=>setView(layout)}>{layout==='gallery'?'Gallery':'List'}</button>)}
     </div>
     {admin&&<button type="button" onClick={()=>edit({id:'application-'+Date.now(),title:'',category:'',fittingType:'',imageUrl:'',notes:''})}>Add application image</button>}
   </div>
   {draft&&<form className="product-form" ref={formRef} onSubmit={save}><div className="product-fields">{[['title','Application / effect name'],['fittingType','Exact fitting code (optional)'],['imageUrl','Image URL'],['notes','Notes']].map(([k,l])=><label key={k}>{l}<input required={['title','imageUrl'].includes(k)} type={k==='imageUrl'&&!draft.imageUrl?.startsWith('/')?'url':'text'} value={draft[k]} onChange={e=>setDraft(d=>({...d,[k]:e.target.value}))}/></label>)}</div><fieldset><legend>Products that create this effect</legend><p>Select all applicable categories. An exact fitting code narrows the link to that fitting.</p><div className="product-choices">{categories.map(c=><label key={c}><input type="checkbox" checked={applicationCategories(draft).includes(c)} onChange={e=>setDraft(d=>({...d,category:(e.target.checked?[...applicationCategories(d),c]:applicationCategories(d).filter(v=>v!==c)).join(' || ')}))}/>{c}</label>)}</div></fieldset><div className="product-actions"><button disabled={busy} type="submit">Save links</button><button disabled={busy} type="button" onClick={()=>setDraft(null)}>Cancel</button></div></form>}
   {current&&<article className="application-detail" ref={detailRef} tabIndex={-1} aria-label={current.title}>
     <img src={current.imageUrl} alt={current.title}/>
     <div>
       <div className="application-actions">
         <button type="button" onClick={()=>setSelected(null)}>Close</button>
         {admin&&<button type="button" onClick={()=>edit(current)}>Edit links</button>}
       </div>
       <h2>{current.title}</h2>
       {current.notes&&<p>{current.notes}</p>}
       <h3>Products for this effect</h3>
       {!linked.length&&<p>No linked products found.</p>}
       <div className="product-brand-tiles">
         {linked.map(f=><button key={f.id} type="button" onClick={()=>onOpenFitting(f.id)}>{f.iconUrl&&<img src={f.iconUrl} alt=""/>}{f.fittingType}<small style={{display:'block'}}>{f.category}</small></button>)}
       </div>
     </div>
   </article>}
   <p className="application-count" role="status">{shown.length} {shown.length===1?'reference':'references'}</p>
   <ul className="application-references" data-view={view}>
     {shown.slice(0,limit).map(record=><li key={record.id} className="application-reference">
       <button type="button" className="application-photo" aria-label={'View products for '+record.title} onClick={()=>setSelected(record.id)}>
         <img loading="lazy" src={record.imageUrl} alt=""/>
       </button>
       <div className="application-caption">
         <p className="application-caption-title">{record.title}</p>
         <p>{applicationCategories(record).join(' · ')||record.fittingType||'Needs category link'}</p>
       </div>
       <div className="application-actions">
         <button type="button" onClick={()=>setSelected(record.id)}>View products</button>
         {admin&&<button type="button" onClick={()=>edit(record)}>Edit links</button>}
       </div>
     </li>)}
   </ul>
   {shown.length>limit&&<button type="button" onClick={()=>setLimit(v=>v+36)}>Show more references</button>}
 </section>;
}
