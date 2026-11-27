import {db} from './supabase-db.js';
import {checkProjectRead,requireAdmin,requireProject,requireStudio} from './permissions.js';
import {buildTechnicalFitting} from './technical-fitting-rules.js';

const failure=(message,statusCode=400)=>Object.assign(new Error(message),{statusCode});
const fittingSql='SELECT record_id,cells FROM enlighten_operational.technical_fittings';
const codeKey=value=>String(value||'').trim().toUpperCase().replace(/\s+/g,'');
const text=(value,limit)=>String(value??'').trim().slice(0,limit);

async function persistCatalogRow(tx,table,prior,record) {
  if (prior) {
    await tx.query(`UPDATE enlighten_operational.${table} SET cells=cells||$1::jsonb,updated_at=clock_timestamp()
      WHERE record_id=$2::bigint`,[JSON.stringify(record),prior.record_id]);
  } else {
    await tx.query(`INSERT INTO enlighten_operational.${table} (cells) VALUES ($1::jsonb)`,[JSON.stringify(record)]);
  }
}

async function fittingForUpdate(tx,id) {
  const rows=await tx.rows(fittingSql+" WHERE cells->>'fittingId'=$1 LIMIT 2 FOR UPDATE",[id]);
  if (rows.length>1) throw failure('Repair duplicate records for this fitting type.',409);
  return rows[0];
}

function nextVersion(prior) {
  const last=Date.parse(prior?.cells.updatedAt);
  return new Date(Math.max(Date.now(),Number.isFinite(last)?last+1:0)).toISOString();
}

export async function saveTechnicalFitting(payload,{user,database=db}) {
  const projectId=String(payload.projectId||'');
  if (projectId) requireProject(user,projectId,{write:true,admin:true});
  else requireAdmin(user);
  let fitting;
  try { fitting=buildTechnicalFitting(payload.fitting); }
  catch (error) { throw failure(error.message); }
  return database.transaction(async tx=>{
    await checkProjectRead(tx,user,projectId);
    await tx.query('LOCK TABLE enlighten_operational.technical_fittings IN SHARE ROW EXCLUSIVE MODE');
    const prior=await fittingForUpdate(tx,fitting.id);
    if (prior && JSON.parse(prior.cells.dataJson).deleted) throw failure('This fitting type was deleted. Refresh Product Database.',409);
    if (payload.expectedCatalogVersion!==undefined&&String(prior?.cells.updatedAt||'')!==String(payload.expectedCatalogVersion||'')) {
      throw failure('Another admin updated this product type. Close and refresh before saving.',409);
    }
    const linked=await tx.rows('SELECT product_id FROM enlighten_operational.linear_product_links WHERE fitting_id=$1',[fitting.id]);
    if (linked.some(link=>!fitting.products.some(product=>product.id===link.product_id))) {
      throw failure('Move the linked linear application reference before removing this product.',409);
    }
    const catalogVersion=nextVersion(prior);
    await persistCatalogRow(tx,'technical_fittings',prior,{fittingId:fitting.id,dataJson:JSON.stringify(fitting),updatedAt:catalogVersion,updatedBy:user.name||user.email});
    return {...fitting,catalogVersion};
  });
}

export async function deleteTechnicalFitting(payload,{user,database=db}) {
  requireAdmin(user);
  const id=text(payload.fittingId,100);
  if (!id) throw failure('Choose a fitting type.');
  return database.transaction(async tx=>{
    await tx.query('LOCK TABLE enlighten_operational.technical_fittings IN SHARE ROW EXCLUSIVE MODE');
    const prior=await fittingForUpdate(tx,id);
    if (String(prior?.cells.updatedAt||'')!==String(payload.expectedCatalogVersion||'')) {
      throw failure('This fitting type changed. Close and refresh before deleting.',409);
    }
    const current=prior?JSON.parse(prior.cells.dataJson):null;
    if (current?.deleted) throw failure('This fitting type was already deleted.',409);
    const fittingType=current?.fittingType||text(payload.fittingType,500);
    if (!fittingType) throw failure('Enter a fitting type code.');
    const all=await tx.rows(fittingSql);
    const referenced=await tx.rows('SELECT 1 FROM enlighten_operational.linear_product_links WHERE fitting_id=$1 LIMIT 1',[id]);
    if (referenced.length||current?.products?.length||all.map(row=>JSON.parse(row.cells.dataJson))
        .some(fitting=>!fitting.deleted&&codeKey(fitting.fittingType)===codeKey(fittingType)&&fitting.products?.length)) {
      throw failure('Remove the linked manufacturer products before deleting this fitting type.',409);
    }
    const fitting={id,fittingType,deleted:true};
    if (current?.cataloguePlacement) fitting.cataloguePlacement=current.cataloguePlacement;
    const catalogVersion=nextVersion(prior);
    await persistCatalogRow(tx,'technical_fittings',prior,{fittingId:id,dataJson:JSON.stringify(fitting),updatedAt:catalogVersion,updatedBy:user.name||user.email});
    return {...fitting,catalogVersion};
  });
}

export async function listApplicationImages(_payload,{user,database=db}) {
  requireStudio(user);
  const rows=await database.rows('SELECT cells FROM enlighten_operational.application_images ORDER BY source_row_number NULLS LAST,record_id');
  return rows.map(row=>row.cells);
}

export async function saveApplicationImage(payload,{user,database=db}) {
  requireAdmin(user);
  const input=payload.record||{};
  const record={id:text(input.id,100),title:text(input.title,200),category:text(input.category,2000),
    fittingType:text(input.fittingType,100),imageUrl:String(input.imageUrl||'').trim(),notes:text(input.notes,2000),updatedAt:new Date().toISOString()};
  if (!record.id||!record.title||!record.imageUrl) throw failure('Enter application name and image URL.');
  if (record.imageUrl.length>2000||!(/^(?:https:\/\/[^\s]+|\/(?:technical-library|application-library)\/[\w.-]+)$/.test(record.imageUrl))) {
    throw failure('Use an HTTPS asset URL.');
  }
  return database.transaction(async tx=>{
    await tx.query('LOCK TABLE enlighten_operational.application_images IN SHARE ROW EXCLUSIVE MODE');
    const rows=await tx.rows("SELECT record_id FROM enlighten_operational.application_images WHERE cells->>'id'=$1 LIMIT 2 FOR UPDATE",[record.id]);
    if (rows.length>1) throw failure('Repair duplicate application image IDs.',409);
    await persistCatalogRow(tx,'application_images',rows[0],record);
    return record;
  });
}
