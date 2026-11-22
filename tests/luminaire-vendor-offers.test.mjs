import assert from 'node:assert/strict';
import test from 'node:test';
import vm from 'node:vm';
import fs from 'node:fs';
import {createHash,randomUUID} from 'node:crypto';
import {draftProductFromSheet} from '../server/product-ai.js';

test('vendor links scope submissions to issued items and deduplicate retries',()=>{
 const db=new Map();
 const rows=table=>db.get(table)||[];
 const ctx=vm.createContext({
  Utilities:{getUuid:randomUUID,DigestAlgorithm:{SHA_256:'sha256'},computeDigest:(_,s)=>createHash('sha256').update(s).digest(),base64EncodeWebSafe:b=>b.toString('base64url')},
  requireFields_:()=>{},technicalImportAdmin_:id=>assert.equal(id,'project-1'),ensureProjectAccessTable_:()=>{},withLock_:f=>f(),
  findRow_:(t,k,v)=>{const object=rows(t).find(r=>r[k]===v);return object&&{object};},
  readTable_:rows,appendObject_:(t,v)=>db.set(t,[...rows(t),v])
 });
 vm.runInContext(fs.readFileSync(new URL('../../AppsScript_Backend_v2.4/LuminaireEquivalents.gs',import.meta.url),'utf8'),ctx);
 const {token}=ctx.createLuminaireInvitation_({projectId:'project-1',items:[{id:'D1|pcs',code:'D1',quantity:3,unit:'Pc'}]});
 assert.equal(ctx.vendorLuminaireEquivalent_({token,itemId:'D1|pcs'},false).item.code,'D1');
 assert.throws(()=>ctx.vendorLuminaireEquivalent_({token,itemId:'other'},false),/unavailable/);
 const payload={token,itemId:'D1|pcs',submissionId:randomUUID(),offer:{vendor:'Vendor',email:'person@example.com',brand:'Brand',model:'M1',price:'25',currency:'INR',warranty:'3 years',documents:[{name:'IP test report',url:'https://example.com/report.pdf'}]}};
 const first=ctx.vendorLuminaireEquivalent_(payload,true);
 assert.equal(ctx.vendorLuminaireEquivalent_(payload,true).offerId,first.offerId);
 const offers=ctx.listLuminaireEquivalentOffers_({projectId:'project-1'});
 assert.equal(offers.length,1);
 assert.equal(offers[0].documents[0].name,'IP test report');
 rows('LuminaireInvitations')[0].expires='2000-01-01T00:00:00.000Z';
 assert.throws(()=>ctx.vendorLuminaireEquivalent_({token,itemId:payload.itemId},false),/expired/);
});

test('catalogue import sends images as image input and PDFs as files',async()=>{
 for(const [name,type] of [['fixture.jpg','input_image'],['fixture.pdf','input_file']]){
  const draft=await draftProductFromSheet({name,base64:'YQ=='},{OPENAI_API_KEY:'test'},async(_url,init)=>{
   const body=JSON.parse(init.body);assert.equal(body.input[0].content[1].type,type);
   const shape=body.text.format.schema.properties.products.items.properties.specs.properties.specSheet;
   assert.ok(shape.properties.mounting);
   return {ok:true,json:async()=>({output:[{content:[{type:'output_text',text:JSON.stringify({products:[],warnings:[]})}]}]})};
  });
  assert.equal(draft.requiresReview,true);
 }
});
