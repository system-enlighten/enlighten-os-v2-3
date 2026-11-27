import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {createDatabase} from '../server/supabase-db.js';
import {readOperationalWorkbook,readSupplementalBackfill,readTab} from './read-operational-workbook.mjs';
import {readAssessmentAndFlagRows,synchronizeAssessmentAndFlagRows} from './sync-assessment-and-mom.mjs';
import {planWorkbookCells,synchronizeWorkbookCells} from './sync-workbook-cells.mjs';

const normal=value=>JSON.stringify(value,(_key,item)=>item&&typeof item==='object'&&!Array.isArray(item)?
  Object.fromEntries(Object.entries(item).sort(([a],[b])=>a.localeCompare(b))):item);
const at=value=>{
  if (!value) return null;
  const stamp=new Date(value);
  if (!Number.isFinite(+stamp)) throw Error('Invalid workbook timestamp.');
  return stamp.toISOString();
};

function typedRows(book) {
  const data=readSupplementalBackfill(book),rows=[];
  const add=(table,key,values,metadata={})=>rows.push({table,key,values,metadata});
  if (data.linearLayout) add('linear_application_layout',{singleton:true},
    {version:data.linearLayout.version,layout:data.linearLayout.layout},{updated_by:'Workbook export',updated_at:at(data.linearLayout.updatedAt)});
  for (const row of data.linearCaptions) add('linear_application_captions',{application_id:row.applicationId},{caption:row.caption,code:row.code},
    {updated_by:row.updatedBy||'Workbook export',updated_at:at(row.updatedAt)});
  for (const row of data.linearLinks) add('linear_product_links',{application_id:row.applicationId,reference_key:row.referenceKey},
    {fitting_id:row.fittingId,product_id:row.productId},{updated_by:'Workbook export'});
  for (const row of data.accountsChart) add('accounts_chart',{head:row.head},{account_type:row.type,subhead:row.subhead,deleted:row.deleted});
  for (const {cells:row} of readTab(book,'AccountsReceiptDrafts',{required:true})) {
    if (!/^wamid\.[a-zA-Z0-9_+=\/-]{1,250}$/.test(row.id)||!row.author||!['ready','processing'].includes(row.status)) {
      throw Error('Invalid receipt draft source record.');
    }
    add('accounts_receipt_drafts',{id:row.id},{author:row.author,transaction_id:row.transactionId,status:row.status,lease:row.lease,
      data:row.data?JSON.parse(row.data):null},{created_at:at(row.createdAt),updated_at:at(row.updatedAt)});
  }
  return rows;
}

async function syncTyped(tx,rows,apply) {
  const report={inserted:0,unchanged:0,conflicts:[]};
  for (const row of rows) {
    const keyNames=Object.keys(row.key),keys=Object.values(row.key),columns=Object.keys(row.values);
    const table='enlighten_operational.'+row.table,where=keyNames.map((name,i)=>name+'=$'+(i+1)).join(' AND ');
    const [current]=await tx.rows('SELECT '+columns.join(',')+' FROM '+table+' WHERE '+where,keys);
    if (current) {
      if (normal(row.values)===normal(current)) report.unchanged++;
      else report.conflicts.push({table:row.table,key:row.key});
      continue;
    }
    if (row.table==='linear_product_links'&&apply) {
      const [fitting]=await tx.rows("SELECT cells->>'dataJson' AS data FROM enlighten_operational.technical_fittings WHERE cells->>'fittingId'=$1",[row.values.fitting_id]);
      if (!fitting||!JSON.parse(fitting.data)?.products?.some(product=>String(product.id)===row.values.product_id)) {
        throw Error('Linear product link references a missing fitting or product.');
      }
    }
    if (apply) {
      const entries=Object.entries({...row.key,...row.values,...Object.fromEntries(Object.entries(row.metadata).filter(([,value])=>value!=null))});
      const json=new Set(['layout','data']);
      const values=entries.map(([name,value])=>json.has(name)&&value!==null?JSON.stringify(value):value);
      await tx.query('INSERT INTO '+table+' ('+entries.map(([name])=>name).join(',')+') VALUES ('+
        entries.map(([name],i)=>'$'+(i+1)+(json.has(name)?'::jsonb':'')).join(',')+')',values);
    }
    report.inserted++;
  }
  if (apply&&report.conflicts.length) throw Object.assign(Error('Typed row conflicts rolled back the synchronization.'),{report});
  return report;
}

