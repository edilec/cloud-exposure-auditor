import {realpath,open,stat} from 'node:fs/promises';
import {constants} from 'node:fs';
import {resolve,relative,isAbsolute,sep} from 'node:path';
import {EvidenceError,LIMITS} from './budget.mjs';
export async function readBounded({root,relativePath,location,budget}){
  let handle;
  try{
    budget.check(location);
    if(typeof relativePath!=='string'||isAbsolute(relativePath)||relativePath.split(/[\\/]/).includes('..'))throw new EvidenceError('input-unreadable',location);
    const realRoot=await realpath(root),file=await realpath(resolve(realRoot,relativePath));
    const rel=relative(realRoot,file);
    if(rel===''||rel==='..'||rel.startsWith(`..${sep}`)||isAbsolute(rel))throw new EvidenceError('input-unreadable',location);
    const before=await stat(file);
    if(!before.isFile())throw new EvidenceError('input-unreadable',location);
    handle=await open(file,constants.O_RDONLY|(constants.O_NOFOLLOW??0));
    const opened=await handle.stat();
    if(!opened.isFile()||opened.dev!==before.dev||opened.ino!==before.ino)throw new EvidenceError('input-unreadable',location);
    const identity=`${file}\0${opened.dev}\0${opened.ino}`;
    budget.registerFile(identity,location);
    if(opened.size>LIMITS.bytes)throw new EvidenceError('byte-limit',location);
    const chunks=[];let total=0;
    while(true){
      budget.check(location);
      const chunk=Buffer.alloc(Math.min(65536,LIMITS.bytes+1-total));
      let timer;
      const timeout=new Promise((_,reject)=>{timer=setTimeout(()=>reject(new EvidenceError('time-limit',location)),Math.max(1,budget.remainingMilliseconds));});
      let bytesRead;
      try{({bytesRead}=await Promise.race([handle.read(chunk,0,chunk.length,null),timeout]));}finally{clearTimeout(timer);}
      budget.check(location);
      if(bytesRead===0)break;
      total+=bytesRead;
      if(total>LIMITS.bytes)throw new EvidenceError('byte-limit',location);
      chunks.push(chunk.subarray(0,bytesRead));
    }
    const after=await handle.stat();
    if(after.size!==total||after.mtimeMs!==opened.mtimeMs||after.ctimeMs!==opened.ctimeMs)throw new EvidenceError('input-unreadable',location);
    return {bytes:Buffer.concat(chunks,total),identity};
  }catch(error){if(error instanceof EvidenceError)throw error;throw new EvidenceError('input-unreadable',location);}
  finally{if(handle)await handle.close();}
}
