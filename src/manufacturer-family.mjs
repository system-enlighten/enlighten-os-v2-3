export const VARIANT_AXES=['led','cct','beam','reflector','trim','control'];

export function variantSignature(configuration={}){
 return VARIANT_AXES.map(k=>String(configuration?.[k]??'').trim()).join('\u0000');
}

export function defaultVariantSku(prefix,configuration={}){
 const base=String(prefix||'').trim();
 const parts=VARIANT_AXES.map(k=>{
  const val=String(configuration?.[k]??'').trim();
  if(!val)return '';
  return k==='beam'&&!/°$/.test(val)?`${val}°`:val;
 }).filter(Boolean);
 return [base,...parts].filter(Boolean).join(' · ');
}

export function syncModelVariants(model,{baseName='',maxVariants=200}={}){
 const options=model?.options||{};
 const active=VARIANT_AXES.map(k=>[k,(options[k]||[]).map(v=>String(v??'').trim()).filter(Boolean)]).filter(([,vals])=>vals.length>0);
 const existing=Array.isArray(model?.variants)?model.variants:[];
 const manual=existing.filter(v=>v?.manual);
 if(!active.length)return {variants:manual,total:0,capped:false};
 const total=active.reduce((acc,[,vals])=>acc*vals.length,1);
 if(total>maxVariants)return {variants:existing,total,capped:true};
 let combos=[{}];
 for(const [key,vals] of active){
  combos=combos.flatMap(prev=>vals.map(v=>({...prev,[key]:v})));
 }
 const bySig=new Map();
 for(const v of existing){
  const sig=variantSignature(v?.configuration);
  if(!bySig.has(sig))bySig.set(sig,v);
 }
 const prefix=model?.article||baseName||'VAR';
 const generated=combos.map((configuration,idx)=>{
  const match=bySig.get(variantSignature(configuration));
  if(match)return match;
  return {
   id:'var-'+Date.now().toString(36)+'-'+idx+'-'+Math.random().toString(36).slice(2,6),
   sku:defaultVariantSku(prefix,configuration),
   configuration,
  };
 });
 const generatedSigs=new Set(generated.map(v=>variantSignature(v.configuration)));
 const extraManual=manual.filter(v=>!generatedSigs.has(variantSignature(v.configuration)));
 return {variants:[...generated,...extraManual],total,capped:false};
}

export function familyModelProduct(product,model,selection={},variant=null){
 const s=product.specs||{},d=s.specSheet||{};
 return {...product,imageUrl:model.imageUrl||product.imageUrl,model:variant?.sku||model.article||product.model,specs:{...s,article:variant?.sku||model.article||'',power:variant?.power||model.power||'',size:model.size||'',recess:model.recess||'',height:model.height||'',flux:variant?.flux||model.flux||'',price:variant?.price||s.price||'',ies:variant?.ies||s.ies||'',diagramUrl:model.diagramUrl||'',colour:[selection.led,selection.cct].filter(Boolean),distribution:selection.beam?[selection.beam+'°']:[],control:selection.control?[selection.control]:[],specSheet:{...d,optics:selection.beam?selection.beam+'°':'',reflectorColor:selection.reflector||'',trimColor:selection.trim||''}}};
}
