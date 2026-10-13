import test from 'node:test';import assert from 'node:assert/strict';
import {auditProvider} from '../src/providers/gcp.mjs';import {createBudget} from '../src/budget.mjs';import {buildReport,exitCode} from '../src/report.mjs';
import {safeRecords,exposeOne,bundleViews,EXPOSURE_RULE_BY_CLASS,NOW} from './helpers.mjs';
const audit=rows=>{const r=auditProvider(bundleViews('gcp',rows),{nowMs:Date.parse(NOW),keyAgeDays:90,budget:createBudget({clock:()=>0})});return buildReport({findings:r.findings,checked:r.checked,files:7,classesComplete:5-r.incompleteClasses.size});};
test('GCP complete safe evidence clean',()=>{const r=audit(safeRecords('gcp'));assert.equal(r.status,'pass');assert.equal(r.summary.checked,5);assert.deepEqual(r.findings,[]);});
for(const [klass,rule]of Object.entries(EXPOSURE_RULE_BY_CLASS))test(`GCP ${klass} exposure is fail`,()=>{const r=audit(exposeOne('gcp',klass));assert.deepEqual(r.findings.map(f=>f.ruleId),[rule]);assert.equal(r.findings[0].severity,'error');assert.equal(exitCode(r),1);});
test('GCP all authenticated users grant is public',()=>{const rows=exposeOne('gcp','storage');rows.storage[0].bindings[0].memberKind='all-authenticated-users';assert.equal(audit(rows).status,'fail');});
test('GCP effective inherited prevention and unknown inheritance',()=>{
  const rows=exposeOne('gcp','storage');rows.storage[0].publicAccessPrevention={configured:'inherited',effective:'enforced'};assert.equal(audit(rows).status,'pass');rows.storage[0].publicAccessPrevention.effective='unknown';assert.equal(audit(rows).status,'incomplete');
});
test('GCP uniform access ignores ACL but not IAM',()=>{
  const rows=safeRecords('gcp');rows.storage[0].publicAccessPrevention={configured:'unspecified',effective:'not-enforced'};rows.storage[0].aclPublic=true;assert.equal(audit(rows).status,'pass');rows.storage[0].uniformBucketLevelAccess=false;assert.equal(audit(rows).status,'fail');
  const iam=exposeOne('gcp','storage');assert.equal(audit(iam).status,'fail');iam.storage[0].bindings[0].condition='private-endpoint';assert.equal(audit(iam).status,'incomplete');
});
test('GCP disabled shadowed deny egress and priority bounds',()=>{
  for(const [key,val]of [['disabled',true],['effective','shadowed'],['action','deny'],['direction','egress']]){const rows=exposeOne('gcp','ingress');rows.ingress[0][key]=val;assert.equal(audit(rows).status,'pass');}
  for(const [p,status]of [[0,'pass'],[65535,'pass'],[-1,'incomplete'],[65536,'incomplete']]){const rows=safeRecords('gcp');rows.ingress[0].priority=p;assert.equal(audit(rows).status,status);}
});
test('GCP system managed key and invalid dates',()=>{
  const rows=exposeOne('gcp','keys');rows.keys[0].keyType='system-managed';assert.equal(audit(rows).status,'pass');rows.keys[0].createdAt='unknown';assert.equal(audit(rows).status,'incomplete');
});
test('GCP effective federated MFA and logging exclusions',()=>{
  const rows=safeRecords('gcp');rows.mfa[0].principalKind='federated';rows.mfa[0].mfa.basis='federated';assert.equal(audit(rows).status,'pass');rows.mfa[0].mfa.status='unknown';assert.equal(audit(rows).status,'incomplete');
  const logs=safeRecords('gcp');logs.logging[0].exclusions='unsupported';assert.equal(audit(logs).status,'incomplete');
  for(const category of ['adminActivity','dataAccess']){const partial=safeRecords('gcp');partial.logging[0].categories[category]=false;assert.equal(audit(partial).status,'fail');}
});
