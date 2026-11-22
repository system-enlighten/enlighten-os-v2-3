import {useEffect,useRef} from 'react';

export function useTechnicalBackgroundRefresh({request,action,projectId,enabled,onUpdate}){
 const apply=useRef(onUpdate);
 apply.current=onUpdate;
 useEffect(()=>{
  if(!request.revalidate||!projectId||!enabled)return;
  let active=true,running=false;
  async function refresh(){
   if(!active||running||document.visibilityState==='hidden')return;
   running=true;
   try{
    const value=await request.revalidate(action,{projectId},'POST',90000);
    if(active)apply.current(value);
   }catch{
    // Keep the last successful view visible during a transient failure.
   }finally{running=false;}
  }
  const initial=setTimeout(refresh,1500);
  const interval=setInterval(refresh,60000);
  document.addEventListener('visibilitychange',refresh);
  return()=>{
   active=false;
   clearTimeout(initial);
   clearInterval(interval);
   document.removeEventListener('visibilitychange',refresh);
  };
 },[request,action,projectId,enabled]);
}
