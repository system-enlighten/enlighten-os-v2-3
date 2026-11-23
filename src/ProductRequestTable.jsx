import React,{useState} from 'react';
import './PartnerHistory.css';

function RequestRow({record,icon,thumbnail,busy,onSave,onRemove}){
 const [values,setValues]=useState(()=>({...record,location:record.location||'',result:record.result||''}));
 const set=(key,value)=>setValues(current=>({...current,[key]:value}));
 const closed=record.status==='closed';
 const purchaseOrder=record.kind==='purchase-order';
 const valid=Number(values.quantity)>0&&values.location.trim();
 return <tr>
  <td>{icon&&<img src={icon} alt=""/>}</td>
  <td>{thumbnail&&<img src={thumbnail} alt=""/>}</td>
  <td>{record.article}</td>
  <td>{closed?record.quantity:<input type="number" min="0.000001" max="100000000" step="any" aria-label="Required quantity" value={values.quantity} disabled={busy} onChange={e=>set('quantity',e.target.value)}/>} {record.unit}</td>
  <td>{closed?record.location:<input aria-label="Request location" maxLength={500} value={values.location} disabled={busy} onChange={e=>set('location',e.target.value)}/>}</td>
  {purchaseOrder&&<td>{closed?record.reference:<input aria-label="PO reference" maxLength={300} value={values.reference||''} disabled={busy} onChange={e=>set('reference',e.target.value)}/>}</td>}
  <td>{closed?record.result:<textarea aria-label="Request result" placeholder="Enter the result to close" maxLength={2000} value={values.result} disabled={busy} onChange={e=>set('result',e.target.value)}/>}</td>
  <td>{closed?'Closed':<>
   <button type="button" disabled={busy||!valid} onClick={()=>onSave({...values,requestStatus:'open'})}>{record.version?'Save changes':'Save request'}</button>
   {record.version?<button type="button" disabled={busy||!valid||!values.result.trim()||purchaseOrder&&!values.reference?.trim()} onClick={()=>onSave({...values,requestStatus:'closed'})}>Close with result</button>:<button type="button" disabled={busy} onClick={onRemove}>Remove row</button>}
  </>}</td>
 </tr>;
}

export default function ProductRequestTable({kind,records,product,fitting,group,projectId,context,busy,onSave,onBack}){
 const [newRows,setNewRows]=useState([]);
 const article=product.specs?.article||product.model;
 const rows=records.filter(record=>record.kind===kind&&record.productId===product.id&&record.fittingId===fitting.id);
 const unsaved=newRows.filter(row=>!rows.some(record=>record.id===row.id));
 const title=kind==='sample'?'Sample requests':kind==='mockup'?'Mockup requests':'Release PO';
 const purchaseOrder=kind==='purchase-order';
 function addRow(){
  setNewRows(current=>[...current,{id:'product-action-'+crypto.randomUUID(),kind,projectId,fittingId:fitting.id,productId:product.id,code:group.code,brand:product.brand,article,quantity:purchaseOrder?group.quantity:1,unit:group.unit||'pcs',location:context.area||''}]);
 }
 return <section className="partner-history assessment-product-requests">
  <header className="partner-actions"><h3>{title}</h3><button type="button" disabled={busy} onClick={addRow}>Add row</button></header>
  <div className="partner-table-wrap"><table aria-label={title}>
   <thead><tr>{['Icon','Thumbnail','Article number','Required quantity','Location',...(purchaseOrder?['PO reference']:[]),'Result','Actions'].map(label=><th scope="col" key={label}>{label}</th>)}</tr></thead>
   <tbody>{[...rows,...unsaved].map(record=><RequestRow key={record.id} record={record} icon={fitting.iconUrl} thumbnail={product.imageUrl||fitting.thumbnailUrl} busy={busy} onSave={onSave} onRemove={()=>setNewRows(current=>current.filter(row=>row.id!==record.id))}/>)}
   {!rows.length&&!unsaved.length&&<tr><td colSpan={purchaseOrder?8:7}>Use Add row to record a request.</td></tr>}</tbody>
  </table></div>
  <div><button type="button" disabled={busy} onClick={onBack}>Back to spec sheet</button></div>
 </section>;
}
