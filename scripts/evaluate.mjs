import { readFileSync, mkdirSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { getCase } from '../src/fixtures.mjs';
import { investigate } from '../src/investigator.mjs';
import { Store } from '../src/store.mjs';

const truth = JSON.parse(readFileSync(new URL('../evaluation/ground-truth.json', import.meta.url), 'utf8'));
const directory = mkdtempSync(join(tmpdir(), 'order-evidence-eval-'));
const store = new Store({ file: join(directory, 'records.json') });
const cases = [];
try {
  for (let n = 1; n <= 20; n++) {
    const orderId = `SYN-ORD-${String(n).padStart(2, '0')}`;
    const started = performance.now();
    const saved = await investigate({ orderId, mode: 'preview', store, retrieve: async () => getCase(orderId) });
    const revision = saved.revisions.at(-1);
    const expected = truth.cases.find(item => item.orderId === orderId);
    if (!expected) throw new Error(`Evaluator ground truth missing for ${orderId}`);
    const matches = expected.status === revision.assessment.status
      && JSON.stringify(expected.causes.toSorted()) === JSON.stringify(revision.assessment.causes.toSorted());
    const supportedIds = new Set(revision.records.map(record => record.id));
    const referenceCoverage = revision.assessment.claims.every(claim => claim.evidenceIds.length && claim.evidenceIds.every(id => supportedIds.has(id)));
    cases.push({ case: `S${String(n).padStart(2, '0')}`, orderId, elapsedMs: performance.now() - started,
      actual: { status: revision.assessment.status, causes: revision.assessment.causes }, expected,
      matches, referenceCoverage, engineStatus: revision.engine.status, chunks: revision.engine.chunks.length });
  }
  const report = { evaluatedAt: new Date().toISOString(), mode: 'preview', scope: 'Synthetic local evidence, real vendored Markovian executor. No Zetaris or Nightshift requests.',
    node: process.version, cases, notEvaluatedByThisRun: ['liveAcceptance', 'providerUsage', 'providerCost', 'cursorContribution'] };
  mkdirSync(new URL('../evaluation/results/', import.meta.url), { recursive: true });
  writeFileSync(new URL('../evaluation/results/preview.json', import.meta.url), JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify({ evaluated: cases.length, completedEngineRuns: cases.filter(item => item.engineStatus === 'completed').length,
    classifications: cases.filter(item => item.matches).length, referenceCoverage: cases.filter(item => item.referenceCoverage).length, notEvaluatedByThisRun: report.notEvaluatedByThisRun }));
  if (cases.some(item => !item.matches || !item.referenceCoverage || item.engineStatus !== 'completed')) process.exitCode = 1;
} finally { rmSync(directory, { recursive: true, force: true }); }
