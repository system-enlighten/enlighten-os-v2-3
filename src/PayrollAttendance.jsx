import React,{useEffect,useState} from 'react';
import {readAttendanceReport} from './payroll-attendance.mjs';

const indiaDate=()=>new Date().toLocaleDateString('sv-SE',{timeZone:'Asia/Kolkata'});
export default function PayrollAttendance({employees,request,readOnly}){
 const [month,setMonth]=useState(()=>indiaDate().slice(0,7));
 const [employee,setEmployee]=useState('');
 const [rows,setRows]=useState([]),[report,setReport]=useState(null);
 const [mapping,setMapping]=useState({}),[revision,refresh]=useState(0);
 const [busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState('');
 const year=month.slice(0,4);
 useEffect(()=>{
  let live=true;
  setRows([]);
  request('getPayrollMachineAttendance',{year},'POST').then(records=>{if(live)setRows(records);})
   .catch(error=>{if(live)setError(error.message);});
  return()=>{live=false;};
 },[year,revision]);
 async function open(event){
  const file=event.target.files[0];
  event.target.value='';
  if(!file)return;
  setBusy(true);setError('');setNotice('');setReport(null);
  try{
   const people=await readAttendanceReport(file);
   if(!people.length)throw Error('This report contains no punches.');
   const normalize=name=>name.trim().replace(/\s+/g,' ').toLowerCase();
   setMapping(Object.fromEntries(people.map(person=>{
    const named=employees.filter(employee=>normalize(employee.name)===normalize(person.name));
    return [person.id,named.length===1?named[0].id:''];
   })));
   setReport(people);
  }catch(error){setError(error.message);}
  finally{setBusy(false);}
 }
 async function save(){
  setBusy(true);setError('');setNotice('');
  const punches=report.flatMap(person=>person.days.map(day=>({...day,employeeId:mapping[person.id]})));
  try{
   const result=await request('importPayrollMachineAttendance',{rows:punches},'POST',90000);
   setEmployee(punches[0].employeeId);setMonth(punches[0].date.slice(0,7));
   setReport(null);refresh(value=>value+1);
   setNotice(result.saved?`${result.saved} employee days saved.`:'These punches are already up to date.');
  }catch(error){setError(error.message);}
  finally{setBusy(false);}
 }
 const employeeRows=new Map(rows.filter(row=>row.employeeId===employee&&row.date.startsWith(month+'-')).map(row=>[row.date,row]));
 const dates=Array.from({length:new Date(Date.UTC(Number(year),Number(month.slice(5)),0)).getUTCDate()},(_,i)=>month+'-'+String(i+1).padStart(2,'0'));
 const mapped=report?.map(person=>mapping[person.id])||[];
 return <section className="accounts-preview">
  <h2>Attendance</h2>
  <div className="accounts-toolbar">
   <label>Employee <select value={employee} onChange={event=>setEmployee(event.target.value)}>
    <option value="">Select employee</option>
    {employees.map(person=><option key={person.id} value={person.id}>{person.name}</option>)}
   </select></label>
   <label>Month <input type="month" value={month} onChange={event=>{if(event.target.value)setMonth(event.target.value);}}/></label>
   {!readOnly&&<label>Upload attendance report <input type="file" accept=".xls,.xlsx" disabled={busy} onChange={open}/></label>}
  </div>
  {error&&<p role="alert" className="accounts-error">{error}</p>}
  {notice&&<p role="status">{notice}</p>}
  {report&&<>
   <h3>Match machine users to employees</h3>
   <div className="accounts-scroll"><table>
    <thead><tr><th>Machine user</th><th>Days with punches</th><th>Employee</th></tr></thead>
    <tbody>{report.map(person=><tr key={person.id}>
     <td>{person.name} · {person.id}</td><td>{person.days.length}</td>
     <td><select aria-label={`Employee for ${person.name}`} disabled={busy} value={mapping[person.id]} onChange={event=>setMapping({...mapping,[person.id]:event.target.value})}>
      <option value="">Select employee</option>
      {employees.map(employee=><option key={employee.id} value={employee.id}>{employee.name}</option>)}
     </select></td>
    </tr>)}</tbody>
   </table></div>
   <div className="accounts-toolbar">
    <button type="button" disabled={busy||mapped.some(id=>!id)||new Set(mapped).size!==mapped.length} onClick={save}>Import attendance</button>
    <button type="button" disabled={busy} onClick={()=>setReport(null)}>Cancel</button>
   </div>
  </>}
  {employee&&<>
   <p>{[...employeeRows.values()].filter(row=>row.checkIn).length} days with check-in</p>
   <div className="accounts-scroll"><table>
    <thead><tr><th>Date</th><th>Check-in (IST)</th><th>Check-out (IST)</th><th>Status</th></tr></thead>
    <tbody>{dates.map(date=>{
     const day=employeeRows.get(date);
     return <tr key={date}><td>{date}</td><td>{day?.checkIn||'—'}</td><td>{day?.checkOut||'—'}</td><td>{day?.checkIn&&day.checkOut?'Present':day?'Incomplete punch':'—'}</td></tr>;
    })}</tbody>
   </table></div>
  </>}
 </section>;
}
