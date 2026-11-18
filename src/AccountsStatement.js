export function parseStatement(text){
  const rows=[];
  let row=[],value='',quoted=false;
  function push(){row.push(value.trim());value='';}
  function finish(){push();if(row.some(Boolean))rows.push(row);row=[];}
  const first=String(text).replace(/^\uFEFF/,'').split(/\r?\n/)[0];
  const delimiter=first.includes('\t')?'\t':first.split(';').length>first.split(',').length?';':',';
  const source=text.replace(/^\uFEFF/,'').replace(/\r\n/g,'\n');
  for(let i=0;i<source.length;i++){
    const c=source[i];
    if(c==='"'){
      if(quoted&&source[i+1]==='"'){value+='"';i++;}
      else if(quoted||!value.trim())quoted=!quoted;
      else throw Error('Invalid quote in CSV.');
    }else if(!quoted&&c===delimiter)push();
    else if(!quoted&&(c==='\n'||c==='\r'))finish();
    else value+=c;
  }
  if(quoted)throw Error('Unclosed quoted CSV field.');
  finish();
  if(!rows.length)throw Error('Uploaded CSV file is empty.');

  const headers=rows.shift()?.map(s=>s.toLowerCase().trim())||[];
  const findIdx=patterns=>{
    for(const p of patterns){
      const idx=headers.findIndex(h=>p.test(h));
      if(idx!==-1)return idx;
    }
    return -1;
  };

  const dateIdx=findIdx([/^(txn|trans|transaction|value)?[\s_-]*date$/i, /date$/i, /date/i]);
  const bankIdx=findIdx([/^(source account|account|bank)$/i]);
  const headIdx=findIdx([/^(ledger head|chart of accounts|head)$/i]);
  const projectIdx=findIdx([/^project[ _-]?id$/i]);
  const beneficiaryIdx=findIdx([/^beneficiary$/i]);
  const classificationIdx=findIdx([/^classification$/i]);
  const valueIdx=findIdx([/^value[ _-]?date$/i]);
  const refIdx=findIdx([/^(ref|reference|utr|chq|cheque|txn[\s_-]*id|transaction[\s_-]*id|doc[\s_-]*no)[\s_-]*(no|number)?$/i, /ref/i, /utr/i, /chq/i]);
  const descIdx=findIdx([/^(desc|description|particulars|narration|remarks|details)/i, /particular/i, /narration/i, /desc/i, /detail/i]);
  const debitIdx=findIdx([/^(debit|dr|withdrawal|outflow)[\s_-]*(amount)?$/i, /^debit$/i, /^dr$/i, /debit/i]);
  const creditIdx=findIdx([/^(credit|cr|deposit|inflow)[\s_-]*(amount)?$/i, /^credit$/i, /^cr$/i, /credit/i]);

  if(dateIdx===-1||debitIdx===-1||creditIdx===-1){
    throw Error('CSV must contain Date, Debit, and Credit columns. Found: '+headers.join(', '));
  }

  const parseDateStr=s=>{
    const trimmed=String(s||'').trim();
    if(/^\d{4}-\d{2}-\d{2}$/.test(trimmed))return trimmed;
    // Handle DD/MM/YYYY or DD-MM-YYYY
    const dmy=trimmed.match(/^(\d{1,2})[\/\.-](\d{1,2})[\/\.-](\d{4})$/);
    if(dmy){
      const [,day,month,year]=dmy;
      return `${year}-${month.padStart(2,'0')}-${day.padStart(2,'0')}`;
    }
    // Handle YYYY/MM/DD
    const ymd=trimmed.match(/^(\d{4})[\/\.-](\d{1,2})[\/\.-](\d{1,2})$/);
    if(ymd){
      const [,year,month,day]=ymd;
      return `${year}-${month.padStart(2,'0')}-${day.padStart(2,'0')}`;
    }
    const named=trimmed.match(/^(\d{1,2})[- /]([A-Za-z]{3})[- /](\d{4})$/);
    if(named){const month=['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'].indexOf(named[2].toLowerCase())+1;if(month)return named[3]+'-'+String(month).padStart(2,'0')+'-'+named[1].padStart(2,'0');}
    return trimmed;
  };

  const sanitizeNum=s=>String(s||'').replace(/[₹$,\s]/g,'').trim();

  return rows.filter(r=>r.some(Boolean)).map((values,index)=>{
    const rawDate=values[dateIdx]||'';
    const date=parseDateStr(rawDate);
    const reference=refIdx!==-1?(values[refIdx]||'').trim():'REF-'+(index+1);
    const description=descIdx!==-1?(values[descIdx]||'').trim():'Bank transaction';
    const dr=sanitizeNum(values[debitIdx]);
    const cr=sanitizeNum(values[creditIdx]);

    const positive=s=>/^\d{1,10}(\.\d{1,2})?$/.test(s)&&Number(s)>0;
    const blank=s=>!s||/^0+(\.0{1,2})?$/.test(s);
    const validDate=/^\d{4}-\d{2}-\d{2}$/.test(date)&&Number.isFinite(Date.parse(date))&&new Date(date).toISOString().slice(0,10)===date;

    if(!validDate){
      throw Error('Row '+(index+2)+': Invalid date format "'+rawDate+'". Use YYYY-MM-DD or DD/MM/YYYY.');
    }

    const hasDr=positive(dr)&&blank(cr);
    const hasCr=positive(cr)&&blank(dr);

    if(!hasDr&&!hasCr){
      // Check if both zero or both positive
      if(positive(dr)&&positive(cr)){
        throw Error('Row '+(index+2)+': Both Debit and Credit have positive amounts.');
      }
      if(blank(dr)&&blank(cr))return null;
      throw Error('Row '+(index+2)+': Invalid debit or credit amount.');
    }

    const bank=bankIdx<0?'':values[bankIdx]||'';
    if(bank&&!['IDFC','Cash'].includes(bank))throw Error('Row '+(index+2)+': Source account must be IDFC or Cash.');
    const valueDate=valueIdx<0||!values[valueIdx]?'':parseDateStr(values[valueIdx]);
    if(valueDate&&(!/^\d{4}-\d{2}-\d{2}$/.test(valueDate)||!Number.isFinite(Date.parse(valueDate))||new Date(valueDate).toISOString().slice(0,10)!==valueDate))throw Error('Row '+(index+2)+': Invalid value date.');
    return {
      ...(bank?{bank}:{}),head:headIdx<0?'':values[headIdx]||'',projectId:projectIdx<0?'':values[projectIdx]||'',beneficiary:beneficiaryIdx<0?'':values[beneficiaryIdx]||'',classification:classificationIdx<0?'':values[classificationIdx]||'',valueDate,
      date,
      reference:reference||('TXN-'+(index+1)),
      description,
      amount:hasDr?dr:cr,
      direction:hasDr?'Outflow':'Inflow'
    };
  }).filter(Boolean);
}

