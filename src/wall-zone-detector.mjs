const dist=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
const JUNK=new Set(["WIDE","UP","DN","LG","CL","LC"]);
const DIM=/\d+\s*['’]\s*-?\s*[\d\s\/]*["”]?\s*([xX×]\s*\d+\s*['’]\s*-?\s*[\d\s\/]*["”]?)?/g;
const ordered=its=>{const L=[];its.slice().sort((a,b)=>a.y-b.y).forEach(it=>{const l=L[L.length-1];
  if(l&&Math.abs(it.y-l[0].y)<it.fs*.7)l.push(it);else L.push([it]);});return L.map(l=>l.sort((a,b)=>a.x-b.x));};
const pretty=t=>/^[A-Z]+$/.test(t)&&t.length>3?t[0]+t.slice(1).toLowerCase():t;
const nameFrom=its=>ordered(its).map(l=>l.map(i=>i.s.replace(/^\s*["”]?\s*[xX×]\s*\d[^A-Za-z]*/,"").replace(DIM,"")).join(" ")).join(" ")
  .split(/\s+/).filter(t=>t.replace(/[^A-Za-z]/g,"").length>1&&!JUNK.has(t.toUpperCase())).map(pretty).join(" ");
const dimFrom=its=>ordered(its.filter(i=>/\d\s*['’]/.test(i.s)||/^\s*["”]?\s*[xX×]\s*\d/.test(i.s)))
  .map(l=>l.map(i=>i.s.replace(/[A-Za-z.]{2,}/g,"").trim()).join("")).join("");

function trace(lab,w,h,id,sx,sy,cap){
  const DX=[1,1,0,-1,-1,-1,0,1],DY=[0,1,1,1,0,-1,-1,-1];
  const at=(x,y)=>x>=0&&y>=0&&x<w&&y<h&&lab[y*w+x]===id;
  const out=[]; let x=sx,y=sy,b=4;
  for(let n=0;n<cap;n++){
    out.push([x,y]); let f=-1;
    for(let i=1;i<=8;i++){const d=(b+i)%8; if(at(x+DX[d],y+DY[d])){f=d;break;}}
    if(f<0)break;
    const pd=(f+7)%8, bx=DX[pd]-DX[f], by=DY[pd]-DY[f];
    x+=DX[f]; y+=DY[f]; b=0;
    for(let k=0;k<8;k++) if(DX[k]===bx&&DY[k]===by){b=k;break;}
    if(x===sx&&y===sy)break;
  }
  return out;
}
function rdp(p,e){
  if(p.length<3)return p;
  const a=p[0],b=p[p.length-1],dx=b[0]-a[0],dy=b[1]-a[1],L=Math.hypot(dx,dy)||1; let md=0,mi=0;
  for(let i=1;i<p.length-1;i++){const d=Math.abs(dx*(a[1]-p[i][1])-(a[0]-p[i][0])*dy)/L; if(d>md){md=d;mi=i;}}
  if(md<=e)return [a,b];
  return rdp(p.slice(0,mi+1),e).slice(0,-1).concat(rdp(p.slice(mi),e));
}
function simplifyRing(p,e){
  let f=0,m=0; p.forEach((q,i)=>{const d=dist(q,p[0]); if(d>m){m=d;f=i;}});
  return rdp(p.slice(0,f+1),e).slice(0,-1).concat(rdp(p.slice(f).concat([p[0]]),e).slice(0,-1));
}

/* Text pieces that sit close together are one room label ("MASTER BED" + "ROOM" + "16'-3"X21'-9""). */
const ROOM_RE=/lounge|bed|toilet|kitchen|store|storage|dress|lobby|passage|lift|pdr|study|din+ing|sitting|waiting|verandah|veranda|balcony|shower|w\.?c|pantry|utility|wardrobe|guard|gate|terrace|room|stair|office|hall|garage|pooja|puja|living|gym|bath|laundry|library|theatre|foyer|servant|canopy/i;
const hasLetters=t=>/[A-Za-z]{2,}/.test(t.replace(/[xX×]\s*\d/g,""));
function clusterLabels(items){
  const n=items.length, par=items.map((_,i)=>i), find=i=>par[i]===i?i:(par[i]=find(par[i]));
  for(let i=0;i<n;i++)for(let j=i+1;j<n;j++){
    const a=items[i],b=items[j],fs=Math.max(a.fs,b.fs);
    if(Math.abs(a.y-b.y)<=1.8*fs&&Math.abs(a.x-b.x)<=(a.w+b.w)/2+0.8*fs) par[find(i)]=find(j);
  }
  const g=new Map(); items.forEach((it,i)=>{const r=find(i);(g.get(r)||g.set(r,[]).get(r)).push(it);});
  return [...g.values()].map(its=>{
    const lines=ordered(its), txt=l=>l.map(i=>i.s).join(" ");
    let k=-1; lines.forEach((l,i)=>{if(!hasLetters(txt(l))&&/\d\s*['’]/.test(txt(l))&&/[xX×]/.test(txt(l)))k=i;});   // the "16'-3"X21'-9"" line
    let name="";
    if(k>0){                                                  // name = the lines stacked directly above the size line
      const use=[]; let y=lines[k][0].y, nLines=0;
      for(let i=k-1;i>=0&&nLines<4;i--){ if(y-lines[i][0].y>2.2*lines[i][0].fs)break; use.unshift(...lines[i]); y=lines[i][0].y; nLines++; }
      name=nameFrom(use);
    }
    if(!name) name=nameFrom(its);
    const hasSize=k>=0||/\d\s*['’][^A-Za-z]*[xX×]\s*\d/.test(its.map(i=>i.s).join(""));
    return {items:its,name,dims:dimFrom(its),room:!!name&&(hasSize||ROOM_RE.test(name)),
      x:its.reduce((s,i)=>s+i.x,0)/its.length,y:its.reduce((s,i)=>s+i.y,0)/its.length};
  });
}

/* Pure image work. Walls = red/blue linework (CAD wall layers), furniture and hatching are ignored.
   Each room label becomes a seed, so a bed, pillow or table can never become its own zone. */
function detectZones(o){
 const {w,h,ppfW,roi,labels,minA,maxA,wall}=o;
 const x0=Math.max(0,Math.floor(roi[0])),y0=Math.max(0,Math.floor(roi[1]));
 const x1=Math.min(w,Math.ceil(roi[2])),y1=Math.min(h,Math.ceil(roi[3]));
 const lab=new Int32Array(w*h), queue=new Int32Array(w*h), zones=[], accepted=new Map();
 let id=0;
 const blocked=i=>wall[i]||wall[i-1]||wall[i+1]||wall[i-w]||wall[i+w];
 for(let y=o.seed?.[1]??y0;y<(o.seed?o.seed[1]+1:y1);y++)for(let x=o.seed?.[0]??x0;x<(o.seed?o.seed[0]+1:x1);x++){
  if(x<x0||x>=x1||y<y0||y>=y1)continue;
  const start=y*w+x;
  if(lab[start]||blocked(start))continue;
  let n=1,edge=false;
  queue[0]=start;lab[start]=++id;
  for(let j=0;j<n;j++){
   const p=queue[j], px=p%w, py=(p/w)|0;
   if(px===x0||px===x1-1||py===y0||py===y1-1)edge=true;
   for(const [q,ok] of [[p-1,px>x0],[p+1,px<x1-1],[p-w,py>y0],[p+w,py<y1-1]]){
    if(ok&&!lab[q]&&!blocked(q)){lab[q]=id;queue[n++]=q;}
   }
  }
  const sf=n/(ppfW*ppfW);
  if(edge||sf<minA||sf>maxA)continue;
  const pts=simplifyRing(trace(lab,w,h,id,x,y,n*4+16),.75);
  if(pts.length<3)continue;
  const zone={pts:pts.map(([x,y])=>[x+.5,y+.5]),label:null,sf};
  zones.push(zone);accepted.set(id,zone);
 }
 for(const L of labels){
  const x=Math.round(L.x),y=Math.round(L.y);
  if(x<x0||x>=x1||y<y0||y>=y1)continue;
  const zone=accepted.get(lab[y*w+x]);
  if(!zone){L.why="no enclosed wall region";continue;}
  const rank=l=> (/master|primary/i.test(l.name)?4:0)+(/sitting/i.test(l.name)?0:2)+(l.dims?1:0);
  if(!zone.label||rank(L)>rank(zone.label))zone.label=L;
  L.used=true;
 }
 return zones;
}

function runDetect(o){
  const sw=Math.min(1,3000/Math.max(o.bg.width,o.bg.height)), w=Math.round(o.bg.width*sw), h=Math.round(o.bg.height*sw);
  const roi=o.roi.map(v=>v*sw), bw=o.bg.width, bh=o.bg.height;
  const full=o.bg.getContext("2d",{willReadFrequently:true}).getImageData(0,0,bw,bh).data;
  const mk=test=>{const m=new Uint8Array(w*h);                    // wall test at full resolution, pooled down so thin lines survive
    for(let y=0;y<bh;y++){const ry=Math.min(h-1,(y*sw)|0)*w; for(let x=0;x<bw;x++){const k=(y*bw+x)*4;
      if(test(full[k],full[k+1],full[k+2])) m[ry+Math.min(w-1,(x*sw)|0)]=1;}} return m;};
  let wall=mk((r,g,b)=>(r>150&&r-g>60&&r-b>60&&Math.abs(g-b)<40)||(b>150&&b-r>60&&b-g>30));   // red / blue wall layers
  let nw=0; for(let y=Math.max(0,roi[1]|0);y<Math.min(h,roi[3]);y++)for(let x=Math.max(0,roi[0]|0);x<Math.min(w,roi[2]);x++) nw+=wall[y*w+x];
  if(nw<(roi[2]-roi[0])*(roi[3]-roi[1])*0.0004) throw Error("No red/blue wall lines found. Trace manually or export the wall layers in red/blue.");        // no coloured walls: use dark linework
  const items=o.items.map(it=>({s:it.s,x:it.x*sw,y:it.y*sw,w:it.w*sw,fs:it.fs*sw}))
    .filter(it=>it.x>=roi[0]&&it.x<=roi[2]&&it.y>=roi[1]&&it.y<=roi[3]);
  const labels=clusterLabels(items).filter(l=>l.room);
  const zones=detectZones({wall,w,h,ppfW:o.ppf*sw,roi,labels,minA:o.minA,maxA:o.maxA,seed:o.seed?.map(v=>Math.floor(v*sw))});
  zones.forEach(z=>z.pts=z.pts.map(p=>[p[0]/sw,p[1]/sw]));
  return {zones,labels,sw};
}


export {detectZones};
export async function detectWallZones(canvas,page,viewport,bounds=[0,0,1000,1000],point){
 const items=page?(await page.getTextContent()).items.filter(it=>it.str?.trim()).map(it=>{
  const [a,b,c,d,e,f]=viewport.transform,[g,h,i,j,k,l]=it.transform;
  const u=a*g+c*h,v=b*g+d*h,tx=a*i+c*j,ty=b*i+d*j,w=it.width*viewport.scale,n=Math.hypot(u,v)||1;
  return {s:it.str,w,fs:Math.hypot(tx,ty)||8,x:a*k+c*l+e+u/n*w/2+tx*.35,y:b*k+d*l+f+v/n*w/2+ty*.35};
 }):[];
 const roi=bounds.map((p,i)=>p/1000*(i%2?canvas.height:canvas.width));
 // In Floor / Zone there is no calibrated scale. Use a minimum pixel area
 // relative to the selection instead of reporting square footage.
 const {zones}=runDetect({bg:canvas,roi,items,ppf:1,minA:Math.max(60,(roi[2]-roi[0])*(roi[3]-roi[1])*.001),maxA:Infinity,seed:point?[point.x*canvas.width/1000,point.y*canvas.height/1000]:undefined});
 return zones.map(z=>({code:'',name:z.label?.name||'',points:z.pts.map(([x,y])=>({x:x/canvas.width*1000,y:y/canvas.height*1000}))}));
}
