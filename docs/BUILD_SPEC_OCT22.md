# Order Evidence, eligible build specification

October22,2026. Supersedes preparation-only implementation restrictions now the build window is open. Product/design approval belongs to main under the participant's explicit delegation recorded in LEAD_DECISIONS.md. External publication, messages and spend remain separate. Existing approved product/non-goals remain unchanged.

## Tests before implementation

1. Domain evaluation:20/20 designed scenarios execute, target>=18/20 exact status/cause sets;20/20 material claims carry immutable evidence references. Five uncertainty scenarios yield5/5 concrete missing/conflict requests. Run offline preview separately from live acceptance.
2. Revision safety:10/10 updates invalidate current draft approval;3 deliveries of the same evidence produce1 revision; U10 approval remains attached to recovery revision. One record survives2 process restarts with0 reference/revision/approval loss.
3. Engine proof: unchanged pinned Markovian runs the actual retrieval and assessment callbacks; completed status required, errored/aborted/max-chunks never accepted. At most1 model correction. C00 generic real import already completed1chunk under Node24.19 with experimental-transform-types.
4. Provider safety: missing/incorrect Runtime auth fails visibly; model discovery must return meterless/* before inference; usage/cost stays unknown when not reported. No invented billing, model IDs or sponsor success.
5. Server safety: loopback listener, same-origin state changes, bounded request body, allowlisted order/update IDs, no arbitrary SQL/file paths/credentials exposed. Unavailable sponsors are errors, never relabeled preview success.
6. UI: desktop1440x900/mobile390x844 render,0 horizontal page overflow, usable keyboard focus and working citations. Preview explicitly labelled. Actual source/model evidence required for A05/A06; preview passes never close them.

## Chosen design

Alternatives considered: native Node + faithful static Ledger port (selected); React/Vite component stack (adds packages/docs and build tooling without improving this single workspace); CLI-only prototype (cannot provide evidence-review workflow). Main selects the smallest complete first option under delegated authority. No new library/framework code; Node built-ins use current official documentation. Context7 requested for any future library work, currently unconnected.

Node24.19+, ES modules, built-in HTTP/fetch/test/fs/crypto, no npm runtime dependencies. Unmodified nine-file Apache2 Meterless Markovian reference pinned0aa7417ba5c826396d91e891328be78c45e6fbf6 vendored outside node_modules, native experimental-transform-types flag. Atomic file persistence owns durable app revision identity, vendor history is supplementary only. Source/LICENSE/provenance retained. No database migration.

Modes: live(default) uses actual Zetaris login-proxy retrieval plus Nightshift model discovery/inference; preview uses synthetic local evidence and deterministic policy, visibly excluded from live acceptance. Preview still runs the genuine Markovian executor. No silent fallback. Provider checks and failures shown in workspace. Real application data schema registration remains a live verification gate; no constant query can pass A05.

Evidence case shape: `{orderId,assessmentAt,records}`. Each record `{id,orderId,sourceId,recordId,version,kind,observedAt,effectiveAt,fields}`. Order fields explicitly include itemId and location; every record binds to that order. Stock item/location and supplier scope must match before arithmetic; missing/mismatched relationships are rejected. Kinds order/stock/supplier/fulfillment/receipt. `fields` holds orderedQuantity/promiseDate; quantity/location; quantity/eta/state/supersedes; fulfilledAt; or scope/returnedIds respectively. Absent facts remain absent. Different sourceId values never gain precedence from numeric version. Identity = sourceId+recordId+version; application fingerprints explicitly separate from sponsor metadata.

Assessment shape: `{status,causes,claims,uncertainty,options,draft}`. Status on-track/at-risk/undetermined. Claims `{text,evidenceIds}` with actual cited record IDs. Causes use the manifest's exact strings. Deterministic quantity/date/freshness policy is the validation authority. Live model returns only status, causes and a selected option ID from supported options; free-form unvalidated factual narrative is not published. One corrective model call permitted, then explicit uncertainty, no automatic approval.

Saved investigation shape: `{id,orderId,mode,revisions,currentRevisionId,approvals}`. Revision `{id,number,previousRevisionId,createdAt,assessmentAt,evidenceFingerprint,records,assessment,receipts,engine,provider,changedEvidenceIds}`. Approval `{id,revisionId,createdAt,invalidatedAt?}`. One canonical investigation per order+mode: re-investigation revises it, never leaves an older approval active in a parallel investigation. U10 requires an explicit recovery-evidence step and separately reviewable recovery revision before cancellation. Mutation lock is acquired after request-body parsing. Changed fingerprint invalidates current approval, retains historical approval; identical fingerprint returns existing revision. Updates are whitelisted synthetic source changes, never real business messages.

API: GET /api/status -> integrations; GET /api/orders -> `{orders:[{id,label}]}`; GET /api/investigations -> list; POST /api/investigate `{orderId,mode}` -> saved investigation; GET /api/investigations/:id -> investigation; POST /api/investigations/:id/approve `{revisionId}`; POST /api/investigations/:id/update `{updateId}`. Return `{error:{code,message}}` on failure. Unavailable live source cannot save a successful assessment.

Zetaris existing admin login server-side only, POST /api/auth/login, obtain actual token/orgId, POST /api/proxy/sql-editor/sqls/run-query with sql/limit and required headers. Tokens memory-only, fixed127.0.0.1 host, configurable validated UI port (default3300), redirects rejected. Port comes from explicit ZETARIS_UI_PORT or the vendor UI_PORT; verify its listener belongs to Zetaris before enabling credentials. Acceptance: one real local HTTP login/query roundtrip reaches the configured port; all five invalid port inputs fail before network access. No arbitrary hostname configuration or changes to unrelated local services. Fixed qualified source view query selected only after real schema registration. Native API key route not used. Nightshift token server-side only, fixed loopback8088/v1, real Bearer/meterless-app/meterless-scope, model discovery from actual Runtime. No unsigned app launch or security override.

## October23 source contract verification

October23 source contract verification: the shipped UI and a real scoped SELECT1 confirm POST `/api/proxy/sql-editor/sqls/run-query`, JSON `{sql,limit}`, immediate `{headers,data,total,timeUsed}`. This supersedes the earlier sql/start transport assumption. Source setup uses plain CREATE for the fixed order_evidence container and records view, never OR REPLACE or DROP. Acceptance:20/20 real retrieved payloads deep-equal the fixed fixtures, including immutable record versions; an existing-container conflict results in0 subsequent view writes. No source updates or automatic overwrite added by this setup task.

## October23 evaluation artifact scope

Verification before implementation: regenerated preview report retains20/20 completed Markovian runs,20/20 exact classifications and20/20 reference-coverage checks. It contains0 assertions about unrelated live/provider/Cursor execution, and explicitly lists all4 excluded evidence categories. Source must not import evaluator labels into product execution.

Implementation: replace the evaluator's stale hardcoded global statuses with an explicit notEvaluatedByThisRun list, preserve per-case results and update the console summary at its only executable call site. Non-goals: no product behavior, model integration, classification policy or acceptance thresholds changed by this repair.

## October23 live evaluation runner

Live evaluation runner: before implementation, require20 real Zetaris retrievals and20 completed Markovian investigations with validated Nightshift selections; target at least18/20 exact status/cause sets,20/20 immutable citation checks. Each failed request is recorded as failed, never replaced with preview evidence. Capture actual per-call model/usage/cost as reported, leaving absent values unknown. Persist a partial report after each case so interruption cannot become an implicit pass. Use an isolated temporary store, never the review workspace's saved investigations. No provider keys, prompts, credentials or raw error bodies in the report. Implementation reuses the existing live investigator, source and model adapter, with evaluator labels used only after execution. Non-goals: no policy changes, new provider, cloud spend or source writes.

## Governed-source demonstration update

Tests before implementation: the dedicated U01 demonstration helper accepts only the existing20-case synthetic view. Require count20 and deep-equal each payload against the fixed base fixtures (or the exact already-updated U01 state). Any extra/missing/drifted row yields0 writes. An exact retry yields0 writes. One allowed update preserves19 other payloads and all existing immutable records, adds the defined U01 version and verifies20/20 results after the write. Fixed SQL/view names, escaped literals; no DROP, arbitrary SQL, credentials or additional updates. Test these guards with the real helper export; actual20-query source verification remains mandatory separately.

Implementation: separate developer/demo CLI, reusing the actual Zetaris adapter and existing U01 fixture transformation. Read and verify the whole dedicated source before replacing its generated view; never change the setup command's plain-CREATE protection. This is the approved synthetic demonstration, not an ERP write or general source editor.

## Zetaris session expiry

Session-expiry repair, tests before implementation: real Zetaris login returns a JWT with a15-minute expiry. A fresh independent source read passes after the long-running workspace reports query400, consistent with its expired cached session. Two real local HTTP queries before expiry must use1 login; a query within30seconds of token expiry must obtain a second session before sending SQL, with0 expired-token SQL requests. Invalid/opaque JWT metadata must not prevent authentication; expiry parsing schedules refresh only, never establishes authorization. Implementation reads the actual token's numeric exp claim server-side, caches its time with the session, and refreshes ahead of expiry. No token logging, credential changes, new destinations or retry of source writes.

## Nightshift M1 request compatibility

Nightshift M1 request compatibility, tests before implementation: actual Runtime diagnostics show duplicated system-message injection on routed requests. A discovered concrete local model plus one user message produces a successful single-phase response with actual usage/cost/receipt, but the model wraps JSON in a Markdown fence and emits an unsupported options key. Accept only a complete plain JSON object or a single complete JSON fence; never extract JSON from arbitrary prose. Exact status/cause/option validation remains mandatory, including rejected unsupported keys. Request must use one user message, explicit three-key output schema, one supported non-null optionId, max_tokens256, streamfalse and the supported tier-split-off header. Only actual discovered meterless/* or webllm/* IDs accepted. Preserve safe actual receipt ID, reported routed model, local privacy path and finite nonnegative actual_usd cost as Nightshift-reported estimates, not independently verified bills. Verify one real app investigation before20-case evaluation. Non-goals: no vendor code patch, direct provider bypass, disabled authentication, cloud keys or softened domain validation.

## Stateless selection isolation

Stateless selection isolation, tests before implementation: vendor HMEM reads exact meterless-scope and injects similar previous answers. Shared user scope permits cross-order and cross-revision contamination. Every authenticated Runtime request must use a new server-generated order-evidence UUID namespace, including a correction attempt; two selections produce4distinct request scopes across discovery/completion, with0shared namespaces. Authorization/app policy remain unchanged. Actual S02/S04 fresh-scope diagnostics must pass before claiming the memory problem resolved. This changes memory context only, not domain validation, source data or acceptance thresholds.

## October24 inference deadline

Tests before implementation: retain38/38 native checks and the unchanged live acceptance criteria (20 real source/model/engine runs, >=18 exact classifications,20 citation checks,5 uncertainty requests). Preserve the failed8-case report. Runtime completed S08 with the supported answer after67.461seconds, but the65-second client deadline had already closed the connection. A fresh, unmodified80-second adapter run must validate the answer; the timed-out response remains a failure in its original report. Record every actual elapsed time, with no universal latency or independent billing claim.

Implementation: increase only the bounded completion-request deadline from65 to80seconds. Discovery remains8seconds, max_tokens remains256, and at most1 correction remains allowed. Non-goals: no retries of transport failures, validation changes, vendor patches, new models, cloud spend or altered acceptance thresholds.

Evaluation scratch retention: require0 explicit deletion operations in the live runner and preserve its isolated generated store for diagnosis. Keep all acceptance/report calculations unchanged. Implementation removes its terminal recursive cleanup and reports retention on the console; no user or workspace records are moved or replaced.

## Non-goals

No paid infrastructure, public deployment, ERP writes, real customer data, external supplier messages, automatic purchasing/approval, hidden reasoning, invented sponsor/credit/Cursor contribution, invented live evaluation, changed track or new features beyond the approved investigation.
