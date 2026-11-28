import ScheduleHeading from './ScheduleHeading.jsx';
import {buildColumnTable} from './technical-column-logic.mjs';
import {selectedProductTechnicalRows,circuitDrivers} from './product-technical.mjs';
import {luminaireOfferLink,vendorScheduleDocument} from './LuminaireEquivalentForm.jsx';
import boqLayout from './boq-layout.json';
import React,{useEffect,useMemo,useRef,useState} from 'react';
import {productQuantities,selectedProjectSpecSheets,outputValue,quantityCsv,boqScheduleRows,boqCsv} from './project-product-documents.mjs';
import {combinedSpecSheetDocument,embedSpecSheetEntries,SpecSheetBookPreview} from './ProductSpecSheet.jsx';
import {shortTechnicalFloor} from './technical-column-logic.mjs';
import icons from './technical-icon-map.json';
import './ProjectProductDocuments.css';
const number=n=>new Intl.NumberFormat('en-IN',{maximumFractionDigits:4}).format(n);
const download=(text,type,name)=>{const url=URL.createObjectURL(new Blob([text],{type}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)};
const detailHeaders=['Zone','CN','Thumbnail','Luminaire Details','Fitting Type','Optics','Application','Effect','Height','Illuminance','Aim | Direction','Colour','Control','Qty','Unit'];
function CircuitDetails({group,headers}){const read=(r,names)=>[...new Set(r.rows.map(row=>outputValue(headers,row,names)).filter(Boolean))].join(' / ');return <table className="project-circuit-quantities"><thead><tr>{detailHeaders.map(h=><th key={h}>{h}</th>)}</tr></thead><tbody>{group.circuitRows.map(r=><tr key={r.id}><td>{[shortTechnicalFloor(r.floor),r.zone?.area||r.zone?.room||r.zone?.areaName||r.zone?.name||r.zone?.zoneName||r.zoneCode].filter(Boolean).join(' | ')}</td><td>{r.cn}</td><td>{group.icon&&<img src={icons[group.icon]||group.icon} alt="Fixture"/>}</td><td>{r.type}</td><td>{r.code}</td><td>{read(r,['OPTICS','BEAMANGLE','BEAM'])}</td><td>{r.application}</td><td>{read(r,['EFFECT'])}</td><td>{r.height}</td><td>{r.illuminance}</td><td>{read(r,['AIM','AIM|DIRECTION','DIRECTION'])}</td><td>{read(r,['COLOUR','COLOR','CCT'])}</td><td>{read(r,['CONTROL','DIMMING'])}</td><td>{r.quantity}</td><td>{group.unit}</td></tr>)}</tbody></table>}
function DriverQuantities({circuits}) {
 const totals=new Map();
 let needsReview=0;
 for(const circuit of circuits){
  if(circuit.quantity===null){needsReview++;continue;}
  totals.set(circuit.driverWatts,(totals.get(circuit.driverWatts)||0)+circuit.quantity);
 }
 return <section>
  <h3>Driver quantities</h3>
  {totals.size>0&&<table className="project-quantities">
   <thead><tr><th>Driver wattage</th><th>Quantity</th></tr></thead>
   <tbody>{[...totals].sort(([a],[b])=>a-b).map(([watts,quantity])=><tr key={watts}><td>{number(watts)} W</td><td>{number(quantity)}</td></tr>)}</tbody>
   <tfoot><tr><th>Total drivers</th><td>{number([...totals.values()].reduce((a,b)=>a+b,0))}</td></tr></tfoot>
  </table>}
  {!circuits.length&&<p>Save product selections in Product Assessment to calculate driver quantities.</p>}
  {needsReview>0&&<p>{needsReview} selected circuit{needsReview===1?'':'s'} need a valid load and driver wattage before they can be counted.</p>}
 </section>;
}
export default function ProjectProductDocuments({projectId,project,request,view,canIssue=false}){
 const [data,setData]=useState(null),[products,setProducts]=useState([]),[zones,setZones]=useState([]),[assessment,setAssessment]=useState({groups:{}}),[busy,setBusy]=useState(false),[error,setError]=useState(''),[refresh,setRefresh]=useState(0),[query,setQuery]=useState(''),[expanded,setExpanded]=useState({}),[sheets,setSheets]=useState([]),[photoWarnings,setPhotoWarnings]=useState([]),[exporting,setExporting]=useState(false);
 const frame=useRef(null);
 const [invitation,setInvitation]=useState(null),[offers,setOffers]=useState(null);
 const currentInvitation=invitation?.projectId===projectId?invitation:null;
 useEffect(()=>{setInvitation(null);setOffers(null);},[projectId]);

 useEffect(()=>{let live=true;setData(null);setAssessment({groups:{}});setExpanded({});setSheets([]);setError('');setQuery('');if(!projectId){setBusy(false);return}setBusy(true);
 Promise.all([request('getTechnicalDocumentation',{projectId},'POST',90000),request('listFloorZones',{projectId},'POST',90000),fetch('/technical-library/database.json').then(r=>{if(!r.ok)throw Error('Product Database could not load.');return r.json()}),request('listTechnicalFittings',{},'GET',90000),request('getProductAssessment',{projectId},'POST',90000),request('listVendorProjectFittings',{projectId},'POST',90000)]).then(([d,z,seed,updates,a,vendorFittings])=>{if(!live)return;const all=new Map((seed.fittings||[]).map(f=>[f.id,f]));updates.forEach(f=>all.set(f.id,{...all.get(f.id),...f}));vendorFittings.forEach(f=>all.set(f.id,f));setData(d);setZones(z);setProducts([...all.values()].filter(f=>!f.deleted));setAssessment(a)}).catch(e=>live&&setError(e.message)).finally(()=>live&&setBusy(false));return()=>{live=false};
 },[projectId,refresh,view]);
 const model=useMemo(()=>{
  const base=productQuantities(data||{},products,zones);
  const groups=base.groups.filter(g=>!!assessment.groups?.[g.id]?.selectedId);
  return {...base,groups,pieceTotal:groups.filter(g=>!g.linear).reduce((n,g)=>n+g.quantity,0),metreTotal:Number(groups.filter(g=>g.linear).reduce((n,g)=>n+g.quantity,0).toFixed(6))};
 },[data,products,zones,assessment]);
 const drivers=useMemo(()=>{
  if(view!=='quantities'||!data)return {circuits:[],warnings:[]};
  const selected=selectedProductTechnicalRows(buildColumnTable(data,zones,products).rows,assessment,products);
  return {circuits:selected.rows.map(row=>circuitDrivers(row,data.headers)),warnings:selected.warnings};
 },[view,data,zones,products,assessment]);
 const book=useMemo(()=>selectedProjectSpecSheets(model.groups,products,assessment,{includeSavedOnly:view==='spec'}),[model,products,assessment,view]);
 const context=useMemo(()=>({project:project?.name||'',location:[project?.address,project?.city].filter(Boolean).join(', ')}),[project]);
 useEffect(()=>{let live=true;setSheets([]);setPhotoWarnings([]);if(view==='quantities')return;
 Promise.all(book.sheets.map(async s=>{if(!s.photo?.driveFileId)return s;try{const result=await request('getTechnicalProjectImage',{projectId,fileId:s.photo.driveFileId},'POST',90000);return {...s,product:{...s.product,imageUrl:result.url}}}catch(e){return {...s,photoError:`${s.codes.join(', ')}: selected photograph could not load (${e.message}).`}}})).then(result=>{if(live){setSheets(result);setPhotoWarnings(result.flatMap(s=>s.photoError?[s.photoError]:[]))}});return()=>{live=false};},[book,projectId,request,view]);
 const boq=useMemo(()=>boqScheduleRows(model.groups,products,assessment).map(r=>({...r,image:sheets.find(s=>s.sources.includes(r.id))?.product.imageUrl||r.image})),[model,products,assessment,sheets]);
 const html=useMemo(()=>combinedSpecSheetDocument(sheets,context),[sheets,context]);
 const groups=model.groups.filter(g=>[g.code,g.type,...g.areas].join(' ').toLowerCase().includes(query.toLowerCase()));
 const warnings=view==='quantities'?[...new Set([...model.warnings,...drivers.warnings])]:[...book.warnings,...photoWarnings];
 const exportBook=async()=>{setExporting(true);setError('');try{if(photoWarnings.length)throw Error('A selected product photograph is unavailable. Refresh or correct its image before downloading.');const embedded=await embedSpecSheetEntries(sheets);download(combinedSpecSheetDocument(embedded.entries,context,embedded.fonts),'text/html;charset=utf-8','Selected_Product_Spec_Sheets.html')}catch(e){setError(e.message)}finally{setExporting(false)}};
 async function issueSchedule(){
  setExporting(true);setError('');
  try{
   const result=await request('createLuminaireInvitation',{projectId,items:boq.map(({id,code,quantity,unit})=>({id,code,quantity,unit}))},'POST',90000);
   setInvitation({...result,projectId});
   download(vendorScheduleDocument(boq,project?.name||'',result.token),'text/html;charset=utf-8','Luminaire_Schedule_Vendor.html');
  }catch(e){setError(e.message);}finally{setExporting(false);}
 }
 async function loadOffers(){
  setError('');
  try{setOffers({projectId,rows:await request('listLuminaireEquivalentOffers',{projectId},'POST',90000)});}
  catch(e){setError(e.message);}
 }
 return <section className="project-product-documents">{view!=='spec'&&<ScheduleHeading project={project}/>}<div className="project-document-tools"><button type="button" disabled={busy||exporting} onClick={()=>setRefresh(n=>n+1)}>Refresh {view==='spec'?'spec sheets':view==='schedule'?'schedule':'quantities'}</button>{view==='schedule'?<><button type="button" disabled={!boq.length||busy} onClick={()=>download('\uFEFF'+boqCsv(boq,boqLayout.headers),'text/csv;charset=utf-8','Luminaire_Schedule_BOQ.csv')}>Download schedule CSV</button>{canIssue&&<><button type="button" disabled={!boq.length||busy||exporting} onClick={issueSchedule}>Issue vendor schedule</button><button type="button" disabled={busy} onClick={loadOffers}>Review vendor offers</button></>}</>:view==='quantities'?<><button type="button" disabled={!model.groups.length||busy} onClick={()=>download('\uFEFF'+quantityCsv(model),'text/csv;charset=utf-8','Product_Quantities.csv')}>Download quantities CSV</button><input aria-label="Search product quantities" placeholder="Search product code or area" value={query} onChange={e=>setQuery(e.target.value)}/></>:<><button type="button" disabled={!sheets.length||busy||exporting} onClick={exportBook}>{exporting?'Preparing spec sheets…':'Download all spec sheets HTML'}</button><button type="button" disabled={!sheets.length||exporting} onClick={async()=>{const w=frame.current?.contentWindow;if(!w)return;await w.document.fonts?.ready;await Promise.all([...w.document.images].map(im=>im.complete?Promise.resolve():new Promise(resolve=>{im.addEventListener('load',resolve,{once:true});im.addEventListener('error',resolve,{once:true})})));w.print()}}>Print all / Save PDF</button></>}</div>
 {busy&&<p role="status">Loading project {view==='spec'?'selections and specifications':view==='schedule'?'schedule':'quantities'}…</p>}{error&&<p role="alert">{error}</p>}
 {!projectId&&<p>Select a project.</p>}
 {!busy&&data&&<>{view==='quantities'?<><div className="project-quantity-totals"><span><b>{model.groups.length}</b> product types</span><span><b>{number(model.pieceTotal)}</b> pcs</span><span><b>{number(model.metreTotal)}</b> m</span></div><p>Approved product quantities from saved Output. Expand a product to see its circuits and specifications.</p></>:<p>{book.selectedCount} fitting types selected · {sheets.length} product spec sheets. Save selections in Product Assessment to update {view==='schedule'?'the schedule':'this collection'}.</p>}
 {!!warnings.length&&<details className="project-document-warnings"><summary>{warnings.length} items need review</summary><ul>{warnings.map((w,i)=><li key={i}>{w}</li>)}</ul></details>}
 {view==='schedule'?<>{currentInvitation&&<p role="status">Vendor links expire on {new Date(currentInvitation.expires).toLocaleDateString()}. Share the downloaded schedule with the invited vendors.</p>}
 {offers?.projectId===projectId&&<section><h3>Vendor offers ({offers.rows.length})</h3>{offers.rows.map(o=><details key={o.offerId}><summary>{o.item.code} · {o.vendor} · {o.brand} {o.model} · {o.currency} {o.price}</summary><p>{o.email}</p>{[['specifications','Technical specifications'],['photometry','Photometry'],['compliance','Compliance'],['warranty','Warranty'],['commercial','Commercial terms']].map(([key,label])=><p key={key}><strong>{label} </strong>{o[key]||'—'}</p>)}<ul>{o.documents.map((doc,i)=><li key={i}><a href={doc.url} target="_blank" rel="noreferrer">{doc.name}</a></li>)}</ul></details>)}</section>}
 <BoqSchedule rows={boq} token={currentInvitation?.token}/></>:view==='quantities'?<><div className="project-quantities-scroll"><table className="project-quantities"><thead><tr>{['Product','Housing / Product code','Luminaire Details','Quantity','Unit','Total Circuits','Areas','Circuit Details'].map(h=><th key={h}>{h}</th>)}</tr></thead><tbody>{groups.map(g=><React.Fragment key={g.id}><tr><td>{(g.fitting?.thumbnailUrl||g.icon)&&<img src={g.fitting?.thumbnailUrl||icons[g.icon]||g.icon} alt={g.code}/>}</td><td><strong>{g.code}</strong></td><td>{g.type}</td><td>{g.missingLengths?'≥ ':''}{number(g.quantity)}{g.missingLengths>0&&<small>{g.missingLengths} lengths missing</small>}</td><td>{g.unit}</td><td>{g.circuitRows.length}</td><td>{g.areas.join('\n')}</td><td><button type="button" aria-expanded={!!expanded[g.id]} onClick={()=>setExpanded(x=>({...x,[g.id]:!x[g.id]}))}>{expanded[g.id]?'Hide':'Show'} circuits</button></td></tr>{expanded[g.id]&&<tr><td colSpan={8}><div className="project-quantities-scroll"><CircuitDetails group={g} headers={data.headers}/></div></td></tr>}</React.Fragment>)}</tbody><tfoot><tr><th colSpan={3}>Total quantities</th><td colSpan={5}>{number(model.pieceTotal)} pcs · {number(model.metreTotal)} m{model.groups.some(g=>g.missingLengths)&&' · Partial: review missing lengths'}</td></tr></tfoot></table>{!groups.length&&<p>{model.groups.length?'No matching products.':'No product quantities found. Upload Output in Technical Table first.'}</p>}</div><DriverQuantities circuits={drivers.circuits}/></>:sheets.length?<><div className="project-spec-index">{sheets.map(s=><span key={s.id}>{s.codes.join(' / ')} · {s.product.brand} · {s.product.specs?.article}</span>)}</div><SpecSheetBookPreview html={html} pageCount={sheets.length} frameRef={frame}/></>:<p>{book.sheets.length?'Preparing selected product photographs…':'No saved product selections were found for this project. In Product Assessment, tick the product and click Save selections, then refresh this page.'}</p>}</>}
 </section>;
}

function BoqSchedule({rows,token}){
 const host=useRef(null),[width,setWidth]=useState(1200),[fit,setFit]=useState(true);
 useEffect(()=>{if(!host.current)return;const observer=new ResizeObserver(e=>setWidth(e[0].contentRect.width));observer.observe(host.current);return()=>observer.disconnect()},[]);
 const scale=fit?Math.min(1,width/(boqLayout.widths.reduce((a,b)=>a+b,0)*4/3)):1;
 return <div ref={host}><div className="project-document-tools"><button type="button" onClick={()=>setFit(v=>!v)}>{fit?'View at 100%':'Fit to width'}</button><span>{rows.length} product types · {Math.round(scale*100)}%</span></div><div className="project-quantities-scroll"><table aria-label="Luminaire Schedule BOQ" className="project-boq-schedule" style={{zoom:scale,width:boqLayout.widths.reduce((a,b)=>a+b,0)+'pt',fontSize:Math.max(boqLayout.bodyFont,12/(scale*4/3))+'pt'}}><colgroup>{boqLayout.widths.map((w,i)=><col key={i} style={{width:w+'pt'}}/>)}</colgroup><thead><tr style={{height:boqLayout.headerHeight+'pt'}}>{boqLayout.headers.map(h=><th key={h} style={{fontSize:boqLayout.headerFont+'pt',background:boqLayout.headerColor}}>{h}</th>)}</tr></thead><tbody>{rows.map(r=><tr key={r.id} style={{height:boqLayout.rowHeight+'pt'}}><td>{r.serial}</td><td>{r.control}</td><td>{r.image&&<img src={icons[r.image]||r.image} alt={r.code}/>}</td><td>{token?<a href={luminaireOfferLink(token,r.id)} target="_blank" rel="noreferrer">{r.code}</a>:r.code}</td><td>{r.make}</td><td>{r.article}</td><td>{r.equivalents}{token&&<div><a href={luminaireOfferLink(token,r.id)} target="_blank" rel="noreferrer">Add Equivalent</a></div>}</td><td>{r.missingLengths?'≥ ':''}{number(r.quantity)}</td><td>{r.unit}</td></tr>)}</tbody></table></div>{!rows.length&&<p>Upload project Output to generate the schedule.</p>}<p>Quantities follow saved Output or the supplied quantity entered in Product Assessment. Brand details remain blank until a product is selected.</p></div>;
}
