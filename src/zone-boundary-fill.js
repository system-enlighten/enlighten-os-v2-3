// Trace the outer border of a connected, light region. Dark/coloured ink blocks the fill.
export function fillZoneBoundary(data,w,h,x,y){
 const start=y*w+x,total=w*h;
 if(x<0||x>=w||y<0||y>=h)return null;
 const ink=i=>Math.min(data[i*4],data[i*4+1],data[i*4+2])<180;
 if(ink(start))return null;
 const seen=new Uint8Array(total),queue=new Int32Array(total);
 let count=1;queue[0]=start;seen[start]=1;
 for(let i=0;i<count;i++){
  const p=queue[i],px=p%w,py=Math.floor(p/w);
  if(!px||px===w-1||!py||py===h-1||count>total*.25)return null;
  for(const next of [p-1,p+1,p-w,p+w])if(!seen[next]&&!ink(next)){seen[next]=1;queue[count++]=next;}
 }
 if(count<Math.max(24,total*.00006))return null;
 const stride=w+1,edges=new Map();
 const edge=(a,b)=>{const next=edges.get(a)||[];next.push(b);edges.set(a,next);};
 for(let i=0;i<count;i++){
  const p=queue[i],v=Math.floor(p/w)*stride+p%w;
  if(!seen[p-w])edge(v,v+1);
  if(!seen[p+1])edge(v+1,v+stride+1);
  if(!seen[p+w])edge(v+stride+1,v+stride);
  if(!seen[p-1])edge(v+stride,v);
 }
 let best=[],area=0;
 while(edges.size){
  const start=edges.keys().next().value,points=[];let v=start,closed=false;
  do{
   const next=edges.get(v);if(!next?.length)break;
   points.push({x:v%stride,y:Math.floor(v/stride)});
   const end=next.pop();if(!next.length)edges.delete(v);v=end;
   if(v===start){closed=true;break;}
  }while(edges.size);
  if(!closed||points.length<3)continue;
  const size=Math.abs(points.reduce((sum,p,i)=>{const q=points[(i+1)%points.length];return sum+p.x*q.y-q.x*p.y;},0));
  if(size>area){best=points;area=size;}
 }
 if(best.length<3||area>total*.5)return null;
 return best.filter((p,i)=>{const a=best[(i+best.length-1)%best.length],b=best[(i+1)%best.length];return (p.x-a.x)*(b.y-p.y)!==(p.y-a.y)*(b.x-p.x);}).map(p=>({x:p.x*1000/w,y:p.y*1000/h}));
}

// Model coordinates are hints only. Draw geometry from the same raster as the preview.
export function snapZoneSuggestions(data,w,h,regions){
 const bounds=points=>[Math.min(...points.map(p=>p.x)),Math.min(...points.map(p=>p.y)),Math.max(...points.map(p=>p.x)),Math.max(...points.map(p=>p.y))];
 const area=b=>(b[2]-b[0])*(b[3]-b[1]);
 const overlap=(a,b)=>Math.max(0,Math.min(a[2],b[2])-Math.max(a[0],b[0]))*Math.max(0,Math.min(a[3],b[3])-Math.max(a[1],b[1]));
 const found=[];
 for(const region of regions.slice(0,40)){
  const box=bounds(region.points),size=area(box);
  if(size<100||size>250000)continue;
  for(const [u,v] of [[.5,.5],[.39,.43],[.61,.57]]){
   const x=Math.floor((box[0]+u*(box[2]-box[0]))*w/1000),y=Math.floor((box[1]+v*(box[3]-box[1]))*h/1000);
   const points=fillZoneBoundary(data,w,h,x,y);
   if(!points?.length)continue;
   const actual=bounds(points),shared=overlap(actual,box),actualSize=area(actual);
   if(shared/(size+actualSize-shared)<.68)continue;
   if(found.some(r=>overlap(actual,r.box)>.25*Math.min(actualSize,area(r.box))))continue;
   found.push({region:{...region,points},box:actual});break;
  }
 }
 return found.map(r=>r.region);
}
