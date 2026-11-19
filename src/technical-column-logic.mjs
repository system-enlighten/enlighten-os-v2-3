import {parseOutputText} from './technical-output.mjs';
const clean=v=>String(v??'').trim();
const key=v=>clean(v).toUpperCase().replace(/\s+/g,'');
export const columnNotes=['Match the circuit prefix to the saved project Floor Zones.','One row per floor and circuit number; repeated CN rows are grouped.','Exact HOUSINGNUMBER code lookup in Product Database.','Read TYPE / NAME from Output.','Read APPLICATION from Output.','Choose an uploaded project image; adjust zoom and position.','Choose a reference from Application Database.','Read OBJECT / SHAPE|DIA / SIZE.','Read CMF; manual cell edits override Output.','Height and distance, followed by (surface and mount).','Read ILLUMINANCE / ILLUMINATION.','Pieces: count occurrences. Linear: each LENGTH in metres, joined by +.'];
const aliases=[[],['CN','CIRCUITNUMBER'],[],['TYPE','NAME'],['APPLICATION'],[],[],['OBJECT','OBJECTSIZE','SHAPE|DIA','SIZE'],['CMF'],['HEIGHT','DISTANCE'],['ILLUMINANCE','ILLUMINATION'],['LENGTH']];
export function defaultRules(headers){return Object.fromEntries(aliases.map((names,i)=>{const field=headers.findIndex(h=>names.includes(key(h)));return [i,{source:i===0?'floorZones':i===2?'products':i===5?'manual':i===6?'applications':i===11?'derived':'output',field:field<0?'':String(field),notes:columnNotes[i]}]}))}
export function lightingClass({explicit='',category='',type='',application=''}){
 const classify=(text,strict=false)=>{
  const value=clean(text).toLowerCase();
  if(/\bdecorative\b|chandelier|pendant|sconce|table lamp|floor lamp/.test(value))return 'Decorative';
  if(/\bfocused?\b|highlighter|grazer|grazing|wall\s*wash|spot\s*light|spotlight|accent|task light/.test(value))return 'Focused';
  if(/\bfill\b|diffused|ambient|cove|panel light|general lighting/.test(value))return 'Fill';
  if(!strict&&/downlight|magnetic track/.test(value))return 'Focused';
  return '';
 };
 return classify(explicit,true)||classify(category)||classify(type)||classify(application)||'Unclassified';
}
export function buildColumnTable(data,zones=[],products=[]){
 const headers=data.headers||[],warnings=[],groups=new Map();
 const read=(row,names)=>{for(const n of names){for(let i=0;i<headers.length;i++)if(key(headers[i])===key(n)&&clean(row[i])&&!/^<>$/.test(clean(row[i])))return clean(row[i])}return ''};
 const field=(row,i)=>read(row,aliases[i]);
 for(const [sourceIndex,row] of (data.rows||[]).entries()){const cn=key(field(row,1));if(!cn){warnings.push('An Output row has no circuit number and was skipped.');continue}const prefix=cn.match(/^[A-Z]+/)?.[0]||'',floor=read(row,['FLOOR','FLOORNAME']);const matches=zones.filter(z=>!['false','0'].includes(String(z.active).toLowerCase())&&key(z.zoneCode)===prefix&&(!floor||key(z.floor)===key(floor)));const zone=matches.length===1?matches[0]:null;if(!zone)warnings.push(`${cn}: ${matches.length>1?'zone exists on multiple floors; add FLOOR to Output':'no matching active Floor Zone'}.`);const id=`${floor||zone?.floor||''}|${cn}`;if(!groups.has(id))groups.set(id,{id,cn,zone,zoneCode:prefix,floor:floor||zone?.floor||'',rows:[],sourceIndices:[]});groups.get(id).rows.push(row);groups.get(id).sourceIndices.push(sourceIndex)}
 const result=[...groups.values()].map(g=>{
 const unique=fn=>[...new Set(g.rows.map(fn).filter(Boolean))];
 const value=(i)=>{const values=unique(r=>field(r,i));if(values.length>1)warnings.push(`${g.cn}: conflicting ${['Zone','CN','fixture','type','application','3D','reference','object size','CMF','height','illuminance'][i]} values.`);return values.join(' / ')};
 const codes=unique(r=>read(r,['HOUSINGNUMBER','FITTINGTYPE','PRODUCTCODE']));const found=codes.length===1?products.filter(p=>key(p.fittingType)===key(codes[0])):[];if(found.length!==1)warnings.push(`${g.cn}: ${found.length>1?'duplicate product codes':codes.length>1?'different product codes on one circuit':'product icon not matched'} (${codes.join(', ')||'no code'}).`);
 const linear=g.rows.some(r=>(/^[0-9]+(?:\.[0-9]+)?\s*(?:mm|m)?$/i.test(read(r,['LENGTH','LENGTHINMETRE','LENGTHINMETERS'])))||/linear|strip|profile|tape/i.test(field(r,3))||/^(L\d|ALP)/i.test(read(r,['HOUSINGNUMBER'])));
 const lengths=g.rows.map(r=>{const metres=read(r,['LENGTHINMETRE','LENGTHINMETERS']),raw=metres||read(r,['LENGTH']);if(!raw)return null;const num=Number(raw.replace(/\s*(mm|m)\s*$/i,''));if(!Number.isFinite(num)||num<=0)return null;return num/(metres||/m\s*$/i.test(raw)&&!/mm\s*$/i.test(raw)?1:1000)});
 if(linear&&lengths.some(x=>x===null))warnings.push(`${g.cn}: missing or invalid linear length; quantity needs review.`);
 const heights=unique(r=>{const h=field(r,9)||read(r,['CLEARHEIGHT','CLEAR HEIGHT']),d=read(r,['DISTANCE']);const mount=[read(r,['SURFACE']),read(r,['MOUNT'])].filter(Boolean).join(' ');return [h,d&&d!==h?d:'',mount?`(${mount})`:''].filter(Boolean).join('\n')});
 const lighting=lightingClass({explicit:unique(r=>read(r,['LIGHTINGLAYER','LIGHTINGCATEGORY','LIGHTINGCLASS'])).join(' '),category:found.length===1?found[0].category:'',type:value(3),application:value(4)});
 const override=data.overrides?.[g.id]||{};return {...g,lighting:['Fill','Focused','Decorative','Unclassified'].includes(override.lighting)?override.lighting:lighting,code:codes.join(' / '),icon:found.length===1?found[0].iconUrl:'',type:value(3),application:value(4),object:value(7)||unique(r=>/^\d+(?:\.\d+)?\s*[x×]\s*\d+/i.test(read(r,['LENGTH']))?read(r,['LENGTH']):'').join(' / '),cmf:Object.hasOwn(override,'cmf')?override.cmf:value(8),height:heights.join('\n/\n'),illuminance:value(10),linear,quantity:linear?lengths.map(n=>n===null?'[length missing]':`${Number(n.toFixed(4))} m`).join(' + '):`${g.rows.length} ${g.rows.length===1?'Pc':'Pcs'}`,override};
 }).sort((a,b)=>{const zoneOrder=cn=>(cn.match(/^[A-Z]+/)?.[0]||'').split('').reduce((n,c)=>n*26+c.charCodeAt(0)-64,0);return zoneOrder(a.cn)-zoneOrder(b.cn)||String(a.floor||'').localeCompare(String(b.floor||''),undefined,{numeric:true})||a.cn.localeCompare(b.cn,undefined,{numeric:true})});return {rows:result,warnings:[...new Set(warnings)]};
}

