import {createHash,randomUUID} from 'node:crypto';
import {approveHistoricalEmailIntake} from './email-intake.js';
import {createIntakeMailbox,intakeAttachments} from './intake-mail.js';
import {projectRoleMap} from './permissions.js';
import {active,failure,now} from './project-write-storage.js';
import {isOperationalPreview} from './preview-isolation.js';
import {db} from './supabase-db.js';

const intakes='enlighten_operational.email_drawing_intakes';
const ledger='enlighten_operational.email_intake_messages';
const receipt='ENLIGHTEN AUTOMATED RECEIPT';
const labelName='ENLIGHTEN_DRAWINGS';
const studioDate=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit'});
const reference=/\[ENL-([a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12})\]/i;
const email=value=>String(value||'').trim().toLowerCase();
const address=value=>{
  const raw=String(value||'');
  const candidate=email(raw.match(/^[^<>]*<([^<>]+)>\s*$/)?.[1]||raw);
  return /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/.test(candidate)?candidate:'';
};
const header=(part,name)=>(part?.headers||[]).find(h=>h.name.toLowerCase()===name)?.value||'';
const payload=row=>JSON.parse(row.detailsJson||'{}');
const final=row=>['Uploaded','Cancelled'].includes(row.status);
const sizeError='Each email attachment must be non-empty and at most 20 MB. Use the app for larger files.';

function config(env) {
  const mailbox=address(env.EMAIL_INTAKE_ADDRESS);
  const allowed=new Set(String(env.EMAIL_ALLOWED_SENDERS||'').split(/[;,\s]+/).filter(Boolean).map(address));
  const since=Number(env.EMAIL_INTAKE_START_MS);
  if (!mailbox||!allowed.size||allowed.has('')||!Number.isSafeInteger(since)||since<=0) {
    throw failure('Configure the intake address, allowed senders and explicit start timestamp.',503);
  }
  const url=new URL(env.EMAIL_INTAKE_APP_URL||'');
  if (url.protocol!=='https:'||url.username||url.password||url.pathname!=='/'||url.search||url.hash||
      url.origin!==env.EMAIL_INTAKE_PREVIEW_ORIGIN) throw failure('Set the exact HTTPS Preview app origin for intake.',503);
  return {mailbox,allowed,since,origin:url.origin};
}

async function member(tx,address) {
  const rows=await tx.rows("SELECT cells FROM enlighten_operational.people WHERE lower(btrim(cells->>'email'))=$1 LIMIT 2",[address]);
  const user=rows[0]?.cells;
  if (rows.length!==1||!active(user.active)||!user.userId||!['user','admin'].includes(email(user.appAccess||'User'))) return null;
  const roles=await tx.rows("SELECT cells FROM enlighten_operational.project_roles WHERE cells->>'userId'=$1",[String(user.userId)]);
  return {...user,appAccess:user.appAccess||'User',email:address,active:true,authorized:true,authenticated:true,
    projectRoles:projectRoleMap(roles.map(row=>row.cells),String(user.userId))};
}

async function messageBody(mailbox,message) {
  async function plain(part) {
    if (part?.filename||/^(inline|attachment)/i.test(header(part,'content-disposition'))) return '';
    if (part?.mimeType==='text/plain') {
      const data=part.body?.attachmentId&&(part.body.size<=128000)
        ? (await mailbox.part(message.id,part.body.attachmentId)).data : part.body?.data;
      return Buffer.from(String(data||'').slice(0,172000),'base64url').toString('utf8');
    }
    for (const child of part?.parts||[]) {
      const body=await plain(child);
      if (body) return body;
    }
    return '';
  }
  return plain(message.payload);
}

function approvalFields(body) {
  const fields={};
  for (const line of body.split(/\r?\n/)) {
    if (/^\s*>|^On .+wrote:|^-+\s*(Original|Forwarded) message/i.test(line)) break;
    const match=line.match(/^\s*(Project|Floors|Type|Date|Confirm|Cancel)\s*:\s*(.*?)\s*$/i);
    if (match) fields[match[1].toLowerCase()]=match[2];
  }
  return fields;
}

async function updateIntake(tx,row,patch) {
  await tx.query(`UPDATE ${intakes} SET cells=cells||$1::jsonb,updated_at=clock_timestamp() WHERE record_id=$2`,
    [JSON.stringify({...patch,updatedAt:now()}),row.record_id]);
}

