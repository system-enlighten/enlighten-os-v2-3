// Operational Preview reader. No production routing or persistent business writes.
// server/workflow.js — Preview snapshot reads only; not a replacement for getWIH.
import { db } from './supabase-db.js';
import { requireSystemAdmin } from './permissions.js';
const norm = v => String(v ?? '').trim().toLowerCase();
const key = (a,b) => JSON.stringify([norm(a),norm(b)]);
const tables = new Set(['line_of_work','workflow_delegations','design_tasks','wih','wih_plans']);
function guard(user, exportId) {
  if (process.env.VERCEL_ENV !== 'preview' || process.env.SUPABASE_OPERATIONAL_ACCESS !== '1') throw Error('Snapshot reads disabled');
  requireSystemAdmin(user);
  if (exportId !== 'operational') throw Error('Explicit export ID required');
}
async function read(tx, table, exportId, projectId, global = false) {
  if (!tables.has(table)) throw Error('Unsupported workflow table');
  const rows = await tx.rows(`SELECT cells FROM enlighten_operational."${table}" WHERE ($1::text = $$operational$$) AND ($2='' OR cells->>'projectId'=$2 OR ($3::boolean AND cells->>'projectId'='*')) ORDER BY source_row_number, record_id`, [exportId,projectId,global]);
  return rows.map(({cells}) => { if (!cells || typeof cells !== 'object' || Array.isArray(cells)) throw Error('Invalid workflow record'); return cells; });
}
function resolve(row,rules) {
  const k=key(row.tasks,row.subtask);
  const project=rules.find(r=>String(r.projectId)===String(row.projectId)&&key(r.task,r.subtask)===k);
  const base=rules.find(r=>r.projectId==='*'&&key(r.task,r.subtask)===k);
  const raw=String(row.responsible||'').trim();
  const rule=project?.responsibleId?project:project||!raw?base:null;
  const value=rule?String(rule.responsibleName||''):raw;
  return {...row,responsible:value,delegationSource:project?.responsibleId?'project':project||!raw?(base?'default':'none'):'project',delegationValue:value,delegationRawResponsible:raw};
}
async function loadWorkflow(payload, {user,exportId,database=db}={}) {
  guard(user,exportId);
  const id=String(payload.projectId||'').trim();
  return database.transaction(async tx=>{
    const rules=await read(tx,'workflow_delegations',exportId,id,true);
    const rows=await read(tx,'line_of_work',exportId,id);
    const workflow=rows.filter(r=>['true','yes','1','y'].includes(norm(r.active))).map(r=>resolve(r,rules)).sort((a,b)=>Number(a.seq||a.sourceRow||0)-Number(b.seq||b.sourceRow||0));
    return {rules,workflow};
  },{readOnly:true});
}
export async function listLineOfWork(payload={},context={}) { return (await loadWorkflow(payload,context)).workflow; }
export async function getWorkflowDelegation(payload={},context={}) {
  const id=String(payload.projectId||'*').trim();
  const result=await loadWorkflow({projectId:id},context);
  return {rules:result.rules,workflow:payload.projectId?result.workflow:[]};
}
// Diagnostic snapshot only: deliberately not named getWIH because eligibility,
// task projections, receipt resolution, repair, and internal-work privacy differ.
export async function readWorkflowSnapshot(payload={}, {user,exportId,database=db}={}) {
  guard(user,exportId);
  const id=String(payload.projectId||'').trim();
  if (!id || id==='*') throw Error('Specific project ID required');
  return database.transaction(async tx=>{
    const projects=await tx.rows(`SELECT 1 FROM enlighten_operational.projects WHERE ($1::text = $$operational$$) AND cells->>'projectId'=$2 LIMIT 1`,[exportId,id]);
    if (!projects.length) throw Error('Project not found in snapshot');
    const [designTasks,wih,plans]=await Promise.all(['design_tasks','wih','wih_plans'].map(t=>read(tx,t,exportId,id)));
    return {designTasks,wih,plans};
  },{readOnly:true});
}
// No mutation, activation, timer, completion, dependency repair or API routing.
