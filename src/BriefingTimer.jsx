import React,{useEffect,useState} from 'react';

export default function BriefingTimer({request,buttonStyle,onTimerChange}){
 const [briefing,setBriefing]=useState(null),[busy,setBusy]=useState(true),[error,setError]=useState(''),[narration,setNarration]=useState('');
 useEffect(()=>{
  let live=true;
  request('studioBriefing',{action:'read'},'POST').then(result=>{if(live)setBriefing(result);})
   .catch(e=>{if(live)setError(e.message);}).finally(()=>{if(live)setBusy(false);});
  return()=>{live=false;};
 },[request]);
 const change=async action=>{
  if(busy)return;
  setBusy(true);setError('');
  try{
   setBriefing(await request('studioBriefing',{action,narration},'POST'));
   if(action==='start')onTimerChange();
   if(action==='save')setNarration('');
  }catch(e){setError(/unknown action.*studioBriefing/i.test(e.message)?'Redeploy the included Code.gs to enable Discussions.':e.message);}
  finally{setBusy(false);}
 };
 return <>
  <button type="button" style={buttonStyle} disabled={busy||!!briefing?.end} onClick={()=>change(briefing?'stop':'start')}>{briefing&&!briefing.end?'End discussion':'Discussion'}</button>
  {error&&!briefing?.end&&<span role="alert">{error}</span>}
  {briefing?.end&&<div className="task-discussion-overlay"><section className="task-discussion-dialog" role="dialog" aria-modal="true" aria-label="Log discussion narration">
   <h2>Discussion</h2>
   <form onSubmit={e=>{e.preventDefault();change('save');}}>
    <textarea autoFocus required maxLength={2000} aria-label="Narration" placeholder="What did you discuss?" value={narration} onChange={e=>setNarration(e.target.value)}/>
    {error&&<p role="alert">{error}</p>}
    <button type="submit" style={buttonStyle} disabled={busy||!narration.trim()}>Save narration</button>
   </form>
  </section></div>}
 </>;
}
