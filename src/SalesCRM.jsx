import React,{useEffect,useState} from 'react';
import {ClipboardList,Users,FileText,CalendarDays} from 'lucide-react';
import './Marketing.css';

export const salesNavigation=[
 {id:'CRM',label:'CRM',group:'SALES',icon:ClipboardList},
 {id:'Site Survey',label:'Site Survey',group:'SALES',icon:CalendarDays},
 {id:'Accounts & Customers',label:'Accounts & Customers',group:'SALES',icon:Users},
 {id:'Design Proposals',label:'Design Proposals',group:'SALES',icon:FileText}
];
const stages=['New','Qualified','Consultation','Proposal sent','Negotiation / Review','Won','Lost'];
const displayStage={New:'Mature Lead',Qualified:'Establish Contact',Consultation:'Design Consultation','Proposal sent':'Proposal / Demo',Won:'Closed Won',Lost:'Closed Lost'};
const labelStage=s=>displayStage[s]||s;
const today=()=>new Date().toLocaleDateString('sv-SE',{timeZone:'Asia/Kolkata'});
const blank={records:[],projects:[],contacts:[]};
const currency=n=>new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR'}).format(Number(n));
const closed=r=>['Won','Lost'].includes(r.stage);

export default function SalesCRM({page,onNavigate,request,user}){
 const [data,setData]=useState(blank),[tab,setTab]=useState('Pipeline'),[accountTab,setAccountTab]=useState('Architect Accounts');
 const [selected,setSelected]=useState(''),[draft,setDraft]=useState(null),[query,setQuery]=useState('');
 const [loading,setLoading]=useState(true),[saving,setSaving]=useState(false),[error,setError]=useState('');
 const readOnly=/^viewer$/i.test(user.appAccess);
 const leads=data.records.filter(r=>r.kind==='Enquiry');
 const relationships=data.records.filter(r=>r.kind==='Relationship');
 const active=leads.find(r=>r.id===selected);
 async function load(){setLoading(true);setError('');try{setData(await request('getSalesWorkspace',{},'POST'));}catch(e){setError(e.message);}finally{setLoading(false);}}
 useEffect(()=>{load();},[request]);
 useEffect(()=>{setSelected('');setDraft(null);setQuery('');},[page]);
 const start=(fields={})=>setDraft({kind:'Enquiry',stage:'New',owner:user.name,createId:crypto.randomUUID(),...fields});
 const edit=row=>setDraft({...row,activity:''});
 const open=id=>{setDraft(null);setSelected(id);};
 const change=(key,value)=>setDraft(d=>({...d,[key]:value}));
 const fields=(label,key,type='text',choices=null,required=false)=>{
  const props={value:draft[key]||'',required,onChange:e=>change(key,e.target.value)};
  return <label>{label}{choices?<select {...props}><option value="">Choose…</option>{props.value&&!choices.some(([v])=>v===props.value)&&<option value={props.value}>{props.value}</option>}{choices.map(([v,t])=><option key={v} value={v}>{t}</option>)}</select>:type==='textarea'?<textarea rows={3} {...props}/>:<input type={type} {...props}/>}</label>;
 };
 const opts=a=>a.map(s=>[s,s]);
 const named=id=>data.records.find(r=>r.id===id)?.title;
 const projectName=id=>data.projects.find(p=>p.id===id)?.name;
 async function save(e){e.preventDefault();if(saving)return;setSaving(true);setError('');try{
  const row=await request('saveSalesRecord',draft,'POST');
  setData(d=>({...d,records:[...d.records.filter(r=>r.id!==row.id),row]}));setDraft(null);setSelected(row.id);
 }catch(e){setError(e.message);}finally{setSaving(false);}}
 const rows=leads.filter(r=>{
  if(page==='Site Survey'&&r.channel!=='Site survey'&&!r.surveyUrl)return false;
  if(page==='Design Proposals'&&!r.proposalUrl&&!r.designScope&&!['Proposal sent','Negotiation / Review','Won'].includes(r.stage))return false;
  if(page==='Accounts & Customers'&&r.stage!=='Won')return false;
  if(page==='CRM'&&tab==='Follow-ups'&&(!r.nextDate||closed(r)))return false;
  if(page==='CRM'&&tab==='Enquiries'&&r.channel==='Site survey')return false;
  return [r.title,r.contact,r.area,r.owner,labelStage(r.stage)].some(v=>String(v||'').toLowerCase().includes(query.toLowerCase()));
 });
 function location(){if(!navigator.geolocation){setError('Location unavailable. Enter the address manually.');return;}navigator.geolocation.getCurrentPosition(({coords})=>setDraft(d=>d?{...d,latitude:String(coords.latitude),longitude:String(coords.longitude)}:d),()=>setError('Location unavailable. Enter the address manually.'),{timeout:10000});}
 const tabs=page==='CRM'?['Pipeline','Enquiries','Follow-ups']:page==='Accounts & Customers'?['Architect Accounts','Customers']:null;
 return <section className="accounts marketing-workspace sales-crm">
  {tabs&&<nav className="accounts-banking-tabs" aria-label="Sales views">{tabs.map(t=><button type="button" key={t} aria-pressed={(page==='CRM'?tab:accountTab)===t} onClick={()=>{setSelected('');setDraft(null);page==='CRM'?setTab(t):setAccountTab(t);}}>{t}</button>)}</nav>}
  <header className="wih-register-head marketing-heading"><h1 className="studio-page-heading">{page==='Home'?'Sales overview':page}</h1>
   {!readOnly&&<button type="button" disabled={loading||saving} onClick={()=>start({channel:page==='Site Survey'?'Site survey':tab==='Enquiries'?'Inbound enquiry':''})}>＋ {tab==='Enquiries'&&page==='CRM'?'Add enquiry':'Capture lead'}</button>}
  </header>
  {error&&<p role="alert" className="accounts-error">{error} <button type="button" onClick={load}>Refresh</button></p>}
  {page==='Home'&&<div className="marketing-overview">{[['Open leads',leads.filter(r=>!closed(r)).length],['Follow-ups due',leads.filter(r=>!closed(r)&&r.nextDate&&r.nextDate<=today()).length],['Won',leads.filter(r=>r.stage==='Won').length]].map(([k,v])=><button key={k} onClick={()=>onNavigate('CRM')}>{k}<strong>{loading?'—':v}</strong></button>)}</div>}
  {draft&&<form className="accounts-form" onSubmit={save}><h2>{draft.id?'Edit opportunity':'Capture opportunity'}</h2><fieldset disabled={saving}>
   <button type="button" onClick={location}>Use current location</button> {draft.latitude&&<a href={'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(draft.latitude+','+draft.longitude)} target="_blank" rel="noreferrer">Preview site location</a>}
   <div className="accounts-fields">
    {fields('Project name','title','text',null,true)}{fields('Area / locality','area')}{fields('House / plot number','houseNumber')}
    {fields('Project type','projectType','text',opts(['Residential','Commercial','Hospitality','Retail','Other']))}{fields('Construction stage','siteStage')}{fields('Site photo / survey link','surveyUrl','url')}
    {fields('Contact name','contact')}{fields('Phone','phone','tel')}{fields('Email','email','email')}{fields('Sales owner','owner')}
    {fields('Lead source','channel','text',opts(['Site survey','Architect referral','Client referral','Inbound enquiry','Website','Instagram','Referral','Experience Centre','Event','Other']))}
    {fields('Referring relationship','relationshipId','text',relationships.map(r=>[r.id,r.title]))}
    {fields('Architect / practice','architecturePractice')}{fields('Directory contact','architectContactId','text',data.contacts.map(c=>[c.id,c.name+' · '+(c.role||'')]))}
    {fields('Case study','caseStudyId','text',data.records.filter(r=>r.kind==='Case study').map(r=>[r.id,r.title]))}
    {fields('Sales stage','stage','text',stages.map(s=>[s,labelStage(s)]),true)}
    {fields('Next follow-up','nextDate','date')}{fields('Experience Centre visit','visitDate','date')}
    {fields('Design scope','designScope','textarea')}{fields('Design fee (INR)','designFee','number')}{fields('Payment milestones','milestones','textarea')}{fields('Proposal document link','proposalUrl','url')}
    {fields('Resulting Studio project','projectId','text',data.projects.map(p=>[p.id,[p.number,p.name].filter(Boolean).join(' · ')]),draft.stage==='Won')}
    {fields('Notes','notes','textarea')}{fields('Activity / stage change note','activity','textarea')}
   </div><div className="accounts-actions"><button type="submit">{saving?'Saving…':'Save'}</button><button type="button" onClick={()=>setDraft(null)}>Cancel</button></div>
  </fieldset></form>}
  {active&&<div className="sales-record">
   <button type="button" onClick={()=>setSelected('')}>Back to register</button>
   <header className="marketing-heading"><h2>{active.title}</h2>{!readOnly&&<button type="button" onClick={()=>edit(active)}>Edit / log activity</button>}</header>
   <ol className="sales-stage-path" aria-label="Sales stages">{[...stages.slice(0,-2),active.stage==='Lost'?'Lost':'Won'].map(s=><li key={s} aria-current={active.stage===s?'step':undefined}>{labelStage(s)}</li>)}</ol>
   <dl className="sales-record-fields">{[['Contact',active.contact],['Phone',active.phone],['Email',active.email],['Location',[active.houseNumber,active.area].filter(Boolean).join(', ')],['Owner',active.owner],['Source',active.channel],['Architect',active.architecturePractice],['Referral',named(active.relationshipId)],['Case study',named(active.caseStudyId)],['Next follow-up',active.nextDate],['Visit',active.visitDate],['Project',projectName(active.projectId)]].map(([k,v])=><div key={k}><dt>{k}</dt><dd>{v||'—'}</dd></div>)}</dl>
   <section className="studio-home-card"><h2>Design proposal</h2><p>{active.designScope||'Scope pending'}</p><strong>{active.designFee?currency(active.designFee):'Fee pending'}</strong><p>{active.milestones}</p>{active.proposalUrl&&<a href={active.proposalUrl} target="_blank" rel="noreferrer">Open proposal</a>}</section>
   <section className="studio-home-card"><h2>Activity timeline</h2>{JSON.parse(active.salesHistory||'[]').slice().reverse().map((event,i)=><p key={i}><strong>{labelStage(event.stage)}</strong> · {event.note}<br/><small>{event.at} · {event.by}</small></p>)}</section>
  </div>}
  {!active&&page!=='Home'&&page==='Accounts & Customers'&&accountTab==='Architect Accounts'&&<div className="accounts-scroll"><table><thead><tr><th>Architect / practice</th><th>Contact</th><th>Opportunity</th></tr></thead><tbody>{data.contacts.filter(c=>/architect|interior/i.test(c.role)).map(c=><tr key={c.id}><td>{c.name}</td><td>{c.role}</td><td>{!readOnly&&<button onClick={()=>start({architectContactId:c.id,architecturePractice:c.name,channel:'Architect referral'})}>Add referral</button>}</td></tr>)}</tbody></table></div>}
  {!active&&page!=='Home'&&!(page==='Accounts & Customers'&&accountTab==='Architect Accounts')&&<>
   <div className="accounts-toolbar"><input type="search" aria-label="Find opportunity" placeholder="Find opportunity" value={query} onChange={e=>setQuery(e.target.value)}/></div>
   <div className="accounts-scroll"><table><thead><tr>{['Project','Stage','Contact','Area','Owner','Next follow-up','Design fee'].map(k=><th key={k}>{k}</th>)}</tr></thead>
    <tbody>{rows.map(r=><tr key={r.id}><td><button onClick={()=>open(r.id)}>{r.title}</button></td><td>{labelStage(r.stage)}</td><td>{r.contact||'—'}</td><td>{r.area||'—'}</td><td>{r.owner||'—'}</td><td>{r.nextDate||'—'}</td><td>{r.designFee?currency(r.designFee):'—'}</td></tr>)}{!loading&&!rows.length&&<tr><td colSpan={7}>No opportunities found.</td></tr>}</tbody>
   </table></div>
  </>}
 </section>;
}
