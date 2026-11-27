import {db} from './supabase-db.js';
import {requireProject} from './permissions.js';
import {loadDrawingWork} from './drawing-classification.js';
import {taskBatchCoverage_} from './drawing-rules.js';
import {completedWiring,documentationTemplates,isWiringTask,rootTasks,syncDocumentation} from './design-workspace.js';
import {active,actor,failure,now,projectRow,text} from './project-write-storage.js';

const key=area=>JSON.stringify([text(area.floor).toLowerCase(),text(area.area).toLowerCase()]);

export async function architecturalLightingMilestone(payload,{user,database=db}) {
  const projectId=text(payload.projectId),sign=payload.signOff===true;
  const role=requireProject(user,projectId,{write:sign,admin:sign});
  const canSign=role==='Admin';
  return database.transaction(async tx=>{
    const project=await projectRow(tx,projectId);
    if (!project) throw failure('Project not found.',404);
    const closed=active(project.cells.completed)||text(project.cells.projectStatus).toLowerCase()==='completed';
    if (sign&&closed) throw failure('The project is completed.',409);
    const state=await loadDrawingWork(tx,project.cells,user);
    if (!closed&&text(user.appAccess).toLowerCase()!=='viewer') await syncDocumentation(state);
    const roots=rootTasks(state),wiring=completedWiring(state);
    const types=[...new Set(documentationTemplates(state).map(row=>text(row.triggerTaskType).toLowerCase()))];
    const coverage=types.map(type=>new Set(roots.filter(row=>text(row.taskType).toLowerCase()===type&&row.status==='Completed')
      .flatMap(row=>taskBatchCoverage_(row).map(key))));
    const pending=roots.some(task=>isWiringTask(task)&&!/^(?:completed|done)$/i.test(task.status));
    const ready=Boolean(types.length&&wiring.length&&!pending&&wiring.every(task=>taskBatchCoverage_(task).every(area=>coverage.every(set=>set.has(key(area))))));
    const [existing]=await tx.rows('SELECT signed_at,signed_by FROM enlighten_operational.architectural_lighting_milestones WHERE project_id=$1',[projectId]);
    if (existing) return {projectId,signedAt:new Date(existing.signed_at).toISOString(),signedBy:existing.signed_by,ready,canSign};
    if (!sign) return {ready,canSign};
    if (!ready) throw failure('Complete Wiring Drawings and Documentation before sign-off.',409);
    const signedAt=now(),signedBy=actor(user);
    await tx.query('INSERT INTO enlighten_operational.architectural_lighting_milestones (project_id,signed_at,signed_by) VALUES ($1,$2,$3)',[projectId,signedAt,signedBy]);
    return {projectId,signedAt,signedBy,ready,canSign};
  });
}
