export function partyLedger(records) {
 const invoices=new Map(records.filter(record=>record.kind==='invoice').map(record=>[record.id,record]));
 const parties=new Map(), names=new Map();
 for(const profile of records.filter(r=>r.kind==='partyProfile')){
  const key=profile.name.trim().replace(/\s+/g,' ').toLowerCase();
  parties.set(key,{name:profile.name,profile,entries:[],debit:0,credit:0});
  for(const name of [profile.name,...(profile.aliases||[])])names.set(name.trim().replace(/\s+/g,' ').toLowerCase(),key);
 }
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
  const key=names.get(name.toLowerCase());
  if(!key)continue;
  const party=parties.get(key);
  party.debit+=debit;
  party.credit+=credit;
  party.entries.push({record,debit,credit,balance:party.debit-party.credit});
 }
 return parties;
}
