import {db} from './supabase-db.js';
import {projectRoleMap,requireAssignedTask,requireStudio,wihProjectRole} from './permissions.js';
import {wihDelegationResolver_} from './wih-projections.js';
import {active,actor,failure,now,projectChildren,projectRow,text,updateRecord,writeActivity} from './project-write-storage.js';

async function changeTask(payload,{user,database=db},assign) {
  const id=text(payload.designTaskId);
  const name=text(payload.assigneeName);
  if (!id || (assign&&!name)) throw failure(assign?'designTaskId and assigneeName are required.':'designTaskId is required.');
  return database.transaction(async tx=>{
    const matches=await tx.rows("SELECT cells->>'projectId' AS project_id FROM enlighten_operational.design_tasks WHERE cells->>'designTaskId'=$1 LIMIT 2",[id]);
    if (!matches.length) throw failure('Design task not found.',404);
    if (matches.length!==1) throw failure('Design task ID is duplicated.',409);
    const projectId=matches[0].project_id;
    if (!await projectRow(tx,projectId)) throw failure('Project not found.',404);
    const tasks=(await projectChildren(tx,'design_tasks',projectId)).filter(row=>String(row.cells.designTaskId)===id);
    const work=(await projectChildren(tx,'wih',projectId)).filter(row=>String(row.cells.designTaskId)===id);
    if (tasks.length!==1||work.length!==1) throw failure('The design task requires one linked WIH row.',409);
    const [task]=tasks,[wih]=work;
    requireAssignedTask(user,task.cells,wih.cells,{assign});
    const updatedAt=now();
    const assignee={assigneeUserId:text(payload.assigneeUserId),assigneeName:name};
    const patch={...(assign?assignee:{drawingReviewRequired:false}),updatedAt,updatedBy:actor(user)};
    await updateRecord(tx,'design_tasks',task.record_id,patch);
    const workPatch=assign?{...assignee,updatedAt}:{};
    if (assign) await updateRecord(tx,'wih',wih.record_id,workPatch);
    else await writeActivity(tx,user,'REVIEW_RECEIPT','DesignTask',id,projectId,task.cells,{drawingReviewRequired:false});
    return {task:{...task.cells,...patch},wih:{...wih.cells,...workPatch}};
  });
}

export const assignDesignTask=(payload,context)=>changeTask(payload,context,true);
export const acknowledgeWorkflowDrawing=(payload,context)=>changeTask(payload,context,false);

export async function reportingAssignment(p,{user,database=db}) {
  const id=text(p.designTaskId),uid=text(user.userId);
  requireStudio(user);
  if (!uid||/^viewer$/i.test(user.appAccess)) throw failure('Edit access required.',403);
  if (!id||!['options','assign'].includes(p.action)) throw failure('Unknown assignment action.');
  return database.transaction(async tx=>{
    await tx.query("SELECT pg_advisory_xact_lock(hashtext('enlighten_work_timers'))");
    const matches=await tx.rows("SELECT cells->>'projectId' AS project_id FROM enlighten_operational.design_tasks WHERE cells->>'designTaskId'=$1 LIMIT 2",[id]);
    if (matches.length!==1) throw failure('Design task not found or duplicated.',404);
    const pid=matches[0].project_id,role=wihProjectRole(user,pid);
    if (!role) throw failure('Assignment is unavailable for this task.',403);
    if (!await projectRow(tx,pid)) throw failure('Project not found.',404);
    const task=(await projectChildren(tx,'design_tasks',pid)).find(row=>String(row.cells.designTaskId)===id);
    if (!task||task.cells.mergedIntoTaskId||/completed|^done$|in.?progress|running/i.test(String(task.cells.status))) {
      throw failure('Assignment is unavailable for this task.',409);
    }
    const staff=(await tx.rows('SELECT cells FROM enlighten_operational.people')).map(row=>row.cells);
    const lines=(await projectChildren(tx,'line_of_work',pid)).map(row=>row.cells);
    const rules=(await tx.rows("SELECT cells FROM enlighten_operational.workflow_delegations WHERE cells->>'projectId' IN ($1,'*')",[pid])).map(row=>row.cells);
    const assigned=wihDelegationResolver_(rules,lines,staff)(task.cells);
    const admin=role==='Admin';
    if (!admin&&String(assigned.assigneeUserId)!==uid) throw failure('Choose work assigned to you.',403);
    const grants=(await tx.rows("SELECT cells FROM enlighten_operational.project_roles WHERE cells->>'projectId'=$1",[pid])).map(row=>row.cells);
    const eligible=staff.filter(member=>active(member.active)&&/^(admin|user)$/i.test(member.appAccess)&&
      (admin||String(member.reportingUserId)===uid)&&projectRoleMap(grants,String(member.userId))[pid]);
    if (p.action==='options') return eligible.map(member=>({userId:member.userId,name:member.name}));
    const next=eligible.find(member=>String(member.userId)===text(p.assigneeUserId));
    if (!next) throw failure('Choose an eligible project member.');
    const timers=(await projectChildren(tx,'wih',pid)).filter(row=>String(row.cells.designTaskId)===id);
    if (timers.length!==1||timers[0].cells.status==='In Progress') throw failure('Task timer is running or unavailable.',409);
    const patch={assigneeUserId:next.userId,assigneeName:next.name,updatedAt:now()};
    await updateRecord(tx,'design_tasks',task.record_id,{...patch,assignmentExplicit:true,updatedBy:actor(user)});
    await updateRecord(tx,'wih',timers[0].record_id,patch);
    await writeActivity(tx,user,'ASSIGN','DesignTask',id,pid,task.cells,{...task.cells,...patch});
    return {saved:true};
  });
}
