import './TechnicalDocumentation.css';
import React,{useEffect,useRef,useState} from 'react';
import {createPortal} from 'react-dom';
import source from './technical-documentation.json';
function SheetTable({sheet,kind}){
 const skipped=new Set(),spans=new Map();
 sheet.merges.forEach(([r,c,re,ce])=>{spans.set(`${r},${c}`,[re-r+1,ce-c+1]);for(let y=r;y<=re;y++)for(let x=c;x<=ce;x++)if(y!==r||x!==c)skipped.add(`${y},${x}`)});
 return <table aria-label={sheet.name} style={{tableLayout:'fixed',borderCollapse:'collapse',width:sheet.widths.reduce((a,b)=>a+b,0)+'pt'}}><colgroup>{sheet.widths.map((w,i)=><col key={i} style={{width:w+'pt'}}/>)}</colgroup><tbody>{sheet.cells.map((row,r)=><tr key={r} style={{height:sheet.heights[r]+'pt'}}>{row.map((cell,c)=>{
 const key=`${r},${c}`;if(skipped.has(key))return null;
 const band=kind==='table'&&[1,3,5].includes(r)&&c>0,header=r===0,span=spans.get(key)||[1,1];
 const bg=band?'#000':cell.background||(header?(kind==='nomenclature'?'#bec0bf':'#bff81c'):c===0&&kind!=='nomenclature'?'#e5e5e5':'#fff');
 const Tag=header?'th':'td';
 return <Tag key={c} rowSpan={span[0]} colSpan={span[1]} style={{boxSizing:'border-box',height:sheet.heights.slice(r,r+span[0]).reduce((a,b)=>a+b,0)+'pt',border:'0.5pt solid #777',...(kind==='table'&&c===0&&r>0&&r<7?{borderTop:0,borderBottom:0}:{}),padding:'4pt',fontFamily:cell.font?.includes('Founders')?'TechnicalFounders':'TechnicalHelvetica',fontSize:cell.size+'pt',fontWeight:cell.bold?(cell.font?.includes('Founders')?600:700):400,fontStyle:cell.italic?'italic':'normal',lineHeight:'normal',textAlign:['left','right','center','justify'].includes(cell.align)?cell.align:'left',verticalAlign:'middle',whiteSpace:'pre-wrap',overflowWrap:'anywhere',color:band?'#fff':cell.color||'#000',background:bg}}>{cell.text||'\u00a0'}</Tag>
 })}</tr>)}</tbody></table>
}
export default function TechnicalDocumentation({view='table'}){
 const host=useRef(null),container=useRef(null);const [shadow,setShadow]=useState(null),[fit,setFit]=useState(true),[available,setAvailable]=useState(1200);
 useEffect(()=>{const root=host.current.shadowRoot||host.current.attachShadow({mode:'open'});setShadow(root);const observer=new ResizeObserver(entries=>setAvailable(entries[0].contentRect.width));observer.observe(container.current);return()=>observer.disconnect()},[]);
 const sheets=view==='nomenclature'?source.nomenclature:[source[view]||source.table];
 const width=(view==='nomenclature'?2738:Math.max(...sheets.map(s=>s.widths.reduce((a,b)=>a+b,0))))*4/3;
 const scale=fit?Math.min(1,Math.max(0.1,(available-32)/width)):1;
 return <div ref={container}><div style={{display:'flex',alignItems:'center',gap:12,margin:'14px 0'}}><button type="button" onClick={()=>setFit(x=>!x)} aria-pressed={fit}>{fit?'View at 100%':'Fit to width'}</button><span style={{fontSize:12,color:'#53616a'}}>Layout template · {Math.round(scale*100)}%</span></div><div style={{overflow:'auto',background:'#fff',padding:16,border:'1px solid #ded8ca'}}><div ref={host}/>{shadow&&createPortal(<><style>{`:host{display:block;color:#000}.canvas{background:white;font-family:Helvetica;color:black}table{border-spacing:0}*{box-sizing:border-box}@media print{.canvas{zoom:1!important} }`}</style><div className="canvas" style={{zoom:scale,width:width+'px'}}>{view==='nomenclature'?<div style={{display:'flex',gap:'186pt',alignItems:'flex-start'}}><div><div style={{height:'220pt',paddingTop:'55pt',textAlign:'center',fontSize:'36pt'}}>65.D1CR.3S</div><SheetTable sheet={sheets[0]} kind="nomenclature"/><p style={{fontSize:'18pt',marginTop:'18pt'}}>NOTE: If first two digits are missing that means default IP is 20</p></div><div style={{paddingTop:'220pt'}}><SheetTable sheet={sheets[1]} kind="nomenclature"/></div></div>:<SheetTable sheet={sheets[0]} kind={view}/>}</div></>,shadow)}</div></div>
}
