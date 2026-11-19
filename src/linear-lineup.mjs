export const normalizeLinearCode=value=>String(value||'').trim().toUpperCase().replace(/\s+/g,'');
export function linearCatalogue(groups,database){
 const codes=new Map(database.map(f=>[normalizeLinearCode(f.fittingType),f]));
 return groups.map(g=>({...g,products:g.products.map(p=>({...p,fitting:codes.get(normalizeLinearCode(p.code))||null}))}));
}
export function filterLinearGroups(groups,{application='',query='',brand=''}={}){
 const text=query.trim().toLowerCase();
 return groups.filter(g=>!application||g.id===application).map(g=>({...g,products:g.products.filter(p=>{
  if(brand&&!(p.fitting?.products||[]).some(b=>b.brand===brand))return false;
  return !text||[g.label,p.code,p.note,p.fitting?.category,...(p.fitting?.products||[]).flatMap(b=>[b.brand,b.model,b.articleNumber])].filter(Boolean).join(' ').toLowerCase().includes(text);
 })})).filter(g=>g.products.length);
}
export function linearApplications(groups,captions={}){return groups.flatMap(g=>g.applications.map(a=>({...a,id:g.id+':'+a.column,groupId:g.id,caption:captions[g.id+':'+a.column]??(g.applications.length===1?g.label:'')})));}
