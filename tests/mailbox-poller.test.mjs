import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {test} from 'node:test';
import {createIntakeMailbox,intakeAttachments} from '../server/intake-mail.js';
import {pollDrawingMailbox} from '../server/mailbox-poller.js';

const mailboxAddress='drawings@example.test';
const employee='employee@example.test';
const start=Date.parse('2026-11-27T19:15:00Z');
const token='12345678-aaaa-bbbb-cccc-123456789abc';
const ref='[ENL-'+token+'] Drawing receipt';
const env={
  VERCEL_ENV:'preview',VERCEL_GIT_COMMIT_REF:'supabase-consolidated',
  SUPABASE_OPERATIONAL_ACCESS:'1',SUPABASE_DIRECT_OPERATIONAL_READS:'1',SUPABASE_DIRECT_OPERATIONAL_WRITES:'1',
  SUPABASE_PREVIEW_DRIVE_ROOT_ID:'only-preview-drive',GOOGLE_DRIVE_FOLDER_ID:'only-preview-drive',
  SUPABASE_PREVIEW_PROJECT_REF:'abcdefghijklmnopqrst',SUPABASE_PREVIEW_DATABASE_URL:'postgres://user@db.abcdefghijklmnopqrst.supabase.co/db',
  EMAIL_INTAKE_POLL_ENABLED:'1',EMAIL_INTAKE_ADDRESS:mailboxAddress,EMAIL_INTAKE_PREVIEW_MAILBOX:mailboxAddress,
  EMAIL_ALLOWED_SENDERS:employee+', viewer@example.test',EMAIL_INTAKE_START_MS:String(start-1),
  EMAIL_INTAKE_APP_URL:'https://test.example.test',EMAIL_INTAKE_PREVIEW_ORIGIN:'https://test.example.test'
};
const asData=text=>Buffer.from(text).toString('base64url');
const attachment=(filename,size,disposition='attachment')=>({
  filename,mimeType:'application/octet-stream',headers:[{name:'Content-Disposition',value:disposition}],
  body:{size,attachmentId:'part-1'}
});
function message(id,from,{subject='Drawings',body='',parts=[],sent=false,internalDate=start}={}) {
  return {id,internalDate:String(internalDate),labelIds:sent?['SENT']:['INBOX'],payload:{
    mimeType:'multipart/mixed',headers:[{name:'From',value:from},{name:'Subject',value:subject}],
    parts:[{mimeType:'text/plain',body:{data:asData(body)}},...parts]
  }};
}

test('Gmail transport reads labeled threads, ignores inline parts, and loads bytes lazily',async()=>{
  const source=message('source',employee,{parts:[attachment('inline.png',4,'inline'),attachment('drawing.dwg',4)]});
  const calls=[];
  const mailbox=createIntakeMailbox({getToken:async()=> 'fixture',request:async (url,options)=>{
    calls.push([new URL(url),options]);
    return {ok:true,json:async()=>url.includes('/attachments/')?{data:asData('plan')}:source};
  }});
  await mailbox.threads('Label_42','page-2');
  const drawing=await mailbox.message('source');
  const parts=intakeAttachments(drawing,mailbox);
  assert.equal(calls.length,2);
  assert.equal(calls[0][0].searchParams.get('labelIds'),'Label_42');
  assert.equal(calls[0][0].searchParams.get('pageToken'),'page-2');
  assert.equal(calls[0][0].searchParams.get('q'),'newer_than:30d');
  assert.equal(calls[1][1].headers.Authorization,'Bearer fixture');
  assert.deepEqual(parts.map(p=>p.name),['drawing.dwg']);
  assert.equal((await parts[0].bytes()).toString(),'plan');
});

test('disabled and non-isolated invocations make no Gmail or SQL calls',async()=>{
  const denied=new Proxy({},{get(){assert.fail('An external adapter was accessed');}});
  assert.deepEqual(await pollDrawingMailbox({env:{},database:denied,mailbox:denied}),{disabled:true});
  await assert.rejects(pollDrawingMailbox({env:{...env,VERCEL_ENV:'production'},database:denied,mailbox:denied}),/Isolated Preview/);
  await assert.rejects(pollDrawingMailbox({env,database:denied,mailbox:{profile:async()=>({emailAddress:'other@example.test'})}}),/OAuth identity/);
});

