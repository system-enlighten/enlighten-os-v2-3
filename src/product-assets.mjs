let requestAsset=null;
const pending=new Map();
export function configureProductAssets(request){requestAsset=request;}
export function resolveProductAsset(url){
 if(!url)return Promise.resolve('');
 const match=String(url).match(/^https:\/\/drive\.google\.com\/thumbnail\?id=([A-Za-z0-9_-]+)(?:&|$)/);
 if(!match||!requestAsset)return Promise.resolve(url);
 if(!pending.has(url)){const promise=requestAsset('getTechnicalProductAsset',{fileId:match[1]},'POST',90000).then(r=>{if(!r?.url?.startsWith('data:image/'))throw Error('Product image unavailable');return r.url;}).catch(e=>{pending.delete(url);throw e;});pending.set(url,promise);}
 return pending.get(url);
}
