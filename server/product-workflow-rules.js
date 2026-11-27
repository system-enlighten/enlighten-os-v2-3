export function buildDraft(p) {
 const text=(value,max)=>{if(typeof value!=='string'||value.length>max)throw Error('Invalid product request text.');return value.trim();};
 const id=text(p.id,100),kind=text(p.kind,30);
 if(!/^[a-zA-Z0-9_-]+$/.test(id)||!['sample','mockup','contact','product-list','purchase-order'].includes(kind))throw Error('Invalid product action.');
 const quantity=Number(p.quantity);if(p.quantity===''||p.quantity==null||!Number.isFinite(quantity)||quantity<0||quantity>1e8)throw Error('Invalid quantity.');
 const rate=p.rate===''||p.rate==null?'':Number(p.rate);if(rate!==''&&(!Number.isFinite(rate)||rate<0||rate>1e8))throw Error('Invalid price.');
 const data={id,kind,projectId:String(p.projectId),fittingId:text(p.fittingId,100),productId:text(p.productId,150),code:text(p.code||'',200),brand:text(p.brand||'',300),article:text(p.article||'',300),quantity,unit:text(p.unit||'',30),rate,currency:text(p.currency||'INR',20),partner:text(p.partner||'',300),contact:text(p.contact||'',300),billing:text(p.billing||'',2000),notes:text(p.notes||'',4000),status:kind==='product-list'?'listed':'draft'};
 if(['sample','mockup','purchase-order'].includes(kind)&&p.requestStatus!==undefined){
  const status=p.requestStatus,location=text(p.location||'',500),result=text(p.result||'',2000);
  if(!['open','closed'].includes(status)||quantity<=0||!location)throw Error('Enter a positive quantity and request location.');
  if(status==='closed'&&!result)throw Error('Enter the result before closing the request.');
  const reference=text(p.reference||'',300);
  if(kind==='purchase-order'&&status==='closed'&&!reference)throw Error('Enter the PO reference before closing.');
  Object.assign(data,{status,location,reference,result:status==='closed'?result:''});
 }
 if(kind==='contact'&&p.partnerDetails){
  const details=p.partnerDetails;
  const email=text(details.email||'',300),logo=text(details.logo||'',2000);
  if(email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))throw Error('Enter a valid partner email.');
  if(logo&&!/^https:\/\/[^\s]+$/.test(logo))throw Error('Use an HTTPS logo URL.');
  data.status='contact';
  data.partnerDetails={name:text(details.name||'',300),description:text(details.description||'',1500),address:text(details.address||'',1000),gstin:text(details.gstin||'',50),phone:text(details.phone||'',60),email,logo};
  if(!data.partnerDetails.name)throw Error('Enter the partner’s full name.');
 }
 return data;
}

export function buildHistory(p) {
 const text=(value,max)=>String(value??'').trim().slice(0,max);
 const id=text(p.id,100),brand=text(p.brand,300).toLowerCase(),kind=p.kind;
 if(!/^[a-zA-Z0-9_-]+$/.test(id)||!brand||!['supply','sample','mockup','purchase-order','service','terms'].includes(kind))throw Error('Invalid partner history record.');
 const date=text(p.date,10),resolved=text(p.resolved,10);
 const validDate=v=>/^\d{4}-\d{2}-\d{2}$/.test(v)&&Number.isFinite(Date.parse(v))&&new Date(v).toISOString().slice(0,10)===v;
 if(!validDate(date)||resolved&&(kind!=='service'||!validDate(resolved)||resolved<date))throw Error('Choose valid record and resolution dates.');
 const quantity=['supply','sample','mockup','purchase-order'].includes(kind)?Number(p.quantity):null;
 if(quantity!==null&&(!Number.isFinite(quantity)||quantity<=0||quantity>1e8))throw Error('Enter a positive quantity.');
 const record={id,brand,kind,projectId:String(p.projectId),date,resolved,quantity,unit:text(p.unit,30),site:text(p.site,250),article:text(p.article,300),code:text(p.code,200),reference:text(p.reference,300),notes:text(p.notes,2000),warranty:text(p.warranty,1000),service:text(p.service,1000)};
 if(kind==='service'&&!record.notes)throw Error('Enter the service issue.');
 if(kind==='terms'&&!record.warranty&&!record.service)throw Error('Enter the warranty or service terms.');
 return record;
}
