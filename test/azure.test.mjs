import test from 'node:test';import assert from 'node:assert/strict';
import {auditProvider} from '../src/providers/azure.mjs';import {createBudget} from '../src/budget.mjs';import {buildReport,exitCode} from '../src/report.mjs';
import {safeRecords,exposeOne,bundleViews,EXPOSURE_RULE_BY_CLASS,NOW} from './helpers.mjs';
const audit=rows=>{const r=auditProvider(bundleViews('azure',rows),{nowMs:Date.parse(NOW),keyAgeDays:90,budget:createBudget({clock:()=>0})});return buildReport({findings:r.findings,checked:r.checked,files:7,classesComplete:5-r.incompleteClasses.size});};
test('Azure complete safe evidence clean',()=>{const r=audit(safeRecords('azure'));assert.equal(r.status,'pass');assert.equal(r.summary.checked,5);assert.deepEqual(r.findings,[]);});
for(const [klass,rule]of Object.entries(EXPOSURE_RULE_BY_CLASS))test(`Azure ${klass} exposure is fail`,()=>{const r=audit(exposeOne('azure',klass));assert.deepEqual(r.findings.map(f=>f.ruleId),[rule]);assert.equal(r.findings[0].severity,'error');assert.equal(exitCode(r),1);});
test('Azure private storage controls and contradictory network facts',()=>{
  const rows=exposeOne('azure','storage'),s=rows.storage[0];s.network.effectiveInternetAccess='blocked';s.network.publicNetworkAccess='disabled';assert.equal(audit(rows).status,'pass');
  s.network.effectiveInternetAccess='allowed';assert.equal(audit(rows).status,'incomplete');s.network.publicNetworkAccess='unknown';assert.equal(audit(rows).status,'incomplete');
});
test('Azure effective deny shadowed outbound and UDP are clean',()=>{
  for(const [key,val]of [['access','deny'],['effective','shadowed'],['direction','outbound'],['protocol','udp']]){const rows=exposeOne('azure','ingress');rows.ingress[0][key]=val;assert.equal(audit(rows).status,'pass');}
  const rows=exposeOne('azure','ingress');rows.ingress[0].effective='unknown';assert.equal(audit(rows).status,'incomplete');
});
test('Azure priority boundaries and unresolved tags',()=>{
  for(const [p,status]of [[100,'pass'],[4096,'pass'],[99,'incomplete'],[4097,'incomplete']]){const rows=safeRecords('azure');rows.ingress[0].priority=p;assert.equal(audit(rows).status,status);}
  const rows=safeRecords('azure');rows.ingress[0].sources=['Internet'];assert.equal(audit(rows).status,'incomplete');
});
test('Azure effective federated MFA and unknown logging exceptions',()=>{
  const rows=safeRecords('azure');rows.mfa[0].principalKind='federated';rows.mfa[0].mfa.basis='federated';assert.equal(audit(rows).status,'pass');rows.mfa[0].mfa.effective=false;assert.equal(audit(rows).status,'incomplete');
  const logs=safeRecords('azure');logs.logging[0].exclusions='unsupported';assert.equal(audit(logs).status,'incomplete');
  for(const category of ['administrative','security']){const partial=safeRecords('azure');partial.logging[0].categories[category]=false;assert.equal(audit(partial).status,'fail');}
});
test('Azure unsupported key kind and old inactive key',()=>{
  const rows=exposeOne('azure','keys');rows.keys[0].active=false;assert.equal(audit(rows).status,'pass');rows.keys[0].credentialType='client-secret';assert.equal(audit(rows).status,'incomplete');
});
