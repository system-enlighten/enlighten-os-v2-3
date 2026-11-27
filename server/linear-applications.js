import {db} from './supabase-db.js';
import {requireAdmin,requireStudio} from './permissions.js';

const linkFields = 'application_id AS "applicationId",reference_key AS "referenceKey",fitting_id AS "fittingId",product_id AS "productId"';
const emptyLayout = () => ({version:0,deleted:[],references:{},images:{},order:[],customApplications:[],variantIcons:{},variantCodes:{}});
const invalid = message => Object.assign(new Error(message), {statusCode:400});
const staleLayout = () => Object.assign(new Error('Application layout changed. Refresh before saving.'), {statusCode:409});

function identifier(value, field) {
  if (typeof value!=='string' || !value.trim() || value.length>200 || /[\u0000-\u001f]/.test(value)) throw invalid('Invalid '+field+'.');
  if (['__proto__','prototype','constructor'].includes(value)) throw invalid('Invalid '+field+'.');
  return value;
}

function identifiers(value, field) {
  if (!Array.isArray(value) || value.length>5000) throw invalid('Invalid '+field+'.');
  return [...new Set(value.map(id=>identifier(id,field)))];
}

function entries(value, field) {
  if (!value || typeof value!=='object' || Array.isArray(value) || Object.keys(value).length>5000) throw invalid('Invalid '+field+'.');
  return Object.entries(value);
}

function imageUrl(url) {
  if (typeof url!=='string' || url.length>2000 || !/^https:\/\/[^\s]+$/i.test(url)) throw invalid('Use an HTTPS reference image URL.');
  return url;
}

function variants(value, field, validate) {
  return Object.fromEntries(entries(value??{},field).map(([id,slots])=>[
    identifier(id,'application'),
    Object.fromEntries(entries(slots,field).map(([slot,item])=>[identifier(slot,'variant slot'),validate(item)]))
  ]));
}

export function validateLayout(payload) {
  const deleted = identifiers(payload.deleted,'deleted applications');
  const references = Object.fromEntries(entries(payload.references,'application references').map(([key,ids])=>{
    const destinations = identifiers(ids,'reference destinations');
    if (!destinations.some(id=>!deleted.includes(id))) throw invalid('Move references to another application before deleting their rows.');
    return [identifier(key,'reference'),destinations];
  }));
  const images = Object.fromEntries(entries(payload.images ?? {},'reference images').map(([key,url])=>[identifier(key,'reference'),imageUrl(url)]));
  const variantIcons=variants(payload.variantIcons,'variant icons',imageUrl);
  const variantCodes=variants(payload.variantCodes,'variant codes',code=>identifier(code,'variant code'));
  const order=identifiers(payload.order??[],'application order');
  const custom=payload.customApplications??[];
  if (!Array.isArray(custom)||custom.length>500) throw invalid('Invalid custom applications.');
  const customApplications=custom.map(item=>({
    id:identifier(item?.id,'custom application'),
    caption:identifier(item?.caption,'custom application caption'),
    code:identifier(item?.code,'custom application code'),
    url:imageUrl(item?.url)
  }));
  if (new Set(customApplications.map(row=>row.id)).size!==customApplications.length) throw invalid('Duplicate custom application.');
  return {deleted,references,images,order,customApplications,variantIcons,variantCodes};
}

export async function getLinearApplicationLayout(_payload, {user,database=db}) {
  requireStudio(user);
  const row = await database.one('SELECT layout,version FROM enlighten_operational.linear_application_layout WHERE singleton');
  return row ? {...emptyLayout(),...row.layout,version:row.version} : emptyLayout();
}

