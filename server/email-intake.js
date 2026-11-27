import {createDriveAttachments} from './drive-attachments.js';
import {previewProjectFolder} from './drawing-publishing.js';
import {projectCategories} from './project-drive.js';
import {hasIntakeDrawingRule,loadDrawingWork} from './drawing-classification.js';
import {registerEmailDrawing} from './received-uploads.js';
import {validVisitDate} from './project-visits.js';
import {sendIntakeConfirmation,readIntakeAttachments} from './intake-mail.js';
import {db} from './supabase-db.js';
import {requireStudio,visibleProjectIds} from './permissions.js';
import {listDrawingTaskMaster} from './bootstrap-operational.js';
import {DRAWING_RULES} from './drawing-rules.js';
import {active,failure,now,projectChildren,projectRow,text} from './project-write-storage.js';

const emailDrive=createDriveAttachments();
const table='enlighten_operational.email_drawing_intakes';
const lower=value=>text(value).toLowerCase();
function access(user,write=false) {
  requireStudio(user);
  if (write&&!['admin','user'].includes(lower(user.appAccess))) throw failure('Active editable team access required.',403);
}
const details=row=>JSON.parse(row.detailsJson||'{}');

export async function listEmailDrawingIntakes(_p,{user,database=db}) {
  access(user);
  return database.transaction(async tx=>{
    const rows=await tx.rows(`SELECT cells FROM ${table} WHERE $1::boolean OR lower(btrim(cells->>'sender'))=$2
      ORDER BY coalesce(cells->>'createdAt','') DESC,record_id DESC LIMIT 100`,[lower(user.appAccess)==='admin',lower(user.email)]);
    return rows.map(({cells:row})=>{
      const data=details(row);
      return {id:row.intakeId,sender:row.sender,status:row.status,error:row.error,createdAt:row.createdAt,projectId:data.projectId||'',
        senderForm:Boolean(data.senderForm),canSubmit:Boolean(data.senderForm)&&lower(row.sender)===lower(user.email),
        date:data.date||'',floors:Array.isArray(data.floors)?data.floors:[],drawingType:data.drawingType||'',
        files:(data.files||[]).map(file=>({name:file.name,url:file.url||'',driveFileId:file.fileId||'',revisionNo:file.revisionNo||''}))};
    });
  },{readOnly:true});
}

export async function getEmailIntakeOptions(_p,{user,database=db}) {
  access(user,true);
  const allowed=visibleProjectIds(user);
  return database.transaction(async tx=>{
    const records=await tx.rows(`SELECT cells FROM enlighten_operational.projects WHERE ($1::text[] IS NULL OR cells->>'projectId'=ANY($1))
      ORDER BY source_row_number NULLS LAST,record_id`,[allowed]);
    const projects=records.map(row=>row.cells).filter(project=>!active(project.completed)&&lower(project.projectStatus)!=='completed')
      .map(project=>({id:String(project.projectId),no:String(project.projectNo||project.projectId),name:String(project.projectName||'')}));
    const ids=projects.map(project=>project.id),floors=Object.create(null);
    const zones=await tx.rows(`SELECT cells FROM enlighten_operational.floor_zones WHERE cells->>'projectId'=ANY($1::text[])
      ORDER BY source_row_number NULLS LAST,record_id`,[ids]);
    for (const {cells:zone} of zones) {
      const floor=text(zone.floor),id=String(zone.projectId);
      if (!floor||!active(zone.active)) continue;
      const values=floors[id]??=[];
      if (!values.includes(floor)) values.push(floor);
    }
    const master=await listDrawingTaskMaster({}, {user,database:tx});
    const types=[...new Set([...master.filter(item=>item.active).map(item=>String(item.drawingType)),...Object.keys(DRAWING_RULES)])].filter(Boolean);
    return {projects,floors,types};
  },{readOnly:true});
}

