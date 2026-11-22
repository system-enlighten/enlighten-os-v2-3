import icons from './technical-icon-map.json';

export function fittingIconOptions(fittings){
 const choices=new Map();
 for(const fitting of fittings){
  if(fitting.deleted||!fitting.iconUrl)continue;
  const url=icons[fitting.iconUrl]||fitting.iconUrl;
  choices.set(fitting.iconUrl,{id:fitting.id,label:fitting.fittingType,url});
 }
 return [...choices.values()];
}
