export async function readAttendanceReport(file){
 if(!/\.xlsx?$/i.test(file.name)||file.size>5*1024*1024)throw Error('Choose an XLS or XLSX attendance report under 5 MB.');
 const x=await import('xlsx');
 const book=x.read(await file.arrayBuffer(),{type:'array'});
 const people=new Map();
 for(const sheet of book.SheetNames){
  const grid=x.utils.sheet_to_json(book.Sheets[sheet],{header:1,raw:false,defval:''});
  for(const [row,values] of grid.entries()){
   for(const [column,value] of values.entries()){
    if(value!=='Time Card')continue;
    const id=String(grid[row-5]?.[column+9]||'').trim();
    const name=String(grid[row-6]?.[column+9]||'').trim();
    const range=String(grid[row-5]?.[column+1]||'').match(/^(\d{4}-\d{2}-\d{2})\s*~\s*(\d{4}-\d{2}-\d{2})$/);
    if(!id&&!name)continue;
    if(!id||!name||!range||grid[row-5]?.[column+8]!=='User ID')throw Error('A Time Card is missing its employee or date range.');
    const start=Date.parse(range[1]),end=Date.parse(range[2]);
    if(!Number.isFinite(start)||!Number.isFinite(end)||end<start||end-start>=31*86400000)throw Error('Invalid Time Card date range.');
    if(!people.has(id))people.set(id,{id,name,days:[]});
    const person=people.get(id);
    if(person.name!==name)throw Error('A machine user ID has different names in this report.');
    for(let day=start;day<=end;day+=86400000){
     const date=new Date(day).toISOString().slice(0,10);
     const cells=grid[row+3+(day-start)/86400000];
     if(!cells||Number(String(cells[column]).split(/\s/)[0])!==Number(date.slice(-2)))throw Error('Time Card days do not match the report range.');
     const times=label=>Array.from({length:14},(_,i)=>column+i+1)
      .filter(index=>grid[row+2]?.[index]===label)
      .map(index=>String(cells[index]||'').trim())
      .filter(Boolean).map(time=>{
       if(!/^([01]?\d|2[0-3]):[0-5]\d$/.test(time))throw Error('Invalid punch time in the Time Card for '+date+'.');
       return time.padStart(5,'0');
      }).sort();
     const checkIn=times('In')[0]||'',checkOut=times('Out').at(-1)||'';
     if(checkIn||checkOut)person.days.push({date,checkIn,checkOut});
    }
   }
  }
 }
 if(!people.size)throw Error('No employee Time Cards found in the attendance report.');
 return [...people.values()].filter(person=>person.days.length);
}
