import {randomUUID} from 'node:crypto';
import {isSystemAdmin} from './permissions.js';

const ACCOUNTS_CASH=['Cash','IDFC'];
const nowIso_=()=>new Date().toISOString();

function accountsText_(value, limit=250) {
  return String(value ?? '').trim().slice(0,limit);
}

function accountsDate_(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isFinite(Date.parse(value)) ||
      new Date(value).toISOString().slice(0,10)!==value) throw Error('Enter a valid date.');
  return value;
}

function accountsMoney_(value, zero=false) {
  const s = String(value ?? '').trim().replace(/,/g, '');
  if (!s && zero) return 0;
  if (!/^\d{1,10}(\.\d{1,2})?$/.test(s)) throw Error('Enter an INR amount with up to two decimal places.');
  const n = Math.round(Number(s)*100);
  if (!zero && !n) throw Error('Amount must be greater than zero.');
  return n;
}

function accountsInvoiceNumber_(date,records,type='Invoice'){const year=Number(date.slice(0,4))-(Number(date.slice(5,7))<4?1:0),prefix=(type==='Proforma Invoice'?'E-PI-':'E-IN-')+String(year).slice(-2)+'-'+String(year+1).slice(-2)+'-';return prefix+String(records.filter(r=>r.number?.startsWith(prefix)).reduce((n,r)=>Math.max(n,Number(r.number.slice(prefix.length))||0),0)+1).padStart(3,'0');}
function accountsReceiptInvoice_(proforma,receipt,records){const amount=receipt.amount;if(amount===proforma.amount)return {...proforma,id:receipt.id+'-INV',documentType:'Invoice',date:receipt.date,dueDate:receipt.date,number:accountsInvoiceNumber_(receipt.date,records),proformaId:proforma.id,generatedFromReceiptId:receipt.id,author:receipt.author,postings:[{head:'Accounts Receivable',debit:amount,credit:0},{head:'Design Fees',debit:0,credit:amount}]};let remaining=amount;const items=proforma.items.map((item,i)=>{const value=i===proforma.items.length-1?remaining:Number(BigInt(amount)*BigInt(item.amount)/BigInt(proforma.amount));remaining-=value;return {...item,description:'Part payment · '+item.description,quantity:1,unit:'LS',rate:value,amount:value}}).filter(i=>i.amount>0);return {...proforma,id:receipt.id+'-INV',documentType:'Invoice',date:receipt.date,dueDate:receipt.date,number:accountsInvoiceNumber_(receipt.date,records),proformaId:proforma.id,generatedFromReceiptId:receipt.id,author:receipt.author,words:'',items,amount,postings:[{head:'Accounts Receivable',debit:amount,credit:0},{head:'Design Fees',debit:0,credit:amount}]};}

function accountsStatementKey_(r){const norm=v=>String(v||'').trim().replace(/\s+/g,' ').toLowerCase(),ref=norm(r.reference);return JSON.stringify([norm(r.bank),r.date,r.valueDate||r.date,r.direction,r.amount,/^(ref|txn)-\d+$/i.test(ref)?'':ref,norm(r.description)]);}
function accountsReconciliationLinks_(records){return new Set(records.filter(r=>r.kind==='reconciliation').flatMap(r=>Array.isArray(r.matchIds)?r.matchIds:r.matchId?[r.matchId]:[]));}
function accountsReconciliationMatch_(payload,data,record){
 const used=accountsReconciliationLinks_(data.records);
 if(payload.statementId){
  const statement=data.records.find(r=>r.kind==='statement'&&r.id===payload.statementId);
  if(!statement)throw Error('Select a saved statement line.');
  if(data.records.some(r=>r.kind==='reconciliation'&&r.statementId===statement.id))throw Error('Statement line is already reconciled.');
  for(const key of ['bank','date','amount','direction','reference'])if(record[key]!==statement[key])throw Error('Statement details changed. Refresh before matching.');
 }
 const explicit=Array.isArray(payload.matchIds);
 if(explicit){
  if(!payload.matchIds.length||payload.matchIds.length>100||new Set(payload.matchIds).size!==payload.matchIds.length)throw Error('Select between 1 and 100 different book entries.');
  const matches=payload.matchIds.map(id=>data.records.find(r=>r.id===id));
  for(const match of matches)if(!match||!['transaction','receipt'].includes(match.kind)||match.bank!==record.bank||match.direction!==record.direction||used.has(match.id))throw Error('A selected book entry is unavailable, already matched, or belongs to another account/direction.');
  const sum=matches.reduce((n,r)=>n+r.amount,0);
  if(sum>record.amount||sum!==record.amount&&payload.mode!=='split')throw Error('Selected book entries must equal the statement amount, or categorize the remaining amount.');
  return matches;
 }
 if(payload.mode==='manual')return [];
 const candidates=data.records.filter(r=>['transaction','receipt'].includes(r.kind)&&r.bank===record.bank&&(r.valueDate||r.date)===record.date&&r.amount===record.amount&&r.direction===record.direction&&!used.has(r.id));
 const referenceMatches=candidates.filter(r=>r.reference===record.reference);
 if(referenceMatches.length===1)return referenceMatches;
 if(!referenceMatches.length&&candidates.length===1)return candidates;
 if(candidates.length)throw Error('Select the correct book entries in Match Transactions.');
 return [];
}