export function statementSuggestion(row){
  const text=(row.description||'').toLowerCase();
  if(row.direction==='Outflow'){
    if(/\batm\b|cash withdrawal/.test(text))return ['Cash','ATM cash withdrawal'];
    if(/\bsalary\b|\bpayroll\b|\bwages\b/.test(text))return ['Payroll Payable','Payroll'];
    if(/30091379815/.test(text)&&/shivam gupta|rita gupta/.test(text))return ['Drawings','Owner transfer'];
    if(/shivam|drawing|partner/i.test(text))return ['Drawings','Owner drawing'];
    if(/chg|charge|annual fee|sms charge|gst on/i.test(text))return ['Bank Charges','Bank fee'];
    if(/google|adobe|figma|aws|github|chatgpt|openai|microsoft|zoom|notion|canva|dropbox/i.test(text))return ['Software Subscription','Software subscription'];
    if(/rent|landlord|flat 29/i.test(text))return ['Rent','Studio rent'];
    if(/electricity|bses|power|airtel|jio|act fibernet|broadband/i.test(text))return ['Electricity','Utility bill'];
    if(/swiggy|zomato|blinkit|zepto|instamart|milk|bisleri|chai/i.test(text))return ['Daily Essentials | Kitchen/Meals','Kitchen / daily supplies'];
    if(/uber|ola|rapido|makemytrip|irctc|indigo|vistara|flight|train/i.test(text))return ['Site Visit | Flight/Train/Bus','Travel expense'];
    if(/vendor|supplier|contractor|civil|electrical|stone|pop/i.test(text))return ['Direct Project Costs','Project direct cost'];
  }
  if(row.direction==='Inflow'){
    if(/\bretina\b/.test(text)&&/4145334112/.test(text))return ['Intercompany Clearing','Intercompany transfer'];
    if(/interest|int\.pd|int earned/i.test(text))return ['Design Fees','Bank interest'];
    if(/neft|rtgs|upi|cms|inward|client|advance/i.test(text))return ['Accounts Receivable','Client collection'];
  }
  return [];
}
