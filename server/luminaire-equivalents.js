import {createHash,randomBytes} from 'node:crypto';
import {db} from './supabase-db.js';
import {checkProjectRead,requireProject} from './permissions.js';
import {failure,text} from './project-write-storage.js';
import {buildItems,buildOffer} from './luminaire-rules.js';

const hash=value=>createHash('sha256').update(value).digest('base64url');
export async function createLuminaireInvitation(p,{user,database=db,clock=Date.now}) {
  const projectId=text(p.projectId),items=buildItems(p);
  requireProject(user,projectId,{admin:true,write:true});
  return database.transaction(async tx=>{
    await checkProjectRead(tx,user,projectId);
    const token=randomBytes(32).toString('hex'),expires=new Date(clock()+30*86400000).toISOString();
    await tx.query('INSERT INTO enlighten_operational.luminaire_invitations (token_hash,project_id,expires,items) VALUES ($1,$2,$3,$4::jsonb)',
      [hash(token),projectId,expires,JSON.stringify(items)]);
    return {token,expires};
  });
}
async function vendor(p,{database=db,clock=Date.now}={},submit=false) {
  if (typeof p.token!=='string'||!/^[a-f0-9]{64}$/i.test(p.token)) throw failure('This invitation is invalid or has expired.');
  return database.transaction(async tx=>{
    const [link]=await tx.rows('SELECT project_id,expires,items FROM enlighten_operational.luminaire_invitations WHERE token_hash=$1',[hash(p.token)]);
    if (!link||Date.parse(link.expires)<=clock()) throw failure('This invitation is invalid or has expired.');
    const item=link.items.find(row=>row.id===p.itemId);
    if (!item) throw failure('This schedule item is unavailable.');
    if (!submit) return {item};
    const offer=buildOffer(p,item),offerId='LUM-'+hash([p.token,item.id,p.submissionId].join('|')).slice(0,32);
    await tx.query('INSERT INTO enlighten_operational.luminaire_equivalent_offers (offer_id,project_id,received_at,offer) VALUES ($1,$2,$3,$4::jsonb) ON CONFLICT (offer_id) DO NOTHING',
      [offerId,link.project_id,new Date(clock()).toISOString(),JSON.stringify(offer)]);
    return {offerId};
  },{readOnly:!submit});
}
export const getVendorLuminaireItem=(p,context)=>vendor(p,context);
export const submitVendorLuminaireOffer=(p,context)=>vendor(p,context,true);

export async function listLuminaireEquivalentOffers(p,{user,database=db}) {
  const id=text(p.projectId);
  requireProject(user,id,{admin:true,write:true});
  return database.transaction(async tx=>{
    await checkProjectRead(tx,user,id);
    return (await tx.rows('SELECT offer_id,received_at,offer FROM enlighten_operational.luminaire_equivalent_offers WHERE project_id=$1 ORDER BY received_at,offer_id',[id]))
      .map(row=>({offerId:row.offer_id,receivedAt:new Date(row.received_at).toISOString(),...row.offer}));
  },{readOnly:true});
}
