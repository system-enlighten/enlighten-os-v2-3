import {db} from './supabase-db.js';
import {projectRoleFor} from './permissions.js';
import {studioMember} from './studio-settings.js';
import {active,actor,failure,insertRecord,nextEntityId,updateRecord} from './project-write-storage.js';
import {meetingParticipantTokens_,resolveSiteVisitParticipants_} from './meeting-participants.js';

const tables=new Set(['projects','project_meetings','execution_visits','people','project_contacts','home_agenda_sessions','site_punch_ins']);
const rows=async(tx,name)=>{
  if (!tables.has(name)) throw Error('Unknown agenda table.');
  return (await tx.rows('SELECT cells FROM enlighten_operational.'+name+' ORDER BY source_row_number NULLS LAST,record_id')).map(row=>row.cells);
};
export function siteCoordinates(value) {
  if (typeof value==='string') {
    try {value=JSON.parse(value);} catch {return null;}
  }
  const {latitude,longitude,accuracy}=value||{};
  if (!Number.isFinite(latitude)||!Number.isFinite(longitude)||Math.abs(latitude)>90||Math.abs(longitude)>180) return null;
  return {latitude,longitude,accuracy:Number.isFinite(accuracy)&&accuracy>=0?Math.round(accuracy):null};
}

export async function homeAgenda(p,{user,database=db,clock=Date.now}) {
  const uid=studioMember(user),canWrite=!/^viewer$/i.test(user.appAccess),action=p.action;
  if (!['list','depart','start','end'].includes(action)) throw failure('Unknown schedule action.');
  if (action!=='list'&&!canWrite) throw failure('This account is view only.',403);
  const at=new Date(clock()).toISOString(),day=new Date(Date.parse(at)+19800000).toISOString().slice(0,10);
  return database.transaction(async tx=>{
    if (action!=='list') await tx.query('SELECT pg_advisory_xact_lock(hashtextextended($1,0))',['home-agenda:'+uid+'|'+day]);
    const projects=new Map((await rows(tx,'projects')).map(row=>[String(row.projectId),row.projectName]));
    const allowed=id=>projects.has(String(id))&&Boolean(projectRoleFor(user,String(id)));
    const all=(await rows(tx,'project_meetings')).filter(row=>allowed(row.projectId)&&String(row.date).slice(0,10)>=day&&String(row.active).toLowerCase()!=='false');
    const meetings=all.filter(row=>!active(row.happened)).map(row=>({id:'meeting:'+row.id,projectId:String(row.projectId),title:row.title,
      day:String(row.date).slice(0,10),time:row.time,endTime:row.endTime,site:/site|physical/i.test(String(row.meetingMode)),link:row.meetingLink||''}));
    const visits=(await rows(tx,'execution_visits')).filter(row=>allowed(row.projectId)&&String(row.scheduledDate).slice(0,10)>=day&&
      !all.some(meeting=>meeting.projectId===row.projectId&&meeting.visitPlanId===row.visitPlanId))
      .map(row=>({id:'visit:'+row.visitPlanId,projectId:String(row.projectId),title:row.title||row.milestone,day:String(row.scheduledDate).slice(0,10),site:true}));
    const staff=await rows(tx,'people'),contacts=await rows(tx,'project_contacts');
    const sources=new Map(all.map(row=>['meeting:'+row.id,row]));
    const items=[...meetings,...visits].map(item=>{
      if (!item.site) return item;
      const source=sources.get(item.id),members=resolveSiteVisitParticipants_(source,staff,contacts);
      const lead=members.find(person=>String(person.userId)===uid)||members[0];
      return {...item,leadId:String(lead?.userId||''),assignee:members.map(person=>person.name).join(', '),
        participantCount:meetingParticipantTokens_(source?.participants).length};
    }).filter(item=>!item.id.endsWith(':undefined')&&/^\d{4}-\d{2}-\d{2}$/.test(item.day))
      .sort((a,b)=>a.day.localeCompare(b.day)||String(a.time||'99').localeCompare(String(b.time||'99')));
    const key=item=>JSON.stringify([item.site?item.leadId:uid,day,item.projectId,item.id]);
    const sessions=new Map((await tx.rows("SELECT cells FROM enlighten_operational.home_agenda_sessions WHERE cells->>'userId'=$1",[uid]))
      .map(row=>[row.cells.key,row.cells]));
    if (action!=='list') {
      const item=items.find(row=>row.day===day&&row.id===p.id&&row.projectId===p.projectId);
      if (!item) throw failure('This item is no longer scheduled for today.',409);
      if (item.site&&item.leadId!==uid) throw failure('Only selected participants can record this site visit.',403);
      const sessionKey=key(item),location=item.site?siteCoordinates(p.location):null;
      const prior=await tx.rows("SELECT record_id,cells FROM enlighten_operational.home_agenda_sessions WHERE cells->>'key'=$1 LIMIT 2 FOR UPDATE",[sessionKey]);
      if (prior.length>1) throw failure('Agenda session is duplicated.',409);
      const found=prior[0],session=found?.cells;
      let patch;
      if (action==='depart') {
        if (!item.site) throw failure('Departure is available for site visits.');
        if (!found) patch={key:sessionKey,userId:uid,departedAt:at};
      } else if (action==='start'&&!session?.startAt) {
        if (item.site&&!session?.departedAt) throw failure('Record departure before checking in at site.',409);
        patch={key:sessionKey,userId:uid,departedAt:session?.departedAt||'',startAt:at,endAt:'',punchId:''};
        if (item.site) {
          patch.punchId=await nextEntityId(tx,'site_punch_ins');
          await insertRecord(tx,'site_punch_ins',{punchId:patch.punchId,projectId:item.projectId,userId:uid,person:actor(user),purpose:item.title,
            status:'Checked in',checkInAt:at,checkInLocation:location?JSON.stringify(location):'',updatedAt:at,updatedBy:actor(user)});
        }
      } else if (action==='end'&&session?.startAt&&!session.endAt) {
        if (session.punchId) {
          const punches=await tx.rows("SELECT record_id,cells FROM enlighten_operational.site_punch_ins WHERE cells->>'punchId'=$1 AND cells->>'userId'=$2 AND cells->>'projectId'=$3 LIMIT 2 FOR UPDATE",
            [session.punchId,uid,item.projectId]);
          if (punches.length===1&&!punches[0].cells.checkOutAt) await updateRecord(tx,'site_punch_ins',punches[0].record_id,
            {checkOutAt:at,checkOutLocation:location?JSON.stringify(location):'',status:'Checked out',updatedAt:at,updatedBy:actor(user)});
        }
        patch={endAt:at};
      }
      if (patch) {
        if (found) await updateRecord(tx,'home_agenda_sessions',found.record_id,patch);
        else await insertRecord(tx,'home_agenda_sessions',patch);
        sessions.set(sessionKey,{...session,...patch});
      }
    }
    const next=items.find(item=>item.day>day&&!item.site);
    return items.filter(item=>item.day===day||item===next||item.site).map(({leadId,...item})=>{
      const session=item.day===day?sessions.get(key({...item,leadId})):null;
      return {...item,isAssignedToMe:Boolean(leadId)&&leadId===uid,canAct:canWrite&&item.day===day&&(!item.site||leadId===uid),
        projectName:projects.get(item.projectId),availableToday:item.day===day,departedAt:session?.departedAt||'',startAt:session?.startAt||'',endAt:session?.endAt||''};
    });
  },{readOnly:action==='list'});
}
