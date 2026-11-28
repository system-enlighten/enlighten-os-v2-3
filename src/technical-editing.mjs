import {parseOutputText} from './technical-output.mjs';
const key=value=>String(value??'').trim().toUpperCase().replace(/\s+/g,'');
export const editableOutputFields={
 recommendation:{label:'Strong Recommendation',headers:['STRONG_RECOMMENDATION','Strong Recommendation','Recommended Product','Recommended Product Code']},
 code:{label:'Product code',headers:['HOUSINGNUMBER','FITTINGTYPE','PRODUCTCODE']},
 application:{label:'Application',headers:['APPLICATION']},
 object:{label:'Object / size',headers:['OBJECT','OBJECTSIZE','SHAPE|DIA','SIZE']},
 cmf:{label:'CMF',headers:['CMF']},
 illuminance:{label:'Illuminance',headers:['ILLUMINANCE','ILLUMINATION']},
 height:{label:'Height',headers:['HEIGHT','CLEARHEIGHT','CLEAR HEIGHT']},
 distance:{label:'Distance',headers:['DISTANCE']},
 surface:{label:'Surface',headers:['SURFACE']},mount:{label:'Mount',headers:['MOUNT']},
 length:{label:'Length',headers:['LENGTHINMETRE','LENGTHINMETERS','LENGTH']}
};
function columnFor(data,rowIndex,field){
 if(field==='recommendation')return data.headers.findIndex(h=>/^(STRONGRECOMMENDATION|RECOMMENDEDPRODUCT(?:CODE)?)$/.test(String(h).toUpperCase().replace(/[^A-Z]/g,'')));
 const rule=editableOutputFields[field];if(!rule)throw Error('This column is not editable.');const row=data.rows[rowIndex];
 for(const name of rule.headers)for(let i=0;i<data.headers.length;i++)if(key(data.headers[i])===key(name)&&String(row[i]??'').trim()&&!/^<>$/.test(String(row[i]).trim()))return i;
 if(field==='object'){const i=data.headers.findIndex(h=>key(h)==='LENGTH');if(i>=0&&/^\d+(?:\.\d+)?\s*[x×]\s*\d+/i.test(row[i]))return i;}
 for(const name of rule.headers){const i=data.headers.findIndex(h=>key(h)===key(name));if(i>=0)return i;}return -1;
}
export function sourceFieldValues(data,indices,field){return indices.map(rowIndex=>{if(!Number.isInteger(rowIndex)||!data.rows[rowIndex])throw Error('Output row no longer exists.');const column=columnFor(data,rowIndex,field);return {rowIndex,column,value:column<0?'':String(data.rows[rowIndex][column]??'')};});}
export function applyOutputEdits(data,edits,{groupId}={}){
 const headers=[...data.headers],rows=data.rows.map(row=>[...row]),overrides={...data.overrides};let changed=false;
 for(const edit of edits){
  if(!editableOutputFields[edit.field]||!Number.isInteger(edit.rowIndex)||!rows[edit.rowIndex])throw Error('Invalid Output edit.');
  if(typeof edit.value!=='string'||edit.value.length>4000)throw Error('Use up to 4,000 characters in one cell.');
  let column=columnFor({headers,rows},edit.rowIndex,edit.field);
  if(edit.column!==undefined){if(!Number.isInteger(edit.column)||edit.column<0||edit.column>=headers.length)throw Error('Output column no longer exists.');column=edit.column;}
  if(column<0){if(headers.length>=80)throw Error('Output already has the maximum 80 columns.');column=headers.length;headers.push(editableOutputFields[edit.field].headers[0]);rows.forEach(row=>row.push(''));}
  if(rows[edit.rowIndex][column]!==edit.value){rows[edit.rowIndex][column]=edit.value;changed=true;}
 }
 if(groupId&&overrides[groupId]){overrides[groupId]={...overrides[groupId]};if(edits.some(e=>e.field==='cmf'))delete overrides[groupId].cmf;if(changed&&edits.some(e=>e.field==='code'))delete overrides[groupId].fixture;}
 return {...data,headers,rows,overrides};
}
// Apply replacements to the original field lexemes. Unedited fields retain their
// original quoting, whitespace, CRLF/LF delimiters, BOM and final newline.
function sourceTokens(text){
 const slots=[];let row=0,column=0,start=text.charCodeAt(0)===0xFEFF?1:0,quoted=false,atStart=true;
 for(let i=start;i<text.length;i++){
  const ch=text[i];if(ch==='"'){if(quoted&&text[i+1]==='"'){i++;atStart=false;continue}if(quoted||atStart)quoted=!quoted;}
  if(!quoted&&(ch==='\t'||ch==='\r'||ch==='\n')){slots.push({row,column,start,end:i});if(ch==='\t')column++;else{row++;column=0;if(ch==='\r'&&text[i+1]==='\n')i++;}start=i+1;atStart=true;}else atStart=false;
 }
 if(start<text.length||column>0)slots.push({row,column,start,end:text.length});return slots;
}
const encode=(value,forceQuote=false)=>forceQuote||/[\t\r\n"]/.test(value)?'"'+value.replace(/"/g,'""')+'"':value;
export function serializeTechnicalOutput(data){
 const text=typeof data.sourceText==='string'?data.sourceText:'',eol=text.includes('\r\n')?'\r\n':text.includes('\r')&&!text.includes('\n')?'\r':'\n';
 let original;try{if(text)original=parseOutputText(text,true)}catch{/* Canonical TSV is used only when no matching original source is available. */}
 if(original&&original.headers.length===data.headers.length&&original.headers.every((h,i)=>h===data.headers[i])&&original.rows.length===data.rows.length){
  const replacements=[],slots=new Map(sourceTokens(text).map(slot=>[slot.row+'|'+slot.column,slot]));let canPatch=true;
  data.rows.forEach((row,r)=>row.forEach((value,c)=>{if(value===original.rows[r][c])return;const slot=slots.get((r+1)+'|'+c);if(!slot){canPatch=false;return}replacements.push({...slot,value:encode(String(value),text[slot.start]==='"')});}));
  if(canPatch){let output=text;for(const slot of replacements.sort((a,b)=>b.start-a.start))output=output.slice(0,slot.start)+slot.value+output.slice(slot.end);return output;}
 }
 const bom=text.charCodeAt(0)===0xFEFF?'\uFEFF':'',ending=text?/[\r\n]$/.test(text):true;
 return bom+[data.headers,...data.rows].map(row=>row.map(value=>encode(String(value??''))).join('\t')).join(eol)+(ending?eol:'');
}
export function materializeCmfOverrides(data,groups){let result=data;for(const group of groups){if(Object.hasOwn(group.override||{},'cmf'))result=applyOutputEdits(result,group.sourceIndices.map(rowIndex=>({rowIndex,field:'cmf',value:group.override.cmf})),{groupId:group.id});}return result;}
export function outputCellChanges(data){
 let original;try{if(data.sourceText)original=parseOutputText(data.sourceText,true)}catch{return new Map()}
 const changes=new Map();if(!original)return changes;
 data.rows.forEach((row,r)=>row.forEach((value,c)=>{const old=original.rows[r]?.[c]??'';if(String(value)!==String(old))changes.set(`${r}|${c}`,{before:old,after:value});}));return changes;
}
export function downloadTechnicalOutput(data,projectId){const output=serializeTechnicalOutput(data),blob=new Blob([output],{type:'text/plain;charset=utf-8'}),url=URL.createObjectURL(blob),anchor=document.createElement('a');anchor.href=url;anchor.download=(data.sourceName||('Output_'+projectId+'.txt')).replace(/\.txt$/i,'')+'_updated.txt';document.body.appendChild(anchor);anchor.click();anchor.remove();setTimeout(()=>URL.revokeObjectURL(url),10000);}
