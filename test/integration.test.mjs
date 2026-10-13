import test from 'node:test';import assert from 'node:assert/strict';
import {writeFile,readFile} from 'node:fs/promises';import {join} from 'node:path';
import {runCliFixture,withTempDir,writeBundle,safeRecords,exposeOne,EXPOSURE_RULE_BY_CLASS,NOW,editManifest,sha256} from './helpers.mjs';
import {auditExports,ConfigError} from '../src/index.mjs';
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
test('library rejects policy typos rather than silently falling back',()=>withTempDir(async root=>{
  const rows=safeRecords('aws');rows.keys[0].createdAt='2026-08-14T00:00:00Z';await writeBundle(root,'aws',rows);
  const options={root,manifestPath:'manifest.json',now:NOW};
  assert.equal((await auditExports({...options,keyAgeDays:30})).status,'fail');
  await assert.rejects(auditExports({...options,keyAgeDay:30}),e=>e instanceof ConfigError);
  await assert.rejects(auditExports({...options,human:true}),e=>e instanceof ConfigError);
  await assert.rejects(auditExports(undefined),e=>e instanceof ConfigError);
}));
test('all CSV evidence rejects a nonstring provider instead of coercing it',()=>withTempDir(async root=>{
  const rows=safeRecords('aws');await writeBundle(root,'aws',rows);
  for(const klass of Object.keys(rows)){
    const row=rows[klass][0],keys=Object.keys(row),cell=value=>'"'+(value!==null&&typeof value==='object'?JSON.stringify(value):String(value)).replaceAll('"','""')+'"';
    const bytes=Buffer.from(keys.join(',')+'\n'+keys.map(k=>cell(row[k])).join(',')+'\n');await writeFile(join(root,klass+'.csv'),bytes);
    await editManifest(root,m=>{const d=m.files.find(f=>f.evidenceClass===klass);d.path=klass+'.csv';d.format='csv';d.sha256=sha256(bytes);});
  }
  const args=['--root',root,'--manifest','manifest.json','--now',NOW];assert.equal(runCliFixture(args).code,0);
  await editManifest(root,m=>{m.provider=['aws'];});const r=runCliFixture(args);assert.equal(r.code,2);assert.equal(r.report.status,'incomplete');assert.ok(r.report.findings.some(f=>f.ruleId==='unsupported-provider'));
}));
test('matching AWS deny keeps the actual CLI ACL result clean',()=>withTempDir(async root=>{
  const rows=safeRecords('aws'),s=rows.storage[0];s.policy={state:'present',statements:[{effect:'deny',principal:'public',permissions:['read'],resourceScope:'whole-bucket',condition:'none'}]};s.ownership='acl-enabled';s.publicAccessBlock.ignorePublicAcls=false;s.acl.publicRead=true;
  await writeBundle(root,'aws',rows);const r=runCliFixture(['--root',root,'--manifest','manifest.json','--now',NOW]);assert.equal(r.code,0);assert.deepEqual(r.report.findings,[]);
}));
