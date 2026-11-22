import React,{useEffect,useState} from 'react';
import GeneratedTechnicalTable from './GeneratedTechnicalTable.jsx';
export default function ProductTechnicalTable({projectId,projectName,projectCode,request}){
 const [assessment,setAssessment]=useState(null),[error,setError]=useState(''),[revision,setRevision]=useState(0);
 useEffect(()=>{let live=true;setAssessment(null);setError('');if(projectId)request('getProductAssessment',{projectId},'POST',90000).then(r=>live&&setAssessment(r)).catch(e=>live&&setError(e.message));return()=>{live=false}},[projectId,revision]);
 return <>{error&&<p role="alert">{error}</p>}{projectId&&!assessment&&!error&&<p role="status">Loading selected products…</p>}{assessment&&<GeneratedTechnicalTable key={projectId} projectId={projectId} projectName={projectName} projectCode={projectCode} request={request} canEdit={false} productAssessment={assessment} onRefreshProducts={()=>setRevision(n=>n+1)}/>}</>;
}
