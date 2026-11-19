import {assessmentKey,selectedAssessment,catalogOptionsForCode} from './product-assessment.mjs';
export const productTechnicalHeaders=['ZONE','CN','THUMBNAIL','MODEL NO.','NAME','ILLUMINANCE','OPTICS','HEIGHT','AIM | DIRECTION','COLOUR','CONTROL','QUANTITY'];
const norm=v=>String(v??'').trim().toUpperCase().replace(/\s+/g,'');
export function selectedProductTechnicalRows(rows,assessment,products=[]){
 const selected=selectedAssessment(assessment),warnings=[];
 const result=rows.flatMap(row=>{const option=selected.get(assessmentKey(row.code,row.linear));if(!option)return [];
 const matches=[];for(const f of products.filter(f=>norm(f.fittingType)===norm(row.code)))for(const p of f.products||[]){const linked=catalogOptionsForCode(row.code,[{...f,products:[p]}])[0];if(linked?.id===option.id)matches.push(p)}
 if(!matches.length)for(const f of products.filter(f=>norm(f.fittingType)===norm(row.code)))for(const p of f.products||[])if(norm(p.brand)===norm(option.brand)&&norm(p.specs?.article||p.model)===norm(option.article))matches.push(p);
 const product=matches.length===1?matches[0]:null,s=product?.specs||{},d=s.specSheet||{};
 if(!product)warnings.push(`${row.cn}: selected ${option.brand} ${option.article} has ${matches.length?'multiple':'no'} matching catalogue specifications. Missing product specifications stay blank.`);
 const power=d.energy||(s.power!==''&&s.power!=null?`${s.power} W`:''),flux=s.flux!==''&&s.flux!=null?`${s.flux} lm`:'';
 const illumination=[power,flux,d.brightness].filter(Boolean).join('\n');
 const colour=[...(s.colour||[]),...(s.spectra||[]),s.cri!==''&&s.cri!=null?`CRI ${s.cri}`:''].filter(Boolean).join(' | ');
 const photo=option.photo|| (product?.imageUrl?{url:product.imageUrl,label:product.model||option.article}:null);
 return [{...row,selectedProduct:option,manufacturerProduct:product,productPhoto:photo,modelNo:option.article||s.article||'',productName:product?.model||'',productIlluminance:illumination,productOptics:d.optics||(s.distribution||[]).join(' | '),productColour:colour,productControl:(s.control||[]).join(' | '),productHeight:d.mounting?[String(row.height||'').replace(/\([^)]*\)/g,'').trim(),`(${d.mounting})`].filter(Boolean).join('\n'):row.height}];
 });return {rows:result,warnings};
}
