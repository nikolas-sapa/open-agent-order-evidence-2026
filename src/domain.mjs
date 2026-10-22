const HOUR=3_600_000;
const validDate = value => typeof value==='string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(value)
  && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().replace('.000Z','Z')===value.replace('.000Z','Z');
const finiteQuantity = value => typeof value==='number' && Number.isFinite(value) && value>=0;
const ids = records => records.map(record=>record.id);
function latestByIdentity(records){
  const latest=new Map();
  for(const record of records){
    const key=JSON.stringify([record.sourceId,record.recordId]);
    if(!latest.has(key)||latest.get(key).version<record.version)latest.set(key,record);
  }
  return [...latest.values()];
}
export function validateEvidence(data){
  if(!data || typeof data.orderId!=='string' || !validDate(data.assessmentAt) || !Array.isArray(data.records) || !data.records.length)throw Error('Invalid evidence case');
  const seen=new Set();
  const identities=new Set();
  const orders=data.records.filter(record=>record?.kind==='order');
  const binding=orders[0]?.fields;
  if(!binding || typeof binding.itemId!=='string' || !binding.itemId || typeof binding.location!=='string' || !binding.location
    || orders.some(record=>record.recordId!==data.orderId || record.fields.itemId!==binding.itemId || record.fields.location!==binding.location))throw Error('Invalid order evidence scope');
  for(const r of data.records){
    if(!r || typeof r.id!=='string' || !r.id || seen.has(r.id) || typeof r.sourceId!=='string' || !r.sourceId || typeof r.recordId!=='string' || !Number.isSafeInteger(r.version) || r.version<1 || !['order','stock','supplier','fulfillment','receipt'].includes(r.kind) || !r.fields || typeof r.fields!=='object' || Array.isArray(r.fields))throw Error('Invalid evidence record');
    const identity=JSON.stringify([r.sourceId,r.recordId,r.version]);
    if(r.orderId!==data.orderId || r.kind==='stock'&&(r.fields.item!==binding.itemId || r.fields.location!==binding.location)
      || r.kind==='supplier'&&r.fields.scope!==binding.itemId
      || r.kind==='receipt'&&!(typeof r.fields.scope==='string'&&r.fields.scope.startsWith(`${binding.itemId} `)))throw Error('Evidence does not match order item scope');
    if(identities.has(identity))throw Error('Duplicate immutable evidence identity');
    identities.add(identity);
    if(!validDate(r.observedAt) || r.effectiveAt!==undefined&&!validDate(r.effectiveAt))throw Error('Invalid evidence timestamp');
    seen.add(r.id);
  }
  return true;
}
export function assess(data){
  validateEvidence(data);
  const instant=Date.parse(data.assessmentAt);
  const known=data.records.filter(r=>validDate(r.observedAt)&&Date.parse(r.observedAt)<=instant);
  if(!known.length)throw Error('No evidence known at assessment time');
  const active=known.filter(r=>validDate(r.effectiveAt)&&Date.parse(r.effectiveAt)<=instant);
  const order=latestByIdentity(active.filter(r=>r.kind==='order'))[0];
  const evidenceIds=ids(known);
  const claims=[];
  let status='on-track',causes=[],uncertainty=[];
  const unclear=(cause,request)=>{status='undetermined';causes=[cause];uncertainty=[request];};
  const finish=()=>{
    const summary=status==='undetermined'?`Assessment undetermined: ${causes.join(', ')}.`:status==='on-track'?'Current evidence supports meeting the promised quantity and date.':`Order at risk: ${causes.join(', ')}.`;
    claims.push({text:summary,evidenceIds});
    const optionId=status==='undetermined'?'request-evidence':status==='at-risk'?'review-recovery':'monitor';
    const label=status==='undetermined'?'Request missing or reconciled evidence':status==='at-risk'?'Review a recovery plan':'Monitor current commitment';
    const options=[{id:optionId,label,evidenceIds}];
    return {status,causes,claims,uncertainty,options,draft:{optionId,text:`${summary} ${label}. Human review required; no message has been sent.`,evidenceIds}};
  };
  if(!order || !finiteQuantity(order.fields.orderedQuantity) || !validDate(order.fields.promiseDate)){
    unclear('missing evidence','Provide an effective order record with ordered quantity and customer promise date.');return finish();
  }
  const ordered=order.fields.orderedQuantity,promise=Date.parse(order.fields.promiseDate);
  claims.push({text:`Ordered quantity ${ordered}; promise ${order.fields.promiseDate}.`,evidenceIds:[order.id]});
  const fulfilled=latestByIdentity(active.filter(r=>r.kind==='fulfillment'));
  if(fulfilled.length){
    const fulfillment=fulfilled[0];
    if(!validDate(fulfillment.fields.fulfilledAt)){unclear('missing evidence','Provide the fulfillment date.');return finish();}
    claims.push({text:`Fulfillment recorded ${fulfillment.fields.fulfilledAt}.`,evidenceIds:[fulfillment.id]});
    if(Date.parse(fulfillment.fields.fulfilledAt)>promise){status='at-risk';causes=['late fulfillment'];}
    return finish();
  }
  const stock=latestByIdentity(active.filter(r=>r.kind==='stock'));
  if(!stock.length || stock.some(r=>!finiteQuantity(r.fields.quantity))){unclear('missing evidence','Provide current inventory for this order item and location; the receipt proves absence only within its stated query scope.');return finish();}
  const stockScopes=new Map();
  for(const r of stock){
    const key=JSON.stringify([r.fields.item,r.fields.location]);
    const previous=stockScopes.get(key);
    if(previous&&previous.fields.quantity!==r.fields.quantity){unclear('conflicting evidence','Reconcile inventory quantities across the cited source origins or provide explicit source precedence.');return finish();}
    stockScopes.set(key,r);
  }
  const available=[...stockScopes.values()].reduce((sum,r)=>sum+r.fields.quantity,0);
  claims.push({text:`Current available stock totals ${available}.`,evidenceIds:ids(stock)});
  if(available>=ordered)return finish();
  const supplierKnown=known.filter(r=>r.kind==='supplier');
  if(supplierKnown.some(r=>!validDate(r.effectiveAt))){unclear('missing evidence','Provide the effective timestamp of the incomplete supplier commitment.');return finish();}
  const current=latestByIdentity(active.filter(r=>r.kind==='supplier'));
  const commitments=current.filter(r=>r.fields.state!=='retracted');
  if(!commitments.length){unclear('missing evidence','Provide a current confirmed supplier quantity and arrival date covering the stock shortfall; absence is bounded by the cited query receipt.');return finish();}
  if(commitments.some(r=>!validDate(r.observedAt)||instant-Date.parse(r.observedAt)>=72*HOUR)){
    unclear('stale evidence','Obtain supplier confirmation observed less than 72 hours before this assessment.');return finish();
  }
  const supplierScopes=new Map();
  for(const r of commitments){
    if(!finiteQuantity(r.fields.quantity) || !['confirmed','cancelled'].includes(r.fields.state) || r.fields.state==='confirmed'&&!validDate(r.fields.eta)){
      unclear('missing evidence','Provide confirmed supplier quantity, state, and arrival date.');return finish();
    }
    const key=r.fields.scope??'order-item';
    const prior=supplierScopes.get(key);
    if(prior&&JSON.stringify([prior.fields.quantity,prior.fields.eta,prior.fields.state])!==JSON.stringify([r.fields.quantity,r.fields.eta,r.fields.state])){
      unclear('conflicting evidence','Reconcile overlapping supplier commitments across the cited source origins; observation time and cross-origin versions establish no precedence.');return finish();
    }
    supplierScopes.set(key,r);
  }
  const supply=[...supplierScopes.values()];
  const confirmed=supply.filter(r=>r.fields.state==='confirmed');
  const total=available+confirmed.reduce((sum,r)=>sum+r.fields.quantity,0);
  for(const r of supply)claims.push({text:r.fields.state==='cancelled'?'Current supplier commitment is cancelled.':`Current confirmed supplier quantity ${r.fields.quantity}; arrival ${r.fields.eta}.`,evidenceIds:[r.id]});
  const emptyAlternatives=known.some(r=>r.kind==='receipt'&&typeof r.fields.scope==='string'&&r.fields.scope.includes('alternative')&&Array.isArray(r.fields.returnedIds)&&r.fields.returnedIds.length===0);
  const withdrawnCoverage=supply.some(r=>r.fields.state==='cancelled'&&supplierKnown.some(old=>old.sourceId===r.sourceId&&old.recordId===r.recordId&&old.version<r.version&&old.fields.state==='confirmed'&&finiteQuantity(old.fields.quantity)&&available+old.fields.quantity>=ordered&&validDate(old.fields.eta)&&Date.parse(old.fields.eta)<=promise));
  if(total<ordered){status='at-risk';causes.push(withdrawnCoverage&&emptyAlternatives?'cancelled replenishment':'unfilled quantity');}
  if(confirmed.some(r=>r.fields.quantity>0&&Date.parse(r.fields.eta)>promise)){status='at-risk';causes.push('late replenishment');}
  const explicitlySuperseded=new Set(current.flatMap(r=>Array.isArray(r.fields.supersedes)?r.fields.supersedes:[]));
  const future=supplierKnown.filter(r=>Date.parse(r.effectiveAt)>instant&&!explicitlySuperseded.has(r.id));
  if(future.some(r=>r.fields.state==='confirmed'&&r.fields.quantity>0&&validDate(r.fields.eta)&&Date.parse(r.fields.eta)>promise)){
    status='at-risk';if(!causes.includes('late replenishment'))causes.push('late replenishment');
    claims.push({text:'A known future-effective supplier commitment crosses the promised date; it is not the currently effective arrival.',evidenceIds:ids([...current,...future])});
  }
  return finish();
}
export function validateCandidate(candidate,assessment){
  const errors=[];
  if(!candidate || typeof candidate!=='object' || Array.isArray(candidate))return {valid:false,errors:['Candidate must be an object.']};
  if(Object.keys(candidate).some(key=>!['status','causes','optionId'].includes(key)))errors.push('Only supported status, causes, and optionId may be selected.');
  if(candidate.status!==assessment.status)errors.push('Status is unsupported by evidence.');
  if(!Array.isArray(candidate.causes)||new Set(candidate.causes).size!==candidate.causes.length||JSON.stringify(candidate.causes.toSorted())!==JSON.stringify(assessment.causes.toSorted()))errors.push('Cause set is unsupported by evidence.');
  if(!assessment.options.some(option=>option.id===candidate.optionId))errors.push('Option is unsupported by evidence.');
  return {valid:errors.length===0,errors};
}
