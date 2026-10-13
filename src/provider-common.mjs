import {isIP} from 'node:net';
import {EvidenceError} from './budget.mjs';
import {objectKeys,requireFact,integer,text,utcInstant,FIELDS} from './schema.mjs';
import {finding} from './report.mjs';
const fallback={file:'@manifest',pointer:''};
function cidrBroad(cidr,location){
  requireFact(typeof cidr==='string'&&cidr.length<=100,location);
  const parts=cidr.split('/');requireFact(parts.length===2&&/^(?:0|[1-9]\d*)$/.test(parts[1]),location);
  const address=parts[0];requireFact(!address.includes('%'),location);
  const version=isIP(address);let prefix=Number(parts[1]),bits,value;
  requireFact(version!==0,location);
  if(version===4){bits=32;value=address.split('.').reduce((n,p)=>(n<<8n)|BigInt(p),0n);}
  else{
    bits=128;let a=address.toLowerCase();
    if(a.includes('.')){const pos=a.lastIndexOf(':');const v4=a.slice(pos+1).split('.').map(Number);a=a.slice(0,pos+1)+((v4[0]<<8)|v4[1]).toString(16)+':'+((v4[2]<<8)|v4[3]).toString(16);}
    const halves=a.split('::'),left=halves[0]?halves[0].split(':'):[],right=halves.length===2&&halves[1]?halves[1].split(':'):[];
    const groups=halves.length===2?[...left,...Array(8-left.length-right.length).fill('0'),...right]:left;
    value=groups.reduce((n,p)=>(n<<16n)|BigInt(`0x${p}`),0n);
  }
  requireFact(integer(prefix,0,bits),location);
  const mask=((1n<<BigInt(bits))-1n)^((1n<<BigInt(bits-prefix))-1n);
  requireFact((value&~mask)===0n,location);
  if(bits===128){
    const mapped=0xffffn<<32n;
    if(prefix<=96&&(mapped&mask)===value)return true;
    if((value>>32n)===0xffffn){bits=32;prefix-=96;}
  }
  return prefix<=(bits===32?8:32);
}
export function broadAdminIngress({protocol,ports,cidrs,location=fallback}){
  requireFact(['tcp','udp','all'].includes(protocol)&&Array.isArray(ports)&&Array.isArray(cidrs)&&cidrs.length>0,location);
  for(const p of ports){objectKeys(p,['from','to'],location);requireFact(integer(p.from,0,65535)&&integer(p.to,0,65535)&&p.from<=p.to,location);}
  requireFact(protocol==='all'||ports.length>0,location);
  const broad=cidrs.map(c=>cidrBroad(c,location)).some(Boolean);
  return protocol!=='udp'&&broad&&(protocol==='all'||[22,3389,5985,5986].some(port=>ports.some(p=>p.from<=port&&p.to>=port)));
}
export function keyAgeExceeded({createdAt,active},{nowMs,keyAgeDays,location=fallback}){
  const created=utcInstant(createdAt);requireFact(Number.isFinite(created)&&created<=nowMs,location,'date-invalid');requireFact(typeof active==='boolean',location);
  return active&&nowMs-created>keyAgeDays*86400000;
}
export function effectiveMfa(record,{allowedKinds,allowedBases,location=fallback}){
  requireFact(allowedKinds.includes(record.principalKind)&&typeof record.privileged==='boolean',location);
  objectKeys(record.mfa,['status','basis','effective'],location);
  const m=record.mfa;requireFact(['enabled','disabled'].includes(m.status)&&allowedBases.includes(m.basis)&&m.effective===true,location);
  requireFact(record.principalKind==='federated'?m.basis==='federated':m.basis!=='federated',location);
  return record.privileged&&m.status==='disabled';
}
export function validateRecord(row,provider,klass,location){
  const fields={id:'string',region:'string',...FIELDS[provider][klass]};objectKeys(row,Object.keys(fields),location);
  for(const [k,type]of Object.entries(fields)){
    const value=row[k],at={file:location.file,pointer:location.pointer+'/'+k};
    if(type==='string')requireFact(text(value,k==='region'?64:256),at);
    if(type==='boolean')requireFact(typeof value==='boolean',at);
    if(type==='integer')requireFact(integer(value),at);
    if(type==='nullable-integer')requireFact(value===null||integer(value),at);
  }
  requireFact(['keys','mfa'].includes(klass)?row.region==='global':row.region!=='global',location);
}
export function evaluateRecords(bundle,evaluateOne,context){
  const findings=[],coveredRegions=new Set();let checked=0,incomplete=false;
  for(const [i,row]of bundle.records.entries()){
    const location={file:bundle.role,pointer:bundle.pointerFor(i)};
    try{
      context.budget.check(location);const observations=evaluateOne(row,{...context,location,bundle});checked++;
      if(bundle.evidenceClass==='logging')for(const region of row.coverageRegions??[row.region])coveredRegions.add(region);
      for(const [id,field]of observations)findings.push(finding(id,{file:bundle.role,pointer:bundle.pointerFor(i,field)}));
    }catch(e){if(!(e instanceof EvidenceError))throw e;incomplete=true;findings.push(finding(e.ruleId,e.location??location));if(e.ruleId==='time-limit')break;}
  }
  return {findings,checked,incomplete,coveredRegions};
}
export function runAdapter(bundles,evaluateOne,context){
  const result={findings:[],checked:0,incompleteClasses:new Set()},expectedLogging=new Set(),coveredLogging=new Set();let loggingRole;
  for(const bundle of bundles){const r=evaluateRecords(bundle,(row,ctx)=>evaluateOne(bundle.evidenceClass,row,ctx),context);result.findings.push(...r.findings);result.checked+=r.checked;if(r.incomplete)result.incompleteClasses.add(bundle.evidenceClass);if(bundle.evidenceClass==='logging'){loggingRole??=bundle.role;for(const region of bundle.coverage.regions)expectedLogging.add(region);for(const region of r.coveredRegions)coveredLogging.add(region);}}
  if([...expectedLogging].some(r=>!coveredLogging.has(r))){result.findings.push(finding('region-incomplete',{file:loggingRole,pointer:''}));result.incompleteClasses.add('logging');}
  return result;
}
