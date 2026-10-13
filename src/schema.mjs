import {EvidenceError} from './budget.mjs';
export const CLASS_IDS=Object.freeze(['storage','ingress','keys','mfa','logging']);
export const SOURCE_KINDS=Object.freeze({aws:{storage:['storage-public-policy'],ingress:['ec2-security-groups'],keys:['iam-credential-report','access-key-inventory'],mfa:['mfa-state'],logging:['cloudtrail-status']},azure:{storage:['azure-storage-public-settings'],ingress:['azure-nsg-rules'],keys:['azure-key-inventory'],mfa:['entra-privileged-mfa'],logging:['azure-diagnostic-settings']},gcp:{storage:['gcs-public-settings'],ingress:['gcp-vpc-firewall'],keys:['service-account-key-inventory'],mfa:['cloud-identity-mfa'],logging:['cloud-audit-logs']}});
const forbidden=/[\u0000-\u001f\u007f-\u009f\u2028\u2029\p{Cf}]/u;
export function requireFact(ok,location,ruleId='unsupported-field'){if(!ok)throw new EvidenceError(ruleId,location);}
export function objectKeys(value,keys,location,ruleId='unsupported-field'){
  requireFact(value!==null&&typeof value==='object'&&!Array.isArray(value)&&Object.keys(value).length===keys.length&&keys.every(k=>Object.hasOwn(value,k)),location,ruleId);
}
export function text(value,max=256){return typeof value==='string'&&value.length>0&&value.length<=max&&value.trim().length>0&&!forbidden.test(value);}
export function integer(value,min=0,max=Number.MAX_SAFE_INTEGER){return Number.isSafeInteger(value)&&value>=min&&value<=max;}
export function utcInstant(value){
  if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(value))return NaN;
  const n=Date.parse(value);if(!Number.isFinite(n))return NaN;
  return new Date(n).toISOString()===(value.includes('.')?value:value.replace('Z','.000Z'))?n:NaN;
}
export const FIELDS={
  aws:{storage:{policy:'json',acl:'json',publicAccessBlock:'json',ownership:'string'},ingress:{protocol:'string',fromPort:'nullable-integer',toPort:'nullable-integer',cidrs:'json',enabled:'boolean'},keys:{principalKind:'string',credentialType:'string',createdAt:'string',active:'boolean'},mfa:{principalKind:'string',privileged:'boolean',mfa:'json'},logging:{enabled:'boolean',managementEvents:'string',coverageRegions:'json',exclusions:'string'}},
  azure:{storage:{allowBlobPublicAccess:'boolean',containerAccess:'string',network:'json'},ingress:{direction:'string',access:'string',priority:'integer',protocol:'string',ports:'json',sources:'json',effective:'string'},keys:{principalKind:'string',credentialType:'string',createdAt:'string',active:'boolean'},mfa:{principalKind:'string',privileged:'boolean',mfa:'json'},logging:{enabled:'boolean',categories:'json',exclusions:'string'}},
  gcp:{storage:{publicAccessPrevention:'json',bindings:'json',aclPublic:'boolean',uniformBucketLevelAccess:'boolean'},ingress:{direction:'string',action:'string',priority:'integer',protocol:'string',ports:'json',sources:'json',disabled:'boolean',effective:'string'},keys:{principalKind:'string',keyType:'string',createdAt:'string',active:'boolean'},mfa:{principalKind:'string',privileged:'boolean',mfa:'json'},logging:{enabled:'boolean',categories:'json',exclusions:'string'}}
};
export function validateManifest(raw,{nowMs}){
  const at=pointer=>({file:'@manifest',pointer});const check=(ok,pointer,rule='input-invalid')=>requireFact(ok,at(pointer),rule);
  objectKeys(raw,['schemaVersion','provider','accountAlias','exportedAt','regions','evidence','files'],at(''),'input-invalid');
  check(raw.schemaVersion==='1','/schemaVersion','unsupported-version');check(Object.hasOwn(SOURCE_KINDS,raw.provider),'/provider','unsupported-provider');
  check(text(raw.accountAlias),'/accountAlias');const exported=utcInstant(raw.exportedAt);check(Number.isFinite(exported)&&exported<=nowMs,'/exportedAt','date-invalid');
  check(Array.isArray(raw.regions)&&raw.regions.length>0&&raw.regions.every(r=>text(r,64)&&r!=='global')&&new Set(raw.regions).size===raw.regions.length,'/regions');
  check(raw.evidence&&typeof raw.evidence==='object'&&!Array.isArray(raw.evidence)&&Object.keys(raw.evidence).every(k=>CLASS_IDS.includes(k)),'/evidence');
  for(const klass of CLASS_IDS){const e=raw.evidence[klass];if(e===undefined)continue;const p=`/evidence/${klass}`;
    objectKeys(e,['status','expectedRecords','emptyVerified'],at(p),'input-invalid');check(['complete','partial','absent'].includes(e.status),p+'/status');check(integer(e.expectedRecords),p+'/expectedRecords');check(typeof e.emptyVerified==='boolean',p+'/emptyVerified');
  }
  check(Array.isArray(raw.files),'/files');
  for(const [i,d]of raw.files.entries()){
    const p=`/files/${i}`;objectKeys(d,['path','format','schemaVersion','evidenceClass','sha256','source','sourceFiles','coverage'],at(p),'input-invalid');
    check(text(d.path,1024),p+'/path');check(['json','csv'].includes(d.format),p+'/format');check(d.schemaVersion==='1',p+'/schemaVersion','unsupported-version');check(CLASS_IDS.includes(d.evidenceClass),p+'/evidenceClass');check(typeof d.sha256==='string'&&/^[a-f0-9]{64}$/.test(d.sha256),p+'/sha256');
    objectKeys(d.source,['kind','text'],at(p+'/source'),'input-invalid');check(['description','command'].includes(d.source.kind)&&text(d.source.text,1024),p+'/source');
    check(Array.isArray(d.sourceFiles)&&d.sourceFiles.length>0,p+'/sourceFiles','source-evidence-missing');
    for(const [j,s]of d.sourceFiles.entries()){const q=p+`/sourceFiles/${j}`;objectKeys(s,['path','sha256','kind'],at(q),'input-invalid');check(text(s.path,1024)&&typeof s.sha256==='string'&&/^[a-f0-9]{64}$/.test(s.sha256)&&text(s.kind,64),q);}
    objectKeys(d.coverage,['regions','recordCount','paginationComplete','continuation','exportErrors','unsupportedFields'],at(p+'/coverage'),'input-invalid');
    const c=d.coverage;check(Array.isArray(c.regions)&&c.regions.length>0&&c.regions.every(r=>text(r,64))&&new Set(c.regions).size===c.regions.length,p+'/coverage/regions');
    check(integer(c.recordCount)&&typeof c.paginationComplete==='boolean'&&(c.continuation===null||text(c.continuation,1024)),p+'/coverage');
    check(Array.isArray(c.exportErrors)&&Array.isArray(c.unsupportedFields)&&c.exportErrors.every(x=>text(x,1024))&&c.unsupportedFields.every(x=>text(x,1024)),p+'/coverage');
  }
  return raw;
}
export function validateBundle(raw,descriptor,provider){
  const loc={file:descriptor.role,pointer:''};objectKeys(raw,['schemaVersion','provider','evidenceClass','records'],loc,'input-invalid');
  requireFact(raw.schemaVersion==='1',loc,'unsupported-version');requireFact(raw.provider===provider&&raw.evidenceClass===descriptor.evidenceClass&&Array.isArray(raw.records),loc,'input-invalid');return raw.records;
}
