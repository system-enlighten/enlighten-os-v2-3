const norm=value=>String(value||'').trim().replace(/\s+/g,' ');
export function participantKey(value){
 const key=norm(value).toLowerCase();
 return key==='shivum gupta'?'shivam gupta':key;
}

export function participantNames(value){
 const names=Array.isArray(value)
  ?value.map(v=>v&&typeof v==='object'?v.name||v.label:v)
  :String(value||'').split(/[,;\n]+/);
 const unique=new Map();
 for(const value of names){
  const name=norm(value);
  if(name&&!unique.has(participantKey(name)))unique.set(participantKey(name),name);
 }
 return [...unique.values()];
}

export function meetingPeopleOptions({projects=[],teamMaster=[],projectId,participants=''}){
 const people=new Set(),byIdentity=new Map();
 function add(record,roles,isProject=false){
  const name=norm(record.name||record.company);
  if(!name)return;
  const nameKey=participantKey(name);
  const staffId=record.staffUserId||record.userId;
  const email=norm(record.email).toLowerCase();
  const identities=[nameKey,staffId&&'staff:'+staffId,email&&'email:'+email].filter(Boolean);
  const matches=[...new Set(identities.map(key=>byIdentity.get(key)).filter(Boolean))];
  const person=matches[0]||{name,roles:[],company:'',keys:[],isProject:false};
  for(const duplicate of matches.slice(1)){
   roles=[...roles,...duplicate.roles];
   person.company||=duplicate.company;
   person.isProject||=duplicate.isProject;
   person.keys.push(...duplicate.keys);
   people.delete(duplicate);
  }
  person.company||=norm(record.company);
  person.isProject||=isProject;
  person.roles=[...new Set([...person.roles,...roles.filter(Boolean).map(role=>role==='Owner'?'Client':role)])];
  person.keys=[...new Set([...person.keys,...identities])];
  person.keys.forEach(key=>byIdentity.set(key,person));
  people.add(person);
 }
 for(const member of teamMaster){
  if(member.active!==false&&String(member.active).toLowerCase()!=='false'){
   add(member,[member.role,member.designation,/^admin$/i.test(member.appAccess||'')?'Admin':'']);
  }
 }
 for(const p of projects){
  for(const [role,value] of Object.entries(p.contacts||{})){
   for(const contact of Array.isArray(value)?value:[value]){
    if(contact)add(contact,[role],String(p.id)===String(projectId));
   }
  }
 }
 for(const name of participantNames(participants))add({name},['Meeting participant'],!byIdentity.has(participantKey(name)));
 const all=[...people].sort((a,b)=>a.name.localeCompare(b.name));
 return {project:all.filter(p=>p.isProject),all};
}

export function canonicalParticipantNames(value,options){
 return participantNames(participantNames(value).map(name=>{
  const key=participantKey(name);
  return options.all.find(person=>person.keys.includes(key))?.name||name;
 }));
}
