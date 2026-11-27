import {db} from './supabase-db.js';
import {checkProjectRead,requireProject} from './permissions.js';
import {getProjectCloseout} from './project-closeout.js';
import {executionVisits} from './project-visits.js';
import {getProjectOnboarding} from './workflow-management.js';
import {getWorkflowDelegation} from './workflow-operational.js';
import {defaultWorkflowSubtasks} from './workflow-defaults.js';
import {active,actor,failure,insertRecord,now,projectChildren,projectRow,text} from './project-write-storage.js';

export async function getWorkflowWorkspace(payload,{user,database=db}) {
  const projectId=text(payload.projectId);
  if (!projectId) throw failure('Choose a project.');
  return database.transaction(async tx=>{
    await checkProjectRead(tx,user,projectId);
    const scoped={user,database:{transaction:work=>work(tx)},exportId:'operational'};
    const [delegation,closeout,onboarding,visits,history,drawings]=await Promise.all([
      getWorkflowDelegation({projectId},scoped),
      getProjectCloseout({projectId},scoped),
      getProjectOnboarding({projectId},scoped),
      executionVisits(tx,projectId),
      tx.rows("SELECT cells FROM enlighten_operational.historical_workflow_meetings WHERE cells->>'projectId'=$1 ORDER BY source_row_number NULLS LAST,record_id",[projectId]),
      tx.rows("SELECT cells FROM enlighten_operational.drawing_register WHERE cells->>'projectId'=$1 ORDER BY source_row_number NULLS LAST,record_id",[projectId])
    ]);
    return {...delegation,closeout,onboarding,visits,historicalMeetings:history.map(row=>row.cells),
      drawings:drawings.map(row=>row.cells).filter(row=>!active(row.trashed))};
  },{readOnly:true});
}

export async function recordHistoricalWorkflowMeeting(payload,{user,database=db}) {
  const projectId=text(payload.projectId),lineWorkId=text(payload.lineWorkId);
  requireProject(user,projectId,{write:true,admin:true});
  const date=String(payload.date||''),notes=text(payload.notes);
  const today=new Date(Date.now()+330*60000).toISOString().slice(0,10);
  if (date&&(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!Number.isFinite(Date.parse(date))||
      new Date(date).toISOString().slice(0,10)!==date||date>today)) throw failure('Enter a valid meeting date up to today.');
  if (notes.length>4000) throw failure('Keep notes within 4,000 characters.');
  return database.transaction(async tx=>{
    const project=await projectRow(tx,projectId);
    if (!project) throw failure('Project not found.',404);
    if (active(project.cells.completed)||text(project.cells.projectStatus).toLowerCase()==='completed') throw failure('The project is completed.',409);
    const workflow=(await projectChildren(tx,'line_of_work',projectId)).map(row=>row.cells).filter(row=>active(row.active));
    const custom=workflow.some(row=>['1','2'].includes(String(row.workflowVersion)));
    const title=workflow.find(row=>String(row.lineWorkId)===lineWorkId&&row.subtask)?.subtask||
      (!custom&&Object.hasOwn(defaultWorkflowSubtasks,lineWorkId)?defaultWorkflowSubtasks[lineWorkId]:'');
    if (!title) throw failure('Select a subtask in this project’s Line of Work.');
    const key=JSON.stringify([projectId,lineWorkId]);
    const existing=await projectChildren(tx,'historical_workflow_meetings',projectId);
    const prior=existing.find(row=>row.cells.key===key);
    if (prior) return prior.cells;
    const row={key,projectId,lineWorkId,title,date,notes:/^[=+@-]/.test(notes)?"'"+notes:notes,recordedAt:now(),recordedBy:actor(user)};
    await insertRecord(tx,'historical_workflow_meetings',row);
    return row;
  });
}
