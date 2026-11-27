import {createHash} from 'node:crypto';
import {db} from './supabase-db.js';
import {createDriveAttachments,projectsDriveRoot} from './drive-attachments.js';
import {previewProjectFolder} from './drawing-publishing.js';
import {requireProject} from './permissions.js';
import {actor,failure,projectRow,text} from './project-write-storage.js';

const drive=createDriveAttachments();
function identifier(value,label) {
  const id=String(value||'');
  if (!/^[a-zA-Z0-9_-]{1,100}$/.test(id)) throw failure('Invalid '+label+'.');
  return id;
}
function jpeg(value) {
  if (typeof value!=='string'||value.length>1400000||!/^[A-Za-z0-9+/]+={0,2}$/.test(value)) throw failure('Use a JPEG picture smaller than 1 MB after resizing.');
  const bytes=Buffer.from(value,'base64');
  if (bytes.length>1050000||bytes.length<4||bytes[0]!==255||bytes[1]!==216||
      bytes.toString('base64').replace(/=+$/,'')!==value.replace(/=+$/,'')) throw failure('Invalid JPEG picture.');
  return bytes;
}
const driveUrl=file=>file.webViewLink||'https://drive.google.com/file/d/'+encodeURIComponent(file.id)+'/view';
export async function uploadMomPointPhoto(p,{user,database=db,files=drive,env=process.env}) {
  const projectId=text(p.projectId),planId=text(p.visitPlanId);
  requireProject(user,projectId,{write:true,admin:true});
  if (!planId) throw failure('Choose a visit plan.');
  const visitId=identifier(p.visitId,'visit'),pointId=identifier(p.pointId,'point'),photoId=identifier(p.photoId,'picture');
  const caption=String(p.caption||'');
  if (caption.length>1000) throw failure('Picture notes exceed 1,000 characters.');
  if (typeof p.marked!=='boolean') throw failure('Invalid picture markup state.');
  const bytes=jpeg(p.base64),original=p.marked?jpeg(p.originalBase64):null;
  const hash=createHash('sha256').update(JSON.stringify([p.base64,p.originalBase64||'',...(caption?[caption]:[])])).digest('hex');
  const key=[projectId,visitId,pointId,photoId].join('|'),uploaded=[];
  try {
    return await database.transaction(async tx=>{
      const project=await projectRow(tx,projectId);
      if (!project) throw failure('Project not found.',404);
      const plans=await tx.rows("SELECT cells FROM enlighten_operational.execution_visits WHERE cells->>'projectId'=$1 AND cells->>'visitPlanId'=$2 LIMIT 2",[projectId,planId]);
      if (plans.length!==1||String(plans[0].cells.active).toLowerCase()==='false') throw failure('Visit plan not found for this project.',404);
      const [prior]=await tx.rows('SELECT photo,content_hash,visit_plan_id FROM enlighten_operational.mom_point_photos WHERE photo_key=$1',[key]);
      if (prior) {
        if (prior.content_hash!==hash||prior.visit_plan_id!==planId) throw failure('Picture changed; add it again before saving.',409);
        return prior.photo;
      }
      const linked=project.cells.driveFolderId;
      const root=linked?await previewProjectFolder(project.cells,files,env):projectsDriveRoot(env);
      const folder=await files.getOrCreateFolder(root,linked?'MOM Pictures':'MOM Pictures - '+(project.cells.projectNo||projectId));
      const base=String(p.name||'MOM picture').replace(/[\x00-\x1f/\\]/g,'_').replace(/\.jpe?g$/i,'').slice(0,100);
      if (original) uploaded.push(await files.upload(folder,{name:base+' - original.jpg',mimeType:'image/jpeg',bytes:original}));
      const file=await files.upload(folder,{name:base+(original?' - marked':'')+'.jpg',mimeType:'image/jpeg',bytes});
      uploaded.push(file);
      const originalFile=original?uploaded[0]:file,photo={fileId:file.id,name:base+'.jpg',caption,
        url:'https://drive.google.com/thumbnail?id='+encodeURIComponent(file.id)+'&sz=w1200',viewUrl:driveUrl(file),
        marked:Boolean(original),originalFileId:originalFile.id,originalUrl:driveUrl(originalFile)};
      await tx.query(`INSERT INTO enlighten_operational.mom_point_photos
        (photo_key,project_id,visit_plan_id,visit_id,point_id,content_hash,photo,created_by) VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb,$8)`,
        [key,projectId,planId,visitId,pointId,hash,JSON.stringify(photo),actor(user)]);
      return photo;
    });
  } catch(error) {
    await Promise.allSettled(uploaded.map(file=>files.trash(file.id)));
    throw error;
  }
}
