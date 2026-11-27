import {sendMomMail} from './mom-mail.js';
import {OAuth2Client} from 'google-auth-library';
import {failure} from './project-write-storage.js';

export async function readIntakeAttachments(messageId,{env=process.env,request=fetch,getToken}={}) {
  if (!/^[A-Za-z0-9_-]{1,180}$/.test(messageId)) throw failure('Invalid original Gmail message identifier.');
  const access=getToken||async function () {
    const {INTAKE_MAIL_CLIENT_ID:id,INTAKE_MAIL_CLIENT_SECRET:secret,INTAKE_MAIL_REFRESH_TOKEN:refresh}=env;
    if (!id||!secret||!refresh) throw failure('Drawing intake mailbox is not configured.',503);
    const client=new OAuth2Client(id,secret);
    client.setCredentials({refresh_token:refresh});
    return (await client.getAccessToken()).token;
  };
  const token=await access(),root='https://gmail.googleapis.com/gmail/v1/users/me/messages/'+encodeURIComponent(messageId);
  if (!token) throw failure('Drawing intake mailbox authorization is unavailable.',503);
  const load=async suffix=>{
    const response=await request(root+suffix,{headers:{Authorization:'Bearer '+token},redirect:'error',signal:AbortSignal.timeout(30000)});
    if (!response.ok) throw failure('Original Gmail message or attachment is unavailable.',503);
    return response.json();
  };
  const message=await load('?format=full'),attachments=[];
  function visit(part) {
    const disposition=(part.headers||[]).find(item=>String(item.name).toLowerCase()==='content-disposition')?.value||'';
    if (part.filename&&!/^inline/i.test(disposition)) {
      const body=part.body||{};
      attachments.push({name:part.filename,mimeType:part.mimeType,size:Number(body.size),bytes:async()=>{
        const encoded=body.attachmentId?(await load('/attachments/'+encodeURIComponent(body.attachmentId))).data:body.data;
        if (typeof encoded!=='string'||encoded.length>28000000) throw failure('Gmail attachment is too large or unavailable.',409);
        return Buffer.from(encoded,'base64url');
      }});
    }
    for (const child of part.parts||[]) visit(child);
  }
  if (message.payload) visit(message.payload);
  return attachments;
}

export async function sendIntakeConfirmation({token,recipient,files},{env=process.env}={}) {
  if (!/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(recipient)||!/^[a-f0-9-]{36}$/i.test(token||'')) {
    throw failure('Invalid intake confirmation metadata.');
  }
  const acknowledgement={to:[recipient],cc:[],bcc:[],subject:'[ENL-'+token+'] Drawing receipt',
    body:'ENLIGHTEN AUTOMATED RECEIPT\n\nUploaded and logged in Received / Sent. Awaiting classification.\n\n'+
      files.map(file=>file.name+'\n'+file.url).join('\n\n')};
  await sendMomMail(acknowledgement,{env:{MOM_MAIL_CLIENT_ID:env.INTAKE_MAIL_CLIENT_ID,
    MOM_MAIL_CLIENT_SECRET:env.INTAKE_MAIL_CLIENT_SECRET,MOM_MAIL_REFRESH_TOKEN:env.INTAKE_MAIL_REFRESH_TOKEN}});
}
