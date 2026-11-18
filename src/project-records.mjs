export function meetingRecordColumns(event){
 const points=event.minutePoints||[],mom=points.filter(p=>p.action!==false&&p.task?.kind!=='Follow-up'),followups=points.filter(p=>p.action!==false&&p.task?.kind==='Follow-up');
 const discussion=points.filter(p=>p.action===false).map(p=>p.text);
 for(const [key,label]of[['summary','Summary'],['workDone','Work recorded'],['decisions','Decisions'],['momText','Additional notes']])if(event.detail?.[key])discussion.push(label+': '+event.detail[key]);
 const seen=new Set(),photos=[];const add=p=>{if(!p?.url)return;const key=p.fileId||p.url;if(seen.has(key))return;seen.add(key);photos.push(p)};
 (event.detail?.photos||[]).forEach(add);for(const p of points){(p.photos||[]).forEach(add);try{const saved=JSON.parse(p.task?.photosJson||'[]');if(Array.isArray(saved))saved.forEach(add)}catch{}}
 return {mom,followups,discussion,photos,original:!points.length?event.notes||event.actions||'':''};
}
export function filterProjectHistory(history,{kind='all',query='',oldestFirst=false}={}){const search=query.trim().toLowerCase();return history.filter(e=>(kind==='all'||kind==='drawings'&&e.kind.startsWith('drawing-')||kind===e.kind)&&(!search||[e.title,e.fileName,e.revision,e.drawingCode,...(e.floors||[]),...(e.areas||[]),...(e.drawingTypes||[]),e.meeting?.participants,e.meeting?.notes,...(e.meeting?.minutePoints||[]).map(p=>p.text)].join(' ').toLowerCase().includes(search))).sort((a,b)=>{const x=Date.parse(a.date),y=Date.parse(b.date);if(!Number.isFinite(x))return Number.isFinite(y)?1:0;if(!Number.isFinite(y))return-1;return(oldestFirst?x-y:y-x)||String(a.id).localeCompare(String(b.id))})}
