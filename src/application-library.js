export const categoryKey=value=>String(value||'').toUpperCase().replace(/\[[^\]]*\]/g,'').replace(/\s+/g,' ').trim();
export const applicationCategories=record=>String(record.category||'').split(' || ').map(v=>v.trim()).filter(Boolean);
export const applicationMatches=(application,fitting)=>application.fittingType?application.fittingType===fitting.fittingType:applicationCategories(application).some(c=>categoryKey(c)===categoryKey(fitting.category));
export async function loadApplications(request){
 const [seed,overrides]=await Promise.all([fetch('/application-library/database.json').then(r=>{if(!r.ok)throw Error('Application images could not load.');return r.json();}),request('listApplicationImages',{},'POST',90000).then(rows=>({rows})).catch(e=>({rows:[],warning:e.message}))]);
 const map=new Map(seed.records.map(r=>[r.id,r]));overrides.rows.forEach(r=>map.set(r.id,{...map.get(r.id),...r}));return {records:[...map.values()],warning:overrides.warning||''};
}
