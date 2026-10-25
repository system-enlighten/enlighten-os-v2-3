export const TECH_COLUMNS=['CN','Surface','Mount','Fitting Type','Description','Optics','Application','Height','Illuminance','Colour & CCT','Control','Length','Length in metre','IP'];
const key=v=>String(v??'').trim();
export function parseCadOutput(text){
 if(String(text||'').length>1200000)throw Error('Output is too large; split it into separate drawings.');
 const grid=[];let row=[],cell='',quote=false;const s=String(text||'').replace(/\r\n?/g,'\n');
 for(let i=0;i<s.length;i++){const c=s[i];if(c==='"'&&(quote||cell==='')){if(quote&&s[i+1]==='"'){cell+='"';i++;}else quote=!quote;}else if(!quote&&(c==='\t'||c==='\n')){row.push(cell);cell='';if(c==='\n'){grid.push(row);row=[];}}else cell+=c;}
 if(quote)throw Error('A quoted cell is unfinished. Paste the complete CAD rows.');if(cell||row.length){row.push(cell);grid.push(row);}const rows=grid.filter(r=>r.some(v=>key(v)));if(!rows.length)return [];
 if(rows.length>5001)throw Error('Paste up to 5000 Output rows per drawing.');
 const hasHeader=key(rows[0][0]).toUpperCase()==='CN';let columns=hasHeader?rows.shift().map(v=>key(v).toLowerCase().replace(/\s+/g,' ')):null;
 const aliases={'description':['description','floor highlighter [adjustable]','luminaire details'],'colour & cct':['colour & cct','color & cct','colour','color'],'length in metre':['length in metre','length in meter']};
 return rows.map((values,index)=>{let mapped;if(columns){mapped=TECH_COLUMNS.map(name=>{const allowed=aliases[name.toLowerCase()]||[name.toLowerCase()];const at=columns.findIndex(c=>allowed.includes(c));return at<0?'':key(values[at]);});}else{if(![13,14].includes(values.length))throw Error(`Row ${index+1}: expected 13 CAD columns (without metres) or 14 columns from CN through IP. Paste a header row for custom layouts.`);mapped=values.map(key);if(mapped.length===13)mapped.splice(12,0,'');}
 if(!/^[A-Za-z]+\d+$/.test(mapped[0]))throw Error(`Row ${index+1}: invalid CN “${mapped[0]}”. Expected A1, Z12 or AA1.`);
 if(mapped.some(v=>v.length>4000))throw Error(`Row ${index+1}: a cell is too long.`);mapped[0]=mapped[0].toUpperCase();return mapped;});
}
export function technicalZoneOrdinal(code){return [...code].reduce((n,c)=>n*26+c.charCodeAt(0)-64,0);}
export function buildTechnicalTable(rows,database,floorZones=[],floor=''){
 const groups=new Map(),db=new Map();for(const entry of database){const code=key(entry.fittingType);if(code&&!db.has(code))db.set(code,entry);}
 for(const r of rows){if(!groups.has(r[0]))groups.set(r[0],[]);groups.get(r[0]).push(r);}
 return [...groups.entries()].sort(([a],[b])=>{const x=a.match(/^([A-Z]+)(\d+)$/),y=b.match(/^([A-Z]+)(\d+)$/);return technicalZoneOrdinal(x[1])-technicalZoneOrdinal(y[1])||Number(x[2])-Number(y[2]);}).map(([cn,items])=>{
 const r=items.at(-1),zoneCode=cn.match(/^[A-Z]+/)[0],fitting=db.get(r[3]),linear=/^L/i.test(r[3]),warnings=[];
 const number=v=>key(v)===''?null:Number(key(v).replace(/,/g,''));const lengths=items.map(x=>{const mm=number(x[11]),m=number(x[12]);return mm!==null&&Number.isFinite(mm)?mm/1000:m!==null&&Number.isFinite(m)?m:null;});
 if(linear&&lengths.some(x=>x===null||x<0))warnings.push('Missing or invalid linear length');
 const quantity=linear?lengths.every(x=>x!==null&&x>=0)?lengths.reduce((a,b)=>a+b,0):null:items.length;
 const fmt=n=>Number(n.toFixed(3)).toString();const quantityDetail=linear?lengths.map(x=>x===null?'?':fmt(x)).join(' + '):'';
 const watts=items.map((x,i)=>{const match=String(x[8]).match(/(\d+(?:\.\d+)?)\s*W(?:\s*\/\s*M)?\b/i);const unit=match?Number(match[1]):Number(fitting?.wattage);return Number.isFinite(unit)&&unit>0&&(!linear||lengths[i]!==null)?unit*(linear?lengths[i]:1):null;});
 const totalWattage=watts.every(x=>x!==null)?watts.reduce((a,b)=>a+b,0):null;
 if(!fitting&&r[3])warnings.push('Fitting type not in Database');
 const duplicateKeys=database.filter(d=>key(d.fittingType)===r[3]);if(duplicateKeys.length>1)warnings.push('Duplicate fitting types in Database; first entry used');
 if(items.some(x=>[3,4,5,6,7,8,9,10,13].some(i=>x[i]!==r[i])))warnings.push('Conflicting specifications for the same CN; review Output');
 const zones=floorZones.filter(z=>key(z.zoneCode||z.zone).toUpperCase()===zoneCode&&(!floor||key(z.floor)===floor));const zone=zones.length===1?[zones[0].floor,zones[0].area||zones[0].room].filter(Boolean).join(' | '):zoneCode;
 if(zones.length!==1)warnings.push(zones.length?'Select a floor to resolve zone':'Zone not found in Floor / Zone');
 return {cn,zoneCode,zone,fittingType:r[3],iconUrl:fitting?.iconUrl||'',thumbnailUrl:fitting?.thumbnailUrl||'',brand:fitting?.brand||'',details:r[3]?[r[3],r[4],r[6]].filter(Boolean).join('\n'):`Interior Designer’s choice ${[r[4],r[6]].filter(Boolean).join(' ')} suitable for LED based lamp`,surface:r[1],mount:r[2],illuminance:r[8],optics:r[5],height:r[7],colour:r[9],control:r[10],ip:r[13],quantity,unit:linear?'m':'Pc',quantityDetail,totalWattage,bufferedWattage:totalWattage===null?null:totalWattage*1.2,warnings,sourceCount:items.length};
 });
}
