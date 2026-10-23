import { readFileSync, mkdirSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { investigate } from '../src/investigator.mjs';
import { Store } from '../src/store.mjs';
import { Zetaris } from '../src/zetaris.mjs';
import { Nightshift } from '../src/nightshift.mjs';

const truth = JSON.parse(readFileSync(new URL('../evaluation/ground-truth.json', import.meta.url), 'utf8'));
const directory = mkdtempSync(join(tmpdir(), 'order-evidence-live-eval-'));
const store = new Store({ file: join(directory, 'records.json') });
const zetaris = new Zetaris();
const nightshift = new Nightshift();
const destination = new URL('../evaluation/results/live.json', import.meta.url);
const report = { startedAt: new Date().toISOString(), mode: 'live', node: process.version,
  scope: 'Synthetic evidence retrieved from real Zetaris; real Nightshift selections through the genuine vendored Markovian executor.',
  requestedRoute: nightshift.model, completed: false, cases: [],
  notEvaluatedByThisRun: ['source updates', 'approval invalidation', 'process restarts', 'billing verification', 'Cursor contribution'] };
function persist() {
  mkdirSync(new URL('../evaluation/results/', import.meta.url), { recursive: true });
  writeFileSync(destination, JSON.stringify(report, null, 2) + '\n');
}
function usageCounts(usage) {
  if (!usage || typeof usage !== 'object') return null;
  const counts = Object.fromEntries(['prompt_tokens', 'completion_tokens', 'total_tokens']
    .filter(key => Number.isFinite(usage[key]) && usage[key] >= 0).map(key => [key, usage[key]]));
  return Object.keys(counts).length ? counts : null;
}
function callEvidence(item) {
  return { model: typeof item.model === 'string' ? item.model : null,
    usage: usageCounts(item.usage), cost: Number.isFinite(item.cost) ? item.cost : null };
}
function providerEvidence(provider) {
  return { kind: provider.kind, ...callEvidence(provider), attempts: provider.attempts,
    validated: provider.validated, calls: provider.calls.map(callEvidence) };
}
try {
  persist();
  for (let n = 1; n <= 20; n++) {
    const orderId = `SYN-ORD-${String(n).padStart(2, '0')}`;
    const started = performance.now();
    const observedCalls = [];
    const provider = { select: async (...args) => {
      const response = await nightshift.select(...args);
      observedCalls.push(callEvidence(response));
      return response;
    } };
    let result;
    try {
      const saved = await investigate({ orderId, mode: 'live', store, retrieve: id => zetaris.retrieve(id), provider });
      const revision = saved.revisions.at(-1);
      const expected = truth.cases.find(item => item.orderId === orderId);
      if (!expected) throw new Error('Missing evaluator ground truth');
      const supportedIds = new Set(revision.records.map(record => record.id));
      const matches = expected.status === revision.assessment.status
        && JSON.stringify(expected.causes.toSorted()) === JSON.stringify(revision.assessment.causes.toSorted());
      const referenceCoverage = revision.assessment.claims.length > 0
        && revision.assessment.claims.every(claim => claim.evidenceIds.length && claim.evidenceIds.every(id => supportedIds.has(id)));
      const sourceVerified = revision.receipts.some(receipt => receipt.source === 'zetaris' && receipt.scope === orderId && receipt.rowCount === 1);
      const modelVerified = revision.provider.kind === 'nightshift' && revision.provider.validated === true
        && revision.provider.attempts >= 1 && revision.provider.attempts <= 2;
      const uncertaintyRequest = n >= 11 && n <= 15 ? revision.assessment.status === 'undetermined' && revision.assessment.uncertainty.length > 0 : null;
      result = { orderId, state: 'completed', elapsedMs: performance.now() - started,
        actual: { status: revision.assessment.status, causes: revision.assessment.causes },
        expected: { orderId: expected.orderId, status: expected.status, causes: expected.causes },
        matches, referenceCoverage, sourceVerified, modelVerified, uncertaintyRequest,
        engine: { status: revision.engine.status, runId: revision.engine.runId, chunks: revision.engine.chunks.length, durationMs: revision.engine.durationMs },
        provider: providerEvidence(revision.provider), receipts: revision.receipts.map(receipt => ({
          id: receipt.id, source: receipt.source, method: receipt.method, query: receipt.query,
          at: receipt.at, scope: receipt.scope, returnedIds: receipt.returnedIds, rowCount: receipt.rowCount })) };
    } catch (error) {
      result = { orderId, state: 'failed', elapsedMs: performance.now() - started,
        observedCalls, error: { code: /^[A-Z_]+$/.test(error.code ?? '') ? error.code : 'EVALUATION_FAILED' } };
    }
    report.cases.push(result);
    persist();
    console.log(JSON.stringify({ orderId, state: result.state, matches: result.matches ?? false, modelVerified: result.modelVerified ?? false, elapsedMs: result.elapsedMs }));
    // A transport/authentication failure cannot be improved by repeating the same unavailable service19 more times.
    if (result.state === 'failed') break;
  }
  report.finishedAt = new Date().toISOString();
  report.completed = report.cases.length === 20 && report.cases.every(item => item.state === 'completed');
  report.summary = { attempted: report.cases.length,
    exactClassifications: report.cases.filter(item => item.matches).length,
    citationCoverage: report.cases.filter(item => item.referenceCoverage).length,
    sourceVerified: report.cases.filter(item => item.sourceVerified).length,
    modelVerified: report.cases.filter(item => item.modelVerified).length,
    completedEngineRuns: report.cases.filter(item => item.engine?.status === 'completed').length,
    uncertaintyRequests: report.cases.filter(item => item.uncertaintyRequest === true).length };
  report.passed = report.completed && report.summary.exactClassifications >= 18
    && report.summary.citationCoverage === 20 && report.summary.sourceVerified === 20
    && report.summary.modelVerified === 20 && report.summary.completedEngineRuns === 20 && report.summary.uncertaintyRequests === 5;
  persist();
  console.log(JSON.stringify({ passed: report.passed, ...report.summary }));
  if (!report.passed) process.exitCode = 1;
} finally { rmSync(directory, { recursive: true, force: true }); }
