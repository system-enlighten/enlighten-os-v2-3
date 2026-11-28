export function recommendationCodes(data,group){
 const col=(data.headers||[]).findIndex(h=>/^RECOMMENDEDPRODUCT(?:CODE)?$/.test(String(h).toUpperCase().replace(/[^A-Z]/g,'')));
 return col<0?[]:[...new Set(group.sourceIndices.map(i=>String(data.rows[i]?.[col]||'').trim()).filter(v=>v&&v!=='<>'))];
}
export function recommendationApproved(assessment,id){return assessment?.groups?.[id]?.recommendation?.status==='approved'&&!!assessment.groups[id].selectedId;}
