import {mkdtemp,rm,writeFile,readFile} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {createHash} from 'node:crypto';
export const NOW='2026-10-13T00:00:00Z';
export const sha256=bytes=>createHash('sha256').update(bytes).digest('hex');
export async function withTempDir(fn){const root=await mkdtemp(join(tmpdir(),'cea-test-'));try{return await fn(root);}finally{await rm(root,{recursive:true,force:true});}}
export const CLASSES=['storage','ingress','keys','mfa','logging'];
export const SOURCE_KINDS={aws:{storage:['storage-public-policy'],ingress:['ec2-security-groups'],keys:['iam-credential-report','access-key-inventory'],mfa:['mfa-state'],logging:['cloudtrail-status']},azure:{storage:['azure-storage-public-settings'],ingress:['azure-nsg-rules'],keys:['azure-key-inventory'],mfa:['entra-privileged-mfa'],logging:['azure-diagnostic-settings']},gcp:{storage:['gcs-public-settings'],ingress:['gcp-vpc-firewall'],keys:['service-account-key-inventory'],mfa:['cloud-identity-mfa'],logging:['cloud-audit-logs']}};
export const genericRecords=()=>Object.fromEntries(CLASSES.map(klass=>[klass,[{id:'synthetic-record',region:['keys','mfa'].includes(klass)?'global':'region-a'}]]));
export async function writeBundle(root,provider,recordsByClass){
  const source=Buffer.from('Synthetic local export; no account data.\n');await writeFile(join(root,'source.txt'),source);
  const manifest={schemaVersion:'1',provider,accountAlias:'synthetic-scope',exportedAt:NOW,regions:['region-a'],evidence:{},files:[]};
  for(const evidenceClass of CLASSES){
    const records=recordsByClass[evidenceClass];const path=`${evidenceClass}.json`;
    const bytes=Buffer.from(JSON.stringify({schemaVersion:'1',provider,evidenceClass,records}));await writeFile(join(root,path),bytes);
    manifest.evidence[evidenceClass]={status:'complete',expectedRecords:records.length,emptyVerified:records.length===0};
    manifest.files.push({path,format:'json',schemaVersion:'1',evidenceClass,sha256:sha256(bytes),source:{kind:'description',text:'Synthetic local export'},sourceFiles:SOURCE_KINDS[provider][evidenceClass].map(kind=>({path:'source.txt',sha256:sha256(source),kind})),coverage:{regions:['keys','mfa'].includes(evidenceClass)?['global']:['region-a'],recordCount:records.length,paginationComplete:true,continuation:null,exportErrors:[],unsupportedFields:[]}});
  }
  await writeFile(join(root,'manifest.json'),JSON.stringify(manifest));return {manifestPath:'manifest.json'};
}
export async function editManifest(root,fn){const path=join(root,'manifest.json'),m=JSON.parse(await readFile(path,'utf8'));fn(m);await writeFile(path,JSON.stringify(m));}
export async function rewriteBundle(root,klass,records){
  const manifest=JSON.parse(await readFile(join(root,'manifest.json'),'utf8'));const d=manifest.files.find(f=>f.evidenceClass===klass);
  const bytes=Buffer.from(JSON.stringify({schemaVersion:'1',provider:manifest.provider,evidenceClass:klass,records}));await writeFile(join(root,d.path),bytes);
  d.sha256=sha256(bytes);d.coverage.recordCount=records.length;manifest.evidence[klass].expectedRecords=records.length;manifest.evidence[klass].emptyVerified=records.length===0;
  await writeFile(join(root,'manifest.json'),JSON.stringify(manifest));
}
const safe={
  aws:{storage:[{id:'synthetic-bucket',region:'region-a',policy:{state:'absent',statements:[]},acl:{publicRead:false,publicWrite:false},publicAccessBlock:{blockPublicAcls:true,ignorePublicAcls:true,blockPublicPolicy:true,restrictPublicBuckets:true},ownership:'bucket-owner-enforced'}],ingress:[{id:'synthetic-sg',region:'region-a',protocol:'tcp',fromPort:22,toPort:22,cidrs:['10.0.0.0/24'],enabled:true}],keys:[{id:'synthetic-key',region:'global',principalKind:'user',credentialType:'access-key',createdAt:NOW,active:true}],mfa:[{id:'synthetic-admin',region:'global',principalKind:'user',privileged:true,mfa:{status:'enabled',basis:'direct',effective:true}}],logging:[{id:'synthetic-trail',region:'region-a',enabled:true,managementEvents:'all',coverageRegions:['region-a'],exclusions:'none'}]},
  azure:{storage:[{id:'synthetic-storage',region:'region-a',allowBlobPublicAccess:false,containerAccess:'private',network:{publicNetworkAccess:'enabled',defaultAction:'allow',effectiveInternetAccess:'allowed'}}],ingress:[{id:'synthetic-nsg',region:'region-a',direction:'inbound',access:'allow',priority:100,protocol:'tcp',ports:[{from:22,to:22}],sources:['10.0.0.0/24'],effective:'applies'}],keys:[{id:'synthetic-key',region:'global',principalKind:'storage-account',credentialType:'storage-account-key',createdAt:NOW,active:true}],mfa:[{id:'synthetic-admin',region:'global',principalKind:'user',privileged:true,mfa:{status:'enabled',basis:'conditional-access',effective:true}}],logging:[{id:'synthetic-diagnostic',region:'region-a',enabled:true,categories:{administrative:true,security:true},exclusions:'none'}]},
  gcp:{storage:[{id:'synthetic-bucket',region:'region-a',publicAccessPrevention:{configured:'enforced',effective:'enforced'},bindings:[{memberKind:'restricted',permission:'read',condition:'none'}],aclPublic:false,uniformBucketLevelAccess:true}],ingress:[{id:'synthetic-firewall',region:'region-a',direction:'ingress',action:'allow',priority:1000,protocol:'tcp',ports:[{from:22,to:22}],sources:['10.0.0.0/24'],disabled:false,effective:'applies'}],keys:[{id:'synthetic-key',region:'global',principalKind:'service-account',keyType:'user-managed',createdAt:NOW,active:true}],mfa:[{id:'synthetic-admin',region:'global',principalKind:'user',privileged:true,mfa:{status:'enabled',basis:'inherited',effective:true}}],logging:[{id:'synthetic-audit',region:'region-a',enabled:true,categories:{adminActivity:true,dataAccess:true},exclusions:'none'}]}
};
export const safeRecords=provider=>structuredClone(safe[provider]);
export const EXPOSURE_RULE_BY_CLASS={storage:'storage-public',ingress:'admin-ingress-broad',keys:'key-age-exceeded',mfa:'privileged-mfa-disabled',logging:'audit-logging-disabled'};
export function exposeOne(provider,klass){
  const rows=safeRecords(provider),r=rows[klass][0];
  if(klass==='storage'){
    if(provider==='aws'){r.ownership='acl-enabled';r.publicAccessBlock.ignorePublicAcls=false;r.acl.publicRead=true;}
    if(provider==='azure'){r.allowBlobPublicAccess=true;r.containerAccess='blob';}
    if(provider==='gcp'){r.publicAccessPrevention={configured:'unspecified',effective:'not-enforced'};r.bindings=[{memberKind:'all-users',permission:'read',condition:'none'}];}
  }
  if(klass==='ingress'){if(provider==='aws')r.cidrs=['0.0.0.0/0'];else r.sources=['::/0'];}
  if(klass==='keys')r.createdAt='2026-07-14T00:00:00Z';
  if(klass==='mfa')r.mfa.status='disabled';
  if(klass==='logging')r.enabled=false;
  return rows;
}
export function bundleViews(provider,rows){return CLASSES.map((klass,i)=>({evidenceClass:klass,role:`@bundle-${String(i+1).padStart(4,'0')}`,records:rows[klass],coverage:{regions:['keys','mfa'].includes(klass)?['global']:['region-a']},pointerFor:(index,field='')=>`/records/${index}${field?`/${field}`:''}`}));}
