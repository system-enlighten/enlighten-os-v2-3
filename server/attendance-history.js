import {randomUUID} from 'node:crypto';
import {db} from './supabase-db.js';
import {isSystemAdmin,projectRoleFor,wihProjectRole} from './permissions.js';
import {studioMember,internalAreaRows,discussionLogs} from './studio-settings.js';
import {attendanceLabels} from './attendance-day.js';
import {siteCoordinates} from './home-agenda.js';
import {loadTimer,pauseTimer} from './wih-timers.js';
import {actor,failure,text} from './project-write-storage.js';

const clock=/^([01]\d|2[0-3]):[0-5]\d$/;
const dayOf=millis=>new Date(millis+19800000).toISOString().slice(0,10);
const date=value=>/^\d{4}-\d{2}-\d{2}$/.test(value)&&Number.isFinite(Date.parse(value))&&new Date(value).toISOString().slice(0,10)===value;
const safe=value=>/^[=+@-]/.test(value)?"'"+value:value;
const table=name=>'enlighten_operational.'+name;
const read=async(tx,name)=>(await tx.rows('SELECT cells FROM '+table(name)+' ORDER BY source_row_number NULLS LAST,record_id')).map(row=>row.cells);
const add=(tx,name,row)=>tx.query('INSERT INTO '+table(name)+' (cells) VALUES ($1::jsonb)',[JSON.stringify(row)]);
const update=(tx,name,id,row)=>tx.query('UPDATE '+table(name)+' SET cells=cells||$1::jsonb,updated_at=clock_timestamp() WHERE record_id=$2',[JSON.stringify(row),id]);
const iso=value=>new Date(value).toISOString();
const internal=id=>/^__(?:internal_(?:os|center|ops|discussion|custom_[a-f0-9-]{36})|admin_work)__$/.test(id);
const list=value=>JSON.parse(value||'[]');

async function leave(tx,p,user,uid,admin,viewer,stamp) {
  const tableName='studio_leave_requests';
  if (p.action==='leaveApply') {
    const from=text(p.from),to=text(p.to),reason=text(p.reason);
    if (viewer||!date(from)||!date(to)||from>to||!reason||reason.length>250) throw failure('Enter valid leave dates and a reason from an employee account.');
    const rows=await read(tx,tableName);
    if (rows.some(row=>String(row.userId)===uid&&row.status!=='Declined'&&String(row.from).slice(0,10)<=to&&String(row.to).slice(0,10)>=from)) {
      throw failure('A request already covers part of this period.',409);
    }
    await add(tx,tableName,{id:randomUUID(),userId:uid,employee:actor(user),from,to,reason:safe(reason),status:'Pending',submittedAt:stamp});
  } else if (p.action==='leaveReview') {
    if (!admin||!['Approved','Declined'].includes(p.status)) throw failure('Admin access required.',403);
    const rows=await tx.rows("SELECT record_id,cells FROM "+table(tableName)+" WHERE cells->>'id'=$1 LIMIT 2 FOR UPDATE",[text(p.id)]);
    if (rows.length!==1||rows[0].cells.status!=='Pending') throw failure('This request is no longer pending.',409);
    await update(tx,tableName,rows[0].record_id,{status:p.status,reviewedAt:stamp,reviewedBy:actor(user)});
  }
  return (await read(tx,tableName)).filter(row=>admin||String(row.userId)===uid)
    .map(row=>({...row,from:String(row.from).slice(0,10),to:String(row.to).slice(0,10)})).reverse();
}

async function trackedWork(tx,uid,today,day,now,tasks) {
  const labels=new Map(tasks.map(row=>[String(row.designTaskId),row.taskType]));
  const work=(await read(tx,'work_log')).filter(row=>String(row.userId)===uid)
    .map(row=>({start:row.startAt,end:row.endAt,title:labels.get(String(row.designTaskId))||'Task'}));
  if (day===today) {
    const timers=(await read(tx,'wih')).filter(row=>String(row.assigneeUserId)===uid&&row.status==='In Progress'&&row.startAt);
    work.push(...timers.map(row=>({start:row.startAt,end:iso(now),title:labels.get(String(row.designTaskId))||'Task',running:true})));
  }
  const briefings=await read(tx,'studio_briefings');
  const label=row=>['Discussion',row.narration].filter(Boolean).join(' \u00b7 ');
  for (const row of discussionLogs(briefings)) if (row.participants.has(uid)) work.push({start:row.start,end:row.end,title:label(row)});
  for (const row of briefings) if (!row.areaId&&String(row.userId)===uid&&(row.end||day===today)) {
    work.push({start:row.start,end:row.end||iso(now),title:label(row),running:!row.end});
  }
  return work;
}

