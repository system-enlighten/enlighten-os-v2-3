export const specSheetFields=[
 ['designIntent','Design intent'],['trimColor','Trim colour'],['reflectorColor','Reflector / body colour'],['dimensions','Dimensions / opening / recessing depth'],['mounting','Mounting'],['aiming','Aiming / adjustment range'],['weight','Weight (with unit)'],['ik','IK rating'],['r9','R9'],['optics','Optics / beam angle'],['ugr','UGR'],['sdcm','MacAdam ellipse / SDCM'],['brightness','Brightness / illuminance (with unit)'],['driverType','Driver type'],['driverWattage','Driver wattage (W)'],['voltage','Input / output voltage and surge protection'],['electricalClass','Electrical class'],['ambient','Ambient temperature'],['maximum','Maximum temperature'],['thd','Maximum THD'],['powerFactor','System power factor'],['energy','Energy used (W or W/m)'],['lifeRating','Life rating (e.g. L90/B10)'],['lifeYears','Life based on 6 hours/day'],['customization','Special considerations / customization'],['accessories','Accessories'],['equivalents','Equivalent makes'],['notes','Installation notes'],['sampleApproval','Sample approval requirement']
];
export const specSheetAssets=[['photometricUrl','Photometric distribution diagram'],['symbolsUrl','Compliance / protection symbols'],['controlDiagramUrl','Control / compatibility diagram']];
export const defaultHighlights=['shape','trim','dimensions','mounting','ip','cct','optics','driver','dimming'];
const join=(...v)=>v.filter(x=>x!==''&&x!=null).join(' | ');
export function specificationUnit(value,label){
 const text=String(value??'').trim();
 if(!text)return '';
 const units={W:/\b(?:W|watts?|W\/m)\b/i,lm:/\b(?:lm|lumens?)\b/i,mm:/\b(?:mm|cm|m)\b/i,h:/\b(?:h|hrs?|hours?)\b/i};
 const base=label.split(' ')[0];
 return units[base]?.test(text)?text+(label.includes(' recess')?' recess':''):`${text} ${label}`;
}
const unit=specificationUnit;
export function productDimensions(spec){
 return spec.specSheet?.dimensions||join(unit(spec.size,'mm'),unit(spec.recess,'mm recess'));
}
export function productPower(spec){
 return spec.specSheet?.energy||unit(spec.power,'W');
}
export function productLifeYears(spec){
 const hours=Number(spec.life);
 return spec.specSheet?.lifeYears||(hours>0?`${Number((hours/(365*6)).toFixed(1))} years`:'');
}
export function specSheetRows(product){const s=product.specs||{},d=s.specSheet||{};return [
 {section:'Mechanical'},
 {key:'shape',label:'Shape',value:s.shape||''},
 {key:'trim',label:'Trim Color | Reflector / Body Color',value:join(d.trimColor,d.reflectorColor)},
 {key:'dimensions',label:'Dimensions | Recessing Depth',value:productDimensions(s)},
 {key:'mounting',label:'Mounting | Aiming',value:join(d.mounting,d.aiming)},
 {key:'weight',label:'Weight',value:d.weight||''},
 {key:'ip',label:'IP Rating',value:s.ip||''},
 {key:'ik',label:'IK Rating',value:d.ik||''},
 {section:'Optical'},
 {key:'cct',label:'CCT | R9',value:join((s.colour||[]).join(', '),d.r9)},
 {key:'optics',label:'Optics | UGR',value:join((s.distribution||[]).join(', '),d.optics,d.ugr)},
 {key:'cri',label:'min CRI',value:s.cri??''},
 {key:'sdcm',label:'MacAdam Ellipse',value:d.sdcm||''},
 {section:'Electrical'},
 {key:'brightness',label:'Luminous Flux | Illuminance',value:join(unit(s.flux,'lm'),d.brightness)},
 {key:'driver',label:'Driver Type',value:d.driverType||''},
 {key:'dimming',label:'Dimming Type',value:(s.control||[]).join(' | ')},
 {key:'voltage',label:'I/O Voltage Range',value:d.voltage||''},
 {key:'electricalClass',label:'Electrical Class',value:d.electricalClass||''},
 {key:'temperature',label:'T ambient | T maximum',value:join(d.ambient,d.maximum)},
 {key:'thd',label:'max THD | System Power Factor',value:join(d.thd,d.powerFactor)},
 {key:'energy',label:'Energy Used',value:productPower(s)},
 {key:'life',label:'Life Expectancy',value:join(d.lifeRating,unit(s.life,'h'))},
 {key:'lifeYears',label:'Life [Based on 6hrs/day]',value:productLifeYears(s)},
 {section:'Spl. Considerations / Customization'},
 {key:'customization',label:'',value:d.customization||''}
 ];}
export function escapeSpecHtml(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
