import React,{useEffect,useId,useRef,useState} from 'react';
const money=n=>new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR'}).format((n||0)/100);
const billingFields = [
  ['Client / legal billing name', 'client', 'text'],
  ['Billing address', 'address'],
  ['State', 'state', 'text'],
  ['State code', 'stateCode', 'text'],
  ['GSTIN', 'gstin', 'text'],
  ['Contact person', 'contact', 'text'],
  ['Contact email', 'contactEmail', 'email'],
  ['Phone', 'phone', 'tel']
];

function ProjectBillingRow({project, readOnly, savingId, saveProfile}) {
  const formId = useId();
  const [edits, setEdits] = useState({});
  const [error, setError] = useState('');
  const billing = {...project.billing, client: project.billing?.client || project.client || ''};
  const values = {...billing, ...edits};
  const changed = billingFields.some(([, key]) => (values[key] || '') !== (billing[key] || ''));

  async function save(event) {
    event.preventDefault();
    if (!changed || readOnly || savingId) return;
    setError('');
    try {
      await saveProfile(project, Object.fromEntries(billingFields.map(([, key]) => [key, values[key] || ''])));
      setEdits({});
    } catch (error) {
      setError(error.message);
    }
  }

  return <tr>
    <th scope="row">{project.name}</th>
    <td>{project.contractNumber || 'Not recorded'}</td>
    <td>{project.contractAmount == null ? 'Not signed' : money(project.contractAmount)}</td>
    {billingFields.map(([label, key, type]) => {
      const value = values[key] || '';
      const props = {
        form: formId,
        'aria-label': label + ' for ' + project.name,
        disabled: savingId === project.id,
        value,
        required: key === 'client' || key === 'address',
        onChange: event => setEdits({...edits, [key]: event.target.value})
      };
      return <td key={key}>{readOnly ? value || '—' :
        type ? <input {...props} type={type}/> : <textarea {...props} rows={2}/>}
      </td>;
    })}
    {!readOnly && <td>
      <form id={formId} onSubmit={save}>
        <button type="submit" disabled={!changed || Boolean(savingId)}>
          {savingId === project.id ? 'Saving…' : 'Save'}
        </button>
        {error && <div className="accounts-error" role="alert">{error}</div>}
      </form>
    </td>}
  </tr>;
}

export function ProjectBilling({projects, request, onSaved, readOnly}) {
  const saving = useRef(false);
  const [savingId, setSavingId] = useState('');
  const [message, setMessage] = useState('');

  async function saveProfile(project, values) {
    if (saving.current) throw new Error('A billing row is already saving. Try again when it finishes.');
    saving.current = true;
    setSavingId(project.id);
    setMessage('');
    try {
      const profile = await request('saveAccounts', {
        ...values, id: crypto.randomUUID(), kind: 'billingProfile', projectId: project.id,
        date: new Date().toLocaleDateString('sv-SE', {timeZone: 'Asia/Kolkata'})
      });
      onSaved(project.id, profile);
      setMessage('Billing details saved for ' + project.name + '.');
    } finally {
      saving.current = false;
      setSavingId('');
    }
  }

  return <section>
    <p>Edit billing details in the table and save the project’s row. Contract values come from Legal &amp; Contracts.</p>
    <div className="project-billing-scroll" tabIndex={0} role="region" aria-label="Project billing details">
      <table className="project-billing-table">
        <thead><tr>
          {['Project', 'Signed contract', 'Contract value', ...billingFields.map(([label]) => label), ...(!readOnly ? ['Action'] : [])]
            .map(label => <th key={label} scope="col">{label}</th>)}
        </tr></thead>
        <tbody>
          {projects.map(project => <ProjectBillingRow key={project.id} {...{project, readOnly, savingId, saveProfile}}/>)}
          {!projects.length && <tr><td colSpan={readOnly ? 11 : 12}>No projects found.</td></tr>}
        </tbody>
      </table>
    </div>
    {message && <p role="status">{message}</p>}
  </section>;
}

export function LegalContracts({request,user}){
 const [data,setData]=useState(null),[id,setId]=useState(''),[draft,setDraft]=useState({}),[busy,setBusy]=useState(false),[message,setMessage]=useState('');
 const load=async()=>{try{setData(await request('getLegalContracts',{},'POST'));}catch(e){setMessage(e.message);}};
 useEffect(()=>{load();},[]);
 const choose=value=>{setId(value);const c=data.contracts.find(c=>String(c.projectId)===value);setDraft({contractNumber:'',status:'Draft',signedDate:'',documentUrl:'',...c,amount:c?(Number(c.amount)/100).toFixed(2):'',expectedVersion:c?.version||''});setMessage('');};
 const save=async e=>{e.preventDefault();setBusy(true);try{const record=await request('saveLegalContract',{...draft,projectId:id},'POST');setDraft({...record,amount:(record.amount/100).toFixed(2),expectedVersion:record.version});await load();setMessage('Contract saved. Signed values are now available in Accounts.');}catch(e){setMessage(e.message);}finally{setBusy(false);}};
 return <section className="accounts-workspace"><p>Record the agreed project value here. Only signed contracts contribute to the Accounts project amount. For an amendment, update the agreed net contract value.</p>{data&&<><label>Project<select value={id} onChange={e=>choose(e.target.value)}><option value="">Select project</option>{data.projects.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label>{id&&<form className="accounts-form" onSubmit={save}><fieldset disabled={busy||/^viewer$/i.test(user.appAccess)}><div className="accounts-fields">{[['Contract reference','contractNumber','text'],['Agreed project value (INR)','amount','number'],['Signed date','signedDate','date'],['Contract document (Drive link)','documentUrl','url']].map(([label,key,type])=><label key={key}>{label}<input required={key==='contractNumber'||key==='amount'||key==='signedDate'&&draft.status==='Signed'} type={type} min={type==='number'?'0.01':undefined} step={type==='number'?'0.01':undefined} value={draft[key]||''} onChange={e=>setDraft({...draft,[key]:e.target.value})}/></label>)}<label>Status<select value={draft.status} onChange={e=>setDraft({...draft,status:e.target.value})}><option>Draft</option><option>Signed</option></select></label></div><button>Save contract</button></fieldset></form>}</>}{message&&<p role="status">{message}</p>}</section>;
}
