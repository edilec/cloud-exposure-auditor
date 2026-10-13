import {realpath,stat} from 'node:fs/promises';
import {isAbsolute} from 'node:path';
import {loadEvidence} from './manifest.mjs';
import {createBudget,EvidenceError} from './budget.mjs';
import {ConfigError,utcInstant,integer} from './schema.mjs';
import {buildReport,finding} from './report.mjs';
import {auditProvider as aws} from './providers/aws.mjs';
import {auditProvider as azure} from './providers/azure.mjs';
import {auditProvider as gcp} from './providers/gcp.mjs';
export {TOOL_ID,RULE_SEVERITY} from './report.mjs';
export {LIMITS} from './budget.mjs';
export {ConfigError} from './schema.mjs';
const adapters=Object.freeze({aws,azure,gcp});
export async function auditExports({root,manifestPath,now,keyAgeDays=90,clock=()=>performance.now()}){
  const nowMs=utcInstant(now);
  if(typeof root!=='string'||!root||typeof manifestPath!=='string'||!manifestPath||isAbsolute(manifestPath)||manifestPath.split(/[\\/]/).includes('..')||!Number.isFinite(nowMs)||!integer(keyAgeDays,1,36500)||typeof clock!=='function')throw new ConfigError();
  try{root=await realpath(root);if(!(await stat(root)).isDirectory())throw new ConfigError();}catch{throw new ConfigError();}
  let budget,loaded,analyzed;
  const report=extra=>buildReport({findings:[...(loaded?.findings??[]),...(analyzed?.findings??[]),...extra],checked:analyzed?.checked??0,files:budget?.files??0,classesComplete:loaded?5-new Set([...loaded.incompleteClasses,...(analyzed?.incompleteClasses??[])]).size:0});
  try{
    budget=createBudget({clock});loaded=await loadEvidence({root,manifestPath,nowMs,budget});
    if(Object.hasOwn(adapters,loaded.provider))analyzed=adapters[loaded.provider](loaded.bundles,{nowMs,keyAgeDays,budget});
    budget.check({file:'@manifest',pointer:''});let result=report([]);
    budget.check({file:'@manifest',pointer:''});JSON.stringify(result);budget.check({file:'@manifest',pointer:''});return result;
  }catch(e){return report([finding(e instanceof EvidenceError?e.ruleId:'execution-failed',e instanceof EvidenceError?e.location:{file:'@manifest',pointer:''})]);}
}
