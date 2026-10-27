import {createHmac} from 'node:crypto';
const APS='https://developer.api.autodesk.com';
let internal;
function config(){const id=process.env.APS_CLIENT_ID,secret=process.env.APS_CLIENT_SECRET,bucket=process.env.APS_BUCKET;if(!id||!secret||!bucket)throw Error('CAD preview setup required: add APS_CLIENT_ID, APS_CLIENT_SECRET and APS_BUCKET in Vercel, then redeploy.');if(!/^[a-z0-9_-]{3,128}$/.test(bucket))throw Error('APS_BUCKET must be a globally unique lowercase bucket name (3–128 letters, numbers, underscores or dashes).');return {id,secret,bucket};}
async function jsonRequest(path,{token,method='GET',body,allowed=[]}={}){const response=await fetch(APS+path,{method,headers:{...(token?{Authorization:'Bearer '+token}:{}),...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(90000)});const data=await response.json().catch(()=>({}));if(!response.ok&&!allowed.includes(response.status))throw Error('Autodesk '+response.status+': '+String(data.developerMessage||data.reason||data.error_description||'CAD service request failed.').slice(0,200));return {status:response.status,data};}
async function token(scope){const {id,secret}=config();if(scope==='internal'&&internal?.until>Date.now()+60000)return internal.value;const response=await fetch(APS+'/authentication/v2/token',{method:'POST',headers:{Authorization:'Basic '+Buffer.from(id+':'+secret).toString('base64'),'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({grant_type:'client_credentials',scope:scope==='internal'?'data:read data:create data:write bucket:create bucket:read':scope}),signal:AbortSignal.timeout(30000)});const data=await response.json();if(!response.ok||!data.access_token)throw Error('Autodesk authentication failed. Check APS credentials and API access.');if(scope==='internal')internal={value:data.access_token,until:Date.now()+Number(data.expires_in)*1000};return data;}
function model(source){const {secret,bucket}=config(),extension=source.fileName.split('.').pop().toLowerCase();const key=createHmac('sha256',secret).update(JSON.stringify([source.projectId,source.driveFileId,source.modified,source.size])).digest('hex')+'.'+extension;const raw='urn:adsk.objects:os.object:'+bucket+'/'+key;return {bucket,key,raw,urn:Buffer.from(raw).toString('base64').replace(/=/g,'')};}
function state(manifest){const s=manifest.status;if(s==='success')return 'ready';if(s==='failed'||s==='timeout')return 'failed';return 'processing';}
// This reader runs only on Vercel. The Drive credential never enters a browser response.
export function createCadDriveReader(source,accessToken){
 if(!accessToken||!source.driveFileId||!Number.isSafeInteger(source.size)||source.size<1||source.size>100*1024*1024)throw Error('Invalid CAD transfer authorization.');
 let full;
 return async(offset,length)=>{
  if(!Number.isInteger(offset)||!Number.isInteger(length)||offset<0||length<1||offset+length>source.size)throw Error('Invalid CAD transfer range.');
  if(full)return full.subarray(offset,offset+length);
  let response;
  try{response=await fetch('https://www.googleapis.com/drive/v3/files/'+encodeURIComponent(source.driveFileId)+'?alt=media&supportsAllDrives=true',{headers:{Authorization:'Bearer '+accessToken,Range:`bytes=${offset}-${offset+length-1}`},redirect:'error',signal:AbortSignal.timeout(90000)});}catch{throw Error('The server could not download this CAD file from Google Drive. Retry preparation.');}
  if(response.status===401||response.status===403)throw Error('Google Drive denied the CAD download. Confirm the Apps Script deployment owner can download this file and Google Drive API is enabled.');
  if(response.status===404)throw Error('The original CAD file was not found or is inaccessible to the deployment owner.');
  if(response.status!==200&&response.status!==206)throw Error('Google Drive returned HTTP '+response.status+' during CAD transfer. Retry preparation.');
  const limit=response.status===200?source.size:length,chunks=[];let count=0;
  if(Number(response.headers.get('content-length')||0)>limit)throw Error('Google Drive returned an unexpected CAD file size. Refresh and retry.');
  for await(const chunk of response.body){count+=chunk.length;if(count>limit)throw Error('Google Drive returned an unexpected CAD file size. Refresh and retry.');chunks.push(Buffer.from(chunk));}
  const bytes=Buffer.concat(chunks);
  if(response.status===200){if(bytes.length!==source.size)throw Error('The CAD download was incomplete. Retry preparation.');full=bytes;return bytes.subarray(offset,offset+length);}
  if(bytes.length!==length||response.headers.get('content-range')!==`bytes ${offset}-${offset+length-1}/${source.size}`)throw Error('The CAD download range was incomplete or changed. Refresh and retry.');
  return bytes;
 };
}
export async function runCadAction(action,payload,backend){
 const source=await backend('getCadSource',{projectId:payload.projectId,driveFileId:payload.driveFileId});
 const m=model(source),auth=await token('internal'),access=typeof auth==='string'?auth:auth.access_token;
 let manifest=await jsonRequest('/modelderivative/v2/designdata/'+m.urn+'/manifest',{token:access,allowed:[404]});
 if(manifest.status!==404){const status=state(manifest.data);if(status==='failed')return {status,message:'Autodesk could not process this file. Check the original drawing and any missing references, then upload a corrected version.'};if(status==='ready'){const viewer=await token('data:read:'+m.raw);return {status,urn:m.urn,accessToken:viewer.access_token,expiresIn:viewer.expires_in,fileName:source.fileName};}return {status,message:manifest.data.progress||'Autodesk is preparing the drawing…'};}
 if(action!=='cadPrepare')return {status:'not-prepared'};
 if(!source.canPrepare)throw Error('A project editor must prepare this drawing before it can be viewed.');
 await jsonRequest('/oss/v2/buckets',{method:'POST',token:access,body:{bucketKey:m.bucket,policyKey:'persistent'},allowed:[409]});
 const objectPath='/oss/v2/buckets/'+encodeURIComponent(m.bucket)+'/objects/'+encodeURIComponent(m.key);
 const existing=await jsonRequest(objectPath+'/details',{token:access,allowed:[404]});
 if(existing.status===404){
   const chunkSize=6*1024*1024,parts=Math.ceil(source.size/chunkSize);
   const signed=await jsonRequest(objectPath+'/signeds3upload?parts='+parts+'&minutesExpiration=30',{token:access});
   if(!signed.data.uploadKey||signed.data.urls?.length!==parts)throw Error('Autodesk did not return a complete upload session. Retry.');
   const transfer=await backend('getCadSourceTransfer',{projectId:source.projectId,driveFileId:source.driveFileId,modified:source.modified});
   if(transfer.driveFileId!==source.driveFileId||transfer.modified!==source.modified||Number(transfer.size)!==source.size)throw Error('Drawing changed before transfer. Refresh and retry.');
   const readDrive=createCadDriveReader(source,transfer.accessToken);
   for(let i=0;i<parts;i++){
     const url=new URL(signed.data.urls[i]);if(url.protocol!=='https:'||!url.hostname.endsWith('.amazonaws.com'))throw Error('Unexpected Autodesk storage URL.');
     const bytes=await readDrive(i*chunkSize,Math.min(chunkSize,source.size-i*chunkSize));if(bytes.length!==Math.min(chunkSize,source.size-i*chunkSize))throw Error('The drawing transfer was incomplete. Retry.');
     const uploaded=await fetch(url,{method:'PUT',redirect:'error',body:bytes,signal:AbortSignal.timeout(90000)});if(!uploaded.ok)throw Error('Autodesk upload failed. Retry preparation.');
   }
   await jsonRequest(objectPath+'/signeds3upload',{method:'POST',token:access,body:{uploadKey:signed.data.uploadKey}});
 }
 const current=await backend('getCadSource',{projectId:source.projectId,driveFileId:source.driveFileId});if(current.modified!==source.modified||current.size!==source.size)throw Error('Drawing changed during preparation. Refresh and retry.');
 await jsonRequest('/modelderivative/v2/designdata/job',{method:'POST',token:access,body:{input:{urn:m.urn},output:{formats:[{type:'svf2',views:['2d','3d']}]}}});
 return {status:'processing',message:'Drawing sent to Autodesk. Preparing the preview…'};
}
