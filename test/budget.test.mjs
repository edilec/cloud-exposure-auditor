import test from 'node:test';
import assert from 'node:assert/strict';
import {createBudget} from '../src/budget.mjs';
const loc={file:'@manifest',pointer:''};
test('exact deadline accepted and one millisecond beyond incomplete',()=>{
  let elapsed=0; const b=createBudget({clock:()=>elapsed});
  elapsed=10000; assert.doesNotThrow(()=>b.check(loc));
  elapsed=10001; assert.throws(()=>b.check(loc),e=>e.ruleId==='time-limit');
});
test('exact total records accepted and N+1 refused',()=>{
  const b=createBudget({clock:()=>0}); b.addRecords(99999,loc); b.addRecords(1,loc);
  assert.equal(b.records,100000); assert.throws(()=>b.addRecords(1,loc),e=>e.ruleId==='record-limit');
});
test('exact file count accepted and duplicate identity not double counted',()=>{
  const b=createBudget({clock:()=>0}); for(let i=0;i<100;i++)b.registerFile(String(i),loc);
  b.registerFile('0',loc); assert.equal(b.files,100);
  assert.throws(()=>b.registerFile('100',loc),e=>e.ruleId==='file-limit');
});
test('invalid and backwards clocks cannot renew budget',()=>{
  for(const bad of [NaN,Infinity,-1]){
    let t=0; const b=createBudget({clock:()=>t});t=bad;
    assert.throws(()=>b.check(loc),e=>e.ruleId==='execution-failed');
  }
});
