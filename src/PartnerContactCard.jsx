import React,{useState} from 'react';

const fields=[
 ['name','Full company name'],['description','Company details'],['address','Address'],
 ['gstin','GST details'],['phone','Phone'],['email','Email'],['logo','Logo URL'],
];
export default function PartnerContactCard({record,product,fitting,group,projectId,busy,canEdit,onSave,onBack}){
 const [editing,setEditing]=useState(false),[contact,setContact]=useState(false),[notice,setNotice]=useState('');
 const details={name:record?.partner||product.brand,...record?.partnerDetails};
 const logo=details.logo||product.brandLogoUrl;
 const email=details.email||(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(record?.contact||'')?record.contact:'');
 const phone=(details.phone||'').replace(/[^+\d]/g,'');
 async function share(){
  const lines=[details.name,...fields.filter(([key])=>!['name','logo'].includes(key)).map(([key,label])=>{
   const value=key==='email'?email:details[key];
   return value?label+' · '+value:'';
  })].filter(Boolean);
  try{
   const text=lines.join('\n');
   if(navigator.share)await navigator.share({title:details.name,text});
   else{await navigator.clipboard.writeText(text);setNotice('Partner details copied.');}
  }catch(error){if(error.name!=='AbortError')setNotice('Sharing is unavailable in this browser.');}
 }
 async function save(event){
  event.preventDefault();
  const partnerDetails=Object.fromEntries(new FormData(event.currentTarget));
  const saved=await onSave({...record,id:record?.id||'product-action-'+crypto.randomUUID(),kind:'contact',projectId,fittingId:record?.fittingId||fitting.id,productId:record?.productId||product.id,code:record?.code||group.code,brand:product.brand,article:record?.article||product.specs?.article||product.model,quantity:record?.quantity??0,partnerDetails});
  if(saved)setEditing(false);
 }
 return <section className="partner-history">
  <div className="partner-contact-card">
   {logo&&<img className="partner-contact-logo" src={logo} alt={details.name+' logo'}/>}
   <h3>{details.name}</h3>
   {editing?<form className="partner-entry" onSubmit={save}>
    <div className="partner-fields">{fields.map(([key,label])=><label key={key}>{label}
     {['address','description'].includes(key)?<textarea name={key} defaultValue={details[key]||''}/>:<input name={key} required={key==='name'} type={key==='email'?'email':key==='logo'?'url':key==='phone'?'tel':'text'} defaultValue={key==='email'?email:details[key]||''}/>}
    </label>)}</div>
    <button className="partner-primary" disabled={busy}>Save partner details</button>{' '}<button type="button" disabled={busy} onClick={()=>setEditing(false)}>Cancel</button>
   </form>:<>
    <dl>{fields.filter(([key])=>!['name','logo'].includes(key)).map(([key,label])=><div key={key}><dt>{label}</dt><dd>{(key==='email'?email:details[key])||'—'}</dd></div>)}</dl>
    <div className="partner-contact-actions">
     <button type="button" onClick={share}>Share</button>
     <button className="partner-primary" type="button" disabled={!email&&!phone} aria-expanded={contact} onClick={()=>setContact(value=>!value)}>Contact</button>
     {canEdit&&<button type="button" onClick={()=>setEditing(true)}>Edit partner details</button>}
    </div>
    {contact&&<div className="partner-contact-actions">{phone&&<a href={'tel:'+phone}>Call {details.phone}</a>}{email&&<a href={'mailto:'+encodeURIComponent(email).replace('%40','@')}>Email {email}</a>}</div>}
    {notice&&<p role="status">{notice}</p>}
   </>}
  </div>
  <div><button type="button" disabled={busy} onClick={onBack}>Back to spec sheet</button></div>
 </section>;
}
