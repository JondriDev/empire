# Routine 3 — Visual & Smoke QA

- **Trigger ID:** `trig_0135fY5VNK37f98voe3m91oo`
- **Schedule:** every 5h
- **Writes:** `docs/screenshots/latest/` (screenshots + `REPORT.md`), `docs/ROUTINE-LOG.md`, and its own smoke harness `scripts/qa-smoke.mjs`

## Current prompt

⟨paste live prompt here⟩

## Responsibilities (observed from PR/log evidence)

Builds `main`, renders the desktop shell + every registry app route in headless
Chromium, screenshots each, and reports pass/fail (render = no uncaught JS /
error boundary / blank screen). Separates real bugs from env-expected noise
(blocked CDNs, authed/Android-only API calls). Opens a docs-only `routine/auto-*`
PR with the refreshed report.

**Highest-value routine this week.** It is the only routine that renders the UI
in-cloud, and it caught what green builds hid:
- #10 — the **desktop shell rendering fully unstyled** (a `design-system.css`
  comment typo `--text*/` / `--holo-*/` closed the CSS comment early, corrupting
  the `.empire-*` cascade). Critical, build-green-but-broken.
- #12 — the orphaned **`/app/goals`** route (wired in `appComponents.tsx`,
  missing from `registry.ts`) **and** fixed its own harness: the crash regex
  matched only "App not available" (Window.tsx) and silently passed "App not
  found" (AppShell.tsx), so prior runs false-passed `goals`.

## Health (2026-06-21)

🟢 **Healthy + high value**, but two recurring inefficiencies → **prompt change
proposed this run** (see PR). (a) The headless-render setup is rediscovered every
run: #4 downloaded Playwright fine, #6 hit `cdn.playwright.dev` 403 and worked
around via `@sparticuz/chromium`, #10/#12 used the pre-installed
`/opt/pw-browsers/chromium-1194` via `executablePath`. Bake the known-good recipe
into the prompt. (b) A green build hid a critical shell break (#10); the
suggested "assert the shell is actually styled" smoke guard was recommended ≥3×
but never added — QA owns `qa-smoke.mjs`, so it should add it.

## Changelog

- **2026-06-21** — File scaffolded (first Optimizer run). **Proposed** (PR
  `meta/improve-2026-06-21`): bake the headless-Chromium render recipe into the
  prompt + add a "shell-is-styled" assertion to `qa-smoke.mjs`. _Pending human apply._
