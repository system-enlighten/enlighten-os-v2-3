export function reconciliationIds(records){return new Set(records.filter(r=>r.kind==='reconciliation').flatMap(r=>Array.isArray(r.matchIds)?r.matchIds:r.matchId?[r.matchId]:[]));}
export function statementReconciliation(statement,records){return records.find(r=>r.kind==='reconciliation'&&(r.statementId===statement.id||r.bank===statement.bank&&r.date===statement.date&&r.direction===statement.direction&&r.amount===statement.amount&&String(r.reference||'').toLowerCase()===String(statement.reference||'').toLowerCase()));}
export function bankBookEntries(records,bank){
 const matched=reconciliationIds(records);let balance=0;
 return records.map((r,index)=>({...r,index})).filter(r=>(r.postings||[]).some(p=>p.head===bank&&(p.debit||p.credit))).sort((a,b)=>String(a.date).localeCompare(String(b.date))||a.index-b.index).map(r=>{
  const net=(r.postings||[]).filter(p=>p.head===bank).reduce((n,p)=>n+(p.debit||0)-(p.credit||0),0);balance+=net;
  return {...r,bookAmount:Math.abs(net),bookDirection:net>=0?'Inflow':'Outflow',runningBalance:balance,reconciled:r.kind==='reconciliation'||matched.has(r.id),status:r.kind==='reconciliation'?'Categorized':matched.has(r.id)?'Matched':r.kind==='opening'?'Opening':'Manually Added'};
 });
}
