import ScheduleHeading from './ScheduleHeading.jsx';
import {buildColumnTable} from './technical-column-logic.mjs';
import {selectedProductTechnicalRows,circuitDrivers} from './product-technical.mjs';
import React,{useEffect,useMemo,useRef,useState} from 'react';
import {productQuantities,selectedProjectSpecSheets,outputValue,quantityCsv,finalScheduleRows,finalScheduleHeaders,finalScheduleCsv,manufacturerDocuments} from './project-product-documents.mjs';
import ProductSpecSheet,{combinedSpecSheetDocument,embedSpecSheetEntries,SpecSheetBookPreview} from './ProductSpecSheet.jsx';
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
 const [preview,setPreview]=useState(null);
 useEffect(()=>{setPreview(null);},[projectId,view]);

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
 const boq=useMemo(()=>finalScheduleRows(model.groups,products,assessment).map(r=>({...r,image:sheets.find(s=>s.sources.includes(r.id))?.product.imageUrl||r.image})),[model,products,assessment,sheets]);
 const html=useMemo(()=>combinedSpecSheetDocument(sheets,context),[sheets,context]);
 const groups=model.groups.filter(g=>[g.code,g.type,...g.areas].join(' ').toLowerCase().includes(query.toLowerCase()));
 const warnings=view==='quantities'?[...new Set([...model.warnings,...drivers.warnings])]:[...book.warnings,...photoWarnings];
 const exportBook=async()=>{setExporting(true);setError('');try{if(photoWarnings.length)throw Error('A selected product photograph is unavailable. Refresh or correct its image before downloading.');const embedded=await embedSpecSheetEntries(sheets);download(combinedSpecSheetDocument(embedded.entries,context,embedded.fonts),'text/html;charset=utf-8','Selected_Product_Spec_Sheets.html')}catch(e){setError(e.message)}finally{setExporting(false)}};
 return <section className="project-product-documents"><div className="project-document-tools"><button type="button" disabled={busy||exporting} onClick={()=>setRefresh(n=>n+1)}>Refresh {view==='spec'?'spec sheets':view==='schedule'?'schedule':'quantities'}</button>{view==='schedule'?<><button type="button" disabled={!boq.length||busy} onClick={()=>download('\uFEFF'+finalScheduleCsv(boq),'text/csv;charset=utf-8','Luminaire_Schedule_Product.csv')}>Download schedule CSV</button></>:view==='quantities'?<><button type="button" disabled={!model.groups.length||busy} onClick={()=>download('\uFEFF'+quantityCsv(model),'text/csv;charset=utf-8','Product_Quantities.csv')}>Download quantities CSV</button><input aria-label="Search product quantities" placeholder="Search product code or area" value={query} onChange={e=>setQuery(e.target.value)}/></>:<><button type="button" disabled={!sheets.length||busy||exporting} onClick={exportBook}>{exporting?'Preparing spec sheets…':'Download all spec sheets HTML'}</button><button type="button" disabled={!sheets.length||exporting} onClick={async()=>{const w=frame.current?.contentWindow;if(!w)return;await w.document.fonts?.ready;await Promise.all([...w.document.images].map(im=>im.complete?Promise.resolve():new Promise(resolve=>{im.addEventListener('load',resolve,{once:true});im.addEventListener('error',resolve,{once:true})})));w.print()}}>Print all / Save PDF</button></>}</div>
 {busy&&<p role="status">Loading project {view==='spec'?'selections and specifications':view==='schedule'?'schedule':'quantities'}…</p>}{error&&<p role="alert">{error}</p>}
 {!projectId&&<p>Select a project.</p>}
 {!busy&&data&&<>{view==='quantities'?<><div className="project-quantity-totals"><span><b>{model.groups.length}</b> product types</span><span><b>{number(model.pieceTotal)}</b> pcs</span><span><b>{number(model.metreTotal)}</b> m</span></div><p>Approved product quantities from saved Output. Expand a product to see its circuits and specifications.</p></>:<p>{book.selectedCount} fitting types selected · {sheets.length} product spec sheets. Save selections in Product Assessment to update {view==='schedule'?'the schedule':'this collection'}.</p>}
 {!!warnings.length&&<details className="project-document-warnings"><summary>{warnings.length} items need review</summary><ul>{warnings.map((w,i)=><li key={i}>{w}</li>)}</ul></details>}
 <div className="project-document-paper">{view!=='spec'&&<ScheduleHeading project={project}/>}
 {view==='schedule'?<><FinalSchedule rows={boq} onSpec={row=>{const sheet=sheets.find(s=>s.id===row.sheetId)||book.sheets.find(s=>s.id===row.sheetId);if(sheet)setPreview(sheet)}}/></>:view==='quantities'?<><div className="project-quantities-scroll"><table className="project-quantities"><thead><tr>{['Product','Housing / Product code','Luminaire Details','Quantity','Unit','Total Circuits','Areas','Circuit Details'].map(h=><th key={h}>{h}</th>)}</tr></thead><tbody>{groups.map(g=><React.Fragment key={g.id}><tr><td>{(g.fitting?.thumbnailUrl||g.icon)&&<img src={g.fitting?.thumbnailUrl||icons[g.icon]||g.icon} alt={g.code}/>}</td><td><strong>{g.code}</strong></td><td>{g.type}</td><td>{g.missingLengths?'≥ ':''}{number(g.quantity)}{g.missingLengths>0&&<small>{g.missingLengths} lengths missing</small>}</td><td>{g.unit}</td><td>{g.circuitRows.length}</td><td>{g.areas.join('\n')}</td><td><button type="button" aria-expanded={!!expanded[g.id]} onClick={()=>setExpanded(x=>({...x,[g.id]:!x[g.id]}))}>{expanded[g.id]?'Hide':'Show'} circuits</button></td></tr>{expanded[g.id]&&<tr><td colSpan={8}><div className="project-quantities-scroll"><CircuitDetails group={g} headers={data.headers}/></div></td></tr>}</React.Fragment>)}</tbody><tfoot><tr><th colSpan={3}>Total quantities</th><td colSpan={5}>{number(model.pieceTotal)} pcs · {number(model.metreTotal)} m{model.groups.some(g=>g.missingLengths)&&' · Partial: review missing lengths'}</td></tr></tfoot></table>{!groups.length&&<p>{model.groups.length?'No matching products.':'No product quantities found. Upload Output in Technical Table first.'}</p>}</div><DriverQuantities circuits={drivers.circuits}/></>:sheets.length?<><div className="project-quantities-scroll"><table className="project-quantities"><thead><tr><th>Fitting codes</th><th>Manufacturer / article</th><th>enLIGHTen specification</th><th>Manufacturer documentation</th></tr></thead><tbody>{sheets.map(sheet=><tr key={sheet.id}><td>{sheet.codes.join(' / ')}</td><td>{sheet.product.brand} · {sheet.product.specs?.article}</td><td><button onClick={()=>setPreview(sheet)}>View specification</button></td><td><ManufacturerLinks product={sheet.product}/></td></tr>)}</tbody></table></div><SpecSheetBookPreview html={html} pageCount={sheets.length} frameRef={frame}/></>:<p>{book.sheets.length?'Preparing selected product photographs…':'No saved product selections were found for this project. In Product Assessment, tick the product and click Save selections, then refresh this page.'}</p>}</div></>}
 {preview&&<div className="vendor-editor-overlay"><section className="vendor-editor"><ProductSpecSheet product={preview.product} fitting={{fittingType:preview.codes.join(' / ')}} initialContext={context} onClose={()=>setPreview(null)}/></section></div>}
 </section>;
}

