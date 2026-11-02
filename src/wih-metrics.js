export const WIH_METRICS_TIMEZONE='Asia/Kolkata';
const DAY=86400000;
const formatters=new Map();
export function metricDay(value,timeZone=WIH_METRICS_TIMEZONE){
 if(!value)return '';
 if(/^\d{4}-\d{2}-\d{2}$/.test(String(value))){const d=new Date(value+'T12:00:00Z');return Number.isNaN(d.valueOf())||d.toISOString().slice(0,10)!==value?'':String(value);}
 const d=new Date(value);if(Number.isNaN(d.valueOf()))return '';
 try{if(!formatters.has(timeZone)){if(formatters.size>20)formatters.clear();formatters.set(timeZone,new Intl.DateTimeFormat('en-GB',{timeZone,year:'numeric',month:'2-digit',day:'2-digit'}));}const parts=formatters.get(timeZone).formatToParts(d);return ['year','month','day'].map(k=>parts.find(p=>p.type===k)?.value).join('-');}catch{return '';}
}
const shift=(day,days)=>new Date(Date.parse(day+'T12:00:00Z')+days*DAY).toISOString().slice(0,10);
const monday=day=>{const weekday=new Date(day+'T12:00:00Z').getUTCDay();return shift(day,-((weekday+6)%7));};
export function buildWihMetrics(tasks,now=Date.now()){
 const today=metricDay(new Date(now)),start30=shift(today,-29),weekStart=monday(today),seen=new Set();
 const rows=(tasks||[]).filter(t=>{const id=String(t.designTaskId||t.id||'');if(!id||seen.has(id))return false;seen.add(id);return !/^Skipped:/i.test(String(t.task?.remarks||''))&&!/^(cancelled|canceled|skipped)$/i.test(String(t.status||''));}).map(t=>{
  const done=/^(completed|done)$/i.test(String(t.status||'').trim()),tz=t.plan?.timeZone||WIH_METRICS_TIMEZONE,completed=done?metricDay(t.task?.completedAt||t.completedAt||t.stopAt,tz):'',studioCompleted=done?metricDay(t.task?.completedAt||t.completedAt||t.stopAt):'',due=metricDay(String(t.plan?.internalDueDate||'').slice(0,10));
  return {done,completed,studioCompleted,due,today:metricDay(new Date(now),tz),outcome:!done||!completed||!due?'unrated':completed<=due?'onTime':'delayed'};
 });
 const recent=rows.filter(t=>t.done&&t.studioCompleted>=start30&&t.studioCompleted<=today),onTime=recent.filter(t=>t.outcome==='onTime').length,delayed=recent.filter(t=>t.outcome==='delayed').length,unrated=recent.length-onTime-delayed;
 const weeks=Array.from({length:6},(_,i)=>{const start=shift(weekStart,(i-5)*7),end=shift(start,6),list=rows.filter(t=>t.done&&t.studioCompleted>=start&&t.studioCompleted<=end&&t.studioCompleted<=today);return {start,end,total:list.length,onTime:list.filter(t=>t.outcome==='onTime').length,delayed:list.filter(t=>t.outcome==='delayed').length,unrated:list.filter(t=>t.outcome==='unrated').length};});
 return {today,start30,weekStart,open:rows.filter(t=>!t.done).length,dueToday:rows.filter(t=>!t.done&&t.due&&t.due===t.today).length,overdue:rows.filter(t=>!t.done&&t.due&&t.due<t.today).length,completedThisWeek:weeks[5].total,onTime,delayed,unrated,rate:onTime+delayed?Math.round(100*onTime/(onTime+delayed)):null,weeks,missingCompletionDate:rows.filter(t=>t.done&&!t.studioCompleted).length};
}