export async function cancelEmailIntake(p,{user,database=db}) {
  access(user,true);
  const id=text(p.intakeId);
  return database.transaction(async tx=>{
    const rows=await tx.rows("SELECT record_id,cells FROM "+table+" WHERE cells->>'intakeId'=$1 LIMIT 2 FOR UPDATE",[id]);
    const row=rows[0]?.cells;
    if (rows.length!==1||lower(row.sender)!==lower(user.email)&&lower(user.appAccess)!=='admin') throw failure('Email intake not found.',404);
    if (['Uploading','Uploaded'].includes(row.status)||(details(row).files||[]).some(file=>file.fileId)) {
      throw failure('Upload has already begun. Manage the received file in the register instead.',409);
    }
    if (row.status!=='Cancelled') await tx.query('UPDATE '+table+' SET cells=cells||$1::jsonb,updated_at=clock_timestamp() WHERE record_id=$2',
      [JSON.stringify({status:'Cancelled',error:'',updatedAt:now()}),rows[0].record_id]);
    return {cancelled:true};
  });
}

export function submitEmailIntake(p,context) {
  return commitEmailIntake(p,context);
}

// Worker-only entry point. Browser payloads cannot select the approval path.
export function approveHistoricalEmailIntake(p,context) {
  return commitEmailIntake(p,context,true);
}

