import {sendMomMail} from './mom-mail.js';
import {diaryPhotoReference} from './diary-media.js';
import {executionVisits,validVisitDate,visitCoverageList} from './project-visits.js';
import {requireExecutionSignoff} from './meeting-and-punch-writes.js';
import {verifySiteExecution} from './site-execution.js';
import {db} from './supabase-db.js';
import {requireProject} from './permissions.js';
import {cleanMomActions_,momActionLines_} from './mom-action-rules.js';
import {active,actor,failure,now,projectRow,text} from './project-write-storage.js';

export async function ensureVisitMomActions(tx,projectId,plan,visit,known) {
  if (!visit.visitId) throw failure('Saved visit has no identifier.',409);
  let actions;
  if (visit.pointsVersion) {
    const points=await tx.rows("SELECT cells FROM enlighten_operational.mom_visit_points WHERE cells->>'projectId'=$1 AND cells->>'visitId'=$2 ORDER BY (cells->>'position')::integer,record_id",
      [projectId,String(visit.visitId)]);
    actions=points.map(row=>JSON.parse(row.cells.recordJson)).filter(point=>point.action).map(point=>({
      title:point.text,kind:point.kind,owner:point.owner,dueDate:point.dueDate,pointId:point.id,circuitKey:point.circuit?.key||'',
      circuitLabel:point.circuit?.label||'',photosJson:JSON.stringify(point.photos||[])
    }));
  } else actions=cleanMomActions_(Array.isArray(visit.actionItems)?visit.actionItems:momActionLines_(visit.notes));
  const at=now();
  const inserts=[];
  for (const [position,action] of actions.entries()) {
    const momTaskId='MOM-'+[projectId,plan.visitPlanId,visit.visitId,position+1].map(encodeURIComponent).join('@');
    if (known.has(momTaskId)) continue;
    known.add(momTaskId);
    inserts.push({momTaskId,projectId,visitPlanId:plan.visitPlanId,visitId:visit.visitId,milestone:plan.milestone||'',floor:plan.floor||'',
      visitDate:visit.date||'',...action,completed:false,completedAt:'',completedBy:'',createdAt:at,updatedAt:at});
  }
  if (inserts.length) await tx.query('INSERT INTO enlighten_operational.mom_tasks (cells) SELECT value FROM jsonb_array_elements($1::jsonb)',
    [JSON.stringify(inserts)]);
}

export async function importMomTasks(p,{user,database=db}) {
  const projectId=text(p.projectId);
  requireProject(user,projectId,{write:true,admin:true});
  return database.transaction(async tx=>{
    if (!await projectRow(tx,projectId)) throw failure('Project not found.',404);
    const plans=(await tx.rows("SELECT cells FROM enlighten_operational.execution_visits WHERE cells->>'projectId'=$1 ORDER BY source_row_number NULLS LAST,record_id",
      [projectId])).map(row=>row.cells);
    const query=`SELECT cells FROM enlighten_operational.mom_tasks WHERE cells->>'projectId'=$1
      ORDER BY coalesce(cells->>'createdAt','') DESC,source_row_number NULLS LAST,record_id`;
    const ids=new Set((await tx.rows(query,[projectId])).map(row=>String(row.cells.momTaskId)));
    for (const plan of plans) {
      let history;
      try {history=JSON.parse(plan.history||'[]');} catch {continue;}
      if (!Array.isArray(history)) continue;
      for (const visit of history) await ensureVisitMomActions(tx,projectId,plan,visit,ids);
    }
    return (await tx.rows(query,[projectId])).map(row=>row.cells);
  });
}

