import {mkdir,writeFile} from 'node:fs/promises';import {join} from 'node:path';
import {safeRecords,exposeOne,writeBundle,runCliFixture,CLASSES,NOW,toolRoot} from '../test/helpers.mjs';
for(const provider of ['aws','azure','gcp'])for(const outcome of ['pass','fail']){
  const root=join(toolRoot,'examples',provider,outcome);await mkdir(root,{recursive:true});const rows=safeRecords(provider);
  if(outcome==='fail')for(const klass of CLASSES)rows[klass]=exposeOne(provider,klass)[klass];
  await writeBundle(root,provider,rows);const result=runCliFixture(['--root',root,'--manifest','manifest.json','--now',NOW]);
  if(result.code!==(outcome==='pass'?0:1)||result.report?.status!==outcome)throw new Error('Example must be a complete supported result.');
  await writeFile(join(root,'expected-report.json'),result.stdout);
}
