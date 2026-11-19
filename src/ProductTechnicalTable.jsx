import React,{useEffect,useState} from 'react';
import GeneratedTechnicalTable from './GeneratedTechnicalTable.jsx';
export default function ProductTechnicalTable({projectId,request}){
 const [assessment,setAssessment]=useState(null),[error,setError]=useState(''),[revision,setRevision]=useState(0);
 useEffect(()=>{let live=true;setAssessment(null);setError('');if(projectId)request('getProductAssessment',{projectId},'POST',90000).then(r=>live&&setAssessment(r)).catch(e=>live&&setError(e.message));return()=>{live=false}},[projectId,revision]);
 return <>{error&&<p role="alert">{error}</p>}{projectId&&!assessment&&!error&&<p role="status">Loading selected products…</p>}{assessment&&<><div className="technical-controls" style={{display:'flex',gap:12,margin:'16px 0'}}><button onClick={()=>setRevision(n=>n+1)}>Refresh selected products</button><button onClick={()=>window.print()}>Print / Save PDF</button></div><GeneratedTechnicalTable key={projectId+'|'+revision} projectId={projectId} request={request} canEdit={false} productAssessment={assessment}/></>}</>;
}
