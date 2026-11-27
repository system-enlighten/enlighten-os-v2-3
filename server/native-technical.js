import {randomUUID} from 'node:crypto';
import {db} from './supabase-db.js';
import {createDriveAttachments} from './drive-attachments.js';
import {previewProjectFolder} from './drawing-publishing.js';
import {getTechnicalWorkbook} from './technical-workbook.js';
import {requireProject} from './permissions.js';
import {failure,now,projectRow,text} from './project-write-storage.js';
import {scheduleGrid_,technicalOutputLayout_,technicalCircuitSequence_} from './native-technical-rules.js';

const drive=createDriveAttachments();
const nameOf=sheet=>String(sheet.properties.title);
const rowValues=row=>row.map(cell=>cell?.formattedValue||'');
const formula=cell=>cell?.userEnteredValue?.formulaValue||'';
async function load(p,user,database,files,env) {
  const config=await getTechnicalWorkbook(p,{user,database,env}),id=config.workbookId;
  if (!id) throw failure('Link or create the project workbook first.');
  const rows=await database.rows("SELECT cells FROM enlighten_operational.projects WHERE cells->>'projectId'=$1 LIMIT 2",[text(p.projectId)]);
  if (rows.length!==1) throw failure('Project not found.',404);
  const root=await previewProjectFolder(rows[0].cells,files,env),source=await files.metadata(id);
  if (source.trashed||!await files.within(source,root)) throw failure('Workbook is outside the project folder.',403);
  const book=await files.spreadsheetInfo(id);
  return {config,id,sheets:book.sheets||[]};
}
const choose=(book,pattern)=>book.sheets.find(sheet=>pattern.test(nameOf(sheet).trim()));
async function grid(files,id,sheet,cols=80) {
  const name=nameOf(sheet).replaceAll("'","''");
  let column=Math.min(cols+1,sheet.properties.gridProperties?.columnCount||cols+1),end='';
  for (;column>0;column=Math.floor((column-1)/26)) end=String.fromCharCode(65+(column-1)%26)+end;
  const height=Math.min(5001,sheet.properties.gridProperties?.rowCount||5001);
  const result=await files.spreadsheetGrid(id,"'"+name+"'!A1:"+end+height);
  const rows=(result.sheets?.[0]?.data?.[0]?.rowData||[]).map(row=>row.values||[]);
  const width=Math.max(0,...rows.map(row=>row.length));
  if (rows.length>5000||width>cols) throw failure('The source sheet exceeds 5000 rows or '+cols+' columns.');
  return rows.map(row=>Array.from({length:width},(_,index)=>row[index]));
}
function render(rows,headerRow) {
  if (!rows.length||!rows[0].length) return {headers:[],rows:[],headerRow:1,images:[]};
  const images=[];
  const markers=rows.map(row=>row.map(cell=>{
    const url=formula(cell).match(/^=IMAGE\(\s*"(https:\/\/[^"\s]+)"/i)?.[1];
    return {url,value:cell?.formattedValue||(url?'\u0001image':'')};
  }));
  const display=markers.map(row=>row.map(cell=>cell.value)),result=scheduleGrid_(display,headerRow);
  const columns=display[result.headerRow-1].map((value,i)=>value||display.slice(result.headerRow).some(row=>row[i])?i:-1).filter(i=>i>=0);
  const content=markers.slice(result.headerRow).filter(row=>row.some(cell=>cell.value.trim()));
  for (const [r,row] of content.entries()) for (const [c,index] of columns.entries()) {
    if (row[index].url) {
      images.push({row:r,column:c,url:row[index].url});
      if (result.rows[r][c]==='\u0001image') result.rows[r][c]='';
    }
  }
  return {...result,images};
}
const link=(book,sheet)=>'https://docs.google.com/spreadsheets/d/'+book.id+'/edit#gid='+sheet.properties.sheetId;
export async function getNativeTechnicalTable(p,{user,database=db,files=drive,env=process.env}) {
  const book=await load(p,user,database,files,env),sheet=choose(book,/^technical table$/i);
  if (!sheet) throw failure('Technical Table worksheet is missing. Create a project workbook from the template.',404);
  const rows=await grid(files,book.id,sheet);
  let output=[];
  const source=choose(book,/^output$/i);
  if (source) {
    const values=(await grid(files,book.id,source,300)).map(rowValues);
    try {
      const layout=technicalOutputLayout_(values);
      output=values.slice(layout.headerRow).filter(row=>/^[A-Za-z]+\d+$/.test(row[layout.columns[0]]||''))
        .map(row=>layout.columns.map(col=>col<0?'':String(row[col]||'')));
    } catch(error) {if (!error.statusCode) throw error;}
  }
  return {...render(rows,p.headerRow),output,sourceUrl:link(book,sheet),generatedAt:now()};
}

