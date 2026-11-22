import {assessmentGroups,selectedAssessment,catalogOptionsForCode} from './product-assessment.mjs';
import {buildColumnTable,shortTechnicalFloor} from './technical-column-logic.mjs';
const norm=v=>String(v??'').trim().toUpperCase().replace(/\s+/g,'');
export function outputValue(headers,row,names){for(const n of names){const i=headers.findIndex(h=>norm(h)===norm(n));if(i>=0&&String(row[i]??'').trim()&&row[i]!=='<>')return String(row[i]).trim();}return '';}
export function productQuantities(data,products=[],zones=[]){
 const model=assessmentGroups(data,products),warnings=[...model.warnings];
 const groups=model.groups.map(g=>{
  const rows=g.sourceIndices.map(i=>data.rows[i]);const circuits=buildColumnTable({...data,rows},zones,products);
  warnings.push(...circuits.warnings);
  const fits=products.filter(f=>norm(f.fittingType)===norm(g.code));const fitting=fits.length===1?fits[0]:null;
  if(fits.length>1)warnings.push(`${g.code}: duplicate fitting codes in Product Database; review the product match.`);
  const areas=[...new Set(circuits.rows.map(r=>[shortTechnicalFloor(r.floor),r.zone?.area||r.zone?.room||r.zone?.areaName||r.zone?.name||r.zone?.zoneName||r.zoneCode].filter(Boolean).join(' | ')))];
  return {...g,fitting,rows,headers:data.headers||[],circuitRows:circuits.rows,areas};
 }).sort((a,b)=>a.code.localeCompare(b.code,undefined,{numeric:true})||a.unit.localeCompare(b.unit));
 return {groups,warnings:[...new Set(warnings)],pieceTotal:groups.filter(g=>!g.linear).reduce((n,g)=>n+g.quantity,0),metreTotal:Number(groups.filter(g=>g.linear).reduce((n,g)=>n+g.quantity,0).toFixed(6))};
}
export function selectedProjectSpecSheets(quantities,products,assessment){
 const selected=selectedAssessment(assessment),sheets=new Map(),warnings=[];
 for(const g of quantities){const option=selected.get(g.id);if(!option)continue;
  const matches=[];
  for(const f of products.filter(f=>norm(f.fittingType)===norm(g.code))){
   for(const p of f.products||[]){const catalog=catalogOptionsForCode(g.code,[{...f,products:[p]}])[0];if(catalog?.id===option.id)matches.push(p);}
  }
  if(!matches.length){for(const f of products.filter(f=>norm(f.fittingType)===norm(g.code)))for(const p of f.products||[])if(norm(p.brand)===norm(option.brand)&&norm(p.specs?.article||p.model)===norm(option.article))matches.push(p);}
  const full=matches.length===1?matches[0]:null;
  if(!full)warnings.push(`${g.code} · ${option.brand} ${option.article}: ${matches.length>1?'multiple catalogue matches':'no matching Product Database specification'}. Missing fields are left blank.`);
  const product={...(full||{}),brand:option.brand,model:full?.model||option.article,imageUrl:option.photo?.driveFileId?'':option.photo?.url||full?.imageUrl||'',specs:{...full?.specs,article:option.article,price:option.price},notes:option.remarks||full?.notes||''};
  const intent=[...new Set((g.circuitRows||[]).map(r=>r.application).filter(Boolean))];
  if(option.review)product.specs.specSheet={...product.specs.specSheet,customization:option.review.customization||'',equivalents:(option.review.equivalents||[]).join(' · ')};
  const id=norm(option.brand)+'|'+norm(option.article)+(option.review?'|'+g.id:'');
  if(!sheets.has(id))sheets.set(id,{id,product,codes:[],areas:[],intents:[],sources:[],photo:option.photo,complete:!!full});
  const sheet=sheets.get(id);sheet.codes.push(g.code);sheet.areas.push(...(option.review?.area?[option.review.area]:g.areas));sheet.intents.push(...intent);sheet.sources.push(g.id);
 }
 return {sheets:[...sheets.values()].map(s=>({...s,codes:[...new Set(s.codes)],areas:[...new Set(s.areas)],intents:[...new Set(s.intents)]})),warnings,selectedCount:quantities.filter(g=>selected.has(g.id)).length};
}
export function quantityCsv(model){const cell=v=>{let t=String(v??'');if(/^[\s]*[=+@-]/.test(t))t="'"+t;return '"'+t.replaceAll('"','""')+'"'};return [['Product code','Description','Quantity','Unit','Circuits','Areas','Missing lengths'],...model.groups.map(g=>[g.code,g.type,g.quantity,g.unit,g.circuitRows.map(c=>[shortTechnicalFloor(c.floor),c.cn].filter(Boolean).join(' | ')).join(', '),g.areas.join(', '),g.missingLengths])].map(r=>r.map(cell).join(',')).join('\r\n');}
export function boqScheduleRows(quantities,products,assessment){
 const selected=selectedAssessment(assessment),book=selectedProjectSpecSheets(quantities,products,assessment);
 return quantities.map((g,i)=>{const option=selected.get(g.id),sheet=book.sheets.find(s=>s.sources.includes(g.id)),p=sheet?.product,s=p?.specs||{};const controls=[...new Set(g.rows.map(r=>outputValue(g.headers||[],r,['CONTROL','DIMMING'])).filter(Boolean))];
  return {id:g.id,serial:i+1,control:(s.control||[]).join(' | ')||controls.join(' / '),image:p?.imageUrl||g.fitting?.thumbnailUrl||g.icon||'',photo:sheet?.photo,code:g.code,make:p?.brand||'',article:s.article||'',equivalents:option?.review?.equivalents?.join(' · ')||s.specSheet?.equivalents||'',quantity:option?.quantity!==''&&option?.quantity!=null?Number(option.quantity):g.quantity,unit:g.linear?'Mt':'Pc',missingLengths:g.missingLengths,selected:!!option};
 });
}
export function boqCsv(rows,headers){const quote=v=>{let t=String(v??'');if(/^[\s]*[=+@-]/.test(t))t="'"+t;return '"'+t.replaceAll('"','""')+'"'};return [headers,...rows.map(r=>[r.serial,r.control,'',r.code,r.make,r.article,r.equivalents,r.quantity,r.unit])].map(row=>row.map(quote).join(',')).join('\r\n');}
