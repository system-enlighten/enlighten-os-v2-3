import {serializeTechnicalOutput} from './technical-editing.mjs';
const norm=v=>String(v??'').trim().toUpperCase().replace(/\s+/g,'');
const val=(d,r,name)=>String(r?.[d.headers.findIndex(h=>norm(h)===name)]??'');
function columns(data){const map=new Map();data.headers.forEach((h,i)=>{const k=norm(h);if(map.has(k))throw Error(`Duplicate heading ${h}. Use unique column headings before comparing.`);map.set(k,i)});return map}
export function compareOutput(system,drawing){
 const sc=columns(system),dc=columns(drawing),changes=[],records=[],warnings=[];const common=[...sc.keys()].filter(k=>dc.has(k));
 const add=(change)=>{const c={...change,id:'change-'+changes.length};changes.push(c);return c.id};
 const schema=[];for(const [key,index] of dc)if(!sc.has(key))schema.push({key,kind:'column-added',id:add({kind:'column-added',label:drawing.headers[index],system:'Column absent',drawing:'Add column with drawing values'})});for(const [key,index] of sc)if(!dc.has(key))schema.push({key,kind:'column-removed',id:add({kind:'column-removed',label:system.headers[index],system:'Keep column and system values',drawing:'Remove column'})});
 const used=new Set(),pairs=[];let handles=sc.has('HANDLE')&&dc.has('HANDLE');
 for(const [label,d] of [['System',system],['Drawing',drawing]]){if(!(d===system?sc:dc).has('HANDLE'))continue;const seen=new Set();for(const [rowIndex,r] of d.rows.entries()){const h=norm(val(d,r,'HANDLE'));if(!h&&d===system&&(system.manualRows||[]).some(m=>m.rowIndex===rowIndex)){warnings.push(`System row ${rowIndex+1} is awaiting its drawing HANDLE.`);continue}if(!h)throw Error(`${label} contains a blank HANDLE. Export a unique HANDLE for every fixture.`);if(seen.has(h))throw Error(`${label} contains duplicate HANDLE ${h}. Correct it before comparing.`);seen.add(h)}}
 if(handles){const byHandle=new Map(system.rows.map((r,i)=>[norm(val(system,r,'HANDLE')),i]).filter(([h])=>h));drawing.rows.forEach((r,i)=>{const old=byHandle.get(norm(val(drawing,r,'HANDLE')));if(old!==undefined)used.add(old);pairs.push({systemIndex:old,drawingIndex:i})});
 }else{
 if(system.rows.length&&sc.has('HANDLE')!==dc.has('HANDLE'))throw Error('One file has HANDLE identifiers and the other does not. Upload an export with matching HANDLE identifiers to compare fixtures safely.');
 if(system.rows.length)warnings.push('HANDLE is absent. Unique floor/circuit pairs are matched; changed fixtures on repeated circuits are shown as additions and removals instead of being paired arbitrarily.');
 const identity=(d,r)=>norm(val(d,r,'FLOOR'))+'|'+norm(val(d,r,'CN'));
 const sys=new Map(),draw=new Map();system.rows.forEach((r,i)=>{const k=identity(system,r);if(!sys.has(k))sys.set(k,[]);sys.get(k).push(i)});drawing.rows.forEach((r,i)=>{const k=identity(drawing,r);if(!draw.has(k))draw.set(k,[]);draw.get(k).push(i)});
 const signature=(d,r)=>JSON.stringify(common.map(k=>String(r[(d===system?sc:dc).get(k)]??'')));
 drawing.rows.forEach((r,i)=>{const k=identity(drawing,r),candidates=(sys.get(k)||[]).filter(j=>!used.has(j));let old;if(candidates.length===1&&sys.get(k).length===1&&draw.get(k).length===1)old=candidates[0];else old=candidates.find(j=>signature(system,system.rows[j])===signature(drawing,r));if(old!==undefined)used.add(old);pairs.push({systemIndex:old,drawingIndex:i})});
 }
 system.rows.forEach((r,i)=>{if(!used.has(i))pairs.push({systemIndex:i,drawingIndex:undefined})});
 for(const pair of pairs){const sr=system.rows[pair.systemIndex],dr=drawing.rows[pair.drawingIndex];const label=[val(dr?drawing:system,dr||sr,'CN'),val(dr?drawing:system,dr||sr,'HANDLE')].filter(Boolean).join(' · ')||`Row ${(pair.drawingIndex??pair.systemIndex)+1}`;const record={...pair,label,fields:[]};
 if(!sr)record.id=add({kind:'added',label,system:'Fixture absent',drawing:'Add drawing fixture',systemRow:null,drawingRow:dr});else if(!dr)record.id=add({kind:'removed',label,system:'Keep system fixture',drawing:'Remove fixture',systemRow:sr,drawingRow:null});else for(const key of common){if(key==='HANDLE'&&norm(sr[sc.get(key)])===norm(dr[dc.get(key)]))continue;const before=String(sr[sc.get(key)]??''),after=String(dr[dc.get(key)]??'');if(before!==after)record.fields.push({key,id:add({kind:'field',label,field:system.headers[sc.get(key)],system:before,drawing:after})});}
 records.push(record);
 }
 return {system,drawing,changes,records,schema,warnings};
}
export function mergeOutputReview(review,choices){
 if(review.changes.some(c=>!['system','drawing'].includes(choices[c.id])))throw Error('Choose System or Drawing for every change before applying.');
 const {system,drawing}=review,sc=columns(system),dc=columns(drawing),headers=[...system.headers];
 for(const s of review.schema){if(s.kind==='column-added'&&choices[s.id]==='drawing')headers.push(drawing.headers[dc.get(s.key)]);if(s.kind==='column-removed'&&choices[s.id]==='drawing'){const i=headers.findIndex(h=>norm(h)===s.key);headers.splice(i,1)}}
 const keys=headers.map(norm),rows=[],baseline=[],manualRows=[],overrides=structuredClone(system.overrides||{});
 for(const record of review.records){const sr=system.rows[record.systemIndex],dr=drawing.rows[record.drawingIndex];if(!sr&&choices[record.id]==='system'||!dr&&choices[record.id]==='drawing')continue;
 const merged=keys.map(key=>{if(!sr)return String(dr[dc.get(key)]??'');if(!dr)return String(sr[sc.get(key)]??'');const field=record.fields.find(f=>f.key===key);if(field)return String((choices[field.id]==='drawing'?dr[dc.get(key)]:sr[sc.get(key)])??'');return String(sc.has(key)?sr[sc.get(key)]??'':dr[dc.get(key)]??'')});if(!dr){const meta=(system.manualRows||[]).find(m=>m.rowIndex===record.systemIndex);if(meta)manualRows.push({...meta,rowIndex:rows.length})}rows.push(merged);baseline.push(keys.map(key=>dr?String(dr[dc.get(key)]??''):''));
 for(const field of record.fields){if(choices[field.id]!=='drawing')continue;const cn=norm(val(system,sr,'CN'));for(const id of Object.keys(overrides)){if(id.split('|').at(-1)!==cn)continue;if(['HOUSINGNUMBER','FITTINGTYPE','PRODUCTCODE'].includes(field.key))delete overrides[id].fixture;if(field.key==='CMF')delete overrides[id].cmf;}}
 }
 if(!keys.includes('CN')||!keys.includes('HOUSINGNUMBER'))throw Error('Keep the drawing CN and HOUSINGNUMBER columns to create an Output.');
 if(rows.length>2000||headers.length>80)throw Error('The merged Output exceeds 2,000 fixtures or 80 columns.');
 const sourceText=serializeTechnicalOutput({headers,rows:baseline,sourceText:review.drawing.sourceText||''});
 return {headers,rows,rules:{},overrides,manualRows,sourceText,sourceName:drawing.sourceName||system.sourceName||'',version:system.version||''};
}
