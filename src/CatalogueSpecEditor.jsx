import React,{useState} from 'react';
import {specSheetFields} from './spec-sheet.mjs';
import './CatalogueSpecEditor.css';

const sections=[
 ['Mechanical',[['shape','Shape'],['ip','IP Rating'],['size','Construction size (mm)'],['recess','Cut-out / recess depth (mm)'],['height','Height (mm)']]],
 ['Optical',[['colour','Light colour'],['distribution','Distribution'],['spectra','Spectra'],['cri','CRI'],['flux','LED output (lm)'],['photometry','Photometry']]],
 ['Electrical',[['control','Control'],['infrastructure','Infrastructure'],['power','Power (W)'],['life','Life (hours)'],['warranty','Warranty (years)'],['voltage','Voltage']]],
];
const listKeys=new Set(['colour','distribution','spectra','control','infrastructure']);
const details=Object.fromEntries(specSheetFields);
const assets=[['imageUrl','Product image'],['diagramUrl','Dimensions / cut-out drawing'],['photometricUrl','Optical diagram'],['symbolsUrl','Certifications / symbols'],['controlDiagramUrl','Control diagram']];
const attachments=[
 ['maintenanceAttachmentUrl','Maintenance document'],['lmfAttachmentUrl','LMF document'],
 ['datasheet','Data sheet'],['lm80','LM-80 report'],['tm30','TM-30 report'],
 ['certificate','Certificate'],['ies','IES photometric file'],
];
const documentTypes='.pdf,.png,.jpg,.jpeg,.webp';

