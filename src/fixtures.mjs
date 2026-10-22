const day = d => `2026-10-${String(d).padStart(2,'0')}T00:00:00Z`;
const at = (time, d=23) => `2026-10-${String(d).padStart(2,'0')}T${time}:00Z`;
const clone = value => structuredClone(value);
function record(n, kind, fields, {version=1, suffix='', observedAt=at('08:10'), effectiveAt=day(23), sourceId}={}) {
  const prefix={order:'ORD',stock:'STK',supplier:'SUP',fulfillment:'FUL',receipt:'RET'}[kind];
  const recordId=`SYN-${prefix}-${String(n).padStart(2,'0')}${suffix}`;
  return {orderId:`SYN-ORD-${String(n).padStart(2,'0')}`,id:`${sourceId??`synthetic-${kind}${suffix}`}::${recordId}::v${version}`, sourceId:sourceId??`synthetic-${kind}${suffix}`,recordId,version,kind,observedAt,...(effectiveAt===null?{}:{effectiveAt}),fields};
}
const baseValues = [
  [10,27,10], [10,27,4,6,26], [10,26,2,8,28], [5,27,null],
  [10,27,2,8,26], [8,27,0,8,27], [8,26,1,7,27], [10,26,2,5,28],
  [6,27,0], [5,null,5], [10,27,2], [10,26,0], [10,27,2],
  [10,27,2,8,26], [10,27,0], [10,27,4,6,26], [10,27,4,5,26],
  [10,26,2,8,25], [10,26,0,10,25], [10,26,2,8,28],
];
function base(n) {
  const [orderedQuantity,promise,stock,supply,eta]=baseValues[n-1];
  const records=[record(n,'order',{orderedQuantity,itemId:`item-${String(n).padStart(2,'0')}`,location:`warehouse-${n}`,...(promise?{promiseDate:day(promise)}:{})},{observedAt:at(n===20?'07:00':'08:00'),version:n===9?2:1,effectiveAt:day(n===9?22:23)})];
  if(stock!==null && n!==9) records.push(record(n,'stock',{quantity:stock,location:`warehouse-${n}`,item:`item-${String(n).padStart(2,'0')}`},{observedAt:at(n===20?'07:05':'08:05')}));
  if(supply!==undefined) records.push(record(n,'supplier',{quantity:supply,eta:day(eta),state:'confirmed',scope:`item-${String(n).padStart(2,'0')}`},{observedAt:n===5?at('09:00',19):n===20?at('07:10'):at('08:10'),effectiveAt:n===5?day(19):n===14?null:day(23)}));
  if(n===4 || n===13) records.push(record(n,'receipt',{scope:`item-${String(n).padStart(2,'0')} ${n===4?'stock':'supplier'}`,returnedIds:[]},{observedAt:at('08:15')}));
  if(n===9) records.push(record(n,'fulfillment',{fulfilledAt:day(22)},{observedAt:at('08:01'),effectiveAt:day(22)}));
  if(n===11) {
    records.splice(1,1);
    records.push(record(n,'stock',{quantity:2,location:'warehouse-11',item:'item-11'},{suffix:'A',version:7,observedAt:at('08:05')}));
    records.push(record(n,'stock',{quantity:10,location:'warehouse-11',item:'item-11'},{suffix:'B',version:2,observedAt:at('08:06')}));
  }
  if(n===12 || n===15) {
    records.push(record(n,'supplier',{quantity:10,eta:day(n===12?25:26),state:'confirmed',scope:`item-${n}`,effectiveUntil:day(27)},{suffix:'A',version:n===12?3:1,observedAt:at('08:05')}));
    records.push(record(n,'supplier',{quantity:10,eta:day(28),state:'confirmed',scope:`item-${n}`,effectiveUntil:day(27)},{suffix:'B',observedAt:at('08:06')}));
  }
  if(n===18) {
    Object.assign(records.find(r=>r.kind==='supplier'),{observedAt:at('08:00',22),effectiveAt:day(22)});
    records.push(record(n,'supplier',{quantity:0,state:'cancelled',scope:'item-18'},{version:2}));
    records.push(record(n,'receipt',{scope:'item-18 alternative supplier commitments',returnedIds:[]},{observedAt:at('08:15')}));
  }
  if(n===19) records.push(record(n,'supplier',{quantity:10,eta:day(28),state:'confirmed',scope:'item-19'},{version:2,observedAt:at('08:20'),effectiveAt:day(24)}));
  return {orderId:`SYN-ORD-${String(n).padStart(2,'0')}`,assessmentAt:at(n===20?'08:00':'09:00'),records};
}
const cases=new Map(baseValues.map((_,i)=>{const data=base(i+1);return [data.orderId,data];}));
const changes={
  U01:{n:3,version:2,quantity:8,eta:25}, U02:{n:5,version:2,quantity:8,eta:26},
  U03:{n:7,version:2,quantity:7,eta:28}, U04:{n:8,version:2,quantity:8,eta:28},
  U05:{n:17,version:2,quantity:6,eta:26}, U06:{n:12,version:2,quantity:0,suffix:'B',state:'retracted'},
  U07:{n:13,version:1,quantity:8,eta:26}, U08:{n:18,version:3,quantity:8,eta:25},
  U09:{n:19,version:3,quantity:10,eta:25}, U10:{n:20,version:3,quantity:0,state:'cancelled'},
};
export function listOrders(){return [...cases.keys()].map((id,i)=>({id,label:`Order ${String(i+1).padStart(3,'0')}`}));}
export function getCase(orderId){const data=cases.get(orderId);if(!data)throw Error('Unknown order');return clone(data);}
export function availableUpdates(orderId){if(!cases.has(orderId))throw Error('Unknown order');const updates=Object.entries(changes).filter(([,u])=>`SYN-ORD-${String(u.n).padStart(2,'0')}`===orderId).map(([id])=>({id,orderId,label:`Apply ${id} synthetic evidence update`}));if(orderId==='SYN-ORD-20')updates.unshift({id:'U10-recovery',orderId,label:'Recovery evidence (before U10 cancellation)'});return updates;}
export function recoveryCase(){const data=getCase('SYN-ORD-20');data.assessmentAt=at('08:45');data.records.push(record(20,'supplier',{quantity:8,eta:day(25),state:'confirmed',scope:'item-20'},{version:2,observedAt:at('08:30')}));return data;}
export function applyUpdate(caseData,updateId){
  if(updateId==='U10-recovery'){
    if(caseData.orderId!=='SYN-ORD-20')throw Error('Unknown update for order');
    if(caseData.records.some(r=>r.kind==='supplier'&&r.version>=2))return clone(caseData);
    return recoveryCase();
  }
  const change=changes[updateId];
  if(!change || caseData.orderId!==`SYN-ORD-${String(change.n).padStart(2,'0')}`)throw Error('Unknown update for order');
  const data=clone(caseData), fields={quantity:change.quantity,state:change.state??'confirmed',scope:`item-${String(change.n).padStart(2,'0')}`,...(change.eta?{eta:day(change.eta)}:{})};
  if(updateId==='U09') fields.supersedes=[record(19,'supplier',{}, {version:2}).id];
  const next=record(change.n,'supplier',fields,{version:change.version,suffix:change.suffix,observedAt:at('09:50')});
  if(data.records.some(r=>r.id===next.id))return data;
  if(updateId==='U10'){
    const recovery=recoveryCase().records.at(-1);
    if(!data.records.some(r=>r.id===recovery.id))data.records.push(recovery);
    data.records.push(record(20,'receipt',{scope:'item-20 alternative supplier commitments',returnedIds:[]},{observedAt:at('09:55')}));
  }
  data.records.push(next);data.assessmentAt=at('10:00');return data;
}
