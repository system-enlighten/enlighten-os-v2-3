import React from 'react';
import './TechnicalDocumentation.css';
import './ProjectProductDocuments.css';
export default function ScheduleHeading({project}){
 return <header className="technical-document-heading luminaire-document-heading">
  <h1>Luminaire Schedule</h1>
  {project?.name&&<h2>{project.name}</h2>}
  <p>Lights with a specific character are a part of the <strong>exhibit designers’ BOQ</strong> &amp; not this Luminaire Schedule.<br/>For detailed description, refer luminaire specification sheets.</p>
 </header>;
}