async function attendanceVisits(tx,user,uid,day,projects) {
  const names=new Map(projects.filter(row=>projectRoleFor(user,String(row.projectId))).map(row=>[String(row.projectId),row.projectName]));
  const visits=new Map();
  for (const row of await read(tx,'site_punch_ins')) {
    const id=String(row.punchId),pid=String(row.projectId);
    if (String(row.userId)!==uid||!names.has(pid)) continue;
    visits.set(id,{id,projectId:pid,projectName:names.get(pid),title:row.purpose,checkInAt:row.checkInAt,checkOutAt:row.checkOutAt,
      checkInLocation:siteCoordinates(row.checkInLocation),checkOutLocation:siteCoordinates(row.checkOutLocation)});
  }
  for (const row of await read(tx,'home_agenda_sessions')) {
    if (String(row.userId)!==uid||!(row.departedAt||row.punchId)) continue;
    let key;
    try {key=JSON.parse(row.key);} catch {continue;}
    if (!Array.isArray(key)||key[1]!==day||!names.has(key[2])) continue;
    const id=String(row.punchId||row.key),prior=visits.get(id);
    visits.set(id,{id,projectId:key[2],projectName:names.get(key[2]),...prior,departedAt:row.departedAt,
      checkInAt:prior?.checkInAt||row.startAt,checkOutAt:prior?.checkOutAt||row.endAt});
  }
  return [...visits.values()].filter(row=>[row.departedAt,row.checkInAt,row.checkOutAt].some(value=>{
    const time=Date.parse(value);
    return Number.isFinite(time)&&dayOf(time)===day;
  })).sort((a,b)=>Date.parse(a.departedAt||a.checkInAt||a.checkOutAt)-Date.parse(b.departedAt||b.checkInAt||b.checkOutAt));
}

