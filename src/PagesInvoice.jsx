import React, {useCallback, useLayoutEffect, useState} from 'react';
import {createPortal} from 'react-dom';
import wordmark from './AccountsWordmark.svg?raw';
import layout from './PagesInvoice.css?raw';
import light from './invoice-assets/HelveticaNeue-Light.woff2?url';
import regular from './invoice-assets/HelveticaNeue.woff2?url';
import bold from './invoice-assets/HelveticaNeue-Bold.woff2?url';
import titleFont from './invoice-assets/EurostileBold.woff2?url';
import dateFont from './invoice-assets/Baskerville.woff2?url';
import courier from './invoice-assets/CourierNewPSMT.woff2?url';
import signature from './invoice-assets/signature.png';

const absolute=url=>new URL(url,window.location.href).href;
const fonts=()=>[['PagesLight',light],['PagesRegular',regular],['PagesBold',bold],['PagesTitle',titleFont],['PagesDate',dateFont],['PagesCourier',courier]].map(([name,url])=>`@font-face{font-family:${name};src:url("${absolute(url)}") format("woff2");font-weight:normal;font-style:normal;font-display:block;}`).join('\n');
const money=n=>new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR'}).format((n||0)/100);
const lineMoney=n=>money(n).replace(/\.00$/,'');
const date=value=>value?.split('-').reverse().join('.')||'—';

export async function printPagesInvoice(host,title){
  const frame=document.createElement('iframe');
  frame.style.cssText='position:fixed;width:0;height:0;border:0;bottom:0;right:0';
  document.body.appendChild(frame);
  const win=frame.contentWindow,doc=win.document;
  doc.title=title||'Enlighten Invoice';
  doc.head.innerHTML='<meta charset="utf-8">';
  doc.body.innerHTML=host.shadowRoot.innerHTML;
  const paper=doc.querySelector('.pages-paper');
  paper.style.transform='none';
  const style=doc.createElement('style');
  style.textContent='@page{size:A4;margin:0}html,body{margin:0;padding:0;background:white}.pages-paper{margin:0!important;box-shadow:none!important}';
  doc.head.appendChild(style);
  try{
    await Promise.all(['PagesLight','PagesRegular','PagesBold','PagesTitle','PagesDate','PagesCourier'].map(name=>doc.fonts.load('12pt '+name)));
    await doc.fonts.ready;
    await Promise.all([...doc.images].map(img=>img.decode().catch(()=>{})));
    win.addEventListener('afterprint',()=>frame.remove(),{once:true});
    win.focus();win.print();
  }catch(error){frame.remove();throw error;}
}

export default function PagesInvoice({invoice:r,printRef,ledger}){
  const [host,setHost]=useState(null),[root,setRoot]=useState(null);
  const attach=useCallback(node=>{
    if(printRef)printRef.current=node;
    setHost(node);
    if(node)setRoot(node.shadowRoot||node.attachShadow({mode:'open'}));
  },[printRef]);
  useLayoutEffect(()=>{
    if(!host||!root)return;
    if(!document.getElementById('pages-invoice-fonts')){
      const style=document.createElement('style');style.id='pages-invoice-fonts';style.textContent=fonts();document.head.appendChild(style);
    }
    const paper=root.querySelector('.pages-paper');
    const resize=()=>{
      const scale=Math.min(1,host.clientWidth/(595.28*96/72));
      paper.style.transform=`scale(${scale})`;
      host.style.height=`${paper.offsetHeight*scale}px`;
    };
    const observer=new ResizeObserver(resize);observer.observe(host);observer.observe(paper);
    resize();root.querySelectorAll('img').forEach(img=>img.addEventListener('load',resize));
    document.fonts.ready.then(resize);
    return()=>observer.disconnect();
  },[host,root,r,ledger]);
  return <article className="pages-invoice-host" ref={attach} style={{width:'100%',maxWidth:'793.707px',margin:'0 auto',padding:0,background:'white',border:0}}>
    {root&&createPortal(<><style>{fonts()+layout}</style><div className={ledger?"pages-paper ledger-paper":"pages-paper"}>
      <div className="brand" dangerouslySetInnerHTML={{__html:wordmark.replaceAll('#fff0cf','#252525')}}/>
      <div className="brand-rule"/>
      <div className="issuer">{r.issuerAddress||'E-256, Naraina Vihar, New Delhi 110028'}<br/>Phone : +91 9999277482, Email : design.enlighten@gmail.com<br/>GSTIN: 07AAKFE5187A1ZI</div>
      {ledger?<LedgerBody ledger={ledger}/>:<>
      <h1>{(r.documentType||'Invoice').toUpperCase()}</h1>
      <div className="invoice-date">{date(r.date)}</div>
      <section className="details">
        <div className="recipient">To,<br/><b>{r.client}</b>{r.clientDivision&&<><br/><b>{r.clientDivision}</b></>}<br/><b>Address :</b> {r.address}<div className="state">State: {r.state}<br/>State Code: {r.stateCode}<br/>{r.taxIdLabel||'GSTIN.'}: {r.gstin}</div></div>
        <div className="references">Purchase Order/Ref. No: {r.po||'—'}<br/>Invoice No.: {r.number}<br/>Contract/Order Date: {date(r.orderDate)}<br/>Project Name: {r.projectName}<div className="contact">Contact Person: {r.contact}<br/>Contact No:{r.phone}</div></div>
      </section>
      <main>
        {r.incompleteHistory&&<p>Service lines and billing details await the original invoice document.</p>}
        <table aria-label="Invoice services"><colgroup>{[32.98,173.56,63.54,31.10,29.64,63.79,78.83].map((w,i)=><col key={i} style={{width:w+'pt'}}/>)}</colgroup>
          <thead><tr>{['S.\nNo.','Description of Services','SAC Code','Unit','Qty','Unit Rate','Total Amount'].map(x=><th key={x}>{x}</th>)}</tr></thead>
          <tbody>{(r.items||[]).map((item,i)=><tr className="service" key={i}><td>{i+1}</td><td>{item.description}</td><td>{item.sac}</td><td>{item.unit}</td><td>{item.displayQuantity||item.quantity}</td><td>{lineMoney(item.rate)}</td><td>{lineMoney(item.amount)}</td></tr>)}
          <tr className="sum"><td colSpan="5"/><td>Subtotal</td><td>{money(r.amount)}</td></tr>
          <tr className="sum grand"><td colSpan="5"/><td>Total</td><td>{money(r.amount)}</td></tr></tbody>
        </table>
        <footer><p className="words">Rupees: {r.words}</p><p className="declaration"><b>Declaration:</b> Composition taxable person, not eligible to collect taxes on supplies</p>
          <p className="remittance">Kindly note our Bank Account Number and IFSC for INR remittances:</p>
          <img className="signature" src={absolute(signature)} alt="For Enlighten Designs — Shivam Gupta, Partner"/>
          <p className="bank">NAME: Enlighten Designs<br/>A/C#: <b>10148974324</b><br/>IFSC: <b>IDFB0020126</b><br/>BANK: IDFC First, Punjabi Bagh</p>
        </footer>
      </main>
      </>}
    </div></>,root)}
  </article>;
}

