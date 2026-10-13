import test from 'node:test';
import assert from 'node:assert/strict';
import {auditProvider} from '../src/providers/aws.mjs';
import {createBudget} from '../src/budget.mjs';
import {buildReport,exitCode} from '../src/report.mjs';
import {safeRecords,exposeOne,bundleViews,EXPOSURE_RULE_BY_CLASS,NOW} from './helpers.mjs';
const audit=rows=>{const r=auditProvider(bundleViews('aws',rows),{nowMs:Date.parse(NOW),keyAgeDays:90,budget:createBudget({clock:()=>0})});return buildReport({findings:r.findings,checked:r.checked,files:7,classesComplete:5-r.incompleteClasses.size});};
test('AWS complete safe evidence is clean',()=>{const r=audit(safeRecords('aws'));assert.equal(r.status,'pass');assert.equal(r.summary.checked,5);assert.deepEqual(r.findings,[]);});
for(const [klass,rule]of Object.entries(EXPOSURE_RULE_BY_CLASS))test(`AWS ${klass} exposure is fail`,()=>{const r=audit(exposeOne('aws',klass));assert.deepEqual(r.findings.map(f=>f.ruleId),[rule]);assert.equal(r.findings[0].severity,'error');assert.equal(exitCode(r),1);});
const statement=(effect='allow',principal='public',permissions=['read'],condition='none')=>({effect,principal,permissions,resourceScope:'whole-bucket',condition});
const policyCase=(statements,edit=()=>{})=>{const rows=safeRecords('aws'),r=rows.storage[0];r.policy={state:'present',statements};r.publicAccessBlock.restrictPublicBuckets=false;edit(r);return audit(rows);};
test('AWS new policy blocks do not erase existing public grants',()=>assert.equal(policyCase([statement()]).status,'fail'));
test('AWS restrictive public policy controls stay clean',()=>{
  for(const statements of [[statement('allow','restricted')],[statement('allow','public',['read'],'private-endpoint')],[statement(),statement('deny')]])assert.equal(policyCase(statements).status,'pass');
  assert.equal(policyCase([statement()],r=>{r.publicAccessBlock.restrictPublicBuckets=true;}).status,'pass');
  assert.equal(policyCase([statement(),statement('deny','public',['write'])]).status,'fail');
});
test('AWS unsupported conditions cannot pass',()=>assert.equal(policyCase([statement('allow','public',['read'],'unsupported')]).status,'incomplete'));
test('AWS ACL ignores and ownership suppress real grant only when effective',()=>{
  const rows=exposeOne('aws','storage');assert.equal(audit(rows).status,'fail');rows.storage[0].publicAccessBlock.ignorePublicAcls=true;assert.equal(audit(rows).status,'pass');rows.storage[0].publicAccessBlock.ignorePublicAcls=false;rows.storage[0].ownership='bucket-owner-enforced';assert.equal(audit(rows).status,'pass');
});
test('AWS effective federated MFA and logging unknown controls',()=>{
  const rows=safeRecords('aws');rows.mfa[0].principalKind='federated';rows.mfa[0].mfa.basis='federated';assert.equal(audit(rows).status,'pass');rows.mfa[0].mfa.effective=false;assert.equal(audit(rows).status,'incomplete');
  const logs=safeRecords('aws');logs.logging[0].exclusions='unsupported';assert.equal(audit(logs).status,'incomplete');
  const keys=safeRecords('aws');keys.keys[0].principalKind='unknown';assert.equal(audit(keys).status,'incomplete');
});
