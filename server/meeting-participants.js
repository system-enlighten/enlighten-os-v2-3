import {active} from './project-write-storage.js';
const indiaClock=value=>new Date(+value+19800000).toISOString().slice(11,16);
function meetingParticipantTokens_(value){
 if(Array.isArray(value))return value.flatMap(meetingParticipantTokens_);
 if(value&&typeof value==='object')return [value.userId,value.id,value.name,value.label,value.email].filter(Boolean).map(String);
 const text=String(value||'').trim();if(!text)return [];if(/^[\[{]/.test(text)){try{return meetingParticipantTokens_(JSON.parse(text))}catch(_){}}
 return text.split(/[,;\n]/).map(v=>v.trim()).filter(Boolean);
}
function meetingParticipantDisplay_(value){if(Array.isArray(value))return value.map(v=>v&&typeof v==='object'?v.name||v.label||v.userId||v.id||'':v).filter(Boolean).join(', ');return String(value||'');}
function projectContactStaff_(contact,people){
 const norm=v=>String(v||'').trim().toLowerCase();
 if(!['principal lighting designer','lighting designer','lighting engineer','process coordinator'].includes(norm(contact.role)))return null;
 const staff=people.filter(p=>p.userId&&active(p.active)&&/^(admin|user|viewer)$/i.test(String(p.appAccess||'User').trim()));
 const email=norm(contact.email),id=String(contact.staffUserId||'');
 const matches=email?staff.filter(p=>norm(p.email)===email):id?staff.filter(p=>String(p.userId)===id):staff.filter(p=>norm(p.name)===norm(contact.name));
 return matches.length===1?matches[0]:null;
}
function resolveSiteVisitParticipants_(source,people,contacts=[]){
 const normal=v=>String(v||'').trim().replace(/\s+/g,' ').toLowerCase();
 const names=meetingParticipantTokens_(source?.participants),ids=meetingParticipantTokens_(source?.participantUserIds),keys=new Set([...names,...ids,...(!names.length&&!ids.length?[source?.visitLeadId]:[])].map(normal).filter(Boolean));
 const linked=contacts.filter(c=>String(c.projectId)===String(source?.projectId)&&active(c.active)&&[c.contactId,c.name,c.email].some(v=>keys.has(normal(v)))).map(c=>projectContactStaff_(c,people)).filter(Boolean);
 const matches=[...linked,...people.filter(p=>p.userId&&active(p.active)&&/^(admin|user|viewer)$/i.test(String(p.appAccess||'User').trim())&&[p.userId,p.name,p.email].some(v=>keys.has(normal(v))))];
 return [...new Map(matches.map(p=>[String(p.userId),p])).values()];
}
function meetingClockCell_(value,display){
 const clock=v=>{const m=String(v??'').trim().match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*([ap]m)?$/i);if(!m||Number(m[2])>59)return '';let h=Number(m[1]);if(m[3]){if(h<1||h>12)return '';h=h%12+(m[3].toLowerCase()==='pm'?12:0)}if(h>23)return '';return String(h).padStart(2,'0')+':'+m[2]};
 const shown=clock(display);if(shown)return shown;
 if(value instanceof Date)return indiaClock(value);
 if(typeof value==='number'&&value>=0&&value<1){const n=Math.round(value*1440)%1440;return String(Math.floor(n/60)).padStart(2,'0')+':'+String(n%60).padStart(2,'0')}
 const direct=clock(value);if(direct)return direct;const text=String(value||'');if(/^\d{4}-\d{2}-\d{2}T/.test(text)&&Number.isFinite(Date.parse(text)))return indiaClock(new Date(text));return text;
}

function resolveSiteVisitLead_(values,people){
 const keys=new Set(values.map(v=>String(v).trim().toLowerCase()).filter(Boolean));
 const matches=people.filter(person=>person.userId&&active(person.active)&&[person.userId,person.name,person.email].some(v=>keys.has(String(v||'').trim().toLowerCase())));
 return matches.length===1?matches[0]:null;
}

function isVisitClock_(value){
 return /^([01]\d|2[0-3]):[0-5]\d$/.test(String(value||''));
}


export {meetingParticipantTokens_,meetingParticipantDisplay_,resolveSiteVisitParticipants_,resolveSiteVisitLead_,isVisitClock_,meetingClockCell_};