function mail(id,settings,recipient,token,body) {
  const key=createHash('sha256').update(settings.mailbox+'\0'+id).digest('hex');
  return {mailbox:settings.mailbox,recipient,subject:'[ENL-'+token+'] Drawing receipt',body:receipt+'\n\n'+body,
    messageId:key+'@'+settings.mailbox.split('@')[1]};
}

async function historical(message,token,body,tx,settings,actor,context) {
  // A From header alone must never authorize an administrative reply.
  if (!message.labelIds?.includes('SENT')||email(actor.appAccess)!=='admin') return null;
  const rows=await tx.rows(`SELECT record_id,cells FROM ${intakes} WHERE lower(cells->>'token')=$1 LIMIT 2`,[token.toLowerCase()]);
  const found=rows[0],row=found?.cells;
  if (rows.length!==1||row.status==='Cancelled'||(row.status==='Uploaded'&&row.pollerApprovalMessageId!==message.id)) return null;
  const data=payload(row);
  if (data.senderForm||address(data.approvalAddress||settings.mailbox)!==settings.mailbox) return null;
  const fields=approvalFields(body);
  if (/^yes$/i.test(fields.cancel)) {
    const locked=await tx.rows(`SELECT cells FROM ${intakes} WHERE record_id=$1 FOR UPDATE`,[found.record_id]);
    if (locked.length!==1||final(locked[0].cells)) return null;
    await updateIntake(tx,found,{status:'Cancelled',error:''});
    return mail(message.id,settings,settings.mailbox,row.token,'This drawing intake has been cancelled.');
  }
  let error='Reply with all fields and Confirm: YES when ready.';
  if (/^yes$/i.test(fields.confirm)) {
    try {
      const {status}=await context.approve({intakeId:row.intakeId,token:row.token,project:fields.project,
        floors:String(fields.floors||'').split(','),date:fields.date,type:fields.type,approvalMessageId:message.id},{
        user:actor,database:context.database,env:context.env,
        readAttachments:async id=>intakeAttachments(await context.mailbox.message(id),context.mailbox),notify:async()=>{}
      });
      if (status==='Uploaded') {
        const saved=await tx.rows(`SELECT cells FROM ${intakes} WHERE record_id=$1`,[found.record_id]);
        const files=payload(saved[0].cells).files;
        return mail(message.id,settings,settings.mailbox,row.token,'Uploaded and logged in Received / Sent. Awaiting classification.\n\n'+
          files.map(file=>file.name+'\n'+file.url).join('\n\n'));
      }
    } catch (cause) {
      if (!cause.statusCode||cause.statusCode>=500) throw cause;
      error=cause.message.slice(0,500);
    }
  }
  const locked=await tx.rows(`SELECT cells FROM ${intakes} WHERE record_id=$1 FOR UPDATE`,[found.record_id]);
  if (locked.length!==1||final(locked[0].cells)) return null;
  await updateIntake(tx,found,{status:'Needs attention',error});
  return historicalQuestion(tx,message.id,settings,row,data,error);
}

async function historicalQuestion(tx,id,settings,row,data,error='') {
  const projects=await tx.rows("SELECT cells FROM enlighten_operational.projects WHERE lower(coalesce(cells->>'projectStatus',''))<>'completed'");
  const open=projects.map(({cells})=>cells).filter(p=>!active(p.completed));
  const suggested=open.filter(project=>project.projectNo&&data.files?.some(file=>email(file.name).includes(email(project.projectNo))));
  return mail(id,settings,settings.mailbox,row.token,(error?error+'\n\n':'')+'Drawing sent by: '+row.sender+
    '\nReceived files:\n'+(data.files||[]).map(file=>file.name).join('\n')+
    '\n\nProject: '+(data.projectId||(suggested.length===1?suggested[0].projectNo:'ENTER PROJECT NUMBER'))+
    '\nFloors: '+(data.floors||[]).join(', ')+'\nType: '+(data.drawingType||'ENTER DRAWING TYPE')+
    '\nDate: '+(data.date||studioDate.format(new Date()))+'\nConfirm: YES\n\nReply with YYYY-MM-DD and comma-separated floors, or Cancel: YES.'+
    '\n\nAvailable ongoing projects:\n'+open.map(p=>(p.projectNo||p.projectId)+' — '+p.projectName).join('\n'));
}

