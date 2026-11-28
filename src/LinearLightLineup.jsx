import ProductAssetImage from './ProductAssetImage.jsx';
import React,{useEffect,useMemo,useRef,useState} from 'react';
import {linearCatalogue,linearApplications,catalogueLinearGroups,COLOUR_VARIANT_LABELS,imageIdentity,productTileImage,resolveIconsFor,resolveIconCode,filterUnassignedReferences,targetFittingOptionsForRow,sortLinearApplications,applicationCategory,catalogueColourFamily,catalogueSectionCategory,categoryOrder} from './linear-lineup.mjs';
import './LinearLightLineup.css';
import LinearApplicationPicker from './LinearApplicationPicker.jsx';
import ProductSpecSheet from './ProductSpecSheet.jsx';
export default function LinearLightLineup({database,catalogue,onAddProduct,onEditProduct,onSaveFitting,onUpload,request,admin=false,category="All",matrix=false,renderMatrix,onSpecOpenChange}){
 const [spec,setSpec]=useState(null);
 const [variantEdit,setVariantEdit]=useState(null);
 const [newApplication,setNewApplication]=useState(null),[dragged,setDragged]=useState(null),[dropTarget,setDropTarget]=useState(null);
 const [assignReference,setAssignReference]=useState(null),[assignIds,setAssignIds]=useState([]);
 const [referenceLinked,setReferenceLinked]=useState(false);
 const captionPending=useRef(new Set());
 const [pendingCaptions,setPendingCaptions]=useState([]),[captionFailures,setCaptionFailures]=useState({}),[captionReady,setCaptionReady]=useState(false);
 const [layout,setLayout]=useState(null),[editRows,setEditRows]=useState(false),[checked,setChecked]=useState([]),[move,setMove]=useState(null),[destination,setDestination]=useState('');
 useEffect(()=>{onSpecOpenChange?.(Boolean(spec));return()=>onSpecOpenChange?.(false);},[spec,onSpecOpenChange]);
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
  const catalogueGroups=catalogueLinearGroups(catalogue,database,original);
  const represented=new Set([...enriched,...catalogueGroups].flatMap(g=>g.products.map(p=>p.code)));
  const extra=database.filter(f=>!represented.has(f.fittingType)&&(f.cataloguePlacement||f.products?.length||f.id.startsWith('fitting-'))).map(f=>({id:'catalogue-999-'+Array.from(f.id).reduce((n,c)=>(Math.imul(n,31)+c.charCodeAt(0))>>>0,0),label:f.category||f.fittingType,applications:f.iconUrl?[{column:0,url:f.iconUrl}]:[],products:[{code:f.fittingType,image:f.thumbnailUrl}]}));
  return linearCatalogue([...enriched,...catalogueGroups,...extra],database);
 },[source,database,catalogue]);
 const allProducts=database.flatMap(fitting=>(fitting.products||[]).map(product=>({fitting,product})));
 const groupCode=g=>{if(!g)return '';const original=groups.find(row=>row.id===g.id)||g;const codes=[...new Set(original.products.map(p=>p.code))];return codes.length===1&&groups.filter(row=>row.products.some(p=>p.code===codes[0])).length===1?codes[0]:g.id.toUpperCase()};
 const allApplications=useMemo(()=>[...linearApplications(groups.map(g=>g.applications.length?g:{...g,applications:[{column:0,url:""}]}),captions),...(layout?.customApplications||[]).map(a=>({...a,caption:captions[a.id]??a.caption}))],[groups,captions,layout?.customApplications]);
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
 const familyByImage=new Map(),familyByCell=new Map(),catalogueFamilyIcons=new Map(),catalogueFamilyCodes=new Map();
 for(const family of colourFamilies){
  family.cells.forEach((cell,index)=>{
   const [row,col]=cell.split('-').map(Number);
   const section=catalogue?.sections?.find(s=>s.codeRow===row);
   const url=section&&catalogue.rows[section.iconRow]?.[col]?.image;
   const codeCell=catalogue?.rows?.[row]?.[col];
   const fitting=codeCell?.fittingId&&database.find(f=>f.id===codeCell.fittingId);
   const cellCode=String(fitting?.fittingType||codeCell?.text||'').trim();
   const info={number:family.number,slot:family.slots?.[index]||index+1};
   familyByCell.set('catalogue-'+cell,info);
   if(url){if(!catalogueFamilyIcons.has(family.number))catalogueFamilyIcons.set(family.number,new Map());catalogueFamilyIcons.get(family.number).set(info.slot,url);}
   if(cellCode){if(!catalogueFamilyCodes.has(family.number))catalogueFamilyCodes.set(family.number,new Map());if(!catalogueFamilyCodes.get(family.number).has(info.slot))catalogueFamilyCodes.get(family.number).set(info.slot,cellCode);}
   if(url&&!familyByImage.has(imageIdentity(url)))familyByImage.set(imageIdentity(url),info);
  });
 }
 for(const g of groups){
  if(!String(g.id).startsWith('catalogue-')||familyByCell.has(g.id))continue;
  const p=g.products[0],info=catalogueColourFamily(p?.code);
  if(!info)continue;
  // Keep the established linear group identities and extend colour grouping to other categories.
  if(applicationCategory(p.fitting,g.label)==='Linear Lights')continue;
  familyByCell.set(g.id,info);
  if(!catalogueFamilyCodes.has(info.number))catalogueFamilyCodes.set(info.number,new Map());
  catalogueFamilyCodes.get(info.number).set(info.slot,p.code);
  if(!catalogueFamilyIcons.has(info.number))catalogueFamilyIcons.set(info.number,new Map());
  if(g.applications[0]?.url)catalogueFamilyIcons.get(info.number).set(info.slot,g.applications[0].url);
 }
 const familyOwners=new Map(),familyNumbers=new Map();
 const variantInfo=a=>familyByCell.get(a.groupId)||familyByImage.get(imageIdentity(a.url));
 const applications=allApplications.filter(a=>{
  if(layout?.deleted.includes(a.id))return false;
  const info=variantInfo(a),image=imageIdentity(a.url);
  if(info){
   const owner=familyOwners.get(info.number)||(info.number.startsWith('code-')?null:iconOwners.get(image));
   if(owner){canonicalIds.set(a.id,owner);if(!variantIcons.has(owner))variantIcons.set(owner,new Map());if(a.url&&!variantIcons.get(owner).has(info.slot))variantIcons.get(owner).set(info.slot,a.url);familyOwners.set(info.number,owner);familyNumbers.set(owner,info.number);return false;}
   familyOwners.set(info.number,a.id);familyNumbers.set(a.id,info.number);variantIcons.set(a.id,new Map([[info.slot,a.url]]));
   if(a.url&&!info.number.startsWith('code-'))iconOwners.set(image,a.id);return true;
  }
  if(a.url&&iconOwners.has(image)&&(!String(a.groupId).startsWith('catalogue-')||applicationCategory(groups.find(g=>g.id===a.groupId)?.products[0]?.fitting,groups.find(g=>g.id===a.groupId)?.label)==='Linear Lights')){canonicalIds.set(a.id,iconOwners.get(image));return false;}
  if(a.url)iconOwners.set(image,a.id);return true;
 });
 // Reserve every variant illustration globally, so aliases never get another row.
 for(const a of allApplications){const info=variantInfo(a);if(info&&familyOwners.has(info.number)&&!layout?.deleted.includes(a.id)){const owner=familyOwners.get(info.number);if(a.id!==owner)canonicalIds.set(a.id,owner);}}
 for(const [number,owner] of familyOwners){const icons=variantIcons.get(owner);for(const [slot,url] of catalogueFamilyIcons.get(number)||[])if(!icons.get(slot))icons.set(slot,url);}
 const primarySlot=a=>variantInfo(a)?.slot||1;
 const iconsFor=a=>resolveIconsFor({app:a,variantIcons,layoutVariantIcons:layout?.variantIcons,primarySlot:primarySlot(a)});
 const iconCode=(a,slot)=>resolveIconCode({app:a,slot,primarySlot:primarySlot(a),familyNumber:familyNumbers.get(a.id)||'',groupCode:groups.find(g=>g.id===a.groupId)?.products?.[0]?.code||groupCode(groups.find(g=>g.id===a.groupId)),codes,variantCodes:layout?.variantCodes,catalogueFamilyCodes});
 const applicationCode=a=>iconCode(a,primarySlot(a));
 const orderedApplications=sortLinearApplications(applications,{
  getCodes:a=>[applicationCode(a),...iconsFor(a).map(([slot])=>iconCode(a,slot))],
  order:layout?.order||[],
  customApplications:layout?.customApplications||[],
 });
 applications.splice(0,applications.length,...orderedApplications);
 const primaryIconUrl=a=>{const icons=iconsFor(a);const slot=primarySlot(a);return icons.find(([s])=>s===slot)?.[1]||icons.at(-1)?.[1]||a.url;};
 const choices=applications.map(a=>{
  const iconList=iconsFor(a);
  const variants=iconList.map(([slot,url])=>({
   id:`${a.id}:${slot}`,
   slot:Number(slot),
   code:iconCode(a,slot),
   label:COLOUR_VARIANT_LABELS[Number(slot)-1]||`Variant ${slot}`,
   url,
  })).filter(v=>v.url||v.code);
  const allCodes=[...new Set(variants.map(v=>v.code).filter(Boolean))];
  return {
   id:a.id,
   label:a.caption||groups.find(g=>g.id===a.groupId)?.label||'Application',
   code:allCodes.join(' · ')||applicationCode(a),
   url:primaryIconUrl(a),
   variants:variants.length>1?variants:[],
  };
 });
 const expandIds=ids=>[...new Set(ids.flatMap(id=>id.includes(':')?[id]:allApplications.filter(a=>a.groupId===id).map(a=>a.id)))];
 const memberships=item=>{
  const rawIds=item.product.linearApplicationIds??groups.filter(g=>g.products.some(p=>p.fitting?.id===item.fitting.id)||links.some(l=>l.applicationId===g.id&&l.fittingId===item.fitting.id&&l.productId===item.product.id)).map(g=>g.id).concat(links.filter(l=>l.fittingId===item.fitting.id&&l.productId===item.product.id).map(l=>l.applicationId));
  const expanded=expandIds(rawIds);
  const canonicalMapped=expanded.flatMap(id=>{
   const parts=id.split(':');
   const base=parts.slice(0,2).join(':');
   const slot=parts[2];
   const canonicalBase=canonicalIds.get(base)||base;
   return slot!==undefined?[`${canonicalBase}:${slot}`,canonicalBase]:[canonicalBase];
  });
  return [...new Set(canonicalMapped)].filter(id=>!layout?.deleted.includes(id.split(':').slice(0,2).join(':')));
 };
 const references=groups.flatMap(g=>g.products.map((p,index)=>({...p,image:layout?.images?.[g.id+':'+index]||p.image,sourceGroup:g.id,key:g.id+':'+index,refKey:p.code+':'+(p.column??index),ids:layout?.references[g.id+':'+index]??allApplications.filter(a=>a.groupId===g.id).map(a=>a.id)})));
 const rows=applications.map(a=>{
  const candidates=references.filter(p=>(p.ids.includes(a.id)||(Object.prototype.hasOwnProperty.call(layout?.references||{},p.key)&&p.ids.some(id=>canonicalIds.get(id)===a.id)))&&(p.image||p.fitting?.thumbnailUrl));
  const explicit=candidates.filter(p=>Object.prototype.hasOwnProperty.call(layout?.references||{},p.key));
  const defaults=candidates.filter(p=>!Object.prototype.hasOwnProperty.call(layout?.references||{},p.key));
  const fallback=familyNumbers.has(a.id)?references.find(p=>!Object.prototype.hasOwnProperty.call(layout?.references||{},p.key)&&p.ids.some(id=>canonicalIds.get(id)===a.id)&&(p.image||p.fitting?.thumbnailUrl)):null;
  const products=[...(defaults.length?defaults.slice(0,1):fallback?[fallback]:[]),...explicit].filter((p,i,all)=>all.findIndex(x=>imageIdentity(x.image||x.fitting?.thumbnailUrl)===imageIdentity(p.image||p.fitting?.thumbnailUrl))===i);
  return {...groups.find(g=>g.id===a.groupId),label:a.caption||groups.find(g=>g.id===a.groupId)?.label||"Application",id:a.id,app:a,products};
 });
 const rowIds=new Set(rows.map(g=>g.id));
 const extraUsedImages=allProducts.filter(item=>memberships(item).some(id=>rowIds.has(id))).map(item=>productTileImage(item.product)).filter(Boolean);
 const unassigned=filterUnassignedReferences({references,rows,canonicalIds,extraUsedImages});

 const targetOptionsFor=(g,selectedIds=linkedIds)=>{
  const iconList=iconsFor(g.app),primary=primarySlot(g.app);
  const checkedSlots=selectedIds.filter(id=>id.startsWith(g.id+':')).map(id=>Number(id.split(':').at(-1))).filter(Boolean);
  const prioritizedSlots=[
   ...checkedSlots,
   ...iconList.map(([s])=>s).filter(s=>!checkedSlots.includes(s)),
  ];
  const orderedSlots=[...new Set(prioritizedSlots.length?prioritizedSlots:[primary])];
  const iconCodes=orderedSlots.map(slot=>iconCode(g.app,slot)).filter(Boolean);
  const groupProducts=groups.find(row=>row.id===g.app?.groupId)?.products||[];
  return targetFittingOptionsForRow({row:g,groupProducts,database,iconCodes,isCustom:Boolean(g.app?.id?.startsWith('custom-'))});
 };
 const openLink=(g,ref="",item=null)=>{
  setAddGroup(g);
  setReferenceKey(ref);
  setReferenceLinked(Boolean(ref&&item));
  setExisting(item?String(allProducts.findIndex(x=>x.fitting.id===item.fitting.id&&x.product.id===item.product.id)):"");
  const rowChoice=choices.find(c=>c.id===g.id);
  const defaultRowIds=rowChoice?.variants?.length?rowChoice.variants.map(v=>v.id):[g.id];
  const initialIds=item?(item.product.linearApplicationIds?.length?item.product.linearApplicationIds:memberships(item)):defaultRowIds;
  const nextLinked=[...new Set(initialIds)];
  setLinkedIds(nextLinked);
  setLinkError("");
  const targetOpts=targetOptionsFor(g,nextLinked);
  setTarget(targetOpts[0]?.fitting.id||"");
 };
 const rowCategory=g=>{
  const source=groups.find(x=>x.id===g.app.groupId);
  const match=String(g.app.groupId||'').match(/^catalogue-(\d+)-/);
  const section=match&&catalogue?.sections?.find(s=>s.codeRow===Number(match[1]));
  if(section)return catalogueSectionCategory(section);
  if(String(g.app.groupId||'').startsWith('linear-'))return 'Linear Lights';
  return applicationCategory(source?.products[0]?.fitting||g.products[0]?.fitting,g.label);
 };
 const categoryRows=rows.filter(g=>category==='All'||rowCategory(g)===category).sort((a,b)=>categoryOrder(rowCategory(a))-categoryOrder(rowCategory(b)));
 const categoryApps=categoryRows.map(g=>g.app);
 useEffect(()=>{setApplication('');setQuery('');setChecked([]);},[category]);
 const selected=categoryApps.find(a=>a.id===application);
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
   if(applications.some(a=>iconsFor(a).some(([slot])=>iconCode(a,slot).toUpperCase()===code.toUpperCase())))throw Error('This application code already exists.');
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
  else{setSaving(true);setError('');try{const {fitting,product}=move.item;const ids=[...new Set([...memberships(move.item).filter(id=>id!==move.row.id),destination])];await onSaveFitting({...fitting,products:fitting.products.map(p=>p.id===product.id?{...p,linearApplicationIds:ids}:p)});setSpec(s=>s?{...s,row:rows.find(r=>r.id===destination)||s.row}:null);setMove(null);}catch(e){setError(e.message)}finally{setSaving(false)}}
 };
 const openProduct=(row,item)=>{if(item)setSpec({row,fitting:item.fitting,product:item.product});};
 const closeEditing=()=>{if(editing?.previewUrl)URL.revokeObjectURL(editing.previewUrl);setEditing(null);};
 const openEditIcon=(g,slot,url)=>{
  const currentCaption=g.app.caption||g.label||'';
  const currentCode=iconCode(g.app,slot);
  if(editing?.previewUrl)URL.revokeObjectURL(editing.previewUrl);
  setEditing({...g.app,slot,url,caption:currentCaption,code:currentCode,originalCaption:currentCaption,originalCode:currentCode,originalUrl:url,file:null,previewUrl:''});
  setCaptionError('');
 };
 async function saveCaption(e){
  e.preventDefault();
  if(!editing||saving)return;
  const draft={...editing,caption:editing.caption.trim(),code:editing.code.trim()};
  const id=draft.id,slot=Number(draft.slot||primarySlot(draft));
  if(!captionReady||captionPending.current.has(id))return;
  if(!draft.code){setCaptionError('Enter an application code.');return;}
  const previousCaption=captions[id],previousCode=codes[id];
  const captionChanged=draft.caption!==(previousCaption??draft.originalCaption);
  const isPrimary=slot===primarySlot(draft);
  const codeChanged=draft.code!==draft.originalCode;
  const imageChanged=Boolean(draft.file);
  if(!captionChanged&&!codeChanged&&!imageChanged){closeEditing();return;}
  const needsLayoutSave=imageChanged||(!isPrimary&&codeChanged)||(isPrimary&&codeChanged&&Boolean(layout?.variantCodes?.[id]?.[slot]));
  const needsCaptionSave=captionChanged||(isPrimary&&codeChanged);
  if(!needsLayoutSave&&needsCaptionSave){
   captionPending.current.add(id);
   setPendingCaptions(ids=>[...ids,id]);
   setCaptionFailures(old=>{const next={...old};delete next[id];return next;});
   setCaptions(old=>({...old,[id]:draft.caption}));
   if(isPrimary)setCodes(old=>({...old,[id]:draft.code}));
   closeEditing();
   try{
    const result=await request('saveLinearApplicationCaption',{applicationId:id,caption:draft.caption,expectedCaption:previousCaption??'',...(isPrimary?{code:draft.code,expectedCode:previousCode??''}:{})},'POST',90000);
    setCaptions(old=>({...old,[id]:result.caption}));
    if(isPrimary)setCodes(old=>({...old,[id]:result.code}));
   }catch(err){
    let savedCaption=previousCaption,savedCode=previousCode;
    try{const rows=await request('getLinearApplicationCaptions',{},'POST',90000);const saved=rows.find(row=>row.applicationId===id);savedCaption=saved?.caption;savedCode=saved?.code;}catch{}
    const restore=(old,value)=>{const next={...old};if(value===undefined)delete next[id];else next[id]=value;return next;};
    setCaptions(old=>restore(old,savedCaption));
    if(isPrimary)setCodes(old=>restore(old,savedCode));
    if(savedCaption!==draft.caption||(isPrimary&&savedCode!==draft.code))setCaptionFailures(old=>({...old,[id]:{draft,message:err.message||'Save failed'}}));
   }finally{
    captionPending.current.delete(id);
    setPendingCaptions(ids=>ids.filter(value=>value!==id));
   }
   return;
  }
  setSaving(true);setCaptionError('');
  try{
   let uploadedUrl='';
   if(draft.file){
    const asset=await onUpload(draft.file);
    if(!asset?.url)throw Error('Image upload failed.');
    uploadedUrl=asset.url;
   }
   const nextVariantIcons=uploadedUrl?{...layout.variantIcons,[id]:{...layout.variantIcons?.[id],[slot]:uploadedUrl}}:layout.variantIcons;
   let nextVariantCodes=layout.variantCodes;
   if(!isPrimary&&codeChanged){
    nextVariantCodes={...layout.variantCodes,[id]:{...layout.variantCodes?.[id],[slot]:draft.code}};
   }else if(isPrimary&&codeChanged&&layout?.variantCodes?.[id]?.[slot]){
    const rest={...layout.variantCodes[id]};delete rest[slot];
    nextVariantCodes={...layout.variantCodes};
    if(Object.keys(rest).length)nextVariantCodes[id]=rest;else delete nextVariantCodes[id];
   }
   const savedLayout=await request('saveLinearApplicationLayout',{...layout,variantIcons:nextVariantIcons,variantCodes:nextVariantCodes,expectedVersion:layout.version},'POST',90000);
   setLayout(savedLayout);
   setEditing(a=>{if(a?.previewUrl)URL.revokeObjectURL(a.previewUrl);return a?{...a,url:uploadedUrl||a.url,file:null,previewUrl:'',originalCode:!isPrimary?draft.code:a.originalCode}:null;});
   if(needsCaptionSave){
    const result=await request('saveLinearApplicationCaption',{applicationId:id,caption:draft.caption,expectedCaption:previousCaption??'',...(isPrimary?{code:draft.code,expectedCode:previousCode??''}:{})},'POST',90000);
    setCaptions(old=>({...old,[id]:result.caption}));
    if(isPrimary)setCodes(old=>({...old,[id]:result.code}));
   }
   closeEditing();
  }catch(err){
   setCaptionError(err.message||'Save failed');
  }finally{
   setSaving(false);
  }
 }

 const searchText=query.trim().toLowerCase();
 const shown=categoryRows.filter(g=>{
  if(selected&&g.id!==selected.id)return false;
  if(!searchText)return true;
  const words=[g.label,choices.find(a=>a.id===g.id)?.label,choices.find(a=>a.id===g.id)?.code,...g.products.flatMap(p=>[p.code,p.note,p.fitting?.category]),...allProducts.filter(item=>memberships(item).includes(g.id)).flatMap(({product})=>[product.brand,product.model,product.specs?.article,product.specs?.specSheet?.optics])];
  return words.filter(Boolean).join(' ').toLowerCase().includes(searchText);
 });
 const visibleProducts=allProducts.filter(item=>shown.some(g=>memberships(item).includes(g.id))).length;

 if(!source||!layout)return error?<p role="alert">{error}</p>:<p role="status">Loading application catalogue…</p>;
 const activeSpecItem=spec?(allProducts.find(x=>x.fitting.id===spec.fitting.id&&x.product.id===spec.product.id)||{fitting:spec.fitting,product:spec.product}):null;
 const activeSpecRow=spec?(rows.find(r=>r.id===spec.row?.id)||rows.find(r=>activeSpecItem&&memberships(activeSpecItem).includes(r.id))||spec.row):null;
 return <section className="linear-lineup" aria-label="Application catalogue">{error&&<p role="alert">{error}</p>}{spec&&activeSpecItem?<ProductSpecSheet product={activeSpecItem.product} fitting={activeSpecItem.fitting} onClose={()=>setSpec(null)} closeLabel="Back to applications" onEditProduct={admin&&onEditProduct?()=>onEditProduct(activeSpecItem.fitting,activeSpecItem.product):undefined} extraActions={admin&&activeSpecRow?<><button type="button" onClick={()=>openLink(activeSpecRow,'',activeSpecItem)}>Linked applications</button><button type="button" onClick={()=>{setMove({row:activeSpecRow,item:activeSpecItem});setDestination('');}}>Move to another application</button></>:null}/>:<>{matrix&&renderMatrix&&renderMatrix({images:Object.fromEntries(rows.flatMap(g=>{const image=g.products[0]?.image||g.products[0]?.fitting?.thumbnailUrl;if(!image)return [];const codes=[...iconsFor(g.app).map(([slot])=>iconCode(g.app,slot)),...groups.filter(x=>allApplications.some(a=>a.groupId===x.id&&(a.id===g.id||canonicalIds.get(a.id)===g.id))).flatMap(x=>x.products.map(p=>p.code))];return codes.filter(Boolean).map(code=>[code,image])})),openReference:code=>{const row=rows.find(g=>iconsFor(g.app).some(([slot])=>iconCode(g.app,slot)===code)||g.products.some(p=>p.code===code)||groups.some(x=>x.products.some(p=>p.code===code)&&allApplications.some(a=>a.groupId===x.id&&(a.id===g.id||canonicalIds.get(a.id)===g.id))));if(row?.products[0]){openLink(row,row.products[0].refKey);return true}return false}})}<div hidden={matrix}><header><h2>Applications</h2><p>Select an application illustration to view its product options.</p></header><div className="linear-filters"><label>Application-wise products<select value={application} onChange={e=>setApplication(e.target.value)}><option value="">All applications</option>{categoryApps.map((a,i)=><option key={a.id} value={a.id}>{a.caption||`Application ${i+1}`}</option>)}</select></label><label>Search<input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Application code, product or brand"/></label><button type="button" onClick={()=>{setApplication('');setQuery('')}}>Clear filters</button></div><div className="linear-application-picker" aria-label="Application illustrations"><button type="button" aria-pressed={!application} onClick={()=>setApplication('')}>All applications</button>{categoryApps.map((a,i)=>{const thumb=primaryIconUrl(a);return <button key={a.id} type="button" aria-pressed={application===a.id} onClick={()=>setApplication(application===a.id?'':a.id)}>{thumb&&<img src={thumb} alt=""/>}<span>{a.caption||`Application ${i+1}`}</span></button>;})}</div><div className="linear-save-status" role="status">{pendingCaptions.length>0&&<>Syncing {pendingCaptions.length} application edit{pendingCaptions.length===1?'':'s'}…</>}</div>{Object.entries(captionFailures).map(([id,failure])=><p role="alert" key={id}>Could not confirm save for {failure.draft.caption}: {failure.message} <button type="button" className="linear-row-action" onClick={()=>{setEditing({...failure.draft,originalCaption:captions[id],originalCode:failure.draft.originalCode??codes[id],file:null,previewUrl:''});setCaptionError('')}}>Review and retry</button></p>)}<p role="status">{shown.length} applications · {visibleProducts} manufacturer products</p><div className="linear-lineup-scroll"><table><thead><tr><th scope="col">Applications {admin&&<button type="button" className="linear-row-action" disabled={saving} onClick={()=>setNewApplication({caption:'',code:'',file:null})}>+ New application</button>}{admin&&<button className="linear-row-action" type="button" onClick={()=>{setEditRows(v=>!v);setChecked([])}}>{editRows?'Done':'Edit'}</button>}{editRows&&<button className="linear-row-action" disabled={!checked.length||saving} onClick={()=>deleteRows(checked)}>Delete selected ({checked.length})</button>}</th><th scope="col">Products</th></tr></thead><tbody>{shown.map(g=><tr key={g.id} className={dropTarget===g.id?'linear-drop-target':undefined} onDragOver={e=>{if(editRows&&dragged&&dragged!==g.id){e.preventDefault();setDropTarget(g.id)}}} onDrop={e=>{e.preventDefault();if(editRows&&dragged)reorder(dragged,g.id);setDragged(null);setDropTarget(null)}}>
 <td className="linear-application-cell">
  {editRows&&<div className="linear-row-delete"><button type="button" className="linear-drag-handle" draggable={!saving} title="Drag to reorder application" aria-label="Drag to reorder application" onDragStart={e=>{e.dataTransfer.effectAllowed='move';e.dataTransfer.setData('text/plain',g.id);setDragged(g.id)}} onDragEnd={()=>{setDragged(null);setDropTarget(null)}}>⠿</button><button type="button" className="linear-row-action" disabled={saving} onClick={()=>deleteRows([g.id])}>Delete</button></div>}
  <div className="linear-application-stack">
   {editRows&&<div className="linear-row-controls"><input type="checkbox" aria-label={"Select "+(g.app.caption||g.label)} checked={checked.includes(g.id)} onChange={e=>setChecked(old=>e.target.checked?[...old,g.id]:old.filter(id=>id!==g.id))}/></div>}
   <div className="linear-application-icon">
    <div className="linear-application-image linear-variant-icons">
     {(iconsFor(g.app).length?iconsFor(g.app):[[primarySlot(g.app),'']]).map(([slot,url])=>{
      const code=iconCode(g.app,slot);
      return <button key={slot} className="linear-variant-icon-btn" type="button" disabled={!captionReady||pendingCaptions.includes(g.id)} onClick={()=>openEditIcon(g,slot,url)} title={COLOUR_VARIANT_LABELS[slot-1]||undefined}>
       {url?<img src={url} loading="lazy" alt=""/>:<span className="linear-icon-placeholder" aria-hidden="true">No icon</span>}
       <small className="linear-icon-code">{code||'\u00A0'}</small>
      </button>;
     })}
    </div>
    <button className="linear-application-caption linear-application-caption-btn" type="button" disabled={!captionReady||pendingCaptions.includes(g.id)} onClick={()=>{const [slot,url]=iconsFor(g.app).find(([s])=>s===primarySlot(g.app))||iconsFor(g.app)[0]||[primarySlot(g.app),g.app.url];openEditIcon(g,slot,url);}}>
     <strong>{g.app.caption||g.label||'Application'}</strong>
    </button>
   </div>
   {admin&&editRows&&<button className="linear-variant-add" type="button" aria-label="Add application icon" disabled={saving} onClick={()=>setVariantEdit({app:g.app,slot:'',code:'',file:null})}>+</button>}
  </div>
 </td>
 <td><div className="linear-products">{g.products.map((p,j)=>{
  const fitting=p.fitting;
  const reference=p.image||fitting?.thumbnailUrl;
  const refKey=p.refKey;
  const linked=links.find(l=>l.applicationId===g.id&&l.referenceKey===refKey)||links.find(l=>(l.applicationId===p.sourceGroup||l.applicationId.split(":")[0]===p.sourceGroup)&&l.referenceKey===refKey);
  const linkedItem=linked&&allProducts.find(x=>x.fitting.id===linked.fittingId&&x.product.id===linked.productId);

  return <div className="linear-manufacturer-options" key={p.code+':'+j}>
   {reference&&<article className="linear-product-tile"><button type="button" onClick={()=>{if(admin)openLink(g,refKey,linkedItem);else if(linkedItem)setSpec({row:g,...linkedItem})}} title={admin?"Link manufacturer product":"View specification"} aria-label={admin?"Link manufacturer product":"View specification"} disabled={!admin&&!linkedItem}><ProductAssetImage src={linkedItem?productTileImage(linkedItem.product)||reference:reference} alt="Product reference" loading="lazy"/>{linkedItem&&<span className="linear-product-meta"><strong className="linear-product-title">{linkedItem.product.specs?.article||linkedItem.product.model||linkedItem.product.family||'Product'}</strong>{linkedItem.product.brand&&<small className="linear-product-brand">{linkedItem.product.brand}</small>}</span>}</button></article>}

  </div>;
 })}{allProducts.filter(item=>memberships(item).includes(g.id)&&!g.products.some(p=>links.some(l=>(l.applicationId===g.id||l.applicationId===p.sourceGroup||l.applicationId.split(":")[0]===p.sourceGroup)&&l.referenceKey===p.refKey&&l.fittingId===item.fitting.id&&l.productId===item.product.id))).map(item=>{
  const itemAppIds=item.product.linearApplicationIds||[];
  const linkedSlots=itemAppIds.filter(id=>id.startsWith(g.id+':')).map(id=>Number(id.split(':').at(-1))).filter(Boolean);
  const slotCodes=linkedSlots.map(slot=>iconCode(g.app,slot)).filter(Boolean);
  const productImage=productTileImage(item.product);
  const productName=item.product.specs?.article||item.product.model||item.product.family||'Product';
  const brandName=item.product.brand||'';
  return <article className="linear-product-tile" key={item.fitting.id+':'+item.product.id}><button type="button" aria-label={[productName,brandName].filter(Boolean).join(' · ')} title={[productName,brandName,...slotCodes].filter(Boolean).join(' · ')} onClick={()=>openProduct(g,item)}>{productImage?<ProductAssetImage src={productImage} alt=""/>:<span aria-hidden="true" style={{display:"grid",placeItems:"center",height:90,fontSize:28,color:"#a09b91"}}>▧</span>}<span className="linear-product-meta"><strong className="linear-product-title">{productName}</strong>{brandName&&<small className="linear-product-brand">{brandName}</small>}</span>{slotCodes.length>0&&<span className="linear-product-variant-tag">{slotCodes.join(' · ')}</span>}</button></article>;
})}{admin&&<button type="button" className="linear-add-product" aria-label="Add manufacturer product" onClick={()=>{openLink(g)}}>+</button>}</div></td>
 </tr>)}{!selected&&unassigned.some(p=>category==='All'||applicationCategory(p.fitting)===category)&&<tr><td className="linear-application-cell"><div style={{textAlign:'right',padding:12,fontWeight:600}}>Unassigned Products</div></td><td><div className="linear-products">{unassigned.filter(p=>(category==='All'||applicationCategory(p.fitting)===category)&&(!searchText||[p.code,p.note,'unassigned products'].join(' ').toLowerCase().includes(searchText))).map(p=><article className="linear-product-tile" key={p.key}><button type="button" disabled={!admin} aria-label="Link image to applications" onClick={()=>{setAssignReference(p);setAssignIds([])}}><img src={p.image||p.fitting?.thumbnailUrl} alt="Unassigned product reference" loading="lazy"/></button></article>)}</div></td></tr>}</tbody></table></div>{!shown.length&&<p>No products match these filters.</p>}<small>Reference: {source.sourceSheet}.</small></div></>}{addGroup&&<div className="linear-caption-overlay"><form className="linear-manufacturer-dialog" role="dialog" aria-modal="true" aria-label="Add manufacturer product" onSubmit={async e=>{e.preventDefault();const item=allProducts[Number(existing)];if(existing===''||!item)return;setLinkError('');setSaving(true);try{await onSaveFitting({...item.fitting,products:item.fitting.products.map(p=>p.id===item.product.id?{...p,linearApplicationIds:linkedIds}:p)});if(referenceKey){const link=await request('saveLinearProductLink',{applicationId:addGroup.products.find(p=>p.refKey===referenceKey)?.sourceGroup||addGroup.id,fittingId:item.fitting.id,productId:item.product.id,referenceKey},'POST',90000);setLinks(old=>[...old.filter(l=>!(l.applicationId===link.applicationId&&l.referenceKey===referenceKey)),link]);}setAddGroup(null)}catch(err){setLinkError(err.message)}finally{setSaving(false)}}}><header className="linear-dialog-header"><h3>{referenceKey?'Link manufacturer product':'Add manufacturer product'}</h3><button type="button" className="linear-dialog-close" aria-label="Close dialog" disabled={saving} onClick={()=>setAddGroup(null)}>×</button></header><div className="linear-dialog-body">{referenceKey&&referenceLinked&&<div>{existing!==''&&allProducts[Number(existing)]&&<button type="button" disabled={saving} onClick={()=>{setSpec({row:addGroup,...allProducts[Number(existing)]});setAddGroup(null)}}>View specification</button>}<button type="button" disabled={saving} onClick={()=>{const reference=addGroup.products.find(p=>p.refKey===referenceKey);if(reference){setMove({row:addGroup,reference,item:existing!==''?allProducts[Number(existing)]:null});setDestination('');setAddGroup(null)}}}>Move to another application</button></div>}<label>Link existing product<select value={existing} onChange={e=>{setExisting(e.target.value);const item=allProducts[Number(e.target.value)];const itemIds=item?(item.product.linearApplicationIds?.length?item.product.linearApplicationIds:memberships(item)):[];const rowChoice=choices.find(c=>c.id===addGroup.id);const defaultRowIds=rowChoice?.variants?.length?rowChoice.variants.map(v=>v.id):[addGroup.id];setLinkedIds(e.target.value!==''&&item?[...new Set([...itemIds,...defaultRowIds])]:defaultRowIds)}}><option value="">Choose product</option>{allProducts.map((x,i)=><option key={i} value={String(i)}>{x.product.brand} {x.product.model} · {x.fitting.fittingType}</option>)}</select></label>{(!referenceKey||referenceLinked)&&<LinearApplicationPicker choices={choices} selected={linkedIds} onChange={next=>{setLinkedIds(next);const opts=targetOptionsFor(addGroup,next);if(opts[0]&&(!target||!opts.some(o=>o.fitting.id===target)))setTarget(opts[0].fitting.id);}} disabled={saving}/>} {linkError&&<p role="alert">{linkError}</p>}<div className="linear-dialog-actions"><button className="linear-dialog-primary" disabled={!existing||saving||(referenceKey&&!linkedIds.some(id=>id===addGroup.id||id.startsWith(addGroup.id+':')))}>{referenceKey&&!referenceLinked?'Link existing product':'Save product links'}</button></div>{referenceKey&&<section className="linear-dialog-new"><label>Change default image<input type="file" accept="image/png,image/jpeg,image/webp" disabled={saving} onChange={async e=>{const file=e.target.files?.[0];if(!file)return;setSaving(true);setLinkError('');try{const reference=addGroup.products.find(p=>p.refKey===referenceKey);if(!reference)throw Error('Reference image unavailable.');const asset=await onUpload(file);if(!asset?.url)throw Error('Image upload failed.');if(await saveLayout({...layout,images:{...layout.images,[reference.key]:asset.url}}))setAddGroup(null);else setLinkError('Could not save image. Refresh and try again.');}catch(err){setLinkError(err.message);}finally{setSaving(false)}}}/></label></section>}{!referenceKey&&<section className="linear-dialog-new"><label>Add new product for<select value={target} onChange={e=>setTarget(e.target.value)}><option value="">Choose fitting</option>{targetOptionsFor(addGroup,linkedIds).map(p=><option key={p.fitting.id} value={p.fitting.id}>{p.code}</option>)}</select></label><button type="button" disabled={!target||saving||!linkedIds.some(id=>id===addGroup.id||id.startsWith(addGroup.id+':'))} onClick={()=>{setAddGroup(null);onAddProduct(target,{choices,selected:linkedIds})}}>Add new product</button></section>}</div><footer className="linear-dialog-footer"><button type="button" disabled={saving} onClick={()=>setAddGroup(null)}>Cancel</button></footer></form></div>}
{variantEdit&&<div className="linear-caption-overlay"><form className="linear-manufacturer-dialog" role="dialog" aria-modal="true" aria-label="Add application icon" onSubmit={async e=>{
 e.preventDefault();
 const code=String(variantEdit.code||'').trim();
 if(!code){setError('Enter an application code.');return;}
 setSaving(true);setError('');
 try{
  const asset=await onUpload(variantEdit.file);
  if(!asset?.url)throw Error('Image upload failed.');
  const id=variantEdit.app.id,slotNum=Number(variantEdit.slot),isPrimary=slotNum===primarySlot(variantEdit.app);
  let nextVariantCodes=layout.variantCodes;
  if(!isPrimary){
   nextVariantCodes={...layout.variantCodes,[id]:{...layout.variantCodes?.[id],[variantEdit.slot]:code}};
  }else if(layout?.variantCodes?.[id]?.[variantEdit.slot]){
   const rest={...layout.variantCodes[id]};delete rest[variantEdit.slot];
   nextVariantCodes={...layout.variantCodes};
   if(Object.keys(rest).length)nextVariantCodes[id]=rest;else delete nextVariantCodes[id];
  }
  if(await saveLayout({...layout,variantIcons:{...layout.variantIcons,[id]:{...layout.variantIcons?.[id],[variantEdit.slot]:asset.url}},variantCodes:nextVariantCodes})){
   if(isPrimary&&captionReady&&code!==iconCode(variantEdit.app,slotNum)){
    const previousCaption=captions[id],previousCode=codes[id];
    const currentCaption=previousCaption??(variantEdit.app.caption||groups.find(g=>g.id===variantEdit.app.groupId)?.label||'');
    const result=await request('saveLinearApplicationCaption',{applicationId:id,caption:currentCaption,code,expectedCaption:previousCaption??'',expectedCode:previousCode??''},'POST',90000);
    setCaptions(old=>({...old,[id]:result.caption}));
    setCodes(old=>({...old,[id]:result.code}));
   }
   setVariantEdit(null);
  }
 }catch(e){setError(e.message)}finally{setSaving(false)}
}}><header className="linear-dialog-header"><h3>Add application icon</h3></header><div className="linear-dialog-body"><label>Colour variant<select required value={variantEdit.slot} onChange={e=>{const nextSlot=e.target.value;const existingCode=nextSlot?iconCode(variantEdit.app,Number(nextSlot)):'';setVariantEdit(v=>({...v,slot:nextSlot,code:existingCode||(v.codeTouched?v.code:'')}))}}><option value="">Select variant</option>{COLOUR_VARIANT_LABELS.map((label,i)=><option key={i} value={i+1}>{label}{iconsFor(variantEdit.app).some(([slot])=>slot===i+1)?' (replace icon)':''}</option>)}</select></label><label>Application code<input required maxLength={100} placeholder="L2NS|001" value={variantEdit.code||''} onChange={e=>setVariantEdit(v=>({...v,code:e.target.value,codeTouched:true}))}/></label><label>Application icon<input type="file" required accept="image/png,image/jpeg,image/webp" onChange={e=>setVariantEdit(v=>({...v,file:e.target.files?.[0]}))}/></label>{error&&<p role="alert">{error}</p>}</div><footer className="linear-dialog-footer"><button type="button" disabled={saving} onClick={()=>{setError('');setVariantEdit(null)}}>Cancel</button><button className="linear-dialog-primary" disabled={saving||!variantEdit.slot||!String(variantEdit.code||'').trim()||!variantEdit.file}>Save icon</button></footer></form></div>}
{newApplication&&<div className="linear-caption-overlay"><form className="linear-manufacturer-dialog" role="dialog" aria-modal="true" aria-label="New application" onSubmit={createApplication}><header className="linear-dialog-header"><h3>New application</h3></header><div className="linear-dialog-body"><label>Application icon<input type="file" accept="image/png,image/jpeg,image/webp" required disabled={saving} onChange={e=>setNewApplication(a=>({...a,file:e.target.files?.[0]}))}/></label><label>Application caption<input required maxLength={200} value={newApplication.caption} onChange={e=>setNewApplication(a=>({...a,caption:e.target.value}))}/></label><label>Application code<input required maxLength={100} placeholder="001" value={newApplication.code} onChange={e=>setNewApplication(a=>({...a,code:e.target.value}))}/></label>{error&&<p role="alert">{error}</p>}</div><footer className="linear-dialog-footer"><button type="button" disabled={saving} onClick={()=>setNewApplication(null)}>Cancel</button><button className="linear-dialog-primary" disabled={saving||!newApplication.file}>{saving?'Saving…':'Add application'}</button></footer></form></div>}
{assignReference&&<div className="linear-caption-overlay"><form className="linear-manufacturer-dialog" role="dialog" aria-modal="true" aria-label="Assign product image" onSubmit={async e=>{e.preventDefault();if(!assignIds.length)return;if(await saveLayout({...layout,references:{...layout.references,[assignReference.key]:assignIds}}))setAssignReference(null)}}><header className="linear-dialog-header"><h3>Link product image to applications</h3></header><div className="linear-dialog-body"><LinearApplicationPicker choices={choices} selected={assignIds} onChange={setAssignIds} disabled={saving}/>{error&&<p role="alert">{error}</p>}</div><footer className="linear-dialog-footer"><button type="button" onClick={()=>setAssignReference(null)} disabled={saving}>Cancel</button><button className="linear-dialog-primary" disabled={saving||!assignIds.length}>Link image</button></footer></form></div>}
{move&&<div className="linear-caption-overlay"><form className="linear-manufacturer-dialog" role="dialog" aria-modal="true" aria-label="Move product" onSubmit={e=>{e.preventDefault();moveProduct()}}><header className="linear-dialog-header"><h3>Move to another application</h3><button type="button" className="linear-dialog-close" aria-label="Close dialog" disabled={saving} onClick={()=>setMove(null)}>×</button></header><div className="linear-dialog-body"><label>Destination<select required value={destination} onChange={e=>setDestination(e.target.value)}><option value="">Select application</option>{choices.filter(a=>a.id!==move.row.id).map(a=><option key={a.id} value={a.id}>{a.label} · {a.code}</option>)}</select></label>{error&&<p role="alert">{error}</p>}</div><footer className="linear-dialog-footer"><button type="button" disabled={saving} onClick={()=>setMove(null)}>Cancel</button><button className="linear-dialog-primary" disabled={saving||!destination}>Move product</button></footer></form></div>}
{editing&&<div className="linear-caption-overlay" onKeyDown={e=>{if(e.key==='Escape'&&!saving)closeEditing()}}><form role="dialog" aria-modal="true" aria-label="Edit application" onSubmit={saveCaption}><button type="button" className="linear-caption-close" aria-label="Close application" disabled={saving} onClick={closeEditing}>×</button>{(editing.previewUrl||editing.url)&&<img src={editing.previewUrl||editing.url} alt="Application illustration"/>}{COLOUR_VARIANT_LABELS[editing.slot-1]&&<small className="linear-edit-variant-label">{COLOUR_VARIANT_LABELS[editing.slot-1]}</small>}<label>Application caption<input autoFocus maxLength={200} readOnly={!admin} value={editing.caption||''} onChange={e=>setEditing(a=>({...a,caption:e.target.value}))}/></label><label>Application code<input maxLength={100} readOnly={!admin} required value={editing.code||''} onChange={e=>setEditing(a=>({...a,code:e.target.value}))}/></label>{admin&&<label>Application image<input type="file" accept="image/png,image/jpeg,image/webp" disabled={saving} onChange={e=>{const file=e.target.files?.[0]||null;setEditing(a=>{if(a?.previewUrl)URL.revokeObjectURL(a.previewUrl);return {...a,file,previewUrl:file?URL.createObjectURL(file):''};});}}/></label>}{captionError&&<p role="alert">{captionError}</p>}{admin&&<button type="submit" disabled={saving||!captionReady}>{saving?'Saving…':'Save changes'}</button>}</form></div>}</section>
}
