import {editOutputCell} from './output-row-editing.mjs';
import {writable} from './output-spreadsheet.mjs';
const norm=v=>String(v??'').toUpperCase().replace(/[^A-Z0-9]/g,'');
const priority=[['CN','CIRCUITNUMBER','CIRCUITNO'],['NAME','TYPE','DESCRIPTION'],['HOUSINGNUMBER','FITTINGTYPE','PRODUCTCODE'],['BEAMANGLE','BEAMSPREAD','OPTICS'],['APPLICATION'],['SURFACE'],['MOUNT','MOUNTING'],['IP'],['HEIGHT'],['ILLUMINANCE'],['COLOUR','COLOR','COLOURCCT','COLORCCT'],['CONTROL'],['LENGTH'],['LENGTHINMETRE','LENGTHINMETERS','LENGTHINMETRES']];
export function outputColumnOrder(headers){const used=new Set(),order=[];for(const names of priority)headers.forEach((h,i)=>{if(names.includes(norm(h))&&!used.has(i)){used.add(i);order.push(i)}});headers.forEach((h,i)=>{if(!used.has(i)&&norm(h)!=='SWL'){used.add(i);order.push(i)}});headers.forEach((h,i)=>{if(norm(h)==='SWL')order.push(i)});return order;}
export function outputVisibleRows(data,filters={}){return data.rows.map((_,i)=>i).filter(r=>Object.entries(filters).every(([column,values])=>values.includes(String(data.rows[r][column]??''))));}
export function outputViewData(data,columns,rows){return {headers:columns.map(c=>data.headers[c]),rows:rows.map(r=>columns.map(c=>String(data.rows[r][c]??'')))}};
export function editOutputView(data,columns,rows,edits){
 for(const e of edits){const r=rows[e.r],c=columns[e.c];if(r===undefined||c===undefined)throw Error('Select a visible cell.');if(!writable(data,r,c))throw Error('Existing drawing HANDLE cells are protected.');}
 let next=data;for(const e of edits)next=editOutputCell(next,rows[e.r],columns[e.c],e.value);return next;
}
export function pasteOutputView(data,columns,rows,start,text){const lines=String(text).replace(/\r\n?/g,'\n').replace(/\n$/,'').split('\n').map(s=>s.split('\t'));if(start.r+lines.length>rows.length||lines.some(row=>start.c+row.length>columns.length))throw Error('Paste exceeds the visible table. Insert rows first or select a different starting cell.');return editOutputView(data,columns,rows,lines.flatMap((line,r)=>line.map((value,c)=>({r:start.r+r,c:start.c+c,value}))));}
