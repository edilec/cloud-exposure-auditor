import test from 'node:test';
import assert from 'node:assert/strict';
import {parseUniqueJson} from '../src/json.mjs';
import {createBudget} from '../src/budget.mjs';
const options=()=>({location:{file:'@bundle-0001',pointer:''},budget:createBudget({clock:()=>0})});
test('valid JSON and literal replacement character preserved',()=>assert.deepEqual(parseUniqueJson(Buffer.from('{"a":"�","b":[true,1]}'),options()),{a:'�',b:[true,1]}));
test('strict-parsers-do-not-echo secret-like malformed JSON',()=>{
  for(const text of ['at position 1','synthetic-secret\nnot-json','{"a": synthetic-private}'])assert.throws(()=>parseUniqueJson(Buffer.from(text),options()),e=>e.ruleId==='input-invalid'&&!e.message.includes('synthetic'));
});
test('escaped duplicate JSON keys refused',()=>assert.throws(()=>parseUniqueJson(Buffer.from('{"a":1,"\\u0061":2}'),options()),e=>e.ruleId==='duplicate-json-key'));
test('invalid UTF8 still refused alongside literal replacement character',()=>assert.throws(()=>parseUniqueJson(Buffer.concat([Buffer.from('{"a":"�'),Buffer.from([255]),Buffer.from('"}')]),options()),e=>e.ruleId==='utf8-invalid'));
test('container depth sixteen accepted seventeen refused',()=>{
  assert.doesNotThrow(()=>parseUniqueJson(Buffer.from('['.repeat(16)+'0'+']'.repeat(16)),options()));
  assert.throws(()=>parseUniqueJson(Buffer.from('['.repeat(17)+'0'+']'.repeat(17)),options()),e=>e.ruleId==='depth-limit');
});
test('only JSON whitespace and finite safe integer values',()=>{
  for(const text of ['\u00a0{}','{"x":1e999}','{"x":9007199254740993}'])assert.throws(()=>parseUniqueJson(Buffer.from(text),options()),e=>e.ruleId==='input-invalid');
});
