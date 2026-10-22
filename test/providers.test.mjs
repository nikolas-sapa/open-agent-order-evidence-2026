import test from 'node:test';
import assert from 'node:assert/strict';
import { Nightshift } from '../src/nightshift.mjs';
import { Zetaris, queryRows } from '../src/zetaris.mjs';

test('Nightshift refuses placeholder auth without a network request', async () => {
  await assert.rejects(new Nightshift({ token: 'rt-local' }).discovery(), error => error.code === 'UNCONFIGURED');
});
test('Zetaris rejects arbitrary SQL-bearing order identifiers before a network request', async () => {
  await assert.rejects(new Zetaris().retrieve("SYN-ORD-01' OR 1=1"), error => error.code === 'INVALID_ORDER');
});
test('unknown query shape is a source failure, not empty evidence', () => {
  assert.throws(() => queryRows({ success: false }), error => error.code === 'SOURCE_INVALID');
});
