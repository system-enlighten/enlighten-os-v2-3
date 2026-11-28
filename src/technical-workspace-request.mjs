const cachedActions=new Set([
 'getTechnicalDocumentation','getProductAssessment','listFloorZones',
 'listTechnicalFittings','getTechnicalProjectImage',
]);
const savedReads={
 saveTechnicalDocumentation:'getTechnicalDocumentation',
 saveProductAssessment:'getProductAssessment',
};

export function createTechnicalWorkspaceRequest(send){
 const cache=new Map(),refreshes=new Map();
 const keyFor=(action,payload)=>JSON.stringify([action,payload.projectId??'',payload.fileId??'']);
 const workspaceRequest=(action,payload={},...rest)=>{
  if(cachedActions.has(action)){
   const key=keyFor(action,payload);
   if(!cache.has(key)){
    const pending=send(action,payload,...rest).catch(error=>{
     if(cache.get(key)===pending)cache.delete(key);
     throw error;
    });
    cache.set(key,pending);
   }
   return cache.get(key);
  }
  return send(action,payload,...rest).then(result=>{
   const read=savedReads[action];
   if(read)cache.set(keyFor(read,payload),Promise.resolve(result));
   if(action==='saveTechnicalDocumentation')workspaceRequest.invalidate('getProductAssessment',payload);
   if(action==='saveTechnicalFitting')workspaceRequest.invalidate('listTechnicalFittings');
   if(['importTechnicalOutput','saveTechnicalWorkbook','createTechnicalWorkbook','copyTechnicalProjectWorkbook'].includes(action)){
    workspaceRequest.invalidate('getTechnicalDocumentation',payload);
   }
   return result;
  });
 };
 workspaceRequest.invalidate=(action,payload)=>{
  if(payload)cache.delete(keyFor(action,payload));
  else for(const key of cache.keys())if(JSON.parse(key)[0]===action)cache.delete(key);
 };
 workspaceRequest.revalidate=(action,payload,...rest)=>{
  const key=keyFor(action,payload);
  if(refreshes.has(key))return refreshes.get(key);
  const original=cache.get(key);
  const pending=send(action,payload,...rest).then(result=>{
   if(cache.get(key)!==original)return cache.get(key)??result;
   cache.set(key,Promise.resolve(result));
   return result;
  }).finally(()=>refreshes.delete(key));
  refreshes.set(key,pending);
  return pending;
 };
 workspaceRequest.fresh=(action,payload,...rest)=>{
  workspaceRequest.invalidate(action,payload);
  return workspaceRequest(action,payload,...rest);
 };
 return workspaceRequest;
}
