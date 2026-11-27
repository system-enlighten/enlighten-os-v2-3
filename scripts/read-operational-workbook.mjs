import XLSX from 'xlsx';
import {readFileSync} from 'node:fs';
import {validateLayout} from '../server/linear-applications.js';

export function readOperationalWorkbook(path) {
  const workbook=XLSX.read(readFileSync(path),{cellDates:true});
  if (!workbook.Sheets.Projects||!workbook.Sheets.People||!workbook.Sheets['Accounts Journal']) {
    throw Error('Expected an Enlighten OS operational workbook export.');
  }
  return workbook;
}

export function readTab(workbook,title,{required=false}={}) {
  const sheet=workbook.Sheets[title];
  if (!sheet) {
    if (required) throw Error('Missing required workbook tab '+title+'.');
    return [];
  }
  const [headers=[],...rows]=XLSX.utils.sheet_to_json(sheet,{header:1,raw:true,blankrows:true,defval:''});
  const columns=headers.map(value=>String(value??'').replaceAll('\u0000','').trim());
  const named=columns.filter(Boolean);
  if (new Set(named).size!==named.length) throw Error('Duplicate column headers in '+title+'.');
  return rows.flatMap((values,index)=>{
    if (!values.some(value=>value!==''&&value!=null)) return [];
    const cells=Object.fromEntries(columns.flatMap((column,i)=>{
      if (!column) return [];
      const value=values[i]??'';
      return [[column,value instanceof Date?value.toISOString():typeof value==='string'?value.replaceAll('\u0000',''):value]];
    }));
    return [{sourceRow:index+2,cells}];
  });
}

function asText(value) { return String(value??''); }

export function readSupplementalBackfill(workbook) {
  const layoutRows=readTab(workbook,'LinearApplicationLayout',{required:true});
  if (layoutRows.length>1) throw Error('Expected a single linear layout record.');
  const layout=layoutRows[0]?.cells;
  const accountsChart=readTab(workbook,'Chart of Accounts',{required:true}).map(({cells})=>({
    head:JSON.parse(cells['Head (JSON)']),type:asText(cells.Type),
    subhead:JSON.parse(cells['Sub-head (JSON)']||'""'),deleted:cells.Deleted===true
  }));
  const linearCaptions=readTab(workbook,'LinearApplicationCaptions',{required:true}).map(({cells})=>({
    applicationId:asText(cells.applicationId),caption:asText(cells.caption),code:asText(cells.code),
    updatedAt:asText(cells.updatedAt),updatedBy:asText(cells.updatedBy)
  }));
  const linearLinks=readTab(workbook,'LinearProductLinks',{required:true}).map(({cells})=>({
    applicationId:asText(cells.applicationId),referenceKey:asText(cells.referenceKey),
    fittingId:asText(cells.fittingId),productId:asText(cells.productId)
  }));
  const distinct=(rows,key,label)=>{
    const ids=rows.map(key);
    if (ids.some(value=>!value)||new Set(ids).size!==ids.length) throw Error('Missing or duplicate identifiers in '+label+'.');
  };
  distinct(accountsChart,row=>row.head,'Chart of Accounts');
  distinct(linearCaptions,row=>row.applicationId,'LinearApplicationCaptions');
  if (linearLinks.some(link=>Object.values(link).some(value=>!value))) throw Error('Incomplete LinearProductLinks association.');
  distinct(linearLinks,row=>JSON.stringify([row.applicationId,row.referenceKey]),'LinearProductLinks');
  return {
    linearLayout:layout?{version:1,updatedAt:asText(layout.updatedAt),layout:validateLayout(JSON.parse(layout.dataJson))}:null,
    accountsChart,linearCaptions,linearLinks,momPoints:readTab(workbook,'MomVisitPoints')
  };
}
