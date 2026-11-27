import React,{useState} from 'react';
import {familyModelProduct} from './manufacturer-family.mjs';
import {SpecSheetLivePreview} from './ProductSpecSheet.jsx';
import LinearApplicationPicker from './LinearApplicationPicker.jsx';
import './ManufacturerFamilyEditor.css';

const axes=[['led','LED type'],['cct','Colour temperature'],['beam','Beam angle'],['reflector','Reflector finish'],['trim','Trim finish'],['control','Control']];
const fields=[['article','Article number'],['power','Wattage (W)'],['size','Construction size (mm)'],['recess','Cut-out (mm)'],['height','Height (mm)'],['flux','Luminous flux (lm)'],['diagramUrl','Dimensional drawing URL']];
const blankModel=()=>({id:'model-'+Date.now()+'-'+Math.random().toString(36).slice(2,7),options:{}});
const pilotModels=()=>['12','24','32'].map(power=>({...blankModel(),article:'',power,options:{beam:['60','90']}}));
export default function ManufacturerFamilyEditor({product,fitting,onSave,onCancel,onUpload,busy,linearChoices}){
 const [draft,setDraft]=useState(()=>({...product,specs:{...product.specs}}));
 const [models,setModels]=useState(()=>product.specs?.manufacturerFamily?.models||pilotModels());
 const [tab,setTab]=useState('family'),[optionInputs,setOptionInputs]=useState({}),[chosen,setChosen]=useState(''),[selection,setSelection]=useState({}),[error,setError]=useState(''),[uploading,setUploading]=useState(false);
 const model=models.find(m=>m.id===chosen)||models[0];
 const update=(key,value)=>setDraft(p=>({...p,[key]:value}));
 const common=(key,value)=>setDraft(p=>({...p,specs:{...p.specs,[key]:value}}));
 const detail=(key,value)=>setDraft(p=>({...p,specs:{...p.specs,specSheet:{...p.specs.specSheet,[key]:value}}}));
 const patch=(id,key,value)=>setModels(old=>old.map(m=>m.id===id?{...m,[key]:value}:m));
 const options=key=>[...new Set(models.flatMap(m=>m.options?.[key]||[]).concat(optionInputs[key]?.split(',').map(v=>v.trim()).filter(Boolean)||[]))];
 const toggle=(id,key,value)=>setModels(old=>old.map(m=>{if(m.id!==id)return m;const current=m.options?.[key]||[];return {...m,options:{...m.options,[key]:current.includes(value)?current.filter(v=>v!==value):[...current,value]}}}));
 const selected=Object.fromEntries(axes.map(([key])=>[key,(model?.options?.[key]||[]).includes(selection[key])?selection[key]:'']));
 const save=()=>{if(!draft.brand?.trim()||!draft.family?.trim()||!models.length){setError('Enter manufacturer, family name and at least one model.');return;}const numeric=['power','size','recess','height','flux'];if(models.some(m=>numeric.some(k=>m[k]!==undefined&&m[k]!==''&&(!Number.isFinite(Number(m[k]))||Number(m[k])<0)))){setError('Model dimensions and performance must be non-negative numbers.');return;}onSave({...draft,model:draft.family,specs:{...draft.specs,article:draft.family,manufacturerFamily:{models}}});};
 async function upload(file,callback){if(!file)return;setUploading(true);setError('');try{const asset=await onUpload(file);callback(asset.url)}catch(e){setError(e.message)}finally{setUploading(false)}}
 return <section className="manufacturer-family-editor"><header><h2>Manufacturer product family</h2><p>Lightcast-inspired pilot · brochure shows 12W, 24W and 32W with 60° and 90° distributions. Other values can be entered from the manufacturer catalogue.</p></header>
 <nav aria-label="Family sections">{[['family','Family'],['models','Models'],['config','Configurations'],['preview','Specification preview']].map(([id,label])=><button type="button" key={id} aria-pressed={tab===id} onClick={()=>setTab(id)}>{label}</button>)}</nav>
 {tab==='family'&&<div className="manufacturer-family-fields">
 {['brand','family'].map((key,i)=><label key={key}>{['Manufacturer','Product family'][i]}<input value={draft[key]||''} onChange={e=>update(key,e.target.value)}/></label>)}
 <button type="button" onClick={()=>{update('brand','ERCO');update('family','Lightcast')}}>Use Lightcast pilot name</button>
 {['shape','ip','warranty'].map((key,i)=><label key={key}>{['Shape','IP rating','Warranty (years)'][i]}<input value={draft.specs[key]||''} onChange={e=>common(key,e.target.value)}/></label>)}
 <label>Mounting<input value={draft.specs.specSheet?.mounting||''} onChange={e=>detail('mounting',e.target.value)}/></label>
 <label>Family image URL<input value={draft.imageUrl||''} onChange={e=>update('imageUrl',e.target.value)}/></label>
 {onUpload&&<label>Upload family image<input type="file" accept="image/png,image/jpeg,image/webp" onChange={e=>upload(e.target.files?.[0],url=>update('imageUrl',url))}/></label>}
 <label>Catalogue URL<input value={draft.specs.datasheet||''} onChange={e=>common('datasheet',e.target.value)}/></label>
 {onUpload&&<label>Upload catalogue<input type="file" accept=".pdf" onChange={e=>upload(e.target.files?.[0],url=>common('datasheet',url))}/></label>}
 {linearChoices&&<LinearApplicationPicker choices={linearChoices} selected={draft.linearApplicationIds||[]} onChange={ids=>update('linearApplicationIds',ids)} disabled={busy}/>}
 </div>}
 {tab==='models'&&<div className="manufacturer-family-table"><table><thead><tr><th>Specification</th>{models.map((m,i)=><th key={m.id}>Model {i+1} {models.length>1&&<button type="button" onClick={()=>setModels(old=>old.filter(x=>x.id!==m.id))}>×</button>}</th>)}</tr></thead><tbody>{fields.map(([key,label])=><tr key={key}><th>{label}</th>{models.map(m=><td key={m.id}><input aria-label={label} value={m[key]||''} onChange={e=>patch(m.id,key,e.target.value)}/>{key==='diagramUrl'&&onUpload&&<input type="file" accept="image/png,image/jpeg,image/webp" onChange={e=>upload(e.target.files?.[0],url=>patch(m.id,key,url))}/>}</td>)}</tr>)}</tbody></table><button type="button" onClick={()=>setModels(old=>[...old,blankModel()])}>+ Add model</button></div>}
 {tab==='config'&&<div className="manufacturer-family-table"><table><thead><tr><th>Parameter</th><th>Option</th>{models.map((m,i)=><th key={m.id}>{m.power?m.power+'W':'Model '+(i+1)}</th>)}</tr></thead><tbody>{axes.map(([key,label])=><React.Fragment key={key}>{options(key).map(value=><tr key={value}><th>{label}</th><td>{value}</td>{models.map(m=><td key={m.id}><input type="checkbox" aria-label={label+' '+value} checked={(m.options?.[key]||[]).includes(value)} onChange={()=>toggle(m.id,key,value)}/></td>)}</tr>)}<tr><th>{label}</th><td colSpan={models.length+1}><input placeholder="Add options, separated by commas" value={optionInputs[key]||''} onChange={e=>setOptionInputs(old=>({...old,[key]:e.target.value}))}/></td></tr></React.Fragment>)}</tbody></table></div>}
 {tab==='preview'&&model&&<><div className="manufacturer-family-fields"><label>Model<select value={model.id} onChange={e=>{setChosen(e.target.value);setSelection({})}}>{models.map((m,i)=><option key={m.id} value={m.id}>{m.article||m.power+'W'}</option>)}</select></label>{axes.filter(([key])=>model.options?.[key]?.length).map(([key,label])=><label key={key}>{label}<select value={selected[key]} onChange={e=>setSelection(old=>({...old,[key]:e.target.value}))}><option value="">Select</option>{model.options[key].map(v=><option key={v}>{v}</option>)}</select></label>)}</div><SpecSheetLivePreview product={familyModelProduct(draft,model,selected)} fitting={fitting}/></>}
 {error&&<p role="alert">{error}</p>}<footer><button type="button" onClick={onCancel} disabled={busy||uploading}>Cancel</button><button type="button" className="primary" onClick={save} disabled={busy||uploading}>{busy||uploading?'Saving…':'Save family'}</button></footer></section>;
}
