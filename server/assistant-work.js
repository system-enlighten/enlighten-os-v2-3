import {db} from './supabase-db.js';
import {projectRoleFor} from './permissions.js';
import {internalAreaRows,studioMember} from './studio-settings.js';
import {createTask,loadDrawingWork} from './drawing-classification.js';
import {assertPredecessors,updateTimer} from './wih-timers.js';
import {active,actor,failure,insertRecord,insertReturning,nextEntityId,now,projectChildren,projectRow,text} from './project-write-storage.js';

const inside=id=>/^__(?:internal_(?:os|center|ops|discussion|custom_[a-f0-9-]{36})|admin_work)__$/.test(id);
const runningStatus='In Progress';
function name(value) {
  const title=text(value);
  if (!title||title.length>120||/^[=+@-]/.test(title)) throw failure('Enter a valid task name (up to 120 characters).');
  return title;
}
export async function assistantWork(p,{user,database=db}) {
  const uid=studioMember(user),command=p.command;
  if (!/^(admin|user)$/i.test(user.appAccess)) throw failure('A staff account is required.',403);
  if (!['list','create','start','pause','stop','resume'].includes(command)) throw failure('Unsupported timer command.');
  const accessible=id=>inside(id)||Boolean(projectRoleFor(user,id));
  return database.transaction(async tx=>{
    if (command!=='list') await tx.query("SELECT pg_advisory_xact_lock(hashtext('enlighten_work_timers'))");
    const paired=(await tx.rows(`SELECT t.record_id AS task_id,t.cells AS task,w.record_id AS timer_id,w.cells AS timer
      FROM enlighten_operational.wih w JOIN enlighten_operational.design_tasks t
      ON t.cells->>'designTaskId'=w.cells->>'designTaskId' AND t.cells->>'projectId'=w.cells->>'projectId'
      WHERE w.cells->>'assigneeUserId'=$1 ORDER BY w.source_row_number NULLS LAST,w.record_id`,[uid]))
      .filter(row=>accessible(String(row.timer.projectId))&&!row.task.mergedIntoTaskId);
    const view=(row,status=row.timer.status)=>({id:String(row.timer.designTaskId),projectId:String(row.timer.projectId),
      title:String(row.task.taskType||'Work'),status});
    if (command==='list') return {tasks:paired.filter(row=>!['Completed','Blocked'].includes(row.timer.status)).map(row=>view(row))};
    const at=now(),day=new Date(Date.parse(at)+19800000).toISOString().slice(0,10);
    const starting=command==='start'||command==='resume';
    if (starting) {
      const [discussion]=await tx.rows("SELECT cells FROM enlighten_operational.studio_briefings WHERE cells->>'openUserId'=$1 LIMIT 1",[uid]);
      if (discussion&&!discussion.cells.end) throw failure('End your discussion before starting another task timer.',409);
      const [attendance]=await tx.rows("SELECT cells FROM enlighten_operational.studio_attendance WHERE cells->>'key'=$1 LIMIT 1",[uid+'|'+day]);
      if (attendance?.cells.checkOut||attendance?.cells.breakStart) throw failure('Resume work from Attendance before starting a task timer.',409);
    }
    const running=paired.filter(item=>item.timer.status===runningStatus);
    const loadProject=async(id,creation=false)=>{
      if (!id||!accessible(id)) throw failure('Choose a project you can access.',403);
      if (inside(id)) {
        if (creation&&(id==='__admin_work__'||!(await internalAreaRows(tx)).some(row=>row.id===id&&row.active))) throw failure('Choose an active internal work area.');
        return {projectId:id};
      }
      const row=await projectRow(tx,id);
      if (!row) throw failure('Project not found.',404);
      if ((creation||starting)&&(active(row.cells.completed)||/^completed$/i.test(text(row.cells.projectStatus)))) {
        throw failure('The project is completed.',409);
      }
      return row.cells;
    };
    let selected=paired.find(row=>String(row.timer.designTaskId)===String(p.id));
    if (command==='create'||command==='start'&&!selected&&!p.id) {
      const title=name(p.title),pid=text(p.projectId),narration=text(p.narration),requestId=text(p.requestId);
      if (command==='create'&&!/^[a-f0-9-]{36}$/i.test(requestId)) throw failure('Invalid task request. Reopen the form.');
      if (narration.length>2000||/^[=+@-]/.test(narration)) throw failure('Enter a narration up to 2,000 characters, starting with plain text.');
      if (command==='start'&&running.length) throw failure('Pause or stop your current timer first.',409);
      const project=await loadProject(pid,true),state=await loadDrawingWork(tx,project,user);
      const activation='assistant:'+uid+':'+(command==='create'?requestId:title.toLowerCase());
      const task=state.tasks.find(row=>row.cells.workflowActivationKey===activation)?.cells||await createTask(state,{
        taskType:title,dependencyDrawingType:'MANUAL',workflowActivationKey:activation,narration,
        taskCategory:command==='start'?'Studio':p.activity==='Meeting / Discussion'?'Meeting / Discussion':inside(pid)?'Admin / Owner':'Project',
        workflowScope:'Project',assigneeName:actor(user),assigneeUserId:uid,completionUploadRequired:false
      });
      let work=state.wih.find(row=>String(row.cells.designTaskId)===String(task.designTaskId));
      if (!work) {
        const row={wihId:await nextEntityId(tx,'wih'),designTaskId:task.designTaskId,projectId:pid,assigneeName:actor(user),assigneeUserId:uid,
          status:'Not Started',startAt:'',totalMinutes:0,completionUploadRequired:false,updatedAt:at};
        work=await insertReturning(tx,'wih',row);
      }
      if (command==='create') return {id:task.designTaskId,row:{...work.cells,task,receipt:null,plan:null}};
      selected={task,task_id:state.tasks.find(row=>String(row.cells.designTaskId)===String(task.designTaskId)).record_id,timer:work.cells,timer_id:work.record_id};
    }
    if (!selected||String(selected.task.assigneeUserId)!==uid) throw failure('Choose one of your own tasks.',403);
    const {task,timer}=selected;
    const records=[{record_id:selected.task_id,cells:task},{record_id:selected.timer_id,cells:timer}];
    if (starting) {
      const project=await loadProject(String(task.projectId));
      const all=await projectChildren(tx,'design_tasks',String(task.projectId));
      const root=task.parentDesignTaskId?all.find(row=>String(row.cells.designTaskId)===String(task.parentDesignTaskId))?.cells:task;
      if (!root) throw failure('Parent design task not found.',409);
      if (/^decorative selection$/i.test(text(root.taskType))&&!active(project.artCuration)) throw failure('Enable Art Curation in Project & Scope.');
      if (timer.status===runningStatus) return {task:view(selected)};
      if (running.length) throw failure('Pause or stop your current timer first.',409);
      if (['Completed','Blocked'].includes(timer.status)) throw failure('This task is not ready to start.',409);
      assertPredecessors(task,all);
      await updateTimer(tx,...records,{status:runningStatus,startedAt:task.startedAt||at,updatedAt:at,updatedBy:actor(user)},
        {status:runningStatus,workDate:day,startAt:at,stopAt:'',updatedAt:at});
      return {task:view(selected,runningStatus)};
    }
    if (timer.status!==runningStatus&&!(command==='stop'&&timer.status==='Paused')) throw failure('This timer is no longer running.',409);
    if (timer.sharedSession) throw failure('Manage a shared timer in Work in Hand.',409);
    const start=timer.status===runningStatus?timer.startAt:'';
    const minutes=start?Math.max(0,Math.round((Date.parse(at)-Date.parse(start))/60000)||0):0;
    if (minutes) await insertRecord(tx,'work_log',{workLogId:await nextEntityId(tx,'work_log'),wihId:timer.wihId,designTaskId:task.designTaskId,
      projectId:task.projectId,userId:uid,userName:actor(user),sessionDate:day,startAt:start,endAt:at,minutes,
      hours:Math.round(minutes*100/60)/100,action:command==='pause'?'PAUSE':'STOP',notes:text(p.notes),createdAt:at});
    const totalMinutes=(Number(timer.totalMinutes)||0)+minutes,status=command==='pause'?'Paused':'Ready';
    await updateTimer(tx,...records,{status,actualHours:Math.round(totalMinutes*100/60)/100,updatedAt:at,updatedBy:actor(user)},
      {status,startAt:'',lastPauseAt:command==='pause'?at:'',stopAt:at,currentSessionMinutes:0,totalMinutes,updatedAt:at});
    return {task:view(selected,status),segment:minutes>0?{start,end:at,minutes}:null};
  },{readOnly:command==='list'});
}
