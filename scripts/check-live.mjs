import { Zetaris } from '../src/zetaris.mjs';
import { Nightshift } from '../src/nightshift.mjs';
const z = new Zetaris();
const n = new Nightshift();
const result = { checkedAt: new Date().toISOString(), zetaris: await z.status(), nightshift: await n.status(), sourceRetrieval: 'NOT RUN', inference: 'NOT RUN' };
if (result.zetaris.state === 'online') {
  try { const records = await z.retrieve('SYN-ORD-03'); result.sourceRetrieval = { state: 'PASS', records: records.records.length, receipts: records.retrievalReceipts }; }
  catch (error) { result.sourceRetrieval = { state: 'FAIL', code: error.code, message: error.message }; }
}
console.log(JSON.stringify(result, null, 2));
if (result.sourceRetrieval?.state !== 'PASS' || result.nightshift.state !== 'online') process.exitCode = 1;