function accountsStatementAlreadyMatched_(s,records){return records.some(r=>r.kind==='reconciliation'&&(r.statementId===s.id||r.bank===s.bank&&r.date===s.date&&r.direction===s.direction&&r.amount===s.amount&&String(r.reference||'').toLowerCase()===String(s.reference||'').toLowerCase()));}

function accountsUniqueBankMatches_(records,user){
 const used=accountsReconciliationLinks_(records),statements=records.filter(s=>s.kind==='statement'&&s.bank!=='Cash'&&!accountsStatementAlreadyMatched_(s,records)),books=records.filter(r=>['transaction','receipt'].includes(r.kind)&&!used.has(r.id));
 const same=(s,r)=>s.bank===r.bank&&s.date===r.date&&s.direction===r.direction&&s.amount===r.amount;
 const links=[];for(const statement of statements){const candidates=books.filter(r=>same(statement,r));if(candidates.length!==1)continue;const book=candidates[0];if(statements.filter(s=>same(s,book)).length!==1)continue;links.push({id:randomUUID(),kind:'reconciliation',date:statement.date,valueDate:statement.valueDate||statement.date,bank:statement.bank,direction:statement.direction,amount:statement.amount,reference:statement.reference,description:book.description||statement.description,projectId:book.projectId||'',projectName:book.projectName||'',head:'',matchId:book.id,matchIds:[book.id],statementId:statement.id,categorizedAmount:0,postings:[],author:user.email,createdAt:nowIso_(),matchMethod:'Unique exact date, direction and amount'});}
 return links;
}

