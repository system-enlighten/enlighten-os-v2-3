import {createHash} from 'node:crypto';
import {active} from './project-write-storage.js';
const siteExecutionKey_=values=>'SE-'+createHash('sha256').update(JSON.stringify(values)).digest('hex');
function siteExecutionStored_(row){let photos=[];try{photos=JSON.parse(row.photosJson||'[]')}catch{}return {...row,installed:row.installed===true||String(row.installed).toLowerCase()==='true',snagClosed:row.snagClosed===true||String(row.snagClosed).toLowerCase()==='true',photos:Array.isArray(photos)?photos:[]};}
function siteExecutionCircuits_(output,zones){
 const clean=value=>String(value??'').trim();
 const key=value=>clean(value).toUpperCase().replace(/\s+/g,'');
 const read=(row,names)=>{
  for(const name of names){
   for(let index=0;index<output.headers.length;index++){
    const value=clean(row[index]);
    if(key(output.headers[index])===name&&value&&value!=='<>')return value;
   }
  }
  return '';
 };
 const circuits=new Map();
 for(const row of output.rows){
  const cn=key(read(row,['CN','CIRCUITNUMBER']));
  if(!cn)continue;
  const prefix=cn.match(/^[A-Z]+/)?.[0]||'';
  const explicitFloor=read(row,['FLOOR','FLOORNAME']);
  const locations=zones.filter(zone=>!['false','0'].includes(String(zone.active).toLowerCase())&&key(zone.zoneCode)===prefix&&(!explicitFloor||key(zone.floor)===key(explicitFloor)));
  const location=locations.length===1?locations[0]:null;
  const floor=explicitFloor||location?.floor||'';
  const circuitId=floor+'|'+cn;
  if(!circuits.has(circuitId))circuits.set(circuitId,{circuitId,cn,floor,zone:location?.area||'',prefix,ambiguous:locations.length>1&&!floor});
 }
 return [...circuits.values()];
}

export function buildSiteExecution({projectId,workbookId,output,zones,records,tasks,points,user,sign,now}) {
const items=siteExecutionCircuits_(output,zones);
const saved=new Map(records.filter(row=>['product-circuit',workbookId].includes(String(row.workbookId||''))).map(row=>[row.itemKey,siteExecutionStored_(row)]));
 const mom=new Map(),linkedActions=new Set();
 const addMom=(circuitKey,entry)=>{
  if(!circuitKey)return;
  if(!mom.has(circuitKey))mom.set(circuitKey,[]);
  mom.get(circuitKey).push(entry);
 };
 for(const task of tasks){
  if(task.pointId)linkedActions.add(JSON.stringify([String(task.visitId),String(task.pointId)]));
  addMom(task.circuitKey,{id:task.momTaskId,title:task.title,date:task.visitDate,completed:active(task.completed),action:true});
 }
 {
  for(const row of points){
   if(String(row.projectId)!==projectId)continue;
   let point;
   try{point=JSON.parse(row.recordJson);}catch{continue;}
   const circuitKey=point?.circuit?.key;
   if(!circuitKey||!point.text||linkedActions.has(JSON.stringify([String(row.visitId),String(point.id)])))continue;
   addMom(circuitKey,{id:row.pointKey,title:point.text,action:!!point.action});
  }
 }

 const clean=value=>String(value||'').trim().replace(/\s+/g,' ').toUpperCase();
 const oldKey=(floor,zone,cn)=>siteExecutionKey_([projectId,workbookId,clean(floor),clean(zone),clean(cn)]);
 const shortFloor=value=>{
  const floor=String(value||'').trim();
  if(/^(?:ground(?: floor)?|gf)$/i.test(floor))return 'GF';
  const match=floor.match(/^(?:(\d+)(?:st|nd|rd|th)?(?: floor)?|(?:floor )?(\d+)f?)$/i);
  if(match)return (match[1]||match[2])+'F';
  return {first:'1F',second:'2F',third:'3F',fourth:'4F',fifth:'5F'}[floor.toLowerCase().replace(/ floor$/,'')]||floor;
 };
 const keys=items.map(item=>{
  const {floor,zone,cn}=item;
  const canonical=siteExecutionKey_([projectId,'product-circuit',floor,cn]);
  const legacy=workbookId&&floor&&zone?[floor,shortFloor(floor)].flatMap(label=>{
   const combined=label+' | '+zone;
   return [oldKey(label,zone,cn),oldKey('',combined,cn),oldKey(label,combined,cn)];
  }):[];
  return {canonical,legacy:[...new Set(legacy)]};
 });
 const uses=new Map();
 keys.forEach(({legacy})=>legacy.forEach(key=>uses.set(key,(uses.get(key)||0)+1)));
 return {canEdit:String(user.appAccess).toLowerCase()!=='viewer',items:items.map((item,index)=>{
  const {canonical,legacy}=keys[index];
  const compatible=legacy.filter(key=>uses.get(key)===1);
  const oldRecords=compatible.filter(key=>saved.has(key));
  const conflict=oldRecords.length>1&&!saved.has(canonical);
  const itemKey=!saved.has(canonical)&&oldRecords.length===1?oldRecords[0]:canonical;
  const editable=!item.ambiguous&&!conflict;
  let token='';
  if(editable){
   const payload=Buffer.from(JSON.stringify({
    projectId:projectId,workbookId:itemKey===canonical?'product-circuit':workbookId,itemKey,cn:item.cn,zone:item.zone,floor:item.floor,expires:now+8*60*60*1000
   })).toString('base64url');
   token=payload+'.'+sign(payload);
  }
  return {...item,itemKey,editable,token,record:saved.get(itemKey)||{version:'',installed:false,snagClosed:false},
   momTasks:[...new Map([canonical,...compatible].flatMap(key=>mom.get(key)||[]).map(point=>[point.id,point])).values()],
   warning:conflict?'Multiple legacy tracking records match this circuit.':item.ambiguous?'Specify the floor in Output before tracking this circuit.':''
  };
 })};
}

export {siteExecutionStored_};
