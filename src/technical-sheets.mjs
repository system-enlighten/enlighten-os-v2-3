import{buildColumnTable,technicalZoneSections}from'./technical-column-logic.mjs';
export const sheetHeaders=['Zone','CN','FIXTURE','TYPE','APPLICATION','3D','REFERENCE','OBJECT | SIZE','CMF','HEIGHT/DISTANCE','ILLUMINANCE','QUANTITY','CATEGORY'];
export const sheetWidths=[260,121,158,305,436,295,295,270,270,193,219,219,200];
export function technicalSheetModel(data,zones,products){
 const computed=buildColumnTable(data,zones,products),groups=technicalZoneSections(computed.rows),rows=[{kind:'header',values:sheetHeaders,height:102}],merges=[],images=[];
 const addImage=(media,row,column,kind,cn)=>{if(!media?.url)return;images.push({key:`image-${row}-${column}`,row,column,width:sheetWidths[column-1]-12,height:168,kind,cn,media});};
 groups.forEach((group,index)=>{if(index)rows.push({kind:'divider',values:Array(13).fill(''),height:24});const start=rows.length+1;merges.push({row:start,column:1,rowSpan:group.rowSpan,colSpan:1});
  group.sections.forEach((section,si)=>{const values=Array(13).fill('');if(si===0)values[0]=group.label;values[1]=section.label;rows.push({kind:'category',values,height:35});merges.push({row:rows.length,column:2,rowSpan:1,colSpan:12});
   section.rows.forEach(r=>{rows.push({kind:'data',height:180,values:['',r.cn,'',r.code,r.application,'','',r.object,r.cmf,r.height,r.illuminance,r.quantity,r.lighting]});const number=rows.length;addImage(r.override.fixture||{url:r.icon},number,3,'fixture',r.cn);addImage(r.override.image3d,number,6,'image3d',r.cn);addImage(r.override.reference,number,7,'reference',r.cn);});
 });
 });
 return {rows,merges,images,widths:sheetWidths,warnings:computed.warnings};
}
export async function rasterizeTechnicalImage(asset,request,projectId,iconMap={}){
 const media=asset.media;let url=iconMap[media.url]||media.url;if(media.driveFileId)url=(await request('getTechnicalProjectImage',{projectId,fileId:media.driveFileId},'POST',90000)).url;
 const image=await new Promise((resolve,reject)=>{const img=new Image();img.crossOrigin='anonymous';img.onload=()=>resolve(img);img.onerror=()=>reject(Error(`Image for ${asset.cn} (${asset.kind}) could not be loaded. Check or replace that image before exporting.`));img.src=url;});
 const canvas=document.createElement('canvas');canvas.width=asset.width;canvas.height=asset.height;const ctx=canvas.getContext('2d');if(!ctx)throw Error('Image canvas is unavailable.');
 const contain=asset.kind==='fixture',base=contain?Math.min(canvas.width/image.naturalWidth,canvas.height/image.naturalHeight):Math.max(canvas.width/image.naturalWidth,canvas.height/image.naturalHeight),zoom=contain?1:Number(media.zoom||1),w=image.naturalWidth*base*zoom,h=image.naturalHeight*base*zoom,x=contain?0.5:Number(media.x??50)/100,y=contain?0.5:Number(media.y??50)/100;
 ctx.drawImage(image,(canvas.width-w)*x,(canvas.height-h)*y,w,h);let base64;try{base64=canvas.toDataURL('image/png').split(',')[1]}catch{throw Error(`Image for ${asset.cn} (${asset.kind}) blocks export. Use an uploaded project image or a Product/Application Database image.`)}
 if(base64.length>2500000)throw Error(`Image for ${asset.cn} is too large to embed.`);return {key:asset.key,base64};
}
