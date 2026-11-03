import {fillZoneBoundary} from './zone-boundary-fill.js';
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
 const seq=useRef(0),ids=useRef(0),sourceCanvas=useRef(null);
 const [zoom,setZoom]=useState(1);
 const [fill,setFill]=useState(false),[crop,setCrop]=useState(null),[retrace,setRetrace]=useState(null);
 useEffect(()=>()=>{seq.current++;},[]);
 const change=async file=>{
  if(!file)return;
  const n=++seq.current;
  sourceCanvas.current=null;setZoom(1);setFill(false);setCrop(null);setRetrace(null);setPreview(null);setRegions([]);setSelected(null);setTrace(null);setAdded(false);setBusy(false);setMessage('');
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
   setPreview({image,width:canvas.width,height:canvas.height});setMessage('Finding room outlines…');
   const result=await request('recognizeZoneRegions',{projectId,image},'POST',125000);
   if(n!==seq.current)return;
   const found=cleanRegions(result.regions).map(r=>({...r,id:++ids.current,suggested:true}));
   setRegions(found);setMessage(found.length?'Check the suggested outlines. Name blank areas or trace any that were missed.':'No reliable outlines found. Use Trace area to add them.');
  }catch(e){if(n===seq.current)setMessage(e.message||'Could not read the plan.');}
  finally{if(doc)await doc.destroy().catch(()=>{});if(n===seq.current)setBusy(false);}
 };
 const fillAt=point=>{
  const canvas=sourceCanvas.current;if(!canvas)return;
  const w=canvas.width,h=canvas.height;
  const points=fillZoneBoundary(canvas.getContext('2d').getImageData(0,0,w,h).data,w,h,Math.min(w-1,Math.floor(point.x*w/1000)),Math.min(h-1,Math.floor(point.y*h/1000)));
  if(!points||points.length<3){setMessage('No enclosed area found at that point. Click a clear space inside the room, or use Trace area.');return;}
  const id=++ids.current;setRegions(list=>[...list,{id,points,code:'',name:''}]);setSelected(id);setFill(false);setMessage('Check the filled boundary, then enter its zone code and room name.');
 };
 const detectCrop=async()=>{
  if(!sourceCanvas.current||crop?.length!==2||busy)return;
  const [a,b]=crop,left=Math.min(a.x,b.x),top=Math.min(a.y,b.y),width=Math.abs(a.x-b.x),height=Math.abs(a.y-b.y);
  if(width<20||height<20){setMessage('Select a larger rectangle around the rooms.');return;}
  if(regions.length&&!window.confirm('Replace the current outlines and their draft labels with new suggestions from this crop?'))return;
  const original=sourceCanvas.current,n=++seq.current,canvas=document.createElement('canvas');
  const sx=left*original.width/1000,sy=top*original.height/1000,sw=width*original.width/1000,sh=height*original.height/1000;
  canvas.width=Math.max(1,Math.round(sw));canvas.height=Math.max(1,Math.round(sh));
  canvas.getContext('2d').drawImage(original,sx,sy,sw,sh,0,0,canvas.width,canvas.height);
  setBusy(true);setMessage('Finding outlines inside the selected plan area…');
  try{
   const result=await request('recognizeZoneRegions',{projectId,image:canvas.toDataURL('image/jpeg',.88)},'POST',125000);
   if(n!==seq.current)return;
   const found=cleanRegions(result.regions).map(r=>({...r,id:++ids.current,suggested:true,points:r.points.map(p=>({x:left+p.x*width/1000,y:top+p.y*height/1000}))}));
   if(found.length){setRegions(found);setSelected(null);setCrop(null);setMessage('Check the numbered outlines against the rooms. Retrace any incorrect outline.');}
   else setMessage('No clear outlines found inside that selection. Existing outlines were kept.');
  }catch(e){if(n===seq.current)setMessage(e.message||'Could not read the selected area.');}
  finally{if(n===seq.current)setBusy(false);}
 };
 const patch=(id,key,value)=>setRegions(list=>list.map(r=>r.id===id?{...r,[key]:value}:r));
 const addTrace=()=>{const [region]=cleanRegions([{points:trace}]);if(!region)return;const id=retrace??++ids.current;setRegions(list=>retrace===null?[...list,{...region,id}]:list.map(r=>r.id===id?{...r,points:region.points,suggested:false}:r));setSelected(id);setTrace(null);setRetrace(null);};
 const valid=regions.length>0&&regions.every(r=>/^[A-Z]+$/.test(r.code.trim())&&r.name.trim())&&new Set(regions.map(r=>r.code.trim())).size===regions.length;
 return <section aria-label="Colour-coded zone review" style={{padding:10,border:'1px solid #d9d2c3',margin:'10px 0'}}>
  <p>Choose a single-floor PDF. AI suggests outlines from the rendered plan; review them before adding the rows. Unnamed rooms stay blank.</p>
  <input type="file" accept=".pdf,application/pdf" disabled={disabled} aria-label="Choose PDF for coloured zones" onChange={e=>{change(e.target.files?.[0]);e.target.value='';}}/>
  {message&&<p role="status">{message}</p>}
  {preview&&<><div style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap',margin:'8px 0'}}>
   <button type="button" disabled={zoom<=1} onClick={()=>setZoom(z=>Math.max(1,z-.25))}>Zoom out</button>
   <span aria-live="polite">{Math.round(zoom*100)}%</span>
   <button type="button" disabled={zoom>=3} onClick={()=>setZoom(z=>Math.min(3,z+.25))}>Zoom in</button>
   <button type="button" onClick={()=>setZoom(1)}>Fit width</button>
   {regions.some(r=>r.suggested)&&<button type="button" disabled={busy||disabled||added||!!trace||!!crop||fill} onClick={()=>{if(window.confirm('Remove AI suggestions? Manually traced and filled areas will stay.')){setRegions(list=>list.filter(r=>!r.suggested));setSelected(null);}}}>Clear AI suggestions</button>}
  </div><div style={{overflow:'auto',maxHeight:'60vh',border:'1px solid #d9d2c3'}}><svg viewBox="0 0 1000 1000" preserveAspectRatio="none" style={{display:'block',width:(zoom*100)+'%',maxWidth:'none',height:'auto',aspectRatio:preview.width+'/'+preview.height,cursor:trace||fill||crop?'crosshair':'default'}} aria-label="Floor plan with coloured area outlines" onClick={e=>{if(busy||(!trace&&!crop&&!fill))return;const svg=e.currentTarget,transform=svg.getScreenCTM();if(!transform)return;const screen=svg.createSVGPoint();screen.x=e.clientX;screen.y=e.clientY;const plan=screen.matrixTransform(transform.inverse());const point={x:Math.max(0,Math.min(1000,plan.x)),y:Math.max(0,Math.min(1000,plan.y))};if(fill)fillAt(point);else if(crop)setCrop(crop.length===2?[point]:[...crop,point]);else setTrace([...trace,point]);}}>
   <image href={preview.image} width="1000" height="1000" preserveAspectRatio="none"/>
   {regions.map((r,i)=><polygon key={r.id} points={r.points.map(p=>p.x+','+p.y).join(' ')} fill={tone(r.id)} fillOpacity={selected===r.id ? .46 : .23} stroke={tone(r.id)} strokeWidth={selected===r.id?4:2} vectorEffect="non-scaling-stroke" onClick={()=>{if(!trace&&!crop&&!fill)setSelected(r.id);}}><title>{r.name||'Unnamed area'}</title></polygon>)}
   {regions.map((r,i)=>{const x=r.points.reduce((n,p)=>n+p.x,0)/r.points.length,y=r.points.reduce((n,p)=>n+p.y,0)/r.points.length;return <g key={'label'+r.id} pointerEvents="none"><circle cx={x} cy={y} r="12" fill={tone(r.id)}/><text x={x} y={y} textAnchor="middle" dominantBaseline="central" fontSize="14" fill="white">{i+1}</text></g>;})}
   {crop?.length===2&&<rect x={Math.min(crop[0].x,crop[1].x)} y={Math.min(crop[0].y,crop[1].y)} width={Math.abs(crop[0].x-crop[1].x)} height={Math.abs(crop[0].y-crop[1].y)} fill="none" stroke="#142c49" strokeWidth="3" strokeDasharray="6 4"/>}
   {trace&&<polyline points={trace.map(p=>p.x+','+p.y).join(' ')} fill="none" stroke="#142c49" strokeWidth="3"/>}
  </svg></div>
  <div style={{display:'flex',gap:8,margin:'8px 0'}}>{trace?<><button type="button" disabled={trace.length<3} onClick={addTrace}>Finish outline</button><button type="button" onClick={()=>setTrace(trace.slice(0,-1))} disabled={!trace.length}>Undo point</button><button type="button" onClick={()=>{setTrace(null);setRetrace(null);}}>Cancel trace</button></>:<button type="button" disabled={busy||disabled||added||!!crop||fill} onClick={()=>{setRetrace(null);setTrace([]);}}>Trace area</button>}</div>
  {!trace&&<div style={{display:'flex',gap:8,margin:'8px 0'}}>{crop?<><button type="button" disabled={busy||crop.length!==2} onClick={detectCrop}>Detect inside selection</button><button type="button" disabled={busy} onClick={()=>setCrop(null)}>Cancel selection</button></>:<button type="button" disabled={busy||disabled||added||fill} onClick={()=>setCrop([])}>Select plan area</button>}</div>}
  {!trace&&!crop&&<button type="button" disabled={busy||disabled||added} onClick={()=>setFill(v=>!v)}>{fill?'Cancel fill':'Fill enclosed area'}</button>}
  {fill&&<p>Click a clear space inside an enclosed room. This follows visible linework and does not call AI.</p>}
  {crop&&<p>Click two opposite corners around the rooms. Leave the title block outside.</p>}
  {trace&&<p>Click each corner in order, then finish the outline.</p>}
  {!!regions.length&&<table style={{width:'100%',textAlign:'left'}}><thead><tr><th>Area</th><th>Zone code</th><th>Area name</th><th/></tr></thead><tbody>{regions.map((r,i)=><tr key={r.id} style={{background:selected===r.id?'#f2eee4':'transparent'}}><td><button type="button" style={{border:'1px solid '+tone(r.id),background:'color-mix(in srgb, '+tone(r.id)+' 18%, white)',padding:'5px 8px'}} onClick={()=>setSelected(r.id)}>Area {i+1}</button></td><td><input aria-label={'Zone code for area '+(i+1)} value={r.code} placeholder="Code" disabled={busy||disabled||added} onChange={e=>patch(r.id,'code',e.target.value.toUpperCase())} style={{width:'100%'}}/></td><td><input aria-label={'Name for area '+(i+1)} value={r.name} placeholder="Unnamed area" disabled={busy||disabled||added} onChange={e=>patch(r.id,'name',e.target.value)} style={{width:'100%'}}/></td><td><button type="button" disabled={busy||disabled||added||!!crop||!!trace||fill} onClick={()=>{setSelected(r.id);setRetrace(r.id);setTrace([]);}}>Retrace</button> <button type="button" disabled={busy||disabled||added||!!trace||!!crop||fill} onClick={()=>setRegions(list=>list.filter(x=>x.id!==r.id))}>Remove</button></td></tr>)}</tbody></table>}
  {!!regions.length&&<><p>Give each area a unique letter code and a name. Remove an incorrect outline and trace it again.</p><button type="button" disabled={!valid||busy||disabled||added||!!trace||!!crop||fill} onClick={()=>{onLabels(regions.map(({code,name})=>({code,name})));setAdded(true);}}> {added?'Added to draft':'Add reviewed areas to draft'}</button></>}
  </>}
 </section>;
}
