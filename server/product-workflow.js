import {randomUUID} from 'node:crypto';
import {db} from './supabase-db.js';
import {checkProjectRead,requireProject,visibleProjectIds} from './permissions.js';
import {actor,failure,now,text} from './project-write-storage.js';
import {buildDraft,buildHistory} from './product-workflow-rules.js';

export async function getProductWorkflow(p,{user,database=db}) {
  const projectId=text(p.projectId),brand=text(p.brand).toLowerCase();
  requireProject(user,projectId);
  const ids=visibleProjectIds(user);
  return database.transaction(async tx=>{
    await checkProjectRead(tx,user,projectId);
    const drafts=(await tx.rows("SELECT data FROM enlighten_operational.product_workflow_drafts WHERE project_id=$1 AND ($2='' OR brand=$2) ORDER BY data->>'createdAt',id",
      [projectId,brand])).map(row=>row.data);
    const records=brand?(await tx.rows(`SELECT h.data,p.cells->>'projectName' AS project FROM enlighten_operational.product_partner_history h
      JOIN enlighten_operational.projects p ON p.cells->>'projectId'=h.project_id WHERE h.brand=$1 AND ($2::text[] IS NULL OR h.project_id=ANY($2))
      ORDER BY h.data->>'date' DESC,h.data->>'updatedAt' DESC`,[brand,ids])).map(row=>({...row.data,project:row.project,editable:row.data.projectId===projectId})):[];
    return {drafts,records,supplies:records.filter(row=>row.kind==='supply'),serviceIssues:records.filter(row=>row.kind==='service'),historyAvailable:records.length>0};
  },{readOnly:true});
}

async function save(p,{user,database=db},draft) {
  const projectId=text(p.projectId);
  requireProject(user,projectId,{write:true,admin:true});
  if (!p.id||!p.kind||(draft?(!p.fittingId||!p.productId):!p.brand)) throw failure('Missing product request or partner details.');
  let data;
  try {data=(draft?buildDraft:buildHistory)({...p,projectId});} catch(error) {throw failure(error.message);}
  const table='enlighten_operational.'+(draft?'product_workflow_drafts':'product_partner_history');
  return database.transaction(async tx=>{
    await tx.query('SELECT pg_advisory_xact_lock(hashtextextended($1,0))',[table+':'+data.id]);
    await checkProjectRead(tx,user,projectId);
    const [stored]=await tx.rows('SELECT data FROM '+table+' WHERE id=$1 FOR UPDATE',[data.id]);
    const prior=stored?.data;
    if (prior&&(prior.projectId!==projectId||prior.kind!==data.kind||
      (draft?prior.productId!==data.productId||prior.fittingId!==data.fittingId:prior.brand!==data.brand))) {
      throw failure('This record belongs to another project or product.',409);
    }
    if (String(prior?.version||'')!==String(p.expectedVersion||'')) throw failure('This record changed. Reopen it before saving.',409);
    if (draft) {
      if (prior?.status==='closed') throw failure('This request is already closed.',409);
      if (data.status==='closed'&&!['open','draft'].includes(prior?.status)) throw failure('Save the request before closing it.',409);
      if (data.status==='closed') data.closedAt=now();
      data.createdAt=prior?.createdAt||now();
      data.updatedBy=actor(user);
    }
    data.version=randomUUID();
    data.updatedAt=now();
    await tx.query('INSERT INTO '+table+' (id,project_id,brand,data) VALUES ($1,$2,$3,$4::jsonb) ON CONFLICT (id) DO UPDATE SET brand=excluded.brand,data=excluded.data',
      [data.id,projectId,data.brand.toLowerCase(),JSON.stringify(data)]);
    return data;
  });
}

export const saveProductWorkflowDraft=(p,context)=>save(p,context,true);
export const saveProductPartnerHistory=(p,context)=>save(p,context,false);
