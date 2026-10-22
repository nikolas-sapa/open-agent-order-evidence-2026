# Order Evidence Implementation Plan

> For agentic workers: execute the frozen BUILD_SPEC_OCT22 task-by-task with independent review before completion. Main owns integration and Git; isolated new entry directory, not main/master.

**Goal:** working local evidence/revision investigation and honest live sponsor adapters.

**Architecture:** built-in Node HTTP service, durable application revisions, real pinned Markovian execution, separate preview/live evidence and inference adapters. Static semantic workspace faithfully adapts Ledger source.

**Tech Stack:** Node24.19+, native ES modules/TypeScript transform flag, browser HTML/CSS/JS, npm scripts with0runtime dependencies.

## Global constraints

Approved test/non-goal/identity/auth contracts in BUILD_SPEC_OCT22 govern every task. Geist Sans,#006bff,noorange,noemoji. No model/source success from a healthcheck or mock. Same source and provider mode stay bound to a saved revision. Secrets server-side, ignored files private. Actual Cursor U07 test remains reserved; no other agent authors it.

## Task1, domain/evidence and persistence

Owner core worker. Create entry/src/domain.mjs,fixtures.mjs,store.mjs,investigator.mjs; entry/test/domain.test.mjs,store.test.mjs,engine.test.mjs; entry/evaluation/ground-truth.json. Root owns vendor tree. Export listOrders(), getCase(orderId), applyUpdate(case,updateId), assess(case), validateCandidate(candidate,assessment), Store class and investigate({caseData,mode,retrieve,provider,store,investigationId?}). Return shapes exactly spec.20cases/10updates match manifest, expected labels exclusively evaluation/ground-truth.json. Record full references, bounded absence receipts. Add native tests before implementation; run node --experimental-transform-types --test. Pass numerical tests above. No provider/server/UI/dependency/Git edits.

## Task2, runtime adapters/server

Owner main. Create entry/package.json,.gitignore,.env.example,src/zetaris.mjs,nightshift.mjs,server.mjs and scripts/seed-zetaris.mjs,check-live.mjs; vendor unchanged engine+license+provenance. Nightshift validates actual models and response schema, timeouts/cancellation, captures reported usage, never guesses cost. Zetaris authenticates privately, validates actual response mapping before retrieval, rejects redirects, bounds rows. HTTP exposes only frozen routes and sanitized errors, rejects nonlocal origin/state changes and large bodies. Native security checks cover denied/unavailable/timeout. Verify real source access independently; if absent, keep live gate open.

## Task3, evidence workspace

Owner frontend worker after core contract. Create entry/public/index.html,styles.css,app.js,fonts/* and docs/UI_PROVENANCE.md only. Port actual Ledger static layout; no library deps. Select order/mode, investigate, inspect evidence citations/revisions, approve exact draft revision, apply eligible synthetic update. Never imply review sends anything. Show live errors and preview label. Use textContent/DOM construction for all untrusted strings. Verify viewport/focus/updates in actual browser; root integrates API.

## Task4, integration/evaluation and review

Main runs tests with explicit bundled Node24, real HTTP preview roundtrip,2full restart persistence and engine traces. Seed actual synthetic view only after supported SQL shape verified, run real Zetaris retrieval through app. Live Nightshift remains blocked until accepted official executable/runtime available, no bypass. UI screenshot-check desktop/mobile if supported. Read-only TypeScript/JavaScript and security reviews mandatory; fix material findings then rerun affected checks. Actual Cursor U07 remains outstanding until genuine author/review/run activity.

## Task5, delivery

Main produces truthful README,metadata,provenance,actual evaluation status and demo instructions. Commit source on build/order-evidence branch; push authorized coding work to suitable private remote after checking account/repository state. No public deployment. Video/deck/submission remain open if live/runtime/Cursor proof missing. Final report distinguishes working preview, real engine, real data retrieval, live model and unexecuted acceptance.
