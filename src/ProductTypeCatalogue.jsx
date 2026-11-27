import React,{useMemo,useRef,useState} from 'react';
import {productTypeSections,productTypeSlots,productTypePlacementAt,dropProductPlacement} from './product-type-catalogue.mjs';
import technicalIcons from './technical-icon-map.json';
import fittedIcons from './catalogue-fitted-icons.json';
import './ProductTypeCatalogue.css';
import {isLinearCatalogueRow} from './linear-lineup.mjs';
export default function ProductTypeCatalogue({catalogue,database,originalFittings,admin,onOpen,onEdit,onAdd,onMove}){
 const [busy,setBusy]=useState(false),[error,setError]=useState(''),[hover,setHover]=useState('');const dragging=useRef('');
 const sections=useMemo(()=>productTypeSections(catalogue,database,originalFittings),[catalogue,database,originalFittings]);
 const linearIds=new Set((catalogue?.sections||[]).filter(s=>isLinearCatalogueRow(s.codeRow)).flatMap(s=>catalogue.rows[s.codeRow].map(cell=>cell.fittingId).filter(Boolean)));
 const byRow=new Map(sections.filter(s=>s.id!=='additional').map(s=>[Number(s.id.slice(4)),s]));
 const photos=new Map([...byRow].map(([row,s])=>[s.photoRow??row-1,s]));
 const mounts=new Map();
 const headers=new Map();for(const s of sections)if(s.id!=='additional'&&!headers.has(s.headerRow)){headers.set(s.headerRow,s);const row=s.mountRow??s.headerRow+1;if(row>=0)mounts.set(row,s);}
 const extra=sections.find(s=>s.id==='additional'),additional={...extra,items:(extra?.items||[]).filter(i=>!linearIds.has(i.fitting.id)&&(i.fitting.cataloguePlacement||i.fitting.products?.length||i.fitting.id.startsWith('fitting-')))};
 const columns=Math.max(catalogue?.widths?.length||26,...sections.filter(s=>s.id!=='additional').flatMap(s=>[...productTypeSlots(s).keys()].map(c=>c+1)),...[...productTypeSlots(additional).keys()].map(c=>c+1));
 async function drop(e,section,column){e.preventDefault();const id=dragging.current||e.dataTransfer.getData('application/x-enlighten-product-type');setHover('');if(!admin||busy||!id)return;const fitting=database.find(f=>f.id===id);if(!fitting)return;const target=productTypeSlots(section).get(column);if(target?.fitting.id===id)return;const rect=e.currentTarget.getBoundingClientRect(),after=!!target&&e.clientX>rect.left+rect.width/2;setBusy(true);setError('');try{await onMove({...fitting,cataloguePlacement:dropProductPlacement(section,id,column,after)})}catch(err){setError(err.message)}finally{setBusy(false);dragging.current=''}}
 const style=(cell,r,c)=>({padding:'3px 5px',border:'1px solid #d7d0c3',background:r===0?'#D2CDC1':'#fff',color:'#142238',verticalAlign:'middle',textAlign:c===0?'left':'center',whiteSpace:'pre-line',fontFamily:'"Helvetica Neue", Helvetica, Arial, sans-serif',fontSize:Math.max(10,(cell?.size||14)*.7)+4/3,fontWeight:500});
 function cellImage(url,label,kind){
  const isIcon=kind==='icon';
  const src=isIcon?(fittedIcons[url]||technicalIcons[url]||url):url;
  return <img className={isIcon?'catalogue-icon-image':'catalogue-photo-image'} src={src} alt={label} loading="lazy" decoding="async"/>;
 }
 function typeCell(section,column,photo,cellStyle){const item=productTypeSlots(section).get(column),f=linearIds.has(item?.fitting.id)?null:item?.fitting,key=section.id+':'+column;
 const fitted=photo==='icon'?!!item?.icon:photo===true&&!!item?.reference;
 const handlers=admin?{onDragOver:e=>{if(dragging.current&&!busy){e.preventDefault();e.dataTransfer.dropEffect='move';setHover(key)}},onDragLeave:()=>setHover(''),onDrop:e=>drop(e,section,column)}:{};
 return <td key={column} {...handlers} className={hover===key?'product-table-drop':''} style={{...cellStyle,...(fitted?{padding:0}:null)}}><button type="button" className={'product-table-cell '+(!f?'product-table-empty':fitted?'product-table-numbers-fill':'')} disabled={busy||!f&&!admin} aria-label={f?`${admin?'Edit fitting type':'View brand products for'} ${f.fittingType}`:`Add product type at ${section.label}, column ${column}`} title={f?(admin?'Drag to move · Click to edit fitting type':f.fittingType):(admin?'Click to add a product type':'')} onClick={()=>{if(f){if(admin)onEdit(f.id);else onOpen(f.id);}else if(admin)onAdd(productTypePlacementAt(section,column))}} draggable={!!f&&admin&&!busy} onDragStart={e=>{dragging.current=f.id;e.dataTransfer.setData('application/x-enlighten-product-type',f.id);e.dataTransfer.effectAllowed='move'}} onDragEnd={()=>{dragging.current='';setHover('')}}>{f?(photo==='icon'?(item.icon&&cellImage(item.icon,f.fittingType+' icon','icon')):photo==='mount'?(item.mount||' '):photo?<>{(item.sourceRow!==Number(section.id.slice(4))||item.sourceColumn!==column)&&!fitted&&item.icon&&<span className="product-table-moved-icon">{cellImage(item.icon,f.fittingType+' icon','icon')}</span>}{item.reference&&cellImage(item.reference,f.fittingType+' reference','image')}</>:f.fittingType):' '}</button></td>;
 }
 return <section>{error&&<p role="alert">{error}</p>}{busy&&<p role="status">Saving product position…</p>}<div className="standards-catalogue product-type-table-scroll"><table aria-label="Standards Database catalogue" style={{borderCollapse:'collapse',tableLayout:'fixed',width:(catalogue?.widths||[]).reduce((a,b)=>a+b,0)*.7+Math.max(0,columns-(catalogue?.widths?.length||26))*120}}><colgroup>{Array.from({length:columns},(_,c)=><col key={c} style={{width:(catalogue?.widths?.[c]||170)*.7}}/>)}</colgroup><tbody>{catalogue?.rows.map((row,r)=>{if(isLinearCatalogueRow(r))return null;const section=byRow.get(r)||photos.get(r),photo=photos.has(r);return <tr key={r} style={{height:catalogue.sections?catalogue.heights[r]*.7:photo?76:row.some(c=>c.image)?76:catalogue.heights[r]*.7}}>{Array.from({length:columns},(_,c)=>{const cell=row[c]||{};if(cell.merged&&catalogue.sections)return null;
 if(c>0&&section&&(!catalogue.sections||(!cell.text&&!cell.image)||section.items.some(i=>i.sourceColumn===c)||productTypeSlots(section).has(c)))return typeCell(section,c,photo,style(cell,r,c));
 if(cell.merged)return null;
 if(c>0&&(headers.has(r)||mounts.has(r))){
  const header=headers.get(r)||mounts.get(r);
  if(!catalogue.sections||header.items.some(i=>i.sourceColumn===c)||productTypeSlots(header).has(c))return typeCell(header,c,headers.has(r)?'icon':'mount',style(cell,r,c));
 }if(!catalogue.sections&&c>0&&r>0&&!cell.text&&!cell.image){const next=[...byRow.entries()].find(([codeRow])=>codeRow>r)?.[1];if(next&&!productTypeSlots(next).has(c))return typeCell(next,c,false,style(cell,r,c));}return <td key={c} rowSpan={cell.span?.[0]||1} colSpan={cell.span?.[1]||1} style={style(cell,r,c)}>{cell.image&&<span className="catalogue-static-media">{cellImage(cell.image,cell.text||'Luminaire illustration',headers.has(r)||/sketch-icon/.test(cell.image)?'icon':'image')}</span>}{cell.text||' '}</td>})}</tr>})}{additional.items.length>0&&<><tr><td colSpan={columns} style={{background:'#d2cdc1',padding:6}}>Additional product types</td></tr>{[true,false].map(photo=><tr key={String(photo)} style={{height:photo?90:24}}><td/>{Array.from({length:columns-1},(_,i)=>typeCell(additional,i+1,photo,style({},1,i+1)))}</tr>)}</>}</tbody></table></div></section>
}
