import {spawnSync} from 'node:child_process';
for(const args of [['scripts/lint.mjs'],['--test']]){
  const result=spawnSync(process.execPath,args,{encoding:'utf8',maxBuffer:16*1024*1024});
  process.stdout.write(result.stdout??'');process.stderr.write(result.stderr??'');
  if(result.status!==0 || result.error || result.signal || (args[0]==='--test' && !/(?:tests [1-9]\d*|# tests [1-9]\d*)/.test(result.stdout)))process.exit(1);
}
