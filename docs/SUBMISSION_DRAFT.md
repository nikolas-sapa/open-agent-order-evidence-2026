# Submission material, October 24 working draft

HackOS remains a saved draft; final submission has not been sent. Final live media persisted after save and reload: the [narrated screenshot walkthrough](https://iframe.mediadelivery.net/embed/778121/7ef4784a-f77f-4a4f-9c61-5bc78281de22) plays remotely and the [eight-slide deck](https://hackathon-server.genai.works/api/v1/cdn/proxy/hackathon/2405b06a26524e549e104b062607c3da.pptx) downloads with an exact local hash match. The repository is public and anonymous access was verified. Updated 1,929-character description text is in `SUBMISSION_DESCRIPTION_DRAFT.txt`; changing this file does not update HackOS.

Current proof: 38/38 native tests, 20/20 preview classifications, 20/20 exact real Zetaris base payload retrievals, and 17/20 distinct exact live source/Nightshift/Markovian cases with valid record references. All 5 designated uncertainty cases passed. The full live matrix failed: S18 returned HTTP 503 `engine_reloaded`, then timed out after a normal app restart and explicit manual continuation; S19–S20 were not run. Across 19 attempts, 17 successful returned calls reported 12,940 tokens and USD 0; failed-call usage/cost is unknown. Billing is not independently verified. The actual U01 source change passed with one guarded write and all 20 post-write payloads verified. Live linked on-track revision 2 retained old records and invalidated the prior automated demonstration approval; the current revision remains unapproved. Final submission remains pending. [Campaign evidence](evidence/live-campaign-oct24.json), [U01 source evidence](evidence/zetaris-u01-oct24.json), [live U01 evidence](evidence/live-u01-oct24.json).

The campaign used the base source before U01. The current dedicated source is post-U01, where Order 003 is on track. The unchanged baseline labels apply to the earlier phase; no full post-U01 matrix rerun was performed. Historical reports remain unchanged.

## Eight-slide content

### 1. Problem and user

Small-wholesaler operations coordinators need to understand why an order may miss its promised date. Order, stock and supplier statements can disagree or become stale. Order Evidence asks one focused question and keeps the records behind each answer inspectable. Market impact has not been measured.

### 2. Solution

One synthetic order workspace shows status, supported causes, uncertainty, evidence timeline and a draft for human review. Each source has immutable identity/version and observation/effective times. Changed evidence creates a linked revision and invalidates the earlier approval. No messages, purchases or real order changes occur.

### 3. Agent workflow

The genuine pinned Meterless Markovian executor drives retrieval, then assessment. A deterministic policy checks dates, quantities, scope and freshness. In Live mode, Nightshift runs local Qwen2.5 1.5B for a bounded selection, checked with at most one correction. Failed validation yields explicit uncertainty. Actual source/model receipts and immutable cited versions are retained.

### 4. Stack

Node 24.19, built-in HTTP/fetch/test/fs/crypto, ES modules and the experimental TypeScript transform flag for unchanged imported Meterless source. Semantic HTML/CSS/JavaScript workspace, local Geist fonts, zero runtime npm dependencies. Atomic file persistence owns investigation/revision identity and approval history. Pre-existing imported components disclosed.

### 5. Zetaris role

The live data boundary is a bounded query of `order_evidence.records` through the existing local Zetaris account proxy. Credentials stay server-side. October 23 registration and retrieval passed 20/20 exact base synthetic payloads; an actual duplicate-container control returned HTTP 400. October 24 U01 used one guarded source write and verified all 20 post-write payloads with retrieval receipts, preserving the other 19 orders and existing immutable versions. Re-investigation produced linked live revision 2 and invalidated the earlier automated demonstration approval. These are separately evidenced source and application checks.

### 6. Meterless and unique use

Actual Markovian callbacks drive retrieval and assessment. 20/20 preview evaluation runs completed through the unchanged Apache 2.0 reference. Business revisions and approval invalidation are persisted separately. Nightshift requests use a discovered concrete local model, fresh UUID memory scope, `max_price: 0`, at most 256 output tokens and an 80-second completion deadline. No NVIDIA inference or award eligibility is claimed.

### 7. Actual product and evidence

Use actual running-app captures. Representative real S03 finished in 23.374 seconds with 769 reported tokens and Runtime-reported `actual_usd: 0`. A separate browser measurement gave a 31.873-second upper bound, not exact render time. The live U01 revision completed Markovian execution in 31.617 seconds with one validated Nightshift call, 783 reported tokens and reported USD 0. Automated checks: 38/38 native tests; 20/20 exact preview classifications; 5/5 preview uncertainty cases; 10/10 preview update checks; two process restarts preserve state. Reference checks establish record existence, not an independent semantic citation audit. Label automated synthetic demo approvals accurately. One live update demonstration does not establish all ten live update scenarios.

### 8. Limitations and next improvements

First release is synthetic, single-order and local. Full live matrix and uninterrupted reliability failed; independent billing and customer impact were not measured. Successful campaign investigations ranged 7.0–82.0 seconds; the failed manual continuation took 101.079 seconds. Representative S03 timing is not universal. Cursor desktop-agent development is complete: U07 HTTP test 1/1, then-current suite 25/25, independently checked October 23 suite 27/27; current total 38/38. No paid upgrade purchased. Future work: Runtime stability, semantic citation audit, realistic source onboarding and operational user feedback.

## Walkthrough narrative outline

The approximate outline below accompanies the locally verified 193.584333-second narrated screenshot walkthrough. [Final-media evidence](evidence/final-media-oct24.json) records the checks; remote playback and saved-draft persistence were also verified.

0–20 seconds: Introduce the operations coordinator's order-exception question. State synthetic data and a narrated walkthrough of actual application captures. Do not call screenshots continuous screen recording.

20–50 seconds: Show actual Live Order 003, ordered quantity 10, stock 2, supplier quantity 8 arriving October 28 after the October 26 promise. Open supplier version 1. Explain immutable source identity and distinguish fixed scenario dates from execution timestamps.

50–85 seconds: Explain the supported late-replenishment cause and review draft. Show actual Zetaris retrieval receipt, completed Markovian callbacks and Nightshift model/usage receipt. Keep engine token estimates distinct from model-reported usage.

85–120 seconds: Show verified real governed-source U01, supplier version 2 arriving October 25, linked on-track revision 2 and invalidated earlier automated demonstration approval. Open revision 1 to show preserved history. Current revision 2 remains unapproved.

120–145 seconds: Show a captured uncertainty example if available. Explain bounded model selection, deterministic validation, one correction and visible failures. No supplier message is sent.

145–165 seconds: Show 17/20 distinct exact live cases and 5/5 uncertainty cases, alongside separately labelled 38 native tests and 20/20 preview classifications. State that S18 failed twice, S19–S20 were unrun and the full matrix failed. Retain failed-run evidence. Use reported usage/cost qualifiers; do not infer billing or universal latency.

165–180 seconds: Disclose local synthetic scope, imported components and actual Codex/Cursor contribution. State remaining acceptance limits from the final report. End with the working evidence-review workflow.

The replacement video `order-evidence-live-oct24.mp4` is locally verified: 193.584333 seconds, 5,070,012 bytes, SHA256 `018d203a31589f74958d7bf1d445463b32caada75deb350947acf999e90f0386`, H.264 1920×1080 at 24 fps with AAC 48 kHz mono audio. It uses actual live UI screenshots and local narration, not continuous screen recording. All eight encoded scenes were visually reviewed, including legible U01 revision history and approval invalidation. Decode completed with zero errors. Audio checks were automated (mean -19.4 dB, peak -0.9 dB); human listening was not performed.

The eight-slide deck is locally verified as `order-evidence-final-oct23.pptx` (October 24 facts despite the filename): 61,438 bytes, SHA256 `e7e933ec0b96549da31701f00154aa5c3c73b79481a3b52f85bd93975106910d`, zero integrity/layout findings and eight slides re-imported. Its remote download returned HTTP 200, the same byte count and an exact SHA256 match. Remote video playback advanced to 27.17729 seconds, duration 193.564 seconds, 1920×1080, readyState 4, error null; playback was paused afterward. Both uploads persisted in the saved draft after reload. Final submission remains pending. The October 23 preview upload receipt remains a historical artifact.

October 22 official update, verified October 23: Cursor optional and no free event credits. Actual Cursor contribution remains disclosed. Separate sponsor clarification keeps Nightshift Power integration required. Public repository access is already verified; final HackOS submission remains pending.
