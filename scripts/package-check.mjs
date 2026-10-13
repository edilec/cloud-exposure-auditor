import {readFile,mkdtemp,mkdir,writeFile,rm} from 'node:fs/promises';
import {join,resolve,dirname} from 'node:path';import {tmpdir} from 'node:os';import {fileURLToPath} from 'node:url';import {spawnSync} from 'node:child_process';import {createHash} from 'node:crypto';
export function validateMembers(members,pkg){
  for(const member of members){
    if(!member.startsWith('package/')||member.split('/').includes('..')||/[\\\u0000-\u001f\u007f-\u009f]/.test(member))throw new Error('Unsafe package member.');
    const name=member.slice(8);
    if(name!=='package.json'&&!pkg.files.some(f=>name===f||name.startsWith(f+'/')))throw new Error('Undeclared package member.');
  }
  for(const required of ['package/package.json','package/LICENSE','package/src/index.mjs','package/bin/cloud-exposure-auditor.mjs'])if(pkg.bin&&!members.includes(required))throw new Error('Required package member missing.');
}
async function main(){
  const root=resolve(fileURLToPath(new URL('../',import.meta.url))),pkg=JSON.parse(await readFile(join(root,'package.json'),'utf8'));
  for(const key of ['dependencies','devDependencies','optionalDependencies','peerDependencies'])if(Object.keys(pkg[key]??{}).length)throw new Error('Package must have zero dependencies.');
  for(const key of ['preinstall','install','postinstall','prepare','prepack','postpack'])if(Object.hasOwn(pkg.scripts,key))throw new Error('Lifecycle hooks are forbidden.');
  const scratch=await mkdtemp(join(tmpdir(),'cea-package-'));
  try{
    const preload=join(root,'test/no-network-preload.mjs'),manager=process.env.CEA_PNPM??'pnpm';
    const env={...process.env,NODE_OPTIONS:`--import ${JSON.stringify(preload)}`,PATH:dirname(process.execPath)+':'+(process.env.PATH??''),npm_config_userconfig:join(scratch,'npmrc'),npm_config_update_notifier:'false',npm_config_ignore_scripts:'true'};delete env.NODE_TEST_CONTEXT;
    await writeFile(env.npm_config_userconfig,'');
    const run=(command,args,cwd)=>{
      const r=spawnSync(command,args,{cwd,env,encoding:'utf8',timeout:60000,maxBuffer:8*1024*1024});
      if(r.status!==0||r.error||r.signal)throw new Error(`Offline local package command failed: ${command===manager?'pnpm':command==='tar'?'archive':'installed CLI'}.`);
      return r.stdout;
    };
    const managerVersion=run(manager,['--version'],root).trim();
    const tarball=join(scratch,`${pkg.name}-${pkg.version}.tgz`);run(manager,['pack','--out',tarball],root);
    const members=run('tar',['-tzf',tarball],scratch).trim().split('\n');validateMembers(members,pkg);
    const verbose=run('tar',['-tvzf',tarball],scratch);if(verbose.split('\n').some(line=>line.startsWith('l')||line.startsWith('h')))throw new Error('Archive links are refused.');
    const install=join(scratch,'install');await mkdir(install);await writeFile(join(install,'package.json'),JSON.stringify({name:'cea-offline-install-check',version:'1.0.0',private:true}));
    run(manager,['--dir',install,'add','--offline','--ignore-scripts','--no-lockfile','--store-dir',join(scratch,'store'),tarball],root);
    const installed=join(install,'node_modules',pkg.name),bin=join(install,'node_modules','.bin',pkg.name),NOW='2026-10-13T00:00:00Z';
    for(const provider of ['aws','azure','gcp'])for(const outcome of ['pass','fail']){
      const example=join(installed,'examples',provider,outcome),args=['--root',example,'--manifest','manifest.json','--now',NOW];
      const r=spawnSync(bin,args,{cwd:install,env,encoding:'utf8',timeout:30000,maxBuffer:8*1024*1024});
      const expected=await readFile(join(example,'expected-report.json'),'utf8');
      if(r.status!==(outcome==='pass'?0:1)||r.error||r.signal||r.stderr!==''||r.stdout!==expected){
        let actualReport,expectedReport;try{actualReport=JSON.parse(r.stdout);expectedReport=JSON.parse(expected);}catch{}
        const counts=r=>Object.fromEntries(['checked','errors','warnings','files','classesComplete'].map(k=>[k,typeof r?.summary?.[k]==='number'?r.summary[k]:null]));
        throw new Error('Installed CLI example mismatch: '+JSON.stringify({provider,outcome,status:r.status,error:r.error?.code??null,signal:r.signal,stderrBytes:r.stderr?.length??0,actual:counts(actualReport),expected:counts(expectedReport)}));
      }
    }
    const libraryProbe="import {auditExports,TOOL_ID} from 'cloud-exposure-auditor'; const r=await auditExports({root:'node_modules/cloud-exposure-auditor/examples/aws/pass',manifestPath:'manifest.json',now:'2026-10-13T00:00:00Z'}); if(r.status!=='pass'||TOOL_ID!=='cloud-exposure-auditor')process.exitCode=1;";
    run(process.execPath,['--input-type=module','-e',libraryProbe],install);
    const digest=createHash('sha256').update(await readFile(tarball)).digest('hex');
    process.stdout.write(JSON.stringify({manager:'pnpm',managerVersion,node:process.version,archiveSha256:digest,members,installedExamples:6,libraryExport:'pass',offline:true})+'\n');
  }finally{await rm(scratch,{recursive:true,force:true});}
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))await main();
