# Cursor U07 task, completed October23

Status: COMPLETED through the installed Cursor3.27.6 desktop agent. Cursor authored `test/cursor-u07.test.mjs`, passed its single test1/1 and then-current suite25/25. Codex independently verified1/1 and current27/27 after source-setup tests landed. Prompt below was prepared in Codex before execution; actual contribution and limits are recorded in [provenance](CURSOR_PROVENANCE_OCT23.md).

Open this repository in the existing Cursor desktop account. Use available free/included usage only. Do not upgrade, publish, deploy or read private configuration. Record the actual tool/model/version, UTC start/end, diff and test result. Keep Cursor and Codex contributions distinct.

## Prompt

Create only `test/cursor-u07.test.mjs`. Other agents are working in this repository; preserve their changes. Read `test/http.test.mjs`, `src/server.mjs`, `src/fixtures.mjs` and `src/store.mjs` for the existing contracts. Use Node built-ins, no package installation.

Write one meaningful HTTP regression for SYN-ORD-13 in explicitly labelled preview mode. Start a real loopback HTTP server from createApp with an isolated temporary Store, and close/clean up in finally. Use no external credentials or network provider. Investigate the initial missing-supplier case, approve that exact revision, then apply U07 through the existing API.

Acceptance: 1/1 scenario passes. Result has exactly two linked revisions, current status `on-track`, zero causes and an invalidated approval of the previous revision. Available stock2 plus confirmed supplier8 covers ordered10. Supplier ETA October26 precedes October27 promise. Prior absence receipt remains in evidence history; current claims cite the new supplier version1; no supplier version0 exists. Assert actual persisted revision/evidence objects, not invented response fields. Never change implementation to force the test to pass without reporting a real defect.

Review the generated diff, then run the single file and full suite using the project's Node24 runtime and experimental-transform-types flag. Report measured results and any defect. This is preview behavior proof, not live Zetaris/Nightshift acceptance. Preserve genuine Cursor session/diff evidence; no attribution trailer alone counts as development proof.

Main handles final Git commit/push after review.
