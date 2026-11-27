import {randomUUID} from 'node:crypto';
import {db} from './supabase-db.js';
import {requireAccounts} from './permissions.js';
import {failure,text} from './project-write-storage.js';

export function getPaymentReceiptAccess(_payload,{user}) {
  requireAccounts(user,{write:true});
  return {email:user.email};
}

export async function claimPaymentReceiptDraft(payload,{user,database=db}) {
  requireAccounts(user,{write:true});
  const id=text(payload.id);
  if (!/^wamid\.[a-zA-Z0-9_+=\/-]{1,250}$/.test(id)) throw failure('Invalid WhatsApp message ID.');
  return database.transaction(async tx=>{
    await tx.query('SELECT pg_advisory_xact_lock(hashtextextended($1,0))',['receipt-draft:'+id]);
    const [prior]=await tx.rows('SELECT * FROM enlighten_operational.accounts_receipt_drafts WHERE id=$1 FOR UPDATE',[id]);
    if (prior&&prior.author!==user.email) throw failure('Receipt owner mismatch.',403);
    if (prior&&(prior.status==='ready'||Date.now()-new Date(prior.updated_at).getTime()<300000)) return {claimed:false,status:prior.status};
    const transactionId=prior?.transaction_id||randomUUID(),lease=randomUUID();
    await tx.query(`INSERT INTO enlighten_operational.accounts_receipt_drafts (id,author,transaction_id,status,lease)
      VALUES ($1,$2,$3,'processing',$4) ON CONFLICT (id) DO UPDATE SET
      lease=excluded.lease,updated_at=clock_timestamp(),data=NULL,status='processing'`,[id,user.email,transactionId,lease]);
    return {claimed:true,transactionId,lease};
  });
}

export async function finishPaymentReceiptDraft(payload,{user,database=db}) {
  requireAccounts(user,{write:true});
  const data=payload.draft,id=text(payload.id),lease=text(payload.lease);
  if (!data||typeof data!=='object'||Array.isArray(data)||JSON.stringify(data).length>12000) throw failure('Invalid draft.');
  return database.transaction(async tx=>{
    const [prior]=await tx.rows('SELECT * FROM enlighten_operational.accounts_receipt_drafts WHERE id=$1 FOR UPDATE',[id]);
    if (!prior||prior.author!==user.email||prior.lease!==lease) throw failure('Receipt lease expired.',409);
    const [attachment]=await tx.rows('SELECT transaction_id,author FROM enlighten_operational.accounts_transaction_attachments WHERE id=$1',[text(data.attachmentId)]);
    if (!attachment||attachment.author!==user.email||attachment.transaction_id!==prior.transaction_id) throw failure('Receipt attachment mismatch.',403);
    await tx.query("UPDATE enlighten_operational.accounts_receipt_drafts SET status='ready',updated_at=clock_timestamp(),data=$2::jsonb WHERE id=$1",[id,JSON.stringify(data)]);
    return {saved:true};
  });
}

export async function listPaymentReceiptDrafts(_payload,{user,database=db}) {
  requireAccounts(user,{write:true});
  return database.transaction(async tx=>{
    const rows=await tx.rows(`SELECT id,created_at,data FROM enlighten_operational.accounts_receipt_drafts AS draft
      WHERE author=$1 AND status='ready' AND NOT EXISTS (SELECT 1 FROM enlighten_operational.accounts_journal AS journal
        WHERE journal.cells->>'Record type'='transaction' AND journal.cells->>'Record ID'=draft.transaction_id::text)
      ORDER BY created_at,id`,[user.email]);
    return rows.map(row=>({id:row.id,createdAt:new Date(row.created_at).toISOString(),fields:row.data.fields}));
  },{readOnly:true});
}

export async function getPaymentReceiptDraft(payload,{user,database=db}) {
  requireAccounts(user,{write:true});
  return database.transaction(async tx=>{
    const [row]=await tx.rows("SELECT id,transaction_id,data FROM enlighten_operational.accounts_receipt_drafts WHERE id=$1 AND author=$2 AND status='ready'",
      [text(payload.id),user.email]);
    if (!row) throw failure('Receipt unavailable.',404);
    return {...row.data,id:row.id,transactionId:row.transaction_id};
  },{readOnly:true});
}
