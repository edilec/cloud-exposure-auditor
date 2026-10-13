import test from 'node:test';
import assert from 'node:assert/strict';
import {finding,buildReport,exitCode,byCodeUnit,RULES} from '../src/report.mjs';
const loc={file:'@bundle-0001',pointer:'/records/0'};
test('complete safe evidence passes',()=>{
  const r=buildReport({findings:[],checked:5,files:7,classesComplete:5});
  assert.equal(r.tool,'cloud-exposure-auditor'); assert.equal(r.status,'pass');
  assert.equal(exitCode(r),0); assert.deepEqual(r.findings,[]);
  assert.equal(r.provenance.coverage,'operator-supplied');
});
test('incomplete-dominates-exposure',()=>{
  const r=buildReport({findings:[finding('storage-public',loc),finding('class-incomplete',{file:'@manifest',pointer:'/evidence/keys'})],checked:1,files:2,classesComplete:4});
  assert.equal(r.status,'incomplete'); assert.equal(exitCode(r),2);
  assert.equal(r.summary.errors,1); assert.equal(r.summary.warnings,1);
});
test('exposure has fail behavior',()=>{
  for(const id of ['storage-public','admin-ingress-broad','key-age-exceeded','privileged-mfa-disabled','audit-logging-disabled']){
    const r=buildReport({findings:[finding(id,loc)],checked:1,files:2,classesComplete:5});
    assert.equal(r.status,'fail'); assert.equal(exitCode(r),1); assert.equal(r.findings[0].severity,'error');
  }
});
test('no records cannot pass',()=>{
  const r=buildReport({findings:[],checked:0,files:1,classesComplete:5});
  assert.equal(r.status,'incomplete'); assert.equal(r.findings[0].ruleId,'no-evidence');
});
test('every incomplete catalog rule prevents a pass',()=>{
  for(const [id,rule] of Object.entries(RULES)) if(!['storage-public','admin-ingress-broad','key-age-exceeded','privileged-mfa-disabled','audit-logging-disabled'].includes(id)){
    const r=buildReport({findings:[finding(id,loc)],checked:1,files:2,classesComplete:4});
    assert.equal(r.status,'incomplete',id); assert.equal(exitCode(r),2,id); assert.equal(r.summary.warnings,1,id);
  }
});
test('code-unit-sort-is-observable',()=>{
  assert.deepEqual(['a_b','a-b','a','Z'].sort(byCodeUnit),['Z','a','a-b','a_b']);
  const fs=['/a_b','/a-b','/a','/Z'].map(pointer=>finding('input-invalid',{file:'@bundle-0001',pointer}));
  const r=buildReport({findings:fs,checked:1,files:1,classesComplete:4});
  assert.deepEqual(r.findings.map(f=>f.location.pointer),['/Z','/a','/a-b','/a_b']);
  const mixed=buildReport({findings:[finding('utf8-invalid',{file:'@manifest',pointer:'/Z'}),finding('input-invalid',{file:'@bundle-0002',pointer:'/Z'}),finding('utf8-invalid',loc),finding('input-invalid',loc),finding('input-invalid',loc)],checked:1,files:2,classesComplete:4});
  assert.deepEqual(mixed.findings.map(f=>[f.location.file,f.ruleId]),[['@bundle-0001','input-invalid'],['@bundle-0001','utf8-invalid'],['@bundle-0002','input-invalid'],['@manifest','utf8-invalid']]);
});
test('unknown rules and untrusted locations are refused',()=>{
  assert.throws(()=>finding('unknown',loc));
  assert.throws(()=>finding('input-invalid',{file:'/private/secret',pointer:''}));
  assert.throws(()=>finding('input-invalid',{file:'@manifest',pointer:'/secret\n'}));
});
