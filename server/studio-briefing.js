import {randomUUID} from 'node:crypto';
import {db} from './supabase-db.js';
import {studioMember,studioRows,saveStudioRecord,internalAreaRows} from './studio-settings.js';
import {loadTimer,pauseTimer} from './wih-timers.js';
import {active,failure,text} from './project-write-storage.js';

export async function studioBriefing(p,{user,database=db,clock=Date.now}) {
  const uid=studioMember(user);
  if (!/^(admin|user)$/i.test(text(user.appAccess))) throw failure('Staff access required.',403);
  return database.transaction(async tx=>{
    await tx.query("SELECT pg_advisory_xact_lock(hashtext('enlighten_work_timers'))");
    const briefings=await studioRows(tx,'studio_briefings');
    const open=briefings.filter(item=>String(item.cells.openUserId)===uid);
    if (open.length>1) throw failure('Discussion timer is duplicated.',409);
    const prior=open[0],row=prior?.cells;
    const people=(await studioRows(tx,'people')).map(item=>item.cells)
      .filter(person=>person.userId&&active(person.active)&&/^(admin|user|viewer)$/i.test(text(person.appAccess)||'User'))
      .map(person=>({id:String(person.userId),name:text(person.name)||String(person.userId)}));
    const timer=(item,end)=>item?{id:String(item.id),start:item.start,end:end||'',
      ...(end?{participants:people.filter(person=>person.id!==uid)}:{})}:null;
    const timestamp=new Date(clock()).toISOString();
    if (p.action==='read') return timer(row,row?.end);
    if (p.action==='start') {
      if (row) return timer(row,row.end);
      const key=uid+'|'+new Date(Date.parse(timestamp)+19800000).toISOString().slice(0,10);
      const [day]=await tx.rows("SELECT cells FROM enlighten_operational.studio_attendance WHERE cells->>'key'=$1 LIMIT 1",[key]);
      if (day?.cells.checkOut) throw failure('Task timers are unavailable after attendance checkout.',409);
      if (day?.cells.breakStart) throw failure('Resume work from Attendance before starting a task timer.',409);
      const running=await tx.rows("SELECT cells->>'designTaskId' AS id FROM enlighten_operational.wih WHERE cells->>'assigneeUserId'=$1 AND cells->>'status'='In Progress' ORDER BY record_id",[uid]);
      for (const task of running) {
        await pauseTimer(tx,await loadTimer(tx,task.id,user,{attendanceOwner:uid}),user,timestamp,'');
      }
      const id=randomUUID();
      await saveStudioRecord(tx,'studio_briefings',null,{id,openUserId:uid,userId:uid,start:timestamp});
      return timer({id,start:timestamp},'');
    }
    if (p.action==='stop'&&row) {
      const end=row.end||timestamp;
      if (!row.end) await saveStudioRecord(tx,'studio_briefings',prior,{end});
      return timer(row,end);
    }
    if (p.action==='save'&&p.id&&String(row?.id)!==String(p.id)) {
      const saved=briefings.find(item=>String(item.cells.id)===String(p.id))?.cells;
      if (saved?.areaId&&!saved.openUserId&&String(saved.userId)===uid) return timer(row,row?.end);
      throw failure('Refresh Home to see the current discussion timer.',409);
    }
    if (p.action!=='save'||!row?.end) throw failure('Refresh Home to see the current discussion timer.',409);
    const narration=text(p.narration),selection=p.participantIds??[],eligible=new Set(people.map(person=>person.id));
    if (!narration||narration.length>2000) throw failure('Enter a narration up to 2,000 characters.');
    if (!Array.isArray(selection)||selection.some(id=>typeof id!=='string'||!eligible.has(id))) throw failure('Choose active team members.');
    const participantIds=[...new Set([uid,...selection])];
    const area=(await internalAreaRows(tx)).find(item=>text(item.name).toLowerCase()==='discussion');
    if (!area?.active) throw failure('Reopen the Discussion work area in Team & Tasks before saving.',409);
    const linked=new Set(briefings.map(item=>item.cells).filter(other=>!other.openUserId&&other.end&&String(other.areaId)===area.id&&
      String(other.userId)!==uid&&participantIds.includes(String(other.userId))&&JSON.parse(other.participantIds||'[]').includes(uid)&&
      Date.parse(row.start)<Date.parse(other.end)&&Date.parse(other.start)<Date.parse(row.end)).map(other=>String(other.discussionId||other.id)));
    await saveStudioRecord(tx,'studio_briefings',prior,{narration:/^[=+@-]/.test(narration)?"'"+narration:narration,
      areaId:area.id,discussionId:linked.size===1?[...linked][0]:String(row.id),participantIds:JSON.stringify(participantIds),openUserId:''});
    return null;
  });
}
