import { isDeepStrictEqual } from 'node:util';
import { pathToFileURL } from 'node:url';
import { randomUUID } from 'node:crypto';
import { Zetaris, VIEW, queryRows } from '../src/zetaris.mjs';
import { listOrders, getCase, applyUpdate } from '../src/fixtures.mjs';

async function readDedicatedSource(source, cases) {
  const rows = queryRows(await source.query(`SELECT COUNT(*) AS row_count FROM ${VIEW}`, 1));
  const count = Array.isArray(rows[0]) ? rows[0][0] : rows[0]?.row_count;
  if (rows.length !== 1 || (count !== 20 && count !== '20')) {
    throw new Error('The dedicated demo source must contain exactly20 rows.');
  }
  const payloads = [];
  const receipts = [];
  for (const expected of cases) {
    const sql = `SELECT payload FROM ${VIEW} WHERE order_id = '${expected.orderId}'`;
    const result = queryRows(await source.query(sql, 2));
    if (result.length !== 1) throw new Error('The dedicated demo source has a missing or ambiguous order row.');
    const raw = Array.isArray(result[0]) ? result[0][0] : result[0]?.payload;
    let payload;
    try { payload = typeof raw === 'string' ? JSON.parse(raw) : raw; }
    catch { throw new Error('The dedicated demo source contains an unreadable payload.'); }
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
      throw new Error('The dedicated demo source contains an invalid payload.');
    }
    // Compare the stored payload itself. Adapter-added receipts can hide a stored field of the same name.
    payloads.push(payload);
    receipts.push({ id: randomUUID(), source: 'zetaris', method: '/api/proxy/sql-editor/sqls/run-query',
      query: sql, at: new Date().toISOString(), scope: expected.orderId,
      returnedIds: Array.isArray(payload.records) ? payload.records.map(record => record?.id) : [], rowCount: 1 });
  }
  return { payloads, receipts };
}

export async function updateZetarisDemo(source = new Zetaris()) {
  const base = listOrders().map(({ id }) => getCase(id));
  const updated = base.map(data => data.orderId === 'SYN-ORD-03' ? applyUpdate(data, 'U01') : data);
  const before = await readDedicatedSource(source, base);
  if (isDeepStrictEqual(before.payloads, updated)) {
    return { view: VIEW, updateId: 'U01', changed: false, writes: 0, verified: 20, receipts: before.receipts };
  }
  if (!isDeepStrictEqual(before.payloads, base)) {
    throw new Error('The dedicated demo source differs from its fixed base or exact U01 state. No write attempted.');
  }
  const literal = value => `'${value.replaceAll("'", "''")}'`;
  const rows = updated.map(data => `SELECT ${literal(data.orderId)} AS order_id, ${literal(JSON.stringify(data))} AS payload`);
  await source.query(`CREATE OR REPLACE SCHEMASTORE VIEW records WITH CONTAINER order_evidence AS ${rows.join(' UNION ALL ')}`, 1);
  const after = await readDedicatedSource(source, updated);
  if (!isDeepStrictEqual(after.payloads, updated)) {
    throw new Error('The U01 demo write did not pass20/20 source verification.');
  }
  return { view: VIEW, updateId: 'U01', changed: true, writes: 1, verified: 20, receipts: after.receipts };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    if (process.argv.length !== 2) throw new Error('This fixed U01 demo command accepts no arguments.');
    console.log(JSON.stringify(await updateZetarisDemo(), null, 2));
  }
  catch { console.error('Governed-source U01 demo update failed. Success has not been verified.'); process.exitCode = 1; }
}
