import test from 'node:test';import assert from 'node:assert/strict';
import {writeFile,readFile,unlink,symlink} from 'node:fs/promises';import {join} from 'node:path';
import {runCli} from '../src/cli.mjs';
import {runCliFixture,withTempDir,writeBundle,safeRecords,NOW,sha256,editManifest} from './helpers.mjs';
test('help reads nothing and invalid usage has no report',()=>{
  const help=runCliFixture(['--help']);assert.equal(help.code,0);assert.ok(help.stdout.includes('--manifest'));assert.equal(help.stderr,'');
  for(const args of [[],['--out','private'],['--root','missing','--manifest','a','--now',NOW],['--help','--human'],['--root','x','--root','x'],['--root','x','--manifest','../x','--now',NOW],['--root','x','--manifest','x','--now','2026-02-29T00:00:00Z'],['--root','x','--manifest','x','--now',NOW,'--key-age-days','1.5']]){
    const r=runCliFixture(args);assert.equal(r.code,2);assert.equal(r.stdout,'');assert.equal(r.stderr,'Invalid configuration. Use --help.\n');
  }
});
test('unreadable manifest has incomplete JSON report',()=>withTempDir(async root=>{
  const r=runCliFixture(['--root',root,'--manifest','missing.json','--now',NOW]);assert.equal(r.code,2);assert.equal(r.report.status,'incomplete');assert.deepEqual(r.report.findings.map(f=>f.ruleId),['input-unreadable']);assert.equal(r.report.findings[0].location.file,'@manifest');
}));
test('normal JSON-only stdout and human summary share identical reports',()=>withTempDir(async root=>{
  await writeBundle(root,'aws',safeRecords('aws'));const args=['--root',root,'--manifest','manifest.json','--now',NOW];
  const r=runCliFixture(args),h=runCliFixture([...args,'--human']);assert.equal(r.code,0);assert.equal(r.stderr,'');assert.equal(r.stdout,h.stdout);assert.equal(h.stderr,'Cloud exposure audit: pass; 5 records checked; 0 errors; 0 warnings.\n');assert.equal(r.stdout.endsWith('\n'),true);
}));
test('malformed subject cannot leak parser text',()=>withTempDir(async root=>{
  await writeFile(join(root,'manifest.json'),'private-sentinel at position 1\n');const r=runCliFixture(['--root',root,'--manifest','manifest.json','--now',NOW]);assert.equal(r.code,2);assert.equal(r.report.findings[0].ruleId,'input-invalid');assert.equal((r.stdout+r.stderr).includes('private-sentinel'),false);
}));
test('malformed UTF8 bundle and read escape are incomplete',()=>withTempDir(async root=>{
  await writeBundle(root,'aws',safeRecords('aws'));const bytes=Buffer.from([255]);await writeFile(join(root,'storage.json'),bytes);await editManifest(root,m=>{m.files[0].sha256=sha256(bytes);});
  let r=runCliFixture(['--root',root,'--manifest','manifest.json','--now',NOW]);assert.equal(r.code,2);assert.ok(r.report.findings.some(f=>f.ruleId==='utf8-invalid'));
  await unlink(join(root,'storage.json'));await symlink('/etc/hosts',join(root,'storage.json'));
  r=runCliFixture(['--root',root,'--manifest','manifest.json','--now',NOW]);assert.equal(r.code,2);assert.ok(r.report.findings.some(f=>f.ruleId==='input-unreadable'));assert.equal(r.stdout.includes('/etc/hosts'),false);
}));
test('injected exact deadline and N+1 CLI status',()=>withTempDir(async root=>{
  await writeBundle(root,'aws',safeRecords('aws'));for(const [elapsed,want]of [[10000,0],[10001,2]]){
    let calls=0,stdout='',stderr='';const code=await runCli(['--root',root,'--manifest','manifest.json','--now',NOW],{clock:()=>calls++===0?0:elapsed,stdout:{write:s=>{stdout+=s;}},stderr:{write:s=>{stderr+=s;}}});
    assert.equal(code,want);const report=JSON.parse(stdout);assert.equal(report.status,want===0?'pass':'incomplete');if(want===2)assert.ok(report.findings.some(f=>f.ruleId==='time-limit'));assert.equal(stderr,'');
  }
}));
