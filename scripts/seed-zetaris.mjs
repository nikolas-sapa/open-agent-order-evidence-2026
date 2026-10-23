import { isDeepStrictEqual } from 'node:util';
import { pathToFileURL } from 'node:url';
import { Zetaris, VIEW } from '../src/zetaris.mjs';
import { listOrders, getCase } from '../src/fixtures.mjs';

export async function seed(source = new Zetaris()) {
  const cases = listOrders().map(({ id }) => getCase(id));
  const literal = value => `'${value.replaceAll("'", "''")}'`;
  const rows = cases.map(data => `SELECT ${literal(data.orderId)} AS order_id, ${literal(JSON.stringify(data))} AS payload`);
  // A duplicate container is an explicit conflict. Never overwrite an existing object.
  await source.query('CREATE SCHEMASTORE CONTAINER order_evidence', 1);
  await source.query(`CREATE SCHEMASTORE VIEW records WITH CONTAINER order_evidence AS ${rows.join(' UNION ALL ')}`, 1);
  const receipts = [];
  for (const expected of cases) {
    const actual = await source.retrieve(expected.orderId);
    const payload = { orderId: actual.orderId, assessmentAt: actual.assessmentAt, records: actual.records };
    if (!isDeepStrictEqual(payload, expected)) throw new Error(`Source verification failed for ${expected.orderId}.`);
    receipts.push(...(actual.retrievalReceipts ?? []));
  }
  return { view: VIEW, registered: cases.length, verified: cases.length, receipts };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try { console.log(JSON.stringify(await seed(), null, 2)); }
  catch (error) { console.error(error.message); process.exitCode = 1; }
}
