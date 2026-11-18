// Parse the original tab-separated text without treating spreadsheet formulas as code.
export function parseOutputText(text,hasHeadings=true){
 text=String(text).replace(/^\uFEFF/,'');if(text.length>1200000)throw Error('Choose a text export under 1.2 MB.');
 const rows=[];let row=[],cell='',quoted=false;
 for(let i=0;i<text.length;i++){const ch=text[i];if(ch==='"'){if(quoted&&text[i+1]==='"'){cell+='"';i++}else if(quoted||cell==='')quoted=!quoted;else cell+=ch}else if(!quoted&&(ch==='\t'||ch==='\n'||ch==='\r')){row.push(cell);cell='';if(ch!=='\t'){if(ch==='\r'&&text[i+1]==='\n')i++;rows.push(row);row=[]}}else cell+=ch}
 if(quoted)throw Error('The text contains an unclosed quoted field.');if(cell||row.length){row.push(cell);rows.push(row)}
 while(rows.length&&rows[rows.length-1].every(x=>!x))rows.pop();if(!rows.length)throw Error('The text file is empty.');
 const width=Math.max(...rows.map(r=>r.length));if(width>80||rows.length>2001||rows.some(r=>r.some(c=>c.length>4000)))throw Error('Use up to 2,000 rows, 80 columns, and 4,000 characters per cell.');
 const headers=hasHeadings?rows.shift().map((h,i)=>h||`Column ${i+1}`):Array.from({length:width},(_,i)=>`Column ${i+1}`);
 while(headers.length<width)headers.push(`Column ${headers.length+1}`);
 return {headers,rows:rows.map(r=>Array.from({length:width},(_,i)=>r[i]||''))};
}
