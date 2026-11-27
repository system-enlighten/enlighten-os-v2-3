import {failure} from './project-write-storage.js';
function luminaireOfferText_(value,limit,required){
 const text=String(value??'').trim();
 if(text.length>limit||required&&!text)throw failure('Complete the required offer fields using the indicated lengths.');
 return text;
}
export function buildItems(p) {
 if(!Array.isArray(p.items)||!p.items.length||p.items.length>500)throw failure('Choose 1 to 500 schedule items.');
 const items=p.items.map(r=>({id:luminaireOfferText_(r.id,200,true),code:luminaireOfferText_(r.code,180,true),quantity:Number(r.quantity),unit:luminaireOfferText_(r.unit,16,true)}));
 if(new Set(items.map(i=>i.id)).size!==items.length||items.some(i=>!Number.isFinite(i.quantity)||i.quantity<0))throw failure('Invalid schedule items.');
 const itemsJson=JSON.stringify(items);if(itemsJson.length>45000)throw failure('Issue fewer rows at a time.');
 return items;
}
export function buildOffer(p,item) {
 const data=p.offer||{};
 if(typeof p.submissionId!=='string'||!/^[-a-f0-9]{36}$/i.test(p.submissionId))throw failure('Open the invitation again to submit.');
 const offer={item,vendor:luminaireOfferText_(data.vendor,180,true),email:luminaireOfferText_(data.email,240,true),brand:luminaireOfferText_(data.brand,180,true),model:luminaireOfferText_(data.model,180,true)};
 if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(offer.email))throw failure('Enter a valid contact email.');
 for(const key of ['photometry','compliance','specifications','warranty','commercial'])offer[key]=luminaireOfferText_(data[key],3000,key==='warranty');
 offer.price=Number(data.price);offer.currency=luminaireOfferText_(data.currency,3,true).toUpperCase();
 if(data.price===''||data.price==null||!Number.isFinite(offer.price)||offer.price<0||offer.price>1e9||!/^[A-Z]{3}$/.test(offer.currency))throw failure('Enter a valid unit price and currency.');
 if(!Array.isArray(data.documents)||data.documents.length>20)throw failure('Include up to 20 named documents.');
 offer.documents=data.documents.map(doc=>{
  const name=luminaireOfferText_(doc.name,180,true),url=luminaireOfferText_(doc.url,1500,true);
  if(!/^https:\/\/[^\s]+$/.test(url))throw failure('Use HTTPS document links.');
  return {name,url};
 });
 const offerJson=JSON.stringify(offer);if(offerJson.length>45000)throw failure('The offer is too large.');
 return offer;
}
