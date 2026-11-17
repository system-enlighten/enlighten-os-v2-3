import pdfHistory from './InvoicePdfHistory.json';
// Transcribed from the supplied invoice PDF and Pages document.
const extracted={
  'E-IN-25-26-258':{
    date:'2026-03-09',amount:25000000,documentType:'Invoice',
    client:'Royal Enfield',clientDivision:'(A unit of Eicher Motors Ltd.)',
    address:'96, Institutional Area, Sector 32,\nGurugram, Haryana, IN - 122001',
    state:'Haryana',stateCode:'06',gstin:'06AAACE3882D1ZW',
    po:'4625016492',orderDate:'2025-12-20',projectName:'Royal Enfield Jayanagar',
    contact:'Mr. Arpit Goel',phone:'+91 99649 66664',
    sourceDocument:'E-IN-24-25-258 Rev3.pdf',
    items:[
      {description:'“Lighting Design & Consultancy Services”\nAdvance upon signing of contract',rate:12500000},
      {description:'“Lighting Design & Consultancy Services”\nUpon completion of drawings, Technical Table and Luminaire Schedule',rate:7500000},
      {description:'“Lighting Design & Consultancy Services”\nAfter lighting fixtures are fully installed',rate:5000000},
    ].map(item=>({...item,sac:'99839',unit:'LS',quantity:1,displayQuantity:'LS',amount:item.rate})),
  },

};

export function invoiceForDisplay(record){
  if(record.kind!=='legacyInvoice')return record;
  const key=String(record.sourceNumber||record.number||'').replace(/\s/g,'');
  const source=pdfHistory[key]||extracted[key];
  if(source){
    return {...record,...source,number:source.number||record.number||key,completeHistory:true,
      registerNumber:record.sourceNumber||record.number,registerAmount:record.amount,
      registerDate:record.date};
  }
  return {...record,documentType:'Invoice record',items:[],incompleteHistory:true};
}
