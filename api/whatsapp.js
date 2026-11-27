import {isOperationalPreview} from '../server/preview-isolation.js';
import {createHmac,timingSafeEqual} from 'node:crypto';
import {readPaymentReceipt} from '../server/payment-receipts.js';
import {loadOperationalIdentity} from '../server/permissions.js';
import {claimPaymentReceiptDraft,finishPaymentReceiptDraft} from '../server/accounts-receipt-drafts.js';
import {uploadAccountsTransactionAttachment} from '../server/drive-attachments.js';

const directActions={claimPaymentReceiptDraft,finishPaymentReceiptDraft,uploadAccountsTransactionAttachment};
export const config={api:{bodyParser:false}};
export const maxDuration=300;
export function validWhatsAppSignature(raw,signature,secret){if(!secret||!/^sha256=[a-f0-9]{64}$/.test(signature||''))return false;const expected=createHmac('sha256',secret).update(raw).digest('hex');return timingSafeEqual(Buffer.from(signature.slice(7)),Buffer.from(expected));}
export default async function handler(req,res){
 if(req.method==='GET'){if(process.env.WHATSAPP_VERIFY_TOKEN&&req.query['hub.mode']==='subscribe'&&req.query['hub.verify_token']===process.env.WHATSAPP_VERIFY_TOKEN)return res.status(200).send(req.query['hub.challenge']);return res.status(403).end();}
 if(req.method!=='POST')return res.status(405).end();
 let raw=Buffer.alloc(0);for await(const chunk of req){raw=Buffer.concat([raw,Buffer.from(chunk)]);if(raw.length>1024*1024)return res.status(413).end();}
 if(!validWhatsAppSignature(raw,req.headers['x-hub-signature-256'],process.env.META_APP_SECRET))return res.status(401).end();
 try{
 const event=JSON.parse(raw),identities=JSON.parse(process.env.WHATSAPP_SENDER_IDENTITIES_JSON||'{}'),version=process.env.WHATSAPP_GRAPH_VERSION;
 if(!/^v\d+\.\d+$/.test(version||''))throw Error('Graph version missing');
 const token=process.env.WHATSAPP_ACCESS_TOKEN,phone=process.env.WHATSAPP_PHONE_NUMBER_ID;
 for(const entry of event.entry||[])for(const change of entry.changes||[]){const value=change.value;if(value?.metadata?.phone_number_id!==phone)continue;
 for(const message of value.messages||[]){const identity=identities[message.from];if(!identity?.email||!identity.sub||message.type!=='image')continue;
 const direct=isOperationalPreview()&&process.env.SUPABASE_DIRECT_OPERATIONAL_WRITES==='1'&&
   process.env.SUPABASE_ACCOUNTS_BACKFILL_VERIFIED==='1';
 if (!direct) throw Error('Supabase WhatsApp intake is disabled.');
 const user=await loadOperationalIdentity(identity);
 const backend=(action,payload)=>directActions[action](payload,{user});
 const claim=await backend('claimPaymentReceiptDraft',{id:message.id});if(!claim.claimed){if(claim.status==='ready')continue;throw Error('Receipt still processing');}
 const meta=await fetch(`https://graph.facebook.com/${version}/${encodeURIComponent(message.image.id)}`,{headers:{Authorization:'Bearer '+token},signal:AbortSignal.timeout(20000)});if(!meta.ok)throw Error('Media metadata unavailable');const media=await meta.json(),url=new URL(media.url);
 if(url.protocol!=='https:'||!/(^|\.)(facebook\.com|fbcdn\.net|fbsbx\.com|whatsapp\.net)$/.test(url.hostname)||media.file_size>3*1024*1024||!['image/jpeg','image/png','image/webp'].includes(media.mime_type))throw Error('Unsupported receipt');
 const image=await fetch(url,{redirect:'error',headers:{Authorization:'Bearer '+token},signal:AbortSignal.timeout(20000)});if(!image.ok)throw Error('Media unavailable');if(Number(image.headers.get('content-length'))>3*1024*1024)throw Error('Media too large');const reader=image.body.getReader();let bytes=Buffer.alloc(0);while(true){const {value,done}=await reader.read();if(done)break;bytes=Buffer.concat([bytes,Buffer.from(value)]);if(bytes.length>3*1024*1024){await reader.cancel();throw Error('Media too large');}}
 const base64=bytes.toString('base64'),draft=await readPaymentReceipt(`data:${media.mime_type};base64,${base64}`),asset=await backend('uploadAccountsTransactionAttachment',{transactionId:claim.transactionId,name:'whatsapp-receipt.'+({'image/jpeg':'jpg','image/png':'png','image/webp':'webp'})[media.mime_type],base64});
 await backend('finishPaymentReceiptDraft',{id:message.id,lease:claim.lease,draft:{...draft,attachmentId:asset.id}});
 // User-initiated receipt reply; no financial entry is saved automatically.
 const app=new URL(process.env.PUBLIC_APP_URL);if(app.protocol!=='https:')throw Error('HTTPS app URL required');
 const reply=await fetch(`https://graph.facebook.com/${version}/${phone}/messages`,{method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},signal:AbortSignal.timeout(20000),body:JSON.stringify({messaging_product:'whatsapp',to:message.from,type:'text',text:{body:'Receipt draft ready. Open Accounts → Debit / Credit → WhatsApp receipts. Review details, choose project and payment head, then save: '+app.origin}})});if(!reply.ok)console.error('WhatsApp receipt reply failed; draft is available in Accounts.');
 }}return res.status(200).json({received:true});
 }catch{console.error('WhatsApp receipt processing failed; retry delivery or upload in Accounts.');return res.status(503).json({error:'Receipt processing unavailable. Retry later or upload in Accounts.'});}
}
