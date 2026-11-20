import {parseStatement,parseStatementRows} from './AccountsStatement.js';
export async function readStatementFile(file){
 if(file.size>5*1024*1024)throw Error('Choose a statement smaller than 5 MB.');
 if(/\.(csv|tsv)$/i.test(file.name))return parseStatement(await file.text());
 if(!/\.xlsx?$/i.test(file.name))throw Error('Choose a CSV, TSV, XLS or XLSX statement.');
 const XLSX=await import('xlsx');let book;
 try{book=XLSX.read(await file.arrayBuffer(),{type:'array',cellDates:false,sheetRows:10001});}catch{throw Error('Could not read this Excel file. If password-protected, save an unprotected copy and retry.');}
 const candidates=[];
 for(const name of book.SheetNames){const sheet=book.Sheets[name];if(!sheet['!ref'])continue;const range=XLSX.utils.decode_range(sheet['!ref']);if(range.e.r>=10000||range.e.c>100)throw Error('Statement sheet is too large. Use up to 10,000 rows and 100 columns.');const rows=XLSX.utils.sheet_to_json(sheet,{header:1,defval:'',raw:false});if(rows.some(r=>r.some(v=>/date/i.test(v))&&r.some(v=>/^debit\b/i.test(v))&&r.some(v=>/^credit\b/i.test(v))))candidates.push({name,rows});}
 if(candidates.length!==1)throw Error(candidates.length?'Multiple statement sheets found. Keep one bank statement per file.':'No sheet with Date, Debit and Credit headings found.');
 return parseStatementRows(candidates[0].rows);
}