export function buildAccountsEntry(payload,data,user) {
    const id = accountsText_(payload.id);
    if (!/^[a-zA-Z0-9-]{12,50}$/.test(id)) throw Error('Invalid record ID.');
    const previous = data.records.find(r=>r.id===id);
    if(previous&&payload.isEdit&&(previous.kind==='receipt'||previous.generatedFromReceiptId||previous.kind==='invoice'&&data.records.some(r=>r.kind==='receipt'&&(r.invoiceId===id||r.proformaId===id))))throw Error('Paid documents and receipts cannot be edited.');
    const isEdit = Boolean(payload.isEdit);
    if(isEdit&&!previous)throw Error('Record no longer exists. Refresh before editing.');
    if(isEdit&&previous.kind==='reconciliation')throw Error('Reconciled entries cannot be edited.');

    if (previous && !isEdit) {
      if(previous.kind!==payload.kind||previous.author!==user.email)throw Error('Record ID is already in use.');
      return {record:previous,unchanged:true};
    }

    if (previous && isEdit) {
      const canEdit = isSystemAdmin(user) || user.departmentKey === 'accounts' || previous.author === user.email;
      if (!canEdit) throw Error('Permission denied to update this record.');
    }

    const {kind}=payload;
    if(isEdit&&(previous.kind!==kind||/^deleted/.test(previous.kind)))throw Error('The record type cannot be changed.');
    if(isEdit&&accountsReconciliationLinks_(data.records).has(id))throw Error('Reconciled entries cannot be edited.');
    const date = accountsDate_(payload.date);
    const projectId=accountsText_(payload.projectId);
    const project=data.projects.find(p=>p.id===projectId);
    if (projectId && !project) throw Error('Select an existing project.');
    const record={id,kind,date,projectId,projectName:project?.name||'',author:user.email,postings:[]};
    const add=(debit,credit,amount)=>{
      if (!amount) return;
      if (debit===credit || !data.heads.some(h=>h[0]===debit) || !data.heads.some(h=>h[0]===credit)) throw Error('Select two different ledger heads.');
      record.postings.push({head:debit,debit:amount,credit:0},{head:credit,debit:0,credit:amount});
    };
    const bank=accountsText_(payload.bank), reference=accountsText_(payload.reference);
    const requireBank=()=>{if(!ACCOUNTS_CASH.includes(bank))throw Error('Choose a bank or cash account.');};
    const duplicate=()=>{
      if(!isEdit && reference && data.records.some(r=>r.bank===bank&&r.date===date&&r.amount===record.amount&&String(r.reference||'').toLowerCase()===reference.toLowerCase()))throw Error('This payment reference, date and amount have already been posted.');
    };

    let generatedInvoice=null;
    if(kind==='billingProfile'){
      if(!project)throw Error('Choose a project.');
      for(const key of ['client','address','state','stateCode','gstin','contact','contactEmail','phone'])record[key]=accountsText_(payload[key],key==='address'?1200:250);
      record.gstin=record.gstin.toUpperCase();if(!record.client||!record.address)throw Error('Enter client name and billing address.');if(record.gstin&&!/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(record.gstin))throw Error('Enter a valid 15-character GSTIN or leave blank.');
      record.updatedAt=nowIso_();
    }else if(kind==='gstFiling'){
      const period=accountsText_(payload.period);
      const returnType=accountsText_(payload.returnType);
      if(!/^\d{4}-(0[1-9]|1[0-2])$/.test(period))throw Error('Select a valid reporting period.');
      if(!['GSTR-1','IMS','GSTR-2B','GSTR-3B','CMP-08','GSTR-4'].includes(returnType))throw Error('Select a GST form.');
      if(!reference||reference.length>100)throw Error('Enter a filing reference of up to 100 characters.');
      if(!isEdit && data.records.some(r=>r.kind===kind&&r.period===period&&r.returnType===returnType))throw Error('A record already exists for this form and reporting period.');
      Object.assign(record,{period,returnType,reference});
    } else if(kind==='invoiceDispatch'){
      const sentInvoiceId=accountsText_(payload.sentInvoiceId);
      if(!data.records.some(r=>r.id===sentInvoiceId&&['invoice','legacyInvoice'].includes(r.kind)))throw Error('Select an existing invoice.');
      const sent=data.records.find(r=>r.kind==='invoiceDispatch'&&r.sentInvoiceId===sentInvoiceId);
      if(sent)return {record:sent,unchanged:true};
      record.sentInvoiceId=sentInvoiceId;
    } else if(kind==='opening'){
      const canManageOpening = isSystemAdmin(user) || user.departmentKey === 'accounts';
      if(!canManageOpening)throw Error('Accounts admin access required for opening balances.');
      record.amount=accountsMoney_(payload.amount);
      record.description=accountsText_(payload.description);
      if(!record.description)throw Error('Enter an opening balance reference.');
      if([payload.debitHead,payload.creditHead].some(head=>['Accounts Receivable','Employee Advances'].includes(head)))throw Error('Opening receivables and employee advances need their project or employee subledger.');
      add(payload.debitHead,payload.creditHead,record.amount);
    } else if(kind==='milestone'){
      if(!project)throw Error('Choose a project.');
      record.amount=accountsMoney_(payload.amount);
      record.description=accountsText_(payload.description);
      if(!record.description)throw Error('Enter a milestone description.');
    } else if(kind==='invoice'){
      if(!project)throw Error('Choose a project.');
      const types=['Proforma Invoice','Invoice','Bill of Supply'];
      if(!types.includes(payload.documentType))throw Error('Select a document type.');
      record.documentType=payload.documentType;
      record.client=accountsText_(payload.client);
      record.address=accountsText_(payload.address,1200);
      record.dueDate=accountsDate_(payload.dueDate||date);
      if(!record.client||!record.address||record.dueDate<date)throw Error('Enter a client, billing address and valid due date.');
      ['state','stateCode','gstin','po','contact','phone','words','orderDate'].forEach(k=>record[k]=accountsText_(payload[k]));
      record.milestoneId=accountsText_(payload.milestoneId);
      if(record.milestoneId && (!data.records.some(r=>r.id===record.milestoneId&&r.kind==='milestone'&&r.projectId===projectId) ||
        data.records.some(r=>r.id!==id&&r.kind==='invoice'&&r.documentType!=='Proforma Invoice'&&r.milestoneId===record.milestoneId)))throw Error('Choose an unbilled milestone for this project.');
      if(!Array.isArray(payload.items)||!payload.items.length||payload.items.length>25)throw Error('Enter 1 to 25 service lines.');
      record.items=payload.items.map(item=>{
        const description=accountsText_(item.description,1000);
        const quantity=Number(item.quantity);
        const rate=accountsMoney_(item.rate);
        if(!description||!Number.isSafeInteger(quantity)||quantity<1||quantity>10000||!Number.isSafeInteger(quantity*rate))throw Error('Enter a description, positive whole quantity and valid rate on each line.');
        return {description,quantity,rate,unit:accountsText_(item.unit)||'LS',sac:accountsText_(item.sac)||'99839',amount:quantity*rate};
      });
      record.amount=record.items.reduce((n,i)=>n+i.amount,0);
      if(!Number.isSafeInteger(record.amount)) throw Error('Invoice total is too large.');

      if (isEdit && previous?.number) {
        record.number = previous.number;
      } else {
        record.number=accountsInvoiceNumber_(date,data.records,record.documentType);
      }

      if(record.documentType!=='Proforma Invoice')add('Accounts Receivable','Design Fees',record.amount);
    } else if(kind==='receipt'){
      requireBank();
      const invoice=data.records.find(r=>r.id===payload.invoiceId&&['invoice','legacyInvoice'].includes(r.kind)&&r.documentType!=='Proforma Invoice');
      const proforma=data.records.find(r=>r.id===payload.invoiceId&&r.kind==='invoice'&&r.documentType==='Proforma Invoice');

      if (!invoice && !proforma) throw Error('Select an existing invoice or proforma.');

      record.amount=accountsMoney_(payload.amount);
      const target = invoice || proforma;
      if(date<target.date)throw Error('Payment date cannot precede the billing document date.');
      const received=data.records.filter(r=>r.kind==='receipt'&&(r.invoiceId===target.id||r.proformaId===target.id)).reduce((n,r)=>n+r.amount,0);

      if(record.amount > target.amount - received)throw Error('Receipt exceeds the invoice balance.');

      Object.assign(record,{
        bank,
        reference,
        invoiceId:target.id,
        projectId:target.projectId,
        projectName:target.projectName,
        direction:'Inflow',
        isAdvance:Boolean(proforma)
      });
      duplicate();

      if (invoice) {
        add(bank,'Accounts Receivable',record.amount);
      } else {
        generatedInvoice=accountsReceiptInvoice_(proforma,record,data.records);
        record.proformaId=proforma.id;record.invoiceId=generatedInvoice.id;record.generatedInvoiceId=generatedInvoice.id;record.isAdvance=false;
        add(bank,'Accounts Receivable',record.amount);
      }
    } else if(kind==='transaction'){
      requireBank();
      record.amount=accountsMoney_(payload.amount);
      const head=accountsText_(payload.head), direction=accountsText_(payload.direction);
      const account=data.heads.find(h=>h[0]===head);
      if(!account||!['Inflow','Outflow'].includes(direction))throw Error('Choose a direction and ledger head.');
      if((direction==='Inflow'&&['Direct expense','Expense'].includes(account[1]))||
        (direction==='Outflow'&&account[1]==='Revenue'))throw Error('The selected direction does not match this ledger head.');
      Object.assign(record,{bank,head,direction,reference,valueDate:accountsDate_(payload.valueDate||date),description:accountsText_(payload.description),beneficiary:accountsText_(payload.beneficiary),classification:accountsText_(payload.classification)});
      if(head==='Accounts Receivable')throw Error('Record the receipt against its invoice in Payment Dashboard or Invoicing.');
      if(head==='Employee Advances'){
        const employee=data.employees.find(p=>p.id===String(payload.employeeId));
        if(!employee)throw Error('Choose an employee for the advance.');
        record.employeeId=employee.id;
        if(direction==='Inflow'){
          const advance=data.records.filter(r=>r.id!==id&&r.employeeId===employee.id).flatMap(r=>r.postings).filter(p=>p.head===head).reduce((n,p)=>n+p.debit-p.credit,0);
          if(record.amount>advance)throw Error('Repayment exceeds the recorded employee advance.');
        }
      }
      duplicate();
      if(direction==='Inflow')add(bank,head,record.amount);else add(head,bank,record.amount);
    } else if(kind==='payroll'){
      const employee=data.employees.find(p=>p.id===String(payload.employeeId));
      if(!employee)throw Error('Choose an active employee.');
      if(!isEdit && data.records.some(r=>r.kind==='payroll'&&r.employeeId===String(employee.id)&&r.date.slice(0,7)===date.slice(0,7)))throw Error('Payroll already exists for that employee and month.');
      const gross=accountsMoney_(payload.gross), allowances=accountsMoney_(payload.allowances,true);
      const deductions=accountsMoney_(payload.deductions,true), advance=accountsMoney_(payload.advance,true);
      const working=Number(payload.working), present=Number(payload.present), leave=Number(payload.leave), hours=Number(payload.hours), multiplier=Number(payload.multiplier);
      const days=new Date(Date.UTC(Number(date.slice(0,4)),Number(date.slice(5,7)),0)).getUTCDate();
      if(!Number.isInteger(working)||working<1||working>days||
        ![present,leave,hours,multiplier].every(n=>Number.isFinite(n)&&n>=0)||
        present+leave>days||hours>744||multiplier>5)throw Error('Review the payroll inputs.');
      if(!['Working days','Calendar days'].includes(payload.method))throw Error('Select a daily wage basis.');
      const divisor=payload.method==='Calendar days'?days:working;
      if(present+leave>divisor)throw Error('Payable days exceed the selected pay period.');
      const earned=Math.round((present+leave)*gross/divisor);
      const overtime=Math.round(hours*gross/(working*8)*multiplier);
      const total=earned+allowances+overtime;
      const net=total-deductions-advance;
      if(net<0)throw Error('Deductions exceed earned pay.');
      const advanceBalance=data.records.filter(r=>r.id!==id&&r.employeeId===String(employee.id)).flatMap(r=>r.postings).filter(p=>p.head==='Employee Advances').reduce((n,p)=>n+p.debit-p.credit,0);
      if(advance>0&&advance>advanceBalance)throw Error('Advance recovery exceeds this employee’s recorded advance balance.');
      Object.assign(record,{employeeId:String(employee.id),employee:employee.name,gross,allowances,deductions,advance,working,present,leave,hours,multiplier,earned,overtime,amount:net,method:payload.method});
      add('Salary and Wages','Payroll Payable',net);
      add('Salary and Wages','Employee Advances',advance);
      add('Salary and Wages','Payroll Deductions Payable',deductions);
    } else if(kind==='reconciliation'){
      requireBank();
      record.amount=accountsMoney_(payload.amount);
      const direction=accountsText_(payload.direction);
      if(!['Inflow','Outflow'].includes(direction))throw Error('Select the statement direction.');
      if(!reference)throw Error('Enter the bank statement reference.');
      if(!isEdit && data.records.some(r=>r.kind==='reconciliation'&&r.bank===bank&&r.reference===reference&&r.date===date&&r.amount===record.amount&&r.direction===direction))throw Error('Statement row is already reconciled.');
      Object.assign(record,{bank,reference,direction});
      const matches=accountsReconciliationMatch_(payload,data,record),match=matches[0];
      const categorizedAmount=record.amount-matches.reduce((n,r)=>n+r.amount,0);
      let head=categorizedAmount?accountsText_(payload.head):'';
      if(categorizedAmount&&!head)throw Error('Select a ledger head for this unmatched statement line.');
      const category=data.heads.find(h=>h[0]===head)?.[1];
      if(categorizedAmount&&head!=='Suspense Clearing'&&((direction==='Inflow'&&['Direct expense','Expense'].includes(category))||(direction==='Outflow'&&category==='Revenue')))throw Error('The clearing ledger does not match this statement direction.');
      if(categorizedAmount&&head==='Employee Advances')throw Error('Post the employee advance in Debit / Credit before reconciling.');
      if(categorizedAmount&&head==='Accounts Receivable')throw Error('Record a receipt against the invoice before reconciling.');
      Object.assign(record,{bank,reference,direction,head,description:accountsText_(payload.description),beneficiary:accountsText_(payload.beneficiary),classification:accountsText_(payload.classification),valueDate:payload.valueDate?accountsDate_(payload.valueDate):date,matchId:matches.length===1?match.id:'',matchIds:matches.map(r=>r.id),categorizedAmount,statementId:accountsText_(payload.statementId)});
      if(categorizedAmount){if(direction==='Inflow')add(bank,head,categorizedAmount);else add(head,bank,categorizedAmount);}
    } else throw Error('Unknown Accounts entry.');

    const json=JSON.stringify(record);
    if(json.length>45000)throw Error('Record is too large.');
    return {record,generatedInvoice};
}

