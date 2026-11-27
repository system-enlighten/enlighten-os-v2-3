export const normalizeLinearCode=value=>String(value||'').trim().toUpperCase().replace(/\s+/g,'');
export const COLOUR_VARIANT_LABELS=['Static Colour','Tunable White','Dim to Warm','RGBW'];
export const imageIdentity=url=>{const match=String(url||'').match(/(?:catalogue-)?([a-f0-9]{16})(?:[a-f0-9]{4})?\.png$/i);return match?match[1]:url;};
export function productTileImage(product){
 return product?.imageUrl
  ||product?.specs?.manufacturerFamily?.models?.find(m=>m?.imageUrl)?.imageUrl
  ||product?.specs?.diagramUrl
  ||product?.specs?.manufacturerFamily?.models?.find(m=>m?.diagramUrl)?.diagramUrl
  ||'';
}
export const linearCodeNumber=code=>{const match=String(code||'').trim().toUpperCase().match(/\|([A-Z0-9]+)$/);return match?match[1]:'';};
export function resolveIconsFor({app,variantIcons,layoutVariantIcons,primarySlot=1}){
 const icons=new Map(variantIcons?.get(app.id)||[[primarySlot,app.url]]);
 for(const [slot,url] of Object.entries(layoutVariantIcons?.[app.id]||{}))icons.set(Number(slot),url);
 return [...icons].filter(([,url])=>url).sort((a,b)=>b[0]-a[0]).filter((entry,i,all)=>all.findIndex(x=>imageIdentity(x[1])===imageIdentity(entry[1]))===i);
}
export function resolveIconCode({app,slot,primarySlot=1,familyNumber='',groupCode='',codes={},variantCodes={},catalogueFamilyCodes}){
 const savedVariantCode=variantCodes?.[app.id]?.[slot];
 if(savedVariantCode)return savedVariantCode;
 const catalogueCode=familyNumber?catalogueFamilyCodes?.get(familyNumber)?.get(Number(slot)):'';
 if(Number(slot)===Number(primarySlot))return codes[app.id]||app.code||catalogueCode||familyNumber||groupCode||'';
 return catalogueCode||'';
}
export function filterUnassignedReferences({references,rows,canonicalIds,extraUsedImages=[]}){
 const usedImages=new Set([
  ...rows.flatMap(g=>g.products.map(p=>imageIdentity(p.image||p.fitting?.thumbnailUrl))),
  ...extraUsedImages.map(imageIdentity),
 ].filter(Boolean));
 const usedRowNumbers=new Set(rows.flatMap(g=>g.products.map(p=>{const num=linearCodeNumber(p.code);return num?`${g.id}:${num}`:'';}).filter(Boolean)));
 const lineupRowNumbers=new Set(references.filter(p=>!String(p.sourceGroup||'').startsWith('catalogue-')).flatMap(p=>{const num=linearCodeNumber(p.code);return num?p.ids.map(id=>`${canonicalIds?.get(id)||id}:${num}`):[];}));
 const suppressedImages=new Set();
 for(const p of references){
  const image=p.image||p.fitting?.thumbnailUrl;
  if(!image||!String(p.sourceGroup||'').startsWith('catalogue-'))continue;
  const num=linearCodeNumber(p.code);
  if(num&&p.ids.some(id=>{const canonical=canonicalIds?.get(id)||id;return usedRowNumbers.has(`${canonical}:${num}`)||lineupRowNumbers.has(`${canonical}:${num}`);})){
   suppressedImages.add(imageIdentity(image));
  }
 }
 return references.filter(p=>{
  const image=p.image||p.fitting?.thumbnailUrl;
  if(!image)return false;
  const id=imageIdentity(image);
  return !usedImages.has(id)&&!suppressedImages.has(id);
 }).filter((p,i,all)=>all.findIndex(x=>imageIdentity(x.image||x.fitting?.thumbnailUrl)===imageIdentity(p.image||p.fitting?.thumbnailUrl))===i);
}
export function targetFittingOptionsForRow({row,groupProducts=[],database=[],iconCodes=[],isCustom=false}){
 const activeFittings=database.filter(f=>!f.deleted);
 const fittingsByCode=new Map(activeFittings.map(f=>[normalizeLinearCode(f.fittingType),f]));
 const fallbackFitting=(row?.products?.find(p=>p.fitting)||groupProducts.find(p=>p.fitting))?.fitting||null;
 const options=new Map();
 for(const code of iconCodes){
  if(!code)continue;
  const matched=fittingsByCode.get(normalizeLinearCode(code))||fallbackFitting;
  if(matched&&!options.has(matched.id))options.set(matched.id,{fitting:matched,code});
 }
 const rowProducts=[...(row?.products||[]),...groupProducts].filter(p=>p.fitting);
 if(!(groupProducts.length<=1&&options.size>0)){
  const primaryReplaced=Boolean(iconCodes[0]&&groupProducts[0]?.fitting&&normalizeLinearCode(iconCodes[0])!==normalizeLinearCode(groupProducts[0].code)&&fittingsByCode.has(normalizeLinearCode(iconCodes[0])));
  for(const p of rowProducts){
   if(primaryReplaced&&p.fitting.id===groupProducts[0].fitting.id)continue;
   if(!options.has(p.fitting.id))options.set(p.fitting.id,{fitting:p.fitting,code:p.code});
  }
 }
 if(isCustom){
  for(const fitting of activeFittings){
   if(!options.has(fitting.id))options.set(fitting.id,{fitting,code:fitting.fittingType});
  }
 }
 return [...options.values()];
}
export function extractCodeSortKey(code){
 const text=String(code||'').trim().toUpperCase();
 const pipeMatch=text.match(/\|.*?(?:^|\D)(\d{3})([A-Z]*)$/)||text.match(/\|(\d{1,3})([A-Z]*)$/);
 if(pipeMatch)return {num:Number(pipeMatch[1]),suffix:pipeMatch[2]||''};
 const tailMatch=text.match(/(\d{3})([A-Z]*)$/);
 if(tailMatch)return {num:Number(tailMatch[1]),suffix:tailMatch[2]||''};
 return null;
}
export function sortLinearApplications(applications,{getCodes,order=[],customApplications=[]}={}){
 const orderIndex=new Map(order.map((id,i)=>[id,i]));
 const customIndex=new Map(customApplications.map((a,i)=>[a.id,i]));
 const keyFor=app=>{
  for(const code of getCodes(app)){
   const key=extractCodeSortKey(code);
   if(key)return key;
  }
  return null;
 };
 return [...applications].sort((a,b)=>{
  const aCustom=String(a.id||'').startsWith('custom-'),bCustom=String(b.id||'').startsWith('custom-');
  if(aCustom!==bCustom)return aCustom?1:-1;
  if(aCustom&&bCustom){
   const ao=customIndex.get(a.id)??orderIndex.get(a.id)??Infinity;
   const bo=customIndex.get(b.id)??orderIndex.get(b.id)??Infinity;
   return ao-bo;
  }
  const ka=keyFor(a),kb=keyFor(b);
  if(ka&&kb){
   if(ka.num!==kb.num)return ka.num-kb.num;
   const suffixCmp=ka.suffix.localeCompare(kb.suffix);
   if(suffixCmp!==0)return suffixCmp;
  }else if(ka||kb){
   return ka?-1:1;
  }
  const ao=orderIndex.get(a.id)??Infinity,bo=orderIndex.get(b.id)??Infinity;
  return ao!==bo?ao-bo:0;
 });
}
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
 return (catalogue?.sections || []).flatMap(section =>
  (catalogue.rows[section.codeRow] || []).flatMap((cell,column) => {
   const fitting = byId.get(cell.fittingId);
   if (!column || !fitting || fitting.deleted || existing.has(JSON.stringify([normalizeLinearCode(fitting.fittingType)]))) return [];
   const icon = fitting.iconUrl || catalogue.rows[section.iconRow]?.[column]?.image;
   const image = fitting.thumbnailUrl || catalogue.rows[section.photoRow]?.[column]?.image;
   const category = section.category || (isLinearCatalogueRow(section.codeRow)?'Linear light':catalogue.rows[section.photoRow]?.[0]?.text) || fitting.category || 'Application-specific';
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

export function applicationCategory(fitting={},label=''){
 const category=String(fitting?.category||label||'').toUpperCase().replace(/\s+/g,' ');
 if(/DOWNLIGHT/.test(category))return 'Downlights';
 if(/UPLIGHT/.test(category))return 'Uplights';
 if(/WALL WASHER/.test(category))return 'Wall Washers';
 if(/WALL HIGHLIGHTER/.test(category))return 'Wall Highlighters';
 if(/TEXTURE GRAZER/.test(category))return 'Texture Grazers';
 if(/STRETCH CLOTH/.test(category))return 'Stretch Cloth';
 if(/SYSTEMS|TRACK/.test(category))return 'Track Systems';
 if(/LINEAR|COVE|CABINET|SHELF|NICHE|PROFILE|CURTAIN/.test(category))return 'Linear Lights';
 return 'Application-Specific';
}
export const applicationCategories=['All','Downlights','Wall Highlighters','Wall Washers','Texture Grazers','Uplights','Stretch Cloth','Linear Lights','Application-Specific','Track Systems'];
export function catalogueColourFamily(code){
 const match=normalizeLinearCode(code).match(/^([A-Z]+\+?)([1-4])([A-Z].*)$/);
 return match?{number:'code-'+match[1]+match[3],slot:Number(match[2])}:null;
}

export function catalogueSectionCategory(section){
 return applicationCategory({},section.category||(isLinearCatalogueRow(section.codeRow)?'Linear light':''));
}
export function catalogueRowCategory(catalogue,row){
 const section=(catalogue?.sections||[]).find(s=>row>=s.iconRow&&row<=s.codeRow);
 return section?catalogueSectionCategory(section):'';
}
export function categoryOrder(category){const index=applicationCategories.indexOf(category);return index<0?applicationCategories.length:index;}
