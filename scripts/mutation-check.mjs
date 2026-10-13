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
async function enumerate(root){
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
    results.push({name:c.name,file:c.file,line:source.slice(0,source.indexOf(c.from)).split('\n').length,from:c.from,to:c.to,selectors:c.selectors,pattern:c.pattern??null,outcome:result.outcome});
    process.stderr.write(`${c.name}: ${result.outcome}\n`);
  }
  process.stdout.write(JSON.stringify({enumeration:results,total:results.length,killed:results.filter(r=>r.outcome==='killed').length})+'\n');
  if(results.some(r=>r.outcome!=='killed'))process.exitCode=1;
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  if(process.argv.includes('--self-test')){const r=spawnSync(process.execPath,['--test','test/mutation.test.mjs'],{stdio:'inherit'});process.exitCode=r.status??1;}
  else await main();
}
