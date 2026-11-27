import {failure} from './project-write-storage.js';
function scheduleGrid_(values,headerRow){
 const norm=v=>String(v||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
 let index=Number(headerRow||0)-1;
 if(!headerRow){let score=-1;values.slice(0,50).forEach((row,i)=>{const labels=row.map(norm);const hits=labels.filter(v=>/^(cn|s no|serial|fitting type|description|luminaire details|quantity|qty|wattage|control|optics|ip|zone|area|colour|color|cct|length|surface|mount|application|height|illuminance|unit|total wattage|brand|model)( |$)/.test(v)).length;if(hits>score){score=hits;index=i;}});if(score<2)throw failure('Could not identify the column headings. Enter the header row number from the Technical Table sheet.');}
 if(!Number.isInteger(index)||index<0||index>=values.length)throw failure('Choose a valid header row.');
 const columns=values[index].map((v,i)=>({label:String(v||'').trim(),index:i})).filter(c=>c.label||values.slice(index+1).some(r=>String(r[c.index]||'').trim()));
 return {headerRow:index+1,headers:columns.map(c=>c.label||'Column '+(c.index+1)),rows:values.slice(index+1).filter(r=>r.some(v=>String(v||'').trim())).map(r=>columns.map(c=>String(r[c.index]||'')))};
}
const TECHNICAL_OUTPUT_FIELDS_=['CN','Surface','Mount','Fitting Type','Description','Optics','Application','Height','Illuminance','Colour & CCT','Control','Length','Length in metre','IP'];
function technicalOutputLayout_(values){
 const norm=s=>String(s||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();const aliases={'colour cct':['colour cct','color cct','colour','color'],'length in metre':['length in metre','length in meter'],'description':['description','floor highlighter adjustable','luminaire details']};
 for(let r=0;r<Math.min(50,values.length);r++){const labels=values[r].map(norm),columns=TECHNICAL_OUTPUT_FIELDS_.map(f=>labels.findIndex(v=>(aliases[norm(f)]||[norm(f)]).includes(v)));if(columns[0]>=0&&columns.every((c,i)=>i===12||c>=0))return {headerRow:r+1,columns};}
 throw failure('Output headings could not be identified. The linked Output tab must have CN, Surface, Mount, Fitting Type, Description, Optics, Application, Height, Illuminance, Colour & CCT, Control, Length and IP headings.');
}
function technicalCircuitSequence_(rows){
 const groups=new Map(),gaps=[],circuits=[];
 for(const [raw] of rows){
  const cn=String(raw).trim().toUpperCase(),m=cn.match(/^([A-Z]+)(\d+)$/);
  if(!m)continue;
  if(!groups.has(m[1]))groups.set(m[1],new Map());
  const n=Number(m[2]);
  if(!Number.isSafeInteger(n)||n>=Number.MAX_SAFE_INTEGER)throw failure("Circuit number is too large: "+cn);
  groups.get(m[1]).set(cn,n);
 }
 for(const zone of [...groups.keys()].sort((a,b)=>a.length-b.length||a.localeCompare(b))){
  const sorted=[...groups.get(zone)].sort(([a,x],[b,y])=>x<y?-1:x>y?1:a.localeCompare(b));
  let previous=null;
  for(const [cn,n] of sorted){
   circuits.push(cn);
   if(previous!==null&&n>previous+1)gaps.push(zone+String(previous+1)+(n>previous+2?' – '+zone+String(n-1):''));
   previous=n;
  }
 }
 return {circuits,gaps};
}

export {scheduleGrid_,technicalOutputLayout_,technicalCircuitSequence_};
