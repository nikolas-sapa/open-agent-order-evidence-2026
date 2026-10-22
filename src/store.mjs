import { createHash, randomUUID } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync, renameSync, chmodSync, openSync, closeSync, fsyncSync, unlinkSync } from 'node:fs';
import { dirname } from 'node:path';
import { validateEvidence } from './domain.mjs';
function canonical(value){
  if(Array.isArray(value))return value.map(canonical);
  if(value&&typeof value==='object')return Object.fromEntries(Object.keys(value).toSorted().map(key=>[key,canonical(value[key])]));
  return value;
}
export function evidenceFingerprint({orderId,mode,assessmentAt,records}){
  return createHash('sha256').update(JSON.stringify(canonical({orderId,mode,assessmentAt,records:records.toSorted((a,b)=>a.id.localeCompare(b.id))}))).digest('hex');
}
export class Store {
  constructor({file}){
    if(typeof file!=='string'||!file)throw Error('Store file required');
    this.file=file;
    try {this.data=JSON.parse(readFileSync(file,'utf8'));}
    catch(error){if(error.code!=='ENOENT')throw error;this.data={version:1,investigations:[]};}
    if(this.data.version!==1||!Array.isArray(this.data.investigations))throw Error('Invalid store format');
  }
  list(){return structuredClone(this.data.investigations);}
  get(id){const found=this.data.investigations.find(item=>item.id===id);if(!found)throw Error('Investigation not found');return structuredClone(found);}
  persist(next){
    mkdirSync(dirname(this.file),{recursive:true,mode:0o700});
    const temporary=`${this.file}.${randomUUID()}.tmp`;
    let descriptor;
    try {
      writeFileSync(temporary,`${JSON.stringify(next,null,2)}\n`,{mode:0o600,flag:'wx'});
      descriptor=openSync(temporary,'r');fsyncSync(descriptor);closeSync(descriptor);descriptor=undefined;
      renameSync(temporary,this.file);chmodSync(this.file,0o600);
      this.data=next;
    }catch(error){if(descriptor!==undefined)closeSync(descriptor);try{unlinkSync(temporary);}catch{}throw error;}
  }
  saveRevision({orderId,mode,assessmentAt,records,assessment,receipts=[],engine,provider,changedEvidenceIds=[],investigationId}){
    if(!['preview','live'].includes(mode))throw Error('Invalid source mode');
    const next=structuredClone(this.data);
    let investigation=investigationId?next.investigations.find(item=>item.id===investigationId):undefined;
    if(investigationId&&!investigation)throw Error('Investigation not found');
    if(investigation&&(investigation.orderId!==orderId||investigation.mode!==mode))throw Error('Investigation order/source mode binding mismatch');
    validateEvidence({orderId,assessmentAt,records});
    for(const priorRevision of investigation?.revisions??[]){
      for(const old of priorRevision.records){
        const current=records.find(record=>record.sourceId===old.sourceId&&record.recordId===old.recordId&&record.version===old.version);
        if(current&&JSON.stringify(canonical(current))!==JSON.stringify(canonical(old)))throw Error('Immutable evidence identity changed without a new version');
      }
    }
    if(!assessment||!engine||engine.status!=='completed'||!provider)throw Error('Completed assessment, engine and provider metadata required');
    if(!investigation){investigation={id:randomUUID(),orderId,mode,revisions:[],currentRevisionId:null,approvals:[]};next.investigations.push(investigation);}
    const fingerprint=evidenceFingerprint({orderId,mode,assessmentAt,records});
    const previous=investigation.revisions.at(-1);
    if(previous?.evidenceFingerprint===fingerprint)return structuredClone(investigation);
    const now=new Date().toISOString();
    const previousRecords=new Map((previous?.records??[]).map(record=>[record.id,JSON.stringify(canonical(record))]));
    const derivedChanges=records.filter(record=>previousRecords.get(record.id)!==JSON.stringify(canonical(record))).map(record=>record.id);
    const removed=(previous?.records??[]).filter(record=>!records.some(nextRecord=>nextRecord.id===record.id)).map(record=>record.id);
    const revision={id:randomUUID(),number:investigation.revisions.length+1,previousRevisionId:investigation.currentRevisionId,createdAt:now,assessmentAt,evidenceFingerprint:fingerprint,records:structuredClone(records),assessment:structuredClone(assessment),receipts:structuredClone(receipts),engine:structuredClone(engine),provider:structuredClone(provider),changedEvidenceIds:[...new Set([...derivedChanges,...removed,...changedEvidenceIds])].filter(id=>records.some(record=>record.id===id)||previousRecords.has(id))};
    for(const approval of investigation.approvals)if(!approval.invalidatedAt)approval.invalidatedAt=now;
    investigation.revisions.push(revision);investigation.currentRevisionId=revision.id;
    this.persist(next);return structuredClone(investigation);
  }
  approve(id,revisionId){
    const next=structuredClone(this.data),investigation=next.investigations.find(item=>item.id===id);
    if(!investigation)throw Error('Investigation not found');
    if(investigation.currentRevisionId!==revisionId)throw Error('Approval must name the current revision');
    if(!investigation.approvals.some(approval=>approval.revisionId===revisionId&&!approval.invalidatedAt)){
      investigation.approvals.push({id:randomUUID(),revisionId,createdAt:new Date().toISOString()});this.persist(next);
    }
    return structuredClone(investigation);
  }
}
