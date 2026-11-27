import {db} from './supabase-db.js';
import {checkProjectRead,requireProject} from './permissions.js';
import {active,failure,text} from './project-write-storage.js';

export function drawingFormat(fileName) {
  const ext=String(fileName||'').match(/\.([a-z0-9]+)$/i)?.[1]?.toUpperCase();
  return ext==='PDF'?'PDF':['DWG','DXF','DWT','DWF'].includes(ext)?'CAD':'';
}

function inferredCode(task,fileName) {
  const patterns=[['ZONES',/\bZONES?\b|\bZONING\b/],['RCP',/\bRCP\b/],['FLR',/\bFLR\b/],
    ['CIR',/\bCIR\b|\bCIRCUIT\b/],['IRF',/\bIRF?\b/],['DETAIL',/\bDETAIL\b/]];
  for (const input of [fileName,task.drawingCode,task.taskType,task.parentTask].filter(Boolean)) {
    const label=String(input).toUpperCase().replace(/FLRCIR?/g,'FLR / CIR');
    const codes=patterns.filter(([,pattern])=>pattern.test(label)).map(([code])=>code);
    if (codes.length) return codes.join(' / ');
  }
  return text(task.drawingCode||task.taskType||task.parentTask||'Drawing');
}

function metadata(record,task) {
  let coverage=[];
  try { coverage=JSON.parse(task.workflowCoverage||'[]'); } catch {}
  if (!Array.isArray(coverage)) coverage=[];
  const joined=field=>[...new Set(coverage.map(row=>String(row[field]||'')).filter(Boolean))].join(', ');
  const result={drawingCode:text(record.drawingCode||inferredCode(task,record.fileName)),
    floor:text(record.floor||task.floor||joined('floor')||'Project'),
    area:text(record.area||task.area||joined('area')||'All areas')};
  for (const [key,limit] of [['drawingCode',180],['floor',500],['area',2000]]) {
    if (!result[key]||result[key].length>limit) throw failure('Confirm the drawing code, floor and area in Work in Hand.');
  }
  return {...result,format:drawingFormat(record.fileName),fileName:record.fileName};
}

function series(drawing) {
  const normalize=value=>text(value).toLowerCase().split(/[,/]/).map(part=>text(part).replace(/\s+/g,' '))
    .filter(Boolean).sort().join('|');
  return [drawing.drawingCode,drawing.floor,drawing.area].map(normalize).join('::');
}

export function automaticIssueRevision(details,history) {
  const rows=history.filter(row=>series(details)===series(row));
  const revision=row=>Number(String(row.revision||'').match(/(?:rev\s*|r)?(\d+)/i)?.[1]??-1);
  const latest=rows.reduce((maximum,row)=>Math.max(maximum,revision(row)),-1);
  if (latest<0) return 'R0';
  const same=rows.filter(row=>revision(row)===latest);
  return 'R'+(same.some(row=>active(row.active))&&!same.some(row=>row.format===details.format)?latest:latest+1);
}

export async function drawingIssueContext(tx,projectId,driveFileId) {
  const files=(await tx.rows("SELECT record_id,cells FROM enlighten_operational.files WHERE cells->>'projectId'=$1 ORDER BY source_row_number NULLS LAST,record_id",[projectId]));
  const source=files.find(row=>String(row.cells.driveFileId)===driveFileId);
  const record=source?.cells;
  if (!record||active(record.trashed)||record.linkedEntityType!=='Design Task'&&!record.drawingCode) {
    throw failure('Upload or complete this drawing through Work in Hand first so its drawing details are recorded.');
  }
  let task;
  if (record.linkedEntityType==='Design Task') {
    const [found]=await tx.rows("SELECT cells FROM enlighten_operational.design_tasks WHERE cells->>'projectId'=$1 AND cells->>'designTaskId'=$2 LIMIT 1",
      [projectId,String(record.linkedEntityId||'')]);
    task=found?.cells;
  }
  if (task&&!record.drawingCode&&!/completed|^done$/i.test(String(task.status))) throw failure('Complete this drawing task in Work in Hand before issuing.');
  const details=metadata(record,task||{taskType:record.drawingType});
  const issued=(await tx.rows("SELECT record_id,cells FROM enlighten_operational.issued_drawings WHERE cells->>'projectId'=$1 ORDER BY source_row_number NULLS LAST,record_id",[projectId]));
  const current=issued.find(row=>String(row.cells.sourceFileId)===driveFileId&&active(row.cells.active));
  const history=[...issued.map(row=>row.cells),...files.map(row=>row.cells)
    .filter(row=>active(row.historicalImport)&&!active(row.trashed)&&row.direction==='Sent')
    .map(row=>({...row,revision:row.revisionNo,active:false,format:drawingFormat(row.fileName)}))];
  return {details,source,task,current,revision:current?.cells.revision||automaticIssueRevision(details,history)};
}

export async function getIssueDrawingContext(payload,{user,database=db}) {
  const projectId=text(payload.projectId),driveFileId=text(payload.driveFileId);
  if (!projectId||!driveFileId) throw failure('Choose a project and drawing.');
  requireProject(user,projectId,{admin:true});
  return database.transaction(async tx=>{
    await checkProjectRead(tx,user,projectId);
    const {details,current,revision}=await drawingIssueContext(tx,projectId,driveFileId);
    return {...details,revision,alreadyIssued:Boolean(current)};
  },{readOnly:true});
}
