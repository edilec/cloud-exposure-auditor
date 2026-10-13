export const LIMITS=Object.freeze({bytes:8_388_608,files:100,records:100_000,depth:16,milliseconds:10_000});
export class EvidenceError extends Error {
  constructor(ruleId,location){super(ruleId);this.ruleId=ruleId;this.location=location;}
}
export function createBudget({clock}) {
  const start=clock(); let last=start,records=0; const files=new Set();
  function check(location) {
    const current=clock();
    if(!Number.isFinite(start)||!Number.isFinite(current)||current<last) throw new EvidenceError('execution-failed',location);
    last=current;
    if(current-start>LIMITS.milliseconds) throw new EvidenceError('time-limit',location);
  }
  return {
    check,
    registerFile(identity,location){check(location);files.add(identity);if(files.size>LIMITS.files)throw new EvidenceError('file-limit',location);},
    addRecords(count,location){check(location);records+=count;if(records>LIMITS.records)throw new EvidenceError('record-limit',location);},
    get files(){return files.size;},get records(){return records;},
    get remainingMilliseconds(){return Math.max(0,LIMITS.milliseconds-(last-start));}
  };
}
