import React,{useEffect,useMemo,useState} from 'react';
import {linearCatalogue,filterLinearGroups,linearApplications,catalogueLinearGroups} from './linear-lineup.mjs';
import './LinearLightLineup.css';
import ProductSpecSheet from './ProductSpecSheet.jsx';
import {productDimensions} from './spec-sheet.mjs';
export default function LinearLightLineup({database,catalogue,onAddProduct,request,admin=false}){
 const [spec,setSpec]=useState(null);
 const [source,setSource]=useState(null),[error,setError]=useState(''),[application,setApplication]=useState(''),[query,setQuery]=useState(''),[brand,setBrand]=useState(''),[captions,setCaptions]=useState({}),[editing,setEditing]=useState(null),[saving,setSaving]=useState(false),[captionError,setCaptionError]=useState('');
 useEffect(()=>{let live=true;fetch('/technical-library/linear/lineup.json').then(r=>{if(!r.ok)throw Error('Linear light applications could not load.');return r.json()}).then(d=>{if(live)setSource(d)}).catch(e=>{if(live)setError(e.message)});return()=>{live=false}},[]);
 useEffect(()=>{let live=true;request('getLinearApplicationCaptions',{},'POST',90000).then(rows=>{if(live)setCaptions(Object.fromEntries(rows.map(r=>[r.applicationId,r.caption])))}).catch(e=>{if(live)setError(e.message)});return()=>{live=false}},[request]);
 const groups=useMemo(()=>{
  const original=source?.groups||[];
  return linearCatalogue([...original,...catalogueLinearGroups(catalogue,database,original)],database);
 },[source,database,catalogue]);
 const applications=useMemo(()=>linearApplications(groups,captions),[groups,captions]);
 const selected=applications.find(a=>a.id===application);
 async function saveCaption(e){e.preventDefault();setSaving(true);setCaptionError('');try{const result=await request('saveLinearApplicationCaption',{applicationId:editing.id,caption:editing.caption,expectedCaption:captions[editing.id]??''},'POST',90000);setCaptions(c=>({...c,[result.applicationId]:result.caption}));setEditing(null)}catch(err){setCaptionError(err.message)}finally{setSaving(false)}}
 const brands=useMemo(()=>[...new Set(groups.flatMap(g=>g.products.flatMap(p=>(p.fitting?.products||[]).map(b=>b.brand))).filter(Boolean))].sort(),[groups]);
 const shown=useMemo(()=>filterLinearGroups(groups.map(g=>({...g,label:[g.label,...applications.filter(a=>a.groupId===g.id).map(a=>a.caption)].join(' ')})),{application:selected?.groupId||'',query,brand}),[groups,applications,selected?.groupId,query,brand]);
 if(!source)return error?<p role="alert">{error}</p>:<p role="status">Loading linear light applications…</p>;
 if(spec)return <ProductSpecSheet product={spec.product} fitting={spec.fitting} onClose={()=>setSpec(null)}/>;
 return <section className="linear-lineup" aria-label="Linear lights by application">{error&&<p role="alert">{error}</p>}<header><h2>Linear lights · Applications</h2><p>Select an application illustration to view its product options.</p></header><div className="linear-filters"><label>Application<select value={application} onChange={e=>setApplication(e.target.value)}><option value="">All applications</option>{applications.map((a,i)=><option key={a.id} value={a.id}>{a.caption||`Application ${i+1}`}</option>)}</select></label><label>Brand<select value={brand} onChange={e=>setBrand(e.target.value)}><option value="">All brands</option>{brands.map(b=><option key={b}>{b}</option>)}</select></label><label>Search<input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Product code, optics or brand"/></label><button type="button" onClick={()=>{setApplication('');setBrand('');setQuery('')}}>Clear filters</button></div><div className="linear-application-picker" aria-label="Application illustrations"><button type="button" aria-pressed={!application} onClick={()=>setApplication('')}>All applications</button>{applications.map((a,i)=><button key={a.id} type="button" aria-pressed={application===a.id} onClick={()=>setApplication(application===a.id?'':a.id)}><img src={a.url} alt=""/><span>{a.caption||`Application ${i+1}`}</span></button>)}</div><p role="status">{shown.length} application groups · {shown.reduce((n,g)=>n+g.products.reduce((count,p)=>count+(p.fitting?.products||[]).filter(product=>!brand||product.brand===brand).length,0),0)} manufacturer products</p><div className="linear-lineup-scroll"><table><thead><tr><th scope="col">Applications</th><th scope="col">Products</th></tr></thead><tbody>{shown.map(g=><tr key={g.id}>
 <td className="linear-application-cell"><div className="linear-application-options">
 {applications.filter(a=>a.groupId===g.id).map(a=><button key={a.id} type="button" onClick={()=>{setEditing({...a});setCaptionError('')}}>
  <img src={a.url} loading="lazy" alt=""/><strong>{a.caption||g.label||'Application'}</strong>
  <small>{[...new Set(g.products.map(p=>p.code))].join(' · ')}</small>
 </button>)}
 {!g.applications.length&&<div><strong>{g.label||'Application'}</strong><small>{g.products.map(p=>p.code).join(' · ')}</small></div>}
 </div></td>
 <td><div className="linear-products">{g.products.map((p,j)=>{
  const fitting=p.fitting;
  const reference=p.image||fitting?.thumbnailUrl;
  const options=(fitting?.products||[]).filter(product=>!brand||product.brand===brand);
  return <div className="linear-manufacturer-options" key={p.code+':'+j}>
   {reference&&<article className="linear-product-tile"><img src={reference} alt="Default product reference" loading="lazy"/>{p.note&&<small>{p.note}</small>}</article>}
   {options.map(product=><article className="linear-product-tile" key={product.id}><button type="button" onClick={()=>setSpec({product,fitting})}>
    {product.imageUrl&&<img src={product.imageUrl} alt="" loading="lazy"/>}
    <strong>{product.brand} {product.model||product.specs?.article}</strong>
    <small>{productDimensions(product.specs||{})}</small>
   </button></article>)}
   {admin&&fitting&&<button type="button" className="linear-add-product" aria-label={`Add manufacturer product for ${p.code}`} title={`Add manufacturer product for ${p.code}`} onClick={()=>onAddProduct(fitting.id)}>+</button>}
  </div>;
 })}</div></td>
 </tr>)}</tbody></table></div>{!shown.length&&<p>No products match these filters.</p>}<small>Reference: {source.sourceSheet}. Product codes and application groupings are preserved from the Numbers sheet.</small>{editing&&<div className="linear-caption-overlay" onKeyDown={e=>{if(e.key==='Escape'&&!saving)setEditing(null)}}><form role="dialog" aria-modal="true" aria-label="Application caption" onSubmit={saveCaption}><button type="button" className="linear-caption-close" aria-label="Close application" disabled={saving} onClick={()=>setEditing(null)}>×</button><img src={editing.url} alt="Application illustration"/><label>Application caption<input autoFocus maxLength={200} readOnly={!admin} value={editing.caption||''} onChange={e=>setEditing(a=>({...a,caption:e.target.value}))}/></label>{captionError&&<p role="alert">{captionError}</p>}{admin&&<button type="submit" disabled={saving}>{saving?'Saving…':'Save caption'}</button>}</form></div>}</section>
}
