import {validateRecord,broadAdminIngress,keyAgeExceeded,effectiveMfa,runAdapter} from '../provider-common.mjs';
import {objectKeys,requireFact,integer} from '../schema.mjs';
function evaluate(klass,row,ctx){
  const at=ctx.location;validateRecord(row,'azure',klass,at);const out=[];
  if(klass==='storage'){
    objectKeys(row.network,['publicNetworkAccess','defaultAction','effectiveInternetAccess'],at);const n=row.network;
    requireFact(['private','blob','container'].includes(row.containerAccess)&&['enabled','disabled'].includes(n.publicNetworkAccess)&&['allow','deny'].includes(n.defaultAction)&&['allowed','blocked'].includes(n.effectiveInternetAccess),at);
    requireFact(n.publicNetworkAccess!=='disabled'||n.effectiveInternetAccess==='blocked',at);
    if(row.allowBlobPublicAccess&&['blob','container'].includes(row.containerAccess)&&n.effectiveInternetAccess==='allowed')out.push(['storage-public','containerAccess']);
  }
  if(klass==='ingress'){
    requireFact(['inbound','outbound'].includes(row.direction)&&['allow','deny'].includes(row.access)&&integer(row.priority,100,4096)&&['applies','shadowed'].includes(row.effective),at);
    const broad=broadAdminIngress({protocol:row.protocol,ports:row.ports,cidrs:row.sources,location:at});
    if(row.direction==='inbound'&&row.access==='allow'&&row.effective==='applies'&&broad)out.push(['admin-ingress-broad','sources']);
  }
  if(klass==='keys'){
    requireFact((row.principalKind==='storage-account'&&row.credentialType==='storage-account-key')||(row.principalKind==='service-principal'&&row.credentialType==='client-secret'),at);
    if(keyAgeExceeded(row,{...ctx,location:at}))out.push(['key-age-exceeded','createdAt']);
  }
  if(klass==='mfa'){if(effectiveMfa(row,{allowedKinds:['user','federated'],allowedBases:['direct','conditional-access','federated'],location:at}))out.push(['privileged-mfa-disabled','mfa']);}
  if(klass==='logging'){
    objectKeys(row.categories,['administrative','security'],at);requireFact(row.exclusions==='none'&&Object.values(row.categories).every(x=>typeof x==='boolean'),at);
    if(!row.enabled||!row.categories.administrative||!row.categories.security)out.push(['audit-logging-disabled','categories']);
  }
  return out;
}
export function auditProvider(bundles,context){return runAdapter(bundles,evaluate,context);}
