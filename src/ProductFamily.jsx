import React,{useState} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {Box, Download, Lightbulb, Ruler, SlidersHorizontal, Sun, Target} from 'lucide-react';
import {productDimensions,productPower} from './spec-sheet.mjs';
import './ProductFamily.css';
import familyCss from './ProductFamily.css?raw';

const listText=value=>Array.isArray(value)?value.join(', '):value;
const article=p=>p.specs?.article||p.model;
const normalize=value=>String(value||'').trim().toLowerCase();
const fields=[
 ['construction','Construction size'],['diameter','Diameter (mm)'],['depth','Height / depth (mm)'],
 ['cutout','Cut-out diameter (mm)'],['led','LED data max'],['colour','Light colour'],
 ['distribution','Light distribution'],['mounting','Mounting'],['control','Control'],['beam','Beam angle (°)'],
];
const mountings=['Recessed','Surface','Track','Suspended'];

function familyValues(product){
 const s=product.specs||{},d=s.specSheet||{};
 return {
  construction:productDimensions(s),
  led:[productPower(s),s.flux&&`${s.flux} lm`].filter(Boolean).join(' · '),
  colour:listText(s.colour),distribution:listText(s.distribution),mounting:d.mounting,control:listText(s.control),
  beam:String(d.optics||'').match(/\b(\d+(?:\.\d+)?)\s*°/)?.[1],
  ...s.familyView,
 };
}

function BeamIcon({value}){
 const angle=Number(value);
 if(!(angle>0&&angle<180))return null;
 const halfWidth=32*Math.tan(angle*Math.PI/360);
 const scale=Math.min(1,43/halfWidth);
 return <svg viewBox="0 0 104 66" role="img" aria-label={`${angle}° beam illustration`}>
  <path d={`M52 7 L${52-halfWidth*scale} ${7+32*scale} H${52+halfWidth*scale} Z`} fill="#f4df9d" stroke="currentColor"/>
  <text x="52" y="60" textAnchor="middle">{angle}°</text>
 </svg>;
}

function MountIcon({mounting}){
 const kind=mountings.find(name=>normalize(mounting).includes(normalize(name)));
 if(!kind)return null;
 const fixture={Recessed:'M39 29 V17 H65 V29 Z',Surface:'M39 29 V43 H65 V29 Z',Track:'M52 29 V36 M43 36 H61 V47 H43 Z',Suspended:'M52 29 V44 M38 44 H66 V50 H38 Z'}[kind];
 return <svg viewBox="0 0 104 66" role="img" aria-label={`${kind} mounting illustration`}>
  <path d="M16 29 H88" stroke="currentColor"/>
  <path d={fixture} stroke="currentColor" fill="#e5eeeb"/>
 </svg>;
}

function DimensionIcon({values}){
 if(![values.diameter,values.depth,values.cutout].some(Boolean))return null;
 return <svg viewBox="0 0 185 106" role="img" aria-label="Dimension schematic, not to scale">
  <path d="M62 43 H116 V69 H62 Z M51 69 H127 V74 H51 Z M51 87 H127 M51 83 V91 M127 83 V91 M135 43 V74 M131 43 H139 M131 74 H139 M62 31 H116 M62 27 V35 M116 27 V35" fill="none" stroke="currentColor"/>
  {values.cutout&&<text x="89" y="23" textAnchor="middle">Cut-out Ø{values.cutout}</text>}
  {values.depth&&<text x="142" y="62">{values.depth}</text>}
  {values.diameter&&<text x="89" y="101" textAnchor="middle">Ø{values.diameter} mm</text>}
 </svg>;
}

function FamilyCard({product}){
 const s=product.specs||{},d=s.specSheet||{},values=familyValues(product);
 const rows=[
  [Ruler,'Construction size',values.construction],[Lightbulb,'LED data max',values.led],
  [Sun,'Light colour',values.colour],[Target,'Light distribution',values.distribution],
  [Box,'Mounting',values.mounting],[SlidersHorizontal,'Control',values.control],
 ];
 return <article className="family-variant">
  <h4>{article(product)}</h4>
  <figure className="family-product-photo">{product.imageUrl&&<img src={product.imageUrl} alt={article(product)}/>}</figure>
  <figure className="family-dimensions">{s.diagramUrl?<img src={s.diagramUrl} alt="Manufacturer dimension drawing"/>:<DimensionIcon values={values}/>}</figure>
  <dl>{rows.map(([Icon,label,value])=><React.Fragment key={label}><dt><Icon size={16} aria-hidden="true"/>{label}</dt><dd>{value||'—'}</dd></React.Fragment>)}</dl>
  <div className="family-generated">
   {d.photometricUrl?<img src={d.photometricUrl} alt="Manufacturer optical diagram"/>:<BeamIcon value={values.beam}/>}
   <MountIcon mounting={values.mounting}/>
  </div>
 </article>;
}