export async function getScheduleSpecSheet(p,{user,database=db,files=drive,env=process.env}) {
  const book=await load(p,user,database,files,env),schedule=p.view==='schedule';
  let sheet=schedule?choose(book,/^(luminaire )?schedule$/i):p.view==='spec'?choose(book,/^(luminaire )?(spec sheet|specification sheets?|specifications?)$/i):null;
  if (schedule&&!sheet) for (const candidate of book.sheets) {
    const name=nameOf(candidate).replaceAll("'","''");
    const result=await files.spreadsheetGrid(book.id,"'"+name+"'!A1");
    if (/^luminaire schedule$/i.test(text(result.sheets?.[0]?.data?.[0]?.rowData?.[0]?.values?.[0]?.formattedValue))) {
      sheet=candidate;
      break;
    }
  }
  if (schedule&&!sheet) throw failure('Add a Luminaire Schedule tab to the linked workbook, or title its first cell LUMINAIRE SCHEDULE.',404);
  sheet??=choose(book,/^technical table$/i);
  if (!sheet) throw failure('The linked workbook needs a Technical Table or Spec Sheet tab.',404);
  const result=render(await grid(files,book.id,sheet),p.headerRow);
  if (!schedule) delete result.images;
  return {...result,sourceUrl:link(book,sheet),generatedAt:now()};
}

