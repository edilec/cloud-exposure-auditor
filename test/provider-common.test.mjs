import test from 'node:test';
import assert from 'node:assert/strict';
import {broadAdminIngress,keyAgeExceeded,effectiveMfa} from '../src/provider-common.mjs';
import {NOW} from './helpers.mjs';
const ingress=(cidrs,ports=[{from:22,to:22}],protocol='tcp')=>broadAdminIngress({cidrs,ports,protocol});
test('IPv4 IPv6 and mapped boundary pairs',()=>{
  for(const cidr of ['0.0.0.0/0','10.0.0.0/8','::/0','2001:db8::/32','::ffff:0:0/96'])assert.equal(ingress([cidr]),true,cidr);
  for(const cidr of ['10.0.0.0/9','2001:db8::/33','::ffff:192.0.2.0/120'])assert.equal(ingress([cidr]),false,cidr);
});
test('admin port ranges and protocol edges',()=>{
  for(const p of [22,3389,5985,5986])assert.equal(ingress(['0.0.0.0/0'],[{from:p,to:p}]),true);
  assert.equal(ingress(['0.0.0.0/0'],[{from:21,to:23}]),true);assert.equal(ingress(['0.0.0.0/0'],[{from:2222,to:2222}]),false);
  assert.equal(ingress(['0.0.0.0/0'],[{from:22,to:22}],'udp'),false);assert.equal(ingress(['::/0'],[],'all'),true);
});
test('invalid CIDRs and port ranges incomplete',()=>{
  for(const cidr of ['300.0.0.0/0','10.0.0.1/24','::1/0','::/129','fe80::%zone/64','private-host','Internet'])assert.throws(()=>ingress([cidr]),e=>e.ruleId==='unsupported-field');
  assert.throws(()=>ingress(['0.0.0.0/0'],[{from:23,to:22}]),e=>e.ruleId==='unsupported-field');
});
test('exact key threshold one day and one millisecond beyond',()=>{
  const ctx={nowMs:Date.parse(NOW),keyAgeDays:90};
  assert.equal(keyAgeExceeded({createdAt:'2026-07-15T00:00:00Z',active:true},ctx),false);
  assert.equal(keyAgeExceeded({createdAt:'2026-07-14T00:00:00Z',active:true},ctx),true);
  assert.equal(keyAgeExceeded({createdAt:'2026-07-14T23:59:59.999Z',active:true},ctx),true);
  assert.equal(keyAgeExceeded({createdAt:'2020-01-01T00:00:00Z',active:false},ctx),false);
  for(const date of ['2026-10-14T00:00:00Z','2026-02-29T00:00:00Z','2026-01-01T00:00:00+00:00'])assert.throws(()=>keyAgeExceeded({createdAt:date,active:true},ctx),e=>e.ruleId==='date-invalid');
});
test('effective MFA differs from registration and unknown',()=>{
  const config={allowedKinds:['user','federated'],allowedBases:['direct','federated']};
  const row={principalKind:'user',privileged:true,mfa:{status:'enabled',basis:'direct',effective:true}};
  assert.equal(effectiveMfa(row,config),false);row.mfa.status='disabled';assert.equal(effectiveMfa(row,config),true);
  row.privileged=false;assert.equal(effectiveMfa(row,config),false);row.mfa.effective=false;
  assert.throws(()=>effectiveMfa(row,config),e=>e.ruleId==='unsupported-field');
});
