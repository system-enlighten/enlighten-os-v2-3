export function productTypeSections(catalogue,database){
 const byCode=new Map(database.map(f=>[String(f.fittingType||'').trim(),f])),sections=[],used=new Set();let category='Product types',icons=[],mounts=[];
 for(const [r,row] of (catalogue?.rows||[]).entries()){
  const title=String(row[0]?.text||'').trim();if(title&&row.slice(1).some(c=>c.image)){if(!/height/i.test(title)){category=title;icons=row;mounts=catalogue.rows[r+1]||[];}}
  const cells=row.flatMap((cell,c)=>{const f=byCode.get(String(cell.text||'').trim());if(!c||!f||used.has(f.id))return [];used.add(f.id);return [{fitting:f,order:c*1024,icon:f.iconUrl||icons[c]?.image,reference:f.thumbnailUrl||catalogue.rows[r-1]?.[c]?.image,mount:mounts[c]?.text||''}];});
  if(cells.length){const height=String(catalogue.rows[r-1]?.[0]?.text||'').trim();sections.push({id:'row-'+r,label:[category,height].filter(Boolean).join(' · ').replace(/\n/g,' '),items:cells});}
 }
 const extra={id:'additional',label:'Additional product types',items:[...byCode.values()].filter(f=>!used.has(f.id)).map((f,i)=>({fitting:f,order:(i+1)*1024,icon:f.iconUrl,reference:f.thumbnailUrl,mount:''}))};sections.push(extra);
 const valid=new Set(sections.map(g=>g.id));const placed=sections.map(g=>({...g,items:[]}));const map=new Map(placed.map(g=>[g.id,g]));
 for(const g of sections)for(const item of g.items){const p=item.fitting.cataloguePlacement,target=p&&valid.has(p.group)?p.group:g.id;map.get(target).items.push({...item,order:Number.isFinite(p?.order)?p.order:item.order});}
 return placed.map(g=>({...g,items:g.items.sort((a,b)=>a.order-b.order||a.fitting.id.localeCompare(b.fitting.id))}));
}
export function insertionPlacement(section,index){const before=section.items[index-1]?.order,after=section.items[index]?.order;return {group:section.id,order:before===undefined?(after??1024)-1024:after===undefined?before+1024:(before+after)/2};}
export function movedPlacement(section,index,direction){const remaining={...section,items:section.items.filter((_,i)=>i!==index)};return insertionPlacement(remaining,Math.max(0,Math.min(remaining.items.length,index+direction)));}
