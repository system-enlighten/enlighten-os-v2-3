import React,{useEffect,useMemo,useState} from 'react';
import {linearCatalogue,filterLinearGroups,linearApplications,catalogueLinearGroups} from './linear-lineup.mjs';
import './LinearLightLineup.css';
import ProductSpecSheet from './ProductSpecSheet.jsx';
import {productDimensions} from './spec-sheet.mjs';
export default function LinearLightLineup({database,catalogue,onAddProduct,request,admin=false}){
 const [spec,setSpec]=useState(null);
 const [links,setLinks]=useState([]),[addGroup,setAddGroup]=useState(null),[existing,setExisting]=useState(''),[target,setTarget]=useState('');
 useEffect(()=>{let live=true;request('listLinearProductLinks',{},'POST',90000).then(rows=>{if(live)setLinks(rows)}).catch(e=>{if(live)setError(e.message)});return()=>{live=false}},[request]);
 const [source,setSource]=useState(null),[error,setError]=useState(''),[application,setApplication]=useState(''),[query,setQuery]=useState(''),[captions,setCaptions]=useState({}),[editing,setEditing]=useState(null),[saving,setSaving]=useState(false),[captionError,setCaptionError]=useState('');
 useEffect(()=>{let live=true;fetch('/technical-library/linear/lineup.json').then(r=>{if(!r.ok)throw Error('Linear light applications could not load.');return r.json()}).then(d=>{if(live)setSource(d)}).catch(e=>{if(live)setError(e.message)});return()=>{live=false}},[]);
 useEffect(()=>{let live=true;request('getLinearApplicationCaptions',{},'POST',90000).then(rows=>{if(live)setCaptions(Object.fromEntries(rows.map(r=>[r.applicationId,r.caption])))}).catch(e=>{if(live)setError(e.message)});return()=>{live=false}},[request]);
 const groups=useMemo(()=>{
  const original=source?.groups||[];
  const sizes=new Map();
  for(const section of catalogue?.sections||[]){if(section.codeRow-1<=section.photoRow)continue;for(const [column,cell] of (catalogue.rows[section.codeRow]||[]).entries()){const fitting=database.find(f=>f.id===cell.fittingId);const size=catalogue.rows[section.codeRow-1]?.[column]?.text;if(fitting&&size)sizes.set(fitting.fittingType,size)}}
  const enriched=original.map(g=>({...g,products:g.products.map(p=>({...p,note:sizes.get(p.code)||p.note}))}));
  return linearCatalogue([...enriched,...catalogueLinearGroups(catalogue,database,original)],database);
 },[source,database,catalogue]);
 const allProducts=database.flatMap(fitting=>(fitting.products||[]).map(product=>({fitting,product})));
 const groupCode=g=>{const original=groups.find(row=>row.id===g.id)||g;const codes=[...new Set(original.products.map(p=>p.code))];return codes.length===1&&groups.filter(row=>row.products.some(p=>p.code===codes[0])).length===1?codes[0]:g.id.toUpperCase()};
 const applications=useMemo(()=>linearApplications(groups,captions),[groups,captions]);
 const selected=applications.find(a=>a.id===application);
 async function saveCaption(e){e.preventDefault();setSaving(true);setCaptionError('');try{const result=await request('saveLinearApplicationCaption',{applicationId:editing.id,caption:editing.caption,expectedCaption:captions[editing.id]??''},'POST',90000);setCaptions(c=>({...c,[result.applicationId]:result.caption}));setEditing(null)}catch(err){setCaptionError(err.message)}finally{setSaving(false)}}
 const shown=useMemo(()=>filterLinearGroups(groups.map(g=>({...g,label:[g.label,...applications.filter(a=>a.groupId===g.id).map(a=>a.caption)].join(' ')})),{application:selected?.groupId||'',query}),[groups,applications,selected?.groupId,query]);
 if(!source)return error?<p role="alert">{error}</p>:<p role="status">Loading linear light applications…</p>;
 if(spec)return <ProductSpecSheet product={spec.product} fitting={spec.fitting} onClose={()=>setSpec(null)}/>;
 return <section className="linear-lineup" aria-label="Linear lights by application">{error&&<p role="alert">{error}</p>}<header><h2>Linear lights · Applications</h2><p>Select an application illustration to view its product options.</p></header><div className="linear-filters"><label>Application<select value={application} onChange={e=>setApplication(e.target.value)}><option value="">All applications</option>{applications.map((a,i)=><option key={a.id} value={a.id}>{a.caption||`Application ${i+1}`}</option>)}</select></label><label>Search<input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Product code, optics or brand"/></label><button type="button" onClick={()=>{setApplication('');setQuery('')}}>Clear filters</button></div><div className="linear-application-picker" aria-label="Application illustrations"><button type="button" aria-pressed={!application} onClick={()=>setApplication('')}>All applications</button>{applications.map((a,i)=><button key={a.id} type="button" aria-pressed={application===a.id} onClick={()=>setApplication(application===a.id?'':a.id)}><img src={a.url} alt=""/><span>{a.caption||`Application ${i+1}`}</span></button>)}</div><p role="status">{shown.length} application groups · {shown.reduce((n,g)=>n+g.products.reduce((count,p)=>count+(p.fitting?.products||[]).length,0),0)} manufacturer products</p><div className="linear-lineup-scroll"><table><thead><tr><th scope="col">Applications</th><th scope="col">Products</th></tr></thead><tbody>{shown.map(g=><tr key={g.id}>
 <td className="linear-application-cell"><div className="linear-application-options">
 {applications.filter(a=>a.groupId===g.id).map(a=><button key={a.id} type="button" onClick={()=>{setEditing({...a});setCaptionError('')}}>
  <img src={a.url} loading="lazy" alt=""/><strong>{a.caption||g.label||'Application'}</strong>
  </button>)}
 {g.applications.length>0&&<small style={{flexBasis:'100%',textAlign:'right'}}>{groupCode(g)}</small>}
 {!g.applications.length&&<div><strong>{g.label||'Application'}</strong><small>{groupCode(g)}</small></div>}
 </div></td>
 <td><div className="linear-products">{g.products.map((p,j)=>{
  const fitting=p.fitting;
  const reference=p.image||fitting?.thumbnailUrl;
  const options=(fitting?.products||[]);
  return <div className="linear-manufacturer-options" key={p.code+':'+j}>
   {reference&&<article className="linear-product-tile"><img src={reference} alt="Default product reference" loading="lazy"/>{p.note&&<small>{p.note}</small>}</article>}
   {options.map(product=><article className="linear-product-tile" key={product.id}><button type="button" onClick={()=>setSpec({product,fitting})}>
    {product.imageUrl&&<img src={product.imageUrl} alt="" loading="lazy"/>}
    <strong>{product.brand} {product.model||product.specs?.article}</strong>
    <small>{productDimensions(product.specs||{})}</small>
   </button></article>)}

  </div>;
 })}{links.filter(l=>l.applicationId===g.id).map(l=>{const item=allProducts.find(x=>x.fitting.id===l.fittingId&&x.product.id===l.productId);if(!item||g.products.some(p=>p.fitting?.id===l.fittingId))return null;return <article className="linear-product-tile" key={l.fittingId+':'+l.productId}><button type="button" onClick={()=>setSpec(item)}>{item.product.imageUrl&&<img src={item.product.imageUrl} alt=""/>}<strong>{item.product.brand} {item.product.model}</strong><small>{productDimensions(item.product.specs||{})}</small></button></article>})}{admin&&<button type="button" className="linear-add-product" aria-label="Add manufacturer product" onClick={()=>{setAddGroup(g);setTarget(g.products.find(p=>p.fitting)?.fitting.id||'');setExisting('')}}>+</button>}</div></td>
 </tr>)}</tbody></table></div>{!shown.length&&<p>No products match these filters.</p>}<small>Reference: {source.sourceSheet}. Product codes and application groupings are preserved from the Numbers sheet.</small>{addGroup&&<div className="linear-caption-overlay"><form role="dialog" aria-modal="true" aria-label="Add manufacturer product" onSubmit={async e=>{e.preventDefault();const item=allProducts[Number(existing)];if(!item)return;try{const link=await request('saveLinearProductLink',{applicationId:addGroup.id,fittingId:item.fitting.id,productId:item.product.id},'POST',90000);setLinks(old=>[...old.filter(l=>!(l.applicationId===link.applicationId&&l.fittingId===link.fittingId&&l.productId===link.productId)),link]);setAddGroup(null)}catch(err){setError(err.message)}}}><h3>Add manufacturer product</h3><label>Link existing product<select value={existing} onChange={e=>setExisting(e.target.value)}><option value="">Choose product</option>{allProducts.map((x,i)=><option key={i} value={String(i)}>{x.product.brand} {x.product.model} · {x.fitting.fittingType}</option>)}</select></label><button disabled={!existing}>Link existing product</button><label>Add new product for<select value={target} onChange={e=>setTarget(e.target.value)}><option value="">Choose fitting</option>{addGroup.products.filter(p=>p.fitting).map(p=><option key={p.fitting.id} value={p.fitting.id}>{p.code}</option>)}</select></label><button type="button" disabled={!target} onClick={()=>{setAddGroup(null);onAddProduct(target)}}>Add new product</button><button type="button" onClick={()=>setAddGroup(null)}>Cancel</button></form></div>}
{editing&&<div className="linear-caption-overlay" onKeyDown={e=>{if(e.key==='Escape'&&!saving)setEditing(null)}}><form role="dialog" aria-modal="true" aria-label="Application caption" onSubmit={saveCaption}><button type="button" className="linear-caption-close" aria-label="Close application" disabled={saving} onClick={()=>setEditing(null)}>×</button><img src={editing.url} alt="Application illustration"/><label>Application caption<input autoFocus maxLength={200} readOnly={!admin} value={editing.caption||''} onChange={e=>setEditing(a=>({...a,caption:e.target.value}))}/></label>{captionError&&<p role="alert">{captionError}</p>}{admin&&<button type="submit" disabled={saving}>{saving?'Saving…':'Save caption'}</button>}</form></div>}</section>
}
