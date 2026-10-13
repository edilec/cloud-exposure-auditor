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
