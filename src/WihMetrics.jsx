import React,{useMemo} from 'react';
import {buildWihMetrics} from './wih-metrics.js';
import './WihMetrics.css';
const shortDate=day=>new Date(day+'T12:00:00Z').toLocaleDateString('en-GB',{day:'numeric',month:'short',timeZone:'UTC'});
export default function WihMetrics({tasks,now,period='week',loading=false,personalTasks=tasks,projectIdFor}){
 const m=useMemo(()=>buildWihMetrics(tasks,now,period,projectIdFor),[tasks,now,period,projectIdFor]);
 const personal=useMemo(()=>buildWihMetrics(personalTasks,now,period),[personalTasks,now,period]);
 const rated=personal.onTime+personal.delayed,percent=rated?personal.onTime/rated:0,radius=35,circ=2*Math.PI*radius;
 const taskMax=Math.max(2,Math.ceil(Math.max(...m.weeks.map(w=>Math.max(w.onTime,w.delayed)))/2)*2);
 const projectMax=Math.max(2,Math.ceil(Math.max(...m.weeks.map(w=>w.projects))/2)*2);
 const monthly=period==="month";
 const label=day=>monthly?new Date(day+"T12:00:00Z").toLocaleDateString("en-GB",{month:"short",timeZone:"UTC"}):shortDate(day);
 const series=[
  {field:"onTime",name:"On time",color:"#527e73",max:taskMax},
  {field:"delayed",name:"Delayed",color:"#a86146",max:taskMax},
  {field:"projects",name:"Projects with completions",color:"#536779",max:projectMax,dash:"4 3"}
 ];
 const x=i=>56+i*61;
 const y=(value,max)=>120-84*value/max;
 return <section className="wih-metrics" aria-label="Work in Hand performance summary"><div className="wih-metric-cards">{[['Open',m.open],['Due today',m.dueToday],['Overdue',m.overdue],[monthly?'Completed this month':'Completed this week',m.completedThisWeek]].map(([label,value])=><div key={label}><span>{label}</span><strong>{loading?'—':value}</strong></div>)}</div><div className="wih-metric-graphs"><article><header><h3>My delivery reliability</h3><span>{monthly?"This month":"Last 30 days"}</span></header><div className="wih-reliability"><div className="wih-donut"><svg viewBox="0 0 100 100" role="img" aria-label={loading?'Delivery reliability loading':rated?`${personal.onTime} on time and ${personal.delayed} delayed completions; ${personal.rate}% on time`:'No rated completions in this period'}><circle cx="50" cy="50" r={radius} fill="none" stroke="#e7e9e2" strokeWidth="8"/>{!loading&&rated>0&&<><circle cx="50" cy="50" r={radius} fill="none" stroke="#a86146" strokeWidth="8"/><circle cx="50" cy="50" r={radius} fill="none" stroke="#527e73" strokeWidth="8" strokeDasharray={`${circ*percent} ${circ}`} transform="rotate(-90 50 50)"/></>}</svg><div><strong>{loading||personal.rate===null?'—':personal.rate+'%'}</strong><span>on time</span></div></div><div className="wih-reliability-legend"><p><i className="on-time"/>On time <strong>{loading?'—':personal.onTime}</strong></p><p><i className="delayed"/>Delayed <strong>{loading?'—':personal.delayed}</strong></p>{!loading&&personal.unrated>0&&<small>{personal.unrated} without a committed deadline · excluded</small>}{!loading&&!rated&&<small>No rated completions yet</small>}</div></div></article><article><header><h3>{monthly?"Monthly progress":"Weekly progress"}</h3><span>{monthly?"Last 6 months":"Last 6 weeks"}</span></header><svg className="wih-weekly-chart" viewBox="0 0 420 152" role="img" aria-label={loading?'Progress loading':`Progress by period: ${m.weeks.map(w=>`${label(w.start)}: ${w.onTime} on time, ${w.delayed} delayed, ${w.projects} projects`).join('; ')}`}>
 <text x="38" y="19" fill="#536779" fontSize="11">Task frequency</text>
 <text x="380" y="19" fill="#536779" fontSize="11" textAnchor="end">Number of projects</text>
 {[0,.5,1].map(t=><g key={t}>
  <line x1="38" x2="380" y1={y(t,1)} y2={y(t,1)} stroke="#e0e3dc"/>
  <text x="31" y={y(t,1)+3} textAnchor="end" fill="#536779" fontSize="10">{taskMax*t}</text>
  <text x="387" y={y(t,1)+3} fill="#536779" fontSize="10">{projectMax*t}</text>
 </g>)}
 {!loading&&series.map(({field,name,color,max,dash})=><g key={field}>
  <polyline fill="none" stroke={color} strokeWidth="2" strokeDasharray={dash} points={m.weeks.map((w,i)=>`${x(i)},${y(w[field],max)}`).join(' ')}/>
  {m.weeks.map((w,i)=><circle key={w.start} cx={x(i)} cy={y(w[field],max)} r="2.5" fill={color}><title>{label(w.start)} · {name} · {w[field]}</title></circle>)}
 </g>)}
 {m.weeks.map((w,i)=><text key={w.start} x={x(i)} y="141" textAnchor="middle" fill="#536779" fontSize="10">{label(w.start)}</text>)}
 </svg><div className="wih-weekly-legend">{series.map(({field,name,color,dash})=><span key={field}><i style={{width:12,height:0,borderRadius:0,borderTop:`2px ${dash?'dashed':'solid'} ${color}`}}/>{name}</span>)}</div></article></div><details className="wih-metric-notes"><summary>How these figures are calculated</summary><p>Delivery reliability uses your assigned tasks. Progress counts completed tasks in the displayed scope and counts each project with a completion once per period. Internal work areas are excluded from the project count. Deadlines are the original committed TAT dates; calendar changes do not reset them. No deadline means no overdue flag and no on-time rating. Skipped and cancelled tasks are excluded. Each completed task counts once; task complexity varies.</p><p>Weeks start Monday. Chart windows use India time; deadline comparisons use each task’s saved timezone. {m.missingCompletionDate>0?`${m.missingCompletionDate} completed task(s) lack a valid completion date and are excluded from time-based figures.`:''}</p><table><caption>Completion counts</caption><thead><tr>{['Period starting','On time','Delayed','No deadline','Total','Projects'].map(h=><th key={h}>{h}</th>)}</tr></thead><tbody>{m.weeks.map(w=><tr key={w.start}><td>{label(w.start)}</td><td>{w.onTime}</td><td>{w.delayed}</td><td>{w.unrated}</td><td>{w.total}</td><td>{w.projects}</td></tr>)}</tbody></table></details></section>;
}
