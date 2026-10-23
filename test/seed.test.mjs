import test from 'node:test';
import assert from 'node:assert/strict';
import { seed } from '../scripts/seed-zetaris.mjs';
import { getCase } from '../src/fixtures.mjs';

test('existing container conflict causes zero subsequent view writes', async () => {
  const calls = [];
  const conflict = new Error('Container already exists');
  await assert.rejects(seed({ query: async sql => { calls.push(sql); throw conflict; } }), error => error === conflict);
  assert.deepEqual(calls, ['CREATE SCHEMASTORE CONTAINER order_evidence']);
});

test('source setup verifies all20 payloads and rejects one changed immutable record', async () => {
  const queries = [];
  const seen = [];
  const source = {
    query: async sql => { queries.push(sql); return {}; },
    retrieve: async id => {
      seen.push(id);
      const result = getCase(id);
      if (id === 'SYN-ORD-20') result.records[0].version += 1;
      return result;
    },
  };
  await assert.rejects(seed(source), /verification failed for SYN-ORD-20/);
  assert.equal(seen.length, 20);
  assert.equal(queries.length, 2);
  assert.match(queries[1], /^CREATE SCHEMASTORE VIEW records WITH CONTAINER order_evidence AS /);
  assert.doesNotMatch(queries[1], /OR REPLACE|DROP /);
});
