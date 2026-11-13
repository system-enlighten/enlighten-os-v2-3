import React,{useEffect,useRef,useState} from 'react';

const modes={'mom':'Meeting minutes','time':'Time entry','meeting':'Meeting agenda','visit':'Site visit brief','email':'Email follow-up','whatsapp':'WhatsApp follow-up'};
export function assistantDraft(kind,words,context){
 const text=words.trim(),heading=[context.project,context.task].filter(Boolean).join(' · ');
 const hours=text.match(/\b(\d+(?:\.\d+)?)\s*(?:hours?|hrs?)\b/i);
 const mins=text.match(/\b(\d+(?:\.\d+)?)\s*(?:minutes?|mins?)\b/i);
 const time=(Number(hours?.[1]||0)+Number(mins?.[1]||0)/60).toFixed(2);
 if(kind==='time')return {body:text,hours:Number(time)>0?time:''};
 if(kind==='email'||kind==='whatsapp')return {body:['Hello,',heading,text,'Thank you.'].filter(Boolean).join('\n\n')};
 return {body:[modes[kind],heading,text].filter(Boolean).join('\n\n')};
}
export default function ExecutiveAssistant({project,task,onApply,theme:T,buttonStyle,inputStyle}){
 const [open,setOpen]=useState(false),[kind,setKind]=useState('mom'),[words,setWords]=useState(''),[draft,setDraft]=useState(null),[listening,setListening]=useState(false),[message,setMessage]=useState('');
 const ref=useRef(null),dialog=useRef(null);
 useEffect(()=>()=>{const r=ref.current;if(r){r.onend=null;r.onerror=null;r.onresult=null;r.abort();}window.speechSynthesis?.cancel();},[]);
 const Recognition=window.SpeechRecognition||window.webkitSpeechRecognition;
 const start=()=>{
  if(listening){ref.current?.stop();return;}
  if(!Recognition)return;
  setMessage('');
  const r=new Recognition();ref.current=r;r.lang='en-IN';r.interimResults=false;
  r.onresult=e=>{const phrase=Array.from(e.results).map(x=>x[0].transcript).join(' ');setWords(value=>[value,phrase].filter(Boolean).join(' '));};
  r.onerror=()=>{setMessage('Voice input wasn’t available. Try again or type your notes.');setListening(false);};
  r.onend=()=>setListening(false);
  try{r.start();setListening(true);}catch{setMessage('Could not start voice input. You can type instead.');}
 };
 const close=()=>{ref.current?.abort();window.speechSynthesis?.cancel();setOpen(false);};
 return <><button type="button" style={buttonStyle} onClick={()=>{setOpen(true);setMessage('');}}>Talk to assistant</button>{open&&<div style={{position:'fixed',inset:0,zIndex:16000,background:'#08192d77',display:'grid',placeItems:'center',padding:16}}><section ref={dialog} role="dialog" aria-modal="true" aria-label="Executive assistant" onKeyDown={e=>{if(e.key==='Escape')close();}} style={{width:'min(620px,100%)',maxHeight:'90vh',overflow:'auto',background:T.paper,padding:18,boxSizing:'border-box'}}>
 <h2>Executive assistant</h2>{(project||task)&&<p>{[project,task].filter(Boolean).join(' · ')}</p>}<p>Dictate or type your notes, then review the draft. Voice input uses your browser’s speech service.</p>
 <label>Draft type <select autoFocus style={inputStyle} value={kind} onChange={e=>{setKind(e.target.value);setDraft(null);}}>{Object.entries(modes).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select></label>
 {Recognition?<button type="button" style={buttonStyle} onClick={start}>{listening?'Stop listening':'Start voice input'}</button>:<p>Voice input is unavailable in this browser. Type below.</p>}
 <label style={{display:'block'}}>Notes or instructions<textarea style={{...inputStyle,minHeight:90}} value={words} onChange={e=>setWords(e.target.value)}/></label>
 <button type="button" style={buttonStyle} disabled={!words.trim()||listening} onClick={()=>setDraft(assistantDraft(kind,words,{project,task}))}>Prepare draft</button>
 {draft&&<><label style={{display:'block'}}>Editable draft<textarea style={{...inputStyle,minHeight:110}} value={draft.body} onChange={e=>setDraft({...draft,body:e.target.value})}/></label>
 {kind==='time'&&<label>Hours <input type="number" min=".01" step=".01" style={inputStyle} value={draft.hours} onChange={e=>setDraft({...draft,hours:e.target.value})}/></label>}
 <div style={{display:'flex',gap:8,flexWrap:'wrap'}}><button type="button" style={buttonStyle} disabled={!draft.body.trim()} onClick={async()=>{try{await navigator.clipboard.writeText(draft.body);setMessage('Draft copied.');}catch{setMessage('Select the draft text to copy it.');}}}>Copy draft</button>
 {window.speechSynthesis&&<button type="button" style={buttonStyle} onClick={()=>{window.speechSynthesis.cancel();window.speechSynthesis.speak(new SpeechSynthesisUtterance(draft.body));}}>Read draft aloud</button>}
 {onApply&&['time','mom'].includes(kind)&&<button type="button" style={buttonStyle} disabled={kind==='time'&&!(Number(draft.hours)>0)} onClick={()=>{onApply(draft,kind);close();}}>Use in task form</button>}</div></>}
 {message&&<p role="status">{message}</p>}<button type="button" style={buttonStyle} onClick={close}>Close</button>
 </section></div>}</>;
}
