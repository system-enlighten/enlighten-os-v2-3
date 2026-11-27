import assert from 'node:assert/strict';
import test from 'node:test';
import {automaticIssueRevision} from '../server/drawing-issue-context.js';
import {getDrawingPortal,getPortalDrawingChunk} from '../server/drawing-portal.js';
import {beginBaseDrawingUpload,finishBaseDrawingUpload} from '../server/drawing-uploads.js';
import {createDriveAttachments} from '../server/drive-attachments.js';

test('paired CAD and PDF issues share a revision, while issue history prevents reuse',()=>{
  const drawing={drawingCode:'RCP / CIR',floor:'Ground',area:'Office',format:'CAD'};
  const pdf={...drawing,drawingCode:'cir, rcp',revision:'R2',active:true,format:'PDF'};
  assert.equal(automaticIssueRevision(drawing,[pdf]),'R2');
  assert.equal(automaticIssueRevision(drawing,[pdf,{...drawing,revision:'R2',active:true}]),'R3');
  assert.equal(automaticIssueRevision(drawing,[{...pdf,active:false}]),'R3');
});

test('a CAD grant for a different project cannot grant download access',async()=>{
  const user={authorized:true,appAccess:'Contractor',email:'test@example.com'};
  const issue={active:true,projectId:'project-1',issueId:'issue',size:4,format:'CAD',packages:'["Electrical"]',archiveFileId:'archive-id'};
  const access=[
    {cells:{active:true,contactId:'1',projectId:'project-1'},setting:{enabled:true,packages:['Electrical'],allowCad:false}},
    {cells:{active:true,contactId:'2',projectId:'project-2'},setting:{enabled:true,packages:['Electrical'],allowCad:true}}
  ];
  const database={transaction:work=>work({async rows(sql) {
    if (sql.includes('project_contacts')) return access;
    if (sql.includes('issued_drawings')) return [{cells:issue}];
    return [{cells:{projectId:'project-1',projectName:'Project'}}];
  }})};
  assert.equal((await getDrawingPortal({}, {user,database})).drawings[0].canDownload,false);
  await assert.rejects(getPortalDrawingChunk({issueId:'issue'},{user,database,files:{range:()=>assert.fail('Private CAD file read')}}),{statusCode:403});
  access[0].setting.allowCad=true;
  const result=await getPortalDrawingChunk({issueId:'issue',offset:1},{user,database,files:{range:async(...args)=>{
    assert.deepEqual(args,['archive-id',1,3,4]);return Buffer.from('BCD');
  }}});
  assert.equal(result.data,Buffer.from('BCD').toString('base64'));
  assert.equal(result.nextOffset,4);
});

test('Drive ranges must match both the response headers and binary byte count',async()=>{
  let contentRange='bytes 2-4/5';
  const drive=createDriveAttachments({getToken:async()=>'token',request:async(_url,options)=>{
    assert.equal(options.headers.Range,'bytes=2-4');
    return new Response('CDE',{status:206,headers:{'content-range':contentRange}});
  }});
  assert.equal((await drive.range('file-id',2,4,5)).toString(),'CDE');
  contentRange='bytes 0-2/5';
  await assert.rejects(drive.range('file-id',2,4,5),/range changed/);
});

test('Base upload must be in the correct project folder before a record is written',async()=>{
  const user={authorized:true,active:true,appAccess:'User',userId:'member',email:'member@example.com',projectRoles:{project:'User'}};
  const payload={projectId:'project',uploadId:'upload-1',fileName:'Plan.pdf',mimeType:'application/pdf',fileSize:100,driveFileId:'upload-drive-id'};
  const writes=[];
  const database={transaction:work=>work({
    async rows(sql) {
      if (sql.includes('enlighten_operational.projects')) return [{record_id:1,cells:{projectId:'project',driveFolderId:'project-folder'}}];
      return [];
    },
    async query(sql,args) {if (sql.startsWith('INSERT')) writes.push(JSON.parse(args[0]));}
  })};
  let parents=['another-folder'];
  const files={
    async metadata(id) {return id==='project-folder'?{id,parents:['test-root']}:{id,name:'Plan.pdf',size:100,parents};},
    async within(file,root) {return file.parents.includes(root);},
    async findFolders() {return [{id:'base-folder'}];},
    async startResumable(id,details) {assert.equal(id,'base-folder');assert.equal(details.size,100);return {sessionUrl:'session'};}
  };
  const context={user,database,files,env:{PROJECTS_DRIVE_ROOT_FOLDER_ID:'test-root'}};
  assert.deepEqual(await beginBaseDrawingUpload(payload,context),{sessionUrl:'session'});
  await assert.rejects(finishBaseDrawingUpload(payload,context),{statusCode:409});
  assert.equal(writes.length,0);
  parents=['base-folder'];
  const result=await finishBaseDrawingUpload(payload,context);
  assert.equal(result.direction,'Base');
  assert.equal(writes[0].driveFileId,payload.driveFileId);
});
