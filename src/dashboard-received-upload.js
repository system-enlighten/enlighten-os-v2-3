export const dashboardReceivedKey=(floor,area,drawingType)=>JSON.stringify([String(floor),String(area),String(drawingType)]);
export function dashboardReceivedPlan(projectId,selections,file,date){
 if(!projectId||!selections.length)throw Error('Select at least one drawing type and area.');
 if(!file||!Number.isSafeInteger(file.size)||file.size<=0||file.size>100*1024*1024)throw Error('Choose a non-empty drawing file up to 100 MB.');
 if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||isNaN(Date.parse(date))||new Date(date).toISOString().slice(0,10)!==date)throw Error('Choose a valid received date.');
 const allowed=['Layout','False Ceiling','Detail','3D'],groups=new Map();
 for(const item of selections){if(!item.floor||!item.area||!allowed.includes(item.drawingType))throw Error('Invalid drawing selection.');const group=groups.get(item.drawingType)||[];if(!group.some(v=>v.floor===item.floor&&v.area===item.area))group.push({floor:item.floor,area:item.area});groups.set(item.drawingType,group);}
 const parts=[...groups].map(([drawingType,coverage])=>({drawingType,coverage,floors:[...new Set(coverage.map(v=>v.floor))]})),first=parts[0];
 return {parts,metadata:{projectId,drawingType:first.drawingType,floor:first.floors.join(', '),floors:first.floors,area:'',drawingParts:parts.map(({drawingType,floors})=>({drawingType,floors})),fileName:file.name,mimeType:file.type||'application/octet-stream',fileSize:file.size,fileLastModified:file.lastModified,receivedSentDate:date,notes:'Uploaded from Dashboard · Drawings Received'}};
}
export async function completeDashboardReceivedUpload(entry,file,services,onPhase=()=>{}){
 if(!entry.session){onPhase('Preparing Google Drive upload…');entry.session=await services.request('beginReceivedUpload',{...entry.plan.metadata,drawingId:entry.id},120000);}
 if(!entry.saved){if(entry.session.drawing)entry.saved=entry.session.drawing;else{onPhase('Uploading to Google Drive…');const receipt=await services.transfer(entry,file,n=>onPhase(`Uploading to Google Drive… ${n}%`));entry.completion=receipt;onPhase('Saving received register…');entry.saved=await services.request('finishReceivedUpload',{completionTicket:receipt.completionTicket},120000);}}
 const records=Array.isArray(entry.saved.parts)?entry.saved.parts:[entry.saved];
 entry.classified=entry.classified||new Set();
 for(const part of entry.plan.parts){if(entry.classified.has(part.drawingType))continue;const row=records.find(r=>services.typeKey(r.drawingType)===services.typeKey(part.drawingType));if(!row?.drawingId)throw Error(`The register did not return the ${part.drawingType} entry. Retry to check the saved upload.`);onPhase(`Tagging ${part.drawingType} areas and opening linked tasks…`);await services.classify({projectId:entry.plan.metadata.projectId,drawingId:row.drawingId,drawingType:part.drawingType,coverage:part.coverage});entry.classified.add(part.drawingType);}
 return entry.saved;
}
