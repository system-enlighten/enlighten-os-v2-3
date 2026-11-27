import assert from 'node:assert/strict';
import {test} from 'node:test';
import {deleteAccountsInvoice,editDesignTransaction} from '../server/accounts-journal.js';
import {accountsTransactionHash_} from '../server/accounts-transaction-rules.js';
import {getLinearApplicationLayout,saveLinearApplicationLayout,saveLinearProductLink} from '../server/linear-applications.js';
import {importPayrollMachineAttendance,readPayrollMachineAttendance} from '../server/payroll.js';
import {getTechnicalTable,saveTechnicalTable} from '../server/technical-tables.js';
import {listExecutionVisits} from '../server/project-visits.js';
import {getProjectDiary} from '../server/project-diary.js';
import {createDriveAttachments,isDriveConfigured,projectsDriveRoot,getAccountsTransactionAttachment,getTechnicalProjectImage,uploadAccountsTransactionAttachment} from '../server/drive-attachments.js';

const accounts = {authorized:true,active:true,userId:'accounts-user',email:'accounts@example.test',appAccess:'User',departmentKey:'accounts'};
const admin = {...accounts,appAccess:'Admin'};
const viewer = {...accounts,appAccess:'Viewer'};

function journalDatabase(records) {
  const writes=[];
  const database={
    transaction: work=>work({
      async rows(sql) {
        if (sql.includes('accounts_journal')) return records.map((record,index)=>({
          record_id:index+1, cells:{'Record ID':record.id,'Record type':record.kind,'Record JSON':JSON.stringify(record)}
        }));
        if (sql.includes('enlighten_operational.projects')) return [{cells:{projectId:'project-1',projectName:'Test project'}}];
        return [];
      },
      async query(sql,parameters) {if (!sql.startsWith('LOCK')) writes.push({sql,parameters});}
    })
  };
  return {database,writes};
}

test('invoice deletion preserves numbering and audit and refuses dependent receipts', async ()=>{
  const invoice={id:'invoice-1',kind:'invoice',number:'E-IN-26-27-001',date:'2026-11-04',postings:[{head:'Receivable',debit:100,credit:0}]};
  const linked=journalDatabase([invoice,{id:'receipt',kind:'receipt',invoiceId:invoice.id}]);
  await assert.rejects(deleteAccountsInvoice({id:invoice.id},{user:accounts,database:linked.database}),{statusCode:409});
  assert.equal(linked.writes.length,0);
  const standalone=journalDatabase([invoice]);
  assert.deepEqual(await deleteAccountsInvoice({id:invoice.id},{user:accounts,database:standalone.database}),{deleted:true,id:invoice.id});
  const after=JSON.parse(JSON.parse(standalone.writes[0].parameters[0])['Record JSON']);
  assert.equal(after.number,invoice.number);
  assert.deepEqual(after.originalRecord,invoice);
  assert.deepEqual(after.postings,[]);
  assert.match(standalone.writes[1].sql,/accounts_journal_history/);
});

test('transaction edits rebuild balanced postings and reject stale or reconciled changes', async ()=>{
  const prior={id:'transaction-0001',kind:'transaction',date:'2026-11-04',projectId:'project-1',
    bank:'IDFC',direction:'Outflow',head:'Studio Overheads',amount:1500,paymentMode:'NEFT',author:'original@example.test'};
  const row={...prior,amount:'16.50'};
  const expectedFingerprint=accountsTransactionHash_(prior);
  const linked=journalDatabase([prior,{id:'match',kind:'reconciliation',matchIds:[prior.id]}]);
  await assert.rejects(editDesignTransaction({row,expectedFingerprint},{user:accounts,database:linked.database}),{statusCode:409});
  assert.equal(linked.writes.length,0);
  const open=journalDatabase([prior]);
  await assert.rejects(editDesignTransaction({row,expectedFingerprint:'stale'},{user:accounts,database:open.database}),{statusCode:409});
  await editDesignTransaction({row,expectedFingerprint},{user:accounts,database:open.database});
  const updated=JSON.parse(JSON.parse(open.writes[0].parameters[0])['Record JSON']);
  assert.equal(updated.projectId,prior.projectId);
  assert.equal(updated.author,prior.author);
  assert.deepEqual(updated.postings,[{head:'Studio Overheads',debit:1650,credit:0},{head:'IDFC',debit:0,credit:1650}]);
});

