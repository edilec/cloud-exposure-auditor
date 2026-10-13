import test from 'node:test';import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';import {readFile,readdir} from 'node:fs/promises';import {join} from 'node:path';
import {withTempDir,writeBundle,safeRecords,exposeOne,runCliFixture,NOW,toolRoot} from './helpers.mjs';
test('offline preload denies safe transport controls without a listener',()=>{
  const code="import assert from 'node:assert/strict'; import net from 'node:net'; import http from 'node:http'; import dns from 'node:dns'; import dgram from 'node:dgram'; assert.throws(()=>fetch('data:text/plain,probe'),/Network disabled/); assert.throws(()=>net.Socket.prototype.connect.call(null),/Network disabled/); assert.throws(()=>http.request({protocol:'invalid:'}),/Network disabled/); assert.throws(()=>dns.lookup(),/Network disabled/); assert.throws(()=>dgram.createSocket(),/Network disabled/); assert.equal(net.isIP('127.0.0.1'),4);";
  const r=spawnSync(process.execPath,['--import',join(toolRoot,'test/no-network-preload.mjs'),'--input-type=module','-e',code],{encoding:'utf8',timeout:30000});assert.equal(r.status,0,r.stderr);assert.equal(r.signal,null);
});
for(const provider of ['aws','azure','gcp'])test(`${provider} actual CLI works under transport denial`,()=>withTempDir(async root=>{
  await writeBundle(root,provider,safeRecords(provider));let r=runCliFixture(['--root',root,'--manifest','manifest.json','--now',NOW],{preload:'test/no-network-preload.mjs'});assert.equal(r.code,0,r.stderr);
  await writeBundle(root,provider,exposeOne(provider,'storage'));r=runCliFixture(['--root',root,'--manifest','manifest.json','--now',NOW],{preload:'test/no-network-preload.mjs'});assert.equal(r.code,1);assert.equal(r.report.findings[0].ruleId,'storage-public');
}));
test('product imports only local modules and approved platform capabilities',async()=>{
  const allowed=new Set(['node:fs/promises','node:fs','node:path','node:crypto','node:net']);
  async function check(dir){for(const e of await readdir(dir,{withFileTypes:true})){const path=join(dir,e.name);if(e.isDirectory()){await check(path);continue;}if(!e.name.endsWith('.mjs'))continue;const source=await readFile(path,'utf8');
    for(const match of source.matchAll(/from\s+['"]([^'"]+)['"]/g)){assert.ok(match[1].startsWith('.')||allowed.has(match[1]),path);if(match[1]==='node:net')assert.ok(/import\s*\{isIP\}\s*from/.test(source));}
    assert.equal(/\bimport\s*\(|\bfetch\s*\(|\b(?:writeFile|appendFile|createWriteStream|exec|spawn)\s*\(/.test(source),false,path);
  }}await check(join(toolRoot,'src'));await check(join(toolRoot,'bin'));
});
