import test from 'node:test';import assert from 'node:assert/strict';
import {readFile,readdir,writeFile} from 'node:fs/promises';import {join} from 'node:path';
import {withTempDir,writeBundle,safeRecords,exposeOne,runCliFixture,editManifest,NOW,sha256,rewriteBundle} from './helpers.mjs';
import {parseUniqueJson} from '../src/json.mjs';import {createBudget} from '../src/budget.mjs';
const invoke=root=>runCliFixture(['--root',root,'--manifest','manifest.json','--now',NOW],{preload:'test/no-network-preload.mjs'});
async function snapshot(root){const result={};for(const path of (await readdir(root)).sort())result[path]=sha256(await readFile(join(root,path)));return result;}
test('private values stay local and incomplete exposure remains nonempty',()=>withTempDir(async root=>{
  const rows=exposeOne('aws','storage');rows.storage[0].id='synthetic-private-bucket';await writeBundle(root,'aws',rows);await editManifest(root,m=>{m.accountAlias='synthetic-private-account';m.files[0].source.text='execute synthetic-private-command';m.files[1].coverage.continuation='synthetic-private-continuation';});
  const before=await snapshot(root),r=invoke(root);assert.equal(r.code,2);assert.equal(r.report.status,'incomplete');assert.ok(r.report.findings.some(f=>f.ruleId==='storage-public'));assert.ok(r.report.findings.some(f=>f.ruleId==='pagination-incomplete'));
  for(const s of ['synthetic-private-bucket','synthetic-private-account','synthetic-private-command','synthetic-private-continuation',root])assert.equal((r.stdout+r.stderr).includes(s),false);assert.deepEqual(await snapshot(root),before);
}));
test('every forbidden identifier class gives explicit incomplete evidence',()=>withTempDir(async root=>{
  for(const c of ['\u0001','\u007f','\u0085','\u009b','\u2028','\u2029','\u202e','\u2066','\u200b']){const rows=safeRecords('aws');rows.keys[0].id='id'+c;await writeBundle(root,'aws',rows);const r=invoke(root);assert.equal(r.code,2);assert.ok(r.report.findings.some(f=>f.ruleId==='input-invalid'||f.ruleId==='unsupported-field'));assert.equal((r.stdout+r.stderr).includes(c),false);}
}));
test('numeric precision loss cannot manufacture integer evidence',()=>{
  for(const literal of ['1e-999','1.0000000000000001','9007199254740993'])assert.throws(()=>parseUniqueJson(Buffer.from(`{"count":${literal}}`),{location:{file:'@manifest',pointer:''},budget:createBudget({clock:()=>0})}),e=>e.ruleId==='input-invalid');
});
test('AWS separate regional trails cover one complete bundle without false positive',()=>withTempDir(async root=>{
  const rows=safeRecords('aws');for(const klass of ['storage','ingress','logging']){const other=structuredClone(rows[klass][0]);other.region='region-b';if(klass==='logging')other.coverageRegions=['region-b'];rows[klass].push(other);}
  await writeBundle(root,'aws',rows);await editManifest(root,m=>{m.regions.push('region-b');for(const f of m.files)if(['storage','ingress','logging'].includes(f.evidenceClass))f.coverage.regions.push('region-b');});
  const r=runCliFixture(['--root',root,'--manifest','manifest.json','--now',NOW]);assert.equal(r.code,0,JSON.stringify(r.report));assert.equal(r.report.summary.checked,8);
}));
for(const provider of ['aws','azure','gcp'])test(`${provider} declared logging region without actual supported record is incomplete`,()=>withTempDir(async root=>{
  const rows=safeRecords(provider);for(const klass of ['storage','ingress']){const other=structuredClone(rows[klass][0]);other.region='region-b';rows[klass].push(other);}
  await writeBundle(root,provider,rows);await editManifest(root,m=>{m.regions.push('region-b');for(const f of m.files)if(['storage','ingress','logging'].includes(f.evidenceClass))f.coverage.regions.push('region-b');});
  const r=invoke(root);assert.equal(r.code,2);assert.ok(r.report.findings.some(f=>f.ruleId==='region-incomplete'));assert.equal(r.report.summary.classesComplete,4);
}));