async function stage(message,tx,settings,context) {
  const seen=await tx.rows(`SELECT 1 FROM ${ledger} WHERE cells->>'messageId'=$1 LIMIT 1`,[message.id]);
  if (seen.length) return false;
  const sender=address(header(message.payload,'from'));
  const ref=header(message.payload,'subject').match(reference);
  let notice=null;
  if (ref?sender===settings.mailbox&&message.labelIds?.includes('SENT'):settings.allowed.has(sender)&&!message.labelIds?.includes('DRAFT')) {
    const user=await member(tx,sender);
    const body=user?await messageBody(context.mailbox,message):'';
    if (user&&!body.startsWith(receipt)) {
      notice=ref?await historical(message,ref[1],body,tx,settings,user,context):await stageDrawing(message,tx,settings,sender,context);
    }
  }
  await tx.query(`INSERT INTO ${ledger} (cells) VALUES ($1::jsonb)`,
    [JSON.stringify({messageId:message.id,updatedAt:now(),...(notice?{pollerNotice:notice}:{})})]);
  return true;
}

async function stageDrawing(message,tx,settings,sender,context) {
  const previous=await tx.rows(`SELECT record_id,cells FROM ${intakes} WHERE cells->>'sourceMessageId'=$1 LIMIT 2 FOR UPDATE`,[message.id]);
  if (previous.length>1) throw failure('Duplicate source message requires intake reconciliation.',409);
  const existing=previous[0];
  if (existing&&existing.cells.status!=='Preparing questions') return null;
  const files=intakeAttachments(message,context.mailbox).flatMap(({name,size},index)=>
    /\.(pdf|dwg|dxf|dwt|dwf|jpe?g|png)$/i.test(name)?[{name,size,index,drawingId:'MAIL-'+message.id+'-'+index}]:[]);
  if (!files.length&&!existing) return null;
  const data=existing?payload(existing.cells):{files,senderForm:true,approvalAddress:sender,date:studioDate.format(new Date(Number(message.internalDate)))};
  if (!data.senderForm) {
    if (address(data.approvalAddress||settings.mailbox)!==settings.mailbox) return null;
    await updateIntake(tx,existing,{status:'Awaiting confirmation',error:''});
    return historicalQuestion(tx,message.id,settings,existing.cells,data);
  }
  const error=data.files.length>30?'Send up to 30 drawings in one email.':
    data.files.some(file=>!Number.isSafeInteger(file.size)||file.size<1||file.size>20*1024*1024)?sizeError:'';
  const token=existing?.cells.token||randomUUID();
  if (!reference.test('[ENL-'+token+']')) throw failure('Invalid stored intake reference.',409);
  const patch={status:error?'Needs attention':'Awaiting confirmation',error};
  if (existing) await updateIntake(tx,existing,patch);
  else await tx.query(`INSERT INTO ${intakes} (cells) VALUES ($1::jsonb)`,[JSON.stringify({
    intakeId:'MAIL-'+message.id,sourceMessageId:message.id,sender,token,detailsJson:JSON.stringify(data),
    createdAt:now(),updatedAt:now(),...patch
  })]);
  return mail(message.id,settings,sender,token,error||'Drawing received: '+data.files.map(file=>file.name).join(', ')+
    '\n\nSign in with '+sender+' and open Received / Sent → Incoming email drawings. Select the drawing, project, floor, type and date, then confirm.'+
    '\n'+settings.origin+'/#email-intake\n\nNo file is registered until you confirm. All attachments use the same details.');
}

function rawNotice(notice,sender) {
  const encode=value=>Buffer.from(value).toString('base64');
  return Buffer.from(['From: enLIGHTen Drawing Assistant <'+sender+'>','Reply-To: '+sender,'To: '+notice.recipient,
    'Subject: '+notice.subject,'Message-ID: <'+notice.messageId+'>','MIME-Version: 1.0','Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: base64','',encode(notice.body).match(/.{1,76}/g).join('\r\n')].join('\r\n')).toString('base64url');
}

