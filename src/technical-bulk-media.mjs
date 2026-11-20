export function applyCircuitMedia(data,ids,kind,media){
 if(!['reference','image3d','fixture'].includes(kind))throw Error('Invalid image field.');
 const overrides=structuredClone(data.overrides||{});
 for(const id of new Set(ids))overrides[id]={...overrides[id],[kind]:media?structuredClone(media):null};
 return {...data,overrides};
}
