export function parseStatement(text){
  const rows=[];
  let row=[],value='',quoted=false;
  function push(){row.push(value.trim());value='';}
  function finish(){push();if(row.some(Boolean))rows.push(row);row=[];}
  const source=text.replace(/^\uFEFF/,'').replace(/\r\n/g,'\n');
  for(let i=0;i<source.length;i++){
    const c=source[i];
    if(c==='"'){
      if(quoted&&source[i+1]==='"'){value+='"';i++;}
      else if(quoted||!value.trim())quoted=!quoted;
      else throw Error('Invalid quote in CSV.');
    }else if(!quoted&&c===',')push();
    else if(!quoted&&(c==='\n'||c==='\r'))finish();
    else value+=c;
  }
  if(quoted)throw Error('Unclosed quoted CSV field.');
  finish();
  const expected=['date','reference','description','debit','credit'];
  const headers=rows.shift()?.map(s=>s.toLowerCase())||[];
  if(headers.length!==expected.length||expected.some(h=>!headers.includes(h)))throw Error('Use CSV headers Date, Reference, Description, Debit, Credit.');
  if(!rows.length||rows.length>500)throw Error('Upload 1–500 statement lines per file.');
  return rows.map((values,index)=>{
    const [date,reference,description,debit,credit]=expected.map(h=>values[headers.indexOf(h)]||'');
    const dr=debit.replace(/,/g,''),cr=credit.replace(/,/g,'');
    const positive=s=>/^\d{1,10}(\.\d{1,2})?$/.test(s)&&Number(s)>0;
    const blank=s=>!s||/^0+(\.0{1,2})?$/.test(s);
    const validDate=/^\d{4}-\d\d-\d\d$/.test(date)&&Number.isFinite(Date.parse(date))&&new Date(date).toISOString().slice(0,10)===date;
    if(values.length!==headers.length||!validDate||!reference||!((positive(dr)&&blank(cr))||(positive(cr)&&blank(dr))))throw Error('Review CSV row '+(index+2)+'. Use YYYY-MM-DD, a reference, and one positive Debit or Credit.');
    return {date,reference,description,amount:positive(dr)?dr:cr,direction:positive(dr)?'Outflow':'Inflow'};
  });
}

export function statementSuggestion(row){
  const text=(row.description||'').toLowerCase();
  if(row.direction==='Outflow'){
    if(/\batm\b|cash withdrawal/.test(text))return ['Cash','ATM withdrawal'];
    if(/\bsalary\b|\bpayroll\b/.test(text))return ['Payroll Payable','Payroll'];
    if(/30091379815/.test(text)&&/shivam gupta|rita gupta/.test(text))return ['Drawings','Owner transfer'];
  }
  if(/\bretina\b/.test(text)&&/4145334112/.test(text))return ['Intercompany Clearing','Intercompany transfer'];
  return [];
}
