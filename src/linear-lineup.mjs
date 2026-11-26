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

// The Numbers catalogue's linear blocks run from Cove through Cabinet / Shelf / Niche.
export const isLinearCatalogueRow = row => row >= 39 && row <= 83;

export function catalogueLinearGroups(catalogue, fittings, existingGroups) {
 const byId = new Map(fittings.map(fitting => [fitting.id,fitting]));
 const existing = new Set(existingGroups.map(group => JSON.stringify(group.products.map(product => normalizeLinearCode(product.code)))));
 return (catalogue?.sections || []).filter(section => isLinearCatalogueRow(section.codeRow)).flatMap(section =>
  (catalogue.rows[section.codeRow] || []).flatMap((cell,column) => {
   const fitting = byId.get(cell.fittingId);
   if (!column || !fitting || fitting.deleted || existing.has(JSON.stringify([normalizeLinearCode(fitting.fittingType)]))) return [];
   const icon = catalogue.rows[section.iconRow]?.[column]?.image || fitting.iconUrl;
   const image = catalogue.rows[section.photoRow]?.[column]?.image || fitting.thumbnailUrl;
   const category = section.category || catalogue.rows[section.photoRow]?.[0]?.text || 'Linear light';
   const mounting = catalogue.rows[section.mountRow]?.[column]?.text;
   const dimensions = catalogue.rows[section.codeRow - 1]?.[column]?.text;
   return [{
    id: `catalogue-${section.codeRow}-${column}`,
    label: [category.replace(/\s+/g,' '),mounting].filter(Boolean).join(' · '),
    applications: icon ? [{column,url:icon}] : [],
    products: [{code:fitting.fittingType,image,note:section.codeRow-1>section.photoRow?dimensions:''}],
   }];
  })
 );
}