export function parseTechnicalExport(text){
 const data=parseOutputText(text,true),names=data.headers.map(key);
 if(!names.includes('CN')||!names.includes('HOUSINGNUMBER'))throw Error('The first row must contain the CN and HOUSINGNUMBER headers from your text export.');
 if(!data.rows.length)throw Error('The export contains no lighting rows.');
 return {...data,sourceText:String(text)};
}
export function shortTechnicalFloor(floor){
 const value=clean(floor);if(/^(?:ground(?: floor)?|gf)$/i.test(value))return 'GF';
 const match=value.match(/^(?:(\d+)(?:st|nd|rd|th)?(?: floor)?|(?:floor )?(\d+)f?)$/i);if(match)return (match[1]||match[2])+'F';
 const named={first:'1F',second:'2F',third:'3F',fourth:'4F',fifth:'5F'};const name=value.toLowerCase().replace(/ floor$/,'');return named[name]||value;
}
export function technicalZoneSections(rows,maxRows=Infinity){
 const groups=new Map(),order=['Fill','Focused','Decorative','Unclassified'];
 for(const row of rows){const code=row.zoneCode||row.cn.match(/^[A-Z]+/)?.[0]||'',floor=row.floor||row.zone?.floor||'',id=floor+'|'+code;if(!groups.has(id))groups.set(id,{id,code,floor,label:[shortTechnicalFloor(floor),row.zone?.area||'Zone not matched'].filter(Boolean).join(' | '),rows:[]});groups.get(id).rows.push(row)}
 const ordinal=v=>v.split('').reduce((n,c)=>n*26+c.charCodeAt(0)-64,0);
 return [...groups.values()].sort((a,b)=>ordinal(a.code)-ordinal(b.code)||a.floor.localeCompare(b.floor,undefined,{numeric:true})).flatMap(group=>{
  const sorted=[...group.rows].sort((a,b)=>order.indexOf(a.lighting)-order.indexOf(b.lighting)||a.cn.localeCompare(b.cn,undefined,{numeric:true})),chunks=[];
  for(let i=0;i<sorted.length;i+=maxRows){const slice=sorted.slice(i,i+maxRows),sections=order.map(label=>({label,rows:slice.filter(r=>r.lighting===label)})).filter(s=>s.rows.length);chunks.push({...group,id:group.id+'|'+i,continuation:i>0,sections,rowSpan:slice.length+sections.length});if(!Number.isFinite(maxRows))break}
  return chunks;
 });
}
export function technicalPrintPages(rows,maxRows=6){
 const pages=[];let page=[],used=0;
 for(const group of technicalZoneSections(rows)){
  const circuits=group.sections.flatMap(s=>s.rows);
  for(let offset=0;offset<circuits.length;){
   if(used===maxRows){pages.push(page);page=[];used=0}
   const slice=circuits.slice(offset,offset+maxRows-used),part=technicalZoneSections(slice)[0];
   page.push({...part,id:group.id+'|page-'+pages.length,continuation:offset>0});offset+=slice.length;used+=slice.length;
  }
 }
 if(page.length)pages.push(page);return pages;
}
