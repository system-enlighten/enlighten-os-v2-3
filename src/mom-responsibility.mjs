const normalize=v=>String(v||'').trim().replace(/\s+/g,' ').toLowerCase();
export const responsibleName=p=>String(p?.task?.owner||p?.owner||'').trim();
export const isMyMom=(p,user)=>{const name=normalize(responsibleName(p));return !!name&&[user?.name,user?.email,user?.userId].some(v=>normalize(v)===name)};
export const needsMomFollowup=(p,user)=>!!responsibleName(p)&&!isMyMom(p,user);
export const matchesResponsible=(p,filter)=>!filter||(filter==='__unassigned'?!responsibleName(p):normalize(responsibleName(p))===normalize(filter));
export function responsibleNames(points){return [...new Map(points.map(p=>responsibleName(p)).filter(Boolean).map(n=>[normalize(n),n])).values()].sort((a,b)=>a.localeCompare(b));}
