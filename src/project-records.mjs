import {needsMomFollowup} from './mom-responsibility.mjs';
export function meetingRecordColumns(event,user){
 const points=event.minutePoints||[],follow=p=>user?needsMomFollowup(p,user):p.task?.kind==='Follow-up',mom=points.filter(p=>p.action!==false&&!follow(p)),followups=points.filter(p=>p.action!==false&&follow(p));
 const discussion=points.filter(p=>p.action===false).map(p=>p.text);
 for(const [key,label]of[['summary','Summary'],['workDone','Work recorded'],['decisions','Decisions'],['momText','Additional notes']])if(event.detail?.[key])discussion.push(label+': '+event.detail[key]);
 const seen=new Set(),photos=[];const add=p=>{if(!p?.url)return;const key=p.fileId||p.url;if(seen.has(key))return;seen.add(key);photos.push(p)};
 (event.detail?.photos||[]).forEach(add);for(const p of points){(p.photos||[]).forEach(add);try{const saved=JSON.parse(p.task?.photosJson||'[]');if(Array.isArray(saved))saved.forEach(add)}catch{}}
 return {mom,followups,discussion,photos,original:!points.length?event.notes||event.actions||'':''};
}
export function filterProjectHistory(history,{kind='all',query='',oldestFirst=false}={}){const search=query.trim().toLowerCase();return history.filter(e=>(kind==='all'||kind==='drawings'&&e.kind.startsWith('drawing-')||kind===e.kind)&&(!search||[e.title,e.fileName,e.revision,e.drawingCode,...(e.floors||[]),...(e.areas||[]),...(e.drawingTypes||[]),e.meeting?.participants,e.meeting?.notes,...(e.meeting?.minutePoints||[]).map(p=>p.text)].join(' ').toLowerCase().includes(search))).sort((a,b)=>{const x=Date.parse(a.date),y=Date.parse(b.date);if(!Number.isFinite(x))return Number.isFinite(y)?1:0;if(!Number.isFinite(y))return-1;return(oldestFirst?x-y:y-x)||String(a.id).localeCompare(String(b.id))})}

export function meetingRecordSummary(event){
 const {photos}=meetingRecordColumns(event);
 const minutes=(event.minutePoints||[]).map(p=>String(p.text||'').trim()).filter(Boolean);
 const append=value=>{const text=String(value||'').trim();if(text&&!minutes.includes(text))minutes.push(text)};
 if(!minutes.length){append(event.notes);append(event.actions);}
 for(const key of ['summary','workDone','decisions','momText'])append(event.detail?.[key]);
 return {minutes,photos};
}
const indiaDay=value=>new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(value));
const scheduledMinute=value=>{const m=String(value||'').trim().match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*(am|pm)?$/i);if(!m)return null;let h=Number(m[1]),minute=Number(m[2]);if(minute>59||h>(m[3]?12:23)||m[3]&&h<1)return null;if(m[3])h=h%12+(m[3].toLowerCase()==='pm'?12:0);return h*60+minute};
export function meetingClockSegments(timing,eventDate){
 const t=timing||{};if(t.source==='scheduled'){
  const start=scheduledMinute(t.start),end=scheduledMinute(t.end);if(start===null&&end===null)return [];
  const day=String(eventDate||'').slice(0,10);if(start!==null&&end!==null&&end<start){const next=new Date(day+'T00:00:00Z');if(!Number.isFinite(+next))return [];next.setUTCDate(next.getUTCDate()+1);return [{day,start,end:1440},{day:next.toISOString().slice(0,10),start:0,end}];}
  return [{day,start,end}];
 }
 if(t.source!=='recorded')return [];
 const start=Date.parse(t.start),end=Date.parse(t.end);if(!Number.isFinite(start))return [];
 const first=indiaDay(start),midnight=Date.parse(first+'T00:00:00+05:30');
 if(!Number.isFinite(end)||end<start)return [{day:first,start:(start-midnight)/60000,end:null}];
 const segments=[];for(let cursor=midnight;cursor<=end&&segments.length<31;cursor+=86400000){if(cursor===end&&end>start)break;segments.push({day:indiaDay(cursor),start:Math.max(0,(start-cursor)/60000),end:Math.min(1440,(end-cursor)/60000)});}
 return segments;
}
