import {createHash} from 'node:crypto';
import {readTab} from './read-operational-workbook.mjs';
import {inspectOperationalWorkbook} from './reconcile-operational-workbook.mjs';

const keys={
  readme:[],lookups:[],home_agenda_sessions:['key'],studio_briefings:['id'],assistant_profiles:['userId'],
  studio_attendance_corrections:['key','at'],line_of_work_comments:['id'],internal_work_areas:['id'],
  assigned_work_acceptance:['key'],assigned_work_comments:['id'],studio_attendance:['key'],active_time:['batchId','section','projectId'],
  app_feedback:['feedbackId'],feedback_attachments:['uploadId'],diary_entries:['entryId'],studio_journal:['projectId'],
  site_execution_items:['projectId','itemKey'],wih_plans:['designTaskId'],application_images:['id'],
  studio_threads:['threadId'],studio_thread_comments:['commentId'],project_books:['projectId'],project_closeout:['projectId'],
  workflow_delegations:['delegationId'],email_drawing_intakes:['intakeId'],email_intake_messages:['messageId'],
  project_onboarding:['checklistId'],technical_workbooks:['projectId'],technical_tables:['tableId'],
  technical_table_chunks:['tableId','version','chunkIndex'],technical_fittings:['fittingId'],
  duplicate_drawing_cleanup:['projectId','removedFileId'],drawing_portal_access:['projectId','contactId'],
  issued_drawings:['issueId'],mom_tasks:['momTaskId'],execution_visits:['visitPlanId'],project_meetings:['id'],
  site_punch_ins:['punchId'],project_roles:['projectId','userId'],drawing_task_master:['drawingTypeId','taskId'],
  designations:['masterId'],departments:['masterId'],projects:['projectId'],project_contacts:['contactId'],
  line_of_work:['lineWorkId'],floor_zones:['floorZoneId'],people:['userId'],contacts:['contactId'],
  drawing_register:['drawingId'],design_dashboard:['dashboardRowId'],design_tasks:['designTaskId'],wih:['wihId'],
  work_log:['workLogId'],execution:['executionId'],meetings:['meetingId'],mom:['momId'],site_visits:['siteVisitId'],
  files:['fileId'],activity_log:['activityId','timestamp','entityType','entityId'],accounts_journal:['Record ID'],technical_documentation:['projectId'],
  technical_documentation_chunks:['chunkKey'],mom_visit_points:['pointKey']
};
const digest=cells=>createHash('sha256').update(JSON.stringify(Object.fromEntries(Object.entries(cells).sort(([a],[b])=>a.localeCompare(b))))).digest('hex');
const historical=new Set(['active_time','activity_log']);
function identity(table,row,occurrences) {
  if (historical.has(table)) {
    const hash=digest(row.cells),index=(occurrences.get(hash)||0)+1;
    occurrences.set(hash,index);
    return JSON.stringify([hash,index]);
  }
  const columns=keys[table];
  if (!columns) throw Error('Missing identity rules for '+table+'.');
  if (!columns.length) return JSON.stringify([row.sourceRow]);
  const values=columns.map(column=>String(row.cells[column]??'').trim());
  if (values.some((value,index)=>!value&&!(table==='drawing_task_master'&&index===1||table==='active_time'&&index===2||table==='activity_log'&&index>=2))) return null;
  return JSON.stringify(values);
}

export function planWorkbookCells(book) {
  return inspectOperationalWorkbook(book).tabs.filter(tab=>tab.format==='cells').map(({table,title})=>{
    const entries=new Map(),issues=[],occurrences=new Map();
    for (const row of readTab(book,title)) {
      const key=identity(table,row,occurrences);
      if (!key) issues.push({table,sourceRow:row.sourceRow,reason:'missing identity'});
      else if (entries.has(key)) issues.push({table,sourceRow:row.sourceRow,reason:'duplicate identity'});
      else entries.set(key,{...row,hash:digest(row.cells)});
    }
    return {table,entries,issues};
  });
}

