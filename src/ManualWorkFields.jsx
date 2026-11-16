import React,{useEffect,useId,useState} from 'react';

export const emptyWork={projectId:'',task:'',subtask:''};
export function manualWorkLabel(row){
 return [row.project,row.task,row.subtask,row.note].filter(Boolean).join(' · ');
}

export default function ManualWorkFields({request,value,onChange}){
 const id=useId();
 const [projects,setProjects]=useState([]),[tasks,setTasks]=useState([]),[error,setError]=useState('');
 useEffect(()=>{
  let current=true;
  setTasks([]);setError('');
  request('attendanceDay',{action:'workOptions',projectId:value.projectId},'POST').then(data=>{
   if(current){setProjects(data.projects);setTasks(data.tasks);}
  }).catch(e=>{if(current)setError(e.message);});
  return()=>{current=false;};
 },[request,value.projectId]);
 const subtasks=tasks.filter(task=>task.name===value.task).flatMap(task=>task.subtasks);
 return <div className="manual-work-fields">
  {error&&<p role="alert">{error}</p>}
  <label>Project<select required value={value.projectId} onChange={e=>onChange({...emptyWork,projectId:e.target.value})}><option value="">Select project</option>{projects.map(project=><option key={project.id} value={project.id}>{project.name}</option>)}</select></label>
  <label>Task<input required maxLength={150} list={id+'-tasks'} value={value.task} onChange={e=>onChange({...value,task:e.target.value,subtask:''})}/></label>
  <datalist id={id+'-tasks'}>{[...new Set(tasks.map(t=>t.name))].map(name=><option key={name} value={name}/>)}</datalist>
  <label>Subtask <small>(optional)</small><input maxLength={150} list={id+'-subtasks'} value={value.subtask} onChange={e=>onChange({...value,subtask:e.target.value})}/></label>
  <datalist id={id+'-subtasks'}>{[...new Set(subtasks)].map(name=><option key={name} value={name}/>)}</datalist>
 </div>;
}
