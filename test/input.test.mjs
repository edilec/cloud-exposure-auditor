import test from 'node:test';
import assert from 'node:assert/strict';
import {writeFile,symlink,mkdir,realpath} from 'node:fs/promises';
import {join} from 'node:path';
import {withTempDir} from './helpers.mjs';
import fsPromises from 'node:fs/promises';
import {syncBuiltinESMExports} from 'node:module';
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
  await writeFile(join(root,'exact'),Buffer.alloc(8388608));let exact;await assert.doesNotReject(async()=>{exact=await read(root,'exact');});assert.equal(exact.bytes.length,8388608);
  await writeFile(join(root,'above'),Buffer.alloc(8388609));await assert.rejects(read(root,'above'),e=>e.ruleId==='byte-limit');
}));
test('a file growing after stat still hits the bounded read limit',()=>withTempDir(async root=>{
  const path=join(root,'growing');await writeFile(path,Buffer.alloc(8388608));const originalOpen=fsPromises.open;
  fsPromises.open=async(...args)=>{
    const handle=await originalOpen(...args),originalRead=handle.read.bind(handle);let first=true;
    handle.read=async(...readArgs)=>{if(first){first=false;await fsPromises.appendFile(path,'x');}return originalRead(...readArgs);};return handle;
  };
  syncBuiltinESMExports();
  try{await assert.rejects(read(root,'growing'),e=>e.ruleId==='byte-limit');}
  finally{fsPromises.open=originalOpen;syncBuiltinESMExports();}
}));
test('lexical traversal is refused even when its target remains inside the root',()=>withTempDir(async root=>{
  await mkdir(join(root,'nested'));await writeFile(join(root,'safe'),'{}');
  await assert.rejects(read(root,'nested/../safe'),e=>e.ruleId==='input-unreadable');
}));
test('nonregular inputs are refused before opening can block',()=>withTempDir(async root=>{
  await mkdir(join(root,'directory'));const originalOpen=fsPromises.open;let opened=false;
  fsPromises.open=async()=>{opened=true;throw new Error('Synthetic blocking-open sentinel.');};syncBuiltinESMExports();
  try{await assert.rejects(read(root,'directory'),e=>e.ruleId==='input-unreadable');assert.equal(opened,false);}
  finally{fsPromises.open=originalOpen;syncBuiltinESMExports();}
}));
test('opened nonregular or replaced file identities cannot become usable evidence',()=>withTempDir(async root=>{
  await writeFile(join(root,'safe'),'{}');const originalOpen=fsPromises.open;
  for(const edit of [s=>({...s,isFile:()=>false}),s=>({...s,isFile:()=>true,dev:s.dev+1}),s=>({...s,isFile:()=>true,ino:s.ino+1})]){
    fsPromises.open=async(...args)=>{const handle=await originalOpen(...args),originalStat=handle.stat.bind(handle);let first=true;handle.stat=async()=>{const s=await originalStat();if(first){first=false;return edit(s);}return s;};return handle;};syncBuiltinESMExports();
    try{await assert.rejects(read(root,'safe'),e=>e.ruleId==='input-unreadable');}
    finally{fsPromises.open=originalOpen;syncBuiltinESMExports();}
  }
}));
test('declared oversized input is refused before reading any bytes',()=>withTempDir(async root=>{
  await writeFile(join(root,'above'),Buffer.alloc(8388609));const originalOpen=fsPromises.open;let reads=0;
  fsPromises.open=async(...args)=>{const handle=await originalOpen(...args),originalRead=handle.read.bind(handle);handle.read=async(...a)=>{reads++;return originalRead(...a);};return handle;};syncBuiltinESMExports();
  try{await assert.rejects(read(root,'above'),e=>e.ruleId==='byte-limit');assert.equal(reads,0);}
  finally{fsPromises.open=originalOpen;syncBuiltinESMExports();}
}));
