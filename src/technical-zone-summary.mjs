import{shortTechnicalFloor}from'./technical-column-logic.mjs';
const clean=v=>String(v??'').trim(),key=v=>clean(v).toUpperCase().replace(/\s+/g,'');
const active=z=>!['false','0'].includes(clean(z.active).toLowerCase());
const ordinal=code=>code.split('').reduce((n,c)=>n*26+c.charCodeAt(0)-64,0);
function read(headers,row,names){for(const name of names)for(let i=0;i<headers.length;i++)if(key(headers[i])===key(name)&&clean(row[i])&&clean(row[i])!=='<>')return clean(row[i]);return '';}
function zoneValue(zone,names){for(const name of names)for(const prop of Object.keys(zone))if(key(prop)===key(name)&&zone[prop]!==null&&zone[prop]!==undefined&&clean(zone[prop])!=='')return zone[prop];return '';}
export function wattsFromDescription(value,{numericWatts=false}={}){
 const text=clean(value);if(numericWatts&&/^\d+(?:\.\d+)?$/.test(text))return {watts:Number(text),perMetre:false};
 if(/(?:^|\s)-\s*\d+(?:\.\d+)?\s*(?:k?w|watts?)\b/i.test(text)||/\d\s*[-–]\s*\d+(?:\.\d+)?\s*(?:k?w|watts?)/i.test(text))return {watts:null,reason:'ambiguous or invalid wattage'};
 const matches=[...text.matchAll(/(?:(\d+)\s*[x×]\s*)?((?:\d+(?:\.\d+)?)|(?:\.\d+))\s*(kw|watts?|w)(?:\s*(\/|per)\s*(metres?|meters?|m)(?![a-z0-9]))?/gi)];
 if(matches.length!==1)return {watts:null,reason:matches.length?'multiple wattages in the description':'wattage not provided'};
 const m=matches[0];if(!m[4]&&/^(?:\s*\/|\s*per\b)/i.test(text.slice(m.index+m[0].length)))return {watts:null,reason:'unsupported wattage unit'};
 return {watts:Number(m[2])*(m[1]?Number(m[1]):1)*(m[3].toLowerCase()==='kw'?1000:1),perMetre:!!m[4]};
}
export function rowConnectedWatts(headers,row){
 const illumination=read(headers,row,['ILLUMINANCE','ILLUMINATION']),explicit=read(headers,row,['WATTAGE','WATTS','POWER(W)','POWER']);let power=wattsFromDescription(illumination);
 if(power.watts===null&&power.reason==='wattage not provided'&&explicit)power=wattsFromDescription(explicit,{numericWatts:true});
 if(power.watts===null)return power;if(!power.perMetre)return {watts:power.watts};
 const metres=read(headers,row,['LENGTHINMETRE','LENGTHINMETERS','LENGTHINMETRES']),length=metres||read(headers,row,['LENGTH']);
 if(!/^(?:\d+(?:\.\d+)?|\.\d+)\s*(?:mm|m)?$/i.test(length))return {watts:null,reason:'W/m requires a valid linear length'};
 const amount=Number(length.replace(/\s*(?:mm|m)\s*$/i,''));if(!Number.isFinite(amount)||amount<=0)return {watts:null,reason:'W/m requires a positive linear length'};
 const inMetres=metres||(/m\s*$/i.test(length)&&!/mm\s*$/i.test(length));return {watts:power.watts*amount/(inMetres?1:1000)};
}
export function buildZoneSummary(data,zones=[]){
 const headers=data.headers||[],hasOutput=(data.rows||[]).length>0,groups=new Map(),warnings=[];
 const group=(code,floor,zone=null,unresolved=false)=>{const id=key(shortTechnicalFloor(floor))+'|'+code;if(!groups.has(id))groups.set(id,{id,code,floor:shortTechnicalFloor(floor),area:zone?clean(zone.area||zone.room||zone.areaName):'',squareFeet:zone?zoneValue(zone,['sqFt','squareFeet','squareFoot','areaSqFt','SQ. FT','SQ_FT']):'',circuits:new Set(),luminaires:0,knownWatts:0,missingLoads:0,unresolved});return groups.get(id)};
 const available=zones.filter(active);available.forEach(z=>{const code=key(z.zoneCode);if(code)group(code,clean(z.floor),z)});
 (data.rows||[]).forEach((row,index)=>{
  const cn=key(read(headers,row,['CN','CIRCUITNUMBER'])),code=cn.match(/^[A-Z]+/)?.[0];if(!cn||!code){warnings.push(`Output row ${index+1}: no supported circuit number; not included in zone totals.`);return}
  const floor=read(headers,row,['FLOOR','FLOORNAME']),matches=available.filter(z=>key(z.zoneCode)===code&&(!floor||key(shortTechnicalFloor(z.floor))===key(shortTechnicalFloor(floor))));let target;
  if(matches.length===1)target=group(code,clean(matches[0].floor),matches[0]);else{target=group(code,floor,null,true);target.unresolved=true;warnings.push(`${cn}: ${matches.length>1?'floor is ambiguous; add FLOOR to Output':'no matching active Floor Zone'}. Counts are shown in the unresolved zone row.`);}
  target.circuits.add(cn);target.luminaires++;const load=rowConnectedWatts(headers,row);if(load.watts===null){target.missingLoads++;warnings.push(`${cn} · Output row ${index+1}: ${load.reason}.`)}else target.knownWatts+=load.watts;
 });
 return {hasOutput,rows:[...groups.values()].sort((a,b)=>ordinal(a.code)-ordinal(b.code)||a.floor.localeCompare(b.floor,undefined,{numeric:true})).map(g=>({...g,totalCircuits:hasOutput?g.circuits.size:null,totalLuminaires:hasOutput?g.luminaires:null,connectedWatts:hasOutput&&(g.missingLoads<g.luminaires||g.luminaires===0)?g.knownWatts:null,partial:g.missingLoads>0})),warnings:[...new Set(warnings)]};
}
export function formatZoneLoad(row){if(row.connectedWatts===null)return '—';return (row.partial?'≥ ':'')+new Intl.NumberFormat('en-IN',{maximumFractionDigits:2}).format(row.connectedWatts)+' W';}
export function zoneLoadTotal(summary){const missingLoads=summary.rows.reduce((n,r)=>n+r.missingLoads,0),known=summary.rows.reduce((n,r)=>n+Math.max(0,(r.totalLuminaires||0)-r.missingLoads),0);return {connectedWatts:summary.hasOutput&&(known>0||missingLoads===0)?summary.rows.reduce((n,r)=>n+(r.connectedWatts||0),0):null,missingLoads,partial:missingLoads>0};}
