import React,{useEffect,useRef,useState} from 'react';
const tone=id=>'hsl('+Math.round(id*137.508%360)+' 46% 43%)';
export function cleanRegions(regions){
 return (Array.isArray(regions)?regions:[]).slice(0,120).flatMap(region=>{
  const points=(Array.isArray(region?.points)?region.points:[]).slice(0,60);
  if(points.length<3||points.some(p=>!p||!Number.isFinite(p.x)||!Number.isFinite(p.y)||p.x<0||p.x>1000||p.y<0||p.y>1000))return [];
  const area=points.reduce((n,p,i)=>{const q=points[(i+1)%points.length];return n+p.x*q.y-q.x*p.y;},0);
  if(Math.abs(area)<1)return [];
  return [{code:String(region.code||'').slice(0,30),name:String(region.name||'').slice(0,180),points}];
 });
}
export default function ZoneColourReview({projectId,request,onLabels,onFile,disabled}){
 const [preview,setPreview]=useState(null),[regions,setRegions]=useState([]),[selected,setSelected]=useState(null),[trace,setTrace]=useState(null),[message,setMessage]=useState(''),[busy,setBusy]=useState(false),[added,setAdded]=useState(false);
 const seq=useRef(0),ids=useRef(0);
 useEffect(()=>()=>{seq.current++;},[]);
 const change=async file=>{
  if(!file)return;
  const n=++seq.current;
  setPreview(null);setRegions([]);setSelected(null);setTrace(null);setAdded(false);setBusy(false);setMessage('');
  if(!/\.pdf$/i.test(file.name)||!file.size||file.size>20*1024*1024){onFile(null);setMessage('Choose a PDF up to 20 MB.');return;}
  onFile(file);setBusy(true);setMessage('Rendering floor plan…');
  let doc;
  try{
   const path='/pdfjs/pdf.min.mjs';
   const pdf=await import(/* @vite-ignore */ path);
   pdf.GlobalWorkerOptions.workerSrc='/pdfjs/pdf.worker.min.mjs';
   doc=await pdf.getDocument({data:await file.arrayBuffer(),isEvalSupported:false,useWasm:false}).promise;
   if(doc.numPages!==1)throw Error('Export one floor per PDF for coloured outlines.');
   const page=await doc.getPage(1),original=page.getViewport({scale:1}),viewport=page.getViewport({scale:Math.min(1800/Math.max(original.width,original.height),3)});
   const canvas=document.createElement('canvas');canvas.width=Math.ceil(viewport.width);canvas.height=Math.ceil(viewport.height);
   await page.render({canvas,canvasContext:canvas.getContext('2d'),viewport,background:'#fff'}).promise;
   if(n!==seq.current)return;
   const image=canvas.toDataURL('image/jpeg',.88);
   setPreview({image,width:canvas.width,height:canvas.height});setMessage('Finding room outlines…');
   const result=await request('recognizeZoneRegions',{projectId,image},'POST',125000);
   if(n!==seq.current)return;
   const found=cleanRegions(result.regions).map(r=>({...r,id:++ids.current}));
   setRegions(found);setMessage(found.length?'Check the suggested outlines. Name blank areas or trace any that were missed.':'No reliable outlines found. Use Trace area to add them.');
  }catch(e){if(n===seq.current)setMessage(e.message||'Could not read the plan.');}
  finally{if(doc)await doc.destroy().catch(()=>{});if(n===seq.current)setBusy(false);}
 };
 const patch=(id,key,value)=>setRegions(list=>list.map(r=>r.id===id?{...r,[key]:value}:r));
 const addTrace=()=>{const [region]=cleanRegions([{points:trace}]);if(!region)return;const id=++ids.current;setRegions(list=>[...list,{...region,id}]);setSelected(id);setTrace(null);};
 const valid=regions.length>0&&regions.every(r=>/^[A-Z]+$/.test(r.code.trim())&&r.name.trim())&&new Set(regions.map(r=>r.code.trim())).size===regions.length;
 return <section aria-label="Colour-coded zone review" style={{padding:10,border:'1px solid #d9d2c3',margin:'10px 0'}}>
  <p>Choose a single-floor PDF. AI suggests outlines from the rendered plan; review them before adding the rows. Unnamed rooms stay blank.</p>
  <input type="file" accept=".pdf,application/pdf" disabled={disabled} aria-label="Choose PDF for coloured zones" onChange={e=>{change(e.target.files?.[0]);e.target.value='';}}/>
  {message&&<p role="status">{message}</p>}
  {preview&&<><svg viewBox="0 0 1000 1000" preserveAspectRatio="none" style={{display:'block',width:'100%',aspectRatio:preview.width+'/'+preview.height,cursor:trace?'crosshair':'default'}} aria-label="Floor plan with coloured area outlines" onClick={e=>{if(!trace)return;const b=e.currentTarget.getBoundingClientRect();setTrace([...trace,{x:(e.clientX-b.left)*1000/b.width,y:(e.clientY-b.top)*1000/b.height}]);}}>
   <image href={preview.image} width="1000" height="1000" preserveAspectRatio="none"/>
   {regions.map((r,i)=><polygon key={r.id} points={r.points.map(p=>p.x+','+p.y).join(' ')} fill={tone(r.id)} fillOpacity={selected===r.id ? .46 : .23} stroke={tone(r.id)} strokeWidth={selected===r.id?4:2} vectorEffect="non-scaling-stroke" onClick={()=>{if(!trace)setSelected(r.id);}}><title>{r.name||'Unnamed area'}</title></polygon>)}
   {trace&&<polyline points={trace.map(p=>p.x+','+p.y).join(' ')} fill="none" stroke="#142c49" strokeWidth="3"/>}
  </svg>
  <div style={{display:'flex',gap:8,margin:'8px 0'}}>{trace?<><button type="button" disabled={trace.length<3} onClick={addTrace}>Finish outline</button><button type="button" onClick={()=>setTrace(trace.slice(0,-1))} disabled={!trace.length}>Undo point</button><button type="button" onClick={()=>setTrace(null)}>Cancel trace</button></>:<button type="button" disabled={busy||disabled||added} onClick={()=>setTrace([])}>Trace area</button>}</div>
  {trace&&<p>Click each corner in order, then finish the outline.</p>}
  {!!regions.length&&<table style={{width:'100%',textAlign:'left'}}><thead><tr><th>Area</th><th>Zone code</th><th>Area name</th><th/></tr></thead><tbody>{regions.map((r,i)=><tr key={r.id} style={{background:selected===r.id?'#f2eee4':'transparent'}}><td><button type="button" style={{border:'1px solid '+tone(r.id),background:'color-mix(in srgb, '+tone(r.id)+' 18%, white)',padding:'5px 8px'}} onClick={()=>setSelected(r.id)}>Area {i+1}</button></td><td><input aria-label={'Zone code for area '+(i+1)} value={r.code} placeholder="Code" disabled={disabled||added} onChange={e=>patch(r.id,'code',e.target.value.toUpperCase())} style={{width:'100%'}}/></td><td><input aria-label={'Name for area '+(i+1)} value={r.name} placeholder="Unnamed area" disabled={disabled||added} onChange={e=>patch(r.id,'name',e.target.value)} style={{width:'100%'}}/></td><td><button type="button" disabled={disabled||added} onClick={()=>setRegions(list=>list.filter(x=>x.id!==r.id))}>Remove</button></td></tr>)}</tbody></table>}
  {!!regions.length&&<><p>Give each area a unique letter code and a name. Remove an incorrect outline and trace it again.</p><button type="button" disabled={!valid||busy||disabled||added||!!trace} onClick={()=>{onLabels(regions.map(({code,name})=>({code,name})));setAdded(true);}}> {added?'Added to draft':'Add reviewed areas to draft'}</button></>}
  </>}
 </section>;
}
