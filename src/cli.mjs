import {isAbsolute} from 'node:path';
import {ConfigError,utcInstant,integer} from './schema.mjs';
import {auditExports} from './index.mjs';
import {exitCode} from './report.mjs';
export {ConfigError} from './schema.mjs';
const HELP='Usage: cloud-exposure-auditor --root DIR --manifest RELATIVE_FILE --now UTC_INSTANT [--key-age-days INTEGER] [--human]\nOffline normalized AWS/Azure/GCP export checks. Default key age: 90 days.\nNo cloud login, network, remediation, or output-file mode. Findings use logical source roles.\n';
export function parseArgs(argv){
  if(argv.length===1&&argv[0]==='--help')return {help:true};
  const values=new Map();let human=false;
  for(let i=0;i<argv.length;i++){
    const key=argv[i];if(key==='--human'){if(human)throw new ConfigError();human=true;continue;}
    if(!['--root','--manifest','--now','--key-age-days'].includes(key)||values.has(key)||i+1>=argv.length||argv[i+1].startsWith('--')||!argv[i+1])throw new ConfigError();values.set(key,argv[++i]);
  }
  const root=values.get('--root'),manifestPath=values.get('--manifest'),now=values.get('--now');
  const keyAge=values.get('--key-age-days')??'90';
  if(!root||!manifestPath||isAbsolute(manifestPath)||manifestPath.split(/[\\/]/).includes('..')||!Number.isFinite(utcInstant(now))||!/^[1-9]\d*$/.test(keyAge)||!integer(Number(keyAge),1,36500))throw new ConfigError();
  return {root,manifestPath,now,keyAgeDays:Number(keyAge),human};
}
export async function runCli(argv,{stdout=process.stdout,stderr=process.stderr,clock=()=>performance.now()}={}){
  try{
    const options=parseArgs(argv);if(options.help){stdout.write(HELP);return 0;}
    const report=await auditExports({...options,clock});stdout.write(JSON.stringify(report)+'\n');
    if(options.human)stderr.write(`Cloud exposure audit: ${report.status}; ${report.summary.checked} records checked; ${report.summary.errors} errors; ${report.summary.warnings} warnings.\n`);
    return exitCode(report);
  }catch(e){stderr.write(e instanceof ConfigError?'Invalid configuration. Use --help.\n':'Execution failed.\n');return 2;}
}
