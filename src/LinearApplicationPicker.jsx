import React,{useState} from 'react';

export default function LinearApplicationPicker({choices,selected=[],onChange,disabled=false}){
 const [query,setQuery]=useState('');
 const q=query.trim().toLowerCase();
 const shown=choices.filter(a=>{
  if(!q)return true;
  if([a.label,a.code].join(' ').toLowerCase().includes(q))return true;
  if(a.variants?.some(v=>[v.code,v.label].join(' ').toLowerCase().includes(q)))return true;
  return false;
 });

 const isSelected=id=>selected.includes(id);

 const toggleParent=(a,checked)=>{
  if(disabled)return;
  const variantIds=a.variants?.length?a.variants.map(v=>v.id):[a.id];
  const set=new Set([a.id,...variantIds]);
  const withoutA=selected.filter(id=>!set.has(id));
  const next=checked?[...withoutA,...variantIds]:withoutA;
  onChange(next);
 };

 const toggleVariant=(a,v,checked)=>{
  if(disabled)return;
  const allVariantIds=a.variants.map(item=>item.id);
  const currentSelected=new Set(
   selected.includes(a.id)?allVariantIds:allVariantIds.filter(id=>selected.includes(id))
  );
  if(checked)currentSelected.add(v.id);
  else currentSelected.delete(v.id);

  const set=new Set([a.id,...allVariantIds]);
  const remaining=selected.filter(id=>!set.has(id));
  onChange([...remaining,...currentSelected]);
 };

 const toggleSingle=(a,checked)=>{
  if(disabled)return;
  const idToToggle=a.variants?.length===1?a.variants[0].id:a.id;
  const next=checked
   ?[...selected.filter(id=>id!==a.id&&id!==idToToggle),idToToggle]
   :selected.filter(id=>id!==a.id&&id!==idToToggle);
  onChange(next);
 };

 return (
  <fieldset className="linear-linked-applications">
   <legend>Linked applications ({selected.length})</legend>
   <input type="search" placeholder="Search applications or codes" value={query} onChange={e=>setQuery(e.target.value)}/>
   <div className="linear-linked-list">
    {shown.map(a=>{
     const hasVariants=Boolean(a.variants&&a.variants.length>1);
     if(!hasVariants){
      const checked=isSelected(a.id)||(a.variants?.length===1&&isSelected(a.variants[0].id));
      return (
       <label key={a.id} className="linear-linked-item">
        <input type="checkbox" disabled={disabled} checked={checked} onChange={e=>toggleSingle(a,e.target.checked)}/>
        {a.url&&<img src={a.url} alt="" loading="lazy"/>}
        <span>{a.label}<small>{a.code}</small></span>
       </label>
      );
     }
     const allVariantIds=a.variants.map(v=>v.id);
     const selectedVariantCount=allVariantIds.filter(id=>isSelected(id)||isSelected(a.id)).length;
     const isAllChecked=selectedVariantCount===allVariantIds.length;
     const isIndeterminate=selectedVariantCount>0&&!isAllChecked;

     return (
      <div key={a.id} className="linear-linked-group">
       <label className="linear-linked-item linear-linked-parent">
        <input
         type="checkbox"
         disabled={disabled}
         checked={isAllChecked}
         ref={el=>{if(el)el.indeterminate=isIndeterminate;}}
         onChange={e=>toggleParent(a,e.target.checked)}
        />
        {a.url&&<img src={a.url} alt="" loading="lazy"/>}
        <span>{a.label}<small>{a.code}</small></span>
       </label>
       <div className="linear-linked-variant-list">
        {a.variants.map(v=>{
         const vChecked=isSelected(v.id)||isSelected(a.id);
         return (
          <label key={v.id} className="linear-linked-variant-item">
           <input
            type="checkbox"
            disabled={disabled}
            checked={vChecked}
            onChange={e=>toggleVariant(a,v,e.target.checked)}
           />
           {v.url&&<img src={v.url} alt="" loading="lazy"/>}
           <span className="linear-variant-info">
            <strong className="linear-variant-code">{v.code}</strong>
            {v.label&&<span className="linear-variant-label"> · {v.label}</span>}
           </span>
          </label>
         );
        })}
       </div>
      </div>
     );
    })}
   </div>
  </fieldset>
 );
}