function FamilySheet({title,variants}){
 return <section className="family-sheet">
  <h3>{title}</h3>
  <div className="family-strip" tabIndex={0} aria-label={title}>
   {variants.map(product=><FamilyCard key={product.id||article(product)} product={product}/>)}
  </div>
 </section>;
}

export function renderFamilyHtml(title,variants){
 const markup=renderToStaticMarkup(<FamilySheet title={title} variants={variants}/>);
 return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Product family</title><style>body{margin:24px;background:#f3f0e8}${familyCss}</style></head><body>${markup}</body></html>`;
}

export function ProductFamily({product,catalogue}){
 const [familyOnly,setFamilyOnly]=useState(!!product.family);
 const sameBrand=catalogue.filter(p=>normalize(p.brand)===normalize(product.brand));
 const variants=[product,...sameBrand.filter(p=>!familyOnly||normalize(p.family)===normalize(product.family))]
  .filter((variant,index,list)=>list.findIndex(p=>normalize(article(p))===normalize(article(variant)))===index);
 const title=[product.brand,familyOnly?product.family:'Catalogue products'].filter(Boolean).join(' · ');
 function download(){
  const variantsWithAbsoluteImages=variants.map(p=>{
   const absolute=url=>{
    if(!url)return undefined;
    try{
     const resolved=new URL(url,window.location.href);
     return ['http:','https:'].includes(resolved.protocol)?resolved.href:undefined;
    }catch{return undefined;}
   };
   return {...p,imageUrl:absolute(p.imageUrl),specs:{...p.specs,diagramUrl:absolute(p.specs?.diagramUrl),specSheet:{...p.specs?.specSheet,photometricUrl:absolute(p.specs?.specSheet?.photometricUrl)}}};
  });
  const url=URL.createObjectURL(new Blob([renderFamilyHtml(title,variantsWithAbsoluteImages)],{type:'text/html'}));
  const link=document.createElement('a');
  link.href=url;
  link.download=`${title.replace(/[^a-z0-9]+/gi,'-')}.html`;
  link.click();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
 }
 return <div>
  <div className="family-actions">
   {product.family&&<button type="button" onClick={()=>setFamilyOnly(v=>!v)}>{familyOnly?'All manufacturer products':'This family'}</button>}
   <button type="button" onClick={download}><Download size={14}/> Download HTML</button>
  </div>
  <FamilySheet title={title} variants={variants}/>
 </div>;
}

export function ProductFamilyEditor({product,onSave,onCancel,busy}){
 const [values,setValues]=useState(()=>familyValues(product));
 const [family,setFamily]=useState(product.family||'');
 const draft={...product,family,specs:{...product.specs,familyView:values}};
 return <form className="family-editor" onSubmit={e=>{e.preventDefault();if(!busy)onSave(draft);}}>
  <div>
   <h3>Edit family view</h3>
   <label>Product family<input value={family} onChange={e=>setFamily(e.target.value)}/></label>
   {fields.map(([key,label])=><label key={key}>{label}
    <input value={values[key]??''} type={['diameter','depth','cutout','beam'].includes(key)?'number':'text'}
     min={0.1} max={key==='beam'?179.9:undefined} step="any"
     list={key==='mounting'?'family-mounting-types':undefined}
     onChange={e=>setValues(old=>({...old,[key]:e.target.value}))}/>
   </label>)}
   <datalist id="family-mounting-types">{mountings.map(name=><option key={name} value={name}/>)}</datalist>
   <footer className="family-actions"><button type="submit" disabled={busy}>Save family view</button><button type="button" disabled={busy} onClick={onCancel}>Cancel</button></footer>
  </div>
  <FamilySheet title={family||product.brand} variants={[draft]}/>
 </form>;
}
