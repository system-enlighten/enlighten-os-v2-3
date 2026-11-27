import test from 'node:test';
import assert from 'node:assert/strict';
import {getCadSource,getCadSourceChunk,getCadSourceTransfer} from '../server/cad-source.js';

const request={projectId:'project-1',driveFileId:'drawing-1'};
const user={authorized:true,active:true,userId:'fixture',appAccess:'User',projectRoles:{'project-1':'User'}};
const modified='2026-11-25T08:00:00.000Z';
const context={user,env:{GOOGLE_DRIVE_FOLDER_ID:'preview-root'},database:{rows:async()=>[{cells:{driveFolderId:'project-folder'}}]},
  files:{
    metadata:async id=>id==='project-folder'?{id,parents:['preview-root']}:{id,name:'fixture.dwg',size:'5',modifiedTime:modified},
    within:async(file,folder)=>file.id==='project-folder'?folder==='preview-root':folder==='project-folder',
    range:async(id,start,end,total)=>{
      assert.deepEqual([id,start,end,total],['drawing-1',1,2,5]);
      return Buffer.from('ok');
    }
  }};

test('CAD source uses project-scoped Drive metadata and exact ranges',async()=>{
  assert.equal((await getCadSource(request,context)).modified,modified);
  await assert.rejects(getCadSourceTransfer({...request,modified},context),{statusCode:403});
  const transfer=await getCadSourceTransfer({...request,modified},{...context,internal:true});
  assert.equal(transfer.accessToken,undefined);
  assert.equal((await getCadSourceChunk({...request,modified,offset:1,length:2},context)).data,'b2s=');
  await assert.rejects(getCadSourceChunk({...request,modified,offset:4,length:2},context),{statusCode:400});
  await assert.rejects(getCadSourceChunk({...request,modified:'stale',offset:1,length:2},context),{statusCode:409});
});

test('CAD transfer rejects viewers and files outside the project',async()=>{
  const viewer={...context,user:{...user,appAccess:'Viewer'}};
  assert.equal((await getCadSource(request,viewer)).canPrepare,false);
  await assert.rejects(getCadSourceChunk({...request,modified,offset:1,length:2},viewer),{statusCode:403});
  const outside={...context,files:{...context.files,within:async file=>file.id==='project-folder'}};
  await assert.rejects(getCadSource(request,outside),{statusCode:403});
});
