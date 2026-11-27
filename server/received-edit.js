import {db} from './supabase-db.js';
import {requireProject} from './permissions.js';
import {active,actor,failure,now,projectRow,text,updateRecord,writeActivity} from './project-write-storage.js';

const aliases={
  LAYOUT:['LAYOUT','LAYOUT / FLOOR PLAN','FLOOR PLAN'],
  WE:['WE','WALL ELECTRICAL','WALL ELECTRICAL DRAWING','WALL ELECTRICAL DRAWINGS'],
  FC:['FC','FALSE CEILING','FALSE CEILING DRAWING','FALSE CEILING DRAWINGS','REFLECTED CEILING PLAN'],
  DETAIL:['DETAIL','DETAILS','DETAIL DRAWING','DETAIL DRAWINGS'],
  '3D':['3D','3D RENDER','3D RENDERS'],
  FURNITURE:['FURNITURE','FURNITURE DRAWING','FURNITURE DRAWINGS','FURNITURE / JOINERY','WALL ELEVATION',
    'WALL ELEVATIONS','WALL ELEVATION DRAWING','WALL ELEVATION DRAWINGS']
};
const fixed=new Set(['LAYOUT','WE','FC','DETAIL','3D']);
export const normalizeType=value=>{
  const label=text(value).toUpperCase();
  return Object.keys(aliases).find(type=>aliases[type].includes(label))||label;
};

async function typeSupported(tx,projectId,type) {
  const normalized=normalizeType(type);
  if (fixed.has(normalized)) return true;
  const master=await tx.rows('SELECT cells FROM enlighten_operational.drawing_task_master');
  if (master.some(({cells})=>normalizeType(cells.drawingType)===normalized)) return true;
  const workflow=await tx.rows("SELECT cells FROM enlighten_operational.line_of_work WHERE cells->>'projectId'=$1",[projectId]);
  return workflow.some(({cells})=>active(cells.active)&&normalizeType(cells.triggerDrawingType)===normalized&&
    (String(cells.workflowVersion)==='2'||String(cells.workflowVersion)==='1'&&cells.scope!=='Project'&&cells.subtask&&cells.triggerTaskType));
}

export async function editReceivedDrawing(payload,{user,database=db}) {
  const projectId=text(payload.projectId),drawingId=text(payload.drawingId);
  if (!projectId||!drawingId) throw failure('Choose a project and received drawing.');
  requireProject(user,projectId,{write:true,admin:true});
  const floors=[...new Set((Array.isArray(payload.floors)?payload.floors:[]).map(text).filter(Boolean))];
  const type=text(payload.drawingType),date=String(payload.receivedSentDate||'');
  if (!floors.length||!type) throw failure('Select floors and drawing type.');
  const today=new Date(Date.now()+330*60000).toISOString().slice(0,10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)||!Number.isFinite(Date.parse(date))||
      new Date(date).toISOString().slice(0,10)!==date||date>today) throw failure('Select a valid received date on or before today.');
  return database.transaction(async tx=>{
    if (!await projectRow(tx,projectId)) throw failure('Project not found.',404);
    const matches=await tx.rows("SELECT record_id,cells FROM enlighten_operational.drawing_register WHERE cells->>'drawingId'=$1 LIMIT 2 FOR UPDATE",[drawingId]);
    const prior=matches[0],old=prior?.cells;
    if (matches.length!==1||old.projectId!==projectId||active(old.trashed)||String(old.direction||'Received').toLowerCase()!=='received') {
      throw failure('Received drawing not found.',404);
    }
    const previous=String(old.floor||'').split(',').map(text).filter(Boolean).sort();
    const retag=JSON.stringify([...floors].sort())!==JSON.stringify(previous)||normalizeType(type)!==normalizeType(old.drawingType);
    if (retag&&active(old.classified)) throw failure('This entry is already classified. Floor and type changes require reviewing its linked work.',409);
    if (retag) {
      const zones=await tx.rows("SELECT cells FROM enlighten_operational.floor_zones WHERE cells->>'projectId'=$1",[projectId]);
      const available=new Set(zones.filter(row=>active(row.cells.active)).map(row=>String(row.cells.floor)));
      if (floors.some(floor=>!available.has(floor))) throw failure('Choose floors configured in Floor / Zone.');
      if (!await typeSupported(tx,projectId,type)) throw failure('Unsupported drawing type.');
    }
    const shared={floor:floors.join(', '),floorTags:JSON.stringify(floors),drawingType:type,receivedSentDate:date,revisionNo:String(payload.revisionNo||'')};
    const patch={...shared,receivedFromSentTo:String(payload.receivedFromSentTo||''),notes:String(payload.notes||''),
      updatedAt:now(),updatedBy:actor(user)};
    await updateRecord(tx,'drawing_register',prior.record_id,patch);
    await tx.query(`UPDATE enlighten_operational.files SET cells=cells||$3::jsonb,updated_at=clock_timestamp()
      WHERE cells->>'projectId'=$1 AND cells->>'linkedEntityId'=$2`,[projectId,drawingId,JSON.stringify(shared)]);
    await writeActivity(tx,user,'EDIT','Drawing',drawingId,projectId,old,patch);
    return {saved:true};
  });
}
