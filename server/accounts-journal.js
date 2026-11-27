import {buildAccountsEntry,buildStatementImport} from './accounts-entry-rules.js';
import {db} from './supabase-db.js';
import {randomUUID} from 'node:crypto';
import {isSystemAdmin,requireAccounts,requireStudio} from './permissions.js';
import {
  ACCOUNTS_HEADS,ACCOUNTS_LEGACY_HEADS,accountsTransactionFingerprint_,accountsTransactionHash_,accountsTransactionSourceId_,buildDesignTransaction
} from './accounts-transaction-rules.js';

const error = (message,statusCode=400) => Object.assign(new Error(message),{statusCode});
const chartDefaults = [...ACCOUNTS_HEADS,...ACCOUNTS_LEGACY_HEADS];
const active = value => !['false','no','0','n',''].includes(String(value ?? '').trim().toLowerCase());

async function journal(tx) {
  const rows=await tx.rows('SELECT record_id,source_row_number,cells FROM enlighten_operational.accounts_journal ORDER BY source_row_number NULLS LAST,record_id');
  const entries=new Map();
  const warnings=[];
  for (const row of rows) {
    try {
      const record=JSON.parse(row.cells['Record JSON']);
      const id=record.id;
      if (!id || !record.kind || id!==String(row.cells['Record ID']) || record.kind!==row.cells['Record type'] || entries.has(id)) throw Error('Inconsistent journal entry');
      entries.set(id,{...row,record});
    } catch {
      warnings.push('Accounts Journal row '+(row.source_row_number ?? row.record_id)+' could not be read. Totals may be incomplete until this row is repaired.');
    }
  }
  return {entries,warnings,records:[...entries.values()].map(row=>row.record)};
}

async function chart(tx) {
  const rows=await tx.rows('SELECT head,account_type,subhead,deleted FROM enlighten_operational.accounts_chart ORDER BY head');
  const heads=new Map(chartDefaults.map(([head,type,subhead])=>[head,[head,type,subhead||'']]));
  for (const {head,account_type:type,subhead,deleted} of rows) {
    if (deleted) heads.delete(head);
    else heads.set(head,[head,type,subhead]);
  }
  return [...heads.values()];
}

const accountText=(value,limit=250)=>String(value??'').trim().slice(0,limit);
const isDate=value=>/^\d{4}-\d{2}-\d{2}$/.test(value)&&Number.isFinite(Date.parse(value))&&new Date(value).toISOString().slice(0,10)===value;

export async function saveAccountsHead(payload,{user,database=db}) {
  return changeJournal(user,database,async (tx,{records})=>{
    await tx.query('LOCK TABLE enlighten_operational.accounts_chart IN SHARE ROW EXCLUSIVE MODE');
    const heads=new Map((await chart(tx)).map(head=>[head[0],head]));
    const previous=accountText(payload.previous,120);
    const head=accountText(payload.head,120);
    const type=accountText(payload.type);
    const subhead=accountText(payload.subhead,120);
    const existing=heads.get(previous);
    const remove=payload.remove===true;
    if (previous&&(!existing||JSON.stringify(existing)!==JSON.stringify(payload.expected))) throw error('The chart changed. Refresh Accounts and try again.',409);
    if (remove&&!previous) throw error('Select a head to delete.');
    if (previous&&(remove||previous!==head||existing[1]!==type)&&
        (ACCOUNTS_HEADS.some(([name])=>name===previous)||records.some(record=>record.head===previous||record.postings?.some(posting=>posting.head===previous)))) {
      throw error('System heads and heads used in transactions cannot be renamed, reclassified or deleted. You can edit their sub-head.',409);
    }
    if (!remove) {
      if (!head||!ACCOUNTS_HEADS.some(row=>row[1]===type)) throw error('Enter a head and select its type.');
      if ([...heads.keys()].some(name=>name!==previous&&name.toLowerCase()===head.toLowerCase())) throw error('A head with this name already exists.',409);
    }
    const write=(name,category,detail,deleted)=>tx.query(`INSERT INTO enlighten_operational.accounts_chart (head,account_type,subhead,deleted)
      VALUES ($1,$2,$3,$4) ON CONFLICT (head) DO UPDATE SET account_type=excluded.account_type,
      subhead=excluded.subhead,deleted=excluded.deleted`,[name,category,detail,deleted]);
    if (!remove) await write(head,type,subhead,false);
    if (previous&&(remove||previous!==head)) await write(previous,existing[1],existing[2],true);
    return chart(tx);
  });
}

