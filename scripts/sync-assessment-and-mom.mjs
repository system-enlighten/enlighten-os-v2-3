import {readTab} from './read-operational-workbook.mjs';
import {decodeAssessment} from '../server/product-assessment-format.js';

const canonical=value=>JSON.stringify(value,(_key,item)=>item&&typeof item==='object'&&!Array.isArray(item)?
  Object.fromEntries(Object.entries(item).sort(([a],[b])=>a.localeCompare(b))):item);

export function readAssessmentAndFlagRows(book) {
  const read=title=>readTab(book,title,{required:true}).map(row=>row.cells);
  const assessments=read('ProductAssessments'),chunks=read('ProductAssessmentChunks'),flags=read('MomDiscussionFlags');
  const projects=new Set(read('Projects').map(row=>String(row.projectId)));
  const tasks=new Set(read('MomTasks').map(row=>JSON.stringify([String(row.projectId),String(row.momTaskId)])));
  const check=(rows,key,valid)=>{
    const ids=new Set();
    for (const row of rows) {
      const id=key(row);
      if (!valid(row)||ids.has(id)) throw Error('Invalid or duplicate supplemental source key.');
      ids.add(id);
    }
  };
  const assessed=new Set(assessments.map(row=>String(row.projectId)));
  check(assessments,row=>row.projectId,row=>projects.has(String(row.projectId))&&row.version);
  check(chunks,row=>JSON.stringify([row.projectId,row.version,Number(row.chunkIndex)]),row=>assessed.has(String(row.projectId))&&
    row.version&&row.chunkKey===[row.projectId,row.version,row.chunkIndex].join('|')&&Number.isSafeInteger(Number(row.chunkIndex))&&Number(row.chunkIndex)>=0&&row.base64);
  check(flags,row=>JSON.stringify([row.projectId,row.momTaskId]),row=>row.momTaskId&&row.version&&
    tasks.has(JSON.stringify([String(row.projectId),String(row.momTaskId)])));
  for (const meta of assessments) decodeAssessment(meta,chunks.filter(row=>row.projectId===meta.projectId&&row.version===meta.version));
  return {assessments,chunks,flags};
}

export async function synchronizeAssessmentAndFlagRows(database,source,{apply=false,parentsPlanned=false}={}) {
  return database.transaction(async tx=>{
    const result={inserted:0,unchanged:0,conflicts:[]};
    const sync=async(table,columns,values,row)=>{
      const condition=columns.map((column,index)=>column+'=$'+(index+1)).join(' AND ');
      const qualified='enlighten_operational.'+table;
      const [prior]=await tx.rows('SELECT cells FROM '+qualified+' WHERE '+condition,values);
      if (prior) {
        if (canonical(prior.cells)===canonical(row)) result.unchanged++;
        else result.conflicts.push({table,key:values});
        return;
      }
      if (apply) {
        const placeholders=[...values,JSON.stringify(row)].map((_item,index)=>'$'+(index+1));
        await tx.query('INSERT INTO '+qualified+' ('+columns.join(',')+',cells) VALUES ('+placeholders.join(',')+'::jsonb)',
          [...values,JSON.stringify(row)]);
      }
      result.inserted++;
    };
    if (apply) await tx.query("SELECT pg_advisory_xact_lock(hashtext('enlighten_workbook_supplemental'))");
    for (const row of source.assessments) {
      const project=await tx.rows("SELECT 1 FROM enlighten_operational.projects WHERE cells->>'projectId'=$1 LIMIT 2",[row.projectId]);
      if (project.length!==1&&!(parentsPlanned&&!apply&&project.length===0)) throw Error('Project must be synchronized before its assessment.');
      await sync('product_assessments',['project_id'],[row.projectId],row);
    }
    for (const row of source.chunks) await sync('product_assessment_chunks',['project_id','version','chunk_index'],
      [row.projectId,row.version,Number(row.chunkIndex)],row);
    for (const row of source.flags) {
      const task=await tx.rows("SELECT 1 FROM enlighten_operational.mom_tasks WHERE cells->>'projectId'=$1 AND cells->>'momTaskId'=$2 LIMIT 2",
        [row.projectId,row.momTaskId]);
      if (task.length!==1&&!(parentsPlanned&&!apply&&task.length===0)) throw Error('MOM task must be synchronized before its discussion flag.');
      await sync('mom_discussion_flags',['project_id','mom_task_id'],[row.projectId,row.momTaskId],row);
    }
    if (apply&&result.conflicts.length) throw Object.assign(new Error('Existing records differ. No supplemental changes were applied.'),{conflicts:result.conflicts});
    return result;
  },{readOnly:!apply});
}
