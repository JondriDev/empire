# Bug Ledger — the Bug Hunter's working memory

Owner: the **Bug Hunter** routine (3×/day). Other routines drop LOGIC-bug leads
here (UX-polish leads go to `docs/UX-LEDGER.md` instead). Every entry is one
line. Fixed entries keep the commit hash + one-line root cause.

**Lens rotation** (the Hunter records which lens each run used; next lens first):
A QA-runtime-findings → B fresh-commit-review → C static-sweeps →
D characterization → E runtime-logic-probes

- Lens used 2026-07-16 (run 2): **cleared the OPEN backlog** — both confirmed leads from the run-1 static sweeps (Lens C/B) are now FIXED with regression locks (Calendar today-UTC; message-mirror `from` drop). No fresh lens run this pass; the OPEN queue is now empty.
- Next lens: **D (characterization over a core rail — e.g. `sync.ts reconcile` edge cases, `graph.ts` link/unlink).**

## OPEN (confirmed, has a repro, not yet fixed)

_(empty — both prior OPEN leads landed 2026-07-16; see FIXED below.)_

## SUSPECTED (no deterministic repro yet / needs on-device confirmation)

- **`formatBytes` emits "… undefined" for sizes ≥ 1 TB** — `Photos.tsx`/`Files.tsx` `sizes` array stops at `GB`, so `sizes[4]` is undefined for `bytes ≥ 1024⁴`. Verified in isolation (`formatBytes(1024**4)` → `"1 undefined"`) but a 1 TB+ in-browser blob is not a realistic PWA input → low priority; add `'TB'` (and clamp `i`) when convenient.

## FIXED (commit + root cause, newest first)

- 2026-07-16 · **`message` graph mirror dropped `data.from` (lineage parity gap)** (cleared OPEN lead, commit `b6866af`). Root cause: the `message` central mirror set only `{sender, content}` while note/learning propagate `...(x.from !== undefined ? { from: x.from } : {})` — so an inbound-handoff message showed its `<LineageTrail>` in the Messages UI (reads `msg.from`) yet dropped lineage in Network/Timeline/Search node views and in `relatedTo`'s `areLinked`. Fix: propagate `from` in the message mirror to match. Locked by two regression tests (`from` propagated; omitted cleanly when the message has none).
- 2026-07-16 · **Calendar highlighted "today" cell + default event date landed a day off for negative-offset users** (cleared OPEN lead, commit `ecdbc7f`). Root cause: `today`/`todayStr` were `new Date().toISOString().split('T')[0]` (UTC day) while grid cells, `getEventsForDay` and `formatDate` all use LOCAL Y/M/D — for any negative-offset user in the evening (US-Pacific 22:00 Jul 15 → UTC Jul 16) the wrong cell lit up and the New-Event prefill/side-panel header disagreed with the events shown. Fix: reuse the canonical local-day `dayStamp(Date.now())` (deleting the divergent UTC reimplementation, same class as `related.ts` `ea2aef2` / weather `1d4c1aa`). Locked by a TZ-forced (America/Los_Angeles) regression crossing the UTC-midnight boundary. Sibling cosmetic UTC-display sites remain internally-consistent + low-impact (learning-tracker date/nextReview, goals deadline/createdAt, `appActions.ts:142`, `sync.ts:196`, clock alarm→calendar mirror date) — logged, not touched.
- 2026-07-16 · **ChartBuilder line chart crashed + Min showed Infinity after deleting all data points** (Lens C date sweep, commit `535ef50`). Root cause: `removeRow` had no floor, so `data` could go empty; the line renderer read `points[points.length-1][0]` on `[]` (TypeError → error boundary) and Min rendered `Math.min()` === Infinity. Fix: floor `removeRow` at 1 datum (+ disable the control there). Locked by a regression test that switches to the line chart and removes every row.
- 2026-07-16 · **Opening a collection-owning app pruned its OWN persisted graph nodes** (Lens C async/mirror sweep, commit `2c1668d`). Root cause: Goals/Calendar/Crypto/Mail/PromptGenerator/Photos mirrored into the Core graph in a `[data]` effect but loaded that data AFTER first render (mount-effect setState, or async IDB for Photos), so the first mirror ran with `[]` and `reconcile` deleted every node of the type — scrubbing cross-app edges/`data.from` lineage — then re-added them with fresh ids on every open. Fix: hydrate synchronously (lazy `useState` initializer; Photos gates its mirror behind the existing `hydratedRef`). Also migrate-in-place hardening: Calendar defaults `tags: []`/`color` for legacy events that crashed `e.tags.length`. Locked by 6 render regression tests (id-stability + edge survival, all fail-before/pass-after).
- 2026-07-16 · **Weather forecast weekday labels shifted a day for Western-Hemisphere users** (Lens C date sweep, commit `1d4c1aa`). Root cause: `dayLabel` parsed Open-Meteo's date-only `daily.time` string with `new Date(iso)` (UTC midnight) then rendered the weekday with `toLocaleDateString` (local) — off-by-one for any negative-offset user (Fri→Thu). Fix: build a LOCAL Date from the parsed Y/M/D parts. Locked by a TZ-forced (America/Los_Angeles) regression case crossing the UTC boundary.

- 2026-07-15 · `relatedTo` `same-day` signal fired by UTC day, not the user's local day (Lens B, fresh commit `fbb04f1`). Root cause: `related.ts` reimplemented a private `dayKey` as `new Date(ms).toISOString().slice(0,10)` (UTC) while its own doc-comment said "Local-calendar day bucket" — for any non-UTC user this false-positives entities just after local midnight and false-negatives entities just after UTC midnight. Fix: deleted the divergent helper, reused the canonical local-day `dayStamp` from `bridge.ts` (the ONE local-day format, matches Calendar's `data.date`). Locked by two TZ-forced (`Asia/Jakarta`) regression tests in `related.test.ts` that cross the UTC-midnight boundary (fail-before / pass-after verified).
