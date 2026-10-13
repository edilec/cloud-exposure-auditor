import test from 'node:test';
import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {loadEvidence} from '../src/manifest.mjs';
import {createBudget} from '../src/budget.mjs';
import {withTempDir,writeBundle,genericRecords,editManifest,NOW,sha256,rewriteBundle} from './helpers.mjs';
const load=root=>loadEvidence({root,manifestPath:'manifest.json',nowMs:Date.parse(NOW),budget:createBudget({clock:()=>0})});
test('complete synthetic manifest has five complete classes',()=>withTempDir(async root=>{
  await writeBundle(root,'aws',genericRecords());const got=await load(root);assert.equal(got.classesComplete,5);assert.equal(got.bundles.length,5);assert.deepEqual(got.findings,[]);
}));
const cases=[
 ['class-incomplete',m=>{m.evidence.keys.status='absent';}],
 ['class-incomplete',m=>{m.evidence.storage.status='partial';}],
 ['region-incomplete',m=>{m.regions.push('region-b');}],
 ['region-incomplete',m=>{m.files[0].coverage.regions.push('region-b');}],
 ['pagination-incomplete',m=>{m.files[0].coverage.continuation='synthetic-continuation';}],
 ['pagination-incomplete',m=>{m.files[0].coverage.paginationComplete=false;}],
 ['export-error',m=>{m.files[0].coverage.exportErrors=['private-error'];}],
 ['unsupported-field',m=>{m.files[0].coverage.unsupportedFields=['private-field'];}],
 ['record-count-mismatch',m=>{m.files[0].coverage.recordCount=2;}],
 ['record-count-mismatch',m=>{m.evidence.storage.expectedRecords=2;}],
 ['source-digest-mismatch',m=>{m.files[0].sha256='0'.repeat(64);}],
 ['source-digest-mismatch',m=>{m.files[0].sourceFiles[0].sha256='0'.repeat(64);}],
 ['source-evidence-missing',m=>{m.files[2].sourceFiles.pop();}],
 ['input-invalid',m=>{m.extra=true;}],
 ['unsupported-provider',m=>{m.provider='other';}],
 ['unsupported-version',m=>{m.schemaVersion='2';}],
 ['date-invalid',m=>{m.exportedAt='2026-10-14T00:00:00Z';}],
 ['record-duplicate',m=>{m.files.push({...m.files[0]});}],
 ['input-invalid',m=>{m.accountAlias='\u0085';}]
];
for(const [rule,edit]of cases)test(`coverage witness ${rule} ${cases.indexOf(cases.find(x=>x[1]===edit))}`,()=>withTempDir(async root=>{
  await writeBundle(root,'aws',genericRecords());await editManifest(root,edit);const got=await load(root);
  assert.ok(got.findings.some(f=>f.ruleId===rule),JSON.stringify(got.findings));assert.ok(got.classesComplete<5);
}));
test('duplicate record and unexpected region remain incomplete',()=>withTempDir(async root=>{
  await writeBundle(root,'aws',genericRecords());await rewriteBundle(root,'storage',[{id:'x',region:'region-a'},{id:'x',region:'region-a'},{id:'y',region:'other'}]);
  const got=await load(root);assert.ok(got.findings.some(f=>f.ruleId==='record-duplicate'));assert.ok(got.findings.some(f=>f.ruleId==='region-incomplete'));
}));
test('exact one hundred input files accepted and 101 refused',()=>withTempDir(async root=>{
  await writeBundle(root,'aws',genericRecords());const bytes=Buffer.from('source');
  for(let i=0;i<94;i++)await writeFile(join(root,`extra-${i}.txt`),bytes);
  await editManifest(root,m=>{for(let i=0;i<93;i++)m.files[0].sourceFiles.push({path:`extra-${i}.txt`,sha256:sha256(bytes),kind:'storage-public-policy'});});
  assert.equal((await load(root)).classesComplete,5);
  await editManifest(root,m=>{m.files[0].sourceFiles.push({path:'extra-93.txt',sha256:sha256(bytes),kind:'storage-public-policy'});});
  const above=await load(root);assert.deepEqual(above.findings.map(f=>[f.ruleId,f.location]),[['file-limit',{file:'@manifest',pointer:''}]]);assert.equal(above.classesComplete,0);
}));
test('cumulative record boundary is per run not per bundle',()=>withTempDir(async root=>{
  const rows=genericRecords();rows.storage=Array.from({length:99996},(_,i)=>({id:`r-${i}`,region:'region-a'}));
  await writeBundle(root,'aws',rows);assert.equal((await load(root)).classesComplete,5);
  await rewriteBundle(root,'ingress',[{id:'a',region:'region-a'},{id:'b',region:'region-a'}]);
  assert.ok((await load(root)).findings.some(f=>f.ruleId==='record-limit'));
}));
test('explicit empty class allowed but undeclared emptiness incomplete',()=>withTempDir(async root=>{
  const rows=genericRecords();rows.keys=[];await writeBundle(root,'aws',rows);assert.equal((await load(root)).classesComplete,5);
  await editManifest(root,m=>{m.evidence.keys.emptyVerified=false;});assert.ok((await load(root)).findings.some(f=>f.ruleId==='class-incomplete'));
}));