async function deliver(database,mailbox,settings,result,deadline) {
  const rows=await database.rows(`SELECT record_id,cells->'pollerNotice' AS notice FROM ${ledger}
    WHERE cells ? 'pollerNotice' AND NOT (cells ? 'pollerDeliveredAt') AND cells->'pollerNotice'->>'mailbox'=$1
    ORDER BY (cells ? 'pollerSendAttemptAt'),record_id LIMIT 20`,[settings.mailbox]);
  for (const row of rows) {
    if (Date.now()>deadline) return;
    try {
      const notice=row.notice;
      if (notice.recipient!==settings.mailbox&&!settings.allowed.has(notice.recipient)) continue;
      if (!(await database.transaction(async tx=>{
        const lock=await tx.rows("SELECT pg_try_advisory_xact_lock(hashtextextended($1,0)) AS acquired",['mail-notice:'+row.record_id]);
        if (!lock[0]?.acquired) return false;
        const current=await tx.rows(`SELECT cells FROM ${ledger} WHERE record_id=$1`,[row.record_id]);
        if (!current.length||current[0].cells.pollerDeliveredAt) return false;
        const sent=await mailbox.sent(notice.messageId);
        if (sent.messages?.length) {
          await markDelivered(tx,row.record_id);
          return false;
        }
        // Persist intent before Gmail. After an ambiguous response, reconcile Sent before any manual retry.
        if (current[0].cells.pollerSendAttemptAt) {
          result.uncertain++;
          return false;
        }
        if (!await member(tx,notice.recipient)) return false;
        await tx.query(`UPDATE ${ledger} SET cells=cells||$1::jsonb,updated_at=clock_timestamp() WHERE record_id=$2`,
          [JSON.stringify({pollerSendAttemptAt:now()}),row.record_id]);
        return true;
      }))) continue;
      await mailbox.send(rawNotice(notice,settings.mailbox));
      await markDelivered(database,row.record_id);
      result.sent++;
    } catch {
      result.failed++;
    }
  }
}

async function markDelivered(executor,id) {
  await executor.query(`UPDATE ${ledger} SET cells=(cells-'pollerNotice')||$1::jsonb,updated_at=clock_timestamp() WHERE record_id=$2`,
    [JSON.stringify({pollerDeliveredAt:now()}),id]);
}

export async function pollDrawingMailbox({env=process.env,database=db,mailbox,approve=approveHistoricalEmailIntake,pageToken}={}) {
  if (env.EMAIL_INTAKE_POLL_ENABLED!=='1') return {disabled:true};
  if (!isOperationalPreview(env)||env.SUPABASE_DIRECT_OPERATIONAL_WRITES!=='1') throw failure('Isolated Preview is required for mailbox polling.',503);
  const settings=config(env);
  mailbox??=createIntakeMailbox({env});
  const profile=await mailbox.profile();
  // The explicit test mailbox identity is separate from the receiving address, which may be a verified alias.
  if (!address(env.EMAIL_INTAKE_PREVIEW_MAILBOX)||address(profile.emailAddress)!==address(env.EMAIL_INTAKE_PREVIEW_MAILBOX)) {
    throw failure('Gmail OAuth identity does not match the isolated test mailbox.',503);
  }
  if (address(profile.emailAddress)!==settings.mailbox&&!(await mailbox.aliases()).sendAs?.some(item=>
    address(item.sendAsEmail)===settings.mailbox&&item.verificationStatus==='accepted')) {
    throw failure('Receiving address is not a verified Gmail send-as alias.',503);
  }
  const approved=await database.transaction(async tx=>email((await member(tx,settings.mailbox))?.appAccess)==='admin',{readOnly:true});
  if (!approved) throw failure('The receiving mailbox must be an active Team Master admin.',503);
  const label=(await mailbox.labels()).labels?.find(item=>item.name===labelName&&item.type==='user');
  if (!label) throw failure('The drawing intake Gmail label is missing.',503);
  const deadline=Date.now()+220000;
  const result={processed:0,sent:0,failed:0,uncertain:0};
  const page=await mailbox.threads(label.id,pageToken);
  const context={database,mailbox,env,approve};
  scan: for (const entry of page.threads||[]) {
    if (result.processed>=20||Date.now()>deadline) {
      result.resumePageToken=pageToken||'';
      break;
    }
    const thread=await mailbox.thread(entry.id);
    for (const message of thread.messages||[]) {
      if (result.processed>=20||Date.now()>deadline) {
        result.resumePageToken=pageToken||'';
        break scan;
      }
      const timestamp=Number(message.internalDate);
      if (!/^[a-z0-9_-]{1,180}$/i.test(message.id||'')||!Number.isSafeInteger(timestamp)||timestamp<settings.since) continue;
      try {
        const processed=await database.transaction(async tx=>{
          const lock=await tx.rows("SELECT pg_try_advisory_xact_lock(hashtextextended($1,0)) AS acquired",['drawing-mailbox-poll']);
          if (!lock[0]?.acquired) return false;
          return stage(message,tx,settings,context);
        });
        if (processed) result.processed++;
      } catch {
        result.failed++;
      }
    }
  }
  if (result.resumePageToken===undefined&&page.nextPageToken) result.nextPageToken=page.nextPageToken;
  await deliver(database,mailbox,settings,result,deadline);
  return result;
}