export async function updateMomTask(p,{database=db,user,env=process.env}) {
  const projectId=text(p.projectId),id=text(p.momTaskId);
  requireProject(user,projectId,{write:true});
  if (!id) throw failure('Choose a MOM task.');
  return database.transaction(async tx=>{
    if (!await projectRow(tx,projectId)) throw failure('Project not found.',404);
    const rows=await tx.rows("SELECT record_id,cells FROM enlighten_operational.mom_tasks WHERE cells->>'projectId'=$1 AND cells->>'momTaskId'=$2 LIMIT 2 FOR UPDATE",
      [projectId,id]);
    if (rows.length!==1) throw failure('MOM task not found for this project.',404);
    const prior=rows[0],patch={updatedAt:now()};
    if (p.owner!==undefined) {
      if (typeof p.owner!=='string'||p.owner.length>150) throw failure('Choose a valid responsible person.');
      if (p.expectedOwner!==undefined&&String(p.expectedOwner)!==String(prior.cells.owner||'')) {
        throw failure('Responsible person changed. Refresh MOM before assigning.',409);
      }
      const name=p.owner.trim();
      if (name) {
        const contacts=await tx.rows("SELECT cells FROM enlighten_operational.project_contacts WHERE cells->>'projectId'=$1",[projectId]);
        if (!contacts.some(row=>active(row.cells.active)&&text(row.cells.name||row.cells.company)===name)) {
          throw failure('Choose a responsible person from this project team.');
        }
      }
      patch.owner=name;
    }
    if (p.circuitToken!==undefined) {
      const circuit=p.circuitToken?await verifySiteExecution(tx,projectId,p.circuitToken,{user,env}):null;
      patch.circuitKey=circuit?.itemKey||'';
      patch.circuitLabel=circuit?[circuit.floor,circuit.zone,circuit.cn].filter(Boolean).join(' \u00b7 '):'';
    }
    if (Object.hasOwn(p,'completed')) {
      if (typeof p.completed!=='boolean') throw failure('Completed must be true or false.');
      patch.completed=p.completed;
      patch.completedAt=p.completed?(prior.cells.completedAt||patch.updatedAt):'';
      patch.completedBy=p.completed?(prior.cells.completedBy||actor(user)):'';
    }
    if (p.kind!==undefined) {
      if (!['Open','Follow-up'].includes(p.kind)) throw failure('Choose Open or Follow-up.');
      patch.kind=p.kind;
    }
    await tx.query('UPDATE enlighten_operational.mom_tasks SET cells=cells||$1::jsonb,updated_at=clock_timestamp() WHERE record_id=$2',
      [JSON.stringify(patch),prior.record_id]);
    return {...prior.cells,...patch};
  });
}

async function visitPoints(tx,p,context) {
  if (!Array.isArray(p.points)||!p.points.length||p.points.length>40) throw failure('Use between 1 and 40 MOM points.');
  const photoRows=await tx.rows('SELECT point_id,photo FROM enlighten_operational.mom_point_photos WHERE project_id=$1 AND visit_plan_id=$2 AND visit_id=$3',
    [p.projectId,p.visitPlanId,p.visitId]);
  const photosByKey=new Map(photoRows.map(row=>[JSON.stringify([row.point_id,String(row.photo.fileId)]),row.photo]));
  const ids=new Set(),points=[];
  for (const point of p.points) {
    const id=text(point?.id),message=text(point?.text);
    if (!/^[a-zA-Z0-9_-]{1,100}$/.test(id)||ids.has(id)) throw failure('Invalid or duplicate MOM point.');
    ids.add(id);
    if (!message||message.length>500) throw failure('Each MOM point needs text of up to 500 characters.');
    if (typeof point.action!=='boolean') throw failure('Choose whether this point creates a task.');
    const dueDate=String(point.dueDate||'');
    if (dueDate&&!validVisitDate(dueDate)) throw failure('Invalid point due date.');
    let circuit=null;
    if (point.circuit) {
      const meta=await verifySiteExecution(tx,p.projectId,point.circuit.token,context);
      circuit={key:meta.itemKey,label:[meta.floor,meta.zone,meta.cn].filter(Boolean).join(' \u00b7 '),cn:meta.cn,floor:meta.floor,zone:meta.zone};
    }
    if (!Array.isArray(point.photos)||point.photos.length>5) throw failure('Use up to five pictures per MOM point.');
    const seen=new Set(),photos=[];
    for (const source of point.photos) {
      const fileId=String(source?.fileId||'');
      if (seen.has(fileId)) throw failure('Duplicate picture in point.');
      seen.add(fileId);
      const match=source?.sourceDiaryEntryId?await diaryPhotoReference(tx,p.projectId,String(source.sourceDiaryEntryId),fileId):
        photosByKey.get(JSON.stringify([id,fileId]));
      if (!match) throw failure('A picture is not uploaded for this MOM point. Retry saving.');
      photos.push(match);
    }
    points.push({id,text:message,action:point.action,kind:point.kind==='Follow-up'?'Follow-up':'Open',
      owner:String(point.owner||'').slice(0,150),dueDate,circuit,photos});
  }
  return points;
}

