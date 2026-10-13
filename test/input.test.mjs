import test from 'node:test';
import assert from 'node:assert/strict';
import {writeFile,symlink,mkdir,realpath} from 'node:fs/promises';
import {join} from 'node:path';
import {withTempDir} from './helpers.mjs';
import {readBounded} from '../src/input.mjs';
import {createBudget} from '../src/budget.mjs';
const location={file:'@bundle-0001',pointer:''};
const read=(root,relativePath)=>readBounded({root,relativePath,location,budget:createBudget({clock:()=>0})});
test('confined regular and in-root symlink reads work',()=>withTempDir(async root=>{
  await writeFile(join(root,'safe.json'),'{}');await symlink(join(root,'safe.json'),join(root,'alias.json'));
  assert.equal(Buffer.from((await read(root,'safe.json')).bytes).toString(),'{}');
  assert.equal(Buffer.from((await read(root,'alias.json')).bytes).toString(),'{}');
  assert.equal(Buffer.from((await read(await realpath(root),'safe.json')).bytes).toString(),'{}');
}));
test('symlink escape, lexical escape, absolute, and nonregular files refused',()=>withTempDir(async parent=>{
  const root=join(parent,'root');await mkdir(root);await writeFile(join(parent,'outside'),'private-sentinel');
  await symlink(join(parent,'outside'),join(root,'escape'));
  for(const name of ['escape','../outside',join(parent,'outside'),'.','missing'])await assert.rejects(read(root,name),e=>e.ruleId==='input-unreadable');
}));
test('byte boundary accepted and N+1 refused by bounded reads',()=>withTempDir(async root=>{
  await writeFile(join(root,'exact'),Buffer.alloc(8388608));assert.equal((await read(root,'exact')).bytes.length,8388608);
  await writeFile(join(root,'above'),Buffer.alloc(8388609));await assert.rejects(read(root,'above'),e=>e.ruleId==='byte-limit');
}));
