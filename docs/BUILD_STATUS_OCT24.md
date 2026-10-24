# Order Evidence, October 24, 2026

Working local build with genuine Zetaris, Nightshift and Meterless Markovian execution. The real U01 source-change and linked-revision demonstration passed. The full live evaluation failed. Final video/deck uploads are verified in the saved HackOS draft; final submission remains pending. Earlier dated status documents are historical snapshots.

## Verified product behavior

- 38/38 native tests passed on Node 24.19.0. The separately labelled preview evaluation completed 20/20 genuine Markovian runs and exact classifications, including 5 designated uncertainty cases. Native checks cover 10 update scenarios and two process restarts.
- October 23 real Zetaris registration/retrieval verified all 20 base payloads against the fixed synthetic cases. An actual duplicate-container control returned HTTP 400. [Source evidence](evidence/zetaris-source-oct23.json).
- October 24 U01 performed one guarded write to the dedicated synthetic view, then verified all 20 post-write payloads with 20 retrieval receipts. The other 19 orders and existing record versions were preserved. [Source-update evidence](evidence/zetaris-u01-oct24.json).
- Re-investigating the same live Order 003 investigation produced linked on-track revision 2. The original three records are unchanged; supplier v2 adds October 25 arrival. The previous automated demonstration approval was invalidated at 09:39:02 UTC; current revision 2 remains unapproved. Markovian completed in 31.617 seconds with one validated Nightshift call, 783 reported tokens and reported USD 0. This is one live update demonstration, separate from baseline matrix coverage. [Live U01 evidence](evidence/live-u01-oct24.json).
- Desktop/mobile citations and keyboard use were checked. The preview layouts had 0 horizontal overflow at 1440×900 and 390×844. Real live UI verification showed revision 2, supplier v2 and historical approval invalidation.

## Failed full live evaluation

Phase order: the campaign and failed continuation below used the fixed base source before U01. The current dedicated source contains the later U01 change, where Order 003 is on track. Unchanged baseline labels describe the earlier source phase and must not be compared blindly with the updated view. No full post-U01 matrix rerun was performed; historical reports remain unchanged.

The October 24 campaign validated 17/20 distinct cases: exact status/cause sets, actual source retrieval, validated model selection, completed Markovian execution and existing immutable record references. All 5 designated uncertainty cases passed. Record-reference checks do not establish an independent semantic citation audit.

There were 19 attempts. S18 first failed with Nightshift HTTP 503 `engine_reloaded`. After a normal application Quit/relaunch and warmup, an explicit manual continuation attempted S18 again and timed out after 101.079 seconds without a returned model response. S19–S20 were not run. The original batch and continuation remain failed; functional coverage and uninterrupted-run pass flags are both false. The product has no automatic transport retry. [Campaign evidence](evidence/live-campaign-oct24.json), [original report](../evaluation/results/live.json), [continuation report](../evaluation/results/live-continuation-oct24.json), [Runtime failure evidence](evidence/nightshift-engine-reload-oct24.json).

The 17 successful returned model calls reported 12,940 tokens and USD 0. Failed-call usage/cost is unknown. Successful campaign investigation latency ranged 7.0–82.0 seconds. These totals exclude the separate U01 demonstration and earlier diagnostics. Runtime-reported cost is not independently verified billing or an electricity estimate.

| Participant acceptance target | Current evidence |
| --- | --- |
| A01: 20 real cases, at least 18 exact, 20 citation checks | Failed: 17 exact completed cases and reference checks; full matrix incomplete. |
| A02: 5 missing/conflict requests | Passed for all 5 designated live uncertainty cases. |
| A03: 10 update scenarios | Native/preview checks passed; only U01 demonstrated live. Full live update acceptance remains incomplete. |
| A04: 2 process restarts preserve state | Passed in native checks. |
| A05: actual source, model and engine in one investigation | Passed in representative S03 and the separate U01 revision. |
| A06: representative browser timing and reported accounting | S03 browser result observed within 31.873 seconds, an upper bound from a separate measurement. Its representative investigation took 23.374 seconds and reported 769 tokens/USD 0. No universal timing or independent billing claim. |

## Runtime and provenance

Official Nightshift M1-M4 0.92.1 uses the discovered concrete `webllm/Qwen2.5-1.5B-Instruct-q4f16_1-MLC` model through authenticated loopback Runtime. Completion requests use a fresh UUID memory scope, `max_price: 0`, at most 256 output tokens and an 80-second deadline, with at most one correction. Discovery is bounded to 8 seconds. Domain validation and acceptance thresholds remain unchanged. No cloud keys, paid upgrade or NVIDIA inference is claimed.

The unchanged Apache 2.0 Markovian reference is pinned and attributed. Codex authored the application with a genuine Cursor desktop-agent U07 regression contribution. Cursor's historical 25/25 and independently checked October 23 27/27 suites are distinct from the current 38/38 suite. The organizer confirmed Cursor was optional and offered no free event credits. Public repository anonymous access is verified. Existing static layout and Geist font imports are disclosed in README and provenance files.

## Submission state

HackOS remains a saved draft, with 0/1 final submissions. The final [narrated screenshot walkthrough](https://iframe.mediadelivery.net/embed/778121/7ef4784a-f77f-4a4f-9c61-5bc78281de22) and [eight-slide deck](https://hackathon-server.genai.works/api/v1/cdn/proxy/hackathon/2405b06a26524e549e104b062607c3da.pptx) persisted after save and reload. The October 23 preview upload receipt is historical.

The eight-slide deck `order-evidence-final-oct23.pptx` uses October 24 facts despite the filename. Export size is 61,438 bytes, SHA256 `e7e933ec0b96549da31701f00154aa5c3c73b79481a3b52f85bd93975106910d`. Eight slides re-imported with zero integrity/layout findings; Geist fonts and the source image were preserved. Visual review covered slides 5 and 8.

The final narrated screenshot walkthrough `order-evidence-live-oct24.mp4` shows actual live UI, U01 revision history and prior automated demonstration approval invalidation. It is not continuous screen recording. Local duration is 193.584333 seconds; size is 5,070,012 bytes; SHA256 is `018d203a31589f74958d7bf1d445463b32caada75deb350947acf999e90f0386`. Encoding is H.264 1920×1080 at 24 fps, AAC 48 kHz mono. All eight encoded scenes were visually reviewed and U01 was legible. Decode completed with zero errors. Audio checks were automated (mean -19.4 dB, peak -0.9 dB); human listening was not performed. [Media evidence](evidence/final-media-oct24.json) records local checks separately from remote verification.

Remote video playback advanced to 27.17729 seconds, with duration 193.564 seconds, 1920×1080, readyState 4 and no player error; it was paused after verification. The deck download returned HTTP 200, 61,438 bytes and an exact SHA256 match to the local export. Both final uploads were still present after saving and reloading the draft.

`SUBMISSION_DESCRIPTION_DRAFT.txt` is local copy and does not itself update HackOS. Final submission has not been sent. No public deployment or customer-data use has occurred.