function requireLegal(user,write=false) {
  requireStudio(user);
  if (!isSystemAdmin(user)&&user.departmentKey!=='legal') throw error('Legal & Contracts access required.',403);
  if (write&&String(user.appAccess).toLowerCase()==='viewer') throw error('View only access.',403);
}

export async function getLegalContracts(_payload,{user,database=db}) {
  requireLegal(user);
  return database.transaction(async tx=>{
    const rows=await tx.rows('SELECT contract FROM enlighten_operational.project_contracts ORDER BY project_id');
    return {projects:(await projects(tx)).map(({id,name})=>({id,name})),contracts:rows.map(row=>row.contract)};
  },{readOnly:true});
}

export async function saveLegalContract(payload,{user,database=db}) {
  requireLegal(user,true);
  const projectId=String(payload.projectId||'');
  if (!projectId) throw error('Choose a project.');
  const status=String(payload.status||'Draft');
  if (!['Draft','Signed'].includes(status)) throw error('Choose Draft or Signed.');
  const money=String(payload.amount??'').trim().replace(/,/g,'');
  const amount=Math.round(Number(money)*100);
  if (!/^\d{1,10}(\.\d{1,2})?$/.test(money)||!amount) throw error('Enter a positive INR amount with up to two decimal places.');
  const signedDate=status==='Signed'?payload.signedDate:'';
  if (status==='Signed'&&!isDate(signedDate)) throw error('Enter a valid date.');
  const contractNumber=accountText(payload.contractNumber);
  if (!contractNumber) throw error('Enter a contract reference.');
  const documentUrl=accountText(payload.documentUrl,2000);
  if (documentUrl&&!/^https:\/\/[^\s]+$/.test(documentUrl)) throw error('Use an HTTPS contract document link.');
  return database.transaction(async tx=>{
    const [project]=await tx.rows("SELECT record_id FROM enlighten_operational.projects WHERE cells->>'projectId'=$1 LIMIT 1 FOR SHARE",[projectId]);
    if (!project) throw error('Project not found.',404);
    const contract={projectId,contractNumber,status,amount,signedDate,documentUrl,version:randomUUID(),
      updatedAt:new Date().toISOString(),updatedBy:user.email};
    const values=[projectId,JSON.stringify(contract)];
    const expected=String(payload.expectedVersion||'');
    const result=expected
      ? await tx.query("UPDATE enlighten_operational.project_contracts SET contract=$2::jsonb WHERE project_id=$1 AND contract->>'version'=$3",[...values,expected])
      : await tx.query('INSERT INTO enlighten_operational.project_contracts (project_id,contract) VALUES ($1,$2::jsonb) ON CONFLICT (project_id) DO NOTHING',values);
    if (result.rowCount!==1) throw error('Contract changed. Refresh before saving.',409);
    return contract;
  });
}

async function projects(tx) {
  const rows=await tx.rows('SELECT cells FROM enlighten_operational.projects ORDER BY source_row_number NULLS LAST,record_id');
  return rows.map(({cells:p})=>({id:String(p.projectId),name:p.projectName,projectNo:p.projectNo,client:p.clientName||p.ownerName||p.client||''}));
}

export async function getAccounts(_payload,{user,database=db}) {
  requireAccounts(user);
  return database.transaction(async tx=>{
    await tx.query('SET TRANSACTION ISOLATION LEVEL REPEATABLE READ');
    const {records,warnings}=await journal(tx);
    const heads=await chart(tx);
    const people=await tx.rows('SELECT cells FROM enlighten_operational.people ORDER BY source_row_number NULLS LAST,record_id');
    const contracts=new Map((await tx.rows("SELECT project_id,contract FROM enlighten_operational.project_contracts WHERE contract->>'status'='Signed'")).map(row=>[row.project_id,row.contract]));
    return {
      heads,warnings,
      employees:people.map(row=>row.cells).filter(p=>active(p.active)&&p.userId).map(p=>({id:String(p.userId),name:p.name,role:p.role,department:p.department})),
      records:records.map(record=>record.kind==='transaction'?{...record,deleteFingerprint:accountsTransactionHash_(record)}:record),
      projects:(await projects(tx)).map(project=>{
        const profile=records.filter(record=>record.kind==='billingProfile'&&record.projectId===project.id)
          .sort((a,b)=>String(b.updatedAt).localeCompare(String(a.updatedAt)))[0];
        const contract=contracts.get(project.id);
        return {...project,...(profile?{client:profile.client,clientAddress:profile.address,billing:profile}:{}),
          contractAmount:contract?Number(contract.amount):null,contractNumber:contract?.contractNumber||'',contractDate:contract?.signedDate||''};
      })
    };
  },{readOnly:true});
}

