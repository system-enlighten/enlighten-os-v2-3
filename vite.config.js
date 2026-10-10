import {defineConfig,loadEnv} from 'vite';
import react from '@vitejs/plugin-react';
import handler from './api/index.js';
export default defineConfig(({mode})=>{
  const env=loadEnv(mode,process.cwd(),'');
  for(const key of ['GOOGLE_CLIENT_ID','APPS_SCRIPT_URL','ENLIGHTEN_PROXY_SECRET'])if(env[key])process.env[key]=env[key];
  return {plugins:[react(),{name:'authenticated-local-api',configureServer(server){server.middlewares.use('/api',async(req,res)=>{
    try{
      req.query=Object.fromEntries(new URL(req.url||'/','http://localhost').searchParams);
      if(req.method==='POST'){let body='';for await(const chunk of req)body+=chunk;req.body=body;}
      res.status=code=>{res.statusCode=code;return res;};res.json=value=>{res.setHeader('Content-Type','application/json');res.end(JSON.stringify(value));return res;};
      await handler(req,res);
    }catch(_){res.statusCode=500;res.end(JSON.stringify({ok:false,error:{message:'Local API request failed'}}));}
  });}}],server:{host:'127.0.0.1',port:5173,strictPort:true}};
});