const pgliteModule=process.env.ENLIGHTEN_TEST_PGLITE_MODULE;
test('isolated PostgreSQL stages attachments and receipts, rejects spoofed approvals, and reconciles sends',
  {skip:!pgliteModule&&'Set ENLIGHTEN_TEST_PGLITE_MODULE to the embedded PostgreSQL module URL'},async()=>{
    const {PGlite}=await import(pgliteModule);
    const pg=new PGlite();
    try {
      const query=(...args)=>pg.query(...args);
      const rows=async (...args)=>(await query(...args)).rows;
      const database={query,rows,transaction:work=>pg.transaction(tx=>work({
        query:(...args)=>tx.query(...args),rows:async (...args)=>(await tx.query(...args)).rows
      }))};
      await pg.exec('CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role;');
      for (const name of ['202611260000_operational_base.sql','202611270020_mailbox_poller_indexes.sql']) {
        await pg.exec(await readFile(new URL('../supabase/migrations/'+name,import.meta.url),'utf8'));
      }
      async function insert(table,cells) {
        await query(`INSERT INTO enlighten_operational.${table} (cells) VALUES ($1::jsonb)`,[JSON.stringify(cells)]);
      }
      for (const [email,appAccess] of [[mailboxAddress,'Admin'],[employee,'User'],['viewer@example.test','Viewer']]) {
        await insert('people',{email,appAccess,userId:email,active:true});
      }
      await insert('email_drawing_intakes',{intakeId:'old',token,sender:employee,status:'Awaiting confirmation',detailsJson:'{}'});
      await insert('email_intake_messages',{messageId:'already-seen'});
      let messages=[
        message('already-seen',employee,{parts:[attachment('duplicate.pdf',4)]}),
        message('old-mail',employee,{internalDate:start-100,parts:[attachment('old.pdf',4)]}),
        message('mail-a','Employee <'+employee+'>',{parts:[attachment('inline.png',4,'inline'),attachment('notes.txt',4),attachment('plan.pdf',4)]}),
        message('denied','stranger@example.test',{parts:[attachment('plan.pdf',4)]}),
        message('viewer','viewer@example.test',{parts:[attachment('plan.pdf',4)]}),
        message('large',employee,{parts:[attachment('too-large.dwg',21*1024*1024)]}),
        message('spoof',mailboxAddress,{subject:ref,body:'Cancel: YES'}),
        message('quoted',mailboxAddress,{subject:ref,body:'On Tuesday Jane wrote:\n> Cancel: YES',sent:true}),
        message('cancel',mailboxAddress,{subject:ref,body:'Cancel: YES',sent:true}),
        message('receipt-loop',employee,{body:'ENLIGHTEN AUTOMATED RECEIPT\n\nLoop',parts:[attachment('loop.pdf',4)]}),
      ];
      const sent=new Map();
      const transport={
        profile:async()=>({emailAddress:mailboxAddress}),
        labels:async()=>({labels:[{name:'ENLIGHTEN_DRAWINGS',type:'user',id:'Label_1'}]}),
        threads:async label=>{assert.equal(label,'Label_1');return {threads:[{id:'thread'}]};},
        thread:async()=>({messages}),
        part:async()=>assert.fail('Ingestion must never download drawing bytes'),
        sent:async id=>({messages:sent.has(id)?[{id}]:[]}),
        send:async mime=>{
          const raw=Buffer.from(mime,'base64url').toString();
          const id=raw.match(/Message-ID: <([^>]+)>/)[1];
          assert.ok(!sent.has(id));
          sent.set(id,raw);
          if (sent.size===1) throw new Error('Gmail accepted the receipt before the connection failed');
          return {id};
        }
      };
      const opts={env,database,mailbox:transport};
      const first=await pollDrawingMailbox(opts);
      assert.equal(first.processed,8);
      assert.equal(first.failed,1);
      assert.equal(sent.size,4);
      const second=await pollDrawingMailbox(opts);
      assert.deepEqual(second,{processed:0,sent:0,failed:0,uncertain:0});
      assert.equal(sent.size,4);
      const records=(await rows('SELECT cells FROM enlighten_operational.email_drawing_intakes ORDER BY record_id')).map(row=>row.cells);
      assert.deepEqual(records.map(row=>[row.intakeId,row.status]),[
        ['old','Cancelled'],['MAIL-mail-a','Awaiting confirmation'],['MAIL-large','Needs attention']
      ]);
      const data=JSON.parse(records[1].detailsJson);
      assert.equal(data.date,'2026-11-28');
      assert.deepEqual(data.files,[{name:'plan.pdf',size:4,index:1,drawingId:'MAIL-mail-a-1'}]);
      assert.equal((await rows("SELECT 1 FROM enlighten_operational.email_intake_messages WHERE cells ? 'pollerDeliveredAt'")).length,4);
      assert.ok([...sent.values()].some(raw=>raw.includes('To: '+employee)));
      messages=Array.from({length:22},(_,i)=>message('batch-'+i,'stranger@example.test'));
      assert.equal((await pollDrawingMailbox(opts)).resumePageToken,'');
      assert.equal((await pollDrawingMailbox(opts)).processed,2);
    } finally {
      await pg.close();
    }
  });
