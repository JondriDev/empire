# Empire QA — Visual + Smoke Report

**Generated:** 2026-06-27T23:05:00.528Z

**Result:** 28/28 rendered without crash, 0 failed.

> **PASS** = the app rendered with no uncaught JS exception / error boundary / blank screen.
> Network & console noise (failed external CDN fetches, backend API calls needing auth) is
> listed separately — expected in the offline cloud sandbox and **not** a render failure.

## QA verdict — green main `e0f8cb7` (EPIC-2 S4+S5)

**No runtime bugs found.** Build 🟢 (`tsc -b && vite build`, 5.5s) · vitest **112/112 🟢** (16 files) ·
eslint clean. Guards: SHELL-IS-STYLED ✅ (top-level `.empire-desktop{…position:fixed…}`, 0 `.hide-sm
.empire-desktop`) · REGISTRY-COVERAGE ✅ (all 27 registry apps in smoke list) · INBOUND-LANDS **3/3 ✅**
(calendar←editor, goals←notes, messages←ai-chat each show a "Received from …" chip + a prefilled control
off the live render).

**Routes rendering clean: 27/27 ✅** (28/28 incl. desktop shell).

### Epic-acceptance — EPIC-2 (Design-token violations 501 → 0) CONFIRMED MOVED
Two builder stages landed since the last QA (`181c81a`, token-violations 268):
- **S4** (`b645762`) — exempt `lib/registry.ts` (accent identity manifest) + de-hex Network canvas via
  `rgbCss`; claimed **268 → 221**.
- **S5** (`e0f8cb7`) — de-hex the entire ai-agent (Cakra) cluster + exempt `ai-agent/lib/providers.ts`;
  claimed **221 → 134**.

`node scripts/metrics.mjs` this run reports **134** → both stages **confirmed, no contradiction**
(net **268 → 134, −134**). Visual recolor is intentional (Tailwind→XENO) and **visually verified** in
the screenshots: the de-hexed ai-agent app (`app-ai-agent.png`) renders with signal/ember/abyss tokens,
and the Network canvas (`app-network.png`) renders the CORE mesh with dot colours matching its legend —
proof the `rgbCss` canvas recolor (S4) and the `cssVar`/`tint` sweep (S5) did not break rendering.

### Metric deltas (vs last QA snapshot `181c81a`)
| Metric | Last QA | This run | Δ |
|---|---|---|---|
| Token violations | 268 | **134** | **−134** ✅ (EPIC-2 target metric) |
| Routes rendering clean | 27/27 | 27/27 | ±0 |
| Both-ways organism wiring | 9/9 | 9/9 | ±0 (EPIC-1 held) |
| vitest tests | 107 | 112 | +5 (S4 `nodeColors.test.ts`) |
| Test files | 15 | 16 | +1 |
| Bundle gz (KB) | 248.3 | 248.1 | −0.2 |

Top remaining offenders (next EPIC-2 stage S6): `artifacts/ColorPalette.tsx` (23 — decide exempt-vs-migrate),
`components/ui/Toast.tsx` (16 — migrate), `artifacts/ChartBuilder.tsx` (15), `Kanban.tsx` (13),
`FormBuilder.tsx` (9).

**Env-expected net noise (not bugs):** files `/api/files?path=/storage/emulated/0` → HTTP 500 (Android-only
path), datacenter `/api/dc/tables` → HTTP 401 (authed API, no headless session).

| App | Render | Uncaught JS / crash | Network / console notes |
|---|---|---|---|
| desktop | ✅ | — | — |
| calculator | ✅ | — | — |
| calendar | ✅ | — | — |
| clock | ✅ | — | — |
| weather | ✅ | — | — |
| grammar | ✅ | — | — |
| language | ✅ | — | — |
| music | ✅ | — | — |
| video | ✅ | — | — |
| files | ✅ | — | /api/files?path=%2Fstorage%2Femulated%2F0 → HTTP 500 |
| cache | ✅ | — | — |
| browser | ✅ | — | — |
| editor | ✅ | — | — |
| notes | ✅ | — | — |
| photos | ✅ | — | — |
| datacenter | ✅ | — | /api/dc/tables → HTTP 401 |
| maps | ✅ | — | — |
| messages | ✅ | — | — |
| prompt-generator | ✅ | — | — |
| token-counter | ✅ | — | — |
| learning-tracker | ✅ | — | — |
| ai-agent | ✅ | — | — |
| ai-chat | ✅ | — | — |
| goals | ✅ | — | — |
| hermes-cc | ✅ | — | — |
| artifacts | ✅ | — | — |
| network | ✅ | — | — |
| inbox | ✅ | — | — |

## Inbound-lands guard (organism emit↔receive loop)

Each entity receiver was seeded with a cross-app payload + reloaded; PASS = a "Received from <source>" chip rendered AND a control was prefilled.

| Receiver | From | Chip | Prefilled | Result |
|---|---|---|---|---|
| calendar | editor | ✅ | ✅ | ✅ |
| goals | notes | ✅ | ✅ | ✅ |
| messages | ai-chat | ✅ | ✅ | ✅ |

## Screenshots

See PNGs in this folder. `desktop.png` is the shell; `app-<id>.png` is each app route.
