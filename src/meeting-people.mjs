const norm=s=>String(s||'').trim().replace(/\s+/g,' ');
export function participantNames(value){if(Array.isArray(value))return value.map(v=>norm(typeof v==='object'?v.name||v.label:v)).filter(Boolean);return String(value||'').split(/[,;\n]+/).map(norm).filter(Boolean)}
export function meetingPeopleOptions({projects=[],teamMaster=[],projectId,participants=''}){const all=new Map(),project=new Map();const add=(name,role,company,isProject=false)=>{name=norm(name);if(!name)return;const key=name.toLowerCase();let p=all.get(key);if(!p){p={name,roles:[],company:norm(company)};all.set(key,p)}if(role&&!p.roles.includes(role))p.roles.push(role==='Owner'?'Client':role);if(isProject)project.set(key,p)};
 for(const p of projects)for(const[role,value]of Object.entries(p.contacts||{}))for(const c of Array.isArray(value)?value:[value])if(c)add(c.name||c.company,role,c.company,String(p.id)===String(projectId));
 for(const m of teamMaster)if(m.active!==false&&String(m.active).toLowerCase()!=='false')add(m.name,m.role||m.designation,m.company);
 for(const n of participantNames(participants))add(n,'Meeting participant','',true);
 const sorted=list=>[...list].sort((a,b)=>a.name.localeCompare(b.name));return {project:sorted(project.values()),all:sorted(all.values())};}