export async function recordExecutionVisit(input,{database=db,user,env=process.env}) {
  const p={...input,projectId:text(input.projectId),visitPlanId:text(input.visitPlanId),visitId:text(input.visitId)};
  requireProject(user,p.projectId,{write:true,admin:true});
  if (!p.visitPlanId||!p.visitId||!text(p.visitBy)||!text(p.notes)) throw failure('Enter the visit MOM, discussion and actions.');
  if (!validVisitDate(p.date)) throw failure('Valid visit date required.');
  return database.transaction(async tx=>{
    if (!await projectRow(tx,p.projectId)) throw failure('Project not found.',404);
    const rows=await tx.rows("SELECT record_id,cells FROM enlighten_operational.execution_visits WHERE cells->>'projectId'=$1 AND cells->>'visitPlanId'=$2 LIMIT 2 FOR UPDATE",
      [p.projectId,p.visitPlanId]);
    if (rows.length!==1||String(rows[0].cells.active).toLowerCase()==='false') throw failure('Visit plan not found for this project.',404);
    const plan=rows[0].cells;
    await requireExecutionSignoff(tx,p.projectId,plan);
    const points=p.points===undefined?null:await visitPoints(tx,p,{user,env});
    const pointNotes=points?.map((row,index)=>String(index+1)+'. '+row.text).join('\n');
    if (pointNotes?.length>12000) throw failure('Keep this visit within 12,000 characters or log a separate visit.');
    const notes=pointNotes??String(p.notes),visitBy=String(p.visitBy),actionItems=cleanMomActions_(points?
      points.filter(row=>row.action).map(row=>({title:row.text,kind:row.kind,owner:row.owner,dueDate:row.dueDate})):
      Array.isArray(p.actionItems)?p.actionItems:momActionLines_(notes));
    let history;
    try {history=JSON.parse(plan.history||'[]');} catch {throw failure('Visit history could not be read.',409);}
    if (!Array.isArray(history)) throw failure('Invalid visit history.',409);
    let saved=history.find(row=>String(row.visitId)===p.visitId);
    const at=now(),by=actor(user);
    const canonical=value=>JSON.stringify(value,(_key,item)=>item&&typeof item==='object'&&!Array.isArray(item)?
      Object.fromEntries(Object.entries(item).sort(([a],[b])=>a.localeCompare(b))):item);
    if (saved) {
      const prior=points?(await tx.rows("SELECT cells FROM enlighten_operational.mom_visit_points WHERE cells->>'projectId'=$1 AND cells->>'visitId'=$2 ORDER BY (cells->>'position')::integer",
        [p.projectId,p.visitId])).map(row=>JSON.parse(row.cells.recordJson)):null;
      if (String(saved.notes)!==notes||String(saved.date)!==p.date||String(saved.visitBy)!==visitBy||points&&canonical(prior)!==canonical(points)) {
        throw failure('This visit was already saved. Reopen its history before logging another visit.',409);
      }
    } else {
      saved={...(points?{pointsVersion:1,pointCount:points.length}:{}),visitId:p.visitId,date:p.date,visitBy,notes,actionItems,
        coveredWork:visitCoverageList(plan.workItems,plan.milestone),coveredFloors:visitCoverageList(plan.floors,plan.floor),
        scheduledFor:String(p.scheduledFor||''),recordedAt:at,recordedBy:by};
      history.push(saved);
      if (JSON.stringify(history).length>48000) throw failure('This visit plan history is full. Add a new review to log this MOM.');
      if (points) {
        const prior=await tx.rows("SELECT 1 FROM enlighten_operational.mom_visit_points WHERE cells->>'projectId'=$1 AND cells->>'visitId'=$2 LIMIT 1",[p.projectId,p.visitId]);
        if (prior.length) throw failure('The saved MOM points differ. Reload the visit before trying again.',409);
        const records=points.map((point,position)=>{
          const recordJson=JSON.stringify(point);
          if (recordJson.length>35000) throw failure('This point has too much attachment metadata.');
          return {pointKey:[p.projectId,p.visitId,point.id].join('|'),projectId:p.projectId,visitPlanId:p.visitPlanId,visitId:p.visitId,
            pointId:point.id,position,recordJson,createdAt:at,createdBy:by};
        });
        await tx.query('INSERT INTO enlighten_operational.mom_visit_points (cells) SELECT value FROM jsonb_array_elements($1::jsonb)',[JSON.stringify(records)]);
      }
      const clearDate=p.scheduledFor&&String(plan.scheduledDate||'').slice(0,10)===String(p.scheduledFor);
      await tx.query('UPDATE enlighten_operational.execution_visits SET cells=cells||$1::jsonb,updated_at=clock_timestamp() WHERE record_id=$2',
        [JSON.stringify({history:JSON.stringify(history),...(clearDate?{scheduledDate:''}:{}),updatedAt:at,updatedBy:by}),rows[0].record_id]);
    }
    const existing=await tx.rows("SELECT cells->>'momTaskId' AS id FROM enlighten_operational.mom_tasks WHERE cells->>'projectId'=$1",[p.projectId]);
    await ensureVisitMomActions(tx,p.projectId,plan,saved,new Set(existing.map(row=>row.id)));
    const meetingDate=String(p.scheduledFor||p.date),actionText=(saved.actionItems||[]).map(row=>
      [row.kind==='Follow-up'?'Follow-up: '+row.title:row.title,row.owner,row.dueDate].filter(Boolean).join(' | ')).join('\n');
    await tx.query(`UPDATE enlighten_operational.project_meetings SET cells=cells||$1::jsonb,updated_at=clock_timestamp()
      WHERE cells->>'projectId'=$2 AND cells->>'visitPlanId'=$3 AND left(cells->>'date',10)=$4 AND lower(cells->>'active') IN ('true','yes','1','y')`,
      [JSON.stringify({happened:true,mom:saved.notes,actionItems:actionText,updatedAt:at,updatedBy:by}),p.projectId,p.visitPlanId,meetingDate]);
    return executionVisits(tx,p.projectId);
  });
}

