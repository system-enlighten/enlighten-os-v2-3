import test from 'node:test';
import assert from 'node:assert/strict';
import {createHmac} from 'node:crypto';
import {receiptFields,readPaymentReceipt} from '../server/payment-receipts.js';
import {validWhatsAppSignature} from '../api/whatsapp.js';
test('Receipt fields cannot invent unsupported accounts, direction or classifications',()=>{assert.deepEqual(receiptFields({bank:'HDFC',direction:'Debit',date:'2026-02-31',amount:'1,000',projectId:'attack',head:'Revenue'}),{direction:'',date:'',paymentMode:'',bank:'',amount:'',description:''});});
test('Explicit receipt values survive review draft',()=>{assert.equal(receiptFields({amount:'1200.50',direction:'Outflow',bank:'IDFC',date:'2026-11-21',paymentMode:'UPI',description:'Site payment'}).amount,'1200.50');});
test('WhatsApp verifies exact raw body and rejects tampering',()=>{const raw=Buffer.from('{"message":1}'),sig='sha256='+createHmac('sha256','testsecret').update(raw).digest('hex');assert.equal(validWhatsAppSignature(raw,sig,'testsecret'),true);assert.equal(validWhatsAppSignature(Buffer.from('{}'),sig,'testsecret'),false);assert.equal(validWhatsAppSignature(raw,sig,''),false);});
test('Receipt input rejects URLs and oversized input before external call',async()=>{await assert.rejects(readPaymentReceipt('https://example.com/private.png'));await assert.rejects(readPaymentReceipt('x'.repeat(4200001)));});
