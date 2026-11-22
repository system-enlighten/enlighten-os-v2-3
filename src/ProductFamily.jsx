import React from 'react';
import {Box,Lightbulb,Ruler,SlidersHorizontal,Sun,Target} from 'lucide-react';
import {productDimensions,productPower} from './spec-sheet.mjs';
export function ProductFamily({product,catalogue}){
 const normalize=value=>String(value||'').trim().toLowerCase();
 const name=p=>p.specs?.article||p.model;
 const articles=new Map();
 const [familyOnly,setFamilyOnly]=React.useState(!!product.family);
 for(const variant of [product,...catalogue.filter(p=>normalize(p.brand)===normalize(product.brand)&&(!familyOnly||normalize(p.family)===normalize(product.family)))]){
  if(!articles.has(normalize(name(variant))))articles.set(normalize(name(variant)),variant);
 }
 return <section className="visual-product-family"><h3>{product.brand} · {familyOnly?product.family:'Catalogue products'}</h3>{product.family&&<button type="button" onClick={()=>setFamilyOnly(v=>!v)}>{familyOnly?'Show all manufacturer products':'Show this family'}</button>}<div className="visual-product-strip" tabIndex={0} aria-label={`${product.brand} products`}>
 {[...articles.values()].map(variant=>{
  const s=variant.specs||{},d=s.specSheet||{};
  const angle=d.optics?.match(/\b(\d+(?:\.\d+)?)\s*°/);
  const halfWidth=angle?Math.min(45,30*Math.tan(Math.min(86,Number(angle[1])/2)*Math.PI/180)):0;
  return <article key={name(variant)}><h4>{name(variant)}</h4>
   <figure>{variant.imageUrl?<img src={variant.imageUrl} alt={name(variant)}/>:<Box size={35}/>}</figure>
   <dl>{[[Ruler,'Construction',productDimensions(s)],[Lightbulb,'LED data',[productPower(s),s.flux&&s.flux+' lm'].filter(Boolean).join(' · ')],[Sun,'Light colour',(s.colour||[]).join(', ')],[Target,'Light distribution',[(s.distribution||[]).join(', '),d.optics].filter(Boolean).join(' · ')],[Box,'Mounting',d.mounting],[SlidersHorizontal,'Control',(s.control||[]).join(', ')]].map(([Icon,label,value])=><React.Fragment key={label}><dt><Icon size={15}/>{label}</dt><dd>{value||'—'}</dd></React.Fragment>)}</dl>
   {s.diagramUrl&&<img className="visual-product-diagram" src={s.diagramUrl} alt="Manufacturer dimensions and cut-out drawing"/>}
   {(d.photometricUrl||angle)&&<div className="visual-product-optics">{d.photometricUrl?<img src={d.photometricUrl} alt="Manufacturer optical diagram"/>:<svg width="104" height="75" viewBox="0 0 104 75" role="img" aria-label={`Illustrated ${angle[1]} degree beam`}><path d={`M52 9 L${52-halfWidth} 55 H${52+halfWidth} Z`} fill="#e4f2ee" stroke="#42857b"/><text x="52" y="71" textAnchor="middle" fontSize="12">{angle[1]}°</text></svg>}</div>}
  </article>;
 })}</div></section>;
}