const stringCell=value=>({userEnteredValue:{stringValue:String(value||'')}});
const cellWrite=(sheetId,rowIndex,columnIndex,rows,fields='userEnteredValue')=>({updateCells:{start:{sheetId,rowIndex,columnIndex},rows,fields}});
const zone=value=>String(value||'').match(/^[A-Z]+(?=\d)/)?.[0]||'';
const formulaRow=value=>Number(value.match(/\bCAL!\$?D\$?(\d+)/i)?.[1])||0;
export async function importTechnicalOutput(p,{user,database=db,files=drive,env=process.env}) {
  const projectId=text(p.projectId);
  requireProject(user,projectId,{write:true,admin:true});
  if (!Array.isArray(p.rows)||!p.rows.length||p.rows.length>2000||p.rows.some(row=>!Array.isArray(row)||row.length!==14||
    !/^[A-Za-z]+\d+$/.test(row[0])||row.some(value=>typeof value!=='string'||value.length>4000))) throw failure('Use up to 2000 valid Output rows with 14 columns.');
  if (JSON.stringify(p.rows).length>1200000) throw failure('Output is too large.');
  return database.transaction(async tx=>{
    if (!await projectRow(tx,projectId)) throw failure('Project not found.',404);
    const adapter={transaction:work=>work(tx),rows:tx.rows};
    const book=await load(p,user,adapter,files,env);
    if (book.id===book.config.templateId) throw failure('This is the shared template. Create a project copy before importing.',409);
    await tx.query('SELECT pg_advisory_xact_lock(hashtextextended($1,0))',['technical-workbook:'+book.id]);
    const others=(await tx.rows("SELECT cells FROM enlighten_operational.technical_workbooks WHERE cells->>'projectId'<>$1",[projectId]))
      .some(row=>JSON.parse(row.cells.dataJson||'{}').workbookId===book.id);
    if (others) throw failure('This workbook is linked to another project. Create a dedicated project copy before importing.',409);
    const output=choose(book,/^output$/i),cal=choose(book,/^cal$/i),technical=choose(book,/^technical table$/i);
    if (!output||!cal||!technical) throw failure('Workbook needs Output, CAL and Technical Table tabs.');
    const outRows=await grid(files,book.id,output,300),calRows=await grid(files,book.id,cal,300),techRows=await grid(files,book.id,technical);
    const layout=technicalOutputLayout_(outRows.map(rowValues)),start=layout.headerRow,end=Math.max(outRows.length,start+p.rows.length);
    if (end>output.properties.gridProperties.rowCount) throw failure('Output worksheet needs more rows. Add rows in Google Sheets, then retry.');
    const columns=layout.columns.map((column,index)=>({column,index})).filter(row=>row.index!==12);
    if (columns.some(({column})=>outRows.slice(start).some(row=>formula(row[column])))) throw failure('An input column contains formulas. Import stopped to protect them.');
    const sequence=technicalCircuitSequence_(p.rows),links=techRows.map(row=>formula(row[3]));
    const positions=new Set(links.map(formulaRow));
    if (sequence.circuits.some((_,i)=>!positions.has(i+2))) throw failure('Extend the Technical Table formula rows before importing this many circuits.');
    const label='Missing circuits (not imported)';
    if (calRows[0]?.[4]?.formattedValue!==label&&calRows.some(row=>row[4]?.formattedValue||row[4]?.userEnteredValue)) {
      throw failure('CAL column E already contains data. Move it before enabling gap warnings.');
    }
    const detail=techRows.map(rowValues).find(row=>row.some(value=>/^luminaire\s+details$/i.test(text(value))));
    if (!detail) throw failure('Cannot find the Luminaire Details heading.');
    const detailCol=detail.findIndex(value=>/^luminaire\s+details$/i.test(text(value)));
    const [outputId,calId,techId]=[output,cal,technical].map(sheet=>sheet.properties.sheetId);
    const backupSheet='Output backup '+now().replace(/[-:T]/g,'').slice(0,14)+' '+randomUUID().slice(0,8);
    const requests=[{duplicateSheet:{sourceSheetId:outputId,newSheetName:backupSheet}}];
    for (const {column,index} of columns) requests.push(cellWrite(outputId,start,column,
      Array.from({length:end-start},(_,r)=>({values:[stringCell(p.rows[r]?.[index])]}))));
    const size=Math.max(2,calRows.length,sequence.circuits.length+1,sequence.gaps.length+1);
    const maxRows=cal.properties.gridProperties.rowCount,maxCols=cal.properties.gridProperties.columnCount;
    if (size>maxRows) requests.push({appendDimension:{sheetId:calId,dimension:'ROWS',length:size-maxRows}});
    if (maxCols<5) requests.push({appendDimension:{sheetId:calId,dimension:'COLUMNS',length:5-maxCols}});
    requests.push(cellWrite(calId,0,3,Array.from({length:size},(_,i)=>({values:(i===0?['Circuit sequence',label]:
      [sequence.circuits[i-1],sequence.gaps[i-1]]).map(stringCell)}))));
    const details=new Map(p.rows.map(row=>[row[0].toUpperCase(),row]));
    const marker='enLIGHTen original detail: ',literal=value=>'"'+String(value).replaceAll('"','""')+'"';
    const separators=new Set((technical.developerMetadata||[]).filter(row=>row.metadataKey==='ENLIGHTEN_ZONE_SEPARATOR'&&
      row.location?.dimensionRange?.dimension==='ROWS').map(row=>row.location.dimensionRange.startIndex));
    const width=Math.max(...techRows.map(row=>row.length)),insertAfter=[];
    for (const [index,linkFormula] of links.entries()) {
      const i=formulaRow(linkFormula)-2;
      if (i<0) continue;
      const circuit=sequence.circuits[i],input=details.get(circuit);
      if (input) {
        const cell=techRows[index][detailCol]||{},note=cell.note||'';
        const original=note.startsWith(marker)?JSON.parse(note.slice(marker.length)):{formula:formula(cell),value:cell.formattedValue||'',note};
        const fallback=[input[3],input[4],input[6]].filter(Boolean).join('\n');
        const expression=original.formula?original.formula.slice(1):literal(original.value||fallback);
        const cleaned='TRIM(REGEXREPLACE(TO_TEXT(IFERROR('+expression+','+literal(fallback)+')),"(?i)interior designer[\u2019]?s choice\\s*|\\s*suitable for LED[- ]based lamp",""))';
        const lamp=[input[4],input[3]].some(value=>/^(?:decorative[ :\u2013-]+)?(?:chandelier|(?:wall|table|floor|pendant) (?:lamp|light))s?(?:\s*\[[^\]]+\])?$/i.test(text(value)));
        const body=lamp?'"Interior Designer\u2019s choice"&CHAR(10)&'+cleaned+'&CHAR(10)&"Suitable for LED-based lamp"':cleaned;
        requests.push(cellWrite(techId,index,detailCol,[{values:[{userEnteredValue:{formulaValue:'=IF(D'+(index+1)+'="","",'+body+')'},
          note:marker+JSON.stringify(original)}]}],'userEnteredValue,note'));
      }
      requests.push({updateBorders:{range:{sheetId:techId,startRowIndex:index,endRowIndex:index+1,startColumnIndex:0,endColumnIndex:width},bottom:{style:'NONE'}}});
      if (circuit&&sequence.circuits[i+1]&&zone(circuit)!==zone(sequence.circuits[i+1])) insertAfter.push(index);
    }
    for (const index of [...separators].sort((a,b)=>b-a)) requests.push({deleteDimension:{range:{sheetId:techId,dimension:'ROWS',startIndex:index,endIndex:index+1}}});
    for (const index of insertAfter.sort((a,b)=>b-a)) {
      const startIndex=index+1-[...separators].filter(value=>value<=index).length,endIndex=startIndex+1;
      const dimensionRange={sheetId:techId,dimension:'ROWS',startIndex,endIndex};
      requests.push({insertDimension:{range:dimensionRange,inheritFromBefore:true}},
        {createDeveloperMetadata:{developerMetadata:{metadataKey:'ENLIGHTEN_ZONE_SEPARATOR',visibility:'DOCUMENT',location:{dimensionRange}}}},
        {repeatCell:{range:{sheetId:techId,startRowIndex:startIndex,endRowIndex:endIndex,startColumnIndex:0,endColumnIndex:width},
          cell:{userEnteredFormat:{backgroundColor:{red:0,green:0,blue:0}}},fields:'userEnteredFormat.backgroundColor'}},
        {updateDimensionProperties:{range:dimensionRange,properties:{pixelSize:18},fields:'pixelSize'}});
    }
    await files.spreadsheetBatch(book.id,requests);
    const actual=(await grid(files,book.id,output,300)).slice(start).map(row=>text(row[layout.columns[0]]?.formattedValue).toUpperCase());
    if (p.rows.some((row,i)=>row[0].toUpperCase()!==actual[i])||actual.slice(p.rows.length).some(Boolean)) {
      throw failure('Output verification failed. Review '+backupSheet+' before using the Technical Table.',409);
    }
    return {imported:p.rows.length,circuits:sequence.circuits.length,gaps:sequence.gaps,backupSheet,workbookId:book.id};
  });
}
