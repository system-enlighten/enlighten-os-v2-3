export function familyModelProduct(product,model,selection={}){
 const s=product.specs||{},d=s.specSheet||{};
 return {...product,imageUrl:model.imageUrl||product.imageUrl,model:model.article||product.model,specs:{...s,article:model.article||'',power:model.power||'',size:model.size||'',recess:model.recess||'',height:model.height||'',flux:model.flux||'',diagramUrl:model.diagramUrl||'',colour:[selection.led,selection.cct].filter(Boolean),distribution:selection.beam?[selection.beam+'°']:[],control:selection.control?[selection.control]:[],specSheet:{...d,optics:selection.beam?selection.beam+'°':'',reflectorColor:selection.reflector||'',trimColor:selection.trim||''}}};
}
