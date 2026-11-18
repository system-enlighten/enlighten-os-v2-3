const requests=new WeakMap();
export function diaryResponsiblePeople(rows,projectId){
 const people=new Map();
 for(const row of rows||[]){
  if(String(row.projectId)!==String(projectId)||row.active===false||String(row.active).toLowerCase()==='false')continue;
  const name=String(row.name||row.company||'').trim();if(!name)continue;
  let person=people.get(name);if(!person){person={name,roles:[]};people.set(name,person);}
  const role=row.role==='Owner'?'Client':String(row.role||'').trim();if(role&&!person.roles.includes(role))person.roles.push(role);
 }
 return [...people.values()].sort((a,b)=>a.name.localeCompare(b.name));
}
export function loadDiaryResponsiblePeople(request,projectId,{refresh=false}={}){
 let cache=requests.get(request);if(!cache){cache=new Map();requests.set(request,cache);}
 const key=String(projectId),old=cache.get(key);
 if(!refresh&&old&&Date.now()-old.at<60000)return old.promise;
 const entry={at:Date.now()};entry.promise=Promise.resolve().then(()=>request('listProjectContacts',{projectId:key},'POST')).then(rows=>diaryResponsiblePeople(rows,key)).catch(error=>{if(cache.get(key)===entry)cache.delete(key);throw error;});cache.set(key,entry);return entry.promise;
}
