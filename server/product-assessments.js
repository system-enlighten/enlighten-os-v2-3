import {randomUUID} from 'node:crypto';
import {db} from './supabase-db.js';
import {checkProjectRead,requireProject,requireStudio,visibleProjectIds} from './permissions.js';
import {getTechnicalProjectImage} from './drive-attachments.js';
import {decodeAssessment} from './product-assessment-format.js';
import {validateProductAssessment} from './product-assessment-rules.js';
import {actor,failure,now,text} from './project-write-storage.js';

async function stored(tx,meta) {
  const parts=await tx.rows('SELECT cells FROM enlighten_operational.product_assessment_chunks WHERE project_id=$1 AND version=$2',
    [meta.projectId,meta.version]);
  return decodeAssessment(meta,parts.map(row=>row.cells));
}

export async function getProductAssessment(p,{user,database=db}) {
  const projectId=text(p.projectId);
  return database.transaction(async tx=>{
    requireProject(user,projectId);
    await checkProjectRead(tx,user,projectId);
    const [meta]=await tx.rows('SELECT cells FROM enlighten_operational.product_assessments WHERE project_id=$1',[projectId]);
    return meta?{...await stored(tx,meta.cells),version:String(meta.cells.version),updatedAt:String(meta.cells.updatedAt)}:{groups:{},version:''};
  },{readOnly:true});
}

export async function saveProductAssessment(p,{user,database=db,verifyImage=getTechnicalProjectImage}) {
  const projectId=text(p.projectId);
  requireProject(user,projectId,{write:true,admin:true});
  let data;
  try {data=validateProductAssessment(p);} catch(error) {throw failure(error.message);}
  const json=JSON.stringify(data);
  if (json.length>600000) throw failure('Product Assessment exceeds 600 KB.');
  const photos=new Set(Object.values(data.groups).flatMap(group=>group.options.map(option=>option.photo?.driveFileId)).filter(Boolean));
  for (const fileId of photos) await verifyImage({projectId,fileId},{user,database});
  return database.transaction(async tx=>{
    await tx.query('SELECT pg_advisory_xact_lock(hashtextextended($1,0))',['product-assessment:'+projectId]);
    await checkProjectRead(tx,user,projectId);
    const [previous]=await tx.rows('SELECT cells FROM enlighten_operational.product_assessments WHERE project_id=$1 FOR UPDATE',[projectId]);
    if (String(previous?.cells.version||'')!==String(p.expectedVersion||'')) throw failure('Another person updated Product Assessment. Reload before saving.',409);
    const version=randomUUID(),encoded=Buffer.from(json).toString('base64'),chunks=encoded.match(/.{1,28000}/g);
    const meta={projectId,version,chunkCount:chunks.length,updatedAt:now(),updatedBy:actor(user)};
    await tx.query('INSERT INTO enlighten_operational.product_assessments (project_id,cells) VALUES ($1,$2::jsonb) ON CONFLICT (project_id) DO UPDATE SET cells=excluded.cells',
      [projectId,JSON.stringify(meta)]);
    const parts=chunks.map((base64,chunkIndex)=>({projectId,version,chunkIndex,chunkKey:[projectId,version,chunkIndex].join('|'),base64}));
    await tx.query(`INSERT INTO enlighten_operational.product_assessment_chunks (project_id,version,chunk_index,cells)
      SELECT $1,$2,(value->>'chunkIndex')::integer,value FROM jsonb_array_elements($3::jsonb)`,[projectId,version,JSON.stringify(parts)]);
    return {...data,version,updatedAt:meta.updatedAt};
  });
}

function catalogId(fittingId,productId) {
  let hash=2166136261;
  for (const char of fittingId+'|'+productId) hash=Math.imul(hash^char.charCodeAt(0),16777619);
  return 'catalog-'+(hash>>>0).toString(36);
}
const normalize=value=>text(value).toUpperCase().replace(/\s+/g,'');

export async function listProductAssessmentReviews(p,{user,database=db}) {
  requireStudio(user);
  const fittingId=text(p.fittingId);
  if (!fittingId) throw failure('Choose a fitting.');
  const ids=visibleProjectIds(user);
  return database.transaction(async tx=>{
    const [entry]=await tx.rows("SELECT cells FROM enlighten_operational.technical_fittings WHERE cells->>'fittingId'=$1 LIMIT 1",[fittingId]);
    const fitting=entry?JSON.parse(entry.cells.dataJson):null;
    if (!fitting||fitting.deleted||!fitting.products?.length) return [];
    const products=new Map(fitting.products.map(product=>[catalogId(fitting.id,product.id),product]));
    const rows=await tx.rows(`SELECT a.cells,p.cells AS project FROM enlighten_operational.product_assessments a
      JOIN enlighten_operational.projects p ON p.cells->>'projectId'=a.project_id
      WHERE ($1::text[] IS NULL OR a.project_id=ANY($1)) ORDER BY a.cells->>'updatedAt' DESC`,[ids]);
    const reviews=[];
    for (const {cells,project} of rows) {
      const data=await stored(tx,cells);
      const projectName=[project.projectNo,project.projectName].filter(Boolean).join(' \u00b7 ');
      for (const [key,group] of Object.entries(data.groups)) {
        const fittingCode=key.slice(0,key.lastIndexOf('|'));
        for (const option of group.options||[]) {
          let product=products.get(option.id);
          if (!product&&!String(option.id).startsWith('catalog-')&&normalize(fittingCode)===normalize(fitting.fittingType)) {
            const matching=fitting.products.filter(item=>normalize(item.brand)===normalize(option.brand)&&normalize(item.specs?.article||item.model)===normalize(option.article));
            if (matching.length===1) product=matching[0];
          }
          if (!product) continue;
          const remarks=text(option.remarks),customization=text(option.review?.customization),ratings=option.ratings||[];
          if (remarks||customization||ratings.some(Boolean)) reviews.push({productId:product.id,project:projectName,fittingCode,remarks,customization,
            area:option.review?.area||'',ratings});
        }
      }
    }
    return reviews;
  },{readOnly:true});
}
