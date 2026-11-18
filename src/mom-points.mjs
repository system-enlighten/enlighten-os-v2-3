export function splitMomPoints(value){
 const lines=String(value||'').replace(/\r\n?/g,'\n').replace(/\s+(?=\d{1,2}[.)]\s+[A-Za-z\u0900-\u097f])/g,'\n').split('\n');
 const marked=lines.some(line=>/^\s*(?:[-*•▪◦]\s+|\d{1,3}[.)]\s+)/.test(line));
 const points=[];let gap=true;
 for(const raw of lines){
  if(!raw.trim()){gap=true;continue;}
  const marker=/^\s*(?:[-*•▪◦]\s+|\d{1,3}[.)]\s+)/.test(raw);
  const text=raw.trim().replace(/^(?:[-*•▪◦]\s+|\d{1,3}[.)]\s+)/,'').trim();
  if(!text)continue;
  if(marked&&!marker&&!gap&&points.length)points[points.length-1]+=' '+text;
  else points.push(text);
  gap=false;
 }
 return points;
}
export function newMomPoint(text=''){
 const parts=text.split('|').map(s=>s.trim());
 return {id:crypto.randomUUID(),text:parts[0],owner:parts[1]||'',dueDate:/^\d{4}-\d{2}-\d{2}$/.test(parts[2]||'')?parts[2]:'',action:true,kind:/^follow[ -]?up:/i.test(parts[0])?'Follow-up':'Open',circuit:null,photos:[]};
}
export const momPointNotes=points=>points.filter(p=>p.text.trim()).map((p,i)=>`${i+1}. ${p.text.trim()}`).join('\n');
export function validateMomPoints(points){
 const filled=points.filter(p=>p.text.trim());
 if(!filled.length)throw Error('Add at least one MOM point.');
 if(points.some(p=>!p.text.trim()&&(p.photos?.length||p.circuit)))throw Error('Add text to every point with a picture or circuit.');
 if(filled.length>40)throw Error('Use up to 40 MOM points per visit.');
 if(filled.some(p=>p.text.trim().length>500))throw Error('Keep each point within 500 characters.');
 if(momPointNotes(filled).length>12000)throw Error('Keep this visit within 12,000 characters or log a separate visit.');
 return filled;
}
export async function prepareMomPoints(points,upload,onProgress=()=>{}){
 const ready=validateMomPoints(points).map(p=>({...p,photos:[...(p.photos||[])]}));
 for(const point of ready)for(let i=0;i<point.photos.length;i++){
  const photo=point.photos[i];
  if(!photo.local)continue;
  point.photos[i]=await upload(point,photo);
  onProgress(ready.map(p=>({...p,photos:[...p.photos]})));
 }
 return ready;
}
