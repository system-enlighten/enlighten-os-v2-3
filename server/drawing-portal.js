import {db} from './supabase-db.js';
import {createDriveAttachments} from './drive-attachments.js';
import {projectRoleFor,requireProject,requireStudio} from './permissions.js';
import {active,actor,failure,now,projectRow,text} from './project-write-storage.js';

const packagesAllowed=new Set(['All','General','Electrical','POP','Furniture','Kitchen','Stone']);
const filesClient=createDriveAttachments();
const normalize=value=>text(value).toLowerCase();

function list(value) {
  if (Array.isArray(value)) return value;
  try {
    const parsed=JSON.parse(value||'[]');
    return Array.isArray(parsed)?parsed:[];
  } catch { return []; }
}

function defaults(role) {
  const normalized=normalize(role);
  for (const [pattern,category] of [[/architect|interior designer|owner|client/,'All'],[/pop|false ceiling|ceiling contractor/,'POP'],
    [/electri|automation/,'Electrical'],[/furniture|joinery/,'Furniture'],[/kitchen/,'Kitchen'],[/stone|marble/,'Stone']]) {
    if (pattern.test(normalized)) return [category];
  }
  return [];
}

async function access(tx,email) {
  const rows=await tx.rows(`SELECT c.cells,setting.cells AS setting FROM enlighten_operational.project_contacts c
    LEFT JOIN LATERAL (
      SELECT p.cells FROM enlighten_operational.drawing_portal_access p
      WHERE p.cells->>'contactId'=c.cells->>'contactId' AND p.cells->>'projectId'=c.cells->>'projectId'
      ORDER BY p.source_row_number NULLS LAST,p.record_id LIMIT 1
    ) setting ON true WHERE lower(btrim(c.cells->>'email'))=$1
    ORDER BY c.source_row_number NULLS LAST,c.record_id`,[normalize(email)]);
  return rows.filter(({cells})=>active(cells.active)).map(({cells,setting})=>{
    const enabled=!setting||active(setting.enabled);
    return {contactId:cells.contactId,projectId:String(cells.projectId),name:cells.name,role:cells.role,enabled,
      packages:enabled?(setting?list(setting.packages):defaults(cells.role)):[],
      allowCad:enabled&&Boolean(setting)&&active(setting.allowCad)};
  });
}

export async function getDirectoryDrawingAccess(payload,{user,database=db}) {
  requireStudio(user);
  if (!text(payload.email)||normalize(user.appAccess)==='viewer') return [];
  const rows=await access(database,payload.email);
  return rows.filter(row=>projectRoleFor(user,row.projectId)==='Admin');
}

export async function saveDirectoryDrawingAccess(payload,{user,database=db}) {
  const projectId=text(payload.projectId),contactId=text(payload.contactId);
  if (!contactId||!projectId) throw failure('Choose a project and directory contact.');
  requireProject(user,projectId,{write:true,admin:true});
  const packages=list(payload.packages);
  if (packages.some(value=>!packagesAllowed.has(value))) throw failure('Unknown drawing package.');
  return database.transaction(async tx=>{
    if (!await projectRow(tx,projectId)) throw failure('Project not found.',404);
    const contacts=await tx.rows("SELECT cells FROM enlighten_operational.project_contacts WHERE cells->>'contactId'=$1 LIMIT 2 FOR SHARE",[contactId]);
    if (contacts.length!==1||String(contacts[0].cells.projectId)!==projectId||!active(contacts[0].cells.active)) {
      throw failure('Active directory contact not found for this project.',404);
    }
    const prior=await tx.rows("SELECT record_id,cells FROM enlighten_operational.drawing_portal_access WHERE cells->>'contactId'=$1 LIMIT 2 FOR UPDATE",[contactId]);
    if (prior.length>1||prior[0]&&String(prior[0].cells.projectId)!==projectId) throw failure('Contact project mismatch.',409);
    const row={contactId,projectId,enabled:active(payload.enabled),packages:JSON.stringify([...new Set(packages)]),
      allowCad:active(payload.allowCad),updatedAt:now(),updatedBy:actor(user)};
    if (prior[0]) await tx.query('UPDATE enlighten_operational.drawing_portal_access SET cells=cells||$1::jsonb,updated_at=clock_timestamp() WHERE record_id=$2::bigint',
      [JSON.stringify(row),prior[0].record_id]);
    else await tx.query('INSERT INTO enlighten_operational.drawing_portal_access (cells) VALUES ($1::jsonb)',[JSON.stringify(row)]);
    return {saved:true};
  });
}

function contractor(user) {
  if (!user?.authorized||user.appAccess!=='Contractor') throw failure('Directory portal account required.',403);
}

function visible(issue,grants,cad=false) {
  return active(issue.active)&&grants.some(grant=>grant.enabled&&grant.projectId===String(issue.projectId)&&
    (grant.packages.includes('All')||list(issue.packages).some(category=>grant.packages.includes(category)))&&(!cad||grant.allowCad));
}

export async function getDrawingPortal(_payload,{user,database=db}) {
  contractor(user);
  return database.transaction(async tx=>{
    const grants=await access(tx,user.email);
    const ids=[...new Set(grants.filter(row=>row.enabled).map(row=>row.projectId))];
    const projects=(await tx.rows("SELECT cells FROM enlighten_operational.projects WHERE cells->>'projectId'=ANY($1::text[]) ORDER BY source_row_number NULLS LAST,record_id",[ids]))
      .map(({cells})=>({id:cells.projectId,no:cells.projectNo,name:cells.projectName}));
    const drawings=(await tx.rows("SELECT cells FROM enlighten_operational.issued_drawings WHERE cells->>'projectId'=ANY($1::text[]) ORDER BY source_row_number NULLS LAST,record_id",[ids]))
      .map(row=>row.cells).filter(issue=>visible(issue,grants)).map(issue=>({
        issueId:issue.issueId,projectId:issue.projectId,fileName:issue.fileName,size:issue.size,format:issue.format,
        packages:list(issue.packages),drawingCode:issue.drawingCode,floor:issue.floor,area:issue.area,revision:issue.revision,
        issuedDate:issue.issuedDate,canDownload:issue.format==='PDF'||visible(issue,grants,true)
      }));
    return {projects,drawings,packages:[...new Set(grants.flatMap(grant=>grant.packages))]};
  },{readOnly:true});
}

export async function getPortalDrawingChunk(payload,{user,database=db,files=filesClient}) {
  contractor(user);
  const issue=await database.transaction(async tx=>{
    const grants=await access(tx,user.email);
    const matches=await tx.rows("SELECT cells FROM enlighten_operational.issued_drawings WHERE cells->>'issueId'=$1 LIMIT 2",[text(payload.issueId)]);
    if (matches.length!==1||!visible(matches[0].cells,grants,matches[0].cells.format==='CAD')) {
      throw failure('This drawing is locked or no longer available to your account.',403);
    }
    return matches[0].cells;
  },{readOnly:true});
  const total=Number(issue.size),offset=Number(payload.offset||0);
  if (!Number.isInteger(total)||total>100*1024*1024||!Number.isInteger(offset)||offset<0||offset>=total) {
    throw failure('Invalid file range or file exceeds 100 MB.');
  }
  const end=Math.min(total-1,offset+768*1024-1);
  const bytes=await files.range(issue.archiveFileId,offset,end,total);
  return {data:bytes.toString('base64'),offset,nextOffset:end+1,total,fileName:issue.fileName,
    mimeType:issue.mimeType||'application/octet-stream'};
}
