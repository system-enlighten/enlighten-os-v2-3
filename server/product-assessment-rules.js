export function validateProductAssessment(p){
 if(!p.groups||typeof p.groups!=='object'||Array.isArray(p.groups)||Object.keys(p.groups).length>500)throw Error('Invalid product groups.');
 const groups={};const text=(v,max)=>{if(typeof v!=='string'||v.length>max)throw Error('Invalid product text.');return v};
 const number=v=>{if(v==='')return '';if(typeof v!=='number'||!Number.isFinite(v)||v<0||v>100000000)throw Error('Invalid product amount.');return v};
 Object.keys(p.groups).forEach(key=>{
  if(key.length>200||!/^.+\|(m|pcs)$/.test(key)||['__proto__','constructor','prototype'].includes(key))throw Error('Invalid fitting key.');
  const g=p.groups[key];if(!g||!Array.isArray(g.options)||g.options.length>200)throw Error('Use up to 200 options per fitting.');
  const ids=Object.create(null);const options=g.options.map(o=>{
   const id=text(o.id,100);if(!/^[a-zA-Z0-9_-]+$/.test(id)||ids[id])throw Error('Invalid or duplicate option ID.');ids[id]=true;
   if(!Array.isArray(o.ratings)||o.ratings.length!==4||o.ratings.some(n=>!Number.isInteger(n)||n<0||n>5))throw Error('Ratings must be between 0 and 5.');
   let photo=null;if(o.photo){const m=o.photo;if(typeof m.url!=='string'||m.url.length>2000||!/^https:\/\//.test(m.url)&&!/^\/technical-library\/[\w.-]+$/.test(m.url))throw Error('Use an HTTPS product image.');photo={url:m.url,driveFileId:text(m.driveFileId||'',200),id:text(m.id||'',200),label:text(m.label||'',500)};

   }
   let review;
   if(o.review){
    const equivalents=o.review.equivalents||[];
    if(!Array.isArray(equivalents)||equivalents.length>30)throw Error('Choose up to 30 equivalent products.');
    review={area:text(o.review.area||'',500),customization:text(o.review.customization||'',1000),equivalents:equivalents.map(value=>text(value,350))};
   }
   return {id,...(review?{review}:{}),brand:text(o.brand,300),article:text(o.article,2000),price:number(o.price),quantity:number(o.quantity),remarks:text(o.remarks,4000),ratings:o.ratings.slice(),photo};
  });
  const selectedId=text(g.selectedId||'',100);if(selectedId&&!ids[selectedId])throw Error('Selected product no longer exists.');
  if(selectedId){const selected=options.find(o=>o.id===selectedId);if(!selected.brand.trim()||!selected.article.trim())throw Error('Enter brand and article number before selecting a product.');}
  groups[key]={options,selectedId};
 });return {groups};
}
