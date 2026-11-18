const stores=new WeakMap();
export function momDiscussionStore(request,projectId){
 let projects=stores.get(request);if(!projects){projects=new Map();stores.set(request,projects);}const pid=String(projectId);if(projects.has(pid))return projects.get(pid);
 let state={threads:{},loading:false,error:'',busy:[]},inflight=null,loadedAt=0,serial=0;const writes=new Map(),listeners=new Set();
 const publish=patch=>{state={...state,...patch};listeners.forEach(fn=>fn(state));};
 const store={get:()=>state,subscribe:fn=>{listeners.add(fn);return()=>listeners.delete(fn)},load:async(force=false)=>{
  if(inflight)return inflight;if(!force&&loadedAt&&Date.now()-loadedAt<60000)return state;
  const started=serial;publish({loading:true,error:''});inflight=Promise.resolve().then(()=>request('momDiscussion',{projectId:pid,action:'list'},'POST',90000)).then(result=>{loadedAt=Date.now();publish({threads:{...Object.fromEntries((result.threads||[]).map(t=>[t.momTaskId,t])),...Object.fromEntries(Object.entries(state.threads).filter(([id])=>(writes.get(id)||0)>started))},error:''});return state;}).catch(error=>{publish({error:error.message});throw error;}).finally(()=>{inflight=null;publish({loading:false})});return inflight;
 },save:async(taskId,payload)=>{
  if(state.busy.includes(taskId))throw Error('A discussion update is already saving.');publish({busy:[...state.busy,taskId],error:''});
  try{const result=await request('momDiscussion',{...payload,projectId:pid,momTaskId:taskId},'POST',90000);writes.set(taskId,++serial);publish({threads:{...state.threads,[taskId]:result}});return result;}finally{publish({busy:state.busy.filter(id=>id!==taskId)})}
 }};projects.set(pid,store);return store;
}
