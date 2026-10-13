import {EvidenceError} from './budget.mjs';
import {decodeUtf8,parseUniqueJson} from './json.mjs';
export function parseCsv(bytes,{fields,location,budget}){
  const text=decodeUtf8(bytes,location);const rows=[],lines=[];
  let row=[],cell='',state='start',line=1,startLine=1;
  const fail=()=>{throw new EvidenceError('csv-invalid',{file:location.file,pointer:`row:${startLine}`});};
  const endCell=()=>{row.push(cell);cell='';state='start';};
  const endRow=()=>{endCell();rows.push(row);lines.push(startLine);row=[];startLine=line+1;};
  for(let i=0;i<text.length;i++){
    if((i&1023)===0)budget.check(location);
    const c=text[i];
    if(state==='quoted'){
      if(c==='"'){if(text[i+1]==='"'){cell+='"';i++;}else state='after-quote';}
      else{cell+=c;if(c==='\n')line++;}
      continue;
    }
    if(c==='\r'&&text[i+1]!=='\n')fail();
    if(c==='\n'||c==='\r'){if(c==='\r')i++;endRow();line++;continue;}
    if(c===','){endCell();continue;}
    if(c==='"'){if(state!=='start')fail();state='quoted';continue;}
    if(state==='after-quote')fail();cell+=c;state='plain';
  }
  if(state==='quoted')fail();
  if(row.length||cell.length||state==='after-quote')endRow();
  if(rows.length===0)fail();
  const header=rows.shift();lines.shift();const names=Object.keys(fields);
  if(header.length!==names.length||new Set(header).size!==header.length||header.some(k=>!Object.hasOwn(fields,k)))fail();
  const records=rows.map((values,index)=>{
    startLine=lines[index];if(values.length!==header.length)fail();
    const record={};
    for(let j=0;j<header.length;j++){
      const key=header[j],value=values[j];
      const fieldLocation={file:location.file,pointer:`row:${startLine}/${key}`};
      switch(fields[key]){
        case 'string':record[key]=value;break;
        case 'boolean':if(value!=='true'&&value!=='false')fail();record[key]=value==='true';break;
        case 'integer':if(!/^(?:0|[1-9]\d*)$/.test(value)||!Number.isSafeInteger(Number(value)))fail();record[key]=Number(value);break;
        case 'nullable-integer':if(value==='null'){record[key]=null;break;}if(!/^(?:0|[1-9]\d*)$/.test(value)||!Number.isSafeInteger(Number(value)))fail();record[key]=Number(value);break;
        case 'json':record[key]=parseUniqueJson(Buffer.from(value),{location:fieldLocation,budget});break;
        default:fail();
      }
    }
    return record;
  });
  budget.check(location);return {records,rowLines:lines};
}
