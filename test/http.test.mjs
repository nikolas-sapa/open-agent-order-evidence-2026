import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { once } from 'node:events';
import { createApp } from '../src/server.mjs';
import { Store } from '../src/store.mjs';
import { getCase, applyUpdate } from '../src/fixtures.mjs';
import { assess } from '../src/domain.mjs';

// HTTP contract tests use explicit fake remote providers, never live sponsor proof.
async function withApp(run) {
  const directory = mkdtempSync(join(tmpdir(), 'order-evidence-http-'));
  const store = new Store({ file: join(directory, 'records.json') });
  const fixture = { value: getCase('SYN-ORD-03') };
  const server = createApp({ store, zetaris: { status: async () => ({ state: 'offline' }), retrieve: async () => structuredClone(fixture.value) },
    nightshift: { status: async () => ({ state: 'unconfigured' }), select: async assessment => ({ candidate: { status: assessment.status, causes: assessment.causes, optionId: assessment.options[0].id }, model: 'explicit-test-provider' }) } });
  server.listen(0, '127.0.0.1'); await once(server, 'listening');
  const base = `http://127.0.0.1:${server.address().port}`;
  const post = async (path, value, headers = {}) => { const response = await fetch(base + path, { method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(value) }); return { status: response.status, body: await response.json() }; };
  try { await run({ post, fixture, base, store }); }
  finally { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); rmSync(directory, { recursive: true, force: true }); }
}
test('HTTP preview update invalidates approval; reinvestigation preserves current evidence', () => withApp(async ({ post }) => {
  const first = (await post('/api/investigate', { orderId: 'SYN-ORD-03', mode: 'preview' })).body;
  await post(`/api/investigations/${first.id}/approve`, { revisionId: first.currentRevisionId });
  const changed = (await post(`/api/investigations/${first.id}/update`, { updateId: 'U01' })).body;
  assert.equal(changed.revisions.length, 2); assert.ok(changed.approvals[0].invalidatedAt);
  const again = (await post('/api/investigate', { orderId: 'SYN-ORD-03', mode: 'preview' })).body;
  assert.equal(again.id, first.id); assert.equal(again.currentRevisionId, changed.currentRevisionId);
  assert.equal((await post(`/api/investigations/${first.id}/approve`, { revisionId: first.currentRevisionId })).status, 409);
}));
test('HTTP live reassessment preserves identity and invalidates old approval (fake provider contract test)', () => withApp(async ({ post, fixture, store }) => {
  const first = (await post('/api/investigate', { orderId: 'SYN-ORD-03', mode: 'live' })).body;
  await post(`/api/investigations/${first.id}/approve`, { revisionId: first.currentRevisionId });
  fixture.value = applyUpdate(fixture.value, 'U01');
  const second = (await post('/api/investigate', { orderId: 'SYN-ORD-03', mode: 'live' })).body;
  assert.equal(second.id, first.id); assert.equal(second.revisions.length, 2);
  assert.ok(second.approvals[0].invalidatedAt); assert.equal(store.list().length, 1);
}));
test('HTTP U10 exposes recovery revision for approval before cancellation', () => withApp(async ({ post }) => {
  const first = (await post('/api/investigate', { orderId: 'SYN-ORD-20', mode: 'preview' })).body;
  const path = `/api/investigations/${first.id}`;
  assert.equal((await post(path + '/update', { updateId: 'U10' })).status, 409);
  const recovery = (await post(path + '/update', { updateId: 'U10-recovery' })).body;
  assert.equal(recovery.revisions.at(-1).assessment.status, 'on-track');
  await post(path + '/approve', { revisionId: recovery.currentRevisionId });
  const cancelled = (await post(path + '/update', { updateId: 'U10' })).body;
  assert.equal(cancelled.revisions.at(-1).assessment.status, 'at-risk');
  assert.equal(cancelled.approvals[0].revisionId, recovery.currentRevisionId); assert.ok(cancelled.approvals[0].invalidatedAt);
}));
test('HTTP rejects cross-origin writes and unknown mode', () => withApp(async ({ post }) => {
  assert.equal((await post('/api/investigate', { orderId: 'SYN-ORD-03', mode: 'preview' }, { Origin: 'https://attacker.example' })).status, 403);
  assert.equal((await post('/api/investigate', { orderId: 'SYN-ORD-03', mode: 'guess' })).status, 400);
}));
test('unrelated stock and impossible calendar timestamps are rejected before arithmetic', () => {
  const unrelated = getCase('SYN-ORD-03'); unrelated.records.find(record => record.kind === 'stock').fields.item = 'unrelated-item';
  assert.throws(() => assess(unrelated), /scope/);
  const wrongOrder = getCase('SYN-ORD-03'); wrongOrder.records[1].orderId = 'SYN-ORD-02';
  assert.throws(() => assess(wrongOrder), /scope/);
  const impossible = getCase('SYN-ORD-03'); impossible.records[1].observedAt = '2026-02-30T00:00:00Z';
  assert.throws(() => assess(impossible), /timestamp/);
});