test('linear layout starts empty and uses optimistic versioning and admin writes', async ()=>{
  const empty=await getLinearApplicationLayout({}, {user:viewer,database:{one:async()=>null}});
  assert.deepEqual(empty,{version:0,deleted:[],references:{},images:{},order:[],customApplications:[],variantIcons:{},variantCodes:{}});
  const payload={expectedVersion:1,deleted:['first:1'],references:{'first:0':['second:0']},images:{},
    order:['second:0','custom-1'],customApplications:[{id:'custom-1',caption:'Cove',code:'LP1-C',url:'https://drive.google.com/thumbnail?id=custom'}],
    variantIcons:{'second:0':{side:'https://drive.google.com/thumbnail?id=example'}},variantCodes:{'second:0':{side:'LP1-B'}}};
  let writes=0;
  const database={async one(sql,values) {assert.match(sql,/version=\$3/);assert.equal(values[2],1);return writes++?null:{version:2};}};
  await assert.rejects(saveLinearApplicationLayout(payload,{user:viewer,database}),{statusCode:403});
  const result=await saveLinearApplicationLayout(payload,{user:admin,database});
  assert.equal(result.version,2);
  assert.deepEqual(result.variantIcons,payload.variantIcons);
  assert.deepEqual(result.variantCodes,payload.variantCodes);
  assert.deepEqual(result.order,payload.order);
  assert.deepEqual(result.customApplications,payload.customApplications);
  await assert.rejects(saveLinearApplicationLayout(payload,{user:admin,database}),{statusCode:409});
});

test('linear product association requires the selected fitting to contain the product', async ()=>{
  const payload={applicationId:'linear',referenceKey:'LP1:3',fittingId:'fitting',productId:'product'};
  const database={transaction:work=>work({async rows(sql,values) {
    if (sql.includes('technical_fittings')) return [{cells:{dataJson:JSON.stringify({products:[{id:'product'}]})}}];
    assert.match(sql,/ON CONFLICT \(application_id,reference_key\)/);
    assert.deepEqual(values,['linear','LP1:3','fitting','product',admin.email]);
    return [payload];
  }})};
  assert.deepEqual(await saveLinearProductLink(payload,{user:admin,database}),payload);
  await assert.rejects(saveLinearProductLink({...payload,productId:'unrelated'},{user:admin,database}),{statusCode:400});
});

test('payroll reads respect Accounts access and imports validate and deduplicate employee days', async ()=>{
  const punch={employeeId:'employee',date:'2026-11-04',checkIn:'09:00',checkOut:'17:30'};
  const reader={async rows(sql,args) {assert.match(sql,/payroll_machine_attendance/);assert.deepEqual(args,[2026]);return [punch];}};
  assert.deepEqual(await readPayrollMachineAttendance({year:'2026'},{user:viewer,database:reader}),[punch]);
  await assert.rejects(readPayrollMachineAttendance({year:'2026'},{user:{...viewer,departmentKey:'studio'},database:reader}),{statusCode:403});
  const database={transaction:work=>work({
    rows:async()=>[{cells:{userId:'employee',active:true}}],
    async query(sql,args) {
      assert.match(sql,/IS DISTINCT FROM/);
      assert.deepEqual(JSON.parse(args[0]),[punch]);
      return {rowCount:1};
    }
  })};
  assert.deepEqual(await importPayrollMachineAttendance({rows:[punch,punch]},{user:accounts,database}),{saved:1});
  await assert.rejects(importPayrollMachineAttendance({rows:[punch,{...punch,checkIn:'10:00'}]},{user:accounts,database}),{statusCode:400});
  await assert.rejects(importPayrollMachineAttendance({rows:[punch]},{user:viewer,database}),{statusCode:403});
});

