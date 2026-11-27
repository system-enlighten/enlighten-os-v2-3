import React,{useEffect,useState} from 'react';
import './ProductDialog.css';
export default function ApplicationReferenceCapture({user,request}){
 const [draft,setDraft]=useState(null),[options,setOptions]=useState([]),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const admin=String(user?.appAccess||'').toLowerCase()==='admin';
 useEffect(()=>{
  if(!admin)return;
  const drag=e=>{if(!e.defaultPrevented&&Array.from(e.dataTransfer?.items||[]).some(item=>(item.kind==='file'&&/^image\/(png|jpeg|webp)$/.test(item.type))||(item.kind==='string'&&item.type==='text/html')))e.preventDefault()};
  const drop=e=>{
   if(e.defaultPrevented||draft)return;
   const file=Array.from(e.dataTransfer?.files||[]).find(f=>/^image\/(png|jpeg|webp)$/.test(f.type));
   const html=e.dataTransfer?.getData('text/html')||'';const image=html?new DOMParser().parseFromString(html,'text/html').querySelector('img')?.getAttribute('src'):'';
   const url=/^https:\/\/[^\s]+$/.test(image||'')?image:'';
   if(!file&&!url)return;
   e.preventDefault();
   setError('');setDraft({id:crypto.randomUUID(),file,title:'',notes:'',fittingType:'',preview:file?URL.createObjectURL(file):url,url});
   Promise.all([fetch('/technical-library/database.json').then(r=>r.json()),request('listTechnicalFittings',{},'GET',90000)]).then(([seed,overrides])=>{
    const map=new Map(seed.fittings.map(f=>[f.id,f]));overrides.forEach(f=>map.set(f.id,{...map.get(f.id),...f}));setOptions([...new Set([...map.values()].filter(f=>!f.deleted).map(f=>f.fittingType))].sort());
   }).catch(e=>setError(e.message));
  };
  window.addEventListener('dragover',drag);window.addEventListener('drop',drop);
  return()=>{window.removeEventListener('dragover',drag);window.removeEventListener('drop',drop)};
 },[admin,draft,request]);
 const close=()=>{if(draft.file)URL.revokeObjectURL(draft.preview);setDraft(null)};
 const save=async e=>{
  e.preventDefault();setBusy(true);setError('');
  try{
   if(draft.file&&draft.file.size>3*1024*1024)throw Error('Choose a PNG, JPEG or WebP under 3 MB.');
   const base64=draft.file?await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result).split(',')[1]);reader.onerror=reject;reader.readAsDataURL(draft.file)}):'';
   const asset=draft.asset||(draft.url?{url:draft.url}:await request('uploadTechnicalProductAsset',{name:draft.file.name,mimeType:draft.file.type,base64},'POST',120000));
   setDraft(d=>({...d,asset}));
   await request('saveApplicationImage',{record:{id:draft.id,title:draft.title,notes:draft.notes,fittingType:draft.fittingType,imageUrl:asset.url}},'POST',90000);
   window.dispatchEvent(new Event('application-reference-saved'));close();
  }catch(e){setError(e.message)}finally{setBusy(false)}
 };
 if(!draft)return null;
 return <div className="product-dialog-overlay"><section className="product-dialog" role="dialog" aria-modal="true" aria-label="Add to Application References">
 <header className="product-dialog-header"><h2>Add to Application References?</h2></header><form className="product-form" onSubmit={save}>
 <img src={draft.preview} alt="Dropped reference" style={{maxHeight:200,maxWidth:'100%',objectFit:'contain'}}/>
 <div className="product-fields"><label>Reference name<input required value={draft.title} onChange={e=>setDraft(d=>({...d,title:e.target.value}))}/></label><label>Narration<textarea value={draft.notes} onChange={e=>setDraft(d=>({...d,notes:e.target.value}))}/></label><label>Product type<input list="reference-fitting-types" value={draft.fittingType} onChange={e=>setDraft(d=>({...d,fittingType:e.target.value}))}/><datalist id="reference-fitting-types">{options.map(code=><option key={code} value={code}/>)}</datalist></label></div>
 {error&&<p role="alert">{error}</p>}<div className="product-actions"><button type="button" disabled={busy} onClick={close}>Cancel</button><button type="submit" disabled={busy||!!draft.fittingType&&!options.includes(draft.fittingType)}>{busy?'Saving…':'Save reference'}</button></div></form></section></div>;
}