export async function sendMomFollowup(p,{database=db,user,sendMail=sendMomMail}) {
  const projectId=text(p.projectId),id=text(p.momTaskId);
  requireProject(user,projectId,{write:true});
  if (!id) throw failure('Choose a MOM task.');
  const seen=new Set();
  const parse=value=>String(value||'').split(/[,;]+/).map(item=>item.trim()).filter(Boolean).filter(email=>{
    if (!/^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9-]+(?:\.[a-z0-9-]+)+$/i.test(email)) throw failure('Invalid recipient address.');
    const key=email.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  const to=parse(p.to),cc=parse(p.cc),bcc=parse(p.bcc),subject=text(p.subject),body=text(p.body);
  if (!to.length||seen.size>50||/[\r\n]/.test(subject)||!subject||!body||subject.length>200||body.length>8000) {
    throw failure('Add a To recipient, subject and message. Use up to 50 recipients.');
  }
  await database.transaction(async tx=>{
    const rows=await tx.rows(`SELECT 1 FROM enlighten_operational.mom_tasks t JOIN enlighten_operational.projects p
      ON p.cells->>'projectId'=t.cells->>'projectId' WHERE t.cells->>'projectId'=$1 AND t.cells->>'momTaskId'=$2 LIMIT 2`,[projectId,id]);
    if (rows.length!==1) throw failure('MOM task not found for this project.',404);
  },{readOnly:true});
  await sendMail({to,cc,bcc,subject,body});
  return {sent:true};
}
