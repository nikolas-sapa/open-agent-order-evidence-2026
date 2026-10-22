import { Markovian } from '../vendor/meterless/src/index.ts';
import { assess, validateCandidate, validateEvidence } from './domain.mjs';
export async function investigate({orderId,mode='live',store,retrieve,provider,investigationId,caseData}){
  if(!['live','preview'].includes(mode))throw Error('Invalid source mode');
  if(!store||typeof retrieve!=='function')throw Error('Store and evidence retrieval required');
  if(mode==='live'&&typeof provider?.select!=='function')throw Error('Live model provider required');
  if(investigationId){const previous=store.get(investigationId);if(previous.orderId!==orderId||previous.mode!==mode)throw Error('Investigation order/source mode binding mismatch');}
  let evidence,assessment,sourceReceipts=[],providerMetadata,executionError;
  const engine=new Markovian({chunkConfig:{maxChunks:3,chunkSize:2000,carryoverTokens:128}});
  const result=await engine.run({goal:`Retrieve evidence and assess order ${orderId}.`,mode:'RESEARCH',reflect:false,stopWhen:({step})=>step===2,stepFn:async({step})=>{
    try {
    if(step===0){
      evidence=await retrieve(orderId,caseData);
      if(!evidence||evidence.orderId!==orderId)throw Error('Retrieved evidence order mismatch');
      validateEvidence(evidence);
      sourceReceipts=Array.isArray(evidence.retrievalReceipts)?evidence.retrievalReceipts:Array.isArray(evidence.receipts)?evidence.receipts:evidence.receipt?[evidence.receipt]:[];
      return {content:'Evidence retrieved; immutable source references retained.'};
    }
    assessment=assess(evidence);
    if(mode==='preview')providerMetadata={kind:'deterministic-preview',model:null,usage:null,cost:null,attempts:0,validated:true};
    else {
      const calls=[];let validation;
      for(let attempt=0;attempt<2;attempt++){
        const response=await provider.select(assessment,evidence,attempt===0?undefined:validation.errors.join(' '));
        calls.push({model:typeof response?.model==='string'?response.model:null,usage:response?.usage??null,cost:response?.cost??null});
        validation=validateCandidate(response?.candidate,assessment);
        if(validation.valid){assessment.draft.optionId=response.candidate.optionId;break;}
      }
      providerMetadata={kind:'nightshift',model:calls.at(-1)?.model??null,usage:calls.at(-1)?.usage??null,cost:calls.at(-1)?.cost??null,attempts:calls.length,calls,validated:validation.valid};
      if(!validation.valid){
        const evidenceIds=evidence.records.map(record=>record.id);
        assessment={status:'undetermined',causes:['unverified model selection'],claims:[{text:'The model did not select an evidence-supported assessment after one correction. Human evidence review required.',evidenceIds}],uncertainty:['Review the cited source evidence; two model selections failed deterministic evidence validation.'],options:[{id:'request-evidence',label:'Review source evidence',evidenceIds}],draft:{optionId:'request-evidence',text:'Model selection could not be verified. Review source evidence before approving a draft.',evidenceIds}};
      }
    }
    return {content:'Assessment completed using deterministic evidence validation; draft requires human approval.'};
    } catch(error) { executionError=error; throw error; }
  }});
  if(executionError)throw executionError;
  if(result.status!=='completed'||!assessment)throw Error(`Meterless execution failed (${result.status})${result.error?`: ${result.error}`:''}`);
  return store.saveRevision({orderId,mode,assessmentAt:evidence.assessmentAt,records:evidence.records,assessment,receipts:sourceReceipts,engine:{name:'Meterless Markovian',commit:'0aa7417ba5c826396d91e891328be78c45e6fbf6',status:result.status,runId:result.id,chunks:result.chunks,durationMs:result.durationMs,tokenLabel:result.tokenLabel,totalTokensUsed:result.totalTokensUsed},provider:providerMetadata,changedEvidenceIds:[],investigationId});
}
