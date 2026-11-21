export function transactionBillSource(value){
 let url;try{url=new URL(String(value||''));}catch{return null;}
 if(url.protocol!=='https:')return null;
 const drive=['drive.google.com','docs.google.com'].includes(url.hostname),id=drive?(url.pathname.match(/\/d\/([a-zA-Z0-9_-]+)/)?.[1]||url.searchParams.get('id')):null;
 if(id&&/^[a-zA-Z0-9_-]+$/.test(id))return {url:`https://drive.google.com/file/d/${id}/preview`,original:url.href,image:false};
 return {url:url.href,original:url.href,image:/\.(png|jpe?g|webp)(?:$|[?#])/i.test(url.href)};
}
