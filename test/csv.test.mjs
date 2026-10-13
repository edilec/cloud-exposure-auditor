import test from 'node:test';
import assert from 'node:assert/strict';
import {parseCsv} from '../src/csv.mjs';
import {createBudget} from '../src/budget.mjs';
const parse=text=>parseCsv(Buffer.from(text),{fields:{id:'string',active:'boolean',count:'integer',data:'json'},location:{file:'@bundle-0001',pointer:''},budget:createBudget({clock:()=>0})});
test('CSV CRLF and false conversion with nested JSON',()=>{
  const got=parse('id,active,count,data\r\nsafe,false,1,"{""x"":true}"');
  assert.deepEqual(got.records,[{id:'safe',active:false,count:1,data:{x:true}}]);assert.deepEqual(got.rowLines,[2]);
});
test('csv-row-provenance quoted newline and escaped commas',()=>{
  const got=parse('id,active,count,data\n"a,\nb",true,2,{}\nlast,false,0,{}\n');
  assert.equal(got.records[0].id,'a,\nb');assert.deepEqual(got.rowLines,[2,4]);
});
test('CSV malformed headers numbers quotes and records refused',()=>{
  for(const text of ['id,id,count,data\na,true,1,{}','id,active,count,extra\na,true,1,{}','id,active,count,data\na,false,01,{}','id,active,count,data\na,False,1,{}','id,active,count,data\na,true,1','id,active,count,data\n"broken,true,1,{}','id,active,count,data\n\n'])assert.throws(()=>parse(text),e=>e.ruleId==='csv-invalid');
});
test('a malformed CSV header points to its actual first line',()=>{
  assert.throws(()=>parse('id,id,count,data\na,true,1,{}\nb,false,2,{}\n'),e=>e.ruleId==='csv-invalid'&&e.location.pointer==='row:1');
});
