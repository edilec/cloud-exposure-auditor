import {mkdtemp,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {createHash} from 'node:crypto';
export const NOW='2026-10-13T00:00:00Z';
export const sha256=bytes=>createHash('sha256').update(bytes).digest('hex');
export async function withTempDir(fn){const root=await mkdtemp(join(tmpdir(),'cea-test-'));try{return await fn(root);}finally{await rm(root,{recursive:true,force:true});}}
