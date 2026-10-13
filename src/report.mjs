export const TOOL_ID = 'cloud-exposure-auditor';
export const RULES = Object.freeze({
  'storage-public': {severity:'error',incomplete:false,message:'Supported evidence permits public storage access.',suggestion:'Remove public grants or enforce the applicable public-access restriction.'},
  'admin-ingress-broad': {severity:'error',incomplete:false,message:'Supported evidence permits broad inbound administrative access.',suggestion:'Restrict sources and require a controlled administrative access path.'},
  'key-age-exceeded': {severity:'error',incomplete:false,message:'An active long-lived key exceeds the configured age threshold.',suggestion:'Rotate the key through the authorized credential workflow.'},
  'privileged-mfa-disabled': {severity:'error',incomplete:false,message:'A privileged identity has effective MFA disabled.',suggestion:'Enforce MFA through the supported identity policy.'},
  'audit-logging-disabled': {severity:'error',incomplete:false,message:'A required audit-logging category is disabled.',suggestion:'Enable the documented required audit categories.'},
  'input-unreadable': {severity:'warning',incomplete:true,message:'A declared input could not be read safely.',suggestion:'Check the declared file and root confinement locally.'},
  'input-invalid': {severity:'warning',incomplete:true,message:'A declared input does not satisfy its documented format.',suggestion:'Correct the located input using the v1 schema.'},
  'utf8-invalid': {severity:'warning',incomplete:true,message:'A structured input is not valid UTF-8.',suggestion:'Export structured evidence as valid UTF-8.'},
  'duplicate-json-key': {severity:'warning',incomplete:true,message:'A structured input has a duplicate decoded object key.',suggestion:'Remove the ambiguous duplicate key.'},
  'csv-invalid': {severity:'warning',incomplete:true,message:'A CSV input has an invalid header or record.',suggestion:'Correct the located row using the CSV profile.'},
  'unsupported-provider': {severity:'warning',incomplete:true,message:'The declared provider is unsupported.',suggestion:'Supply an AWS, Azure, or GCP v1 bundle.'},
  'unsupported-version': {severity:'warning',incomplete:true,message:'An input schema version is unsupported.',suggestion:'Supply the documented v1 schema.'},
  'class-incomplete': {severity:'warning',incomplete:true,message:'A required evidence class is absent or partial.',suggestion:'Supply complete evidence for the located class.'},
  'region-incomplete': {severity:'warning',incomplete:true,message:'Declared and observed region coverage is inconsistent.',suggestion:'Export every declared region and correct coverage metadata.'},
  'pagination-incomplete': {severity:'warning',incomplete:true,message:'A bundle retains incomplete pagination evidence.',suggestion:'Export all pages before declaring completion.'},
  'export-error': {severity:'warning',incomplete:true,message:'Export metadata records a collection error.',suggestion:'Resolve the export error and collect evidence again.'},
  'unsupported-field': {severity:'warning',incomplete:true,message:'A provider fact or effective state is unsupported or unknown.',suggestion:'Supply a supported fact or keep this class incomplete.'},
  'source-digest-mismatch': {severity:'warning',incomplete:true,message:'Declared source bytes do not match their digest.',suggestion:'Rebuild the local bundle and its source digests consistently.'},
  'source-evidence-missing': {severity:'warning',incomplete:true,message:'A required source evidence kind is missing.',suggestion:'Include the required export sources for this class.'},
  'record-count-mismatch': {severity:'warning',incomplete:true,message:'Actual and declared record counts differ.',suggestion:'Reconcile complete records with the coverage counts.'},
  'record-duplicate': {severity:'warning',incomplete:true,message:'A normalized record identity occurs more than once.',suggestion:'Resolve duplicate evidence without discarding coverage.'},
  'date-invalid': {severity:'warning',incomplete:true,message:'An evidence date is invalid or later than the evaluation date.',suggestion:'Supply valid UTC evidence and evaluation dates.'},
  'no-evidence': {severity:'warning',incomplete:true,message:'No supported evidence record was checked.',suggestion:'Supply supported records for the declared scope.'},
  'byte-limit': {severity:'warning',incomplete:true,message:'An input exceeds the 8388608-byte limit.',suggestion:'Split the export within byte and total-file bounds.'},
  'file-limit': {severity:'warning',incomplete:true,message:'The input set exceeds the 100-file limit.',suggestion:'Reduce the file set while retaining complete coverage.'},
  'record-limit': {severity:'warning',incomplete:true,message:'The evidence exceeds the 100000-record limit.',suggestion:'Split the audit scope without claiming unexamined coverage.'},
  'depth-limit': {severity:'warning',incomplete:true,message:'Evidence exceeds JSON container depth 16.',suggestion:'Flatten normalized evidence to the supported depth.'},
  'time-limit': {severity:'warning',incomplete:true,message:'Evaluation exceeds the 10000-millisecond deadline.',suggestion:'Reduce the audit scope and rerun with complete evidence.'},
  'execution-failed': {severity:'warning',incomplete:true,message:'Evaluation could not complete.',suggestion:'Inspect local inputs and runtime, then rerun the explicit scope.'}
});
for (const rule of Object.values(RULES)) Object.freeze(rule);
export const RULE_SEVERITY = Object.freeze(Object.fromEntries(Object.entries(RULES).map(([id,r])=>[id,r.severity])));
export const byCodeUnit = (a,b) => a < b ? -1 : a > b ? 1 : 0;
export function finding(ruleId,location) {
  if(!Object.hasOwn(RULES,ruleId)) throw new Error('Unknown rule.');
  if(!location || !/^@(?:manifest|bundle-\d{4})$/.test(location.file) ||
    typeof location.pointer!=='string' || location.pointer.length>256 ||
    !/^(?:\/[A-Za-z0-9_-]+)*$|^row:\d+(?:\/[A-Za-z0-9_-]+)*$/.test(location.pointer)) throw new Error('Invalid location.');
  const {severity,message,suggestion}=RULES[ruleId];
  return {ruleId,severity,message,location:{file:location.file,pointer:location.pointer},suggestion};
}
export function buildReport({findings,checked,files,classesComplete}) {
  let list=[...findings];
  if(checked===0 && !list.some(f=>RULES[f.ruleId].incomplete)) list.push(finding('no-evidence',{file:'@manifest',pointer:''}));
  list.sort((a,b)=>byCodeUnit(a.location.file,b.location.file)||byCodeUnit(a.location.pointer,b.location.pointer)||byCodeUnit(a.ruleId,b.ruleId));
  list=list.filter((f,i)=>i===0 || f.ruleId!==list[i-1].ruleId || f.location.file!==list[i-1].location.file || f.location.pointer!==list[i-1].location.pointer);
  const errors=list.filter(f=>f.severity==='error').length;
  const warnings=list.filter(f=>f.severity==='warning').length;
  const incomplete=list.some(f=>RULES[f.ruleId].incomplete);
  return {schemaVersion:'1',tool:TOOL_ID,status:incomplete?'incomplete':errors>0?'fail':'pass',
    summary:{checked,errors,warnings,files,classesComplete},findings:list,
    provenance:{coverage:'operator-supplied',normalization:'operator-supplied',sourceDigests:'checked-local-bytes',authenticity:'not-verified'}};
}
export function exitCode(report) {return report.status==='pass'?0:report.status==='fail'?1:2;}
