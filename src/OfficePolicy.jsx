import React from 'react';
import policy from './OfficePolicy.json';

export default function OfficePolicy(){
  const sections=[];
  let current={title:'Office timings',rows:[]};
  sections.push(current);
  for(const row of policy.rows.slice(5)){
    if(!row.some(Boolean))continue;
    if(row[0]&&!row[1]){current={title:row[0],rows:[]};sections.push(current);}
    else current.rows.push(row);
  }
  return <article className="office-policy">
    <h2>{policy.rows[0][0]}</h2>
    <p>{policy.rows[1][0]}</p>
    <nav aria-label="Policy sections">{sections.map(section=><a key={section.title} href={'#policy-'+section.title.replaceAll(' ','-')}>{section.title}</a>)}</nav>
    {sections.map(section=><section key={section.title} id={'policy-'+section.title.replaceAll(' ','-')}>
      <h2>{section.title}</h2>
      {section.title==='Attendance Status'?<div className="accounts-scroll"><table>
        <thead><tr><th>Status</th><th>Attendance Value</th></tr></thead>
        <tbody>{section.rows.slice(1).map(row=><tr key={row[1]}><td>{row[1]}</td><td>{row[2]}</td></tr>)}</tbody>
      </table></div>:<ol>{section.rows.map((row,index)=><li key={index}>{row[1]}</li>)}</ol>}
    </section>)}
    <p><a href={policy.source} target="_blank" rel="noreferrer">Open source policy sheet</a></p>
  </article>;
}
