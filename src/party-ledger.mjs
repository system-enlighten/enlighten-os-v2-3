export function partyLedger(records) {
 const invoices=new Map(records.filter(record=>record.kind==='invoice').map(record=>[record.id,record]));
 const parties=new Map();
 const ordered=[...records].sort((a,b)=>String(a.date).localeCompare(String(b.date)));
 for(const record of ordered){
  let name='',debit=0,credit=0;
  if(record.kind==='invoice'||record.kind==='receipt'){
   const invoice=record.kind==='invoice'?record:invoices.get(record.invoiceId)||invoices.get(record.proformaId);
   name=invoice?.client||'';
   for(const posting of record.postings||[]){
    if(!['Accounts Receivable','Advance from Customers'].includes(posting.head))continue;
    debit+=Number(posting.debit)||0;
    credit+=Number(posting.credit)||0;
   }
  }else if(['transaction','reconciliation'].includes(record.kind)&&record.entryType!=='Contra'){
   name=record.beneficiary||'';
   for(const posting of record.postings||[]){
    if(posting.head!==record.bank)continue;
    debit+=Number(posting.credit)||0;
    credit+=Number(posting.debit)||0;
   }
  }
  name=name.trim().replace(/\s+/g,' ');
  if(!name||(!debit&&!credit))continue;
  const key=name.toLowerCase();
  if(!parties.has(key))parties.set(key,{name,entries:[],debit:0,credit:0});
  const party=parties.get(key);
  party.debit+=debit;
  party.credit+=credit;
  party.entries.push({record,debit,credit,balance:party.debit-party.credit});
 }
 return parties;
}
