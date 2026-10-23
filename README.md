# Order Evidence

A local synthetic wholesaler order investigator for **The Agent That Can Explain Why**, Open Agent Hackathon2026.

Working first build: inspect a promise, inventory and supplier evidence; investigate with the genuine Meterless Markovian executor; inspect cited source versions; approve a draft; apply a supplier update and see the earlier approval invalidated. Nothing sends messages, purchases stock or changes real orders.

## Current verification

- 27/27 native tests passed on Node24.19.0. Tests include20exact classifications,5uncertainty cases,10supplier updates, idempotency, two process restarts, HTTP revision/approval safety, source-scope rejection and source setup checks.
- Separate preview evaluation:20/20 genuine Markovian runs completed;20/20 classifications match sealed evaluator labels;20/20 outputs reference existing immutable evidence records. Reference existence is not an independent semantic citation audit.
- Real browser check: investigate order003, inspect citation, record an automated preview draft approval, apply U01, observe on-track revision2 and invalidated historical approval. Keyboard traversal works; desktop1440x900 and mobile390x844 have0 horizontal overflow. Mobile citation opens supplier v2.
- Real Zetaris source setup and retrieval passed October23:20/20 registered payloads deep-equal the fixed synthetic cases. An actual duplicate-container CREATE returned HTTP400. See [source receipts](docs/evidence/zetaris-source-oct23.json).
- Genuine Cursor desktop agent authored the U07 HTTP regression using included access. Dedicated test1/1, Cursor's then-current suite25/25, independently checked current suite27/27. Codex operated the desktop; no manual participant authorship claimed. See [provenance](docs/CURSOR_PROVENANCE_OCT23.md). Organizer announcement October22 confirms no free Cursor credits are offered and Cursor is optional; no paid upgrade purchased.
- **Live end-to-end acceptance has not passed.** Nightshift's official M1 build failed macOS execution assessment and remains unlaunched. No real model response, token billing or model latency measured. This build is not submission-ready.

## Run

Node24.19+ in the24LTS series. No package installation required. The official vendored engine contains TypeScript parameter properties, requiring Node's experimental transform flag.

```sh
npm start
```

Open `http://127.0.0.1:4317`. The server listens on loopback only. Choose **Offline preview** to exercise the available workflow. Live remains the default and fails visibly when access is unavailable. No silent fallback.

```sh
npm test
node --experimental-transform-types scripts/evaluate.mjs
npm run check:live
```

`check:live` exits1 until both actual source retrieval and authenticated Nightshift route discovery work. It does not claim that discovery proves inference. Evaluation labels live under `evaluation/ground-truth.json`, never served to the investigator. Preview results are under `evaluation/results/preview.json`.

## Demo workflow

1. Choose Order003, Offline preview, Investigate. Status is at risk because confirmed arrival is later than the promise.
2. Open a cited source. Inspect source identity, version, observation/effective times and its actual fields.
3. Approve the draft. Approval applies only to that immutable revision.
4. Apply U01. Supplier version2 arrives before the promise. Revision2 is on track; revision1approval stays in history and becomes invalidated.
5. Re-investigate. The canonical order/mode investigation and changed evidence are retained; no duplicate revision is created.

Order020 exposes a separate recovery-evidence step before U10 cancellation, allowing the recovery revision to be reviewed and approved first. All dates are an explicitly fixed synthetic business clock, distinct from actual request/save timestamps.

## Private live configuration

Copy `.env.example` to private `.env`, never commit it. Configure either the existing Zetaris account values or a private `ZETARIS_PLATFORM_ENV_FILE` path to the vendor distribution's existing `.env`. The app reads its admin email/password server-side, obtains a memory-only token and actual orgId, then uses the documented local UI proxy. It does not create an API key. No credentials are returned to the browser.

Nightshift requires its **Console Runtime token**, separate from the NVIDIA provider credential. The app discovers actual `meterless/*` routes, then requests a bounded JSON selection. Unsupported selections get at most one correction. Provider usage is retained only if actually reported; price and underlying concrete model remain unknown until independently verified.

Endpoints use loopback only: Zetaris UI port defaults to3300, Nightshift8088. Set the vendor's `UI_PORT`, `GUI_URL` and `ALLOWED_ORIGINS` consistently; the app reads `UI_PORT` from the private vendor file, with optional `ZETARIS_UI_PORT` override. Verify the selected listener belongs to Zetaris before enabling credentials. No arbitrary network destinations, SQL or file paths accepted through HTTP. Source view is `order_evidence.records`, holding one `order_id,payload` row per synthetic case. Current UI proxy uses POST `/api/proxy/sql-editor/sqls/run-query`, body `{sql,limit}`, response `{headers,data,total,timeUsed}`. Real source registration and parsing passed20/20 October23.

On a fresh, configured Zetaris installation, `npm run seed:zetaris` creates the fixed synthetic container/view and verifies all20 returned payloads. Plain CREATE only: an existing container stops setup before view writes. This is intentionally not an overwrite or repair command. The local instance is already seeded; do not rerun setup there. It does not implement live source updates or prove a Nightshift investigation.

## Architecture

```mermaid
flowchart LR
  UI[Evidence workspace] --> API[Loopback Node server]
  API --> M[Official Markovian executor]
  M --> Z[Live Zetaris source / labelled preview]
  Z --> P[Quantity/date/scope policy]
  P --> N[Live Nightshift bounded selection]
  N --> V[Validation, at most one correction]
  V --> S[Atomic revision and approval store]
  P -->|preview only| S
  S --> UI
```

Markovian drives retrieval and assessment callbacks, with explicit completed-state checks. Application state uses atomic file replacement and immutable identities; the reference engine's history is not treated as a durable business database. Concurrent mutation requests are serialized. File permissions restrict persisted data; `.env` and `data/` are ignored.

## Imported components and attribution

- Unmodified Meterless Markovian reference, commit`0aa7417ba5c826396d91e891328be78c45e6fbf6`, nine source files, Apache2.0, predates the build window. License and source hashes in `vendor/meterless/`.
- UI adapts static Ledger layout structures from the participant's existing design-demos, disclosed in `docs/UI_PROVENANCE.md`. No pre-event app/business logic imported from that design reference.
- Local Geist fonts from Google Fonts, SIL Open Font License files under `public/fonts/`.
- Node built-ins only, no runtime npm dependencies. New app code authored during the eligible build window using Codex, with a bounded genuine Cursor-agent regression-test contribution October23. Runtime model use remains outstanding, see `metadata.json`.

## Remaining before submission

Resolve Nightshift distribution/access and run a real model feature; record actual provider/model/usage/cost; execute live A01–A06, including changed evidence from the real governed source; record1–4minute video and finalize the8-slide draft deck from verified results; review final entry and submit. No public deployment has been made.

Submission preparation October23: HackOS draft saved with description/repository link, a3:01 narrated screenshot walkthrough and eight-slide draft deck. Uploaded media links persist and play/download correctly. Draft is not submitted. Repository remains private; judge access and Nightshift/live proof remain open. See [current status](docs/BUILD_STATUS_OCT23.md) and [media receipt](docs/evidence/submission-media-oct23.json).
