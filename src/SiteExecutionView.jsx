import React,{useState,useEffect,useMemo,useRef} from 'react';
import './TechnicalDocumentation.css';
import './SiteExecutionView.css';
import {productTechnicalCells} from './GeneratedTechnicalTable.jsx';
import {buildColumnTable,technicalZoneSections} from './technical-column-logic.mjs';
import {productTechnicalHeaders,selectedProductTechnicalRows} from './product-technical.mjs';
const deliveryOptions=['Yet to be ordered','Ordered','Delivered','On site'];
const workOptions=['Pending','Can be done'];
function SiteStatusSelect({label,value,options,disabled,onChange}){
 return <select aria-label={label} value={value||''} disabled={disabled} onChange={event=>onChange(event.target.value)}>
  <option value="">Select</option>
  {!!value&&!options.includes(value)&&<option value={value}>{value}</option>}
  {options.map(option=><option key={option}>{option}</option>)}
 </select>;
}
export default function SiteExecutionView({projectId,projectName,projectCode,request}){
 const [data,setData]=useState(null),[error,setError]=useState(''),[loading,setLoading]=useState(false),[revision,setRevision]=useState(0),[view,setView]=useState('execution'),[completed,setCompleted]=useState(false),[query,setQuery]=useState(''),[allSnags,setAllSnags]=useState(false),[drafts,setDrafts]=useState({}),[pending,setPending]=useState({}),[limit,setLimit]=useState(100),[hidden,setHidden]=useState([]);
 const locks=useRef(new Set()),alive=useRef(true);
 useEffect(()=>{alive.current=true;return()=>{alive.current=false}},[]);
 useEffect(()=>{
  let live=true;setLoading(true);setError('');
  const params={projectId};
  if(revision){
   for(const action of ['getSiteExecution','getTechnicalDocumentation','getProductAssessment','listFloorZones'])request.invalidate?.(action,params);
   request.invalidate?.('listTechnicalFittings');
  }
  Promise.all([
   request('getSiteExecution',params,'POST',120000),
   request('getTechnicalDocumentation',params,'POST',90000),
   request('getProductAssessment',params,'POST',90000),
   request('listFloorZones',params,'POST',90000),
   fetch('/technical-library/database.json').then(response=>{
    if(!response.ok)throw Error('Product Database could not load.');
    return response.json();
   }),
   request('listTechnicalFittings',{},'GET',90000)
  ]).then(([tracking,output,assessment,zones,seed,updates])=>{
   if(!live)return;
   const fittings=new Map(seed.fittings.map(fitting=>[fitting.id,fitting]));
   updates.forEach(fitting=>fittings.set(fitting.id,{...fittings.get(fitting.id),...fitting}));
   const products=[...fittings.values()].filter(fitting=>!fitting.deleted);
   const {rows}=selectedProductTechnicalRows(buildColumnTable(output,zones,products).rows,assessment,products);
   setData({...tracking,productRows:technicalZoneSections(rows).flatMap(group=>group.sections.flatMap(section=>section.rows))});
  }).catch(e=>{if(live)setError(e.message)}).finally(()=>{if(live)setLoading(false)});
  return()=>{live=false};
 },[projectId,revision]);
 const items=useMemo(()=>{
  if(!data)return [];
  const tracking=new Map(data.items.map(item=>[item.circuitId,item]));
  return data.productRows.map(product=>{
   const item=tracking.get(product.id);
   return item?{...item,product}:{itemKey:product.id,cn:product.cn,floor:product.floor,record:{},product,editable:false,warning:'Refresh to load tracking for this circuit.'};
  });
 },[data]);
 const current=item=>({...item.record,...drafts[item.itemKey]});
 const put=(item,field,value)=>setDrafts(d=>({...d,[item.itemKey]:{...d[item.itemKey],[field]:value}}));
 const markBusy=(id,value)=>{if(value)locks.current.add(id);else locks.current.delete(id);if(alive.current)setPending(p=>({...p,[id]:value}))};
 const persist=async(item,next)=>{
  const before=item.record;
  setData(d=>({...d,items:d.items.map(i=>i.itemKey===item.itemKey?{...i,record:next}:i)}));
  try{const saved=await request('saveSiteExecutionItem',{projectId,token:item.token,expectedVersion:before.version||'',record:{delivery:next.delivery||'',status:next.status||'',notes:next.notes||'',responsibility:next.responsibility||'',installed:!!next.installed,snagClosed:!!next.snagClosed,photos:next.photos||[]}},'POST',90000);if(alive.current){setData(d=>({...d,items:d.items.map(i=>i.itemKey===item.itemKey?{...i,record:saved}:i)}));setDrafts(d=>{const copy={...d};delete copy[item.itemKey];return copy})}}catch(e){if(alive.current){setData(d=>({...d,items:d.items.map(i=>i.itemKey===item.itemKey?{...i,record:before}:i)}));setError(e.message+' Changes were not saved. Your text/photo draft is retained.');}throw e;}
 };
 const save=async(item,patch={})=>{if(locks.current.has(item.itemKey))return;markBusy(item.itemKey,true);setError('');try{await persist(item,{...current(item),...patch})}catch{}finally{markBusy(item.itemKey,false)}};
 const upload=async(e,item)=>{const file=e.target.files?.[0];e.target.value='';if(!file||locks.current.has(item.itemKey))return;if(file.size>3*1024*1024){setError('Use a photo smaller than 3 MB.');return;}const record=current(item);if(record.photos?.length>=20){setError('Use up to 20 photos per circuit.');return;}markBusy(item.itemKey,true);setError('');try{const base64=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result).split(',')[1]);reader.onerror=()=>reject(Error('Could not read photo.'));reader.readAsDataURL(file)});const photo=await request('uploadSiteExecutionPhoto',{projectId,token:item.token,name:file.name,base64},'POST',120000);const photos=[...(record.photos||[]),photo];if(alive.current)put(item,'photos',photos);await persist(item,{...record,photos})}catch(e){if(alive.current)setError(e.message+' If the photo reached Drive, it remains there; retry Save changes to attach the retained draft.')}finally{markBusy(item.itemKey,false)}};
 if(!data)return <section className="site-execution">{loading?<p role="status">Loading site execution sheet…</p>:null}{error&&<p role="alert">{error}</p>}<button type="button" disabled={loading} onClick={()=>setRevision(v=>v+1)}>Retry</button></section>;
 const columns=productTechnicalHeaders.slice(1).map((label,index)=>({label,index}));
 const visible=columns.filter(column=>!hidden.includes(column.index));
 const flag=view==='execution'?'installed':'snagClosed';
 const base=items.filter(item=>view==='execution'||allSnags||item.record.status||item.record.photos?.length||item.record.snagClosed);
 const activeCount=base.filter(item=>!item.record[flag]).length,doneCount=base.length-activeCount;
 const shown=base.filter(item=>!!item.record[flag]===completed&&[
  item.cn,item.floor,item.product.zone?.area,item.product.modelNo,item.product.productName,item.record.delivery,item.record.status,item.record.notes,item.record.responsibility,
  ...(item.momTasks||[]).map(point=>point.title)
 ].join(' ').toLowerCase().includes(query.toLowerCase()));
 const switchView=id=>{setView(id);setCompleted(false);setLimit(100)};
 return <section className="site-execution"><div className="site-execution-toolbar" role="tablist" aria-label="Site tracking views">{[['execution','Site Execution Sheet'],['snag','Snag List']].map(([id,label])=><button type="button" role="tab" aria-selected={view===id} className={view===id?'selected':''} key={id} onClick={()=>switchView(id)}>{label}</button>)}<button type="button" disabled={Object.values(pending).some(Boolean)||loading} onClick={()=>setRevision(v=>v+1)}>Refresh</button></div><div className="site-execution-toolbar"><button type="button" className={!completed?'selected':''} onClick={()=>{setCompleted(false);setLimit(100)}}>Open ({activeCount})</button><button type="button" className={completed?'selected':''} onClick={()=>{setCompleted(true);setLimit(100)}}>Completed ({doneCount})</button><input aria-label="Search site circuits" placeholder="Search circuit, floor, zone or notes" value={query} onChange={e=>{setQuery(e.target.value);setLimit(100)}}/>{view==='snag'&&<label><input type="checkbox" checked={allSnags} onChange={e=>setAllSnags(e.target.checked)}/>Show all circuits to add a snag</label>}</div><p className="site-execution-note">{view==='execution'?`${doneCount} of ${base.length} circuit rows installed. ${activeCount===0&&base.length?'Installation checklist complete.':'Check Installed to move a circuit to Completed.'}`:'Snag resolution is tracked separately from installation. Photos, status and responsibility belong to the same circuit record.'}</p><details><summary>Show / hide Technical Table columns</summary><div className="site-column-options">{columns.map(c=><label key={c.index}><input type="checkbox" checked={!hidden.includes(c.index)} onChange={e=>setHidden(h=>e.target.checked?h.filter(v=>v!==c.index):[...h,c.index])}/>{c.label}</label>)}</div></details>{error&&<p role="alert" className="site-save-error">{error}</p>}{loading&&<p role="status">Refreshing site records…</p>}<div className="technical-screen-table site-execution-sheet">
 <header className="technical-document-heading">
  <h1>{view==='execution'?'Site Execution Sheet':'Snag List'}</h1>
  {projectName&&<h2>{projectName}</h2>}
 </header>
 {projectCode&&<div className="technical-file-heading">{projectCode} - {view==='execution'?'SITE EXECUTION SHEET':'SNAG LIST'}</div>}
 <div className="site-execution-scroll"><table aria-label={view==='execution'?'Project site execution table':'Project snag list'}><thead><tr><th className="site-completion-cell">{view==='execution'?'Installed':'Resolved'}</th>{visible.map(c=><th key={c.index}>{c.label}</th>)}<th>{view==='execution'?'Light delivery':'Site photos'}</th><th>{view==='execution'?'Work status':'Status / Issue'}</th><th>{view==='execution'?'Notes':'Responsibility'}</th></tr></thead><tbody>{shown.slice(0,limit).map(item=>{const record=current(item),disabled=!data.canEdit||!item.editable||pending[item.itemKey];const cells=productTechnicalCells(item.product,request,projectId);return <tr key={item.product.id}><td className="site-completion-cell"><input type="checkbox" aria-label={`${view==='execution'?'Installed':'Resolve snag'} ${item.cn} ${item.zone}`} checked={!!item.record[flag]} disabled={disabled} onChange={e=>save(item,{[flag]:e.target.checked})}/>{item.warning&&<p className="site-row-warning">{item.warning}</p>}{pending[item.itemKey]&&<span className="site-execution-note">Saving…</span>}</td>{visible.map(c=><td key={c.index}>{cells[c.index]||'—'}</td>)}<td>{view==='execution'?<SiteStatusSelect label={`Delivery ${item.cn}`} value={record.delivery} options={deliveryOptions} disabled={disabled} onChange={value=>put(item,'delivery',value)}/>:<div className="site-photo-grid">{(record.photos||[]).map((photo,index)=><figure key={photo.fileId||photo.url+index}><a href={photo.fileId?'https://drive.google.com/file/d/'+encodeURIComponent(photo.fileId)+'/view':photo.url} target="_blank" rel="noopener noreferrer"><img loading="lazy" src={photo.url} alt={photo.name||'Site photo'}/></a><figcaption>{photo.name}</figcaption>{data.canEdit&&<button type="button" disabled={disabled} onClick={()=>put(item,'photos',record.photos.filter((_,i)=>i!==index))}>Remove link</button>}</figure>)}{data.canEdit&&<label className="site-upload">Add photo<input type="file" accept="image/png,image/jpeg,image/webp" disabled={disabled} onChange={e=>upload(e,item)}/></label>}</div>}</td><td>{view==='execution'
 ?<SiteStatusSelect label={`Work status ${item.cn}`} value={record.status} options={workOptions} disabled={disabled} onChange={value=>put(item,'status',value)}/>
 :<textarea aria-label={`Status ${item.cn}`} disabled={disabled} value={record.status||''} onChange={e=>put(item,'status',e.target.value)}/>}</td>
 <td>{view==='execution'?<>
  <textarea aria-label={`Notes ${item.cn}`} disabled={disabled} value={record.notes||''} placeholder="What is holding up installation?" onChange={event=>put(item,'notes',event.target.value)}/>
  {!!item.momTasks?.length&&<div className="site-circuit-mom"><strong>Linked MOM</strong><ul>{item.momTasks.map(point=><li key={point.id}>{point.title}{point.action&&point.completed?' · Completed':''}</li>)}</ul></div>}
 </>:<input aria-label={`Responsibility ${item.cn}`} disabled={disabled} value={record.responsibility||''} placeholder="Person / vendor / team" onChange={e=>put(item,'responsibility',e.target.value)}/>}
 {data.canEdit&&<button type="button" disabled={disabled||!drafts[item.itemKey]} onClick={()=>save(item)}>Save changes</button>}
 {drafts[item.itemKey]&&<span className="site-execution-note">Unsaved changes</span>}
 {completed&&<p className="site-execution-note">{view==='execution'?record.installedAt:record.snagClosedAt}</p>}</td></tr>})}{!shown.length&&<tr><td colSpan={visible.length+4}>{items.length===0?'Save product selections in Product Assessment to populate this sheet.':<>No {completed?'completed':'open'} {view==='execution'?'circuits':'snags'} match this view.</>}</td></tr>}</tbody></table></div></div>{shown.length>limit&&<button type="button" onClick={()=>setLimit(v=>v+100)}>Show next 100 rows</button>}<p className="site-execution-note">Technical values stay in the linked workbook. Execution updates are saved separately in the backend sheet. Drive photos retain their existing sharing permissions.</p></section>;
}
