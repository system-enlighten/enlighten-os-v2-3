import React, {useState} from 'react';

const columns = [
  ['fittingType', 'Fitting type'], ['profile', 'Profile no.'], ['suffix', 'Variant'],
  ['iconUrl', 'Icon'], ['brand', 'Brand / IP / Article'], ['thumbnailUrl', 'Thumbnail'], ['x', 'X'],
  ['pcbWidth', 'PCB width'], ['standardLengths', 'Standard lengths'], ['wattage', 'Wattage'],
  ['category', 'Category'],
];

function profileCode(code) {
  return /^L[^|]*\|\s*(\d{3})([A-Z]*)$/i.exec(String(code || '').trim());
}

export default function ProductDatabaseTable({database, onOpen, renderImage, inputStyle, buttonStyle}) {
  const [search, setSearch] = useState('');
  const [linear, setLinear] = useState(false);
  const [sort, setSort] = useState({key:'profile', ascending:true});
  const fittings = new Map();
  for (const fitting of database) {
    const code = String(fitting.fittingType || '').trim().toUpperCase();
    if (!code) continue;
    const previous = fittings.get(code);
    if (!previous || (previous.legacyCatalogue && !fitting.legacyCatalogue)) fittings.set(code, fitting);
  }
  const rows = [...fittings.values()].map(fitting => {
    const match = profileCode(fitting.fittingType);
    return {...fitting, profile:match?.[1] || '', suffix:match?.[2] || ''};
  });
  const highest = rows.reduce((max,row) => row.profile > max ? row.profile : max, '');
  const query = search.trim().toLowerCase();
  const visible = rows.filter(row =>
    (!linear || /^L/i.test(row.fittingType)) &&
    (!query || [row.fittingType,row.profile,row.category,row.x,row.pcbWidth,row.brand].some(value => String(value ?? '').toLowerCase().includes(query)))
  ).sort((a,b) => {
    const key = sort.key;
    if (key === 'profile' && Boolean(a.profile) !== Boolean(b.profile)) return a.profile ? -1 : 1;
    const order = String(a[key] ?? '').localeCompare(String(b[key] ?? ''), undefined, {numeric:true});
    return (sort.ascending ? order : -order) || a.fittingType.localeCompare(b.fittingType, undefined, {numeric:true});
  });
  const cell = {padding:'5px 8px',border:'1px solid #d7d0c3',verticalAlign:'middle'};
  return <section style={{fontSize:12}}>
    <div style={{display:'flex',flexWrap:'wrap',gap:12,alignItems:'center',marginBottom:10}}>
      <input aria-label="Search product database" placeholder="Search code, profile or category…" value={search} onChange={event=>setSearch(event.target.value)} style={{...inputStyle,fontSize:12,width:'min(260px, 100%)'}}/>
      <label><input type="checkbox" checked={linear} onChange={event=>setLinear(event.target.checked)}/> Linear only</label>
      {highest && <span>Highest profile no. <strong>{highest}</strong></span>}
      <span>{visible.length} fitting types</span>
    </div>
    <div style={{overflow:'auto',maxHeight:'70vh'}}>
      <table aria-label="Product database" style={{borderCollapse:'separate',borderSpacing:0,width:'100%',minWidth:840,background:'#fff'}}>
        <thead style={{position:'sticky',top:0,background:'#D2CDC1',zIndex:1}}><tr>{columns.map(([key,label])=>
          <th key={key} scope="col" aria-sort={sort.key===key?(sort.ascending?'ascending':'descending'):undefined} style={{...cell,textAlign:'left',whiteSpace:'nowrap'}}>
            {['thumbnailUrl','iconUrl'].includes(key)?label:<button type="button" style={{border:0,padding:0,background:'transparent',font:'inherit',fontWeight:700,color:'inherit',cursor:'pointer'}} onClick={()=>setSort({key,ascending:sort.key!==key||!sort.ascending})}>{label}{sort.key===key?(sort.ascending?' ↑':' ↓'):''}</button>}
          </th>)}</tr></thead>
        <tbody>{visible.map(row=><tr key={row.id}>{columns.map(([key])=><td key={key} style={cell}>{
          key==='fittingType'?<button type="button" style={{...buttonStyle,whiteSpace:'nowrap'}} onClick={()=>onOpen(row.id)}>{row.fittingType}</button>:
          ['thumbnailUrl','iconUrl'].includes(key)&&row[key]?renderImage(row[key],row.fittingType+(key==='iconUrl'?' icon':' section')):row[key]||'—'
        }</td>)}</tr>)}{!visible.length&&<tr><td style={cell} colSpan={columns.length}>No fitting types match.</td></tr>}</tbody>
      </table>
    </div>
  </section>;
}