function LedgerBody({ledger}){
  const {party,profile,from,to,entries,opening}=ledger;
  const debit=entries.reduce((sum,row)=>sum+row.debit,0);
  const credit=entries.reduce((sum,row)=>sum+row.credit,0);
  const closing=opening+debit-credit;
  const balance=n=>n===0?money(0):(n>0?'Dr. ':'Cr. ')+money(Math.abs(n));
  const type=record=>({invoice:'Design invoice',receipt:'Receipt',transaction:'Transaction',reconciliation:'Bank transaction',opening:'Opening journal'}[record.kind]||record.documentType||record.kind);
  const label=record=>[record.head,record.description,record.projectName].filter(Boolean).join(' · ')||type(record);
  return <>
    <h1>PARTY LEDGER ACCOUNT</h1>
    <div className="ledger-party-details">
      <div><b>Party name:</b> {party.name}<br/><b>Address:</b> {profile.address||'—'}<br/><b>GSTIN:</b> {profile.gstin||'—'}</div>
      <div><b>Contact:</b> {[profile.contact,profile.phone].filter(Boolean).join(' · ')||'—'}<br/><b>Email:</b> {profile.contactEmail||'—'}<br/><b>Period:</b> {from?date(from):'All dates'}{to?' to '+date(to):''}</div>
    </div>
    <main className="ledger-main">
      <table aria-label="Party ledger statement">
        <colgroup>{[57,138,68,76,68,68,76].map((width,i)=><col key={i} style={{width:width+'pt'}}/>)}</colgroup>
        <thead><tr>{['Date','Particulars','Voucher type','Voucher no.','Debit','Credit','Closing balance'].map(label=><th key={label} scope="col">{label}</th>)}</tr></thead>
        <tbody>
          <tr className="ledger-total"><td colSpan={4}>Opening balance</td><td>{opening>0?money(opening):'—'}</td><td>{opening<0?money(-opening):'—'}</td><td>{balance(opening)}</td></tr>
          {entries.map(({record,debit,credit,balance:running},i)=><tr key={record.id||i}><td>{date(record.date)}</td><td>{label(record)}</td><td>{type(record)}</td><td>{record.reference||record.number||'—'}</td><td>{debit?money(debit):'—'}</td><td>{credit?money(credit):'—'}</td><td>{balance(running)}</td></tr>)}
          {!entries.length&&<tr><td colSpan={7}>No posted entries in this period.</td></tr>}
          <tr className="ledger-total"><td colSpan={4}>Period subtotal</td><td>{money(debit)}</td><td>{money(credit)}</td><td>{balance(debit-credit)}</td></tr>
          <tr className="ledger-total"><td colSpan={4}>Total including opening</td><td>{money(debit+Math.max(opening,0))}</td><td>{money(credit+Math.max(-opening,0))}</td><td>{balance(closing)}</td></tr>
          <tr className="ledger-total"><td colSpan={6}>Closing balance</td><td>{balance(closing)}</td></tr>
        </tbody>
      </table>
    </main>
  </>;
}