export async function synchronizeWorkbookCells(database,plan,{apply=false}={}) {
  return database.transaction(async tx=>{
    const issues=plan.flatMap(item=>item.issues);
    const report={inserted:0,updated:0,unchanged:0,destinationOnly:0,issues};
    if (apply) {
      await tx.query("SELECT pg_advisory_xact_lock(hashtext('enlighten_workbook_sync'))");
      if (issues.length) throw Object.assign(Error('Source identity conflicts prevent synchronization.'),{report});
      for (const table of [...plan.map(item=>item.table)].sort()) {
        if (!Object.hasOwn(keys,table)) throw Error('Unknown reconciliation table.');
        await tx.query('LOCK TABLE enlighten_operational.'+table+' IN SHARE ROW EXCLUSIVE MODE');
      }
    }
    for (const {table,entries} of plan) {
      if (!Object.hasOwn(keys,table)) throw Error('Unknown reconciliation table.');
      const target='enlighten_operational.'+table;
      const existing=new Map(),duplicates=new Set(),occurrences=new Map();
      const rows=await tx.rows('SELECT record_id,source_row_number,cells FROM '+target+' ORDER BY source_row_number NULLS LAST,record_id');
      for (const row of rows) {
        const key=identity(table,{sourceRow:row.source_row_number,cells:row.cells},occurrences);
        if (!key) continue;
        if (existing.has(key)) duplicates.add(key);
        else existing.set(key,row);
      }
      const prior=new Map((await tx.rows('SELECT source_key,source_hash,record_id FROM enlighten_operational.workbook_sync_state WHERE table_name=$1',[table]))
        .map(row=>[row.source_key,row]));
      report.destinationOnly+=[...existing.keys()].filter(key=>!entries.has(key)).length;
      const newRows=[],stateRows=[];
      for (const [key,row] of entries) {
        const current=existing.get(key),baseline=prior.get(key),currentHash=current&&digest(current.cells);
        const conflict=duplicates.has(key)||baseline&&String(current?.record_id)!==String(baseline.record_id)||
          current&&currentHash!==row.hash&&baseline?.source_hash!==currentHash;
        if (conflict) {
          issues.push({table,sourceRow:row.sourceRow,reason:'destination conflict'});
          continue;
        }
        if (currentHash===row.hash) report.unchanged++;
        else if (current) report.updated++;
        else report.inserted++;
        if (!apply) continue;
        let recordId=current?.record_id;
        if (!current) {
          newRows.push({key,sourceRow:row.sourceRow,cells:row.cells,hash:row.hash});
          continue;
        } else if (currentHash!==row.hash) {
          await tx.query('UPDATE '+target+' SET cells=$1::jsonb,updated_at=clock_timestamp() WHERE record_id=$2',[JSON.stringify(row.cells),recordId]);
        }
        if (baseline?.source_hash!==row.hash) {
          stateRows.push({key,hash:row.hash,recordId});
        }
      }
      for (let i=0;i<newRows.length;i+=250) {
        const chunk=newRows.slice(i,i+250);
        const records=await tx.rows('INSERT INTO '+target+' (source_row_number,cells) SELECT (value->>\'sourceRow\')::integer,value->\'cells\' FROM jsonb_array_elements($1::jsonb) RETURNING record_id,source_row_number',[JSON.stringify(chunk)]);
        const byRow=new Map(records.map(record=>[Number(record.source_row_number),record.record_id]));
        for (const row of chunk) stateRows.push({key:row.key,hash:row.hash,recordId:byRow.get(row.sourceRow)});
      }
      for (let i=0;i<stateRows.length;i+=500) {
        await tx.query("INSERT INTO enlighten_operational.workbook_sync_state (table_name,source_key,source_hash,record_id) "+
          "SELECT $1,value->>'key',value->>'hash',(value->>'recordId')::bigint FROM jsonb_array_elements($2::jsonb) "+
          "ON CONFLICT (table_name,source_key) DO UPDATE SET source_hash=excluded.source_hash",[table,JSON.stringify(stateRows.slice(i,i+500))]);
      }
    }
    if (apply&&issues.length) throw Object.assign(Error('Destination conflicts rolled back the synchronization.'),{report});
    return report;
  },{readOnly:!apply});
}
