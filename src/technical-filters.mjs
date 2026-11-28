import {shortTechnicalFloor} from './technical-column-logic.mjs';
const picture=m=>m?.url?(m.label||'Image selected'):'';
export function technicalFilterValues(row,product=false,includeRecommendation=false){
 const zone=[shortTechnicalFloor(row.floor||row.zone?.floor||''),row.zone?.area||'Zone not matched'].filter(Boolean).join(' | ');
 return (product?[zone,row.cn,picture(row.productPhoto),row.modelNo,row.productName,row.productBrightness,row.productEnergy,row.productOptics,row.productHeight,row.icon?'Effect icon':'',row.productColour,row.productControl,row.quantity]:[zone,row.cn,picture(row.override?.fixture)||(row.icon?'Effect icon':''),row.code,...(includeRecommendation?[row.recommendation]:[]),row.application,picture(row.override?.image3d),picture(row.override?.reference),row.object,row.cmf,row.height,row.illuminance,row.quantity,row.lighting]).map(v=>String(v??''));
}
export function filterTechnicalRows(rows,filters={},product=false,includeRecommendation=false){return rows.filter(row=>{const values=technicalFilterValues(row,product,includeRecommendation);return Object.entries(filters).every(([column,selected])=>selected.includes(values[column]));});}
