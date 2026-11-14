import React,{useEffect,useRef,useState} from 'react';
import AssistantWork from './AssistantWork.jsx';

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
export default function ExecutiveAssistant({workUser,workProjects,workRequest,userId,project,task,onApply,sections=[],onNavigate,theme:T,buttonStyle,inputStyle}){
 const [open,setOpen]=useState(false),[kind,setKind]=useState('mom'),[words,setWords]=useState(''),[draft,setDraft]=useState(null),[listening,setListening]=useState(false),[message,setMessage]=useState('');
 useEffect(()=>{if(!open||!workRequest||document.getElementById('enlighten-google-login'))return;const script=document.createElement('script');script.id='enlighten-google-login';script.src='https://accounts.google.com/gsi/client';script.async=true;document.head.appendChild(script);},[open,workRequest]);
 const nameKey=userId?'enlighten-assistant-name:'+userId:'';
 const readName=()=>{try{return nameKey?localStorage.getItem(nameKey)||'':'';}catch{return '';}};
 const [name,setName]=useState(readName),[nameDraft,setNameDraft]=useState(readName);
 useEffect(()=>{const sync=()=>{const next=readName();setName(next);setNameDraft(next);};sync();window.addEventListener('enlighten-assistant-name',sync);return()=>window.removeEventListener('enlighten-assistant-name',sync);},[nameKey]);
 const saveName=()=>{try{const next=nameDraft.trim();if(next)localStorage.setItem(nameKey,next);else localStorage.removeItem(nameKey);window.dispatchEvent(new Event('enlighten-assistant-name'));setMessage(next?'Assistant name saved.':'Assistant name reset.');}catch{setMessage('Could not save the name in this browser.');}};
 const recentKey=userId?'enlighten-assistant-recents:'+userId:'';
 const [recents,setRecents]=useState([]),[interim,setInterim]=useState(''),[recentId,setRecentId]=useState(null);
 const readRecents=()=>{try{const values=JSON.parse(localStorage.getItem(recentKey)||'[]');return Array.isArray(values)?values:[];}catch{return [];}};
 useEffect(()=>{setRecents(recentKey?readRecents():[]);setRecentId(null);},[recentKey,open]);
 const saveRecent=()=>{
  if(!recentKey||!draft)return;
  const id=recentId||crypto.randomUUID();
  const item={id,kind,words:words.slice(0,12000),draft:{...draft,body:draft.body.slice(0,12000)},project,task,at:new Date().toISOString()};
  const next=[item,...readRecents().filter(r=>r.id!==id)].slice(0,20);
  try{localStorage.setItem(recentKey,JSON.stringify(next));setRecents(next);setRecentId(id);setMessage('Saved to Recents.');}catch{setMessage('Could not save to Recents.');}
 };
 const removeRecent=id=>{const next=readRecents().filter(r=>r.id!==id);try{localStorage.setItem(recentKey,JSON.stringify(next));setRecents(next);if(recentId===id)setRecentId(null);}catch{setMessage('Could not remove this recent draft.');}};
 const ref=useRef(null),dialog=useRef(null);
 useEffect(()=>()=>{const r=ref.current;if(r){r.onend=null;r.onerror=null;r.onresult=null;r.abort();}window.speechSynthesis?.cancel();},[]);
 const Recognition=window.SpeechRecognition||window.webkitSpeechRecognition;
 const start=()=>{
  if(listening){ref.current?.stop();return;}
  if(!Recognition)return;
  setMessage('');
  const r=new Recognition();ref.current=r;r.lang='en-IN';r.interimResults=true;
  r.onresult=e=>{const results=Array.from(e.results).slice(e.resultIndex);const phrase=results.filter(x=>x.isFinal).map(x=>x[0].transcript).join(' ');setInterim(Array.from(e.results).filter(x=>!x.isFinal).map(x=>x[0].transcript).join(' '));if(phrase)setWords(value=>[value,phrase].filter(Boolean).join(' '));};
  r.onerror=()=>{setMessage('Voice input wasn’t available. Try again or type your notes.');setListening(false);};
  r.onend=()=>{setListening(false);setInterim('');};
  try{r.start();setListening(true);}catch{setMessage('Could not start voice input. You can type instead.');}
 };
 const close=()=>{ref.current?.abort();window.speechSynthesis?.cancel();setOpen(false);};
 return <><button type="button" style={buttonStyle} onClick={()=>{setOpen(true);setMessage('');}}>{name?"Talk to "+name:"Talk to assistant"}</button>{open&&<div style={{position:'fixed',inset:0,zIndex:16000,background:'#08192d77',display:'grid',placeItems:'center',padding:16}}><section ref={dialog} role="dialog" aria-modal="true" aria-label="Executive assistant" onKeyDown={e=>{if(e.key==='Escape')close();}} style={{width:'min(620px,100%)',maxHeight:'90vh',overflow:'auto',background:T.paper,padding:18,boxSizing:'border-box'}}>
 <h2>{name||'Executive assistant'}</h2>{nameKey&&!name&&<div style={{marginBottom:12}}><label>Assistant name <input style={inputStyle} maxLength={32} placeholder="e.g. Susie" value={nameDraft} onChange={e=>setNameDraft(e.target.value)}/></label><button type="button" style={buttonStyle} disabled={!nameDraft.trim()} onClick={saveName}>Save name</button></div>}{(project||task)&&<p>{[project,task].filter(Boolean).join(' · ')}</p>}<p>Dictate or type your notes, then review the draft. Voice input uses your browser’s speech service.</p>
 <label>Draft type <select autoFocus style={inputStyle} value={kind} onChange={e=>{setKind(e.target.value);setDraft(null);}}>{Object.entries(modes).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select></label>
 {Recognition?<button type="button" aria-pressed={listening} aria-label={listening?'Stop voice input':'Start voice input'} title={listening?'Stop listening':'Start voice input'} style={{width:46,height:46,margin:'10px 0',border:0,borderRadius:'50%',background:listening?T.redline:T.navy,color:'#fff',display:'inline-grid',placeItems:'center',cursor:'pointer'}} onClick={start}>{listening?<span aria-hidden="true">■</span>:<svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 11v2m4-5v8m5-12v16m5-12v8m4-5v2"/></svg>}</button>:<p>Voice input is unavailable in this browser. Type below.</p>}
 <label style={{display:'block'}}>Transcript<textarea style={{...inputStyle,minHeight:90}} value={words} onChange={e=>setWords(e.target.value)}/></label>{listening&&<p role="status">{interim||"Listening…"}</p>}
 {workRequest&&workUser?.userId&&/^(admin|user)$/i.test(workUser.appAccess)&&<AssistantWork words={words} request={workRequest} projects={workProjects} user={workUser} buttonStyle={buttonStyle} inputStyle={inputStyle}/>}
 <button type="button" style={buttonStyle} disabled={!words.trim()||listening} onClick={()=>setDraft(assistantDraft(kind,words,{project,task}))}>Prepare draft</button>
 {draft&&<><label style={{display:'block'}}>Editable draft<textarea style={{...inputStyle,minHeight:110}} value={draft.body} onChange={e=>setDraft({...draft,body:e.target.value})}/></label>
 {kind==='time'&&<label>Hours <input type="number" min=".01" step=".01" style={inputStyle} value={draft.hours} onChange={e=>setDraft({...draft,hours:e.target.value})}/></label>}
 <div style={{display:'flex',gap:8,flexWrap:'wrap'}}><button type="button" style={buttonStyle} disabled={!draft.body.trim()} onClick={async()=>{try{await navigator.clipboard.writeText(draft.body);setMessage('Draft copied.');}catch{setMessage('Select the draft text to copy it.');}}}>Copy draft</button>
 {window.speechSynthesis&&<button type="button" style={buttonStyle} onClick={()=>{window.speechSynthesis.cancel();window.speechSynthesis.speak(new SpeechSynthesisUtterance(draft.body));}}>Read draft aloud</button>}
 {onApply&&['time','mom'].includes(kind)&&<button type="button" style={buttonStyle} disabled={kind==='time'&&!(Number(draft.hours)>0)} onClick={()=>{onApply(draft,kind);close();}}>Use in task form</button>}</div></>}
 {draft&&recentKey&&<button type="button" style={buttonStyle} onClick={saveRecent}>Save to Recents</button>}
 {recentKey&&<details><summary>Recents ({recents.length})</summary>{recents.length?recents.map(r=><div key={r.id} style={{display:'flex',gap:8,margin:'6px 0'}}><button type="button" style={buttonStyle} disabled={listening} onClick={()=>{setKind(r.kind);setWords(r.words);setDraft(r.draft);setRecentId(r.id);setMessage('Opened saved draft'+(r.task?' from '+r.task:'')+'.');}}>{modes[r.kind]} · {r.task||r.project||String(r.words).slice(0,32)}</button><button type="button" style={buttonStyle} onClick={()=>removeRecent(r.id)}>Remove</button></div>):<p>Save a draft to find it here later.</p>}</details>}
 {onNavigate&&sections.length>0&&<details><summary>Open workspace</summary><div style={{display:'flex',gap:8,flexWrap:'wrap',padding:'8px 0'}}>{sections.map(section=><button type="button" key={section.id} style={buttonStyle} onClick={()=>{close();onNavigate(section.id);}}>{section.label}</button>)}</div></details>}
 {message&&<p role="status">{message}</p>}<button type="button" style={buttonStyle} onClick={close}>Close</button>
 </section></div>}</>;
}