test('technical table reads use the stored project and writes reject stale versions', async ()=>{
  const projectId='project-1';
  const table={tableId:'TECH-000001',projectId,activeVersion:'current'};
  const data=[['A1',...Array(13).fill('')]];
  const user={...accounts,projectRoles:{[projectId]:'User'}};
  let writes=0;
  const database={transaction:work=>work({
    async rows(sql,values) {
      if (sql.includes('technical_tables')) return [{record_id:1,cells:table}];
      if (sql.includes('technical_table_chunks')) return [{cells:{chunkIndex:0,text:'b64:'+Buffer.from(JSON.stringify(data)).toString('base64')}}];
      assert.deepEqual(values,[projectId]);
      return [{}];
    },
    async query(sql) {if (!sql.startsWith('LOCK')) writes++;}
  })};
  assert.deepEqual((await getTechnicalTable({tableId:table.tableId},{user,database})).rows,data);
  await assert.rejects(getTechnicalTable({tableId:table.tableId,projectId:'another'},{user:{...user,projectRoles:{another:'User'}},database}),{statusCode:403});
  const payload={tableId:table.tableId,projectId,rows:data,expectedVersion:'stale'};
  await assert.rejects(saveTechnicalTable(payload,{user,database}),{statusCode:409});
  assert.equal(writes,0);
  const result=await saveTechnicalTable({...payload,expectedVersion:'current'},{user,database});
  assert.notEqual(result.activeVersion,'current');
  assert.equal(writes,2);
});

test('execution visits join only the latest matching pending meeting', async ()=>{
  const projectId='project-1';
  const visit={projectId,visitPlanId:'visit',scheduledDate:'2026-11-04T00:00:00'};
  const base={visitPlanId:'visit',date:'2026-11-04',active:true};
  const meetings=[
    {...base,id:'prior',updatedAt:'2026-11-01'},
    {...base,id:'pending',updatedAt:'2026-11-02'},
    {...base,id:'already-held',updatedAt:'2026-11-03',happened:true},
    {...base,id:'deleted',updatedAt:'2026-11-04',active:false}
  ];
  const user={...accounts,projectRoles:{[projectId]:'User'}};
  const database={transaction:work=>work({async rows(sql,params) {
    assert.deepEqual(params,[projectId]);
    if (sql.includes('project_meetings')) return meetings.map(cells=>({cells}));
    if (sql.includes('execution_visits')) return [{cells:visit}];
    return [{}];
  }})};
  const [result]=await listExecutionVisits({projectId},{user,database});
  assert.equal(result.scheduledDate,'2026-11-04');
  assert.equal(result.scheduledMeeting.id,'pending');
  await assert.rejects(listExecutionVisits({projectId:'outside'},{user,database}),{statusCode:403});
});

test('Drive upload uses the configured folder and a bounded binary response', async ()=>{
  const calls=[];
  const drive=createDriveAttachments({getToken:async()=>'test-token',request:async(url,options)=>{
    calls.push({url,options});
    assert.equal(options.headers.Authorization,'Bearer test-token');
    if (options.method==='POST') return Response.json({id:'test-file-id'});
    if (url.includes('alt=media')) return new Response('attachment');
    return Response.json({id:'test-file-id',size:'10',trashed:false});
  }});
  assert.deepEqual(await drive.upload('test-folder-id',{name:'image.png',mimeType:'image/png',bytes:Buffer.from('attachment')}),{id:'test-file-id'});
  assert.match(calls[0].options.body.toString(),/"parents":\["test-folder-id"\]/);
  assert.equal((await drive.download('test-file-id')).toString(),'attachment');
});

