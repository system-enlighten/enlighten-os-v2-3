export function productTypeSections(catalogue,database,originalFittings=database){
 const byCode=new Map(database.map(f=>[String(f.fittingType||'').trim(),f])),sections=[],used=new Set();let category='Product types',icons=[],mounts=[],headerRow=0;
 const byId=new Map(database.map(f=>[f.id,f]));
 const importedRows=new Map((catalogue?.sections||[]).map(section=>[section.codeRow,section]));
 const originalByCode=new Map(originalFittings.map(f=>[String(f.fittingType||'').trim(),f]));
 for(const [r,row] of (catalogue?.rows||[]).entries()){
  const imported=importedRows.get(r);
  if(catalogue?.sections&&!imported)continue;
  if(imported){
   const {photoRow,iconRow,mountRow}=imported;
   const items=row.flatMap((cell,c)=>{
    const fitting=byId.get(cell.fittingId);
    if(!fitting)return [];
    used.add(fitting.id);
    return [{fitting,sourceColumn:c,sourceRow:r,order:c*1024,icon:fitting.iconUrl,reference:fitting.thumbnailUrl,mount:catalogue.rows[mountRow]?.[c]?.text||''}];
   });
   sections.push({id:'row-'+r,headerRow:iconRow,photoRow,mountRow,label:imported.category,items});
   continue;
  }
  const title=String(row[0]?.text||'').trim();if(title&&row.slice(1).some(c=>c.image)){if(!/height/i.test(title)){category=title;headerRow=r;icons=row;mounts=catalogue.rows[r+1]||[];}}
  const cells=row.flatMap((cell,c)=>{const code=String(cell.text||'').trim(),original=originalByCode.get(code);const f=original?byId.get(original.id):byCode.get(code);if(!c||!f||used.has(f.id))return [];used.add(f.id);return [{fitting:f,sourceColumn:c,sourceRow:r,order:c*1024,icon:f.iconUrl??icons[c]?.image,reference:f.thumbnailUrl??catalogue.rows[r-1]?.[c]?.image,mount:mounts[c]?.text||''}];});
  if(cells.length){const height=String(catalogue.rows[r-1]?.[0]?.text||'').trim();sections.push({id:'row-'+r,headerRow,label:[category,height].filter(Boolean).join(' · ').replace(/\n/g,' '),items:cells});}
 }
 const extra={id:'additional',label:'Additional product types',items:database.filter(f=>!used.has(f.id)).map((f,i)=>({fitting:f,order:(i+1)*1024,icon:f.iconUrl,reference:f.thumbnailUrl,mount:''}))};sections.push(extra);
 const valid=new Set(sections.map(g=>g.id));const placed=sections.map(g=>({...g,items:[]}));const map=new Map(placed.map(g=>[g.id,g]));
 for(const g of sections)for(const item of g.items){const p=item.fitting.cataloguePlacement,target=p&&valid.has(p.group)?p.group:g.id;map.get(target).items.push({...item,order:Number.isFinite(p?.order)?p.order:item.order});}
 return placed.map(g=>({...g,items:g.items.sort((a,b)=>a.order-b.order||a.fitting.id.localeCompare(b.fitting.id))}));
}
export function insertionPlacement(section,index){const before=section.items[index-1]?.order,after=section.items[index]?.order;return {group:section.id,order:before===undefined?(after??1024)-1024:after===undefined?before+1024:(before+after)/2};}
export function movedPlacement(section,index,direction){const remaining={...section,items:section.items.filter((_,i)=>i!==index)};return insertionPlacement(remaining,Math.max(0,Math.min(remaining.items.length,index+direction)));}

function slotLayout(section){
 const slots=new Map(),deletedColumns=[];
 let cursor=1;
 for(const item of section.items){
  const column=Math.max(cursor,Math.ceil(item.order/1024),1);
  cursor=column+1;
  if(item.fitting.deleted)deletedColumns.push(column);
  else slots.set(column-deletedColumns.length,item);
 }
 return {slots,deletedColumns};
}
export function productTypeSlots(section){return slotLayout(section).slots;}
export function productTypePlacementAt(section,column){
 for(const deleted of slotLayout(section).deletedColumns){if(deleted<=column)column++;}
 return {group:section.id,order:column*1024};
}
export function dropProductPlacement(section,draggedId,column,after=false){const target=productTypeSlots(section).get(column);if(!target||target.fitting.id===draggedId)return productTypePlacementAt(section,column);const remaining={...section,items:section.items.filter(i=>i.fitting.id!==draggedId)};const index=remaining.items.findIndex(i=>i.fitting.id===target.fitting.id);return insertionPlacement(remaining,index+(after?1:0));}