export async function synchronizeOperationalWorkbook(database,book,{apply=false}={}) {
  const integrity=workbookIntegrity(book);
  const raw=planWorkbookCells(book),typed=typedRows(book),supplemental=readAssessmentAndFlagRows(book);
  return database.transaction(async tx=>{
    const nested={transaction:work=>work(tx)};
    const report={integrity,cells:await synchronizeWorkbookCells(nested,raw,{apply})};
    report.typed=await syncTyped(tx,typed,apply);
    report.assessmentsAndFlags=await synchronizeAssessmentAndFlagRows(nested,supplemental,{apply,parentsPlanned:true});
    return report;
  },{readOnly:!apply});
}

export function workbookIntegrity(book) {
  const projects=new Set(readTab(book,'Projects',{required:true}).map(row=>String(row.cells.projectId)));
  const historical=new Set(['Drawing_Register','Design_Dashboard','Design_Tasks','WIH','Work_Log','Files','Activity_Log']);
  const historicalMissingProjects={};
  for (const title of book.SheetNames) {
    for (const {cells} of readTab(book,title)) {
      const id=String(cells.projectId||'');
      if (!id||id==='*'||/^__.*__$/.test(id)||projects.has(id)) continue;
      if (!historical.has(title)) throw Error('Missing project relationship in '+title+'.');
      historicalMissingProjects[title]=(historicalMissingProjects[title]||0)+1;
    }
  }
  const ledger=new Map();
  let journalRecords=0;
  for (const {cells} of readTab(book,'Accounts Journal',{required:true})) {
    const record=JSON.parse(cells['Record JSON']);
    if (String(cells['Record ID'])!==record.id||cells['Record type']!==record.kind||!Array.isArray(record.postings)) {
      throw Error('Inconsistent Accounts Journal record.');
    }
    journalRecords++;
    let balance=0n;
    for (const posting of record.postings) {
      if (!posting.head||!Number.isSafeInteger(posting.debit)||posting.debit<0||
          !Number.isSafeInteger(posting.credit)||posting.credit<0) throw Error('Invalid Accounts Journal posting.');
      const entry=ledger.get(posting.head)||{debits:0n,credits:0n};
      entry.debits+=BigInt(posting.debit);
      entry.credits+=BigInt(posting.credit);
      ledger.set(posting.head,entry);
      balance+=BigInt(posting.debit)-BigInt(posting.credit);
    }
    if (balance!==0n) throw Error('Unbalanced Accounts Journal record.');
  }
  return {journalRecords,ledgerHeads:ledger.size,historicalMissingProjects};
}

if (process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href) {
  try {
    const [path,approval,...unknown]=process.argv.slice(2);
    if (!path||unknown.length) throw Error('Usage: node sync-operational-workbook.mjs <export.xlsx> [--apply=<sha256>]');
    const sha256=createHash('sha256').update(readFileSync(path)).digest('hex');
    const apply=approval!==undefined;
    if (apply&&approval!=='--apply='+sha256) throw Error('Apply requires the SHA-256 of the exact workbook reviewed in dry run.');
    const database=createDatabase();
    const report=await synchronizeOperationalWorkbook(database,readOperationalWorkbook(path),{apply});
    console.log(JSON.stringify({sha256,apply,...report},null,2));
  } catch(error) {
    console.error(error.report?JSON.stringify({error:error.message,report:error.report}):error.message);
    process.exitCode=1;
  }
}
