import {wattsFromDescription,rowConnectedWatts} from './technical-zone-summary.mjs';
import {assessmentKey,selectedAssessment,catalogOptionsForCode} from './product-assessment.mjs';
export const productTechnicalHeaders=['ZONE','CN','THUMBNAIL','MODEL NO.','NAME','BRIGHTNESS','ENERGY USED','OPTICS','HEIGHT','AIM | DIRECTION','COLOUR','CONTROL','QUANTITY'];
const norm=v=>String(v??'').trim().toUpperCase().replace(/\s+/g,'');
export function selectedProductTechnicalRows(rows,assessment,products=[]){
 const selected=selectedAssessment(assessment),warnings=[];
 const result=rows.flatMap(row=>{const option=selected.get(assessmentKey(row.code,row.linear));if(!option)return [];
 const matches=[];for(const f of products.filter(f=>norm(f.fittingType)===norm(row.code)))for(const p of f.products||[]){const linked=catalogOptionsForCode(row.code,[{...f,products:[p]}])[0];if(linked?.id===option.id)matches.push(p)}
 if(!matches.length&&option.id.startsWith('catalog-')){warnings.push(`${row.cn}: Select a current manufacturer product in Product Assessment.`);return [];}
 if(!matches.length)for(const f of products.filter(f=>norm(f.fittingType)===norm(row.code)))for(const p of f.products||[])if(norm(p.brand)===norm(option.brand)&&norm(p.specs?.article||p.model)===norm(option.article))matches.push(p);
 const product=matches.length===1?matches[0]:null,s=product?.specs||{},d=s.specSheet||{};
 if(!product)warnings.push(`${row.cn}: selected ${option.brand} ${option.article} has ${matches.length?'multiple':'no'} matching catalogue specifications. Missing product specifications stay blank.`);
 const power=d.energy||(s.power!==''&&s.power!=null?`${s.power} W`:''),flux=s.flux!==''&&s.flux!=null?`${s.flux} lm`:'';
 const brightness=flux||String(d.brightness||'').match(/\d+(?:\.\d+)?\s*(?:lm|lumens?)\b/i)?.[0]||'';
 const colour=[...(s.colour||[]),...(s.spectra||[]),s.cri!==''&&s.cri!=null?`CRI ${s.cri}`:''].filter(Boolean).join(' | ');
 const photo=product?(product.imageUrl?{url:product.imageUrl,label:product.model||option.article}:null):option.photo||null;
 return [{...row,selectedProduct:option,manufacturerProduct:product,productPhoto:photo,modelNo:s.article||product?.model||option.article||'',productName:product?.model||'',productBrightness:brightness,productEnergy:power,productOptics:d.optics||(s.distribution||[]).join(' | '),productColour:colour,productControl:(s.control||[]).join(' | '),productHeight:d.mounting?[String(row.height||'').replace(/\([^)]*\)/g,'').trim(),`(${d.mounting})`].filter(Boolean).join('\n'):row.height}];
 });return {rows:result,warnings};
}

export const driverHeaders=['TOTAL WATTAGE','TOTAL LOAD','PLUS 20%','DRIVER WATTAGE','DRIVER QUANTITY'];

export function circuitDrivers(row,headers=[]){
 const rating=wattsFromDescription(row.productEnergy,{numericWatts:true});
 const spec=row.manufacturerProduct?.specs?.specSheet;
 const capacityColumn=headers.findIndex(h=>norm(h)==='DRIVERWATTAGE');
 const supplied=spec?.driverWattage||'';
 const capacities=[...new Set((row.rows||[]).map(source=>String(source[capacityColumn]??'').trim()).filter(v=>v&&v!=='<>'&&v!=='—'))];
 const capacity=wattsFromDescription(supplied||(capacities.length===1?capacities[0]:''),{numericWatts:true});
 const driverWatts=capacity.watts>0&&!capacity.perMetre?capacity.watts:null;
 const lengthColumns=headers.map((header,index)=>({header,index})).filter(({header})=>/^LENGTH(?:INMET(?:RE|ER)S?)?$/.test(norm(header)));
 const circuitLoads=(row.rows||[]).map(source=>{
  if(!(rating.watts>0))return null;
  if(!rating.perMetre)return rating.watts;
  return rowConnectedWatts(['WATTAGE',...lengthColumns.map(c=>norm(c.header)==='LENGTH'?'LENGTH':'LENGTHINMETRES')],[row.productEnergy,...lengthColumns.map(c=>source[c.index])]).watts;
 });
 const load=circuitLoads.length&&circuitLoads.every(w=>w>0)?circuitLoads.reduce((a,b)=>a+b,0):null;
 const required=load===null?null:load*1.2;
 const quantity=required!==null&&driverWatts!==null?Math.ceil(Number((required/driverWatts).toPrecision(12))):null;
 return {driverWatts,quantity,values:[row.productEnergy,load,required,driverWatts,quantity].map((v,i)=>v==null||v===''?'—':typeof v==='number'?Number(v.toFixed(4))+(i===4?'':' W'):v)};
}
