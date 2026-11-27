import {db} from './supabase-db.js';
import {requireProject} from './permissions.js';
import {resolveContactStaff} from './directory-operational.js';
import {active,actor,failure,insertRecord,nextEntityId,now,projectChildren,projectRow,text,updateRecord} from './project-write-storage.js';

export async function replaceProjectContacts(tx,project,contacts,user) {
  const table='project_contacts',id=project.projectId;
  const existing=await projectChildren(tx,table,id);
  const staff=(await tx.rows('SELECT cells FROM enlighten_operational.people')).map(row=>row.cells);
  const byRole=new Map(existing.map(row=>[String(row.cells.role||''),row]));
  const replacement=new Map();
  for (const contact of contacts) {
    if (!contact) continue;
    const role=text(contact.role),name=text(contact.name),company=text(contact.company);
    if (role&&(name||company)) replacement.set(role,{...contact,role,name,company});
  }
  const at=now(),name=actor(user);
  for (const [role,contact] of replacement) {
    const prior=byRole.get(role);
    const row={contactId:prior?.cells.contactId||await nextEntityId(tx,table),projectId:id,
      projectNo:project.projectNo||'',projectName:project.projectName||'',category:text(contact.category),role,
      name:contact.name,email:text(contact.email),mobile:text(contact.mobile),company:contact.company,rating:contact.rating||'',
      staffUserId:resolveContactStaff(contact,staff),active:true,updatedAt:at,updatedBy:name};
    if (prior) await updateRecord(tx,table,prior.record_id,row);
    else await insertRecord(tx,table,{...row,createdAt:at,createdBy:name});
  }
  for (const prior of existing) {
    if (prior.cells.role&&!replacement.has(String(prior.cells.role))&&active(prior.cells.active)) {
      await updateRecord(tx,table,prior.record_id,{active:false,updatedAt:at,updatedBy:name});
    }
  }
  return (await projectChildren(tx,table,id)).map(record=>record.cells).filter(row=>active(row.active))
    .map(row=>({...row,staffUserId:resolveContactStaff(row,staff)}));
}

async function changeProject(payload,user,database,admin,work) {
  const id=text(payload.projectId);
  if (!id) throw failure('Choose a project.');
  requireProject(user,id,{write:true,admin});
  return database.transaction(async tx=>{
    const project=await projectRow(tx,id);
    if (!project) throw failure('Project not found.',404);
    return work(tx,project.cells);
  });
}

export async function saveProjectContacts(payload,{user,database=db}) {
  const contacts=Array.isArray(payload.contacts)?payload.contacts:[];
  return changeProject(payload,user,database,true,(tx,project)=>replaceProjectContacts(tx,project,contacts,user));
}

export async function saveFloorZones(payload,{user,database=db}) {
  const incoming=Array.isArray(payload.rows)?payload.rows:[];
  const codes=new Set(),requestedIds=new Set();
  const zones=incoming.map((input,index)=>{
    const zoneCode=text(input?.zoneCode).toUpperCase(),floor=text(input?.floor),area=text(input?.area||input?.room),id=text(input?.floorZoneId);
    if (!zoneCode) throw failure('Zone Code is required for every Floor / Zone row (line '+(index+1)+'). Enter it by the doer.');
    if (codes.has(zoneCode)) throw failure('Duplicate Zone Code: '+zoneCode);
    if (!floor) throw failure('Floor is required for Zone Code '+zoneCode+'.');
    if (!area) throw failure('Area / Room is required for Zone Code '+zoneCode+'.');
    if (id&&requestedIds.has(id)) throw failure('Duplicate Floor Zone ID.');
    codes.add(zoneCode);
    if (id) requestedIds.add(id);
    return {id,zoneCode,floor,area,seq:index+1};
  });
  return changeProject(payload,user,database,false,async(tx,project)=>{
    const table='floor_zones',id=project.projectId;
    const existing=await projectChildren(tx,table,id);
    const byId=new Map(existing.filter(row=>row.cells.floorZoneId).map(row=>[String(row.cells.floorZoneId),row]));
    const kept=new Set(),at=now(),name=actor(user);
    for (const {id:requested,...zone} of zones) {
      const prior=byId.get(requested);
      const floorZoneId=prior?String(prior.cells.floorZoneId):await nextEntityId(tx,table);
      kept.add(floorZoneId);
      const row={floorZoneId,projectId:id,projectNo:project.projectNo||'',projectName:project.projectName||'',
        ...zone,active:true,updatedAt:at,updatedBy:name};
      if (prior) await updateRecord(tx,table,prior.record_id,row);
      else await insertRecord(tx,table,{...row,createdAt:at,createdBy:name});
    }
    for (const old of existing) {
      if (old.cells.floorZoneId&&!kept.has(String(old.cells.floorZoneId))&&active(old.cells.active)) {
        await updateRecord(tx,table,old.record_id,{active:false,updatedAt:at,updatedBy:name});
      }
    }
    return (await projectChildren(tx,table,id)).map(row=>row.cells).filter(row=>active(row.active))
      .sort((a,b)=>Number(a.seq||0)-Number(b.seq||0));
  });
}

export async function deleteFloorZones(payload,{user,database=db}) {
  const targets=Array.isArray(payload.targets)?payload.targets:[];
  if (!targets.length) throw failure('Choose at least one zone to delete.');
  if (targets.some(target=>!target||!text(target.floorZoneId)&&!text(target.zoneCode))) throw failure('A zone ID or code is required.');
  return changeProject(payload,user,database,false,async(tx,project)=>{
    const id=project.projectId,table='floor_zones';
    const existing=await projectChildren(tx,table,id);
    const selected=existing.filter(({cells:row})=>active(row.active)&&targets.some(target=>target.floorZoneId?
      String(target.floorZoneId)===String(row.floorZoneId):text(target.zoneCode).toUpperCase()===text(row.zoneCode).toUpperCase()&&
      (!target.floor||String(target.floor)===String(row.floor))));
    const at=now(),name=actor(user);
    for (const row of selected) await updateRecord(tx,table,row.record_id,{active:false,updatedAt:at,updatedBy:name});
    return {projectId:id,deleted:selected.length};
  });
}