export async function attendanceDay(p,{user,database=db,now=Date.now()}) {
  const requester=studioMember(user),role=text(user.appAccess).toLowerCase(),admin=role==='admin',viewer=role==='viewer';
  const uid=text(p.userId)||requester,action=p.action,canCorrectTimes=isSystemAdmin(user);
  if (!admin&&uid!==requester) throw failure('Attendance access required.',403);
  const readOnly=['read','workOptions','leaveList'].includes(action),today=dayOf(now),stamp=iso(now);
  return database.transaction(async tx=>{
    if (!readOnly) await tx.query("SELECT pg_advisory_xact_lock(hashtext('enlighten_work_timers'))");
    if (['leaveList','leaveApply','leaveReview'].includes(action)) return leave(tx,p,user,requester,admin,viewer,stamp);
    const projects=await read(tx,'projects'),tasks=await read(tx,'design_tasks');
    if (action==='workOptions') {
      const options=[...(await internalAreaRows(tx)).filter(row=>row.active).map(({id,name})=>({id,name})),
        ...projects.filter(row=>wihProjectRole(user,row.projectId)).map(row=>({id:String(row.projectId),name:row.projectName}))];
      const selected=options.find(row=>row.id===String(p.projectId||''));
      const available=selected?tasks.filter(row=>String(row.projectId)===selected.id&&(!internal(selected.id)||String(row.assigneeUserId)===requester||admin)):[];
      return {projects:options,tasks:available.filter(row=>!row.parentDesignTaskId&&row.taskType).map(row=>({
        name:row.taskType,subtasks:available.filter(child=>String(child.parentDesignTaskId)===String(row.designTaskId)&&child.taskType).map(child=>child.taskType)
      }))};
    }
    const day=text(p.day),key=uid+'|'+day,base=Date.parse(day+'T00:00:00+05:30'),limit=base+86400000;
    if (!date(day)||day>today) throw failure('Select a valid attendance date.');
    const rows=await tx.rows("SELECT record_id,cells FROM enlighten_operational.studio_attendance WHERE cells->>'key'=$1 LIMIT 2"+(readOnly?'':' FOR UPDATE'),[key]);
    if (rows.length>1) throw failure('Attendance record is duplicated.',409);
    const record=rows[0],row={...record?.cells},lo=Date.parse(row.checkIn);
    let hi=Math.min(Date.parse(row.checkOut)||now,limit),pending=Boolean(row.checkIn&&day<today&&!row.checkOut);
    const entries=list(row.entriesJson),breaks=list(row.breaksJson),tracked=await trackedWork(tx,uid,today,day,now,tasks);
    const at=value=>clock.test(value)?Date.parse(day+'T'+value+':00+05:30'):NaN;
    const overlaps=(a,b,r)=>a<Date.parse(r.end)&&b>Date.parse(r.start);
    const lastVerified=Math.max(lo,...entries.map(r=>at(r.end)),...breaks.map(r=>Date.parse(r.end)).filter(time=>time>lo&&time<=limit),
      ...tracked.filter(r=>!r.running&&overlaps(lo,limit,r)).map(r=>Date.parse(r.end)).filter(time=>time<=limit));
    if (pending) hi=lastVerified;
    if (['confirmCheckout','reopen','correctTimes'].includes(action)&&!canCorrectTimes) throw failure('Only the system administrator can correct attendance times.',403);
    const pause=async timestamp=>{
      const timers=await tx.rows("SELECT cells FROM enlighten_operational.wih WHERE cells->>'assigneeUserId'=$1 AND cells->>'status'='In Progress' ORDER BY record_id",[uid]);
      for (const {cells} of timers) if (day===today||Date.parse(cells.startAt)<=timestamp) {
        await pauseTimer(tx,await loadTimer(tx,String(cells.designTaskId),user,{attendanceOwner:uid}),user,iso(timestamp),'');
      }
    };
    const persist=async(patch,correction)=>{
      if (correction) await add(tx,'studio_attendance_corrections',{key,previous:row.checkOut||'',at:stamp,by:actor(user),...correction});
      await update(tx,'studio_attendance',record.record_id,patch);
      Object.assign(row,patch);
    };
    if (action==='correctTimes') {
      const reason=text(p.reason),start=at(text(p.start)),end=p.end?at(text(p.end)):null;
      if (!record||!reason||reason.length>250||!Number.isFinite(start)||start>now||
        end!==null&&(!Number.isFinite(end)||end<=start||end>now)||end===null&&row.checkOut) throw failure('Enter valid attendance times and a reason.');
      if (end!==null) {
        await pause(end);
        if (row.breakStart&&Date.parse(row.breakStart)<end) breaks.push({start:iso(row.breakStart),end:iso(end)});
      }
      const checkin=iso(start),checkout=end===null?'':iso(end);
      await persist({checkIn:checkin,checkOut:checkout,breakStart:checkout?'':row.breakStart,breaksJson:JSON.stringify(breaks)},
        {previousCheckIn:row.checkIn||'',reason:safe(reason),action:'times',checkout,checkin});
      return attendanceDay({...p,action:'read'},{user,database:{transaction:work=>work(tx)},now});
    }
    if (action==='confirmCheckout') {
      const end=at(text(p.end)),breakStart=Date.parse(row.breakStart);
      if (!pending||!Number.isFinite(end)||end<=lo||end<Math.max(lastVerified,breakStart||0)) {
        throw failure('Choose a time after check-in and at or after the last recorded activity.');
      }
      await pause(end);
      const checkout=iso(end);
      if (end>breakStart) breaks.push({start:iso(breakStart),end:checkout});
      await persist({checkOut:checkout,breakStart:'',breaksJson:JSON.stringify(breaks)},
        {reason:'Actual departure time confirmed',action:'checkout',checkout});
      pending=false;
      hi=end;
    } else if (action==='reopen') {
      const reason=text(p.reason);
      if (!record||!row.checkOut||!reason||reason.length>250) throw failure('Select a checked-out day and enter a reason.');
      await persist({checkOut:''},{reason:safe(reason)});
      pending=day<today;
      hi=pending?lastVerified:Math.min(now,limit);
    } else if (action==='entry') {
      if (pending||viewer||!record) throw failure('Confirm checkout and use an attendance record before logging manual work.',409);
      const start=text(p.start),end=text(p.end),note=text(p.note);
      if (!clock.test(start)||!clock.test(end)||start>=end||!note||note.length>250||entries.length>=40||!(at(start)>=lo&&at(end)<=hi)) {
        throw failure('Enter an activity and a valid range inside the attendance window.');
      }
      const blocked=row.breakStart&&!row.checkOut?[...breaks,{start:row.breakStart,end:iso(hi)}]:breaks;
      if ([...blocked,...tracked].some(item=>overlaps(at(start),at(end),item))||entries.some(item=>start<item.end&&end>item.start)) {
        throw failure('That range overlaps a break or logged work.',409);
      }
      entries.push({start,end,note,...await attendanceLabels(tx,p,user)});
      await persist({entriesJson:JSON.stringify(entries)});
    } else if (action!=='read') throw failure('Unknown attendance action.');
    if (row.breakStart&&!row.checkOut&&!pending&&Number.isFinite(hi)) breaks.push({start:row.breakStart,end:iso(hi)});
    const recent=(await read(tx,'studio_attendance')).filter(item=>String(item.userId)===uid&&item.checkIn)
      .map(item=>({...item,day:String(item.key||'').slice(uid.length+1)})).filter(item=>date(item.day)&&item.day<=today)
      .sort((a,b)=>b.day.localeCompare(a.day)).map(item=>({day:item.day,checkIn:item.checkIn,checkOut:item.checkOut,pending:item.day<today&&!item.checkOut}));
    const clip=items=>items.map(item=>({...item,start:Math.max(lo,Date.parse(item.start)),end:Math.min(hi,Date.parse(item.end))})).filter(item=>item.end>item.start);
    const corrections=(await read(tx,'studio_attendance_corrections')).filter(item=>String(item.key)===key)
      .map(({previous,at,by,reason,action,checkout,checkin})=>({previous,at,by,reason,action,checkout,checkin}));
    return {siteVisits:await attendanceVisits(tx,user,uid,day,projects),checkIn:row.checkIn||'',checkOut:pending?'':row.checkOut||'',pending,recent:recent.slice(0,30),
      missedDay:recent.find(item=>item.pending)?.day||'',people:admin?(await read(tx,'people')).filter(item=>item.userId).map(item=>({id:String(item.userId),name:item.name})):[],
      admin,canCorrectTimes,history:corrections,breaks:clip(breaks),tracked:clip(tracked),entries:entries.map(item=>({...item,start:at(item.start),end:at(item.end)})),
      lo:Number.isFinite(lo)?lo:null,hi:Number.isFinite(hi)?hi:null};
  },{readOnly});
}