async function updateEntry(tx,entry,after,actor,action) {
  const cells={...entry.cells,'Record type':after.kind,'Date':after.date,'Author':actor,'Record JSON':JSON.stringify(after)};
  await tx.query('UPDATE enlighten_operational.accounts_journal SET cells=$1::jsonb,updated_at=clock_timestamp() WHERE record_id=$2::bigint',[JSON.stringify(cells),entry.record_id]);
  await tx.query(`INSERT INTO enlighten_operational.accounts_journal_history
    (journal_record_id,action,actor,before_record,after_record) VALUES ($1::bigint,$2,$3,$4::jsonb,$5::jsonb)`,
  [entry.record_id,action,actor,JSON.stringify(entry.record),JSON.stringify(after)]);
}

async function changeJournal(user,database,work) {
  requireAccounts(user,{write:true});
  return database.transaction(async tx=>{
    await tx.query('LOCK TABLE enlighten_operational.accounts_journal IN SHARE ROW EXCLUSIVE MODE');
    const state=await journal(tx);
    if (state.warnings.length) throw error('Repair unreadable journal records before modifying entries.',409);
    return work(tx,state);
  });
}

async function insertJournal(tx,records) {
  if (!records.length) return;
  const cells=records.map(record=>({'Record ID':record.id,'Record type':record.kind,'Date':record.date,
    'Author':record.author,'Record JSON':JSON.stringify(record)}));
  await tx.query('INSERT INTO enlighten_operational.accounts_journal (cells) SELECT value FROM jsonb_array_elements($1::jsonb)',[JSON.stringify(cells)]);
}

async function proofMetadata(tx,ids) {
  const rows=await tx.rows(`SELECT id,transaction_id AS "transactionId",author FROM enlighten_operational.accounts_transaction_attachments
    WHERE id=ANY($1::text[])`,[ids]);
  return new Map(rows.map(attachment=>[attachment.id,attachment]));
}

function linksTo(record,id) {
  return ['invoiceId','proformaId','generatedInvoiceId','sentInvoiceId','matchId','statementId'].some(key=>record[key]===id) ||
    (Array.isArray(record.matchIds) && record.matchIds.includes(id));
}

export async function deleteAccountsInvoice({id},{user,database=db}) {
  if (typeof id!=='string'||!id.trim()) throw error('Select an invoice.');
  return changeJournal(user,database,async (tx,{entries,records})=>{
    const entry=entries.get(id);
    if (!entry) throw error('Invoice not found.',404);
    const invoice=entry.record;
    if (invoice.kind==='deletedInvoice') return {deleted:true,id};
    if (!['invoice','legacyInvoice'].includes(invoice.kind)) throw error('This record is not an invoice.');
    if (invoice.generatedFromReceiptId || records.some(record=>record.id!==id && !/^deleted/.test(record.kind) && linksTo(record,id))) {
      throw error('This invoice has linked accounting or dispatch records and cannot be deleted.',409);
    }
    const deleted={...invoice,kind:'deletedInvoice',postings:[],deletedBy:user.email,deletedAt:new Date().toISOString(),originalRecord:invoice};
    await updateEntry(tx,entry,deleted,user.email,'deleteInvoice');
    return {deleted:true,id};
  });
}

