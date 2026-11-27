const tables=new Set(['projects','project_contacts','floor_zones','line_of_work','activity_log','files','issued_drawings','drawing_register',
  'design_tasks','workflow_delegations','project_onboarding','project_closeout','drawing_task_master','wih_plans','personal_calendar_blocks',
  'historical_workflow_meetings','wih','design_dashboard','work_log','technical_workbooks','home_agenda_sessions','site_punch_ins','project_meetings','execution_visits']);
const identifiers={projects:['projectId','PRJ'],project_contacts:['contactId','CON'],floor_zones:['floorZoneId','FZ'],files:['fileId','FIL'],
  line_of_work:['lineWorkId','LOW'],drawing_task_master:['drawingTypeId','DT'],drawing_register:['drawingId','DRW'],
  design_tasks:['designTaskId','DSG'],site_punch_ins:['punchId','PUNCH'],wih:['wihId','WIH'],work_log:['workLogId','LOG'],design_dashboard:['dashboardRowId','DSH']};
export const failure=(message,statusCode=400)=>Object.assign(new Error(message),{statusCode});
export const text=value=>String(value??'').trim();
export const active=value=>!['false','no','0','n',''].includes(text(value).toLowerCase());
export const actor=user=>user.name||user.email;
export const now=()=>new Date().toISOString();

function relation(table) {
  if (!tables.has(table)) throw Error('Invalid project storage table.');
  return 'enlighten_operational.'+table;
}

export async function projectRow(tx,id) {
  const rows=await tx.rows("SELECT record_id,cells FROM enlighten_operational.projects WHERE cells->>'projectId'=$1 LIMIT 2 FOR UPDATE",[id]);
  if (rows.length>1) throw failure('Project ID is duplicated.',409);
  return rows[0];
}

export async function projectChildren(tx,table,id) {
  return tx.rows(`SELECT record_id,cells FROM ${relation(table)} WHERE cells->>'projectId'=$1
    ORDER BY source_row_number NULLS LAST,record_id FOR UPDATE`,[id]);
}

export async function updateRecord(tx,table,id,patch) {
  await tx.query(`UPDATE ${relation(table)} SET cells=cells||$1::jsonb,updated_at=clock_timestamp() WHERE record_id=$2::bigint`,
    [JSON.stringify(patch),id]);
}

export async function insertRecord(tx,table,row) {
  await tx.query(`INSERT INTO ${relation(table)} (cells) VALUES ($1::jsonb)`,[JSON.stringify(row)]);
}

export async function insertReturning(tx,table,row) {
  return (await tx.rows(`INSERT INTO ${relation(table)} (cells) VALUES ($1::jsonb) RETURNING record_id,cells`,[JSON.stringify(row)]))[0];
}

export async function nextEntityId(tx,table) {
  const spec=identifiers[table];
  if (!spec) throw Error('Invalid project sequence.');
  const [key,prefix]=spec;
  const [{value}]=await tx.rows(`INSERT INTO enlighten_operational.project_entity_sequences AS counters (entity,value)
    SELECT $1,coalesce(max(substring(cells->>$2 from $3)::bigint),0)+1 FROM ${relation(table)}
    ON CONFLICT (entity) DO UPDATE SET value=greatest(counters.value+1,excluded.value) RETURNING value`,
  [table,key,'^'+prefix+'-([0-9]+)$']);
  return prefix+'-'+String(value).padStart(6,'0');
}

export async function projectAudit(tx,user,action,projectId,before,after) {
  return writeActivity(tx,user,action,'Project',projectId,projectId,before,after);
}

export async function writeActivity(tx,user,action,entityType,entityId,projectId,before,after) {
  await tx.query('LOCK TABLE enlighten_operational.activity_log IN SHARE ROW EXCLUSIVE MODE');
  const [{id}]=await tx.rows(`SELECT coalesce(max(substring(cells->>'activityId' from '^ACT-([0-9]+)$')::bigint),0)+1 AS id
    FROM enlighten_operational.activity_log`);
  await insertRecord(tx,'activity_log',{activityId:'ACT-'+String(id).padStart(6,'0'),timestamp:now(),
    userId:user.userId,userName:actor(user),action,entityType,entityId,projectId,
    oldValueJson:before?JSON.stringify(before):'',newValueJson:after?JSON.stringify(after):'',source:'Enlighten OS API'});
}

export async function deleteProjectChildren(tx,table,id) {
  return (await tx.query(`DELETE FROM ${relation(table)} WHERE cells->>'projectId'=$1`,[id])).rowCount;
}