async function commitEmailIntake(p,{user,database=db,files=emailDrive,env=process.env,readAttachments=readIntakeAttachments,notify=sendIntakeConfirmation},historical=false) {
  access(user,true);
  const intakeId=text(p.intakeId),projectSelector=lower(p.project),date=text(p.date),type=text(p.type);
  const floors=[...new Set((Array.isArray(p.floors)?p.floors:[]).map(text).filter(Boolean))];
  const allowed=visibleProjectIds(user),uploaded=[];
  let eligible=false;
  let confirmed;
  try {
    const result=await database.transaction(async tx=>{
      await tx.query('SELECT pg_advisory_xact_lock(hashtextextended($1,0))',['email-intake:'+intakeId]);
      const rows=await tx.rows("SELECT record_id,cells FROM "+table+" WHERE cells->>'intakeId'=$1 LIMIT 2 FOR UPDATE",[intakeId]);
      const found=rows[0],intake=found?.cells;
      if (rows.length!==1) throw failure('This drawing is not assigned to your account.',403);
      const data=details(intake);
      if (historical) {
        if (data.senderForm||lower(user.appAccess)!=='admin'||lower(user.email)!==lower(env.EMAIL_INTAKE_ADDRESS)||
          lower(data.approvalAddress||env.EMAIL_INTAKE_ADDRESS)!==lower(user.email)||intake.token!==p.token) {
          throw failure('Only the receiving mailbox can confirm this intake.',403);
        }
      } else {
        if (lower(intake.sender)!==lower(user.email)) throw failure('This drawing is not assigned to your account.',403);
        if (!data.senderForm) throw failure('This older intake must be confirmed by the receiving admin. Send a new email to use the sender form.',409);
      }
      if (intake.status==='Uploaded') return {status:'Uploaded'};
      if (intake.status==='Cancelled') throw failure('This intake was cancelled.',409);
      eligible=true;
      if (!Array.isArray(data.files)||!data.files.length||data.files.length>30||
        data.files.some(file=>!Number.isSafeInteger(file.size)||file.size<1||file.size>20*1024*1024)) {
        throw failure('Each email attachment must be non-empty and at most 20 MB.');
      }
      const projects=(await tx.rows("SELECT cells FROM enlighten_operational.projects WHERE ($1::text[] IS NULL OR cells->>'projectId'=ANY($1))",[allowed]))
        .map(row=>row.cells).filter(row=>!active(row.completed)&&lower(row.projectStatus)!=='completed'&&
          [row.projectId,row.projectNo,row.projectName].some(value=>lower(value)===projectSelector));
      if (!projectSelector||projects.length!==1) throw failure('Project was not uniquely matched. Select an ongoing project available to your account.');
      if (!floors.length||!validVisitDate(date)||!type) throw failure('Enter Floors and a valid Date in YYYY-MM-DD.');
      const projectId=String(projects[0].projectId),projectRowResult=await projectRow(tx,projectId),project=projectRowResult?.cells;
      if (!project||active(project.completed)||lower(project.projectStatus)==='completed') throw failure('Select an ongoing project.');
      const known=(await projectChildren(tx,'floor_zones',projectId)).filter(row=>active(row.cells.active)).map(row=>lower(row.cells.floor));
      if (floors.some(floor=>!known.includes(lower(floor)))) throw failure('Floors must match this project Floor / Zone names.');
      const state=await loadDrawingWork(tx,project,user);
      if (!hasIntakeDrawingRule(state,type)) throw failure('Drawing Type does not match the project drawing types.');
      const resumed=data.files.some(file=>file.fileId);
      if (resumed&&(String(data.projectId)!==projectId||data.date!==date||data.drawingType!==type||JSON.stringify(data.floors)!==JSON.stringify(floors))) {
        throw failure('Upload already began for another project. Forward a new email.',409);
      }
      const root=await previewProjectFolder(project,files,env),roots=await files.findFolders(root,projectCategories.Received);
      const received=roots[0]?.id||await files.getOrCreateFolder(root,'Received'),folder=await files.getOrCreateFolder(received,date);
      let attachments;
      for (const file of data.files) {
        if (!file.drawingId) throw failure('Original email drawing ID is unavailable.',409);
        let stored;
        if (file.fileId) {
          try {stored=await files.metadata(file.fileId);} catch(error) {if(error.statusCode!==404) throw error;}
          if (stored&&(stored.trashed||stored.name!==file.name||Number(stored.size)!==file.size||!stored.parents?.includes(folder))) {
            throw failure('Existing attachment does not match this project and intake.',409);
          }
        }
        if (!stored) {
          attachments??=await readAttachments(intake.sourceMessageId,{env});
          const attachment=attachments[file.index];
          if (!attachment||attachment.name!==file.name||attachment.size!==file.size) throw failure('Original email attachment no longer matches.',409);
          const bytes=await attachment.bytes();
          if (bytes.length!==file.size) throw failure('Original email attachment no longer matches.',409);
          stored=await files.upload(folder,{name:file.name,mimeType:attachment.mimeType||'application/octet-stream',bytes});
          stored.mimeType=attachment.mimeType||'application/octet-stream';
          uploaded.push(stored.id);
        }
        const saved=await registerEmailDrawing(tx,project,{drawingId:file.drawingId,fileName:file.name,mimeType:stored.mimeType||'application/octet-stream',
          drawingType:type,floors,receivedSentDate:date,receivedFrom:intake.sender,notes:'Received via email intake '+intakeId},stored,user);
        file.fileId=stored.id;
        file.url=saved.driveUrl;
      }
      Object.assign(data,{projectId,floors,date,drawingType:type});
      await tx.query('UPDATE '+table+' SET cells=cells||$1::jsonb,updated_at=clock_timestamp() WHERE record_id=$2',
        [JSON.stringify({status:'Uploaded',error:'',updatedAt:now(),detailsJson:JSON.stringify(data),
          ...(historical?{pollerApprovalMessageId:p.approvalMessageId}:{})}),found.record_id]);
      confirmed={token:intake.token,recipient:data.approvalAddress||env.EMAIL_INTAKE_ADDRESS,files:data.files};
      return {status:'Uploaded'};
    });
    if (confirmed?.recipient) await notify(confirmed,{env}).catch(()=>console.error('Email intake confirmation failed.'));
    return result;
  } catch(error) {
    await Promise.allSettled(uploaded.map(id=>files.trash(id)));
    if (eligible&&!historical) await database.query(`UPDATE ${table} SET cells=cells||$1::jsonb,updated_at=clock_timestamp()
      WHERE cells->>'intakeId'=$2 AND lower(btrim(cells->>'sender'))=$3 AND cells->>'status' NOT IN ('Uploaded','Cancelled')`,
    [JSON.stringify({status:'Needs attention',error:(error.statusCode?error.message:'Email attachment processing failed.').slice(0,500),updatedAt:now()}),intakeId,lower(user.email)]).catch(()=>{});
    throw error;
  }
}