export function CatalogueSpecEditor({product,onSave,onCancel,onUpload,onAi,busy}){
 const [draft,setDraft]=useState(()=>({...product,model:product.specs?.article||product.model})),[loading,setLoading]=useState(''),[error,setError]=useState(''),[result,setResult]=useState(null),[selected,setSelected]=useState('');
 const specs=draft.specs||{},detail=specs.specSheet||{};
 const update=(key,value,target='specs')=>setDraft(old=>target==='product'?{...old,[key]:value}:target==='detail'?{...old,specs:{...old.specs,specSheet:{...old.specs?.specSheet,[key]:value}}}:{...old,specs:{...old.specs,[key]:value}});
 async function extract(file){
  if(!file)return;
  if(file.size>3*1024*1024){setError('Choose a file smaller than 3 MB.');return;}
  setLoading('Reading catalogue…');setError('');setResult(null);setSelected('');
  try{
   const base64=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result).split(',')[1]);reader.onerror=reject;reader.readAsDataURL(file);});
   setResult(await onAi({name:file.name,base64}));
  }catch(e){setError(e.message||'Could not read catalogue.');}finally{setLoading('');}
 }
 const supplied=values=>Object.fromEntries(Object.entries(values||{}).filter(([,v])=>Array.isArray(v)?v.length:typeof v==='string'&&v.trim()));
 function applyCandidate(){
  const candidate=result?.products[Number(selected)];
  if(!candidate||selected==='')return;
  const {specSheet,...fields}=candidate.specs||{};
  setDraft(old=>({...old,...supplied({brand:candidate.brand,family:candidate.family,model:candidate.specs?.article||candidate.model,imageUrl:candidate.imageUrl,brandLogoUrl:candidate.brandLogoUrl,notes:candidate.notes}),specs:{...old.specs,...supplied(fields),specSheet:{...old.specs?.specSheet,...supplied(specSheet)}}}));
  setResult(null);
 }
 async function upload(file,key,target){
  if(!file)return;
  setLoading('Uploading file…');setError('');
  try{const asset=await onUpload(file);if(!asset?.url)throw Error('File URL is missing.');update(key,asset.url,target);}
  catch(e){setError(e.message||'Could not upload file.');}finally{setLoading('');}
 }
 function row(key,label,target='specs',required=false){
  const raw=(target==='product'?draft:target==='detail'?detail:specs)[key];
  const value=Array.isArray(raw)?raw.join(', '):raw??'';
  return <label className={'catalogue-spec-row'+(String(value).trim()?' is-filled':'')} key={key}><span>{label}</span><input inputMode={key==='brandLogoUrl'?'url':undefined} required={required} value={value} onChange={e=>update(key,e.target.value,target)} onBlur={e=>{if(listKeys.has(key))update(key,e.target.value.split(',').map(s=>s.trim()).filter(Boolean));}}/></label>;
 }
 const classified=new Set(sections.flatMap(([,rows])=>rows.map(([key])=>key)));
 return <form className="catalogue-spec-editor technical-themed-toolbar" onSubmit={e=>{
  e.preventDefault();
  const normalized=Object.fromEntries([...listKeys].filter(key=>typeof specs[key]==='string').map(key=>[key,specs[key].split(',').map(s=>s.trim()).filter(Boolean)]));
  const article=draft.model?.trim();
  if(!busy&&!loading&&article)onSave({...draft,model:draft.model?.trim()||article,specs:{...specs,...normalized,article}});
 }}>
 <header><div className="catalogue-spec-title"><h3>Manufacturer specification</h3><strong>{draft.specs?.article||draft.model||product.model}</strong></div>{onAi&&<label>Read catalogue, datasheet or photo<input type="file" accept=".pdf,.jpg,.jpeg,.png,.webp,.xlsx,.xls,.csv,.tsv" disabled={busy||!!loading} onChange={e=>{const file=e.target.files?.[0];e.target.value='';extract(file);}}/></label>}</header>
 {loading&&<p role="status">{loading}</p>}{error&&<p role="alert">{error}</p>}
 {result&&<section><p>Choose a model and check the imported fields before saving.</p><label>Catalogue model<select value={selected} onChange={e=>setSelected(e.target.value)}><option value="">Select model</option>{result.products.map((p,i)=><option key={i} value={i}>{[p.brand,p.model,p.specs?.article,p.source].filter(Boolean).join(' · ')}</option>)}</select></label><button type="button" disabled={selected===''} onClick={applyCandidate}>Fill spec sheet</button>{result.warnings.map((w,i)=><p key={i}>{w}</p>)}</section>}
 <div className="catalogue-spec-columns"><div className="catalogue-spec-fields">
 {row('brand','Manufacturer','product',true)}{row('model','Model / Catalogue No.','product',true)}{row('family','Product family','product')}
 {sections.map(([title,fields])=><section key={title}><h4>{title}</h4>{fields.map(([key,label])=>row(key,label,key==='voltage'?'detail':'specs'))}{Object.entries(details).filter(([key])=>!classified.has(key)&&!['designIntent','customization','equivalents'].includes(key)).filter(([key])=>title==='Mechanical'?['trimColor','reflectorColor','dimensions','mounting','aiming','weight','ik','accessories'].includes(key):title==='Optical'?['r9','optics','ugr','sdcm','brightness'].includes(key):!['trimColor','reflectorColor','dimensions','mounting','aiming','weight','ik','accessories','r9','optics','ugr','sdcm','brightness'].includes(key)).map(([key,label])=>row(key,label,'detail'))}</section>)}
 <section><h4>Maintenance</h4>{row('maintenance','Maintenance factor (0–1)')}{row('lmf','LMF')}</section>
 <details><summary>Pricing and additional information</summary>{row('mrp','MRP')}{row('price','Price')}{row('currency','Currency')}{row('notes','Notes','product')}{row('brandLogoUrl','Brand logo URL','product')}</details>
 </div><div className="catalogue-spec-assets">{assets.map(([key,label],i)=>{
  const target=i===0?'product':i===1?'specs':'detail';
  const url=(target==='product'?draft:target==='detail'?detail:specs)[key];
  return <section key={key}><h4>{label}</h4>{url&&<img src={url} alt={label}/>}
   {row(key,'Image URL',target)}{onUpload&&<label>Upload image<input type="file" accept="image/png,image/jpeg,image/webp" disabled={busy||!!loading} onChange={e=>upload(e.target.files?.[0],key,target)}/></label>}
  </section>;
 })}
 <section className="catalogue-spec-attachments">
  <h4>Attachments</h4>
  {attachments.map(([key,label])=>{
   const value=specs[key];
   const isLink=typeof value==='string'&&/^https?:\/\//i.test(value);
   return <div className="catalogue-spec-attachment" key={key}>
    <label>{label}{onUpload&&<input type="file" accept={key==='ies'?'.ies':documentTypes} disabled={busy||!!loading} onChange={e=>{
     const file=e.target.files?.[0];
     e.target.value='';
     upload(file,key);
    }}/>}</label>
    {value&&<div className="catalogue-spec-attachment-actions">
     {isLink?<a href={value} target="_blank" rel="noreferrer">Open {label}</a>:<span>{String(value)}</span>}
     <button type="button" disabled={busy||!!loading} onClick={()=>update(key,'')}>Remove</button>
    </div>}
   </div>;
  })}
 </section>
 </div></div>
 <footer><button className="technical-primary-action" disabled={busy||!!loading}>Save product</button><button type="button" onClick={onCancel}>Cancel</button></footer>
 </form>;
}
