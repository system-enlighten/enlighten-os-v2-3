import React,{useEffect,useState} from 'react';
import {BookOpen, ClipboardList, Users} from 'lucide-react';
import './Marketing.css';

export const marketingNavigation=[
  {id:'Portfolio & Content',label:'Portfolio & Content',group:'MARKETING',icon:BookOpen},
  {id:'Relationships',label:'Relationships',group:'MARKETING',icon:Users},
  {id:'Enquiries',label:'Enquiries',group:'MARKETING',icon:ClipboardList}
];
const kinds={'Portfolio & Content':'Case study',Relationships:'Relationship',Enquiries:'Enquiry'};
const enquiryStages=['New','Qualified','Consultation','Proposal sent','Won','Lost'];
const caseStages=['Draft','In review','Ready to publish','Published'];
const approvalOptions=['Internal only','Permission pending','Approved to share'];
const empty={projects:[],contacts:[],records:[]};

export default function Marketing({page,onNavigate,request,user}){
  const [data,setData]=useState(empty),[draft,setDraft]=useState(null),[query,setQuery]=useState('');
  const [loading,setLoading]=useState(true),[saving,setSaving]=useState(false),[error,setError]=useState('');
  const readOnly=/^viewer$/i.test(user.appAccess);
  async function load(){
    setLoading(true);
    setError('');
    try{setData(await request('getMarketingWorkspace',{},'POST'));}
    catch(error){setError(error.message);}
    finally{setLoading(false);}
  }
  useEffect(()=>{load();},[request]);
  const kind=kinds[page];
  const rows=data.records.filter(row=>row.kind===kind);
  const named=(list,id)=>list.find(row=>row.id===id);
  const recordName=id=>named(data.records,id)?.title;
  const projectName=id=>named(data.projects,id)?.name;
  const projects=data.projects.map(p=>[p.id,[p.number,p.name].filter(Boolean).join(' · ')]);
  const options=type=>data.records.filter(r=>r.kind===type).map(r=>[r.id,r.title]);
  const visible=rows.filter(row=>[row.title,row.owner,row.stage,row.organisation,projectName(row.projectId),recordName(row.relationshipId),recordName(row.caseStudyId)]
    .some(value=>String(value||'').toLowerCase().includes(query.trim().toLowerCase())));
  const start=(type,fields={})=>{setError('');setDraft({kind:type,createId:crypto.randomUUID(),...fields});};
  const edit=row=>start(row.kind,row);
  const navigate=page=>{setQuery('');setDraft(null);onNavigate(page);};
  function newEnquiry(field,id){
    navigate('Enquiries');
    start('Enquiry',{stage:'New',[field]:id});
  }
  async function save(event){
    event.preventDefault();
    if(saving||readOnly)return;
    setSaving(true);setError('');
    try{
      const row=await request('saveMarketingRecord',draft,'POST');
      setData(current=>({...current,records:current.records.some(r=>r.id===row.id)?current.records.map(r=>r.id===row.id?row:r):[...current.records,row]}));
      setDraft(null);
    }catch(error){setError(error.message);}
    finally{setSaving(false);}
  }
  const change=(key,value)=>setDraft(current=>({...current,[key]:value}));
  function field(label,key,type='text',choices=null,required=false){
    const props={value:draft[key]||'',required,onChange:event=>change(key,event.target.value)};
    return <label>{label}{choices?<select {...props}>
      <option value="">Choose…</option>
      {props.value&&!choices.some(([id])=>id===props.value)&&<option value={props.value}>{props.value}</option>}
      {choices.map(([id,name])=><option key={id} value={id}>{name}</option>)}
    </select>:type==='textarea'?<textarea {...props} rows={3}/>:<input {...props} type={type}/>}</label>;
  }
  const values=list=>list.map(value=>[value,value]);
  const today=new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Kolkata'}).format(new Date());
  const followUps=data.records.filter(r=>r.nextDate&&r.nextDate<=today&&!['Won','Lost'].includes(r.stage));
  const visits=data.records.filter(r=>r.kind==='Enquiry'&&r.visitDate>=today&&!['Won','Lost'].includes(r.stage))
    .sort((a,b)=>a.visitDate.localeCompare(b.visitDate));
  const openRecord=row=>{navigate(Object.keys(kinds).find(page=>kinds[page]===row.kind));if(!readOnly)edit(row);};
  return <section className="accounts marketing-workspace" aria-busy={loading}>
    <nav className="accounts-banking-tabs" aria-label="Marketing views">
      {['Home',...Object.keys(kinds)].map(tab=><button type="button" key={tab} aria-pressed={page===tab} disabled={saving}
        onClick={()=>navigate(tab)}>{tab==='Home'?'Overview':tab}</button>)}
    </nav>
    <header className="wih-register-head marketing-heading">
      <h1 className="studio-page-heading">{page==='Home'?'Marketing overview':page}</h1>
      {kind&&!readOnly&&<button type="button" disabled={loading||saving} onClick={()=>start(kind,kind==='Case study'?{stage:'Draft',approval:'Internal only'}:kind==='Enquiry'?{stage:'New'}:{})}>Add {kind.toLowerCase()}</button>}
    </header>
    {loading&&<p role="status">Loading marketing records…</p>}
    {error&&<p className="accounts-error" role="alert">{error} {!draft&&<button type="button" onClick={load}>Retry</button>}</p>}
    {!kind&&<>
      <p>Turn Studio projects into case studies, then track the enquiries and proposals they generate.</p>
      <div className="marketing-overview">
        {Object.entries(kinds).map(([page,type])=><button type="button" key={page} onClick={()=>navigate(page)}>
          <span>{page}</span><strong>{loading?'—':data.records.filter(row=>row.kind===type).length}</strong>
        </button>)}
      </div>
      <div className="marketing-overview">
        {[['Follow-ups due',followUps,'nextDate'],['Upcoming Experience Centre visits',visits,'visitDate']].map(([title,items,date])=>
          <section className="studio-home-card" key={title}><h2>{title}</h2>
            {!items.length&&<p>{loading?'—':'None scheduled.'}</p>}
            {items.map(row=><div className="marketing-reminder" key={row.id}><button type="button" onClick={()=>openRecord(row)}>{row.title}</button><time>{row[date]}</time></div>)}
          </section>)}
      </div>
    </>}
    {draft&&<form className="accounts-form" onSubmit={save}>
      <h2>{draft.id?'Edit':'Add'} {draft.kind.toLowerCase()}</h2>
      <fieldset disabled={saving}>
        <div className="accounts-fields">
          {field(draft.kind==='Relationship'?'Name':'Title','title','text',null,true)}
          {field('Owner','owner')}
          {draft.kind==='Case study'&&<>
            {field('Source Studio project','projectId','text',projects,true)}
            {field('Site mockup link','mockupUrl','url')}
            {field('Brief','brief','textarea')}
            {field('What changed and why','decision','textarea')}
            {field('Result','outcome','textarea')}
            {field('Content stage','stage','text',values(caseStages),true)}
            {field('Sharing permission','approval','text',values(approvalOptions),true)}
            {field('Published portfolio link','portfolioUrl','url')}
          </>}
          {draft.kind==='Relationship'&&<>
            {field('Directory contact','contactId','text',data.contacts.map(c=>[c.id,[c.name,c.role].filter(Boolean).join(' · ')]))}
            {field('Organisation','organisation')}{field('Role','role')}{field('Next follow-up','nextDate','date')}
            {field('Notes','notes','textarea')}
          </>}
          {draft.kind==='Enquiry'&&<>
            {field('Referring relationship','relationshipId','text',options('Relationship'))}
            {field('Case study','caseStudyId','text',options('Case study'))}
            {field('Enquiry source','channel','text',values(['Website','Instagram','Referral','Experience Centre','Event','Other']))}
            {field('Stage','stage','text',values(enquiryStages),true)}
            {field('Next follow-up','nextDate','date')}{field('Experience Centre visit date','visitDate','date')}
            {field('Proposal link','proposalUrl','url')}
            {field('Resulting Studio project','projectId','text',projects,draft.stage==='Won')}
            {field('Notes','notes','textarea')}
          </>}
        </div>
        <div className="accounts-actions"><button type="submit">{saving?'Saving…':'Save'}</button><button type="button" onClick={()=>setDraft(null)}>Cancel</button></div>
      </fieldset>
    </form>}
    {kind&&<>
      <div className="accounts-toolbar"><input type="search" value={query} onChange={event=>setQuery(event.target.value)} aria-label={'Search '+page} placeholder={'Search '+page.toLowerCase()}/></div>
      <div className="accounts-scroll"><table>
        <thead><tr>{['Name','Linked records','Status','Owner','Next step','Actions'].map(label=><th key={label} scope="col">{label}</th>)}</tr></thead>
        <tbody>{visible.map(row=><tr key={row.id}>
          <th scope="row"><strong>{row.title}</strong>{row.organisation&&<div>{row.organisation}</div>}</th>
          <td>{[projectName(row.projectId),recordName(row.relationshipId),recordName(row.caseStudyId),named(data.contacts,row.contactId)?.name].filter(Boolean).join(' · ')||'—'}</td>
          <td>{[row.stage,row.approval].filter(Boolean).join(' · ')||'—'}</td>
          <td>{row.owner||'—'}</td>
          <td>{row.nextDate&&<div>Follow up {row.nextDate}</div>}{row.visitDate&&<div>Visit {row.visitDate}</div>}
            {row.proposalUrl&&<a href={row.proposalUrl} target="_blank" rel="noreferrer">Open proposal</a>}
            {!row.nextDate&&!row.visitDate&&!row.proposalUrl&&'—'}</td>
          <td><details><summary>Details</summary>
            {[['Mockup',row.mockupUrl],['Portfolio',row.portfolioUrl]].filter(([,url])=>url).map(([label,url])=><div key={label}><a href={url} target="_blank" rel="noreferrer">{label}</a></div>)}
            {[['Brief',row.brief],['Design decision',row.decision],['Result',row.outcome],['Source',row.channel],['Role',row.role],['Notes',row.notes]].filter(([,value])=>value).map(([label,value])=><p key={label}><strong>{label}</strong><br/>{value}</p>)}
          </details>
          {!readOnly&&<div className="marketing-row-actions"><button type="button" disabled={saving} onClick={()=>edit(row)}>Edit</button>
            {kind!=='Enquiry'&&<button type="button" disabled={saving} onClick={()=>newEnquiry(kind==='Case study'?'caseStudyId':'relationshipId',row.id)}>Add enquiry</button>}
          </div>}</td>
        </tr>)}
        {!visible.length&&!loading&&<tr><td colSpan={6}>{query?'No matching records.':'No records yet.'}</td></tr>}</tbody>
      </table></div>
    </>}
  </section>;
}