test('technical images require an authorized project and a file inside its Drive folder', async ()=>{
  const projectId='project-1';
  const user={...viewer,projectRoles:{[projectId]:'User'}};
  const database={rows:async()=>[{cells:{projectId,driveFolderId:'project-folder'}}]};
  let reads=0;
  const file={id:'drive-image',mimeType:'image/png'};
  const files={
    async metadata() {reads++;return file;},
    async within(info,folder) {assert.equal(info,file);assert.equal(folder,'project-folder');return false;},
    async download() {assert.fail('Files outside the project must not be downloaded');}
  };
  await assert.rejects(getTechnicalProjectImage({projectId:'private',fileId:'drive-image'},{user,database,files}),{statusCode:403});
  assert.equal(reads,0);
  await assert.rejects(getTechnicalProjectImage({projectId,fileId:'drive-image'},{user,database,files}),{statusCode:403});
  assert.equal(reads,1);
});

test('Accounts attachment authorization precedes Drive access and metadata failures clean up the file', async ()=>{
  const proof={transactionId:'transaction-demo',name:'bill.pdf',base64:Buffer.from('pdf bytes').toString('base64')};
  const calls=[];
  const files={
    async upload(folder,input) {calls.push(['upload',folder,input.name]);return {id:'drive-file'};},
    async trash(id) {calls.push(['trash',id]);},
    async download() {assert.fail('No active transaction owns this file');}
  };
  const database={
    async query() {throw Error('metadata failed');},
    async one() {return {file_id:'drive-file',name:'bill.pdf',mime_type:'application/pdf'};},
    async rows() {return [{record:JSON.stringify({id:'other'})}];}
  };
  await assert.rejects(uploadAccountsTransactionAttachment(proof,{user:viewer,database,files}),{statusCode:403});
  assert.deepEqual(calls,[]);
  const env={ACCOUNTS_TRANSACTION_ATTACHMENTS_FOLDER_ID:'test-folder'};
  await assert.rejects(uploadAccountsTransactionAttachment(proof,{user:accounts,database,files,env}),/metadata failed/);
  assert.deepEqual(calls,[['upload','test-folder','bill.pdf'],['trash','drive-file']]);
  await assert.rejects(getAccountsTransactionAttachment({attachmentId:'proof'},{user:accounts,database,files}),{statusCode:404});
});

test('a diary invitation exposes the invited meeting without granting project workflow access', async ()=>{
  const invited={...viewer,name:'Preview User',projectRoles:{}};
  const projectId='private-project';
  const data={
    projects:[{projectId,projectName:'Private'}],
    project_meetings:[
      {id:'invited',projectId,participants:'Preview User',active:true,date:'2026-11-04'},
      {id:'private',projectId,participants:'Another Person',active:true,date:'2026-11-05'}
    ],
    diary_entries:[{entryId:'meeting:invited',projectId,summary:'Invited notes'},{entryId:'meeting:private',projectId,summary:'Private notes'}]
  };
  const database={transaction:work=>work({
    async rows(sql) {
      const table=sql.match(/enlighten_operational\."(\w+)"/)?.[1];
      assert.ok(table);
      return (data[table]||[]).map(cells=>({cells}));
    }
  })};
  const result=await getProjectDiary({projectId},{user:invited,database});
  assert.deepEqual(result.meetings.map(row=>row.id),['invited']);
  assert.equal(result.timeline[0].detail.summary,'Invited notes');
  assert.equal(result.timeline[0].canOpenWorkflow,false);
  assert.equal(result.timeline[0].canManageMomTasks,false);
});

test('the Preview Drive variables enable OAuth and supply the project root fallback',()=>{
  const env={GOOGLE_DRIVE_CLIENT_ID:'fixture-id',GOOGLE_DRIVE_CLIENT_SECRET:'fixture-secret',
    GOOGLE_DRIVE_REFRESH_TOKEN:'fixture-token',GOOGLE_DRIVE_FOLDER_ID:'preview-root'};
  assert.equal(isDriveConfigured(env),true);
  assert.equal(isDriveConfigured({...env,GOOGLE_DRIVE_REFRESH_TOKEN:''}),false);
  assert.equal(projectsDriveRoot(env),'preview-root');
  assert.equal(projectsDriveRoot({...env,PROJECTS_DRIVE_ROOT_FOLDER_ID:'configured-root'}),'configured-root');
});
