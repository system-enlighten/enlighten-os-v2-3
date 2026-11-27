import {randomUUID} from 'node:crypto';
import {db} from './supabase-db.js';
import {isSystemAdmin,requireStudio,visibleProjectIds} from './permissions.js';
import {active,failure,text} from './project-write-storage.js';
import {buildMarketingDetails,updateEnquiry} from './marketing-rules.js';

function access(user,department,write=false) {
  requireStudio(user);
  if (!isSystemAdmin(user)&&user.departmentKey!==department) throw failure(department+' department access required.',403);
  if (write&&/^viewer$/i.test(user.appAccess)) throw failure('View only access.',403);
}

async function directory(tx,user) {
  const ids=visibleProjectIds(user);
  const projects=(await tx.rows("SELECT cells FROM enlighten_operational.projects WHERE ($1::text[] IS NULL OR cells->>'projectId'=ANY($1)) ORDER BY source_row_number NULLS LAST,record_id",[ids]))
    .map(row=>row.cells).map(row=>({id:String(row.projectId),number:row.projectNo,name:row.projectName}));
  const contacts=(await tx.rows("SELECT cells FROM enlighten_operational.project_contacts WHERE ($1::text[] IS NULL OR cells->>'projectId'=ANY($1)) ORDER BY source_row_number NULLS LAST,record_id",[ids]))
    .map(row=>row.cells).filter(row=>active(row.active)).map(row=>({id:String(row.contactId),name:row.name,role:row.role}));
  return {projects,contacts};
}
const table='enlighten_operational.marketing_records';
async function workspace(_p,{user,database=db},sales) {
  access(user,sales?'sales':'marketing');
  return database.transaction(async tx=>{
    const refs=await directory(tx,user);
    const rows=await tx.rows('SELECT id,kind,details,version FROM '+table+' ORDER BY id');
    const records=rows.map(({id,kind,details,version})=>{
      if (!sales||kind==='Enquiry') return {...details,id,kind,version};
      const {title,contactId,organisation,projectId}=details;
      return kind==='Relationship'?{id,kind,title,contactId,organisation}:{id,kind,title,projectId};
    });
    return {...refs,records};
  },{readOnly:true});
}
async function save(p,{user,database=db},sales) {
  access(user,sales?'sales':'marketing',true);
  if (sales&&p.kind!=='Enquiry') throw failure('Only enquiries can be updated in Sales.');
  const {fields,details}=buildMarketingDetails(p),id=text(p.id||p.createId);
  if (!/^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/i.test(id)) throw failure('Invalid marketing record ID.');
  return database.transaction(async tx=>{
    await tx.query('SELECT pg_advisory_xact_lock(hashtextextended($1,0))',['marketing:'+id]);
    const [old]=await tx.rows('SELECT id,kind,details,version FROM '+table+' WHERE id=$1 FOR UPDATE',[id]);
    if (!p.id&&old) {
      if (old.kind!==p.kind||fields.filter(key=>key!=='salesHistory').some(key=>String(old.details[key]||'')!==details[key])) {
        throw failure('This record already exists. Refresh before saving.',409);
      }
      return {...details,id,kind:old.kind,version:old.version};
    }
    if (p.id&&(!old||old.kind!==p.kind||old.version!==p.version)) throw failure('This record changed. Refresh before saving.',409);
    updateEnquiry(p,details,old,user,sales);
    const {projects,contacts}=await directory(tx,user);
    if (details.projectId&&!projects.some(row=>row.id===details.projectId)) throw failure('Choose a valid Studio project.');
    if (details.contactId&&!contacts.some(row=>row.id===details.contactId)) throw failure('Choose an active Directory contact.');
    for (const [key,kind,label] of [['caseStudyId','Case study','case study'],['relationshipId','Relationship','relationship']]) {
      if (!details[key]) continue;
      const [record]=await tx.rows('SELECT kind FROM '+table+' WHERE id=$1',[details[key]]);
      if (record?.kind!==kind) throw failure('Choose a valid '+label+'.');
    }
    const version=randomUUID();
    await tx.query('INSERT INTO '+table+' (id,kind,details,version) VALUES ($1,$2,$3::jsonb,$4) ON CONFLICT (id) DO UPDATE SET details=excluded.details,version=excluded.version',
      [id,p.kind,JSON.stringify(details),version]);
    return {...details,id,kind:p.kind,version};
  });
}
export const getMarketingWorkspace=(p,context)=>workspace(p,context,false);
export const getSalesWorkspace=(p,context)=>workspace(p,context,true);
export const saveMarketingRecord=(p,context)=>save(p,context,false);
export const saveSalesRecord=(p,context)=>save(p,context,true);
