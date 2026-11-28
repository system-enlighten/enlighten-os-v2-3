const fields=[
 ['Colour temperature',/^(CCT|COLOU?R(?: TEMPERATURE)?)$/i],
 ['CRI',/^CRI$/i],
 ['Optics / beam angle',/^(BEAM(?: ANGLE)?|OPTICS)$/i],
 ['Wattage',/^WATTAGE$/i],
 ['IP rating',/^IP(?: RATING)?$/i],
 ['Control',/^CONTROL$/i],
];
const clean=value=>String(value??'').trim().replace(/\s+/g,' ');
function unique(values){
 const seen=new Set();
 return values.map(clean).filter(value=>{
  if(!value||value==='<>'||seen.has(value.toLowerCase()))return false;
  seen.add(value.toLowerCase());return true;
 });
}
export function designRequirements(data,group,related){
 const rows=group.sourceIndices.map(i=>data.rows[i]).filter(Boolean);
 const values=pattern=>unique(rows.flatMap(row=>data.headers.flatMap((header,i)=>pattern.test(clean(header))?[row[i]]:[])));
 const sections=[
  ['Applications',unique([...values(/^APPLICATION$/i),...related.flatMap(row=>String(row.application||'').split(' / '))])],
  ['Lighting performance / CMF',unique(related.flatMap(row=>String(row.cmf||'').split(' / ')))],
  ['Illuminance',unique(related.flatMap(row=>String(row.illuminance||'').split(' / ')))],
  ...fields.map(([label,pattern])=>[label,values(pattern)]),
 ];
 return sections.filter(([,items])=>items.length).map(([label,items])=>label+': '+items.join(' · ')).join('\n');
}
export function requirementSections(text){
 return String(text||'').split('\n').filter(Boolean).map(line=>{
  const match=/^(Applications|Lighting performance \/ CMF|Illuminance|Colour temperature|CRI|Optics \/ beam angle|Wattage|IP rating|Control): (.*)$/.exec(line);
  return match?{label:match[1],values:match[2].split(' · ')}:{label:'',values:[line]};
 });
}
