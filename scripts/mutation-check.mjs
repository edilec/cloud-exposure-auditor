import {mkdtemp,cp,rm,readFile,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';import {join,resolve} from 'node:path';import {fileURLToPath} from 'node:url';import {spawnSync} from 'node:child_process';
export function classifyResult(result){
  const output=(result.stdout??'')+(result.stderr??'');
  if(result.error?.code==='ETIMEDOUT')return 'timeout';
  if(result.error||result.signal)return 'runner-error';
  if(/SyntaxError|ERR_MODULE_NOT_FOUND|ERR_MODULE_NOT_FOUND/.test(output))return 'invalid-mutant';
  if(!/(?:tests [1-9]\d*|# tests [1-9]\d*)/.test(output))return 'runner-error';
  if(result.status===0)return 'survived';
  return /ERR_ASSERTION|AssertionError/.test(output)?'killed':'runner-error';
}
export async function runCase({root,file,from,to,selectors,pattern,timeout=30000,preload}){
  const copy=await mkdtemp(join(tmpdir(),'cea-mutant-'));
  try{
    await cp(root,copy,{recursive:true,filter:path=>!/(?:^|\/)(?:\.git|\.superpowers|node_modules)(?:\/|$)/.test(path)&&!path.endsWith('.tgz')});
    const path=join(copy,file),original=await readFile(path,'utf8');
    if(original.split(from).length!==2)throw new Error('Mutation must have one source match.');
    await writeFile(path,original.replace(from,to));
    const args=[...(preload?['--import',join(copy,preload)]:[]),'--test',...(pattern?['--test-name-pattern',pattern]:[]),...selectors];
    const env={...process.env};delete env.NODE_OPTIONS;delete env.NODE_TEST_CONTEXT;
    const result=spawnSync(process.execPath,args,{cwd:copy,env,encoding:'utf8',timeout,maxBuffer:8*1024*1024});
    return {outcome:classifyResult(result)};
  }finally{await rm(copy,{recursive:true,force:true});}
}
export async function equivalenceProof(root,domain){
  const source=await readFile(join(root,'src/report.mjs'),'utf8');let values;
  if(domain==='roles'){
    if(!source.includes("!/^@(?:manifest|bundle-\\d{4})$/.test(location.file)"))throw new Error('Location domain changed.');
    values=['@manifest',...Array.from({length:10000},(_,i)=>`@bundle-${String(i).padStart(4,'0')}`)];
  }else if(domain==='rules'){
    const {RULES}=await import(new URL('../src/report.mjs',import.meta.url));values=Object.keys(RULES);
  }else throw new Error('Unsupported equivalence domain.');
  const codeUnit=[...values].sort(),collator=new Intl.Collator('en'),collated=[...values].sort(collator.compare);
  if(JSON.stringify(codeUnit)!==JSON.stringify(collated)||collated.some((v,i)=>i>0&&collator.compare(collated[i-1],v)===0))throw new Error('Comparator is not equivalent on the permitted domain.');
  return {domain,values:values.length,byteIdenticalOrder:true,noCollationTies:true};
}
export async function enumerate(root){
  const report=await readFile(join(root,'src/report.mjs'),'utf8'),cases=[];
  const classFor={'storage-public':'storage','admin-ingress-broad':'ingress','key-age-exceeded':'keys','privileged-mfa-disabled':'mfa','audit-logging-disabled':'logging'};
  for(const m of report.matchAll(/^  '([^']+)': \{severity:'(error|warning)',incomplete:(true|false),/gm)){
    const [from,id,severity,incomplete]=m;
    cases.push({name:`severity:${id}`,file:'src/report.mjs',from,to:from.replace(`severity:'${severity}'`,`severity:'${severity==='error'?'warning':'info'}'`),selectors:[severity==='error'?'test/integration.test.mjs':'test/report.test.mjs'],pattern:severity==='error'?`${classFor[id]} exposure real exit one`:undefined});
    if(incomplete==='true')cases.push({name:`incomplete:${id}`,file:'src/report.mjs',from,to:from.replace('incomplete:true','incomplete:false'),selectors:['test/report.test.mjs']});
  }
  const add=(name,file,from,to,selectors)=>cases.push({name,file,from,to,selectors});
  add('deadline-tighten','src/budget.mjs','current-start>LIMITS.milliseconds','current-start>=LIMITS.milliseconds',['test/budget.test.mjs']);
  add('files-tighten','src/budget.mjs','files.size>LIMITS.files','files.size>=LIMITS.files',['test/budget.test.mjs']);
  add('records-tighten','src/budget.mjs','records>LIMITS.records','records>=LIMITS.records',['test/budget.test.mjs']);
  add('bytes-tighten','src/input.mjs','opened.size>LIMITS.bytes','opened.size>=LIMITS.bytes',['test/input.test.mjs']);
  add('depth-tighten','src/json.mjs','stack.length>LIMITS.depth','stack.length>=LIMITS.depth',['test/json.test.mjs']);
  add('fatal-decode','src/json.mjs','{fatal:true}','{fatal:false}',['test/json.test.mjs']);
  add('code-unit-comparator','src/report.mjs','a < b ? -1 : a > b ? 1 : 0',"new Intl.Collator('en').compare(a,b)",['test/report.test.mjs']);
  add('key-age-tighten','src/provider-common.mjs','nowMs-created>keyAgeDays*86400000','nowMs-created>=keyAgeDays*86400000',['test/provider-common.test.mjs']);
  add('mfa-effective','src/provider-common.mjs','m.effective===true','true',['test/provider-common.test.mjs']);
  add('aws-future-block-confusion','src/providers/aws.mjs','policyPublic&&!p.restrictPublicBuckets','policyPublic&&!p.blockPublicPolicy',['test/aws.test.mjs']);
  add('gcp-uniform-iam','src/providers/gcp.mjs',"p.effective!=='enforced'&&(iamPublic||aclPublic)","p.effective!=='enforced'&&!row.uniformBucketLevelAccess&&(iamPublic||aclPublic)",['test/gcp.test.mjs']);
  add('azure-effective-disposition','src/providers/azure.mjs',"row.effective==='applies'&&broad","broad",['test/azure.test.mjs']);
  add('loader-completeness','src/manifest.mjs','if(klass)incompleteClasses.add(klass);else','if(klass)void 0;else',['test/manifest.test.mjs']);
  add('deadline-widen','src/budget.mjs','current-start>LIMITS.milliseconds','current-start>LIMITS.milliseconds+1',['test/budget.test.mjs']);
  add('files-widen','src/budget.mjs','files.size>LIMITS.files','files.size>LIMITS.files+1',['test/budget.test.mjs']);
  add('records-widen','src/budget.mjs','records>LIMITS.records','records>LIMITS.records+1',['test/budget.test.mjs']);
  add('depth-widen','src/json.mjs','stack.length>LIMITS.depth','stack.length>LIMITS.depth+1',['test/json.test.mjs']);
  add('bytes-post-open-widen','src/input.mjs','total>LIMITS.bytes','total>LIMITS.bytes+1',['test/input.test.mjs']);
  add('real-root-confinement','src/input.mjs',"if(rel===''||rel==='..'||rel.startsWith(`..${sep}`)||isAbsolute(rel))throw new EvidenceError('input-unreadable',location);",'void 0;',['test/input.test.mjs']);
  add('decoded-duplicate-key','src/json.mjs','if(top.seen.has(token))','if(false)',['test/json.test.mjs']);
  add('unknown-own-key','src/schema.mjs','Object.keys(value).length===keys.length&&','',['test/manifest.test.mjs']);
  add('normalized-digest','src/manifest.mjs','if(digest!==d.sha256)','if(false)',['test/manifest.test.mjs']);
  add('mandatory-key-inventory','src/manifest.mjs','SOURCE_KINDS[provider][klass].some(kind=>!kinds.has(kind))','false',['test/manifest.test.mjs']);
  add('aws-acl-policy-deny','src/providers/aws.mjs',"((acl.publicRead&&!denied.has('read'))||(acl.publicWrite&&!denied.has('write')))",'(acl.publicRead||acl.publicWrite)',['test/aws.test.mjs']);
  cases.push({name:'library-unknown-options',file:'src/index.mjs',from:"Reflect.ownKeys(options).some(key=>!['root','manifestPath','now','keyAgeDays','clock'].includes(key))",to:'false',selectors:['test/integration.test.mjs'],pattern:'policy typos'});
  cases.push({name:'provider-type-coercion',file:'src/schema.mjs',from:"typeof raw.provider==='string'&&",to:'',selectors:['test/integration.test.mjs'],pattern:'nonstring provider'});
  add('csv-header-location','src/csv.mjs','startLine=headerLine;','',['test/csv.test.mjs']);
  add('lexical-traversal','src/input.mjs',"if(typeof relativePath!=='string'||isAbsolute(relativePath)||relativePath.split(/[\\\\/]/).includes('..'))throw new EvidenceError('input-unreadable',location);",'void 0;',['test/input.test.mjs']);
  add('regular-file-before-open','src/input.mjs',"if(!before.isFile())throw new EvidenceError('input-unreadable',location);",'void 0;',['test/input.test.mjs']);
  add('opened-regular-file','src/input.mjs','!opened.isFile()||','',['test/input.test.mjs']);
  add('opened-file-identity','src/input.mjs','opened.dev!==before.dev||opened.ino!==before.ino','false',['test/input.test.mjs']);
  add('bytes-pre-open-widen','src/input.mjs','opened.size>LIMITS.bytes','opened.size>LIMITS.bytes+1',['test/input.test.mjs']);
  add('bytes-post-open-tighten','src/input.mjs','total>LIMITS.bytes','total>=LIMITS.bytes',['test/input.test.mjs']);
  add('manifest-files-tighten','src/manifest.mjs','paths.size>LIMITS.files','paths.size>=LIMITS.files',['test/manifest.test.mjs']);
  add('manifest-files-widen','src/manifest.mjs','paths.size>LIMITS.files','paths.size>LIMITS.files+1',['test/manifest.test.mjs']);
  add('raw-source-digest','src/manifest.mjs','digest!==s.sha256||(sourceHashes.has(key)&&sourceHashes.get(key)!==s.sha256)','false',['test/manifest.test.mjs']);
  add('descriptor-record-count','src/manifest.mjs','records.length!==c.recordCount','false',['test/manifest.test.mjs']);
  add('total-record-count','src/manifest.mjs','totals[klass]!==e.expectedRecords','false',['test/manifest.test.mjs']);
  add('descriptor-region-coverage','src/manifest.mjs','!expectedRegions.includes(r)','false',['test/manifest.test.mjs']);
  add('actual-record-region-coverage','src/manifest.mjs','!c.regions.includes(row.region)','false',['test/manifest.test.mjs']);
  add('total-region-coverage','src/manifest.mjs','expected.some(r=>!coverage[klass].has(r))','false',['test/manifest.test.mjs']);
  add('global-loader-completeness','src/manifest.mjs','else for(const c of CLASS_IDS)incompleteClasses.add(c);','else void 0;',['test/manifest.test.mjs']);
  cases.push({name:'record-completeness',file:'src/provider-common.mjs',from:'incomplete=true;findings.push',to:'findings.push',selectors:['test/integration.test.mjs'],pattern:'unsupported provider facts'});
  cases.push({name:'adapter-completeness',file:'src/provider-common.mjs',from:'if(r.incomplete)result.incompleteClasses.add(bundle.evidenceClass);',to:'void 0;',selectors:['test/integration.test.mjs'],pattern:'unsupported provider facts'});
  add('logging-completeness','src/provider-common.mjs',"result.incompleteClasses.add('logging');",'void 0;',['test/adversarial.test.mjs']);
  add('pointer-tuple-comparator','src/report.mjs','byCodeUnit(a.location.pointer,b.location.pointer)',"new Intl.Collator('en').compare(a.location.pointer,b.location.pointer)",['test/report.test.mjs']);
  add('aws-acl-ignore','src/providers/aws.mjs','!p.ignorePublicAcls&&',"",['test/aws.test.mjs']);
  add('aws-deny-permission-matching','src/providers/aws.mjs','s.permissions.some(permission=>!denied.has(permission))','s.permissions.length>0',['test/aws.test.mjs']);
  add('gcp-effective-pap','src/providers/gcp.mjs',"p.effective!=='enforced'", "p.configured!=='enforced'",['test/gcp.test.mjs']);
  add('aws-logging-categories','src/providers/aws.mjs',"!row.enabled||row.managementEvents!=='all'", "!row.enabled&&row.managementEvents!=='all'",['test/aws.test.mjs']);
  add('azure-logging-categories','src/providers/azure.mjs','!row.enabled||!row.categories.administrative||!row.categories.security','!row.enabled||(!row.categories.administrative&&!row.categories.security)',['test/azure.test.mjs']);
  add('gcp-logging-categories','src/providers/gcp.mjs','!row.enabled||!row.categories.adminActivity||!row.categories.dataAccess','!row.enabled||(!row.categories.adminActivity&&!row.categories.dataAccess)',['test/gcp.test.mjs']);
  cases.push({name:'file-tuple-comparator',file:'src/report.mjs',from:'byCodeUnit(a.location.file,b.location.file)',to:"new Intl.Collator('en').compare(a.location.file,b.location.file)",selectors:['test/report.test.mjs'],equivalenceDomain:'roles'});
  cases.push({name:'rule-tuple-comparator',file:'src/report.mjs',from:'byCodeUnit(a.ruleId,b.ruleId)',to:"new Intl.Collator('en').compare(a.ruleId,b.ruleId)",selectors:['test/report.test.mjs'],equivalenceDomain:'rules'});
  return cases;
}
async function main(){
  const root=resolve(fileURLToPath(new URL('../',import.meta.url))),cases=await enumerate(root),results=[],baselines=new Set();
  for(const c of cases){
    const key=JSON.stringify([c.selectors,c.pattern]);
    if(!baselines.has(key)){
      const baseline=spawnSync(process.execPath,['--import',join(root,'test/no-network-preload.mjs'),'--test',...(c.pattern?['--test-name-pattern',c.pattern]:[]),...c.selectors],{cwd:root,encoding:'utf8',timeout:30000,maxBuffer:8*1024*1024});
      if(classifyResult(baseline)!=='survived')throw new Error(`Mutation baseline must pass: ${c.name} (${classifyResult(baseline)}).`);baselines.add(key);
    }
    const result=await runCase({root,...c,preload:'test/no-network-preload.mjs'});const source=await readFile(join(root,c.file),'utf8');
    if(result.outcome==='survived'&&c.equivalenceDomain){result.proof=await equivalenceProof(root,c.equivalenceDomain);result.observedOutcome=result.outcome;result.outcome='equivalent';}
    results.push({name:c.name,file:c.file,line:source.slice(0,source.indexOf(c.from)).split('\n').length,from:c.from,to:c.to,selectors:c.selectors,pattern:c.pattern??null,...result});
    process.stderr.write(`${c.name}: ${result.outcome}\n`);
  }
  process.stdout.write(JSON.stringify({enumeration:results,total:results.length,killed:results.filter(r=>r.outcome==='killed').length})+'\n');
  if(results.some(r=>!['killed','equivalent'].includes(r.outcome)))process.exitCode=1;
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  if(process.argv.includes('--self-test')){const r=spawnSync(process.execPath,['--test','test/mutation.test.mjs'],{stdio:'inherit'});process.exitCode=r.status??1;}
  else await main();
}
