import test from 'node:test';import assert from 'node:assert/strict';
import {readFileSync,statSync} from 'node:fs';import {join} from 'node:path';
import {RULE_SEVERITY} from '../src/report.mjs';
import {validateMembers} from '../scripts/package-check.mjs';
import {toolRoot,runCliFixture,NOW} from './helpers.mjs';
test('standalone package exposes the actual ESM CLI without dependencies or hooks',()=>{
  const pkg=JSON.parse(readFileSync(join(toolRoot,'package.json'),'utf8'));
  assert.equal(pkg.name,'cloud-exposure-auditor');assert.equal(pkg.type,'module');assert.equal(pkg.exports['.'],'./src/index.mjs');assert.equal(pkg.bin['cloud-exposure-auditor'],'bin/cloud-exposure-auditor.mjs');
  for(const key of ['dependencies','devDependencies','optionalDependencies','peerDependencies'])assert.deepEqual(pkg[key]??{},{});
  for(const key of ['preinstall','install','postinstall','prepare','prepack','postpack'])assert.equal(Object.hasOwn(pkg.scripts,key),false);
  assert.ok(statSync(join(toolRoot,pkg.bin['cloud-exposure-auditor'])).mode&0o111);assert.ok(pkg.files.includes('LICENSE'));assert.ok(pkg.files.includes('examples'));assert.equal(pkg.files.includes('docs/verification.md'),false);
});
test('archive guard accepts declared files and rejects escapes or controller artifacts',()=>{
  const pkg={files:['src','LICENSE']};assert.doesNotThrow(()=>validateMembers(['package/package.json','package/src/index.mjs','package/LICENSE'],pkg));
  for(const member of ['/private/data','package/../outside','package/.git/config','package/docs/verification.md','package/src/../../outside'])assert.throws(()=>validateMembers(['package/package.json','package/LICENSE',member],pkg));
});
test('documented catalog and distributed legal text agree with runtime contract',()=>{
  const text=readFileSync(join(toolRoot,'docs/rules.md'),'utf8'),documented={};for(const m of text.matchAll(/^\| `([^`]+)` \| (error|warning|info) \|/gm))documented[m[1]]=m[2];
  assert.deepEqual(documented,RULE_SEVERITY);assert.ok(readFileSync(join(toolRoot,'LICENSE'),'utf8').includes('Permission is hereby granted'));
});
for(const provider of ['aws','azure','gcp'])for(const outcome of ['pass','fail'])test(`example ${provider} ${outcome} matches the real offline bin`,()=>{
  const root=join(toolRoot,'examples',provider,outcome),r=runCliFixture(['--root',root,'--manifest','manifest.json','--now',NOW]);
  assert.equal(r.code,outcome==='pass'?0:1);assert.equal(r.stdout,readFileSync(join(root,'expected-report.json'),'utf8'));assert.equal(r.report.status,outcome);assert.equal(r.report.summary.checked,5);assert.equal(r.report.summary.classesComplete,5);
  if(outcome==='pass')assert.deepEqual(r.report.findings,[]);
  else assert.deepEqual(new Set(r.report.findings.map(f=>f.ruleId)),new Set(['storage-public','admin-ingress-broad','key-age-exceeded','privileged-mfa-disabled','audit-logging-disabled']));
});
