import {validateRecord,broadAdminIngress,keyAgeExceeded,effectiveMfa,runAdapter} from '../provider-common.mjs';
import {objectKeys,requireFact,integer} from '../schema.mjs';
function evaluate(klass,row,ctx){
  const at=ctx.location;validateRecord(row,'gcp',klass,at);const out=[];
  if(klass==='storage'){
    const p=row.publicAccessPrevention;objectKeys(p,['configured','effective'],at);
    requireFact(['enforced','inherited','unspecified'].includes(p.configured)&&['enforced','not-enforced'].includes(p.effective)&&Array.isArray(row.bindings),at);
    requireFact(p.configured!=='enforced'||p.effective==='enforced',at);
    for(const b of row.bindings){objectKeys(b,['memberKind','permission','condition'],at);requireFact(['all-users','all-authenticated-users','restricted'].includes(b.memberKind)&&['read','write','none'].includes(b.permission)&&b.condition==='none',at);}
    const iamPublic=row.bindings.some(b=>['all-users','all-authenticated-users'].includes(b.memberKind)&&['read','write'].includes(b.permission)&&b.condition==='none');
    const aclPublic=row.aclPublic&&!row.uniformBucketLevelAccess;
    if(p.effective!=='enforced'&&(iamPublic||aclPublic))out.push(['storage-public',iamPublic?'bindings':'aclPublic']);
  }
  if(klass==='ingress'){
    requireFact(['ingress','egress'].includes(row.direction)&&['allow','deny'].includes(row.action)&&integer(row.priority,0,65535)&&['applies','shadowed'].includes(row.effective),at);
    const broad=broadAdminIngress({protocol:row.protocol,ports:row.ports,cidrs:row.sources,location:at});
    if(row.direction==='ingress'&&row.action==='allow'&&!row.disabled&&row.effective==='applies'&&broad)out.push(['admin-ingress-broad','sources']);
  }
  if(klass==='keys'){
    requireFact(row.principalKind==='service-account'&&['user-managed','system-managed'].includes(row.keyType),at);
    const old=keyAgeExceeded(row,{...ctx,location:at});if(row.keyType==='user-managed'&&old)out.push(['key-age-exceeded','createdAt']);
  }
  if(klass==='mfa'){if(effectiveMfa(row,{allowedKinds:['user','federated'],allowedBases:['direct','inherited','federated'],location:at}))out.push(['privileged-mfa-disabled','mfa']);}
  if(klass==='logging'){
    objectKeys(row.categories,['adminActivity','dataAccess'],at);requireFact(row.exclusions==='none'&&Object.values(row.categories).every(x=>typeof x==='boolean'),at);
    if(!row.enabled||!row.categories.adminActivity||!row.categories.dataAccess)out.push(['audit-logging-disabled','categories']);
  }
  return out;
}
export function auditProvider(bundles,context){return runAdapter(bundles,evaluate,context);}
