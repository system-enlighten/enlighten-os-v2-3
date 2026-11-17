import React from 'react';

const monthNames='January February March April May June July August September October November December'.split(' ');
const referenceMonths=[
  ...[2022,2023,2024].flatMap(year=>monthNames.map((name,index)=>({
    key:year+'-'+String(index+1).padStart(2,'0'),
    label:(year===2024&&index>=7?name.slice(0,3):name)+' '+String(year).slice(2),
  }))),
  ...['Jan','Feb','Mar'].map((name,index)=>({key:'2025-0'+(index+1),label:name+' 25'})),
  ...monthNames.slice(3,11).map((name,index)=>({key:'2026-'+String(index+4).padStart(2,'0'),label:name+' 26'})),
  {key:'2026-12',label:'Dec 26'},{key:'2027-12',label:'Dec 27'},
  {key:'2028-12',label:'Dec 28'},{key:'2026-03',label:'March 26'},
];
const headings=['Project Name','Client Name','Project Amount','Total Amount Received','Remaining Balance'];

export default function PaymentDashboard({projects,milestones,receipts,money}){
  const byProject=new Map(projects.map(p=>[String(p.id),{...p,commitment:null,received:0,months:new Map()}]));
  const monthTotals=new Map();
  for(const milestone of milestones){
    const row=byProject.get(String(milestone.projectId));
    if(row)row.commitment=(row.commitment??0)+milestone.amount;
  }
  for(const receipt of receipts){
    const row=byProject.get(String(receipt.projectId));
    if(!row)continue;
    row.received+=receipt.amount;
    const key=receipt.date?.slice(0,7);
    if(!/^\d{4}-(0[1-9]|1[0-2])$/.test(key||''))continue;
    row.months.set(key,(row.months.get(key)||0)+receipt.amount);
    monthTotals.set(key,(monthTotals.get(key)||0)+receipt.amount);
  }
  const referenceKeys=new Set(referenceMonths.map(month=>month.key));
  const extra=[...monthTotals.keys()].filter(key=>!referenceKeys.has(key)).sort().map(key=>({
    key,label:monthNames[Number(key.slice(5))-1].slice(0,3)+' '+key.slice(2,4),
  }));
  const months=[...referenceMonths,...extra];
  return <div className="payment-sheet-scroll" tabIndex={0} role="region" aria-label="Project payments by month">
    <table className="payment-sheet" aria-label="Payment Dashboard">
      <colgroup>{headings.map(label=><col key={label}/>)}{months.map(({key})=><col key={key}/>)}</colgroup>
      <thead>
        <tr className="payment-sheet-totals"><th scope="row" colSpan={5}>Monthly totals</th>{months.map(({key})=><td key={key}>{monthTotals.has(key)?money(monthTotals.get(key)):''}</td>)}</tr>
        <tr>{headings.map(label=><th scope="col" key={label}>{label}</th>)}{months.map(({key,label})=><th scope="col" key={key}>{label}</th>)}</tr>
      </thead>
      <tbody>{[...byProject.values()].map(row=><tr key={row.id}>
        <th scope="row">{row.name}</th><td>{row.client||''}</td>
        <td>{row.commitment===null?'':money(row.commitment)}</td>
        <td>{row.received?money(row.received):''}</td>
        <td>{row.commitment===null?'':money(row.commitment-row.received)}</td>
        {months.map(({key})=><td key={key}>{row.months.has(key)?money(row.months.get(key)):''}</td>)}
      </tr>)}
      {!byProject.size&&<tr><td colSpan={headings.length+months.length}>No projects available.</td></tr>}</tbody>
    </table>
  </div>;
}
