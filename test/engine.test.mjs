import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Store } from '../src/store.mjs';
import { investigate } from '../src/investigator.mjs';
import { getCase } from '../src/fixtures.mjs';
function scope(fn) { const dir=mkdtempSync(join(tmpdir(),'order-evidence-')); return Promise.resolve().then(()=>fn(new Store({file:join(dir,'store.json')}))).finally(()=>rmSync(dir,{recursive:true,force:true})); }
test('actual vendor executes retrieval then assessment in exactly two completed chunks',()=>scope(async store=>{
  let retrieved=0;
  const saved=await investigate({orderId:'SYN-ORD-03',mode:'preview',store,retrieve:async id=>{retrieved++;return getCase(id);}});
  const revision=saved.revisions[0];
  assert.equal(retrieved,1);assert.equal(revision.engine.status,'completed');
  assert.equal(revision.engine.chunks.length,2);
  assert.equal(revision.assessment.status,'at-risk');
  assert.equal(revision.provider.kind,'deterministic-preview');
}));
test('retrieval failure and missing live provider never save a successful assessment',()=>scope(async store=>{
  await assert.rejects(investigate({orderId:'SYN-ORD-03',mode:'preview',store,retrieve:async()=>{throw Error('source unavailable');}}));
  await assert.rejects(investigate({orderId:'SYN-ORD-03',mode:'live',store,retrieve:async id=>getCase(id)}));
  assert.equal(store.list().length,0);
}));
test('live candidate receives at most one correction then supported uncertainty, no invented narrative',()=>scope(async store=>{
  let calls=0;
  const provider={select:async()=>{calls++;return {candidate:{status:'on-track',causes:[],optionId:'invented',narrative:'Guaranteed delivery'},usage:null,model:'test-model'};}};
  const result=await investigate({orderId:'SYN-ORD-03',mode:'live',store,retrieve:async id=>getCase(id),provider});
  assert.equal(calls,2);
  assert.equal(result.revisions[0].assessment.status,'undetermined');
  assert.equal(JSON.stringify(result).includes('Guaranteed delivery'),false);
  assert.equal(result.revisions[0].provider.attempts,2);
}));
