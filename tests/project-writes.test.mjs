import assert from 'node:assert/strict';
import test from 'node:test';
import {createProject,deleteProject,updateProject} from '../server/project-writes.js';
import {deleteFloorZones,saveFloorZones,saveProjectContacts} from '../server/project-location-writes.js';

const admin={userId:'a',authorized:true,active:true,appAccess:'Admin',email:'admin@example.test'};
const member={...admin,appAccess:'User',projectRoles:{'project-1':'User'}};
const noQuery={transaction:()=>assert.fail('Unauthorized action reached PostgreSQL')};

test('project deletion and contact replacement enforce their distinct admin permissions',async()=>{
  await assert.rejects(deleteProject({projectId:'project-1'},{user:{...member,projectRoles:{'project-1':'Admin'}},database:noQuery}),{statusCode:403});
  await assert.rejects(saveProjectContacts({projectId:'project-1',contacts:[]},{user:member,database:noQuery}),{statusCode:403});
  await assert.rejects(updateProject({projectId:'another-project',projectName:'Forbidden'},{user:member,database:noQuery}),{statusCode:403});
  await assert.rejects(deleteFloorZones({projectId:'project-1',targets:[{zoneCode:'A1'}]},{user:{...member,appAccess:'Viewer'},database:noQuery}),{statusCode:403});
});

test('floor zone validation rejects duplicate normalized codes before a database write',async()=>{
  const row={zoneCode:'A1',floor:'Ground',area:'Office'};
  await assert.rejects(saveFloorZones({projectId:'project-1',rows:[row,{...row,zoneCode:' a1 '}]},{user:member,database:noQuery}),{statusCode:400});
});

test('failed project folder provisioning cleans up the new Drive folder and never creates database records',async()=>{
  const calls=[];
  const database={transaction:work=>work({
    async query(sql) {assert.match(sql,/pg_advisory_xact_lock/);},
    async rows(sql) {assert.match(sql,/SELECT/);return [];}
  })};
  const files={
    async createFolder(parent,name) {
      calls.push([parent,name]);
      if (parent==='new-project-folder') throw Error('Subfolder creation failed.');
      return 'new-project-folder';
    },
    async trash(id) {calls.push(['trash',id]);}
  };
  await assert.rejects(createProject({projectId:'PRJ-test',projectName:'Example'},
    {user:admin,database,files,env:{PROJECTS_DRIVE_ROOT_FOLDER_ID:'test-root'}}),/Subfolder creation failed/);
  assert.deepEqual(calls,[['test-root','test - Example'],['new-project-folder','Base'],['trash','new-project-folder']]);
});
