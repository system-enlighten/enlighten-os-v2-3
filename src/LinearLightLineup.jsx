import React,{useEffect,useMemo,useRef,useState} from 'react';
import {linearCatalogue,linearApplications,catalogueLinearGroups} from './linear-lineup.mjs';
import './LinearLightLineup.css';
import LinearApplicationPicker from './LinearApplicationPicker.jsx';
import ProductSpecSheet from './ProductSpecSheet.jsx';
export default function LinearLightLineup({database,catalogue,onAddProduct,onSaveFitting,onUpload,request,admin=false}){
 const [spec,setSpec]=useState(null);
 const [variantEdit,setVariantEdit]=useState(null);
 const [newApplication,setNewApplication]=useState(null),[dragged,setDragged]=useState(null),[dropTarget,setDropTarget]=useState(null);
 const [assignReference,setAssignReference]=useState(null),[assignIds,setAssignIds]=useState([]);
 const [referenceLinked,setReferenceLinked]=useState(false);
 const captionPending=useRef(new Set());
 const [pendingCaptions,setPendingCaptions]=useState([]),[captionFailures,setCaptionFailures]=useState({}),[captionReady,setCaptionReady]=useState(false);
 const [layout,setLayout]=useState(null),[editRows,setEditRows]=useState(false),[checked,setChecked]=useState([]),[move,setMove]=useState(null),[destination,setDestination]=useState(''),[productMenu,setProductMenu]=useState(null);
 useEffect(()=>{let live=true;request('getLinearApplicationLayout',{},'POST',90000).then(data=>{if(live)setLayout(data)}).catch(e=>{if(live)setError(e.message)});return()=>{live=false}},[request]);
 const [links,setLinks]=useState([]),[addGroup,setAddGroup]=useState(null),[existing,setExisting]=useState(''),[target,setTarget]=useState(''),[referenceKey,setReferenceKey]=useState(''),[linkedIds,setLinkedIds]=useState([]),[codes,setCodes]=useState({}),[linkError,setLinkError]=useState('');
 useEffect(()=>{let live=true;request('listLinearProductLinks',{},'POST',90000).then(rows=>{if(live)setLinks(rows)}).catch(e=>{if(live)setError(e.message)});return()=>{live=false}},[request]);
 const [source,setSource]=useState(null),[error,setError]=useState(''),[application,setApplication]=useState(''),[query,setQuery]=useState(''),[captions,setCaptions]=useState({}),[editing,setEditing]=useState(null),[saving,setSaving]=useState(false),[captionError,setCaptionError]=useState('');
 useEffect(()=>{let live=true;fetch('/technical-library/linear/lineup.json').then(r=>{if(!r.ok)throw Error('Linear light applications could not load.');return r.json()}).then(d=>{if(live)setSource(d)}).catch(e=>{if(live)setError(e.message)});return()=>{live=false}},[]);
 useEffect(()=>{let live=true;request('getLinearApplicationCaptions',{},'POST',90000).then(rows=>{if(live){setCaptions(Object.fromEntries(rows.map(r=>[r.applicationId,r.caption])));setCodes(Object.fromEntries(rows.map(r=>[r.applicationId,r.code||''])));setCaptionReady(true)}}).catch(e=>{if(live)setError(e.message)});return()=>{live=false}},[request]);
 const groups=useMemo(()=>{
  const original=source?.groups||[];
  const sizes=new Map();
  for(const section of catalogue?.sections||[]){if(section.codeRow-1<=section.photoRow)continue;for(const [column,cell] of (catalogue.rows[section.codeRow]||[]).entries()){const fitting=database.find(f=>f.id===cell.fittingId);const size=catalogue.rows[section.codeRow-1]?.[column]?.text;if(fitting&&size)sizes.set(fitting.fittingType,size)}}
  const enriched=original.map(g=>({...g,products:g.products.map(p=>({...p,note:sizes.get(p.code)||p.note}))}));
  return linearCatalogue([...enriched,...catalogueLinearGroups(catalogue,database,original)],database);
 },[source,database,catalogue]);
 const allProducts=database.flatMap(fitting=>(fitting.products||[]).map(product=>({fitting,product})));
 const groupCode=g=>{const original=groups.find(row=>row.id===g.id)||g;const codes=[...new Set(original.products.map(p=>p.code))];return codes.length===1&&groups.filter(row=>row.products.some(p=>p.code===codes[0])).length===1?codes[0]:g.id.toUpperCase()};
 const allApplications=useMemo(()=>[...linearApplications(groups.map(g=>g.applications.length?g:{...g,applications:[{column:0,url:""}]}),captions),...(layout?.customApplications||[]).map(a=>({...a,caption:captions[a.id]??a.caption}))],[groups,captions,layout?.customApplications]);
 const imageIdentity=url=>{const match=String(url||"").match(/(?:catalogue-)?([a-f0-9]{16})(?:[a-f0-9]{4})?\.png$/i);return match?match[1]:url;};
 const iconOwners=new Map(),canonicalIds=new Map(),variantIcons=new Map();
 // Explicit families from the source catalogue, including differing optics suffixes.
 const colourFamilies=[
  {number:'001',cells:['80-1','80-2']},
  {number:'023',cells:['42-1','42-2','42-3','42-4']},
  {number:'034',cells:['45-1','45-2','47-1','47-2'],slots:[1,2,1,2]},
  {number:'036',cells:['69-1','69-2','69-3','69-4']},
  {number:'037',cells:['69-5','69-6','69-7','69-8']},
  {number:'039',cells:['69-9','69-10','69-11','69-12']},
  {number:'040',cells:['69-13','69-14','69-15','69-16']},
  {number:'042',cells:['72-1','72-2','72-3','72-4']},
  {number:'043',cells:['72-5','72-6','72-7','72-8']},
  {number:'044',cells:['72-9','72-10','72-11','72-12']},
  {number:'045',cells:['72-13','72-14','72-15','72-16']},
 ];
 const familyByImage=new Map(),familyByCell=new Map(),catalogueFamilyIcons=new Map();
 for(const family of colourFamilies){
  family.cells.forEach((cell,index)=>{
   const [row,col]=cell.split('-').map(Number);
   const section=catalogue?.sections?.find(s=>s.codeRow===row);
   const url=section&&catalogue.rows[section.iconRow]?.[col]?.image;
   const info={number:family.number,slot:family.slots?.[index]||index+1};
   familyByCell.set('catalogue-'+cell,info);
   if(url){if(!catalogueFamilyIcons.has(family.number))catalogueFamilyIcons.set(family.number,new Map());catalogueFamilyIcons.get(family.number).set(info.slot,url);}
   if(url&&!familyByImage.has(imageIdentity(url)))familyByImage.set(imageIdentity(url),info);
  });
 }
 const familyOwners=new Map(),familyNumbers=new Map();
 const variantInfo=a=>familyByCell.get(a.groupId)||familyByImage.get(imageIdentity(a.url));
 const applications=allApplications.filter(a=>{
  if(layout?.deleted.includes(a.id))return false;
  const info=variantInfo(a),image=imageIdentity(a.url);
  if(info){
   const owner=familyOwners.get(info.number)||iconOwners.get(image);
   if(owner){canonicalIds.set(a.id,owner);if(!variantIcons.has(owner))variantIcons.set(owner,new Map());if(a.url&&!variantIcons.get(owner).has(info.slot))variantIcons.get(owner).set(info.slot,a.url);familyOwners.set(info.number,owner);familyNumbers.set(owner,info.number);return false;}
   familyOwners.set(info.number,a.id);familyNumbers.set(a.id,info.number);variantIcons.set(a.id,new Map([[info.slot,a.url]]));
   if(a.url)iconOwners.set(image,a.id);return true;
  }
  if(a.url&&iconOwners.has(image)){canonicalIds.set(a.id,iconOwners.get(image));return false;}
  if(a.url)iconOwners.set(image,a.id);return true;
 });
 // Reserve every variant illustration globally, so aliases never get another row.
 for(const a of allApplications){const info=variantInfo(a);if(info&&familyOwners.has(info.number)&&!layout?.deleted.includes(a.id)){const owner=familyOwners.get(info.number);if(a.id!==owner)canonicalIds.set(a.id,owner);}}
 for(const [number,owner] of familyOwners){const icons=variantIcons.get(owner);for(const [slot,url] of catalogueFamilyIcons.get(number)||[])if(!icons.get(slot))icons.set(slot,url);}
 const iconsFor=a=>{
  const icons=new Map(variantIcons.get(a.id)||[[variantInfo(a)?.slot||1,a.url]]);
  for(const [slot,url] of Object.entries(layout?.variantIcons?.[a.id]||{}))icons.set(Number(slot),url);
  return [...icons].filter(([,url])=>url).sort((a,b)=>b[0]-a[0]).filter((entry,i,all)=>all.findIndex(x=>imageIdentity(x[1])===imageIdentity(entry[1]))===i);
 };
 const orderIndex=new Map((layout?.order||[]).map((id,i)=>[id,i]));
 applications.sort((a,b)=>(orderIndex.get(a.id)??Infinity)-(orderIndex.get(b.id)??Infinity));
 const applicationCode=a=>codes[a.id]||a.code||familyNumbers.get(a.id)||groupCode(groups.find(g=>g.id===a.groupId));
 const choices=applications.map(a=>({id:a.id,label:a.caption||groups.find(g=>g.id===a.groupId)?.label||'Application',code:applicationCode(a),url:a.url}));
 const expandIds=ids=>[...new Set(ids.flatMap(id=>id.includes(':')?[id]:allApplications.filter(a=>a.groupId===id).map(a=>a.id)))];
 const memberships=item=>expandIds(item.product.linearApplicationIds??groups.filter(g=>g.products.some(p=>p.fitting?.id===item.fitting.id)||links.some(l=>l.applicationId===g.id&&l.fittingId===item.fitting.id&&l.productId===item.product.id)).map(g=>g.id).concat(links.filter(l=>l.fittingId===item.fitting.id&&l.productId===item.product.id).map(l=>l.applicationId))).map(id=>canonicalIds.get(id)||id).filter((id,i,ids)=>!layout?.deleted.includes(id)&&ids.indexOf(id)===i);
 const references=groups.flatMap(g=>g.products.map((p,index)=>({...p,image:layout?.images?.[g.id+':'+index]||p.image,sourceGroup:g.id,key:g.id+':'+index,refKey:p.code+':'+(p.column??index),ids:layout?.references[g.id+':'+index]??allApplications.filter(a=>a.groupId===g.id).map(a=>a.id)})));
 const rows=applications.map(a=>{
  const candidates=references.filter(p=>(p.ids.includes(a.id)||(Object.prototype.hasOwnProperty.call(layout?.references||{},p.key)&&p.ids.some(id=>canonicalIds.get(id)===a.id)))&&(p.image||p.fitting?.thumbnailUrl));
  const explicit=candidates.filter(p=>Object.prototype.hasOwnProperty.call(layout?.references||{},p.key));
  const defaults=candidates.filter(p=>!Object.prototype.hasOwnProperty.call(layout?.references||{},p.key));
  const fallback=familyNumbers.has(a.id)?references.find(p=>!Object.prototype.hasOwnProperty.call(layout?.references||{},p.key)&&p.ids.some(id=>canonicalIds.get(id)===a.id)&&(p.image||p.fitting?.thumbnailUrl)):null;
  const products=[...(defaults.length?defaults.slice(0,1):fallback?[fallback]:[]),...explicit].filter((p,i,all)=>all.findIndex(x=>imageIdentity(x.image||x.fitting?.thumbnailUrl)===imageIdentity(p.image||p.fitting?.thumbnailUrl))===i);
  return {...groups.find(g=>g.id===a.groupId),label:a.caption||groups.find(g=>g.id===a.groupId)?.label||"Application",id:a.id,app:a,products};
 });
 const usedImages=new Set(rows.flatMap(g=>g.products.map(p=>imageIdentity(p.image||p.fitting?.thumbnailUrl))));
 const unassigned=references.filter(p=>{const image=p.image||p.fitting?.thumbnailUrl;return image&&!usedImages.has(imageIdentity(image));}).filter((p,i,all)=>all.findIndex(x=>imageIdentity(x.image||x.fitting?.thumbnailUrl)===imageIdentity(p.image||p.fitting?.thumbnailUrl))===i);

 const openLink=(g,ref="",item=null)=>{setAddGroup(g);setReferenceKey(ref);setReferenceLinked(Boolean(ref&&item));setExisting(item?String(allProducts.findIndex(x=>x.fitting.id===item.fitting.id&&x.product.id===item.product.id)):"");setLinkedIds(item?[...new Set([...memberships(item),g.id])]:[g.id]);setLinkError("");setTarget((g.products.find(p=>p.fitting)||groups.find(row=>row.id===g.app?.groupId)?.products.find(p=>p.fitting))?.fitting.id||"");};
 const selected=applications.find(a=>a.id===application);
 const saveLayout=async next=>{setSaving(true);setError('');try{setLayout(await request('saveLinearApplicationLayout',{...next,expectedVersion:layout.version},'POST',90000));return true;}catch(e){setError(e.message);return false;}finally{setSaving(false);}};
 const reorder=async (from,to)=>{
  if(saving||from===to)return;
  const ids=applications.map(a=>a.id),start=ids.indexOf(from),end=ids.indexOf(to);
  if(start<0||end<0)return;
  ids.splice(start,1);ids.splice(end,0,from);
  await saveLayout({...layout,order:ids});
 };
 const createApplication=async e=>{
  e.preventDefault();if(!newApplication?.file||saving)return;
  setSaving(true);setError('');
  try{
   const code=newApplication.code.trim(),caption=newApplication.caption.trim();
   if(!caption||!code)throw Error('Enter a caption and code.');
   if(applications.some(a=>applicationCode(a).toUpperCase()===code.toUpperCase()))throw Error('This application code already exists.');
   const asset=await onUpload(newApplication.file);
   if(!asset?.url)throw Error('Image upload failed.');
   const id='custom-'+Date.now()+'-'+Math.random().toString(36).slice(2,8)+':0';
   if(await saveLayout({...layout,customApplications:[...(layout.customApplications||[]),{id,caption,code,url:asset.url}],order:[...applications.map(a=>a.id),id]}))setNewApplication(null);
  }catch(e){setError(e.message);}finally{setSaving(false);}
 };
 const deleteRows=async ids=>{
  if(ids.some(id=>allProducts.some(item=>memberships(item).includes(id)&&!memberships(item).some(other=>!ids.includes(other))))){setError('Move products to another application before deleting these rows.');return;}
  if(!window.confirm('Delete '+ids.length+' selected application rows?'))return;
  if(await saveLayout({...layout,deleted:[...new Set([...layout.deleted,...ids,...[...canonicalIds].filter(([,owner])=>ids.includes(owner)).map(([id])=>id)])]})){setChecked([]);if(ids.includes(application))setApplication('');}
 };
 const moveProduct=async()=>{if(!destination||!move)return;
  if(move.reference){const p=move.reference;const ids=[...new Set([...p.ids.filter(id=>id!==move.row.id),destination])];if(move.item){setSaving(true);try{const {fitting,product}=move.item;const linked=[...new Set([...memberships(move.item).filter(id=>id!==move.row.id),destination])];await onSaveFitting({...fitting,products:fitting.products.map(v=>v.id===product.id?{...v,linearApplicationIds:linked}:v)});}catch(e){setError(e.message);setSaving(false);return;}}
  if(await saveLayout({...layout,references:{...layout.references,[p.key]:ids}}))setMove(null);}
  else{setSaving(true);setError('');try{const {fitting,product}=move.item;const ids=[...new Set([...memberships(move.item).filter(id=>id!==move.row.id),destination])];await onSaveFitting({...fitting,products:fitting.products.map(p=>p.id===product.id?{...p,linearApplicationIds:ids}:p)});setMove(null);}catch(e){setError(e.message)}finally{setSaving(false)}}
 };
 const openProduct=(row,item,reference=null)=>{if(admin)setProductMenu({row,item,reference});else if(item)setSpec(item);};
 async function saveCaption(e){
  e.preventDefault();
  const draft={...editing,caption:editing.caption.trim(),code:editing.code.trim()};
  const id=draft.id;
  if(!captionReady||captionPending.current.has(id))return;
  if(!draft.code){setCaptionError('Enter an application code.');return;}
  const previousCaption=captions[id],previousCode=codes[id];
  if(draft.caption===(previousCaption??editing.originalCaption)&&draft.code===(previousCode||editing.originalCode)){setEditing(null);return;}
  captionPending.current.add(id);
  setPendingCaptions(ids=>[...ids,id]);
  setCaptionFailures(old=>{const next={...old};delete next[id];return next;});
  setCaptions(old=>({...old,[id]:draft.caption}));
  setCodes(old=>({...old,[id]:draft.code}));
  setEditing(null);
  try{
   const result=await request('saveLinearApplicationCaption',{applicationId:id,caption:draft.caption,code:draft.code,expectedCaption:previousCaption??'',expectedCode:previousCode??''},'POST',90000);
   setCaptions(old=>({...old,[id]:result.caption}));
   setCodes(old=>({...old,[id]:result.code}));
  }catch(err){
   let savedCaption=previousCaption,savedCode=previousCode;
   try{const rows=await request('getLinearApplicationCaptions',{},'POST',90000);const saved=rows.find(row=>row.applicationId===id);savedCaption=saved?.caption;savedCode=saved?.code;}catch{}
   const restore=(old,value)=>{const next={...old};if(value===undefined)delete next[id];else next[id]=value;return next;};
   setCaptions(old=>restore(old,savedCaption));
   setCodes(old=>restore(old,savedCode));
   if(savedCaption!==draft.caption||savedCode!==draft.code)setCaptionFailures(old=>({...old,[id]:{draft,message:err.message||'Save failed'}}));
  }finally{
   captionPending.current.delete(id);
   setPendingCaptions(ids=>ids.filter(value=>value!==id));
  }
 }

 const searchText=query.trim().toLowerCase();
 const shown=rows.filter(g=>{
  if(selected&&g.id!==selected.id)return false;
  if(!searchText)return true;
  const words=[g.label,choices.find(a=>a.id===g.id)?.label,choices.find(a=>a.id===g.id)?.code,...g.products.flatMap(p=>[p.code,p.note,p.fitting?.category]),...allProducts.filter(item=>memberships(item).includes(g.id)).flatMap(({product})=>[product.brand,product.model,product.specs?.article,product.specs?.specSheet?.optics])];
  return words.filter(Boolean).join(' ').toLowerCase().includes(searchText);
 });
 const visibleProducts=allProducts.filter(item=>shown.some(g=>memberships(item).includes(g.id))).length;

 if(!source||!layout)return error?<p role="alert">{error}</p>:<p role="status">Loading linear light applications…</p>;
 if(spec)return <ProductSpecSheet product={spec.product} fitting={spec.fitting} onClose={()=>setSpec(null)}/>;
 return <section className="linear-lineup" aria-label="Linear lights by application">{error&&<p role="alert">{error}</p>}<header><h2>Linear lights · Applications</h2><p>Select an application illustration to view its product options.</p></header><div className="linear-filters"><label>Application-wise products<select value={application} onChange={e=>setApplication(e.target.value)}><option value="">All applications</option>{applications.map((a,i)=><option key={a.id} value={a.id}>{a.caption||`Application ${i+1}`}</option>)}</select></label><label>Search<input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Application code, product or brand"/></label><button type="button" onClick={()=>{setApplication('');setQuery('')}}>Clear filters</button></div><div className="linear-application-picker" aria-label="Application illustrations"><button type="button" aria-pressed={!application} onClick={()=>setApplication('')}>All applications</button>{applications.map((a,i)=><button key={a.id} type="button" aria-pressed={application===a.id} onClick={()=>setApplication(application===a.id?'':a.id)}>{a.url&&<img src={a.url} alt=""/>}<span>{a.caption||`Application ${i+1}`}</span></button>)}</div><div className="linear-save-status" role="status">{pendingCaptions.length>0&&<>Syncing {pendingCaptions.length} application edit{pendingCaptions.length===1?'':'s'}…</>}</div>{Object.entries(captionFailures).map(([id,failure])=><p role="alert" key={id}>Could not confirm save for {failure.draft.caption}: {failure.message} <button type="button" className="linear-row-action" onClick={()=>{setEditing({...failure.draft,originalCaption:captions[id],originalCode:codes[id]});setCaptionError('')}}>Review and retry</button></p>)}<p role="status">{shown.length} applications · {visibleProducts} manufacturer products</p><div className="linear-lineup-scroll"><table><thead><tr><th scope="col">Applications {admin&&<button type="button" className="linear-row-action" disabled={saving} onClick={()=>setNewApplication({caption:'',code:'',file:null})}>+ New application</button>}{admin&&<button className="linear-row-action" type="button" onClick={()=>{setEditRows(v=>!v);setChecked([])}}>{editRows?'Done':'Edit'}</button>}{editRows&&<button className="linear-row-action" disabled={!checked.length||saving} onClick={()=>deleteRows(checked)}>Delete selected ({checked.length})</button>}</th><th scope="col">Products</th></tr></thead><tbody>{shown.map(g=><tr key={g.id} className={dropTarget===g.id?'linear-drop-target':undefined} onDragOver={e=>{if(editRows&&dragged&&dragged!==g.id){e.preventDefault();setDropTarget(g.id)}}} onDrop={e=>{e.preventDefault();if(editRows&&dragged)reorder(dragged,g.id);setDragged(null);setDropTarget(null)}}>
 <td className="linear-application-cell">
  {editRows&&<div className="linear-row-delete"><button type="button" className="linear-drag-handle" draggable={!saving} title="Drag to reorder application" aria-label="Drag to reorder application" onDragStart={e=>{e.dataTransfer.effectAllowed='move';e.dataTransfer.setData('text/plain',g.id);setDragged(g.id)}} onDragEnd={()=>{setDragged(null);setDropTarget(null)}}>⠿</button><button type="button" className="linear-row-action" disabled={saving} onClick={()=>deleteRows([g.id])}>Delete</button></div>}
  <div className="linear-application-stack">
   {editRows&&<div className="linear-row-controls"><input type="checkbox" aria-label={"Select "+(g.app.caption||g.label)} checked={checked.includes(g.id)} onChange={e=>setChecked(old=>e.target.checked?[...old,g.id]:old.filter(id=>id!==g.id))}/></div>}
   <button className="linear-application-icon" type="button" disabled={!captionReady||pendingCaptions.includes(g.id)} onClick={()=>{setEditing({...g.app,caption:g.app.caption||g.label||'',code:applicationCode(g.app),originalCaption:g.app.caption||g.label||'',originalCode:applicationCode(g.app)});setCaptionError('')}}>
    <span className="linear-application-image linear-variant-icons">{iconsFor(g.app).map(([slot,url])=><img key={slot} src={url} loading="lazy" alt=""/>)}</span>
    <span className="linear-application-caption"><strong>{g.app.caption||g.label||'Application'}</strong><small>{applicationCode(g.app)}</small></span>
   </button>
   {admin&&editRows&&<button className="linear-variant-add" type="button" aria-label="Add application icon" disabled={saving} onClick={()=>setVariantEdit({app:g.app,slot:'',file:null})}>+</button>}
  </div>
 </td>
 <td><div className="linear-products">{g.products.map((p,j)=>{
  const fitting=p.fitting;
  const reference=p.image||fitting?.thumbnailUrl;
  const refKey=p.refKey;
  const linked=links.find(l=>l.applicationId===g.id&&l.referenceKey===refKey)||links.find(l=>(l.applicationId===p.sourceGroup||l.applicationId.split(":")[0]===p.sourceGroup)&&l.referenceKey===refKey);
  const linkedItem=linked&&allProducts.find(x=>x.fitting.id===linked.fittingId&&x.product.id===linked.productId);

  return <div className="linear-manufacturer-options" key={p.code+':'+j}>
   {reference&&<article className="linear-product-tile"><button type="button" onClick={()=>{if(admin)openLink(g,refKey,linkedItem);else if(linkedItem)setSpec(linkedItem)}} title={admin?"Link manufacturer product":"View specification"} aria-label={admin?"Link manufacturer product":"View specification"} disabled={!admin&&!linkedItem}><img src={reference} alt="Default product reference" loading="lazy"/></button></article>}

  </div>;
 })}{allProducts.filter(item=>memberships(item).includes(g.id)&&!g.products.some(p=>links.some(l=>(l.applicationId===g.id||l.applicationId===p.sourceGroup||l.applicationId.split(":")[0]===p.sourceGroup)&&l.referenceKey===p.refKey&&l.fittingId===item.fitting.id&&l.productId===item.product.id))).map(item=><article className="linear-product-tile" key={item.fitting.id+':'+item.product.id}><button type="button" aria-label={item.product.brand+" "+item.product.model} title={item.product.brand+" "+item.product.model} onClick={()=>openProduct(g,item)}>{item.product.imageUrl?<img src={item.product.imageUrl} alt=""/>:<span aria-hidden="true" style={{display:"grid",placeItems:"center",height:90,fontSize:28,color:"#a09b91"}}>▧</span>}</button></article>)}{admin&&<button type="button" className="linear-add-product" aria-label="Add manufacturer product" onClick={()=>{openLink(g)}}>+</button>}</div></td>
 </tr>)}{!selected&&unassigned.length>0&&<tr><td className="linear-application-cell"><div style={{textAlign:'right',padding:12,fontWeight:600}}>Unassigned Products</div></td><td><div className="linear-products">{unassigned.filter(p=>!searchText||[p.code,p.note,'unassigned products'].join(' ').toLowerCase().includes(searchText)).map(p=><article className="linear-product-tile" key={p.key}><button type="button" disabled={!admin} aria-label="Link image to applications" onClick={()=>{setAssignReference(p);setAssignIds([])}}><img src={p.image||p.fitting?.thumbnailUrl} alt="Unassigned product reference" loading="lazy"/></button></article>)}</div></td></tr>}</tbody></table></div>{!shown.length&&<p>No products match these filters.</p>}<small>Reference: {source.sourceSheet}.</small>{addGroup&&<div className="linear-caption-overlay"><form className="linear-manufacturer-dialog" role="dialog" aria-modal="true" aria-label="Add manufacturer product" onSubmit={async e=>{e.preventDefault();const item=allProducts[Number(existing)];if(existing===''||!item)return;setLinkError('');setSaving(true);try{await onSaveFitting({...item.fitting,products:item.fitting.products.map(p=>p.id===item.product.id?{...p,linearApplicationIds:linkedIds}:p)});if(referenceKey){const link=await request('saveLinearProductLink',{applicationId:addGroup.products.find(p=>p.refKey===referenceKey)?.sourceGroup||addGroup.id,fittingId:item.fitting.id,productId:item.product.id,referenceKey},'POST',90000);setLinks(old=>[...old.filter(l=>!(l.applicationId===link.applicationId&&l.referenceKey===referenceKey)),link]);}setAddGroup(null)}catch(err){setLinkError(err.message)}finally{setSaving(false)}}}><header className="linear-dialog-header"><h3>{referenceKey?'Link manufacturer product':'Add manufacturer product'}</h3><button type="button" className="linear-dialog-close" aria-label="Close dialog" disabled={saving} onClick={()=>setAddGroup(null)}>×</button></header><div className="linear-dialog-body">{referenceKey&&referenceLinked&&<div>{existing!==''&&allProducts[Number(existing)]&&<button type="button" disabled={saving} onClick={()=>{setSpec(allProducts[Number(existing)]);setAddGroup(null)}}>View specification</button>}<button type="button" disabled={saving} onClick={()=>{const reference=addGroup.products.find(p=>p.refKey===referenceKey);if(reference){setMove({row:addGroup,reference,item:existing!==''?allProducts[Number(existing)]:null});setDestination('');setAddGroup(null)}}}>Move to another application</button></div>}<label>Link existing product<select value={existing} onChange={e=>{setExisting(e.target.value);const item=allProducts[Number(e.target.value)];setLinkedIds(e.target.value!==''&&item?[...new Set([...memberships(item),addGroup.id])]:[addGroup.id])}}><option value="">Choose product</option>{allProducts.map((x,i)=><option key={i} value={String(i)}>{x.product.brand} {x.product.model} · {x.fitting.fittingType}</option>)}</select></label>{(!referenceKey||referenceLinked)&&<LinearApplicationPicker choices={choices} selected={linkedIds} onChange={setLinkedIds} disabled={saving}/>} {linkError&&<p role="alert">{linkError}</p>}<div className="linear-dialog-actions"><button className="linear-dialog-primary" disabled={!existing||saving||(referenceKey&&!linkedIds.includes(addGroup.id))}>{referenceKey&&!referenceLinked?'Link existing product':'Save product links'}</button></div>{referenceKey&&<section className="linear-dialog-new"><label>Change default image<input type="file" accept="image/png,image/jpeg,image/webp" disabled={saving} onChange={async e=>{const file=e.target.files?.[0];if(!file)return;setSaving(true);setLinkError('');try{const reference=addGroup.products.find(p=>p.refKey===referenceKey);if(!reference)throw Error('Reference image unavailable.');const asset=await onUpload(file);if(!asset?.url)throw Error('Image upload failed.');if(await saveLayout({...layout,images:{...layout.images,[reference.key]:asset.url}}))setAddGroup(null);else setLinkError('Could not save image. Refresh and try again.');}catch(err){setLinkError(err.message);}finally{setSaving(false)}}}/></label></section>}{!referenceKey&&<section className="linear-dialog-new"><label>Add new product for<select value={target} onChange={e=>setTarget(e.target.value)}><option value="">Choose fitting</option>{[...new Map([...addGroup.products,...(groups.find(g=>g.id===addGroup.app?.groupId)?.products||[]),...(addGroup.app?.id.startsWith('custom-')?database.map(fitting=>({fitting,code:fitting.fittingType})):[])].filter(p=>p.fitting).map(p=>[p.fitting.id,p])).values()].map(p=><option key={p.fitting.id} value={p.fitting.id}>{p.code}</option>)}</select></label><button type="button" disabled={!target||saving||!linkedIds.includes(addGroup.id)} onClick={()=>{setAddGroup(null);onAddProduct(target,{choices,selected:linkedIds})}}>Add new product</button></section>}</div><footer className="linear-dialog-footer"><button type="button" disabled={saving} onClick={()=>setAddGroup(null)}>Cancel</button></footer></form></div>}
{variantEdit&&<div className="linear-caption-overlay"><form className="linear-manufacturer-dialog" role="dialog" aria-modal="true" aria-label="Add application icon" onSubmit={async e=>{e.preventDefault();setSaving(true);setError('');try{const asset=await onUpload(variantEdit.file);if(!asset?.url)throw Error('Image upload failed.');const id=variantEdit.app.id;if(await saveLayout({...layout,variantIcons:{...layout.variantIcons,[id]:{...layout.variantIcons?.[id],[variantEdit.slot]:asset.url}}}))setVariantEdit(null);}catch(e){setError(e.message)}finally{setSaving(false)}}}><header className="linear-dialog-header"><h3>Add application icon</h3></header><div className="linear-dialog-body"><label>Colour variant<select required value={variantEdit.slot} onChange={e=>setVariantEdit(v=>({...v,slot:e.target.value}))}><option value="">Select variant</option>{['Static Colour','Tunable White','Dim to Warm','RGBW'].map((label,i)=><option key={i} value={i+1}>{label}{iconsFor(variantEdit.app).some(([slot])=>slot===i+1)?' (replace icon)':''}</option>)}</select></label><label>Application icon<input type="file" required accept="image/png,image/jpeg,image/webp" onChange={e=>setVariantEdit(v=>({...v,file:e.target.files?.[0]}))}/></label>{error&&<p role="alert">{error}</p>}</div><footer className="linear-dialog-footer"><button type="button" disabled={saving} onClick={()=>setVariantEdit(null)}>Cancel</button><button className="linear-dialog-primary" disabled={saving||!variantEdit.slot||!variantEdit.file}>Save icon</button></footer></form></div>}
{newApplication&&<div className="linear-caption-overlay"><form className="linear-manufacturer-dialog" role="dialog" aria-modal="true" aria-label="New application" onSubmit={createApplication}><header className="linear-dialog-header"><h3>New application</h3></header><div className="linear-dialog-body"><label>Application icon<input type="file" accept="image/png,image/jpeg,image/webp" required disabled={saving} onChange={e=>setNewApplication(a=>({...a,file:e.target.files?.[0]}))}/></label><label>Application caption<input required maxLength={200} value={newApplication.caption} onChange={e=>setNewApplication(a=>({...a,caption:e.target.value}))}/></label><label>Application code<input required maxLength={100} placeholder="001" value={newApplication.code} onChange={e=>setNewApplication(a=>({...a,code:e.target.value}))}/></label>{error&&<p role="alert">{error}</p>}</div><footer className="linear-dialog-footer"><button type="button" disabled={saving} onClick={()=>setNewApplication(null)}>Cancel</button><button className="linear-dialog-primary" disabled={saving||!newApplication.file}>{saving?'Saving…':'Add application'}</button></footer></form></div>}
{assignReference&&<div className="linear-caption-overlay"><form className="linear-manufacturer-dialog" role="dialog" aria-modal="true" aria-label="Assign product image" onSubmit={async e=>{e.preventDefault();if(!assignIds.length)return;if(await saveLayout({...layout,references:{...layout.references,[assignReference.key]:assignIds}}))setAssignReference(null)}}><header className="linear-dialog-header"><h3>Link product image to applications</h3></header><div className="linear-dialog-body"><LinearApplicationPicker choices={choices} selected={assignIds} onChange={setAssignIds} disabled={saving}/>{error&&<p role="alert">{error}</p>}</div><footer className="linear-dialog-footer"><button type="button" onClick={()=>setAssignReference(null)} disabled={saving}>Cancel</button><button className="linear-dialog-primary" disabled={saving||!assignIds.length}>Link image</button></footer></form></div>}
{productMenu&&<div className="linear-caption-overlay"><form role="dialog" aria-modal="true" aria-label="Product actions"><h3>Product actions</h3>{productMenu.item&&<button type="button" onClick={()=>{setSpec(productMenu.item);setProductMenu(null)}}>View specification</button>}{productMenu.item&&<button type="button" onClick={()=>{openLink(productMenu.row,'',productMenu.item);setProductMenu(null)}}>Linked applications</button>}{productMenu.reference&&<button type="button" onClick={()=>{openLink(productMenu.row,productMenu.reference.refKey,productMenu.item);setProductMenu(null)}}>Link manufacturer product</button>}<button type="button" onClick={()=>{setMove(productMenu);setDestination('');setProductMenu(null)}}>Move to another application</button><button type="button" onClick={()=>setProductMenu(null)}>Cancel</button></form></div>}
{move&&<div className="linear-caption-overlay"><form role="dialog" aria-modal="true" aria-label="Move product" onSubmit={e=>{e.preventDefault();moveProduct()}}><h3>Move to another application</h3><label>Destination<select required value={destination} onChange={e=>setDestination(e.target.value)}><option value="">Select application</option>{choices.filter(a=>a.id!==move.row.id).map(a=><option key={a.id} value={a.id}>{a.label} · {a.code}</option>)}</select></label>{error&&<p role="alert">{error}</p>}<button disabled={saving||!destination}>Move product</button><button type="button" disabled={saving} onClick={()=>setMove(null)}>Cancel</button></form></div>}
{editing&&<div className="linear-caption-overlay" onKeyDown={e=>{if(e.key==='Escape'&&!saving)setEditing(null)}}><form role="dialog" aria-modal="true" aria-label="Edit application" onSubmit={saveCaption}><button type="button" className="linear-caption-close" aria-label="Close application" disabled={saving} onClick={()=>setEditing(null)}>×</button>{editing.url&&<img src={editing.url} alt="Application illustration"/>}<label>Application caption<input autoFocus maxLength={200} readOnly={!admin} value={editing.caption||''} onChange={e=>setEditing(a=>({...a,caption:e.target.value}))}/></label><label>Application code<input maxLength={100} readOnly={!admin} required value={editing.code||''} onChange={e=>setEditing(a=>({...a,code:e.target.value}))}/></label>{captionError&&<p role="alert">{captionError}</p>}{admin&&<button type="submit" disabled={saving||!captionReady}>{'Save changes'}</button>}</form></div>}</section>
}
