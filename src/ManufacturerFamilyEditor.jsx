import React,{useState} from 'react';
import {familyModelProduct} from './manufacturer-family.mjs';
import {SpecSheetLivePreview} from './ProductSpecSheet.jsx';
import LinearApplicationPicker from './LinearApplicationPicker.jsx';
import './ManufacturerFamilyEditor.css';

const axes=[['led','LED type'],['cct','Colour temperature'],['beam','Beam angle'],['reflector','Reflector finish'],['trim','Trim finish'],['control','Control']];
const fields=[['imageUrl','Product image'],['article','Article number'],['power','Wattage (W)'],['size','Construction size (mm)'],['recess','Cut-out (mm)'],['height','Height (mm)'],['flux','Luminous flux (lm)'],['diagramUrl','Dimensional drawing URL']];
const blankModel=()=>({id:'model-'+Date.now()+'-'+Math.random().toString(36).slice(2,7),options:{},variants:[]});
const hints={brand:'e.g. Retina, ERCO',family:'e.g. Lightcast',model:'e.g. Mini recessed downlight',shape:'e.g. Round, square',ip:'e.g. IP44',warranty:'e.g. 5',mounting:'e.g. Recessed ceiling',imageUrl:'Paste image URL',datasheet:'Paste catalogue or datasheet URL',article:'e.g. LC-07',power:'e.g. 7',size:'e.g. 16 × 20 or Ø75',recess:'e.g. Ø65 or 55 × 55',height:'e.g. 80',flux:'e.g. 650',diagramUrl:'Paste drawing URL',sku:'e.g. LC-07-3000-24',price:'e.g. 2500',ies:'Paste photometric file URL'};
const emptyModel=m=>!(m.variants||[]).length&&!Object.values(m.options||{}).some(v=>v.length)&&!fields.some(([key])=>String(m[key]??'').trim());
export default function ManufacturerFamilyEditor({product,fitting,onSave,onCancel,onUpload,onAi,busy,linearChoices,entryLevel='family'}){
 const [draft,setDraft]=useState(()=>({...product,specs:{...product.specs}}));
 const [models,setModels]=useState(()=>product.specs?.manufacturerFamily?.models||(entryLevel==='family'&&!product.model?[blankModel(),blankModel(),blankModel()]:[{...blankModel(),article:product.model||'',power:product.specs?.power||'',size:product.specs?.size||'',recess:product.specs?.recess||'',height:product.specs?.height||'',flux:product.specs?.flux||'',diagramUrl:product.specs?.diagramUrl||'',imageUrl:product.imageUrl||''}]));
 const [level,setLevel]=useState(product.specs?.manufacturerFamily?.level||(entryLevel==='variant'?'product':entryLevel)),[variantId,setVariantId]=useState('');
 const [preview,setPreview]=useState(false),[modelOptions,setModelOptions]=useState(false),[optionInputs,setOptionInputs]=useState({}),[chosen,setChosen]=useState(''),[selection,setSelection]=useState({}),[error,setError]=useState(''),[uploading,setUploading]=useState(false);
 const [catalogueFile,setCatalogueFile]=useState(null),[reading,setReading]=useState(false),[importDraft,setImportDraft]=useState(null),[importSelected,setImportSelected]=useState([]);
 async function readCatalogue(){
  if(!catalogueFile||reading)return;
  setReading(true);setError('');setImportDraft(null);
  try{
   if(catalogueFile.size>3*1024*1024)throw Error('Choose a catalogue excerpt smaller than 3 MB.');
   const base64=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result).split(',')[1]);reader.onerror=reject;reader.readAsDataURL(catalogueFile);});
   const result=await onAi({name:catalogueFile.name,base64,familyImport:true});
   setImportDraft(result);
   const first=result.products[0];
   setImportSelected(result.products.map((p,i)=>p.brand===first?.brand&&p.family===first?.family?i:-1).filter(i=>i>=0));
  }catch(e){setError(e.message||'Unable to read catalogue.');}finally{setReading(false);}
 }
 function applyCatalogue(){
  const candidates=importSelected.map(i=>importDraft.products[i]);
  if(!candidates.length)return;
  const first=candidates[0];
  if(candidates.some(p=>p.brand!==first.brand||p.family!==first.family)){setError('Select products from one manufacturer and family at a time.');return;}
  if((draft.brand&&first.brand&&draft.brand.trim().toLowerCase()!==first.brand.trim().toLowerCase())||(draft.family&&first.family&&draft.family.trim().toLowerCase()!==first.family.trim().toLowerCase())){setError('Selected catalogue belongs to a different manufacturer or family.');return;}
  const commonValue=get=>{const values=candidates.map(get);return values[0]&&values.every(v=>v===values[0])?values[0]:'';};
  setDraft(old=>({...old,brand:old.brand||first.brand,family:old.family||first.family,model:old.model||(level==='product'?first.model:''),specs:{...old.specs,...Object.fromEntries(['shape','ip','warranty'].filter(k=>!old.specs[k]&&commonValue(p=>p.specs[k])).map(k=>[k,commonValue(p=>p.specs[k])])),specSheet:{...old.specs.specSheet,mounting:old.specs.specSheet?.mounting||commonValue(p=>p.specs.specSheet?.mounting)}}}));
  setModels(old=>{
   const next=old.filter(m=>!emptyModel(m));
   for(const p of candidates){
    const spec=p.specs,article=spec.article||p.model;
    const mapping={led:(spec.spectra||[]).map(x=>({'Static white':'Static','Tunable white':'Tunable White','Dim to warm':'Dim to Warm'}[x]||x)),cct:spec.colour||[],beam:(spec.specSheet?.optics||'').match(/\d+(?:\.\d+)?(?=\s*°)/g)||[],reflector:spec.specSheet?.reflectorColor?[spec.specSheet.reflectorColor]:[],trim:spec.specSheet?.trimColor?[spec.specSheet.trimColor]:[],control:spec.control||[]};
    const incoming={...blankModel(),article,imageUrl:p.imageUrl||'',...Object.fromEntries(fields.filter(([k])=>k!=='article'&&k!=='imageUrl').map(([k])=>[k,spec[k]||''])),options:mapping};
    const index=article?next.findIndex(m=>m.article===article):-1;
    if(index<0)next.push(incoming);else{
     const existing=next[index];
     next[index]={...incoming,...Object.fromEntries(Object.entries(existing).filter(([,v])=>v!==''&&v!=null)),options:Object.fromEntries(axes.map(([k])=>[k,[...new Set([...(existing.options?.[k]||[]),...(mapping[k]||[])])]]))};
    }
   }
   while(next.length<3&&level==='family')next.push(blankModel());
   return next;
  });
  setImportDraft(null);setError('');
 }
 const model=models.find(m=>m.id===chosen)||models[0];
 const variant=model?.variants?.find(v=>v.id===variantId)||model?.variants?.[0];
 const update=(key,value)=>setDraft(p=>({...p,[key]:value}));
 const common=(key,value)=>setDraft(p=>({...p,specs:{...p.specs,[key]:value}}));
 const detail=(key,value)=>setDraft(p=>({...p,specs:{...p.specs,specSheet:{...p.specs.specSheet,[key]:value}}}));
 const patch=(id,key,value)=>setModels(old=>old.map(m=>m.id===id?{...m,[key]:value}:m));
 const choices={led:['Static','Tunable White','Dim to Warm','RGBW'],cct:['2200K','2700K','3000K','4000K'],beam:['10','15','24','36','60','90'],reflector:['Black','White','Gold','Chrome'],trim:['Black','White'],control:['On/Off','DALI','Phase dimming','0–10V']};
 const options=key=>[...new Set([...choices[key],...models.flatMap(m=>m.options?.[key]||[])])];
 const applyFamily=(key,value)=>{const all=models.every(m=>(m.options?.[key]||[]).includes(value));setModels(old=>old.map(m=>({...m,options:{...m.options,[key]:all?(m.options?.[key]||[]).filter(v=>v!==value):[...new Set([...(m.options?.[key]||[]),value])]}})));};
 const addOptions=key=>{const values=(optionInputs[key]||'').split(',').map(v=>v.trim()).filter(Boolean);setModels(old=>old.map(m=>({...m,options:{...m.options,[key]:[...new Set([...(m.options?.[key]||[]),...values])]}})));setOptionInputs(old=>({...old,[key]:''}));};
 const toggle=(id,key,value)=>setModels(old=>old.map(m=>{if(m.id!==id)return m;const current=m.options?.[key]||[];return {...m,options:{...m.options,[key]:current.includes(value)?current.filter(v=>v!==value):[...current,value]}}}));
 const selected=Object.fromEntries(axes.map(([key])=>[key,(model?.options?.[key]||[]).includes(selection[key])?selection[key]:'']));
 const save=()=>{const filled=models.filter(m=>!emptyModel(m));const savedModels=filled.length?filled:[models[0]];if(!draft.brand?.trim()||!(level==='family'?draft.family?.trim():draft.model?.trim())||!models.length){setError('Enter manufacturer, a family or product name, and at least one product.');return;}const numeric=['power','flux'];if(models.some(m=>numeric.some(k=>m[k]!==undefined&&m[k]!==''&&(!Number.isFinite(Number(m[k]))||Number(m[k])<0)))){setError('Wattage and luminous flux must be non-negative numbers.');return;}if(models.some(m=>(m.variants||[]).some(v=>!v.sku?.trim()))){setError('Enter a SKU or manufacturer article number for each saved variant.');return;}onSave({...draft,model:level==='family'?draft.family:draft.model,specs:{...draft.specs,article:level==='family'?draft.family:draft.model,manufacturerFamily:{level,models:savedModels}}});};
 async function upload(file,callback){if(!file)return;setUploading(true);setError('');try{const asset=await onUpload(file);callback(asset.url)}catch(e){setError(e.message)}finally{setUploading(false)}}
 return <section className="manufacturer-family-editor"><header><h2>Manufacturer catalogue</h2><div className="family-level-strip">{[['family','Family'],['product','Product'],['variant','Variant']].map(([id,label])=><button type="button" key={id} aria-pressed={level===id} onClick={()=>{if(id!=='variant')setLevel(id);else{setPreview(false);document.getElementById('manufacturer-variants')?.scrollIntoView({block:'start'})}}}>{label}</button>)}</div></header>
 <section className="family-sheet-section"><h3>{level==='family'?'Family information':'Product information'}</h3>
 <div className="manufacturer-family-fields family-identity-fields">
 {(level==='family'?['brand','family']:['brand','model','family']).map(key=><label key={key}>{({brand:'Manufacturer',model:'Product name',family:level==='family'?'Product family':'Family name (optional)'})[key]}<input placeholder={hints[key]} value={draft[key]||''} onChange={e=>update(key,e.target.value)}/></label>)}

 </div><details className="family-common-details"><summary>Common specifications (optional)</summary><div className="manufacturer-family-fields">
 {['shape','ip','warranty'].map((key,i)=><label key={key}>{['Shape','IP rating','Warranty (years)'][i]}<input placeholder={hints[key]} value={draft.specs[key]||''} onChange={e=>common(key,e.target.value)}/></label>)}
 <label>Mounting<input placeholder={hints.mounting} value={draft.specs.specSheet?.mounting||''} onChange={e=>detail('mounting',e.target.value)}/></label>
 </div></details><div className="manufacturer-family-fields family-asset-fields">
 <label>Family image<input placeholder={hints.imageUrl} value={draft.imageUrl||''} onChange={e=>update('imageUrl',e.target.value)}/>
 {onUpload&&<input type="file" accept="image/png,image/jpeg,image/webp" onChange={e=>upload(e.target.files?.[0],url=>update('imageUrl',url))}/>}</label>
 <label>Catalogue / datasheet<input placeholder={hints.datasheet} value={draft.specs.datasheet||''} onChange={e=>common('datasheet',e.target.value)}/>
 {(onUpload||onAi)&&<input type="file" accept=".pdf,.png,.jpg,.jpeg,.webp,.xlsx,.xls,.csv,.tsv" onChange={e=>{const file=e.target.files?.[0];setCatalogueFile(file||null);if(file&&onUpload&&/\.(pdf|png|jpe?g|webp)$/i.test(file.name))upload(file,url=>common('datasheet',url))}}/>}
 {onAi&&<button type="button" disabled={!catalogueFile||reading||uploading||busy} onClick={readCatalogue}>{reading?'Reading catalogue…':'Read catalogue and fill fields'}</button>}</label>
 </div>{linearChoices&&<LinearApplicationPicker choices={linearChoices} selected={draft.linearApplicationIds||[]} onChange={ids=>update('linearApplicationIds',ids)} disabled={busy}/>}
 {importDraft&&<section className="family-sheet-section"><h3>Review extracted products</h3>{importDraft.warnings.map((w,i)=><p key={i}>{w}</p>)}{!importDraft.products.length&&<p>No products detected.</p>}<div className="manufacturer-family-table"><table><thead><tr><th>Include</th><th>Manufacturer</th><th>Family</th><th>Article / model</th><th>Source</th></tr></thead><tbody>{importDraft.products.map((p,i)=><tr key={i}><td><input type="checkbox" checked={importSelected.includes(i)} onChange={e=>setImportSelected(old=>e.target.checked?[...old,i]:old.filter(n=>n!==i))}/></td><td>{p.brand}</td><td>{p.family}</td><td>{p.specs.article||p.model}</td><td>{p.source}</td></tr>)}</tbody></table></div><button type="button" disabled={!importSelected.length} onClick={applyCatalogue}>Fill selected products</button> <button type="button" onClick={()=>setImportDraft(null)}>Cancel review</button></section>}
 </section>
 <section className="family-sheet-section"><div className="family-section-heading"><h3>Products · housing and dimensions</h3><button type="button" onClick={()=>{setLevel('family');setModels(old=>[...old,blankModel()])}}>+ Add product</button></div><div className="manufacturer-family-table family-product-columns"><table><thead><tr><th>Specification</th>{models.map((m,i)=><th key={m.id}>Product {i+1} {models.length>1&&<button type="button" aria-label={'Remove product '+(i+1)} onClick={()=>{if(!emptyModel(m)&&!window.confirm('Remove this product and its variants?'))return;setModels(old=>old.filter(x=>x.id!==m.id))}}>×</button>}</th>)}</tr></thead><tbody>{fields.map(([key,label])=><tr key={key}><th>{label}</th>{models.map(m=><td key={m.id}>{(key==='imageUrl'||key==='diagramUrl')&&m[key]&&<img className="family-model-image" src={m[key]} alt={label}/>}<input aria-label={label} placeholder={hints[key]} value={m[key]||''} onChange={e=>patch(m.id,key,e.target.value)}/>{(key==='diagramUrl'||key==='imageUrl')&&onUpload&&<input type="file" accept="image/png,image/jpeg,image/webp" onChange={e=>upload(e.target.files?.[0],url=>patch(m.id,key,url))}/>}</td>)}</tr>)}</tbody></table></div></section>
 <section className="family-sheet-section"><div className="family-section-heading"><h3>Available product options</h3><button type="button" aria-expanded={modelOptions} onClick={()=>setModelOptions(v=>!v)}>{modelOptions?'Hide model-specific options':'Model-specific options'}</button></div>
 <div className="manufacturer-family-table"><table className="family-option-table"><tbody>{axes.map(([key,label])=><tr key={key}><th>{label}</th><td><div className="family-option-buttons">{options(key).map(value=>{const count=models.filter(m=>(m.options?.[key]||[]).includes(value)).length;return <button type="button" key={value} aria-pressed={count===models.length?'true':count?'mixed':'false'} onClick={()=>applyFamily(key,value)}>{value}{key==='beam'?'°':''}{count>0&&count<models.length?' · '+count+'/'+models.length:''}</button>})}<div className="family-option-add"><input aria-label={'Add '+label} placeholder="Add option" value={optionInputs[key]||''} onChange={e=>setOptionInputs(old=>({...old,[key]:e.target.value}))} onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault();addOptions(key)}}}/><button type="button" disabled={!optionInputs[key]?.trim()} onClick={()=>addOptions(key)}>+</button></div></div></td></tr>)}</tbody></table></div>
 {modelOptions&&<div className="manufacturer-family-table"><table><thead><tr><th>Parameter</th><th>Option</th>{models.map((m,i)=><th key={m.id}>{m.power?m.power+'W':'Model '+(i+1)}</th>)}</tr></thead><tbody>{axes.flatMap(([key,label])=>options(key).map(value=><tr key={key+value}><th>{label}</th><td>{value}</td>{models.map(m=><td key={m.id}><input type="checkbox" aria-label={label+' '+value} checked={(m.options?.[key]||[]).includes(value)} onChange={()=>toggle(m.id,key,value)}/></td>)}</tr>))}</tbody></table></div>}</section>
 <section className="family-sheet-section" id="manufacturer-variants"><div className="family-section-heading"><h3>Product variants · SKU register</h3><button type="button" onClick={()=>{const id=blankModel().id;patch(model.id,'variants',[...(model.variants||[]),{id,sku:'',configuration:{}}]);setVariantId(id)}}>+ Add variant</button></div><label>Select product<select value={model.id} onChange={e=>{setChosen(e.target.value);setVariantId('')}}>{models.map((m,i)=><option key={m.id} value={m.id}>{m.article||m.power&&m.power+'W'||'Product '+(i+1)}</option>)}</select></label>
 <div className="manufacturer-family-table"><table><thead><tr><th>SKU / article</th>{axes.map(([key,label])=><th key={key}>{label}</th>)}<th>Power (W)</th><th>Flux (lm)</th><th>Price</th><th>IES / LDT URL</th><th>Actions</th></tr></thead><tbody>{(model.variants||[]).map(v=><tr key={v.id} onClick={()=>setVariantId(v.id)} className={variant?.id===v.id?'is-selected':''}><td><input placeholder={hints.sku} value={v.sku||''} onChange={e=>patch(model.id,'variants',model.variants.map(x=>x.id===v.id?{...x,sku:e.target.value}:x))}/></td>{axes.map(([key,label])=><td key={key}><select aria-label={label} value={v.configuration?.[key]||''} onChange={e=>patch(model.id,'variants',model.variants.map(x=>x.id===v.id?{...x,configuration:{...x.configuration,[key]:e.target.value}}:x))}><option value="">—</option>{[...new Set([...(model.options?.[key]||[]),...(v.configuration?.[key]?[v.configuration[key]]:[])])].map(value=><option key={value}>{value}</option>)}</select></td>)}{['power','flux','price','ies'].map(key=><td key={key}><input placeholder={hints[key]} value={v[key]||''} onChange={e=>patch(model.id,'variants',model.variants.map(x=>x.id===v.id?{...x,[key]:e.target.value}:x))}/></td>)}<td><button type="button" onClick={()=>patch(model.id,'variants',model.variants.filter(x=>x.id!==v.id))}>Delete</button></td></tr>)}</tbody></table></div></section>
 {preview&&model&&<section className="family-sheet-section"><h3>Specification preview</h3><div className="manufacturer-family-fields"><label>Product<select value={model.id} onChange={e=>{setChosen(e.target.value);setSelection({});setVariantId('')}}>{models.map((m,i)=><option key={m.id} value={m.id}>{m.article||m.power+'W'}</option>)}</select></label>{axes.filter(([key])=>model.options?.[key]?.length).map(([key,label])=><label key={key}>{label}<select value={selected[key]} onChange={e=>setSelection(old=>({...old,[key]:e.target.value}))}><option value="">Select</option>{model.options[key].map(v=><option key={v}>{v}</option>)}</select></label>)}</div><SpecSheetLivePreview product={familyModelProduct(draft,model,variant?.configuration||selected,variant)} fitting={fitting}/></section>}
 {error&&<p role="alert">{error}</p>}<footer><button type="button" onClick={onCancel} disabled={busy||uploading||reading}>Cancel</button><button type="button" aria-expanded={preview} onClick={()=>setPreview(v=>!v)}>{preview?'Hide preview':'Preview specification'}</button><button type="button" className="primary" onClick={save} disabled={busy||uploading||reading}>{busy||uploading?'Saving…':'Save catalogue'}</button></footer></section>;
}
