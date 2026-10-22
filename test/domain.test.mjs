import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { listOrders, getCase, applyUpdate, availableUpdates } from '../src/fixtures.mjs';
import { assess, validateCandidate } from '../src/domain.mjs';
const truth = JSON.parse(readFileSync(new URL('../evaluation/ground-truth.json', import.meta.url)));
test('20 base cases match exact status/cause and cite existing immutable records', () => {
  assert.equal(listOrders().length, 20);
  for (const expected of truth.cases) {
    const data = getCase(expected.orderId), result = assess(data);
    assert.equal(result.status, expected.status, expected.orderId);
    assert.deepEqual(result.causes.toSorted(), expected.causes.toSorted(), expected.orderId);
    assert.ok(result.claims.length > 0);
    for (const claim of result.claims) {
      assert.ok(claim.evidenceIds.length > 0);
      assert.ok(claim.evidenceIds.every(id => data.records.some(r => r.id === id)));
    }
  }
});
test('five designated uncertainty scenarios request concrete evidence', () => {
  for (const id of ['SYN-ORD-11','SYN-ORD-12','SYN-ORD-13','SYN-ORD-14','SYN-ORD-15']) {
    const result = assess(getCase(id));
    assert.equal(result.status, 'undetermined');
    assert.ok(result.uncertainty.length > 0);
  }
});
test('10 updates match exact revised status/cause and redelivery is idempotent', () => {
  assert.equal(truth.updates.length, 10);
  for (const expected of truth.updates) {
    const base = getCase(expected.orderId);
    assert.ok(availableUpdates(expected.orderId).some(u => u.id === expected.updateId));
    const revised = applyUpdate(base, expected.updateId), result = assess(revised);
    assert.equal(result.status, expected.status, expected.updateId);
    assert.deepEqual(result.causes.toSorted(), expected.causes.toSorted(), expected.updateId);
    assert.deepEqual(applyUpdate(revised, expected.updateId), revised);
  }
});
test('freshness boundary is inclusive at exactly 72h, ETA equals promise is timely', () => {
  const data = getCase('SYN-ORD-06');
  const supplier = data.records.find(r => r.kind === 'supplier');
  supplier.observedAt = '2026-10-20T09:01:00Z';
  assert.equal(assess(data).status, 'on-track');
  supplier.observedAt = '2026-10-20T09:00:00Z';
  assert.deepEqual(assess(data).causes, ['stale evidence']);
});
test('known-future supplier change matters, later observation without supersession cannot erase it', () => {
  const updated = applyUpdate(getCase('SYN-ORD-19'), 'U09');
  assert.equal(assess(updated).status, 'on-track');
  delete updated.records.find(r => r.kind === 'supplier' && r.version === 3).fields.supersedes;
  assert.equal(assess(updated).status, 'at-risk');
});
test('candidate validation rejects unsupported status, causes, options and free-form assertions', () => {
  const assessment = assess(getCase('SYN-ORD-03'));
  const candidate = { status: assessment.status, causes: assessment.causes, optionId: assessment.options[0].id };
  assert.equal(validateCandidate(candidate, assessment).valid, true);
  for (const invalid of [{...candidate,status:'on-track'}, {...candidate,causes:[]}, {...candidate,optionId:'buy'}, {...candidate,narrative:'Arrival guaranteed'}]) {
    assert.equal(validateCandidate(invalid, assessment).valid, false);
  }
});
