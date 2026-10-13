import {readdir} from 'node:fs/promises';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
async function walk(dir){const result=[];for(const entry of await readdir(dir,{withFileTypes:true})){const p=join(dir,entry.name);if(entry.isDirectory())result.push(...await walk(p));else if(entry.name.endsWith('.mjs'))result.push(p);}return result;}
for(const dir of ['src','bin','scripts','test']){
  let files;try{files=await walk(dir);}catch(e){if(e.code==='ENOENT')continue;throw e;}
  for(const file of files.sort()){
    const result=spawnSync(process.execPath,['--check',file],{stdio:'inherit'});
    if(result.status!==0 || result.error || result.signal)process.exit(1);
  }
}
