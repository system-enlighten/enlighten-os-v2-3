import React,{useEffect,useState} from 'react';

export default function BriefingTimer({request,buttonStyle,onTimerChange}){
 const [briefing,setBriefing]=useState(null),[busy,setBusy]=useState(true),[error,setError]=useState(''),[narration,setNarration]=useState(''),[participantIds,setParticipantIds]=useState([]);
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
   setBriefing(await request('studioBriefing',{action,id:briefing?.id,narration,participantIds},'POST'));
   if(action==='start')onTimerChange();
   if(action==='save'){setNarration('');setParticipantIds([]);}
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
    {Array.isArray(briefing.participants)&&<fieldset style={{justifySelf:'stretch',minWidth:0}}>
     <legend>Participants</legend>
     <p>You’re included automatically.</p>
     <div style={{maxHeight:'10rem',overflowY:'auto'}}>
      {briefing.participants.map(person=><label key={person.id} style={{display:'block'}}>
       <input type="checkbox" disabled={busy} checked={participantIds.includes(person.id)}
        onChange={e=>{const checked=e.target.checked;setParticipantIds(ids=>checked?[...ids,person.id]:ids.filter(id=>id!==person.id));}}/> {person.name}
      </label>)}
     </div>
    </fieldset>}
    {error&&<p role="alert">{error}</p>}
    <button type="submit" style={buttonStyle} disabled={busy||!narration.trim()}>Save narration</button>
   </form>
  </section></div>}
 </>;
}
