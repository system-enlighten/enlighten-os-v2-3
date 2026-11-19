const clean=v=>String(v??'').trim(),norm=v=>clean(v).toUpperCase().replace(/\s+/g,'');
export const ratingLabels=['Cutoff','LED Quality','Driver Quality','Build Quality'];
export const assessmentKey=(code,linear)=>norm(code)+'|'+(linear?'m':'pcs');
export function assessmentGroups(data,products=[]){
 const h=(data.headers||[]).map(norm),groups=new Map(),warnings=[];
 const value=(r,names)=>{for(const n of names){const i=h.indexOf(norm(n));if(i>=0&&clean(r[i])&&clean(r[i])!=='<>')return clean(r[i])}return ''};
 (data.rows||[]).forEach((r,index)=>{
  const code=value(r,['HOUSINGNUMBER','FITTINGTYPE','PRODUCTCODE']);if(!code){warnings.push(`Output row ${index+1}: no product code; add it in Design Technical Table.`);return}
  const type=value(r,['TYPE','NAME']),raw=value(r,['LENGTHINMETRE','LENGTHINMETERS','LENGTHINMETRES'])||value(r,['LENGTH']);
  const linear=/^(L\d|ALP)/i.test(code)||/linear|strip|profile|tape/i.test(type)||/^\d+(?:\.\d+)?\s*(mm|m)?$/i.test(raw);
  const id=assessmentKey(code,linear);if(!groups.has(id)){const matches=products.filter(p=>norm(p.fittingType)===norm(code)),p=matches.length===1?matches[0]:null;groups.set(id,{id,code,type,unit:linear?'m':'pcs',linear,quantity:0,missingLengths:0,circuits:new Set(),icon:p?.iconUrl||'',catalogOptions:(p?.products||[]).slice(0,20).map((p,i)=>({...newAssessmentOption('catalog-'+i),brand:p.brand||'',article:p.specs?.article||p.model||'',price:Number.isFinite(Number(p.specs?.price))&&p.specs?.price!==''&&p.specs?.price!==undefined?Number(p.specs.price):'',remarks:p.notes||'',photo:p.imageUrl?{url:p.imageUrl,id:'',driveFileId:'',label:[p.brand,p.model].filter(Boolean).join(' ')}:null,ratings:['cutoff','led','driver','build'].map(k=>Math.max(0,Math.min(5,Math.round(Number(p.ratings?.[k])||0))))}))})}
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
