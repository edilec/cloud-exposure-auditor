import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {readBounded} from './input.mjs';
import {parseUniqueJson} from './json.mjs';
import {parseCsv} from './csv.mjs';
import {validateManifest,validateBundle,CLASS_IDS,SOURCE_KINDS,FIELDS,text} from './schema.mjs';
import {EvidenceError,LIMITS} from './budget.mjs';
import {finding} from './report.mjs';
export async function loadEvidence({root,manifestPath,nowMs,budget}){
  const findings=[],bundles=[],incompleteClasses=new Set(),cache=new Map();let provider,regions=[];
  const add=(id,location,klass)=>{findings.push(finding(id,location));if(klass)incompleteClasses.add(klass);else for(const c of CLASS_IDS)incompleteClasses.add(c);};
  const read=async(path,location)=>{const key=resolve(root,path);if(!cache.has(key))cache.set(key,await readBounded({root,relativePath:path,location,budget}));budget.check(location);return cache.get(key).bytes;};
  try{
    const location={file:'@manifest',pointer:''};const bytes=await read(manifestPath,location);
    const manifest=validateManifest(parseUniqueJson(bytes,{location,budget}),{nowMs});provider=manifest.provider;regions=manifest.regions;
    const paths=new Set([resolve(root,manifestPath)]);for(const d of manifest.files){paths.add(resolve(root,d.path));for(const s of d.sourceFiles)paths.add(resolve(root,s.path));}
    if(paths.size>LIMITS.files)throw new EvidenceError('file-limit',location);
    const totals=Object.fromEntries(CLASS_IDS.map(c=>[c,0])),coverage=Object.fromEntries(CLASS_IDS.map(c=>[c,new Set()]));
    const seenPaths=new Set(),recordIdentities=new Set(),sourceHashes=new Map();
    for(const klass of CLASS_IDS){const e=manifest.evidence[klass];if(!e||e.status!=='complete')add('class-incomplete',{file:'@manifest',pointer:`/evidence/${klass}`},klass);}
    for(const [i,d]of manifest.files.entries()){
      const klass=d.evidenceClass,p=`/files/${i}`,at=s=>({file:'@manifest',pointer:p+s});
      const role=`@bundle-${String(i+1).padStart(4,'0')}`,location={file:role,pointer:''};
      const pathIdentity=resolve(root,d.path);if(seenPaths.has(pathIdentity)){add('record-duplicate',at('/path'),klass);continue;}seenPaths.add(pathIdentity);
      const c=d.coverage;
      if(!c.paginationComplete||c.continuation!==null)add('pagination-incomplete',at('/coverage'),klass);
      if(c.exportErrors.length)add('export-error',at('/coverage/exportErrors'),klass);
      if(c.unsupportedFields.length)add('unsupported-field',at('/coverage/unsupportedFields'),klass);
      const expectedRegions=['keys','mfa'].includes(klass)?['global']:regions;
      for(const r of c.regions){if(!expectedRegions.includes(r))add('region-incomplete',at('/coverage/regions'),klass);else coverage[klass].add(r);}
      const kinds=new Set(d.sourceFiles.map(s=>s.kind));if(SOURCE_KINDS[provider][klass].some(kind=>!kinds.has(kind)))add('source-evidence-missing',at('/sourceFiles'),klass);
      try{
        let validSources=true;
        for(const [j,s]of d.sourceFiles.entries()){
          const sourceLoc=at(`/sourceFiles/${j}/sha256`),sourceBytes=await read(s.path,sourceLoc),key=resolve(root,s.path);
          const digest=createHash('sha256').update(sourceBytes).digest('hex');budget.check(sourceLoc);
          if(digest!==s.sha256||(sourceHashes.has(key)&&sourceHashes.get(key)!==s.sha256)){add('source-digest-mismatch',sourceLoc,klass);validSources=false;}
          sourceHashes.set(key,s.sha256);
        }
        const input=await read(d.path,location);const digest=createHash('sha256').update(input).digest('hex');budget.check(location);
        if(digest!==d.sha256){add('source-digest-mismatch',at('/sha256'),klass);continue;}
        if(!validSources)continue;
        let records,rowLines;
        if(d.format==='json')records=validateBundle(parseUniqueJson(input,{location,budget}),{...d,role},provider);
        else({records,rowLines}=parseCsv(input,{fields:{id:'string',region:'string',...FIELDS[provider][klass]},location,budget}));
        budget.addRecords(records.length,location);totals[klass]+=records.length;
        if(records.length!==c.recordCount)add('record-count-mismatch',at('/coverage/recordCount'),klass);
        const pointerFor=(index,field='')=>`${rowLines?`row:${rowLines[index]}`:`/records/${index}`}${field?`/${field}`:''}`;
        for(const [j,row]of records.entries()){
          budget.check(location);const recordLoc={file:role,pointer:pointerFor(j)};
          if(!row||typeof row!=='object'||Array.isArray(row)||!text(row.id)||!text(row.region,64)){add('input-invalid',recordLoc,klass);continue;}
          if(!c.regions.includes(row.region))add('region-incomplete',{file:role,pointer:pointerFor(j,'region')},klass);
          const key=JSON.stringify([klass,row.region,row.id]);if(recordIdentities.has(key))add('record-duplicate',recordLoc,klass);recordIdentities.add(key);
        }
        bundles.push({evidenceClass:klass,role,records,pointerFor,coverage:c});
      }catch(e){if(!(e instanceof EvidenceError))throw e;add(e.ruleId,e.location,klass);if(['time-limit','record-limit','file-limit'].includes(e.ruleId))break;}
    }
    for(const klass of CLASS_IDS){const e=manifest.evidence[klass];if(!e)continue;const pointer=`/evidence/${klass}`;
      if(totals[klass]!==e.expectedRecords)add('record-count-mismatch',{file:'@manifest',pointer:pointer+'/expectedRecords'},klass);
      if(totals[klass]===0&&!e.emptyVerified)add('class-incomplete',{file:'@manifest',pointer},klass);
      const expected=['keys','mfa'].includes(klass)?['global']:regions;
      if(expected.some(r=>!coverage[klass].has(r)))add('region-incomplete',{file:'@manifest',pointer},klass);
    }
  }catch(e){add(e instanceof EvidenceError?e.ruleId:'execution-failed',e instanceof EvidenceError?e.location:{file:'@manifest',pointer:''});}
  return {provider,regions,classesComplete:5-incompleteClasses.size,incompleteClasses,bundles,findings};
}
