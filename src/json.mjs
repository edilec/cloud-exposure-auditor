import {EvidenceError,LIMITS} from './budget.mjs';
export function decodeUtf8(bytes,location){
  try{return new TextDecoder('utf-8',{fatal:true}).decode(bytes);}catch{throw new EvidenceError('utf8-invalid',location);}
}
export function parseUniqueJson(bytes,{location,budget}){
  const text=decodeUtf8(bytes,location);const stack=[];
  const invalid=()=>{throw new EvidenceError('input-invalid',location);};
  budget.check(location);
  for(let i=0;i<text.length;){
    if((i&1023)===0)budget.check(location);
    const c=text[i],top=stack.at(-1);
    if(c==='"'){
      const start=i++;let closed=false;
      while(i<text.length){if((i&1023)===0)budget.check(location);if(text[i]==='\\'){i+=2;continue;}if(text[i++]==='"'){closed=true;break;}}
      if(!closed)invalid();
      let token;try{token=JSON.parse(text.slice(start,i));}catch{invalid();}
      if(top?.kind==='object'&&top.key){if(top.seen.has(token))throw new EvidenceError('duplicate-json-key',location);top.seen.add(token);top.key=false;}
      continue;
    }
    if(c==='{'||c==='['){stack.push({kind:c==='{'?'object':'array',key:true,seen:new Set()});if(stack.length>LIMITS.depth)throw new EvidenceError('depth-limit',location);i++;continue;}
    if(c==='}'||c===']'){if(!top||top.kind!==(c==='}'?'object':'array'))invalid();stack.pop();i++;continue;}
    if(c===','){if(top?.kind==='object')top.key=true;i++;continue;}
    if(c===':'||c===' '||c==='\t'||c==='\r'||c==='\n'){i++;continue;}
    if(c==='t'&&text.slice(i,i+4)==='true'){i+=4;continue;}
    if(c==='f'&&text.slice(i,i+5)==='false'){i+=5;continue;}
    if(c==='n'&&text.slice(i,i+4)==='null'){i+=4;continue;}
    const number=text.slice(i).match(/^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/);
    if(number){const value=Number(number[0]);if(!/^-?(?:0|[1-9]\d*)$/.test(number[0])||!Number.isSafeInteger(value))invalid();i+=number[0].length;continue;}
    invalid();
  }
  if(stack.length)invalid();
  let value;try{value=JSON.parse(text);}catch{invalid();}
  budget.check(location);return value;
}
