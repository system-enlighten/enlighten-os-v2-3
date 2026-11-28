export function recommendationCodes(data,group){
 const col=(data.headers||[]).findIndex(h=>/^(STRONGRECOMMENDATION|RECOMMENDEDPRODUCT(?:CODE)?)$/.test(String(h).toUpperCase().replace(/[^A-Z]/g,'')));
 return col<0?[]:[...new Set(group.sourceIndices.map(i=>String(data.rows[i]?.[col]||'').trim()).filter(v=>v&&v!=='<>'))];
}
export function recommendationApproved(assessment,id){return assessment?.groups?.[id]?.recommendation?.status==='approved'&&!!assessment.groups[id].selectedId;}

export function ensureRecommendationColumn(data){
 if(!data.headers?.length||data.headers.some(h=>/^(STRONGRECOMMENDATION|RECOMMENDEDPRODUCT(?:CODE)?)$/.test(String(h).toUpperCase().replace(/[^A-Z]/g,''))))return data;
 if(data.headers.length>=80)return data;
 return {...data,headers:[...data.headers,'STRONG_RECOMMENDATION'],rows:data.rows.map(row=>[...row,''])};
}
