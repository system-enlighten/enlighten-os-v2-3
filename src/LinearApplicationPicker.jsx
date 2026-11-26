import React,{useState} from 'react';
export default function LinearApplicationPicker({choices,selected,onChange,disabled=false}){
 const [query,setQuery]=useState('');
 const shown=choices.filter(a=>[a.label,a.code].join(' ').toLowerCase().includes(query.trim().toLowerCase()));
 return <fieldset className="linear-linked-applications"><legend>Linked applications ({selected.length})</legend><input type="search" placeholder="Search applications or codes" value={query} onChange={e=>setQuery(e.target.value)}/><div className="linear-linked-list">{shown.map(a=><label key={a.id}><input type="checkbox" disabled={disabled} checked={selected.includes(a.id)} onChange={e=>onChange(e.target.checked?[...selected,a.id]:selected.filter(id=>id!==a.id))}/>{a.url&&<img src={a.url} alt="" loading="lazy"/>}<span>{a.label}<small>{a.code}</small></span></label>)}</div></fieldset>;
}
