const clean=value=>String(value??'').replace(/[\r\n|]+/g,' ').trim();
const normalized=value=>clean(value).normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ').trim();
export function appendPlanDraft(text,labels,rows,floor){
 const existing=String(text||'').split(/\r?\n/).filter(line=>line.trim());
 const key=(code,name)=>JSON.stringify([normalized(code),normalized(name)]);
 const seen=new Set(existing.map(line=>{const [code,...name]=line.split('|');return key(code,name.join('|'));}));
 for(const row of rows)if(normalized(row.floor)===normalized(floor)&&row.zoneCode&&(row.area||row.room))seen.add(key(row.zoneCode,row.area||row.room));
 let added=0;
 for(const label of labels){
  const code=clean(label.code).toUpperCase(),name=clean(label.name);
  if(!code&&!name)continue;
  const k=key(code,name);
  if(seen.has(k))continue;
  existing.push(code+' | '+name);
  seen.add(k);added++;
 }
 return {text:existing.join('\n'),added};
}
