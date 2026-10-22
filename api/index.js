import {createHmac,timingSafeEqual} from 'node:crypto';
import {OAuth2Client} from 'google-auth-library';
const google = new OAuth2Client();
const READ_ACTIONS = new Set(['authSession','listDrawingRegister','getProjectWorkflowTasks','listProjectRoles','listProjectPeople','listSitePunchIns','health','getCurrentUser','bootstrap','listProjects','listProjectContacts','listLineOfWork','getWorkflowCapabilities','listFloorZones','listTeamMembers','listDepartments','listDesignations','listDrawingTaskMaster','getDesignDashboard','getWIH']);
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
export const SESSION_SECONDS=12*60*60;
const SESSION_COOKIE='enlighten_session';
function requestHost(req){return String(req.headers?.host||'').toLowerCase();}
function localHost(host){return /^(localhost|127\.0\.0\.1)(:\d+)?$/.test(host);}
function cookieValue(req){return String(req.headers?.cookie||'').split(';').map(v=>v.trim()).find(v=>v.startsWith(SESSION_COOKIE+'='))?.slice(SESSION_COOKIE.length+1)||'';}
export function createAppSession(identity,secret,audience,host,now=Date.now()){
  const iat=Math.floor(now/1000),payload=Buffer.from(JSON.stringify({v:1,identity,audience,host,iat,exp:iat+SESSION_SECONDS})).toString('base64url');
  const signature=createHmac('sha256',secret).update('enlighten-session-v1:'+payload).digest('base64url');
  return payload+'.'+signature;
}
export function verifyAppSession(value,secret,audience,host,now=Date.now()){
  try{
    if(typeof value!=='string'||value.length>4096)return null;
    const [payload,signature,extra]=value.split('.');if(!payload||!signature||extra)return null;
    const expected=createHmac('sha256',secret).update('enlighten-session-v1:'+payload).digest();
    const actual=Buffer.from(signature,'base64url');if(actual.length!==expected.length||!timingSafeEqual(actual,expected))return null;
    const data=JSON.parse(Buffer.from(payload,'base64url').toString('utf8')),seconds=Math.floor(now/1000);
    if(data.v!==1||data.audience!==audience||data.host!==host||!Number.isFinite(data.iat)||!Number.isFinite(data.exp)||data.iat>seconds+30||data.exp<=seconds||data.exp-data.iat!==SESSION_SECONDS||!data.identity?.email||!data.identity?.sub)return null;
    return data.identity;
  }catch{return null;}
}
function setSessionCookie(req,res,value,maxAge){
  res.setHeader('Set-Cookie',`${SESSION_COOKIE}=${value}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${maxAge}${localHost(requestHost(req))?'':'; Secure'}`);
}
function sameOrigin(req){
  const origin=req.headers?.origin;
  if(String(req.headers?.['sec-fetch-site']||'').toLowerCase()==='cross-site')return false;
  if(!origin)return true; // Non-browser bearer clients; browser mutations include Origin.
  try{const u=new URL(origin);return u.host.toLowerCase()===requestHost(req)&&(u.protocol==='https:'||(u.protocol==='http:'&&localHost(u.host)));}catch{return false;}
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
    if(method==='POST'&&!sameOrigin(req))return send(403,{ok:false,error:{message:'Request origin is not allowed.'}});
    const session=verifyAppSession(cookieValue(req),secret,audience,requestHost(req));
    const bearer=/^Bearer ([^\s]+)$/.exec(String(req.headers?.authorization||''));
    if(action==='authSignOut'){
      if(method!=='POST')return send(405,{ok:false,error:{message:'Sign out requires POST.'}});
      setSessionCookie(req,res,'',0);return send(200,{ok:true,data:{signedIn:false}});
    }
    if(action==='authSession'&&method==='GET')return send(200,{ok:true,data:{signedIn:!!session}});
    let identity=session;
    if(bearer){
      try{identity=await verifyGoogleIdentity(bearer[1],audience);}
      catch(err){
        const unavailable=/network|fetch|ENOTFOUND|ECONN|ETIMEDOUT|certificate.*(fetch|retrieve)|failed to retrieve/i.test(String(err?.message||err));
        return send(unavailable?503:401,{ok:false,error:{message:unavailable?'Google sign-in is temporarily unavailable. Please retry.':'Google sign-in expired or is invalid. Sign in again.'}});
      }
    }
    if(action==='authSession'){
      if(method!=='POST'||!bearer||!identity)return send(401,{ok:false,error:{message:'Sign in with Google.'}});
      const value=createAppSession(identity,secret,audience,requestHost(req));setSessionCookie(req,res,value,SESSION_SECONDS);
      return send(200,{ok:true,data:{signedIn:true}});
    }
    if(!identity)return send(401,{ok:false,error:{message:'Your session has ended. Sign in again.'}});
    const payload=method==='GET'?Object.fromEntries(Object.entries(query).filter(([k])=>k!=='action')):body.payload||{};
    if(!payload||Array.isArray(payload)||typeof payload!=='object')return send(400,{ok:false,error:{message:'Invalid payload'}});
    // Browser-supplied email, roles, or identity envelopes never become authentication.
    const signed=signRequest(action,payload,identity,secret);
    const response=await fetchAppsScript(url,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify(signed)});
    const raw=await response.text();let result;try{result=JSON.parse(raw);}catch(_){return send(502,{ok:false,error:{message:'Apps Script did not return JSON. Check its deployment access and URL.'}});}
    return send(response.ok?200:502,result);
  }catch(_){return send(502,{ok:false,error:{message:'The backend request failed. Check the deployment configuration.'}});}
}
