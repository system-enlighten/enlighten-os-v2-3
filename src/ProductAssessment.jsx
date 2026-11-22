import {useTechnicalBackgroundRefresh} from './useTechnicalBackgroundRefresh.js';
import {buildColumnTable} from './technical-column-logic.mjs';
import ProductTypeEditor from './ProductTypeEditor.jsx';
import ProductBrandPanel from './ProductBrandPanel.jsx';
import AssessmentProductPreview from './AssessmentProductPreview.jsx';
import React,{useEffect,useMemo,useRef,useState} from 'react';
import layout from './product-assessment-layout.json';
import icons from './technical-icon-map.json';
import fittedIcons from './catalogue-fitted-icons.json';
import {assessmentGroups,assessmentKey,optionTotal,ratingLabels,linkedAssessmentGroup} from './product-assessment.mjs';
import './ProductAssessment.css';
import './TechnicalDocumentation.css';
const money=n=>n===null?'':new Intl.NumberFormat('en-IN',{maximumFractionDigits:2}).format(n);
function Photo({media,projectId,request,effect=false}){
 const [url,setUrl]=useState(''),[error,setError]=useState(false);
 useEffect(()=>{let live=true;setError(false);setUrl(media.driveFileId?'':media.url);if(media.driveFileId)request('getTechnicalProjectImage',{projectId,fileId:media.driveFileId},'POST',90000).then(r=>live&&setUrl(r.url)).catch(()=>live&&setError(true));return()=>{live=false}},[media.url,media.driveFileId,projectId]);
 return error?<span>Image unavailable</span>:url?<img src={url} alt={media.label||(effect?'Design reference':'Product photograph')} style={effect?{width:'100%',height:'100%',objectFit:'cover',objectPosition:`${media.x??50}% ${media.y??50}%`,transform:`scale(${media.zoom||1})`,transformOrigin:`${media.x??50}% ${media.y??50}%`}:undefined} onError={()=>setError(true)}/>:<span>Loading photo…</span>;
}
export default function ProductAssessment({project,projectId,request,canEdit,onOpenProductTable,initialData=null,initialAssessment={groups:{},version:''},initialProducts=[]}){
 const [data,setData]=useState(initialData),[products,setProducts]=useState(initialProducts),[assessment,setAssessment]=useState(initialAssessment),[busy,setBusy]=useState(false),[dirty,setDirty]=useState(false),[error,setError]=useState(''),[fit,setFit]=useState(true),[width,setWidth]=useState(1200),[filter,setFilter]=useState(''),[review,setReview]=useState('all'),[revision,setRevision]=useState(0),[message,setMessage]=useState(''),[productEditor,setProductEditor]=useState(null),[specPreview,setSpecPreview]=useState(null),[missingType,setMissingType]=useState(null);
 const generation=useRef(0),host=useRef(null),dirtyRef=useRef(false);dirtyRef.current=dirty;
 useEffect(()=>{const observer=new ResizeObserver(e=>setWidth(e[0].contentRect.width));if(host.current)observer.observe(host.current);return()=>observer.disconnect()},[]);
 useEffect(()=>{const handler=e=>{if(dirtyRef.current){e.preventDefault();e.returnValue=''}};window.addEventListener('beforeunload',handler);return()=>window.removeEventListener('beforeunload',handler)},[]);
 useEffect(()=>{const n=++generation.current;setData(null);setAssessment({groups:{},version:''});setDirty(false);setProductEditor(null);setSpecPreview(null);setMissingType(null);setError('');setMessage('');setBusy(false);if(!projectId)return;setBusy(true);
  Promise.all([request('getTechnicalDocumentation',{projectId},'POST',90000),request('getProductAssessment',{projectId},'POST',90000),fetch('/technical-library/database.json').then(r=>{if(!r.ok)throw Error('Product Database could not load.');return r.json()}),request('listTechnicalFittings',{},'GET',90000),request('listFloorZones',{projectId},'POST',90000)]).then(([d,a,seed,updates,zones])=>{if(n!==generation.current)return;const all=new Map((seed.fittings||[]).map(p=>[p.id,p]));updates.forEach(p=>all.set(p.id,{...all.get(p.id),...p}));setData({...d,assessmentZones:zones});setProducts([...all.values()].filter(f=>!f.deleted));const loaded=assessmentGroups(d,[...all.values()].filter(f=>!f.deleted));setAssessment({...a,groups:{...a.groups,...Object.fromEntries(loaded.groups.filter(g=>a.groups[g.id]).map(g=>[g.id,linkedAssessmentGroup(g,a.groups[g.id])]))}})}).catch(e=>n===generation.current&&setError(e.message)).finally(()=>n===generation.current&&setBusy(false));return()=>{generation.current++};
 },[projectId,revision]);
 useTechnicalBackgroundRefresh({request,action:'getProductAssessment',projectId,enabled:!!data&&!busy&&!dirty&&!specPreview&&!productEditor&&!missingType,onUpdate:next=>setAssessment(current=>current.version===next.version?current:next)});
 const model=useMemo(()=>assessmentGroups(data||{},products),[data,products]);
 const savedGroup=g=>linkedAssessmentGroup(g,assessment.groups[g.id]);
 const groups=model.groups.filter(g=>{
  const matchesSearch=!filter||[g.code,g.type,...g.catalogOptions.map(o=>o.brand+' '+o.article)].join(' ').toLowerCase().includes(filter.toLowerCase());
  const matchesReview=review==='all'||(review==='missing'?!g.registered:review==='selected'?!!savedGroup(g).selectedId:!savedGroup(g).selectedId);
  return matchesSearch&&matchesReview;
 });
 const mutate=(g,fn)=>{setAssessment(a=>({...a,groups:{...a.groups,[g.id]:fn(linkedAssessmentGroup(g,a.groups[g.id]))}}));setDirty(true);setMessage('')};
 const change=(g,id,patch)=>mutate(g,old=>({...old,options:old.options.map(o=>o.id===id?{...o,...patch}:o)}));
 const choose=(g,o)=>{if(!o.brand.trim()||!o.article.trim()){setError('Enter the brand and article number before selecting a product.');return}setError('');mutate(g,old=>({...old,selectedId:old.selectedId===o.id?'':o.id}))};
 async function save(open=false){const n=generation.current;setBusy(true);setError('');try{const a=await request('saveProductAssessment',{projectId,groups:{...assessment.groups,...Object.fromEntries(model.groups.map(g=>[g.id,savedGroup(g)]))},expectedVersion:assessment.version},'POST',150000);if(n===generation.current){setAssessment(a);setDirty(false);setMessage('Product Assessment saved. Technical Table | Product is updated.');if(open)onOpenProductTable?.()}}catch(e){if(n===generation.current)setError(e.message)}finally{if(n===generation.current)setBusy(false)}}
 function openProducts(g){
  const fitting=products.find(p=>assessmentKey(p.fittingType,g.linear)===g.id);
  if(fitting)setProductEditor(fitting);
  else setMissingType({id:'fitting-'+crypto.randomUUID(),fittingType:g.code,category:g.type,products:[]});
 }
 async function saveCatalogue(fitting){
  const saved=await request('saveTechnicalFitting',{projectId,fitting,expectedCatalogVersion:fitting.catalogVersion||''},'POST',90000);
  setProducts(all=>[...all.filter(f=>f.id!==saved.id),saved]);
  return saved;
 }
 async function registerType(fitting){
  if(assessmentKey(fitting.fittingType,false)!==assessmentKey(missingType.fittingType,false))throw Error('Use the exact fitting code from the assessment row.');
  await saveCatalogue(fitting);
  setMissingType(null);
  setMessage('Fitting type added to Product Database. You can now add a manufacturer product.');
 }
 const renderImage=(url,label)=>url?<img src={icons[url]||url} alt={label} style={{maxWidth:150,maxHeight:120,objectFit:'contain'}}/>:null;
 const fittingAction=g=><div className="assessment-controls assessment-type-actions">
  {!g.registered&&<strong className="assessment-missing-code">Fitting code missing from Product Database</strong>}
  {canEdit&&<button type="button" className="assessment-fitting-action" disabled={busy} onClick={()=>openProducts(g)}>{g.registered?'+ Add manufacturer product':'Add fitting code to Product Database'}</button>}
 </div>;
 const uploadAsset=async file=>{if(file.size>3*1024*1024)throw Error('Use a file under 3 MB.');const base64=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result).split(',')[1]);reader.onerror=()=>reject(Error('Could not read file.'));reader.readAsDataURL(file)});return request('uploadTechnicalProductAsset',{projectId,name:file.name,mimeType:file.type,base64},'POST',120000)};
 const productFor=o=>{const fitting=products.find(f=>f.id===o.fittingId),product=fitting?.products?.find(p=>p.id===o.productId);return {fitting,product}};
 const technicalRows=useMemo(()=>buildColumnTable(data||{},data?.assessmentZones||[],products).rows,[data,products]);
 function openPreview(g,o,initialView='sheet'){const {product,fitting}=productFor(o);if(product){
 const indices=new Set(g.sourceIndices);
 const related=technicalRows.filter(row=>row.sourceIndices.some(i=>indices.has(i)));
 const unique=values=>[...new Set(values.filter(Boolean))].join(' · ');
 setSpecPreview({product,fitting,group:g,optionId:o.id,initialView,context:{
  project:project?.name||'',location:project?.city||project?.location||'',
  area:project?.area||project?.locality||unique(related.map(r=>r.zone?.area||r.zone?.room||r.zone?.areaName||r.zone?.name)),
  designIntent:unique(related.map(r=>r.application))
 }});
 }}
 function articleLink(g,o){return <button className="assessment-article" onClick={()=>openPreview(g,o)}>{o.article||'View product'}</button>;}

 const widths=layout.widths.map((w,i)=>i===0?Math.ceil(w*1.45):w);
 const totalWidth=widths.reduce((a,b)=>a+b,0),scale=fit?Math.max(.1,Math.min(1,(width-32)/(totalWidth*4/3))):1;
 const cell=(c,header=false)=>{const s=layout.cells[header?0:1][c];return {fontFamily:s.font.includes('Founders')?'TechnicalFounders':'TechnicalHelvetica',fontSize:s.size+'pt',fontWeight:s.bold?(s.font.includes('Founders')?600:700):400,color:s.color||'#000',background:header?'#bff81c':c>=10?s.background||'#909090':'#fff',textAlign:s.align||'center'}};
 const input=(g,o,field,label,numeric=false)=>numeric?<input type="number" min="0" max="100000000" step="any" aria-label={`${label} ${g.code} ${o.id}`} disabled={!canEdit||busy} value={o[field]} onChange={e=>{const v=e.target.value;if(v===''||Number(v)>=0&&Number(v)<=100000000)change(g,o.id,{[field]:v===''?'':Number(v)})}}/>:<textarea rows={1} aria-label={`${label} ${g.code} ${o.id}`} disabled={!canEdit||busy} value={o[field]} onChange={e=>change(g,o.id,{[field]:e.target.value})}/>;
 const selected=model.groups.filter(g=>savedGroup(g).selectedId).length;
 const grandTotal=model.groups.reduce((sum,g)=>{const s=savedGroup(g),o=s.options.find(o=>o.id===s.selectedId);return sum+(o?optionTotal(g,o)||0:0)},0);
 return <div className="product-assessment" ref={host}>
  {!projectId?<p>Select a project to compare products.</p>:<>{busy&&<p role="status">Loading or saving Product Assessment…</p>}{error&&<p role="alert" className="assessment-error">{error}</p>}{message&&<p role="status">{message}</p>}{data&&<>
   <div className="assessment-controls technical-themed-toolbar">
    <input type="search" aria-label="Search fitting types or brands" placeholder="Search fittings or brands" value={filter} onChange={e=>setFilter(e.target.value)}/>
    <label>Show<select value={review} onChange={e=>setReview(e.target.value)} aria-label="Review status">
     <option value="all">All fittings</option><option value="pending">Awaiting selection</option><option value="selected">Selected</option><option value="missing">Missing fitting codes</option>
    </select></label>
    {canEdit&&<button className="technical-primary-action" disabled={busy||!dirty} onClick={()=>save()}>Save selections</button>}
    {dirty&&<span role="status">Unsaved changes. Save selections to update Project Spec Sheets.</span>}
    <button disabled={busy||!selected} onClick={()=>dirty?save(true):onOpenProductTable?.()}>{dirty?'Save and open product table':'Open product table'}</button>
    <details className="technical-toolbar-menu"><summary>More</summary><div>
     <button onClick={()=>setFit(x=>!x)}>{fit?'View at 100%':'Fit to width'}</button>
     <button disabled={busy||dirty} onClick={()=>{for(const action of ['getTechnicalDocumentation','getProductAssessment','listFloorZones'])request.invalidate?.(action,{projectId});request.invalidate?.('listTechnicalFittings');setRevision(n=>n+1);}}>Refresh assessment</button>
     <button onClick={()=>window.print()}>Print / Save PDF</button>
    </div></details>
    <span className="technical-toolbar-status">{selected} of {model.groups.length} selected{dirty?' · Unsaved changes':''}</span>
   </div>
   <p className="assessment-controls assessment-review-tip">Choose one product per fitting type. Click an article number to open its spec sheet.</p>
   {model.groups.some(g=>!g.registered)&&<p className="assessment-error" role="status">Add the flagged fitting codes to Product Database before adding manufacturer products.</p>}
   {model.warnings.length>0&&<details className="assessment-controls"><summary>{model.warnings.length} quantities or codes need review</summary><ul>{model.warnings.map((w,i)=><li key={i}>{w}</li>)}</ul></details>}
   <div className="assessment-scroll">
    <header className="assessment-sheet-heading">
     <h1>Product Assessment Sheet</h1>
     {project?.name&&<h2>{project.name}</h2>}
     <p>Lights with a specific character are a part of the <strong>exhibit designers’ BOQ</strong> &amp; not this Assessment Sheet.<br/>For detailed description, refer luminaire specification sheets.</p>
    </header>
    <table aria-label="Product Assessment Sheet" style={{zoom:scale,width:totalWidth+'pt'}}><colgroup>{widths.map((w,i)=><col key={i} style={{width:w+'pt'}}/>)}</colgroup><thead><tr style={{height:layout.heights[0]+'pt'}}><th colSpan={3} style={cell(0,true)}>Fitting Type</th>{[3,4,5,6,7,8,9].map(c=><th key={c} style={cell(c,true)}>{layout.cells[0][c].text}</th>)}<th colSpan={2} style={cell(10,true)}>Product Rating</th></tr></thead>
   {groups.map((g,index)=>{const options=savedGroup(g).options;return <tbody key={g.id} data-fitting={g.code}>{index>0&&<tr className="assessment-divider"><td colSpan={12}/></tr>}{!options.length&&ratingLabels.map((label,ri)=><tr key={'empty-'+ri} style={{height:layout.heights[ri+1]+'pt'}}>{ri===0&&<><td rowSpan={4} style={cell(0)}>{g.reference&&<div className="assessment-design-reference"><Photo media={g.reference} projectId={projectId} request={request} effect/></div>}{g.fixture?<div className="assessment-design-fixture"><Photo media={g.fixture} projectId={projectId} request={request}/></div>:g.icon&&<img className="assessment-fixture" src={fittedIcons[g.icon]||icons[g.icon]||g.icon} alt={g.code}/>}</td><td rowSpan={4} style={cell(1)}><div><span className="assessment-fitting-code">{g.code}</span>{'\n'}{g.type}{'\n'}{g.quantity} {g.unit}{g.missingLengths>0?'\nPartial quantity':''}</div>{fittingAction(g)}</td><td rowSpan={4} style={cell(2)}/><td rowSpan={4} style={cell(3)}><span className="assessment-empty-product">No linked product</span></td>{[4,5,6].map(c=><td key={c} rowSpan={4} style={cell(c)}/>)}<td rowSpan={4} style={cell(7)}>{g.quantity}<span className="assessment-unit">{g.unit}</span></td>{[8,9].map(c=><td key={c} rowSpan={4} style={cell(c)}/>)}</>}<th scope="row" style={cell(10)}>{label}</th><td style={cell(11)}><span className="assessment-stars" aria-label={`${label}: no product to rate`}>{[1,2,3,4,5].map(n=><button type="button" key={n} disabled aria-label={`${label}: add a product to rate`}>★</button>)}</span></td></tr>)}{options.flatMap((o,oi)=>ratingLabels.map((label,ri)=><tr key={o.id+'-'+ri} style={{height:layout.heights[ri+1]+'pt'}} className={savedGroup(g).selectedId===o.id?'assessment-selected':''}>
    {oi===0&&ri===0&&<><td rowSpan={Math.max(1,options.length*4)} style={cell(0)}>{g.reference&&<div className="assessment-design-reference"><Photo media={g.reference} projectId={projectId} request={request} effect/></div>}{g.fixture?<div className="assessment-design-fixture"><Photo media={g.fixture} projectId={projectId} request={request}/></div>:g.icon&&<img className="assessment-fixture" src={fittedIcons[g.icon]||icons[g.icon]||g.icon} alt={g.code}/>}</td><td rowSpan={Math.max(1,options.length*4)} style={cell(1)}><div><span className="assessment-fitting-code">{g.code}</span>{'\n'}{g.type}{'\n'}{g.quantity} {g.unit}{g.missingLengths>0?'\nPartial quantity':''}</div>{fittingAction(g)}</td></>}
    {ri===0&&<><td rowSpan={4} style={cell(2)}><input type="checkbox" aria-label={`Select ${g.code} ${o.brand||o.id}`} disabled={!canEdit||busy} checked={savedGroup(g).selectedId===o.id} onChange={()=>choose(g,o)}/></td><td rowSpan={4} style={cell(3)}>{o.photo?<Photo media={o.photo} projectId={projectId} request={request}/>:<span>Image not supplied</span>}</td><td rowSpan={4} style={cell(4)}><button className="assessment-article" onClick={()=>openPreview(g,o)}>{o.brand||'Brand not supplied'}</button></td><td rowSpan={4} style={cell(5)}>{articleLink(g,o)}</td><td rowSpan={4} style={cell(6)}>{o.price===''?'Price on request':money(o.price)}</td><td rowSpan={4} style={cell(7)}>{g.quantity}<span className="assessment-unit">{g.unit}</span></td><td rowSpan={4} style={cell(8)}>{o.price===''?'Price on request':money(optionTotal(g,o))}</td><td rowSpan={4} style={cell(9)}>{input(g,o,'remarks','Remarks')}</td></>}
    <th scope="row" style={cell(10)}>{label}</th><td style={cell(11)}><span className="assessment-stars" role="group" aria-label={`${label} rating ${g.code} ${o.id}`}>{[1,2,3,4,5].map(n=><button type="button" key={n} aria-label={`${label}: ${n} stars for ${g.code} ${o.id}`} aria-pressed={n<=o.ratings[ri]} title={`${n} of 5 stars`} disabled={!canEdit||busy} onClick={()=>change(g,o.id,{ratings:o.ratings.map((v,i)=>i===ri?(v===n?0:n):v)})} className={n<=o.ratings[ri]?'is-filled':''}>★</button>)}</span></td>
   </tr>))}</tbody>})}</table>{!groups.length&&<p>{model.groups.length?'No fitting types match this search.':'Upload Output with product codes to create the Product Assessment Sheet.'}</p>}</div>
   <div className="assessment-total"><strong>Total</strong><span>{money(grandTotal)}{model.groups.some(g=>{const state=savedGroup(g);return state.options.some(o=>o.id===state.selectedId&&o.price==='')})?' · Excludes products priced on request':''}</span></div>
  </>}</>}
  {missingType&&<ProductTypeEditor iconFittings={products} fitting={missingType} onSave={registerType} onUpload={uploadAsset} onClose={()=>setMissingType(null)} renderImage={renderImage}/>}
  {productEditor&&<ProductBrandPanel key={productEditor.id} startAdding fitting={productEditor} admin={canEdit} onClose={()=>setProductEditor(null)} onUpload={uploadAsset} onAi={payload=>request('draftProductFromSpreadsheet',{...payload,fittingCode:productEditor.fittingType},'POST',180000)} renderImage={renderImage} onSave={async fitting=>{
   const saved=await saveCatalogue(fitting);
   setProductEditor(saved);setDirty(true);setMessage('Product Database updated. Save assessment selections when finished.');
  }}/>}
  {specPreview&&<AssessmentProductPreview {...specPreview} catalogue={products.flatMap(f=>f.products||[])} review={savedGroup(specPreview.group).options.find(o=>o.id===specPreview.optionId)?.review} onReview={review=>change(specPreview.group,specPreview.optionId,{review})} projectId={projectId} request={request} canEdit={canEdit} onClose={()=>setSpecPreview(null)} onUpload={uploadAsset} onAi={payload=>request('draftProductFromSpreadsheet',{...payload,fittingCode:specPreview.fitting.fittingType},'POST',180000)} onEdit={async product=>{
   const fitting=await saveCatalogue({...specPreview.fitting,products:specPreview.fitting.products.map(p=>p.id===product.id?product:p)});
   setSpecPreview({...specPreview,fitting,product:fitting.products.find(p=>p.id===product.id)});
  }} onDelete={async()=>{
   const {fitting,product}=specPreview;
   await saveCatalogue({...fitting,products:fitting.products.filter(p=>p.id!==product.id),preferredProductId:fitting.preferredProductId===product.id?'':fitting.preferredProductId});
   setSpecPreview(null);setDirty(true);setMessage('Product deleted from Product Database. Save assessment selections when finished.');
  }}/>}


 </div>;
}
