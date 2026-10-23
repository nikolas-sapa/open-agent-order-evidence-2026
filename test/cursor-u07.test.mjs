import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { once } from 'node:events';
import { createApp } from '../src/server.mjs';
import { Store } from '../src/store.mjs';

test('HTTP preview U07 for SYN-ORD-13 covers the missing supplier and invalidates the prior approval', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'order-evidence-cursor-u07-'));
  const store = new Store({ file: join(directory, 'records.json') });
  const server = createApp({
    store,
    zetaris: {
      status: async () => ({ state: 'offline' }),
      retrieve: async () => { throw new Error('preview must not retrieve live evidence'); }
    },
    nightshift: {
      status: async () => ({ state: 'unconfigured' }),
      select: async () => { throw new Error('preview must not call a model provider'); }
    }
  });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const base = `http://127.0.0.1:${server.address().port}`;
  const request = async (method, path, value) => {
    const response = await fetch(base + path, {
      method,
      headers: method === 'GET' ? {} : { 'Content-Type': 'application/json' },
      body: method === 'GET' ? undefined : JSON.stringify(value)
    });
    return { status: response.status, body: await response.json() };
  };
  try {
    const investigated = await request('POST', '/api/investigate', { orderId: 'SYN-ORD-13', mode: 'preview' });
    assert.equal(investigated.status, 200);
    const first = investigated.body;
    assert.equal(first.orderId, 'SYN-ORD-13');
    assert.equal(first.mode, 'preview');
    assert.equal(first.revisions.length, 1);
    const initialRevision = first.revisions[0];
    assert.equal(initialRevision.id, first.currentRevisionId);
    assert.equal(initialRevision.previousRevisionId, null);
    assert.equal(initialRevision.provider.kind, 'deterministic-preview');
    assert.equal(initialRevision.assessment.status, 'undetermined');
    assert.deepEqual(initialRevision.assessment.causes, ['missing evidence']);
    const absenceReceipt = initialRevision.records.find(record => record.kind === 'receipt' && record.recordId === 'SYN-RET-13');
    assert.equal(absenceReceipt.fields.scope, 'item-13 supplier');
    assert.deepEqual(absenceReceipt.fields.returnedIds, []);
    assert.equal(initialRevision.records.filter(record => record.kind === 'supplier').length, 0);

    const approved = await request('POST', `/api/investigations/${first.id}/approve`, { revisionId: first.currentRevisionId });
    assert.equal(approved.status, 200);
    assert.equal(approved.body.approvals.length, 1);
    assert.equal(approved.body.approvals[0].revisionId, first.currentRevisionId);
    assert.equal(approved.body.approvals[0].invalidatedAt, undefined);

    const updated = await request('POST', `/api/investigations/${first.id}/update`, { updateId: 'U07' });
    assert.equal(updated.status, 200);

    const persisted = store.get(first.id);
    const fetched = await request('GET', `/api/investigations/${first.id}`);
    assert.equal(fetched.status, 200);
    assert.deepEqual(fetched.body, persisted);
    assert.deepEqual(updated.body, persisted);

    assert.equal(persisted.mode, 'preview');
    assert.equal(persisted.revisions.length, 2);
    const [revision1, revision2] = persisted.revisions;
    assert.equal(revision1.id, first.currentRevisionId);
    assert.equal(revision1.number, 1);
    assert.equal(revision2.number, 2);
    assert.equal(revision2.previousRevisionId, revision1.id);
    assert.equal(persisted.currentRevisionId, revision2.id);
    assert.equal(revision2.assessment.status, 'on-track');
    assert.deepEqual(revision2.assessment.causes, []);
    assert.equal(persisted.approvals.length, 1);
    assert.equal(persisted.approvals[0].revisionId, revision1.id);
    assert.ok(persisted.approvals[0].invalidatedAt);

    const order = revision2.records.find(record => record.kind === 'order');
    const stock = revision2.records.find(record => record.kind === 'stock');
    const suppliers = revision2.records.filter(record => record.kind === 'supplier');
    assert.equal(order.fields.orderedQuantity, 10);
    assert.equal(order.fields.promiseDate, '2026-10-27T00:00:00Z');
    assert.equal(stock.fields.quantity, 2);
    assert.equal(suppliers.length, 1);
    assert.equal(suppliers[0].version, 1);
    assert.equal(suppliers[0].fields.quantity, 8);
    assert.equal(suppliers[0].fields.state, 'confirmed');
    assert.equal(suppliers[0].fields.eta, '2026-10-26T00:00:00Z');
    assert.equal(stock.fields.quantity + suppliers[0].fields.quantity, order.fields.orderedQuantity);
    assert.ok(Date.parse(suppliers[0].fields.eta) < Date.parse(order.fields.promiseDate));
    assert.ok(revision2.records.some(record => record.id === absenceReceipt.id));
    assert.equal(suppliers[0].id, 'synthetic-supplier::SYN-SUP-13::v1');
    assert.ok(revision2.assessment.claims.some(claim => claim.evidenceIds.includes(suppliers[0].id)));
    for (const revision of persisted.revisions) {
      assert.ok(!revision.records.some(record => record.kind === 'supplier' && record.version === 0));
      assert.ok(!revision.records.some(record => record.kind === 'supplier' && record.id.endsWith('::v0')));
    }
  } finally {
    server.closeAllConnections();
    await new Promise(resolve => server.close(resolve));
    rmSync(directory, { recursive: true, force: true });
  }
});
