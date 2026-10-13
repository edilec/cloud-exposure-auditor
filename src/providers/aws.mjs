import {validateRecord,broadAdminIngress,keyAgeExceeded,effectiveMfa,runAdapter} from '../provider-common.mjs';
import {objectKeys,requireFact,text} from '../schema.mjs';
function evaluate(klass,row,ctx){
  const at=ctx.location;validateRecord(row,'aws',klass,at);const out=[];
  if(klass==='storage'){
    const {policy,acl,publicAccessBlock:p,ownership}=row;
    objectKeys(policy,['state','statements'],at);objectKeys(acl,['publicRead','publicWrite'],at);objectKeys(p,['blockPublicAcls','ignorePublicAcls','blockPublicPolicy','restrictPublicBuckets'],at);
    requireFact(['absent','present'].includes(policy.state)&&Array.isArray(policy.statements)&&Object.values(acl).every(x=>typeof x==='boolean')&&Object.values(p).every(x=>typeof x==='boolean')&&['acl-enabled','bucket-owner-enforced'].includes(ownership),at);
    requireFact(policy.state!=='absent'||policy.statements.length===0,at);
    for(const s of policy.statements){objectKeys(s,['effect','principal','permissions','resourceScope','condition'],at);requireFact(['allow','deny'].includes(s.effect)&&['public','restricted'].includes(s.principal)&&Array.isArray(s.permissions)&&s.permissions.length>0&&s.permissions.every(p=>['read','write'].includes(p))&&new Set(s.permissions).size===s.permissions.length&&s.resourceScope==='whole-bucket'&&['none','private-endpoint'].includes(s.condition),at);requireFact(s.effect!=='deny'||s.condition==='none',at);}
    const denied=new Set(policy.statements.filter(s=>s.effect==='deny'&&s.principal==='public'&&s.condition==='none').flatMap(s=>s.permissions));
    const policyPublic=policy.statements.some(s=>s.effect==='allow'&&s.principal==='public'&&s.condition==='none'&&s.permissions.some(permission=>!denied.has(permission)));
    const aclPublic=(acl.publicRead||acl.publicWrite)&&!p.ignorePublicAcls&&ownership!=='bucket-owner-enforced';
    if(aclPublic||(policyPublic&&!p.restrictPublicBuckets))out.push(['storage-public',aclPublic?'acl':'policy']);
  }
  if(klass==='ingress'){
    requireFact(row.protocol==='all'?row.fromPort===null&&row.toPort===null:row.fromPort!==null&&row.toPort!==null,at);
    const broad=broadAdminIngress({protocol:row.protocol,ports:row.protocol==='all'?[]:[{from:row.fromPort,to:row.toPort}],cidrs:row.cidrs,location:at});
    if(row.enabled&&broad)out.push(['admin-ingress-broad','cidrs']);
  }
  if(klass==='keys'){requireFact(['user','root'].includes(row.principalKind)&&row.credentialType==='access-key',at);if(keyAgeExceeded(row,{...ctx,location:at}))out.push(['key-age-exceeded','createdAt']);}
  if(klass==='mfa'){if(effectiveMfa(row,{allowedKinds:['user','root','federated'],allowedBases:['direct','federated'],location:at}))out.push(['privileged-mfa-disabled','mfa']);}
  if(klass==='logging'){
    requireFact(['all','read-only','write-only','none'].includes(row.managementEvents)&&row.exclusions==='none'&&Array.isArray(row.coverageRegions)&&row.coverageRegions.length>0&&row.coverageRegions.every(r=>text(r,64)),at);
    requireFact(ctx.bundle.coverage.regions.every(r=>row.coverageRegions.includes(r)),at,'region-incomplete');
    if(!row.enabled||row.managementEvents!=='all')out.push(['audit-logging-disabled','managementEvents']);
  }
  return out;
}
export function auditProvider(bundles,context){return runAdapter(bundles,evaluate,context);}
