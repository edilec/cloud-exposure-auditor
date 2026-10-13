import test from 'node:test';import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';import {join} from 'node:path';
import {withTempDir} from './helpers.mjs';import {runCase} from '../scripts/mutation-check.mjs';
test('mutation runner distinguishes assertion kill survival invalid and timeout',()=>withTempDir(async root=>{
  await writeFile(join(root,'flag.mjs'),'export const flag=true;\n');await writeFile(join(root,'probe.test.mjs'),"import test from 'node:test';import assert from 'node:assert/strict';import {flag} from './flag.mjs';test('behavior',()=>assert.equal(flag,true));\n");
  const base={root,file:'flag.mjs',selectors:['probe.test.mjs'],from:'true',timeout:30000};
  assert.equal((await runCase({...base,to:'false'})).outcome,'killed');
  assert.equal((await runCase({...base,to:'(true)'})).outcome,'survived');
  assert.equal((await runCase({...base,to:'('})).outcome,'invalid-mutant');
  assert.equal((await runCase({...base,to:'false',timeout:1})).outcome,'timeout');
  assert.equal(await (await import('node:fs/promises')).readFile(join(root,'flag.mjs'),'utf8'),'export const flag=true;\n');
}));
