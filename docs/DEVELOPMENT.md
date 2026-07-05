# Development guide

How to work on The Empire locally. For the product overview see the
[README](../README.md); for shipping builds see [PACKAGING.md](./PACKAGING.md).

## Setup

```bash
git clone https://github.com/JondriDev/empire.git
cd empire
npm install        # Node 20+ (.nvmrc)
npm run dev        # Vite dev server
```

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Vite dev server with HMR |
| `npm run build` | `tsc -b && vite build` — type-check + production bundle |
| `npm run preview` | Serve the production build locally |
| `npm test` / `npx vitest run` | Unit + audit test suite |
| `npm run lint` | ESLint |
| `npm run server` | Optional local backend (`server.js`, binds `127.0.0.1:3001`) |

## Quality gates

Every commit must keep all six gates green — CI (`verify.yml`) enforces them on
PRs, and the autonomous fleet self-enforces them on direct pushes:

| Gate | Command | Guards |
|---|---|---|
| Build | `npm run build` | Types + bundle |
| Tests | `npx vitest run` | Unit tests + script audits (`scripts/*.test.mjs`) |
| Lint | `npx eslint .` | Code style, react-hooks/refresh rules |
| Shell CSS | `node scripts/check-shell-styled.mjs` | Built CSS keeps the full-screen shell contract |
| Route parity | `node scripts/check-route-parity.mjs` | `registry.ts` ↔ `appComponents.tsx` agree both ways |
| Conformance | `node scripts/metrics.mjs --assert-zero` | Design-token ratchet: raw colors/utilities stay at 0 |

`node scripts/metrics.mjs` (without the flag) prints the full fitness field —
bundle size, conformance counts, organism wiring — and updates `docs/metrics.json`.

## Adding a new app

1. Create `src/apps/your-app/YourApp.tsx`.
2. Add an entry to the `apps` list in `src/lib/registry.ts`:

   ```ts
   // `icon` is a key into the alien SVG set (src/design-system/icons) or a
   // lucide name; `color` is an accent from the Earth-from-Space palette.
   { id: 'my-app', name: 'My App', icon: 'Star', route: '/app/my-app',
     description: 'One line', color: '#5b8fb9', cakraEnabled: false }
   ```

3. Map id → component in `src/lib/appComponents.tsx` (lazy-loaded).
4. Add the app id to the smoke-test list in `scripts/qa-smoke.mjs`
   (REGISTRY-COVERAGE is a hard cross-check — the guard fails otherwise).
5. Join the organism (optional, ~3 lines): `mirrorCollection(...)` in a
   `useEffect` + a `<NodeActions type="…" sourceId={id}/>` bar so the app's
   entities appear in the Network graph.

Merged/hidden apps: set `hidden: true` and `aliasOf: { appId, tab }` to keep a
legacy route deep-linking into a tab of another app (see Code Editor → Cakra).

## Event bus

Apps communicate via a central event bus (`src/lib/eventBus`):

```ts
import { emit } from './lib/eventBus'

emit({ type: 'NOTE_CREATED', noteId: '123', title: 'My Note' })

eventBus.on('NOTE_CREATED', (data) => {
  console.log('New note:', data)
})
```

Cross-app handoffs emit `HANDOFF{fromId,toId}` arcs that the Network app
renders live; mirrored entities become nodes in the shared graph.

## Local backend (optional)

`server.js` is an Express 5 + WebSocket backend for self-hosted setups (file
access, auth, AI proxy). The deployed PWA does not use it — on the live site,
Cakra's chat routes through a serverless proxy instead.

- Configuration: [`.env.example`](../.env.example) (`EMPIRE_*` variables; all optional).
- Hardened defaults: binds `127.0.0.1`, CORS allowlist, agent shell/code/file
  tools disabled (403) unless `EMPIRE_ENABLE_DANGEROUS_TOOLS=1`, random
  one-time admin PIN printed on first run, JWT secret auto-generated and
  persisted to `data/.jwt-secret` (gitignored). See [SECURITY.md](../SECURITY.md).

### WebSocket API

```js
const ws = new WebSocket('ws://localhost:3001/ws')

ws.onmessage = (event) => {
  const data = JSON.parse(event.data)
  console.log('Received:', data)
}

ws.send(JSON.stringify({ type: 'SUBSCRIBE', channel: 'all' }))
```

## Coexisting with the autonomous fleet

A fleet of cloud routines commits directly to `main` around the clock
(builder, QA, strategist, and more — see [routines/](./routines/README.md)).
Practical consequences:

- **Always branch off a fresh `origin/main`** and rebase before pushing;
  `main` moves every few hours.
- Expect rebase conflicts in the prepend-anchored docs
  (`docs/CONTEXT.md`, `docs/ROUTINE-LOG.md`, `docs/metrics.json`) — take both
  entries newest-first; `docs/metrics.json` is generated, so take `main`'s
  side and regenerate with `node scripts/metrics.mjs` after building.
- Never commit binary/image artifacts; QA screenshots are gitignored by design.
