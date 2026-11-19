const clean=v=>String(v??'').trim(),norm=v=>clean(v).toUpperCase().replace(/\s+/g,'');
export const ratingLabels=['Cutoff','LED Quality','Driver Quality','Build Quality'];
export const assessmentKey=(code,linear)=>norm(code)+'|'+(linear?'m':'pcs');
const stableId=s=>{let n=2166136261;for(const c of s)n=Math.imul(n^c.charCodeAt(0),16777619);return 'catalog-'+(n>>>0).toString(36)};
export function catalogOptionsForCode(code,products){
 const all=new Map();products.filter(p=>norm(p.fittingType)===norm(code)).forEach(f=>(f.products||[]).forEach((p,i)=>{
  const id=stableId(String(f.id||norm(code))+'|'+String(p.id||p.brand+'|'+p.specs?.article+'|'+p.model||i));
  if(all.has(id))return;all.set(id,{...newAssessmentOption(id),brand:p.brand||'',article:p.specs?.article||p.model||'',price:Number.isFinite(Number(p.specs?.price))&&p.specs?.price!==''&&p.specs?.price!==undefined?Number(p.specs.price):'',remarks:p.notes||'',photo:p.imageUrl?{url:p.imageUrl,id:'',driveFileId:'',label:[p.brand,p.model].filter(Boolean).join(' ')}:null,ratings:['cutoff','led','driver','build'].map(k=>Math.max(0,Math.min(5,Math.round(Number(p.ratings?.[k])||0))))});
 }));return [...all.values()];
}
export function curatedAssessmentGroup(group,saved){
 const empty=o=>!o.brand&&!o.article&&o.price===''&&o.quantity===''&&!o.remarks&&!o.photo&&o.ratings.every(n=>n===0);
 if(saved&&!(group.catalogOptions.length&&!saved.selectedId&&saved.options.length>0&&saved.options.every(empty)))return saved;
 return {selectedId:'',options:group.catalogOptions.length?group.catalogOptions.slice(0,3):[newAssessmentOption('option-1'),newAssessmentOption('option-2')]};
}
export function removeAssessmentOption(group,id){return {...group,selectedId:group.selectedId===id?'':group.selectedId,options:group.options.filter(o=>o.id!==id)}}
export function availableCatalogOptions(group,curated){return group.catalogOptions.filter(o=>!curated.options.some(c=>c.id===o.id||norm(c.brand)===norm(o.brand)&&norm(c.article)===norm(o.article)));}
export function assessmentGroups(data,products=[]){
 const h=(data.headers||[]).map(norm),groups=new Map(),warnings=[];
 const value=(r,names)=>{for(const n of names){const i=h.indexOf(norm(n));if(i>=0&&clean(r[i])&&clean(r[i])!=='<>')return clean(r[i])}return ''};
 (data.rows||[]).forEach((r,index)=>{
  const code=value(r,['HOUSINGNUMBER','FITTINGTYPE','PRODUCTCODE']);if(!code){warnings.push(`Output row ${index+1}: no product code; add it in Technical Table | Design.`);return}
  const type=value(r,['TYPE','NAME']),raw=value(r,['LENGTHINMETRE','LENGTHINMETERS','LENGTHINMETRES'])||value(r,['LENGTH']);
  const linear=/^(L\d|ALP)/i.test(code)||/linear|strip|profile|tape/i.test(type)||/^\d+(?:\.\d+)?\s*(mm|m)?$/i.test(raw);
  const id=assessmentKey(code,linear);if(!groups.has(id)){const p=products.find(p=>norm(p.fittingType)===norm(code));groups.set(id,{id,code,type,unit:linear?'m':'pcs',linear,quantity:0,missingLengths:0,circuits:new Set(),icon:p?.iconUrl||'',catalogOptions:catalogOptionsForCode(code,products)})}
  const g=groups.get(id);g.circuits.add(value(r,['CN','CIRCUITNUMBER']));
  if(!linear){g.quantity++;return}
  if(!/^(?:\d+(?:\.\d+)?|\.\d+)\s*(?:mm|m)?$/i.test(raw)||Number(raw.replace(/\s*(mm|m)$/i,''))<=0){g.missingLengths++;warnings.push(`${code} · Output row ${index+1}: linear length needs review.`);return}
  const metres=value(r,['LENGTHINMETRE','LENGTHINMETERS','LENGTHINMETRES'])||(/m$/i.test(raw)&&!/mm$/i.test(raw));g.quantity+=Number(raw.replace(/\s*(mm|m)$/i,''))/(metres?1:1000);
 });
 return {groups:[...groups.values()].map(g=>({...g,quantity:Number(g.quantity.toFixed(6)),circuits:[...g.circuits].filter(Boolean)})),warnings};
}
export function newAssessmentOption(id){return {id,brand:'',article:'',price:'',quantity:'',remarks:'',photo:null,ratings:[0,0,0,0]}}
export function optionQuantity(group,option){return option.quantity===''||option.quantity===undefined?group.quantity:Number(option.quantity)}
export function optionTotal(group,option){return option.price===''?null:Number(option.price)*optionQuantity(group,option)}
export function selectedAssessment(assessment={}){
 const result=new Map();for(const [key,g] of Object.entries(assessment.groups||{})){const option=g.options?.find(o=>o.id===g.selectedId);if(option)result.set(key,option)}return result;
}
export function productTechnicalRows(rows,assessment){
 const choices=selectedAssessment(assessment);
 return rows.flatMap(row=>{const selected=choices.get(assessmentKey(row.code,row.linear));if(!selected)return [];
  return [{...row,code:[row.code,selected.brand,selected.article].filter(Boolean).join('\n'),icon:'',override:{...row.override,fixture:selected.photo||null},selectedProduct:selected}];
 });
}
