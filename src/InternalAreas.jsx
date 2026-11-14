import React,{useEffect,useState} from 'react';
export default function InternalAreas({request,manage=false,buttonStyle,inputStyle}){
 const [data,setData]=useState(null),[filter,setFilter]=useState(''),[draft,setDraft]=useState(null),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 const load=async()=>{try{setError('');setData(await request('internalAreas',{action:manage?'list':'review'},'POST'));}catch(e){setError(e.message);}};
 useEffect(()=>{load();},[request,manage]);
 const save=async(area)=>{setBusy(true);setError('');try{await request('internalAreas',{action:'save',...area},'POST');setDraft(null);await load();}catch(e){setError(e.message);}finally{setBusy(false);}};
 const rows=(data?.tasks||[]).filter(t=>!filter||t.projectId===filter);
 return <section className="studio-home-card" style={{margin:'18px 0'}}><h2>{manage?'Internal work areas':'Internal work'}</h2>{error&&<p role="alert">{error}</p>}{!data&&!error&&<p role="status">Loading internal work…</p>}
 {manage&&data&&<><button style={buttonStyle} onClick={()=>setDraft({name:'',active:true})}>Add work area</button>
 {data.areas.map(a=><div className="studio-home-task-row" key={a.id}><strong>{a.name}{!a.active?' · Archived':''}</strong><div><button style={buttonStyle} disabled={busy} onClick={()=>setDraft(a)}>Rename</button>{' '}<button style={buttonStyle} disabled={busy} onClick={()=>save({...a,active:!a.active})}>{a.active?'Archive':'Restore'}</button></div></div>)}
 {draft&&<form onSubmit={e=>{e.preventDefault();if(!busy&&draft.name.trim())save(draft);}} style={{marginTop:12}}><label>Work area name <input required maxLength={100} style={inputStyle} value={draft.name} onChange={e=>setDraft({...draft,name:e.target.value})}/></label><button style={buttonStyle} disabled={busy||!draft.name.trim()}>Save</button>{' '}<button type="button" style={buttonStyle} disabled={busy} onClick={()=>setDraft(null)}>Cancel</button></form>}</>}
 {!manage&&data&&<><label>Work area <select style={inputStyle} value={filter} onChange={e=>setFilter(e.target.value)}><option value="">All internal work areas</option>{data.areas.map(a=><option key={a.id} value={a.id}>{a.name}{!a.active?' (archived)':''}</option>)}</select></label><p>{rows.length} tasks · {(rows.reduce((n,t)=>n+t.minutes,0)/60).toFixed(2)} hours logged</p>
 {!rows.length&&<p>No tasks in this selection.</p>}{rows.map(t=><div className="studio-home-task-row" key={t.id}><div><strong>{t.title}</strong><p>{data.areas.find(a=>a.id===t.projectId)?.name||'Internal work'} · {t.owner} · {t.status} · {t.activity}</p>{t.narration&&<p style={{whiteSpace:'pre-wrap',overflowWrap:'anywhere'}}>{t.narration}</p>}</div><span>{(t.minutes/60).toFixed(2)} h</span></div>)}</>}</section>;
}
