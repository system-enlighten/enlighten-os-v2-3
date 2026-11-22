import React,{useState} from 'react';
import './ProductDialog.css';

const fields=[['fittingType','Fitting type code'],['iconUrl','Icon'],['thumbnailUrl','Reference image'],['brand','Brand / IP / Article'],['x','X'],['pcbWidth','PCB width'],['standardLengths','Standard lengths'],['wattage','Wattage (W or W/m)']];
export default function ProductTypeEditor({fitting,onSave,onUpload,onClose,onOpenProducts,onDelete,deleteBlocked,renderImage}){
 const [draft,setDraft]=useState(fitting),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const visibleFields=/^L/i.test(draft.fittingType.trim())?fields:fields.slice(0,3);
 const update=(field,value)=>setDraft(current=>({...current,[field]:value}));
 async function submit(event){
  event.preventDefault();
  if(busy)return;
  setBusy(true);setError('');
  try{await onSave({...draft,fittingType:draft.fittingType.trim()});}
  catch(err){setError(err.message);}
  finally{setBusy(false);}
 }
 async function remove(){
  if(busy||deleteBlocked||!window.confirm(`Delete fitting type ${fitting.fittingType} from Product Database?`))return;
  setBusy(true);setError('');
  try{await onDelete();}
  catch(err){setError(err.message);}
  finally{setBusy(false);}
 }
 async function upload(event,field){
  const file=event.currentTarget.files?.[0];
  event.currentTarget.value='';
  if(!file)return;
  setBusy(true);setError('');
  try{update(field,(await onUpload(file)).url);}
  catch(err){setError(err.message);}
  finally{setBusy(false);}
 }
 return <div className="product-dialog-overlay" role="dialog" aria-modal="true" aria-labelledby="fitting-editor-title">
  <section className="product-panel product-dialog fitting-editor">
   <header className="product-dialog-header">
    <h2 id="fitting-editor-title">{fitting.existing?'Edit fitting type':'Add fitting type'}</h2>
    <button type="button" className="product-dialog-close" disabled={busy} onClick={onClose}>Close ×</button>
   </header>
   {error&&<p role="alert">{error}</p>}
   <form className="product-form" onSubmit={submit}>
    <div className="product-fields">{visibleFields.map(([key,label])=>{
     const media=key==='iconUrl'||key==='thumbnailUrl';
     return <div key={key}>
      <label>{label}{media?' URL':''}<input autoFocus={key==='fittingType'} required={key==='fittingType'} maxLength={media?2000:500} disabled={busy} value={draft[key]||''} onChange={event=>update(key,event.target.value)}/></label>
      {media&&<>{draft[key]&&renderImage(draft[key],label)}<label>Upload {label.toLowerCase()}<input type="file" accept="image/png,image/jpeg,image/webp" disabled={busy} onChange={event=>upload(event,key)}/></label></>}
     </div>;
    })}</div>
    <div className="product-actions"><button className="fitting-save" type="submit" disabled={busy||!draft.fittingType.trim()}>{busy?'Working…':'Save fitting type'}</button><button type="button" disabled={busy} onClick={onClose}>Cancel</button>{onOpenProducts&&<button className="fitting-manage" type="button" disabled={busy} onClick={onOpenProducts}>Manage manufacturer products</button>}{onDelete&&<button type="button" className="fitting-delete" disabled={busy||deleteBlocked} aria-describedby={deleteBlocked?'fitting-delete-note':undefined} onClick={remove}>Delete fitting type</button>}</div>
    {onDelete&&deleteBlocked&&<p id="fitting-delete-note">Remove the linked manufacturer products before deleting this fitting type.</p>}
   </form>
  </section>
 </div>;
}