export function buildStatementImport(payload,data,user) {
  if(!Array.isArray(payload.rows)||!payload.rows.length||payload.rows.length>1000)throw Error('Import between 1 and 1,000 statement rows at a time.');
  const existing=data.records.filter(r=>r.kind==='statement'),seen=new Map(),rows=[];
  const remember=r=>{const key=accountsStatementKey_(r);if(!seen.has(key))seen.set(key,new Set());seen.get(key).add(r.statementBalance===undefined?'unknown':String(r.statementBalance));};
  existing.forEach(remember);
  for(const input of payload.rows){
   const date=accountsDate_(input.date),bank=accountsText_(input.bank),direction=accountsText_(input.direction),amount=accountsMoney_(input.amount),reference=accountsText_(input.reference),description=accountsText_(input.description,1200),id=accountsText_(input.id);
   if(!ACCOUNTS_CASH.includes(bank))throw Error('Choose an Enlighten bank or cash account.');
   if(!['Inflow','Outflow'].includes(direction)||!reference)throw Error('Every statement row needs a direction and reference.');
   if(!/^[a-zA-Z0-9-]{12,50}$/.test(id))throw Error('Invalid statement row ID.');
   const projectId=accountsText_(input.projectId),head=accountsText_(input.head);
   if(projectId&&!data.projects.some(p=>p.id===projectId))throw Error('Unknown statement project ID: '+projectId);
   if(head&&!data.heads.some(h=>h[0]===head))throw Error('Unknown statement ledger head: '+head);
   const record={id,kind:'statement',date,valueDate:input.valueDate?accountsDate_(input.valueDate):date,bank,direction,amount,reference,description,projectId,head,beneficiary:accountsText_(input.beneficiary),classification:accountsText_(input.classification),author:user.email,importedAt:nowIso_(),postings:[]};
   if(input.statementBalance!==undefined&&input.statementBalance!==''){const balance=String(input.statementBalance);if(!/^-?\d{1,10}(\.\d{1,2})?$/.test(balance))throw Error('Invalid statement balance.');record.statementBalance=Math.round(Number(balance)*100);}
   const key=accountsStatementKey_(record),balances=seen.get(key),balance=record.statementBalance===undefined?'unknown':String(record.statementBalance);if(balances&&(balance==='unknown'||balances.has('unknown')||balances.has(balance)))continue;
   if(data.records.some(r=>r.id===id)||rows.some(r=>r.id===id))throw Error('Statement ID is already in use.');
   remember(record);rows.push(record);
  }
  const links=payload.autoMatch===true?accountsUniqueBankMatches_([...data.records,...rows],user):[],all=rows.concat(links);
  return {rows,links,all};
}