export async function editDesignTransaction({row,expectedFingerprint},{user,database=db}) {
  if (!row?.id || typeof expectedFingerprint!=='string') throw error('Select a transaction and refresh before editing.');
  return changeJournal(user,database,async (tx,{entries,records})=>{
    const entry=entries.get(String(row.id));
    if (!entry || entry.record.kind!=='transaction') throw error('Transaction not found.',404);
    const prior=entry.record;
    if (accountsTransactionHash_(prior)!==expectedFingerprint) throw error('Transaction changed. Refresh before editing.',409);
    const attachments=new Map();
    if (row.attachmentId) {
      const [attachment]=await tx.rows('SELECT id,transaction_id AS "transactionId",author FROM enlighten_operational.accounts_transaction_attachments WHERE id=$1',[String(row.attachmentId)]);
      if (attachment) attachments.set(attachment.id,row.attachmentId===prior.attachmentId?{...attachment,author:user.email}:attachment);
      else if (row.attachmentId===prior.attachmentId) throw error('The existing payment attachment must be migrated before editing.',409);
    }
    let replacement;
    try {
      replacement=buildDesignTransaction(row,{heads:await chart(tx),projects:await projects(tx),attachments},user);
    } catch (cause) {
      throw error(cause.message);
    }
    const financialFields=['date','direction','amount','bank','head','projectId','entryType','fromAccount','toAccount'];
    if (records.some(record=>record.kind==='reconciliation'&&linksTo(record,prior.id)) &&
        financialFields.some(field=>String(prior[field]??'')!==String(replacement[field]??''))) {
      throw error('Review the bank reconciliation before changing this transaction’s accounting details.',409);
    }
    const source=accountsTransactionSourceId_(replacement);
    if (records.some(record=>record.id!==prior.id&&record.kind==='transaction'&&
        (accountsTransactionFingerprint_(record)===replacement.sourceFingerprint || (source&&accountsTransactionSourceId_(record)===source)))) {
      throw error('Another design transaction already uses this fingerprint or source ID.',409);
    }
    const updated={...replacement,createdAt:prior.createdAt,author:prior.author,updatedAt:new Date().toISOString(),updatedBy:user.email};
    await updateEntry(tx,entry,updated,user.email,'editTransaction');
    return {updated:true,id:prior.id};
  });
}

function statementMatched(statement,records) {
  return records.some(record=>record.kind==='reconciliation'&&(record.statementId===statement.id||
    record.bank===statement.bank&&record.date===statement.date&&record.direction===statement.direction&&record.amount===statement.amount&&
    String(record.reference||'').toLowerCase()===String(statement.reference||'').toLowerCase()));
}

function uniqueBankMatches(records,user) {
  const used=new Set(records.filter(record=>record.kind==='reconciliation')
    .flatMap(record=>Array.isArray(record.matchIds)?record.matchIds:record.matchId?[record.matchId]:[]));
  const statements=records.filter(record=>record.kind==='statement'&&record.bank!=='Cash'&&!statementMatched(record,records));
  const books=records.filter(record=>['transaction','receipt'].includes(record.kind)&&!used.has(record.id));
  const key=record=>JSON.stringify([record.bank,record.date,record.direction,record.amount]);
  const group=rows=>{
    const map=new Map();
    for (const record of rows) {
      const k=key(record);
      if (!map.has(k)) map.set(k,[]);
      map.get(k).push(record);
    }
    return map;
  };
  const statementsByKey=group(statements),booksByKey=group(books);
  const links=[];
  for (const [k,matchingStatements] of statementsByKey) {
    const matchingBooks=booksByKey.get(k);
    if (matchingStatements.length!==1||matchingBooks?.length!==1) continue;
    const [statement]=matchingStatements,[book]=matchingBooks;
    links.push({id:randomUUID(),kind:'reconciliation',date:statement.date,valueDate:statement.valueDate||statement.date,
      bank:statement.bank,direction:statement.direction,amount:statement.amount,reference:statement.reference,
      description:book.description||statement.description,projectId:book.projectId||'',projectName:book.projectName||'',
      head:'',matchId:book.id,matchIds:[book.id],statementId:statement.id,categorizedAmount:0,postings:[],
      author:user.email,createdAt:new Date().toISOString(),matchMethod:'Unique exact date, direction and amount'});
  }
  return links;
}

