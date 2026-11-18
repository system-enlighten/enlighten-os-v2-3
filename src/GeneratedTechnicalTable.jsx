import React,{useEffect,useMemo,useRef,useState} from 'react';
import './TechnicalDocumentation.css';
import source from './technical-documentation.json';
import icons from './technical-icon-map.json';
import {buildColumnTable,technicalZoneSections,technicalPrintPages} from './technical-column-logic.mjs';
import {loadApplications} from './application-library.js';
const layers=['Fill','Focused','Decorative','Unclassified'];
const framing=m=>({width:'100%',height:'100%',objectFit:'cover',objectPosition:`${m.x??50}% ${m.y??50}%`,transform:`scale(${m.zoom||1})`,transformOrigin:`${m.x??50}% ${m.y??50}%`});
function TechnicalMedia({media,request,projectId,style,alt}){
 const [url,setUrl]=useState(''),[failed,setFailed]=useState(false);
 useEffect(()=>{let live=true;setFailed(false);setUrl(media.driveFileId?'':media.url);if(media.driveFileId)request('getTechnicalProjectImage',{projectId,fileId:media.driveFileId},'POST',90000).then(r=>live&&setUrl(r.url)).catch(()=>live&&setFailed(true));return()=>{live=false}},[media.url,media.driveFileId,projectId]);
 return failed?<span>Image unavailable. Choose another image.</span>:url?<img src={url} alt={alt||media.label||'Project image'} style={style} onError={()=>setFailed(true)}/>:<span>Loading image…</span>;
}
function FixtureImage({url,onMissing,cn}){return <img src={icons[url]||url} alt={`Fixture for ${cn}`} onError={onMissing} style={{maxWidth:'100%',maxHeight:'90pt'}}/>}
export default function GeneratedTechnicalTable({projectId,request,canEdit}){
 const [data,setData]=useState(null),[zones,setZones]=useState([]),[products,setProducts]=useState([]),[busy,setBusy]=useState(false),[error,setError]=useState(''),[dirty,setDirty]=useState(false),[picker,setPicker]=useState(null),[options,setOptions]=useState([]),[query,setQuery]=useState(''),[lighting,setLighting]=useState('All'),[fit,setFit]=useState(true),[width,setWidth]=useState(1200),[missingIcons,setMissingIcons]=useState({});
 const host=useRef(null),generation=useRef(0),imageCache=useRef(new Map());
 const imageRequest=(action,p,...rest)=>{const key=p.projectId+'|'+p.fileId;if(!imageCache.current.has(key))imageCache.current.set(key,request(action,p,...rest).catch(e=>{imageCache.current.delete(key);throw e}));return imageCache.current.get(key)};
 useEffect(()=>{const observer=new ResizeObserver(e=>setWidth(e[0].contentRect.width));if(host.current)observer.observe(host.current);return()=>observer.disconnect()},[]);
 useEffect(()=>{
  let live=true;++generation.current;imageCache.current.clear();setData(null);setZones([]);setProducts([]);setDirty(false);setPicker(null);setLighting('All');setMissingIcons({});setError('');setBusy(false);if(!projectId)return;setBusy(true);
  Promise.all([request('getTechnicalDocumentation',{projectId},'POST',90000),request('listFloorZones',{projectId},'POST',90000),fetch('/technical-library/database.json').then(r=>{if(!r.ok)throw Error('Product Database could not load');return r.json()}),request('listTechnicalFittings',{},'GET',90000)]).then(([d,z,seed,updates])=>{
   if(!live)return;const map=new Map(seed.fittings.map(p=>[p.id,p]));updates.forEach(p=>map.set(p.id,{...map.get(p.id),...p}));setData(d);setZones(z);setProducts([...map.values()]);
  }).catch(e=>live&&setError(e.message)).finally(()=>live&&setBusy(false));return()=>{live=false;++generation.current};
 },[projectId]);
 const calculated=useMemo(()=>buildColumnTable(data||{},zones,products),[data,zones,products]);
 const visibleRows=calculated.rows.filter(row=>lighting==='All'||row.lighting===lighting);
 const sections=technicalZoneSections(visibleRows),printPages=technicalPrintPages(visibleRows,6);
 const edit=(id,patch)=>{setData(d=>({...d,overrides:{...d.overrides,[id]:{...d.overrides?.[id],...patch}}}));setDirty(true)};
 async function save(){const n=generation.current;setBusy(true);setError('');try{const d=await request('saveTechnicalDocumentation',{projectId,headers:data.headers,rows:data.rows,rules:{},overrides:data.overrides||{},expectedVersion:data.version},'POST',150000);if(n===generation.current){setData(d);setDirty(false)}}catch(e){if(n===generation.current)setError(e.message)}finally{if(n===generation.current)setBusy(false)}}
 async function projectImages(){const list=[];let offset=0;do{const r=await request('listProjectDrive',{projectId,category:'Received',offset},'POST',90000);list.push(...r.entries.filter(e=>e.kind==='file'&&(/^image\//.test(e.mimeType)||/\.(png|jpe?g|webp)$/i.test(e.name))).map(e=>({id:e.id,driveFileId:e.id,label:e.name,url:`https://drive.google.com/thumbnail?id=${encodeURIComponent(e.id)}&sz=w1600`})));offset=r.nextOffset;}while(offset!==null&&offset!==undefined&&offset<10000);return list}
 async function choose(row,kind){
  const n=generation.current;setError('');setOptions([]);setQuery('');setPicker({id:row.id,cn:row.cn,kind,media:row.override[kind]||null,loading:true,uploading:false,error:''});
  try{
   let list;if(kind==='reference'){const r=await loadApplications(request);if(r.warning)throw Error(r.warning);list=r.records.map(r=>({id:r.id,label:[r.title,r.category,r.fittingType].filter(Boolean).join(' · '),url:r.imageUrl}));}
   else if(kind==='fixture'){const map=new Map();products.filter(p=>p.iconUrl).forEach(p=>map.set(p.iconUrl,{id:p.id,label:p.fittingType,url:icons[p.iconUrl]||p.iconUrl}));list=[...map.values()];}
   else list=await projectImages();
   if(n===generation.current){setOptions(list.filter(m=>m.url));setPicker(p=>p?{...p,loading:false}:null)}
  }catch(e){if(n===generation.current)setPicker(p=>p?{...p,error:e.message,loading:false}:null)}
 }
 async function uploadFixture(file){
  if(!file)return;const n=generation.current;setPicker(p=>({...p,uploading:true,error:''}));
  try{if(file.size>3*1024*1024)throw Error('Use a PNG, JPEG or WebP smaller than 3 MB.');const base64=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result).split(',')[1]);reader.onerror=()=>reject(Error('Image could not be read.'));reader.readAsDataURL(file)});if(n!==generation.current)return;
   const media=await request('uploadTechnicalFixtureImage',{projectId,name:file.name,base64},'POST',120000);if(n===generation.current)setPicker(p=>p?{...p,media:{...media,zoom:1,x:50,y:50},uploading:false}:null);
  }catch(e){if(n===generation.current)setPicker(p=>p?{...p,error:e.message,uploading:false}:null)}
 }
 const sheet=source.table,widths=[...sheet.widths,150],total=widths.reduce((a,b)=>a+b,0)*4/3,scale=fit?Math.max(.1,Math.min(1,(width-32)/total)):1;
 const cell=(i,header=false)=>{const c=sheet.cells[header?0:2][Math.min(i,11)];return {border:'0.5pt solid #777',padding:'4pt',fontFamily:c.font?.includes('Founders')?'TechnicalFounders':'TechnicalHelvetica',fontSize:c.size+'pt',fontWeight:c.bold?600:400,textAlign:c.align||'left',verticalAlign:'middle',whiteSpace:'pre-wrap',overflowWrap:'anywhere',background:header?'#bff81c':i===0?'#e5e5e5':'white',color:'#000'}};
 const picture=(row,kind,print=false)=>{
  const selected=row.override[kind],fixture=kind==='fixture',icon=fixture&&row.icon&&!missingIcons[row.id];
  const content=selected?.url?<TechnicalMedia media={selected} request={imageRequest} projectId={projectId} style={fixture?{width:'100%',height:'100%',objectFit:'contain'}:framing(selected)}/>:icon?<FixtureImage url={row.icon} cn={row.cn} onMissing={()=>setMissingIcons(m=>({...m,[row.id]:true}))}/>:print||!canEdit?'':fixture?'Add image':'Select image';
  if(print)return <div style={{height:fixture?'90pt':'110pt',overflow:'hidden'}}>{content}</div>;
  return <button type="button" aria-label={`${fixture?'Add or change fixture':kind==='image3d'?'Choose 3D':'Choose reference'} image for ${row.cn}`} disabled={!canEdit||busy} onClick={()=>choose(row,kind)} style={{border:0,padding:0,width:'100%',height:fixture?'90pt':'110pt',overflow:'hidden',background:'transparent',color:'#555',font:'inherit',cursor:canEdit?'pointer':'default'}}>{content}</button>;
 };
 const rowCells=(row,print)=>[
  row.cn,picture(row,'fixture',print),row.code,row.application,picture(row,'image3d',print),picture(row,'reference',print),row.object,
  canEdit&&!print?<textarea aria-label={`CMF for ${row.cn}`} value={row.cmf} maxLength={2000} disabled={busy} onChange={e=>edit(row.id,{cmf:e.target.value})} style={{font:'inherit',width:'100%',minHeight:'65pt',resize:'vertical',border:'1px dashed #bbb',background:'transparent'}}/>:row.cmf,
  row.height,row.illuminance,row.quantity,
  print?row.lighting:<select aria-label={`Lighting category for ${row.cn}`} value={row.lighting} disabled={!canEdit||busy} onChange={e=>edit(row.id,{lighting:e.target.value})} style={{maxWidth:'100%',padding:'4pt',fontFamily:'TechnicalHelvetica',fontSize:'12pt',background:'white',border:'0.5pt solid #777'}}>{layers.map(v=><option key={v} value={v}>{v}</option>)}</select>
 ];
 const table=(groups,print=false)=><table aria-label={print?'Printable Technical Table':'Calculated Technical Table'} style={{zoom:print?1:scale,tableLayout:'fixed',borderCollapse:'collapse',width:widths.reduce((a,b)=>a+b,0)+'pt'}}><colgroup>{widths.map((w,i)=><col key={i} style={{width:w+'pt'}}/>)}</colgroup><thead><tr style={{height:sheet.heights[0]+'pt'}}>{[...sheet.cells[0].map(c=>c.text),'CATEGORY'].map((name,i)=><th key={i} style={cell(i,true)}>{name}</th>)}</tr></thead>{groups.map((group,groupIndex)=><tbody key={group.id} data-zone={group.code}>
  {groupIndex>0&&<tr className="technical-zone-divider" aria-hidden="true"><td colSpan={13} style={{height:'26pt',padding:0,background:'#000',border:'0.5pt solid #000'}}/></tr>}
  {group.sections.map((section,sectionIndex)=><React.Fragment key={section.label}>
   <tr className="technical-category-band">{sectionIndex===0&&<td rowSpan={group.rowSpan} style={cell(0)}>{group.label}</td>}<th scope="rowgroup" colSpan={12} style={{...cell(1),height:'26pt',background:'#e5e5e5',color:'#142238',textAlign:'left',padding:'4pt 10pt',fontWeight:600}}>{section.label}</th></tr>
   {section.rows.map(row=><tr key={row.id} data-circuit={row.cn} style={{height:sheet.heights[2]+'pt'}}>{rowCells(row,print).map((value,index)=><td key={index} style={cell(index+1)}>{value||'\u00a0'}</td>)}</tr>)}
  </React.Fragment>)}
 </tbody>)}</table>;
 return <div ref={host} className="generated-technical-document">
  {!projectId?<p>Select a project to generate its Technical Table.</p>:<>
   <div className="technical-controls">{error&&<p role="alert" style={{color:'#a23424'}}>{error}</p>}{busy&&<p role="status">Loading or saving technical documentation…</p>}</div>
   {data&&<><div className="technical-controls" style={{display:'flex',gap:12,alignItems:'center',margin:'14px 0'}}><button onClick={()=>setFit(x=>!x)}>{fit?'View at 100%':'Fit to width'}</button>{canEdit&&<button disabled={busy||!dirty} onClick={save}>Save table edits</button>}<span>{visibleRows.length} of {calculated.rows.length} circuits · {Math.round(scale*100)}%{dirty?' · Unsaved changes':''}</span><label style={{marginLeft:'auto',display:'flex',gap:8,alignItems:'center'}}>Lighting view<select aria-label="Filter lighting type" value={lighting} onChange={e=>setLighting(e.target.value)} style={{padding:'9px 14px',background:'#fff',border:'1px solid #1b3553',color:'#142238'}}>{['All',...layers].map(value=><option key={value} value={value}>{value} ({value==='All'?calculated.rows.length:calculated.rows.filter(r=>r.lighting===value).length})</option>)}</select></label></div>
    <div className="technical-controls"><p>Generated automatically from Output. Save image, CMF and category edits before leaving this tab.</p>{calculated.warnings.length>0&&<details><summary>{calculated.warnings.length} items need review</summary><ul>{calculated.warnings.map(w=><li key={w}>{w}</li>)}</ul></details>}</div>
    <div className="technical-screen-table" style={{overflow:'auto',background:'#fff',padding:16,border:'1px solid #ded8ca',marginTop:14}}>{table(sections)}{!visibleRows.length&&<p>{calculated.rows.length?'No circuits match this lighting filter.':'Upload Output to generate circuit rows.'}</p>}</div>
    <div className="technical-print-pages">{printPages.map((groups,i)=><section className="technical-print-page" key={i}>{table(groups,true)}</section>)}</div>
   </>}
  </>}
  {picker&&<div role="dialog" aria-modal="true" aria-label="Choose and frame image" className="technical-controls" style={{position:'fixed',inset:0,zIndex:2000,background:'#0008',display:'grid',placeItems:'center'}}><div style={{background:'#f5f1e8',padding:24,width:'min(960px,94vw)',maxHeight:'90vh',overflow:'auto'}}>
   <h2>{picker.kind==='fixture'?'Fixture image':picker.kind==='reference'?'Application reference':'Project 3D image'}</h2>
   {picker.kind==='fixture'?<label>Upload fixture image <input type="file" accept="image/png,image/jpeg,image/webp" disabled={picker.uploading} onChange={e=>{uploadFixture(e.target.files?.[0]);e.target.value=''}}/></label>:<p>{picker.kind==='image3d'?'Choose an image uploaded to this project’s Received folder.':'Choose the closest application reference manually.'}</p>}
   {picker.error&&<p role="alert" style={{color:'#a23424'}}>{picker.error}</p>}{picker.uploading&&<p role="status">Uploading image to project Drive…</p>}
   <input aria-label="Search images" placeholder="Search images" value={query} onChange={e=>setQuery(e.target.value)}/>
   {picker.loading?<p>Loading images…</p>:<div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(140px,1fr))',gap:12,maxHeight:260,overflow:'auto',marginTop:12}}>{options.filter(m=>m.label.toLowerCase().includes(query.toLowerCase())).map(m=><button key={m.id} disabled={picker.uploading} onClick={()=>setPicker(p=>({...p,media:{...m,zoom:1,x:50,y:50}}))}><img src={m.url} alt="" style={{width:'100%',height:90,objectFit:'contain'}}/><span>{m.label}</span></button>)}</div>}
   {!picker.loading&&!options.length&&<p>{picker.kind==='fixture'?'Upload an image for this fixture.':'No images available in this source.'}</p>}
   {picker.media&&<><div style={{width:300,height:150,overflow:'hidden',border:'1px solid #bbb',margin:'16px auto'}}><TechnicalMedia media={picker.media} request={imageRequest} projectId={projectId} alt="Selected image framing" style={picker.kind==='fixture'?{width:'100%',height:'100%',objectFit:'contain'}:framing(picker.media)}/></div>{picker.kind!=='fixture'&&[['zoom','Zoom',1,5,.05],['x','Horizontal position',0,100,1],['y','Vertical position',0,100,1]].map(([k,label,min,max,step])=><label key={k} style={{display:'block'}}>{label}<input type="range" min={min} max={max} step={step} value={picker.media[k]??50} onChange={e=>{const value=Number(e.target.value);setPicker(p=>({...p,media:{...p.media,[k]:value}}))}}/></label>)}</>}
   <div style={{display:'flex',gap:12,marginTop:16}}><button disabled={picker.uploading} onClick={()=>setPicker(null)}>Cancel</button><button disabled={!picker.media||picker.uploading||picker.loading} onClick={()=>{edit(picker.id,{[picker.kind]:picker.media});setPicker(null)}}>Use image</button><button disabled={picker.uploading} onClick={()=>{edit(picker.id,{[picker.kind]:null});setPicker(null)}}>Clear image</button></div>
  </div></div>}
 </div>;
}