export async function saveLinearApplicationLayout(payload, {user,database=db}) {
  requireAdmin(user);
  const {expectedVersion} = payload;
  if (!Number.isInteger(expectedVersion) || expectedVersion<0 || expectedVersion>=2147483647) throw invalid('Invalid application layout version.');
  const layout = validateLayout(payload);
  const values = [JSON.stringify(layout),user.email,expectedVersion];
  const row = expectedVersion===0
    ? await database.one(`INSERT INTO enlighten_operational.linear_application_layout (singleton,version,layout,updated_by)
        VALUES (true,1,$1::jsonb,$2) ON CONFLICT (singleton) DO NOTHING RETURNING version`, values.slice(0,2))
    : await database.one(`UPDATE enlighten_operational.linear_application_layout
        SET layout=$1::jsonb,updated_by=$2,version=version+1,updated_at=clock_timestamp()
        WHERE singleton AND version=$3 RETURNING version`, values);
  if (!row) throw staleLayout();
  return {...layout,version:row.version};
}

export async function listLinearProductLinks(_payload, {user,database=db}) {
  requireStudio(user);
  return database.rows(`SELECT ${linkFields} FROM enlighten_operational.linear_product_links ORDER BY application_id,reference_key`);
}

export async function getLinearApplicationCaptions(_payload,{user,database=db}) {
  requireStudio(user);
  return database.rows('SELECT application_id AS "applicationId",caption,code FROM enlighten_operational.linear_application_captions ORDER BY application_id');
}

export async function saveLinearApplicationCaption(payload,{user,database=db}) {
  requireAdmin(user);
  const applicationId=identifier(payload.applicationId,'application');
  const {caption,expectedCaption,code,expectedCode}=payload;
  if (typeof caption!=='string'||caption.trim().length>200||typeof expectedCaption!=='string'||
      (code!==undefined&&(typeof code!=='string'||code.trim().length>200||typeof expectedCode!=='string'))) {
    throw invalid('Enter a valid application caption and code.');
  }
  return database.transaction(async tx=>{
    await tx.query('SELECT pg_advisory_xact_lock(hashtextextended($1,0))',['linear-caption:'+applicationId]);
    const [prior]=await tx.rows('SELECT caption,code FROM enlighten_operational.linear_application_captions WHERE application_id=$1 FOR UPDATE',[applicationId]);
    if ((prior?.caption||'')!==expectedCaption || (code!==undefined&&(prior?.code||'')!==expectedCode)) {
      throw Object.assign(new Error('Caption or code changed. Refresh before editing again.'),{statusCode:409});
    }
    const [saved]=await tx.rows(`INSERT INTO enlighten_operational.linear_application_captions (application_id,caption,code,updated_by)
      VALUES ($1,$2,$3,$4) ON CONFLICT (application_id) DO UPDATE
      SET caption=excluded.caption,code=excluded.code,updated_by=excluded.updated_by,updated_at=clock_timestamp()
      RETURNING application_id AS "applicationId",caption,code`,
    [applicationId,caption.trim(),code?.trim()??prior?.code??'',user.email]);
    return saved;
  });
}

export async function saveLinearProductLink(payload, {user,database=db}) {
  requireAdmin(user);
  const applicationId=identifier(payload.applicationId,'application');
  const referenceKey=identifier(payload.referenceKey,'reference key');
  const fittingId=identifier(payload.fittingId,'fitting');
  const productId=identifier(payload.productId,'product');
  return database.transaction(async tx=>{
    const fittings=await tx.rows("SELECT cells FROM enlighten_operational.technical_fittings WHERE cells->>'fittingId'=$1 LIMIT 2 FOR SHARE",[fittingId]);
    if (fittings.length!==1) throw invalid('Fitting type is unavailable.');
    const source=fittings[0].cells.dataJson;
    const fitting=typeof source==='string'?JSON.parse(source):source;
    if (!fitting || fitting.deleted || !fitting.products?.some(product=>String(product.id)===productId && !product.deleted)) throw invalid('Product is unavailable for this fitting type.');
    const [link]=await tx.rows(`INSERT INTO enlighten_operational.linear_product_links
      (application_id,reference_key,fitting_id,product_id,updated_by) VALUES ($1,$2,$3,$4,$5)
      ON CONFLICT (application_id,reference_key) DO UPDATE SET
      fitting_id=excluded.fitting_id,product_id=excluded.product_id,updated_by=excluded.updated_by,updated_at=clock_timestamp()
      RETURNING ${linkFields}`,[applicationId,referenceKey,fittingId,productId,user.email]);
    return link;
  });
}
