import test from 'node:test';import assert from 'node:assert/strict';
import {writeFile,readFile} from 'node:fs/promises';import {join} from 'node:path';
import {runCliFixture,withTempDir,writeBundle,safeRecords,exposeOne,EXPOSURE_RULE_BY_CLASS,NOW,editManifest,sha256} from './helpers.mjs';
for(const provider of ['aws','azure','gcp']){
  test(`${provider} complete evidence passes real CLI deterministically`,()=>withTempDir(async root=>{
    await writeBundle(root,provider,safeRecords(provider));const args=['--root',root,'--manifest','manifest.json','--now',NOW];const a=runCliFixture(args),b=runCliFixture(args);assert.equal(a.code,0);assert.equal(a.report.summary.checked,5);assert.deepEqual(a.report.findings,[]);assert.equal(a.stdout,b.stdout);
  }));
  for(const [klass,rule]of Object.entries(EXPOSURE_RULE_BY_CLASS))test(`${provider} ${klass} exposure real exit one`,()=>withTempDir(async root=>{
    await writeBundle(root,provider,exposeOne(provider,klass));const r=runCliFixture(['--root',root,'--manifest','manifest.json','--now',NOW]);assert.equal(r.code,1);assert.equal(r.report.status,'fail');assert.deepEqual(r.report.findings.map(f=>f.ruleId),[rule]);assert.equal(r.report.findings[0].severity,'error');assert.ok(r.report.findings[0].location.pointer.startsWith('/records/0/'));
  }));
  test(`${provider} CSV MFA bundle evaluated through real bin`,()=>withTempDir(async root=>{
    const rows=safeRecords(provider);await writeBundle(root,provider,rows);const row=rows.mfa[0],cell=JSON.stringify(row.mfa).replaceAll('"','""');const bytes=Buffer.from(`id,region,principalKind,privileged,mfa\n${row.id},global,${row.principalKind},true,"${cell}"\n`);
    await writeFile(join(root,'mfa.csv'),bytes);await editManifest(root,m=>{const d=m.files[3];d.path='mfa.csv';d.format='csv';d.sha256=sha256(bytes);});
    const r=runCliFixture(['--root',root,'--manifest','manifest.json','--now',NOW]);assert.equal(r.code,0);assert.equal(r.report.summary.checked,5);
  }));
}
test('incomplete-dominates-exposure-through-bin',()=>withTempDir(async root=>{
  await writeBundle(root,'aws',exposeOne('aws','storage'));await editManifest(root,m=>{m.evidence.keys.status='absent';});const r=runCliFixture(['--root',root,'--manifest','manifest.json','--now',NOW]);assert.equal(r.code,2);assert.equal(r.report.status,'incomplete');assert.ok(r.report.findings.some(f=>f.ruleId==='storage-public'));assert.ok(r.report.findings.some(f=>f.ruleId==='class-incomplete'));
}));
test('entirely empty explicit evidence cannot pass',()=>withTempDir(async root=>{
  await writeBundle(root,'aws',{storage:[],ingress:[],keys:[],mfa:[],logging:[]});const r=runCliFixture(['--root',root,'--manifest','manifest.json','--now',NOW]);assert.equal(r.code,2);assert.ok(r.report.findings.some(f=>f.ruleId==='no-evidence'));assert.ok(r.report.findings.some(f=>f.ruleId==='region-incomplete'));
}));