function ManufacturerLinks({product}){
 const documents=manufacturerDocuments(product);
 return documents.length?<div className="manufacturer-document-links">{documents.map(doc=><a key={doc.label} href={doc.url} target="_blank" rel="noopener noreferrer">{doc.label}</a>)}</div>:<span>Manufacturer documents not uploaded</span>;
}
function FinalSchedule({rows,onSpec}){
 return <div className="project-quantities-scroll"><table className="project-quantities final-product-schedule" aria-label="Approved Luminaire Schedule"><thead><tr>{finalScheduleHeaders.map(h=><th key={h}>{h}</th>)}</tr></thead><tbody>{rows.map(r=><tr key={r.id}><td>{r.serial}</td><td>{r.application&&<img src={icons[r.application]||r.application} alt="Application"/>}</td><td><strong>{r.code}</strong></td><td>{r.image&&<img src={r.image} alt={r.article}/>}</td><td>{r.make}</td><td>{r.article}</td><td>{r.power||'—'}</td><td>{r.colour||'—'}</td><td>{r.beam||'—'}</td><td>{r.mount||'—'}</td><td>{r.control||'—'}</td><td>{r.missingLengths?'≥ ':''}{number(r.quantity)}</td><td>{r.unit}</td><td><button disabled={!r.sheetId} onClick={()=>onSpec(r)}>View specification</button>{r.documents.filter(d=>d.label==='Manufacturer datasheet').map(d=><a key={d.label} href={d.url} target="_blank" rel="noopener noreferrer">Manufacturer datasheet</a>)}</td></tr>)}</tbody></table>{!rows.length&&<p>No approved products yet.</p>}</div>;
}
