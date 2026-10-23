import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { updateZetarisDemo } from '../scripts/update-zetaris-demo.mjs';
import { listOrders, getCase, applyUpdate } from '../src/fixtures.mjs';
import { Zetaris } from '../src/zetaris.mjs';

const baseCases = () => listOrders().map(({ id }) => getCase(id));

function fakeSource(cases = baseCases(), { corruptAfterWrite = false, countStyle = 'object' } = {}) {
  let payloads = structuredClone(cases);
  const writes = [];
  const retrieved = [];
  const queries = [];
  return {
    writes, retrieved, queries,
    payloads: () => structuredClone(payloads),
    query: async (sql, limit) => {
      queries.push(sql);
      if (sql === 'SELECT COUNT(*) AS row_count FROM order_evidence.records') {
        assert.equal(limit, 1);
        return { data: countStyle === 'array' ? [[String(payloads.length)]] : [{ row_count: payloads.length }] };
      }
      const read = /^SELECT payload FROM order_evidence\.records WHERE order_id = '(SYN-ORD-\d{2})'$/.exec(sql);
      if (read) {
        assert.equal(limit, 2);
        retrieved.push(read[1]);
        return { data: payloads.filter(data => data.orderId === read[1]).map(data => countStyle === 'array'
          ? [JSON.stringify(data)] : { payload: JSON.stringify(data) }) };
      }
      assert.equal(limit, 1);
      assert.match(sql, /^CREATE OR REPLACE SCHEMASTORE VIEW records WITH CONTAINER order_evidence AS SELECT /);
      assert.doesNotMatch(sql, /DROP |CREATE SCHEMASTORE CONTAINER/);
      const selects = sql.slice(sql.indexOf(' AS SELECT ') + 4).split(' UNION ALL ');
      payloads = selects.map(select => {
        const match = /^SELECT '((?:[^']|'')*)' AS order_id, '((?:[^']|'')*)' AS payload$/.exec(select);
        assert.ok(match, 'Each generated row has exactly two escaped SQL literals.');
        const payload = JSON.parse(match[2].replaceAll("''", "'"));
        assert.equal(payload.orderId, match[1].replaceAll("''", "'"));
        return payload;
      });
      writes.push(sql);
      if (corruptAfterWrite) payloads[19].records[0].version += 1;
      return { data: [] };
    },
    retrieve: async () => { throw new Error('Decorated retrieval must not be used for the raw payload guard.'); },
  };
}

test('U01 writes one fixed view, preserves19 payloads and every old immutable record, then verifies20/20', async () => {
  const base = baseCases();
  const source = fakeSource(base);
  const result = await updateZetarisDemo(source);
  assert.deepEqual({ changed: result.changed, writes: result.writes, verified: result.verified }, { changed: true, writes: 1, verified: 20 });
  assert.equal(source.writes.length, 1);
  assert.equal(source.retrieved.length, 40);
  assert.equal(result.receipts.length, 20);
  assert.deepEqual(result.receipts.map(receipt => receipt.scope), listOrders().map(({ id }) => id));
  for (const receipt of result.receipts) {
    assert.match(receipt.id, /^[0-9a-f-]{36}$/);
    assert.equal(receipt.source, 'zetaris');
    assert.equal(receipt.method, '/api/proxy/sql-editor/sqls/run-query');
    assert.equal(receipt.query, `SELECT payload FROM order_evidence.records WHERE order_id = '${receipt.scope}'`);
    assert.ok(Number.isFinite(Date.parse(receipt.at)));
    assert.deepEqual(receipt.returnedIds, source.payloads().find(data => data.orderId === receipt.scope).records.map(record => record.id));
  }
  const actual = source.payloads();
  for (const [index, original] of base.entries()) {
    const expected = original.orderId === 'SYN-ORD-03' ? applyUpdate(original, 'U01') : original;
    assert.deepEqual(actual[index], expected);
    for (const record of original.records) assert.deepEqual(actual[index].records.find(item => item.id === record.id), record);
  }
  assert.equal(actual[2].records.length, base[2].records.length + 1);
});

