const norm=v=>{const n=String(v??'').trim().toUpperCase().replace(/\s/g,'');return /^(STRONG_?RECOMMENDATION|RECOMMENDEDPRODUCT(?:CODE)?)$/.test(n)?'STRONG_RECOMMENDATION':n;};
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
export function mergeConcurrentOutput(base,local,latest,choices={}){
 const headers=[...latest.headers];
 for(const h of local.headers)if(!headers.some(x=>norm(x)===norm(h)))headers.push(h);
 if(headers.length>80)throw Error('The merged Output exceeds 80 columns. Download your edits before resolving the schema.');
 const keys=headers.map(norm),conflicts=[],rows=[],manualRows=[];
 const groups=data=>{
  const cols=new Map(data.headers.map((h,i)=>[norm(h),i])),manual=new Map((data.manualRows||[]).map(r=>[r.rowIndex,r.id])),map=new Map();
  const read=(row,k)=>String(row[cols.get(k)]??'');
  data.rows.forEach((row,i)=>{
   const id=manual.get(i),handle=read(row,'HANDLE').trim();
   const key=id?'manual:'+id:handle?'handle:'+handle.toUpperCase():'circuit:'+norm(read(row,'FLOOR'))+'|'+norm(read(row,'CN'));
   if(!map.has(key))map.set(key,[]);
   map.get(key).push({values:keys.map(k=>read(row,k)),manualId:id||''});
  });
  return map;
 };
 const b=groups(base),l=groups(local),r=groups(latest);
 const resolve=(id,label,field,before,mine,theirs)=>{
  if(same(mine,before))return theirs;
  if(same(theirs,before)||same(mine,theirs))return mine;
  conflicts.push({id,label,field,mine,theirs});
  return choices[id]==='mine'?mine:theirs;
 };
 for(const key of new Set([...r.keys(),...l.keys(),...b.keys()])){
  const before=b.get(key)||[],mine=l.get(key)||[],theirs=r.get(key)||[];
  let merged;
  if(before.length===1&&mine.length===1&&theirs.length===1){
   merged=[{...theirs[0],values:keys.map((field,i)=>resolve(key+'|'+field,key,headers[i],before[0].values[i],mine[0].values[i],theirs[0].values[i]))}];
  }else{
   merged=resolve(key+'|rows',key,'Fixture rows',before,mine,theirs);
  }
  for(const row of merged){if(row.manualId)manualRows.push({id:row.manualId,rowIndex:rows.length});rows.push(row.values);}
 }
 if(rows.length>2000)throw Error('The merged Output exceeds 2,000 rows.');
 // Preserve the latest drawing baseline and unrelated circuit/media overrides.
 return {data:{...latest,headers,rows,manualRows},conflicts};
}
