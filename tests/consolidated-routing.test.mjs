import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {isOperationalPreview,operationalPreviewFailures} from '../server/preview-isolation.js';

test('all 226 documented actions are explicitly routed through the Supabase gateway',()=>{
  const api=readFileSync(new URL('../api/index.js',import.meta.url),'utf8');
  const tracker=readFileSync(new URL('../SUPABASE_ACTION_CHECKLIST.md',import.meta.url),'utf8');
  const actions=new Set([...tracker.matchAll(/^\| `([^\x60]+)` \|/gm)].map(match=>match[1]));
  const routes=new Set([...api.matchAll(/\['([^']+)',\s*(?:[a-zA-Z_]+|\(p,c\)=>[^\r\n]+?)\]|directRoutes\.set\('([^']+)'/g)].map(match=>match[1]||match[2]));
  assert.equal(actions.size,226);
  for (const expected of ['getVendorLuminaireItem','submitVendorLuminaireOffer','getCurrentUser','getCadSourceTransfer']) {
    assert.match(api,new RegExp("'"+expected+"'"));
    routes.add(expected);
  }
  assert.deepEqual([...actions].filter(action=>!routes.has(action)),[]);
  assert.doesNotMatch(api,/fetchAppsScript|APPS_SCRIPT_URL/);
  const webhook=readFileSync(new URL('../api/whatsapp.js',import.meta.url),'utf8');
  assert.doesNotMatch(webhook,/fetchAppsScript|APPS_SCRIPT_URL/);
});

test('deployment gate requires the designated branch and a distinct isolated database',()=>{
  const ref='abcdefghijklmnopqrst';
  const config={VERCEL_ENV:'preview',VERCEL_GIT_COMMIT_REF:'supabase-consolidated',SUPABASE_OPERATIONAL_ACCESS:'1',
    SUPABASE_DIRECT_OPERATIONAL_READS:'1',SUPABASE_PREVIEW_DRIVE_ROOT_ID:'preview-root',GOOGLE_DRIVE_FOLDER_ID:'preview-root', SUPABASE_PREVIEW_PROJECT_REF:ref,
    SUPABASE_PREVIEW_DATABASE_URL:'postgresql://postgres@db.'+ref+'.supabase.co/postgres'};
  assert.equal(isOperationalPreview(config),true);
  assert.equal(isOperationalPreview({...config,VERCEL_ENV:'production'}),false);
  assert.equal(isOperationalPreview({...config,VERCEL_GIT_COMMIT_REF:'main'}),false);
  assert.equal(isOperationalPreview({...config,SUPABASE_PREVIEW_DATABASE_URL:''}),false);
  assert.equal(isOperationalPreview({...config,SUPABASE_PREVIEW_PROJECT_REF:'rxkzjdwldynxcsayvjbm'}),false);
  assert.equal(isOperationalPreview({...config,SUPABASE_PREVIEW_DATABASE_URL:'postgresql://unknown@db.other.supabase.co/postgres'}),false);
  assert.deepEqual(operationalPreviewFailures({...config,VERCEL_GIT_COMMIT_REF:'',
    SUPABASE_DIRECT_OPERATIONAL_READS:'0',PROJECTS_DRIVE_ROOT_FOLDER_ID:'other-root',
    PORTAL_ARCHIVE_FOLDER_ID:'other-archive',SUPABASE_PREVIEW_DATABASE_URL:'postgresql://user:private@db.other.supabase.co/postgres'}),[
    'VERCEL_GIT_COMMIT_REF:wrong-or-missing','SUPABASE_DIRECT_OPERATIONAL_READS:not-enabled',
    'PROJECTS_DRIVE_ROOT_FOLDER_ID:root-mismatch','PORTAL_ARCHIVE_FOLDER_ID:root-mismatch',
    'SUPABASE_PREVIEW_DATABASE_URL:project-mismatch','SUPABASE_PREVIEW_DATABASE_URL:unrecognized-host'
  ]);
  const pooler='postgresql://postgres%2E'+ref+':fixture%40%2F%23%25@aws-0-ap-south-1.pooler.supabase.com:5432/postgres';
  assert.deepEqual(operationalPreviewFailures({...config,SUPABASE_PREVIEW_DATABASE_URL:pooler}),[]);
  assert.deepEqual(operationalPreviewFailures({...config,SUPABASE_PREVIEW_DATABASE_URL:
    ' '+pooler.replace('aws-0-ap-south-1.pooler.supabase.com','AWS-0-AP-SOUTH-1.POOLER.SUPABASE.COM.')+'\n'}),[]);
  assert.deepEqual(operationalPreviewFailures({...config,SUPABASE_PREVIEW_DATABASE_URL:pooler.replace('aws-0','%61ws-0')}),[]);
  assert.deepEqual(operationalPreviewFailures({...config,SUPABASE_PREVIEW_DATABASE_URL:pooler+'?host=other'}),[
    'SUPABASE_PREVIEW_DATABASE_URL:connection-override-parameter'
  ]);
  assert.deepEqual(operationalPreviewFailures({...config,SUPABASE_PREVIEW_DATABASE_URL:pooler.replace(ref,'mypofxuvupmrgjqeczmd')}),[
    'SUPABASE_PREVIEW_DATABASE_URL:project-mismatch','SUPABASE_PREVIEW_DATABASE_URL:pooler-username-ref-mismatch',
    'SUPABASE_PREVIEW_DATABASE_URL:matches-intended-project','SUPABASE_PREVIEW_PROJECT_REF:unexpected-preview-project'
  ]);
});
