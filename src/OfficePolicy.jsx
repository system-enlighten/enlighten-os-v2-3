import React from 'react';
import policy from './OfficePolicy.json';

const sectionId=title=>'policy-'+title.toLowerCase().replaceAll(' ','-');

export default function OfficePolicy({salaryOnly=false}){
  const sections=[];
  let current={title:'Office timings',rows:[]};
  sections.push(current);
  for(const row of policy.rows.slice(5)){
    if(!row.some(Boolean))continue;
    if(row[0]&&!row[1]){current={title:row[0],rows:[]};sections.push(current);}
    else current.rows.push(row);
  }
  if(salaryOnly)return <article className="office-policy"><h2>Salary Policy</h2><ul>{sections.find(section=>section.title==='Salary')?.rows.map((row,index)=><li key={index}>{row[1]}</li>)}</ul></article>;
  return <article className="office-policy">
    <p className="office-policy-audience">Applies to the Admin and Design teams.</p>
    <div className="office-policy-layout">
    <nav aria-label="Policy sections">{sections.map(section=><a key={section.title} href={'#'+sectionId(section.title)}>{section.title}</a>)}</nav>
    <div className="office-policy-sections">
    {sections.map(section=><section key={section.title} id={sectionId(section.title)}>
      <h2>{section.title}</h2>
      {section.title==='Attendance status'?<div className="accounts-scroll"><table>
        <thead><tr><th scope="col">Status</th><th scope="col">Attendance value</th></tr></thead>
        <tbody>{section.rows.slice(1).map(row=><tr key={row[1]}><td>{row[1]}</td><td>{row[2]}</td></tr>)}</tbody>
      </table></div>:<ol>{section.rows.map((row,index)=><li key={index}>{row[1]}</li>)}</ol>}
    </section>)}
    <p><a href={policy.source} target="_blank" rel="noreferrer">View policy source</a></p>
    </div>
    </div>
  </article>;
}
