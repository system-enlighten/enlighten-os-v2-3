import React,{useEffect,useState} from 'react';
import {resolveProductAsset} from './product-assets.mjs';
export function useProductAsset(url){
 const [result,setResult]=useState({url:'',source:''});
 useEffect(()=>{let active=true;resolveProductAsset(url).then(source=>{if(active)setResult({url,source})}).catch(()=>{if(active)setResult({url,source:url||''})});return()=>{active=false}},[url]);
 return result.url===url?result.source:'';
}
export default function ProductAssetImage({src,alt='',...props}){
 const source=useProductAsset(src);
 return source?<img src={source} alt={alt} {...props}/>:<span aria-label="Image loading"> </span>;
}