test('exact U01 retry performs zero writes and verifies all20 payloads with array count responses', async () => {
  const cases = baseCases().map(data => data.orderId === 'SYN-ORD-03' ? applyUpdate(data, 'U01') : data);
  const source = fakeSource(cases, { countStyle: 'array' });
  const result = await updateZetarisDemo(source);
  assert.equal(result.changed, false);
  assert.equal(result.writes, 0);
  assert.equal(result.verified, 20);
  assert.equal(source.retrieved.length, 20);
  assert.equal(source.writes.length, 0);
});

test('missing or extra row count performs zero retrievals and zero writes', async () => {
  for (const cases of [baseCases().slice(0, 19), [...baseCases(), getCase('SYN-ORD-03')]]) {
    const source = fakeSource(cases);
    await assert.rejects(updateZetarisDemo(source), /exactly20 rows/);
    assert.equal(source.retrieved.length, 0);
    assert.equal(source.writes.length, 0);
  }
});

test('drift, another update, hidden payload fields and duplicate/missing identity each perform zero writes', async () => {
  for (const kind of ['immutable', 'mixed', 'extra-field', 'identity']) {
    const cases = baseCases();
    if (kind === 'immutable') cases[19].records[0].version += 1;
    if (kind === 'mixed') {
      cases[2] = applyUpdate(cases[2], 'U01');
      cases[4] = applyUpdate(cases[4], 'U02');
    }
    if (kind === 'extra-field') cases[19].unexpected = 'drift';
    if (kind === 'identity') cases[19] = getCase('SYN-ORD-03');
    const source = fakeSource(cases);
    await assert.rejects(updateZetarisDemo(source));
    assert.equal(source.writes.length, 0, kind);
  }
});

test('post-write immutable drift fails verification rather than returning success', async () => {
  const source = fakeSource(baseCases(), { corruptAfterWrite: true });
  await assert.rejects(updateZetarisDemo(source), /did not pass20\/20 source verification/);
  assert.equal(source.writes.length, 1);
  assert.equal(source.retrieved.length, 40);
});

test('raw stored retrievalReceipts drift bypasses adapter decoration but blocks the demo helper with zero writes', async () => {
  const cases = baseCases();
  const storedReceipts = [{ storedMetadata: 'must not be erased' }];
  cases[19].retrievalReceipts = storedReceipts;
  const source = new Zetaris({ username: 'test', password: 'test', platformEnvFile: '' });
  source.session = { token: 'test-token', orgId: '1' };
  const writes = [];
  source.request = async (path, body) => {
    assert.equal(path, '/api/proxy/sql-editor/sqls/run-query');
    if (body.sql === 'SELECT COUNT(*) AS row_count FROM order_evidence.records') return { data: [[20]] };
    const read = /^SELECT payload FROM order_evidence\.records WHERE order_id = '(SYN-ORD-\d{2})'$/.exec(body.sql);
    if (read) return { data: cases.filter(data => data.orderId === read[1]).map(data => [JSON.stringify(data)]) };
    writes.push(body.sql);
    throw new Error('No write permitted.');
  };
  const decorated = await source.retrieve('SYN-ORD-20');
  assert.notDeepEqual(decorated.retrievalReceipts, storedReceipts, 'The real adapter overwrites the stored field.');
  await assert.rejects(updateZetarisDemo(source), /differs from its fixed base or exact U01 state/);
  assert.equal(writes.length, 0);
  assert.deepEqual(cases[19].retrievalReceipts, storedReceipts);
});

test('CLI rejects arbitrary arguments without reading private configuration or echoing input', () => {
  const secretInput = 'DO-NOT-ECHO-demo-argument';
  const result = spawnSync(process.execPath, ['scripts/update-zetaris-demo.mjs', secretInput], {
    cwd: new URL('..', import.meta.url), encoding: 'utf8',
    env: { ...process.env, ZETARIS_PLATFORM_ENV_FILE: '/does-not-exist/private-configuration' },
  });
  assert.equal(result.status, 1);
  assert.equal(result.stdout, '');
  assert.equal(result.stderr, 'Governed-source U01 demo update failed. Success has not been verified.\n');
  assert.doesNotMatch(result.stderr, /DO-NOT-ECHO|does-not-exist/);
});
