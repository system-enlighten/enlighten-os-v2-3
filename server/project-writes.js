import {db} from './supabase-db.js';
import {createDriveAttachments,projectsDriveRoot} from './drive-attachments.js';
import {requireAdmin,requireProject} from './permissions.js';
import {replaceProjectContacts} from './project-location-writes.js';
import {configuredDriveRoot} from './project-drive.js';
import {actor,deleteProjectChildren,failure,insertRecord,nextEntityId,now,projectAudit,projectRow,text,updateRecord} from './project-write-storage.js';

const folders=['Base','Output','Received','Sent'];
const fields=new Set(['projectNo','projectName','client','architect','address','city','projectType','startDate',
  'plannedCompletionDate','currentStage','projectStatus','blocker','delayReason','basement','stiltFloor','gf','1f','2f','3f',
  'terrace','facade','wallElevation','artCuration','landscape','bathElevation','wardrobe','kitchen','onboarding','completionOutcome']);
const filesClient=createDriveAttachments();
const today=()=>new Date(Date.now()+330*60000).toISOString().slice(0,10);

function outcome(value) {
  const label=text(value);
  if (label&&!['survived','not_survived'].includes(label)) throw failure('Invalid completionOutcome: '+label);
  return label;
}

function selectedFields(payload) {
  return Object.fromEntries(Object.entries(payload).filter(([key])=>fields.has(key)));
}

export async function createProject(payload,{user,database=db,files=filesClient,env=process.env}) {
  requireAdmin(user);
  const projectName=text(payload.projectName);
  if (!projectName) throw failure('Project name is required.');
  const completionOutcome=outcome(payload.completionOutcome);
  const contacts=Array.isArray(payload.initialContacts)?payload.initialContacts:null;
  let folderId,readyToCommit=false,attemptedProject;
  try {
    return await database.transaction(async tx=>{
      await tx.query('SELECT pg_advisory_xact_lock(hashtextextended($1,0))',['create-project']);
      const id=text(payload.projectId)||await nextEntityId(tx,'projects');
      attemptedProject=id;
      const found=await projectRow(tx,id);
      if (found) {
        if (text(found.cells.projectName)!==projectName) throw failure('Project ID is already in use.',409);
        if (contacts) await replaceProjectContacts(tx,found.cells,contacts,user);
        return {...found.cells,initialContactsSaved:Boolean(contacts)};
      }
      const projectNo=text(payload.projectNo)||id.replace('PRJ-','');
      const duplicate=await tx.rows(`SELECT 1 FROM enlighten_operational.projects
        WHERE lower(btrim(cells->>'projectNo'))=lower($1) AND lower(btrim(cells->>'projectName'))=lower($2) LIMIT 1`,[projectNo,projectName]);
      if (duplicate.length) throw failure('A project with this number and name already exists.',409);
      const root=await configuredDriveRoot(tx,env);
      if (!root||!projectsDriveRoot(env)) throw failure('Project Drive root is not configured.',503);
      if (root!==projectsDriveRoot(env)) {
        const target=await files.metadata(root);
        if (target.trashed||!await files.within(target,projectsDriveRoot(env))) {
          throw failure('The configured project root is outside the preview Drive root.',403);
        }
      }
      folderId=await files.createFolder(root,projectNo+' - '+projectName);
      for (const name of folders) await files.createFolder(folderId,name);
      const at=now(),name=actor(user);
      const row={...selectedFields(payload),projectId:id,projectNo,projectName,projectStatus:payload.projectStatus||'Ongoing',
        completed:false,completedDate:'',completionOutcome,driveFolderId:folderId,
        createdAt:at,createdBy:name,updatedAt:at,updatedBy:name};
      await insertRecord(tx,'projects',row);
      if (contacts) await replaceProjectContacts(tx,row,contacts,user);
      await projectAudit(tx,user,'CREATE',id,null,row);
      readyToCommit=true;
      return {...row,initialContactsSaved:Boolean(contacts)};
    });
  } catch(error) {
    if (folderId) {
      try {
        const committed=readyToCommit&&await database.one(`SELECT 1 FROM enlighten_operational.projects
          WHERE cells->>'projectId'=$1 AND cells->>'driveFolderId'=$2 LIMIT 1`,[attemptedProject,folderId]);
        if (!committed) await files.trash(folderId);
      } catch(cleanupError) {
        console.error('Project folder cleanup could not be confirmed',cleanupError.name);
      }
    }
    throw error;
  }
}

async function modifyProject(payload,user,database,work) {
  const id=text(payload.projectId);
  if (!id) throw failure('Choose a project.');
  requireProject(user,id,{write:true,admin:true});
  return database.transaction(async tx=>{
    const prior=await projectRow(tx,id);
    if (!prior) throw failure('Project not found.',404);
    return work(tx,prior,id);
  });
}

export async function updateProject(payload,{user,database=db}) {
  return modifyProject(payload,user,database,async(tx,prior,id)=>{
    if (String(user.appAccess).toLowerCase()!=='admin'&&Object.keys(payload).some(key=>key!=='projectId'&&!fields.has(key))) {
      throw failure('Unsupported project field.');
    }
    const patch={...selectedFields(payload),updatedAt:now(),updatedBy:actor(user)};
    if (Object.hasOwn(patch,'completionOutcome')) patch.completionOutcome=outcome(patch.completionOutcome);
    if (Object.hasOwn(patch,'projectStatus')) {
      patch.completed=patch.projectStatus==='Completed';
      patch.completedDate=patch.completed?(prior.cells.completedDate||today()):'';
      if (!patch.completed) patch.completionOutcome='';
    }
    const updated={...prior.cells,...patch};
    await updateRecord(tx,'projects',prior.record_id,patch);
    await projectAudit(tx,user,'UPDATE',id,prior.cells,updated);
    return updated;
  });
}

export async function completeProject(payload,{user,database=db}) {
  return modifyProject(payload,user,database,(tx,prior)=>completeProjectRecord(tx,prior,payload.completionOutcome,user));
}

export async function completeProjectRecord(tx,prior,value,user) {
  const patch={completed:true,completedDate:today(),projectStatus:'Completed',
    completionOutcome:outcome(value)||prior.cells.completionOutcome||'',updatedAt:now(),updatedBy:actor(user)};
  const updated={...prior.cells,...patch};
  await updateRecord(tx,'projects',prior.record_id,patch);
  await projectAudit(tx,user,'COMPLETE',prior.cells.projectId,prior.cells,updated);
  return updated;
}

export async function deleteProject(payload,{user,database=db}) {
  requireAdmin(user);
  return modifyProject(payload,user,database,async(tx,prior,id)=>{
    const linkedRowsRemoved={contacts:await deleteProjectChildren(tx,'project_contacts',id),
      lineOfWork:await deleteProjectChildren(tx,'line_of_work',id),floorZones:await deleteProjectChildren(tx,'floor_zones',id)};
    await tx.query('DELETE FROM enlighten_operational.projects WHERE record_id=$1::bigint',[prior.record_id]);
    await projectAudit(tx,user,'DELETE',id,prior.cells,{deleted:true,linkedRowsRemoved});
    return {projectId:id,deleted:true,linkedRowsRemoved};
  });
}