export async function importDesignTransactions(payload,{user,database=db}) {
  const {rows}=payload;
  if (!Array.isArray(rows)||!rows.length||rows.length>500) throw error('Import 1 to 500 Design transactions.');
  return changeJournal(user,database,async (tx,{records})=>{
    const data={heads:await chart(tx),projects:await projects(tx),
      attachments:await proofMetadata(tx,[...new Set(rows.map(row=>String(row?.attachmentId||'')).filter(Boolean))])};
    const current=records.filter(record=>record.kind==='transaction');
    const byId=new Map(records.map(record=>[record.id,record]));
    const fingerprints=new Set(current.map(accountsTransactionFingerprint_));
    const sources=new Map(current.map(record=>[accountsTransactionSourceId_(record),accountsTransactionFingerprint_(record)]).filter(([id])=>id));
    const inserted=[];
    let duplicates=0;
    for (const [index,input] of rows.entries()) {
      let row;
      try { row=buildDesignTransaction(input,data,user); }
      catch (cause) { throw error('Import row '+(index+1)+': '+cause.message); }
      const prior=byId.get(row.id);
      if (prior&&prior.kind!=='transaction') throw error('Transaction ID already belongs to another record.',409);
      if (prior&&accountsTransactionFingerprint_(prior)!==row.sourceFingerprint) throw error('Transaction ID already exists with different data.',409);
      const source=accountsTransactionSourceId_(row);
      if (source&&sources.has(source)&&sources.get(source)!==row.sourceFingerprint) throw error('Source transaction ID '+row.sourceId+' already exists with different details. Review the file.',409);
      if (prior||fingerprints.has(row.sourceFingerprint)||source&&sources.has(source)) {
        duplicates++;
        continue;
      }
      byId.set(row.id,row);
      fingerprints.add(row.sourceFingerprint);
      if (source) sources.set(source,row.sourceFingerprint);
      inserted.push(row);
    }
    const after=[...records,...inserted];
    const links=payload.autoMatch===true?uniqueBankMatches(after,user):[];
    await insertJournal(tx,[...inserted,...links]);
    const withMatches=[...after,...links];
    return {imported:inserted.length,duplicates,matched:links.length,
      unmatched:after.filter(record=>record.kind==='statement'&&!statementMatched(record,withMatches)).length};
  });
}

export async function deleteDesignTransaction(payload,{user,database=db}) {
  const requested=Array.isArray(payload.transactions)?payload.transactions:[payload];
  if (!requested.length||requested.some(item=>!item?.id)) throw error('Select transactions to delete.');
  return changeJournal(user,database,async (tx,{entries,records})=>{
    const ids=new Set();
    for (const item of requested) {
      const record=entries.get(String(item.id))?.record;
      if (!record) throw error('Transaction not found.',404);
      if (record.kind==='deletedTransaction') continue;
      if (record.kind!=='transaction') throw error('This entry belongs to a separate Accounts workflow.');
      if (accountsTransactionHash_(record)!==item.expectedFingerprint) throw error('Transaction changed. Refresh before deleting.',409);
      ids.add(record.id);
    }
    const links=records.filter(record=>record.kind==='reconciliation'&&[...ids].some(id=>linksTo(record,id)));
    if (links.some(record=>record.postings?.length)) throw error('This transaction is linked to a posted adjustment. Review it in Banking before deleting.',409);
    const after=(record,kind)=>({id:record.id,kind,date:record.date,postings:[],deletedBy:user.email,
      deletedAt:new Date().toISOString(),originalRecord:record});
    for (const id of ids) {
      const entry=entries.get(id);
      await updateEntry(tx,entry,after(entry.record,'deletedTransaction'),user.email,'deleteTransaction');
    }
    for (const link of links) {
      await updateEntry(tx,entries.get(link.id),after(link,'deletedReconciliation'),user.email,'removeTransactionReconciliation');
    }
    return {deleted:true,count:ids.size,unmatched:links.length};
  });
}

async function entryContext(tx,records) {
  const people=await tx.rows("SELECT cells FROM enlighten_operational.people WHERE coalesce(cells->>'userId','')<>''");
  return {records,heads:await chart(tx),projects:await projects(tx),employees:people.map(row=>row.cells)
    .filter(person=>active(person.active)).map(person=>({id:String(person.userId),name:person.name}))};
}

function validateEntry(build) {
  try {return build();} catch(cause) {throw error(cause.message);}
}

export async function saveAccounts(payload,{user,database=db}) {
  return changeJournal(user,database,async (tx,{entries,records})=>{
    const data=await entryContext(tx,records);
    const {record,generatedInvoice,unchanged}=validateEntry(()=>buildAccountsEntry(payload,data,user));
    if (unchanged) return record;
    if (payload.isEdit) await updateEntry(tx,entries.get(record.id),record,user.email,'editAccountsEntry');
    else {
      if (generatedInvoice&&entries.has(generatedInvoice.id)) throw error('Generated invoice ID is already in use.',409);
      await insertJournal(tx,generatedInvoice?[generatedInvoice,record]:[record]);
    }
    return record;
  });
}

export async function importAccountsStatement(payload,{user,database=db}) {
  return changeJournal(user,database,async (tx,{records})=>{
    const data=await entryContext(tx,records);
    const {rows,links,all}=validateEntry(()=>buildStatementImport(payload,data,user));
    await insertJournal(tx,all);
    return {records:rows,imported:rows.length,duplicates:payload.rows.length-rows.length,matched:links.length};
  });
}
