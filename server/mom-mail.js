import {OAuth2Client} from 'google-auth-library';
import {failure} from './project-write-storage.js';

export async function sendMomMail({to,cc,bcc,subject,body},{env=process.env,request=fetch,getToken}={}) {
  const auth=getToken||async function () {
    const {MOM_MAIL_CLIENT_ID:id,MOM_MAIL_CLIENT_SECRET:secret,MOM_MAIL_REFRESH_TOKEN:refresh}=env;
    if (!id||!secret||!refresh) throw failure('MOM email sending is not configured.',503);
    const auth=new OAuth2Client(id,secret);
    auth.setCredentials({refresh_token:refresh});
    return (await auth.getAccessToken()).token;
  };
  const token=await auth();
  if (!token) throw failure('MOM email authorization is unavailable.',503);
  const encode=value=>Buffer.from(value,'utf8').toString('base64');
  const chunks=[...subject].reduce((out,char)=>{
    const last=out.at(-1)||'';
    if (!last||Buffer.byteLength(last+char)>42) out.push(char);
    else out[out.length-1]+=char;
    return out;
  },[]);
  const subjectLine=chunks.map(value=>'=?UTF-8?B?'+encode(value)+'?=').join('\r\n ');
  const mime=['To: '+to.join(', '),...(cc.length?['Cc: '+cc.join(', ')]:[]),...(bcc.length?['Bcc: '+bcc.join(', ')]:[]),
    'Subject: '+subjectLine,'MIME-Version: 1.0','Content-Type: text/plain; charset=UTF-8','Content-Transfer-Encoding: base64','',
    encode(body).match(/.{1,76}/g).join('\r\n')].join('\r\n');
  const response=await request('https://gmail.googleapis.com/gmail/v1/users/me/messages/send',{method:'POST',redirect:'error',
    headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify({raw:Buffer.from(mime).toString('base64url')}),
    signal:AbortSignal.timeout(20000)});
  if (!response.ok) throw failure('Gmail could not send the MOM message.',503);
}
