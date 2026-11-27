export function decodeAssessment(meta,parts) {
  const ordered=[...parts].sort((a,b)=>Number(a.chunkIndex)-Number(b.chunkIndex));
  if (!ordered.length||ordered.length!==Number(meta.chunkCount)||ordered.some((part,index)=>Number(part.chunkIndex)!==index)) {
    throw Object.assign(new Error('Product Assessment could not load completely. Reload before editing.'),{statusCode:409});
  }
  const base64=ordered.map(part=>part.base64).join('');
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(base64)) throw Error('Invalid Product Assessment encoding.');
  const result=JSON.parse(Buffer.from(base64,'base64').toString('utf8'));
  if (!result?.groups||typeof result.groups!=='object'||Array.isArray(result.groups)) throw Error('Invalid Product Assessment data.');
  return result;
}
