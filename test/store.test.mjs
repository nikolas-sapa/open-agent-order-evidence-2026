import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { Store } from '../src/store.mjs';
import { getCase, applyUpdate, recoveryCase } from '../src/fixtures.mjs';
import { assess } from '../src/domain.mjs';
const save = (store, data, investigationId) => store.saveRevision({...data,mode:'preview',assessment:assess(data),receipts:[],engine:{status:'completed'},provider:{kind:'deterministic-preview'},changedEvidenceIds:[],investigationId});
test('approval invalidation, duplicate delivery and two fresh-store restarts preserve history', () => {
  const dir=mkdtempSync(join(tmpdir(),'order-evidence-'));
  try {
    const file=join(dir,'store.json'); let store=new Store({file});
    const initial=save(store,getCase('SYN-ORD-03'));
    store.approve(initial.id, initial.currentRevisionId);
    const revised=save(store,applyUpdate(getCase('SYN-ORD-03'),'U01'),initial.id);
    for(let i=0;i<3;i++) save(store,applyUpdate(getCase('SYN-ORD-03'),'U01'),initial.id);
    assert.equal(store.get(initial.id).revisions.length,2);
    assert.ok(revised.approvals[0].invalidatedAt);
    assert.equal(revised.approvals[0].revisionId,initial.currentRevisionId);
    for(let i=0;i<2;i++) { store=new Store({file}); assert.deepEqual(store.get(initial.id),revised); }
    assert.equal(statSync(file).mode & 0o777,0o600);
    assert.throws(()=>store.approve(initial.id,initial.currentRevisionId),/current revision/);
    assert.throws(()=>store.saveRevision({...getCase('SYN-ORD-02'),mode:'preview',investigationId:initial.id}),/binding/);
    assert.throws(()=>store.saveRevision({...getCase('SYN-ORD-03'),mode:'live',investigationId:initial.id}),/binding/);
  } finally {rmSync(dir,{recursive:true,force:true});}
});
test('U10 approval stays attached to recovery revision after cancellation', () => {
  const dir=mkdtempSync(join(tmpdir(),'order-evidence-'));
  try {
    const store=new Store({file:join(dir,'store.json')});
    const base=save(store,getCase('SYN-ORD-20'));
    const recovered=save(store,recoveryCase(),base.id);
    assert.equal(recovered.revisions.at(-1).assessment.status,'on-track');
    store.approve(base.id,recovered.currentRevisionId);
    const updated=save(store,applyUpdate(recoveryCase(),'U10'),base.id);
    assert.equal(updated.revisions.at(-1).assessment.status,'at-risk');
    assert.equal(updated.approvals[0].revisionId,recovered.currentRevisionId);
    assert.ok(updated.approvals[0].invalidatedAt);
  } finally {rmSync(dir,{recursive:true,force:true});}
});
test('all ten changed-evidence deliveries invalidate approval and remain one revision on three retries', () => {
  const pairs=[['U01','03'],['U02','05'],['U03','07'],['U04','08'],['U05','17'],['U06','12'],['U07','13'],['U08','18'],['U09','19'],['U10','20']];
  const dir=mkdtempSync(join(tmpdir(),'order-evidence-'));
  try {
    const store=new Store({file:join(dir,'store.json')});
    for(const [updateId,suffix] of pairs){
      const data=updateId==='U10'?recoveryCase():getCase(`SYN-ORD-${suffix}`);
      const initial=save(store,data);store.approve(initial.id,initial.currentRevisionId);
      const updated=applyUpdate(data,updateId);
      for(let delivery=0;delivery<3;delivery++)save(store,updated,initial.id);
      const final=store.get(initial.id);
      assert.equal(final.revisions.length,2,updateId);
      assert.equal(final.approvals[0].revisionId,initial.currentRevisionId,updateId);
      assert.ok(final.approvals[0].invalidatedAt,updateId);
      assert.ok(final.revisions[1].changedEvidenceIds.length>0,updateId);
    }
  } finally {rmSync(dir,{recursive:true,force:true});}
});
test('immutable source identity cannot be rewritten under the same version', () => {
  const dir=mkdtempSync(join(tmpdir(),'order-evidence-'));
  try {
    const store=new Store({file:join(dir,'store.json')}),data=getCase('SYN-ORD-03');
    const initial=save(store,data);data.records.find(r=>r.kind==='supplier').fields.eta='2026-10-25T00:00:00Z';
    assert.throws(()=>save(store,data,initial.id),/Immutable evidence identity/);
    assert.equal(store.get(initial.id).revisions.length,1);
  } finally {rmSync(dir,{recursive:true,force:true});}
});
test('persisted investigation survives two independent process restarts without evidence or approval loss', () => {
  const dir=mkdtempSync(join(tmpdir(),'order-evidence-'));
  try {
    const file=join(dir,'store.json'),store=new Store({file});
    const initial=save(store,getCase('SYN-ORD-03'));
    const expected=store.approve(initial.id,initial.currentRevisionId);
    const storeUrl=new URL('../src/store.mjs',import.meta.url).href;
    const script=`import { Store } from ${JSON.stringify(storeUrl)}; process.stdout.write(JSON.stringify(new Store({file:${JSON.stringify(file)}}).get(${JSON.stringify(initial.id)})));`;
    for(let restart=0;restart<2;restart++){
      const actual=JSON.parse(execFileSync(process.execPath,['--input-type=module','-e',script],{encoding:'utf8'}));
      assert.deepEqual(actual,expected);
    }
  } finally {rmSync(dir,{recursive:true,force:true});}
});
