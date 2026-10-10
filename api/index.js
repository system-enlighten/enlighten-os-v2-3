import {createHmac} from 'node:crypto';
import {OAuth2Client} from 'google-auth-library';
const google = new OAuth2Client();
const READ_ACTIONS = new Set(['health','getCurrentUser','bootstrap','listProjects','listProjectContacts','listLineOfWork','getWorkflowCapabilities','listFloorZones','listTeamMembers','listDepartments','listDesignations','listDrawingTaskMaster','getDesignDashboard','getWIH']);
export async function verifyGoogleIdentity(token, audience) {
  const ticket=await google.verifyIdToken({idToken:token,audience});
  const claims=ticket.getPayload();
  if (!claims?.sub || !claims.email || claims.email_verified!==true) throw new Error('Google account email is not verified.');
  if (!claims.email.toLowerCase().endsWith('@gmail.com') && !claims.hd) throw new Error('Use a Gmail or Google Workspace account.');
  return {email:claims.email.trim().toLowerCase(),sub:claims.sub};
}
export function signRequest(action,payload,identity,secret,issuedAt=Date.now()) {
  const signedRequest=JSON.stringify({action,payload,identity,issuedAt});
  return {signedRequest,signature:createHmac('sha256',secret).update(signedRequest).digest('hex')};
}
export async function fetchAppsScript(url,options,maxRedirects=8) {
  for(let i=0;i<=maxRedirects;i++){
    const response=await fetch(url,{...options,redirect:'manual'});
    if(![301,302,303,307,308].includes(response.status))return response;
    const location=response.headers.get('location');if(!location)return response;
    url=new URL(location,url).toString();
    // Apps Script content-service redirects return the response body via GET.
    if(response.status===303||response.status===302)options={...options,method:'GET',body:undefined};
  }
  throw new Error('Too many Apps Script redirects.');
}
export default async function handler(req,res) {
  res.setHeader('Cache-Control','no-store, max-age=0');
  const send=(status,data)=>res.status(status).json(data);
  try{
    const method=String(req.method||'GET').toUpperCase();
    if(!['GET','POST'].includes(method))return send(405,{ok:false,error:{message:'Method not allowed'}});
    let body={};
    if(method==='POST'){try{body=typeof req.body==='string'?JSON.parse(req.body):req.body||{};}catch(_){return send(400,{ok:false,error:{message:'Invalid JSON'}});}}
    const query=req.query||{};const action=method==='GET'?query.action:body.action;
    if(typeof action!=='string'||!action)return send(400,{ok:false,error:{message:'Choose one action'}});
    if(action==='authConfig'&&method==='GET')return send(200,{ok:true,data:{clientId:process.env.GOOGLE_CLIENT_ID||''}});
    const secret=process.env.ENLIGHTEN_PROXY_SECRET, audience=process.env.GOOGLE_CLIENT_ID,url=process.env.APPS_SCRIPT_URL;
    if(!secret||secret.length<32||!audience||!url)return send(503,{ok:false,error:{message:'Login configuration is incomplete. Configure the Vercel environment variables.'}});
    if(method==='GET'&&!READ_ACTIONS.has(action))return send(405,{ok:false,error:{message:'This action requires POST'}});
    const bearer=/^Bearer ([^\s]+)$/.exec(String(req.headers?.authorization||''));
    if(!bearer)return send(401,{ok:false,error:{message:'Sign in with Google.'}});
    let identity;try{identity=await verifyGoogleIdentity(bearer[1],audience);}catch(_){return send(401,{ok:false,error:{message:'Google sign-in expired or is invalid. Sign in again.'}});}
    const payload=method==='GET'?Object.fromEntries(Object.entries(query).filter(([k])=>k!=='action')):body.payload||{};
    if(!payload||Array.isArray(payload)||typeof payload!=='object')return send(400,{ok:false,error:{message:'Invalid payload'}});
    // Browser-supplied email, roles, or identity envelopes never become authentication.
    const signed=signRequest(action,payload,identity,secret);
    const response=await fetchAppsScript(url,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify(signed)});
    const raw=await response.text();let result;try{result=JSON.parse(raw);}catch(_){return send(502,{ok:false,error:{message:'Apps Script did not return JSON. Check its deployment access and URL.'}});}
    return send(response.ok?200:502,result);
  }catch(_){return send(502,{ok:false,error:{message:'The backend request failed. Check the deployment configuration.'}});}
}
