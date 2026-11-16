import {detectWallZones} from './wall-zone-detector.mjs';
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
 const seq=useRef(0),ids=useRef(0),sourceCanvas=useRef(null),textSource=useRef(null);
 const [zoom,setZoom]=useState(1);
 const [bounds,setBounds]=useState(null),[crop,setCrop]=useState(null),[retrace,setRetrace]=useState(null);
 useEffect(()=>()=>{seq.current++;},[]);
 const change=async file=>{
  if(!file)return;
  const n=++seq.current;
  sourceCanvas.current=null;setZoom(1);setBounds(null);setCrop(null);setRetrace(null);setPreview(null);setRegions([]);setSelected(null);setTrace(null);setAdded(false);setBusy(false);setMessage('');
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
   sourceCanvas.current=canvas;
   const image=canvas.toDataURL('image/jpeg',.88);
   const content=await page.getTextContent().catch(()=>({items:[]}));
   if(n!==seq.current)return;
   textSource.current={page:{getTextContent:async()=>content},viewport};
   setPreview({image,width:canvas.width,height:canvas.height});
   setMessage('Click inside a room to add its outline.');
  }catch(e){if(n===seq.current)setMessage(e.message||'Could not read the plan.');}
  finally{if(doc)await doc.destroy().catch(()=>{});if(n===seq.current)setBusy(false);}
 };
 const fillAt=async point=>{
  const canvas=sourceCanvas.current, source=textSource.current,n=seq.current;
  if(!canvas||!source)return;
  if(bounds&&(point.x<bounds[0]||point.y<bounds[1]||point.x>=bounds[2]||point.y>=bounds[3])){
   setMessage('Click inside the selected plan area, or clear the selection.');return;
  }
  setBusy(true);
  try{
   const [room]=await detectWallZones(canvas,source.page,source.viewport,bounds||undefined,point);
   if(n!==seq.current)return;
   if(!room){setMessage('No enclosed boundary at that point. Click clear floor space or use Trace area.');return;}
   const id=++ids.current;
   setRegions(list=>[...list,{...room,id}]);setSelected(id);
   setMessage(room.name?'Check the outline and detected name.':'Outline added. Enter the area name below.');
  }catch(e){if(n===seq.current)setMessage(e.message);}
  finally{if(n===seq.current)setBusy(false);}
 };
 const patch=(id,key,value)=>setRegions(list=>list.map(r=>r.id===id?{...r,[key]:value}:r));
 const addTrace=()=>{const [region]=cleanRegions([{points:trace}]);if(!region)return;const id=retrace??++ids.current;setRegions(list=>retrace===null?[...list,{...region,id}]:list.map(r=>r.id===id?{...r,points:region.points,suggested:false}:r));setSelected(id);setTrace(null);setRetrace(null);};
 const valid=regions.length>0&&regions.every(r=>/^[A-Z]+$/.test(r.code.trim())&&r.name.trim())&&new Set(regions.map(r=>r.code.trim())).size===regions.length;
 return <section aria-label="Colour-coded zone review" style={{padding:10,border:'1px solid #d9d2c3',margin:'10px 0'}}>
  <p>Choose a single-floor PDF, then click inside each room you want to add. The tracer follows enclosed red and blue wall lines. Unnamed rooms stay blank.</p>
  <input type="file" accept=".pdf,application/pdf" disabled={disabled} aria-label="Choose PDF for coloured zones" onChange={e=>{change(e.target.files?.[0]);e.target.value='';}}/>
  {message&&<p role="status">{message}</p>}
  {preview&&<><div style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap',margin:'8px 0'}}>
   <button type="button" disabled={zoom<=1} onClick={()=>setZoom(z=>Math.max(1,z-.25))}>Zoom out</button>
   <span aria-live="polite">{Math.round(zoom*100)}%</span>
   <button type="button" disabled={zoom>=3} onClick={()=>setZoom(z=>Math.min(3,z+.25))}>Zoom in</button>
   <button type="button" onClick={()=>setZoom(1)}>Fit width</button>
  </div><div style={{overflow:'auto',maxHeight:'60vh',border:'1px solid #d9d2c3'}}><svg viewBox="0 0 1000 1000" preserveAspectRatio="none" style={{display:'block',width:(zoom*100)+'%',maxWidth:'none',height:'auto',aspectRatio:preview.width+'/'+preview.height,cursor:busy||disabled||added?'default':'crosshair'}} aria-label="Floor plan with coloured area outlines" onClick={e=>{if(busy||disabled||added)return;const svg=e.currentTarget,transform=svg.getScreenCTM();if(!transform)return;const screen=svg.createSVGPoint();screen.x=e.clientX;screen.y=e.clientY;const plan=screen.matrixTransform(transform.inverse());const point={x:Math.max(0,Math.min(1000,plan.x)),y:Math.max(0,Math.min(1000,plan.y))};if(trace)setTrace([...trace,point]);else if(crop){if(!crop.length)setCrop([point]);else{const a=crop[0];if(Math.abs(a.x-point.x)<20||Math.abs(a.y-point.y)<20){setMessage('Choose a corner farther away.');return;}setBounds([Math.min(a.x,point.x),Math.min(a.y,point.y),Math.max(a.x,point.x),Math.max(a.y,point.y)]);setCrop(null);setMessage('Plan area selected. Click inside a room to trace it.');}}else fillAt(point);}}>
   <image href={preview.image} width="1000" height="1000" preserveAspectRatio="none"/>
   {regions.map((r,i)=><polygon key={r.id} points={r.points.map(p=>p.x+','+p.y).join(' ')} fill={tone(r.id)} fillOpacity={selected===r.id ? .46 : .23} stroke={tone(r.id)} strokeWidth={selected===r.id?4:2} vectorEffect="non-scaling-stroke" onClick={e=>{if(!trace&&!crop){e.stopPropagation();setSelected(r.id);}}}><title>{r.name||'Unnamed area'}</title></polygon>)}
   {regions.map((r,i)=>{const x=r.points.reduce((n,p)=>n+p.x,0)/r.points.length,y=r.points.reduce((n,p)=>n+p.y,0)/r.points.length;return <g key={'label'+r.id} pointerEvents="none"><circle cx={x} cy={y} r="12" fill={tone(r.id)}/><text x={x} y={y} textAnchor="middle" dominantBaseline="central" fontSize="14" fill="white">{i+1}</text></g>;})}
   {bounds&&<rect x={bounds[0]} y={bounds[1]} width={bounds[2]-bounds[0]} height={bounds[3]-bounds[1]} fill="none" pointerEvents="none" stroke="#142c49" strokeWidth="3" strokeDasharray="6 4"/>}
   {crop?.length===1&&<circle cx={crop[0].x} cy={crop[0].y} r="5" fill="#142c49" pointerEvents="none"/>}
   {trace&&<polyline points={trace.map(p=>p.x+','+p.y).join(' ')} fill="none" stroke="#142c49" strokeWidth="3"/>}
  </svg></div>
  <div style={{display:'flex',gap:8,margin:'8px 0'}}>{trace?<><button type="button" disabled={trace.length<3} onClick={addTrace}>Finish outline</button><button type="button" onClick={()=>setTrace(trace.slice(0,-1))} disabled={!trace.length}>Undo point</button><button type="button" onClick={()=>{setTrace(null);setRetrace(null);}}>Cancel trace</button></>:<button type="button" disabled={busy||disabled||added||!!crop} onClick={()=>{setRetrace(null);setTrace([]);}}>Trace area</button>}</div>
  {!trace&&<div style={{display:'flex',gap:8,margin:'8px 0'}}><button type="button" disabled={busy||disabled||added} onClick={()=>setCrop(crop?null:[])}>{crop?'Cancel selection':'Select plan area'}</button>{bounds&&<button type="button" onClick={()=>{setBounds(null);setCrop(null);}}>Clear plan selection</button>}</div>}
  {crop&&<p>Click two opposite corners around the rooms. Leave the title block outside.</p>}
  {trace&&<p>Click each corner in order, then finish the outline.</p>}
  {!!regions.length&&<table style={{width:'100%',textAlign:'left'}}><thead><tr><th>Area</th><th>Zone code</th><th>Area name</th><th/></tr></thead><tbody>{regions.map((r,i)=><tr key={r.id} style={{background:selected===r.id?'#f2eee4':'transparent'}}><td><button type="button" style={{border:'1px solid '+tone(r.id),background:'color-mix(in srgb, '+tone(r.id)+' 18%, white)',padding:'5px 8px'}} onClick={()=>setSelected(r.id)}>Area {i+1}</button></td><td><input aria-label={'Zone code for area '+(i+1)} value={r.code} placeholder="Code" disabled={busy||disabled||added} onChange={e=>patch(r.id,'code',e.target.value.toUpperCase())} style={{width:'100%'}}/></td><td><input aria-label={'Name for area '+(i+1)} value={r.name} placeholder="Unnamed area" disabled={busy||disabled||added} onChange={e=>patch(r.id,'name',e.target.value)} style={{width:'100%'}}/></td><td><button type="button" disabled={busy||disabled||added||!!crop||!!trace} onClick={()=>{setSelected(r.id);setRetrace(r.id);setTrace([]);}}>Retrace</button> <button type="button" disabled={busy||disabled||added||!!trace||!!crop} onClick={()=>setRegions(list=>list.filter(x=>x.id!==r.id))}>Remove</button></td></tr>)}</tbody></table>}
  {!!regions.length&&<><p>Give each area a unique letter code and a name. Remove an incorrect outline and trace it again.</p><button type="button" disabled={!valid||busy||disabled||added||!!trace||!!crop} onClick={()=>{onLabels(regions.map(({code,name})=>({code,name})));setAdded(true);}}> {added?'Added to draft':'Add reviewed areas to draft'}</button></>}
  </>}
 </section>;
}
