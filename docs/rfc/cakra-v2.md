# RFC — Cakra v2 (Multimodal AI Core)

**Status:** Draft v0 · **Author:** Hermes (AI stream) · **Date:** 2026-07-06
**Target release:** Empire v1.1 · **Sequence:** after security gate ✅

---

## Problem

Empire's Cakra is text-only via `/api/ai/chat` → NVIDIA/OpenRouter proxy. The skill
catalog (venice, fal, replicate, sora, openai image gen, audio/music, video) brings
9 multimodal backends we could plug in — but today there is **one façade missing**: a
unified `Cakra.invoke({ modality, provider, payload })` API that lets any Empire app
ask for image / audio / video / code from any provider, with cost & cache management.

## Goal

Add a single typed Core on the server, registry of provider adapters, and a frontend
`useCakra()` hook so every AI-enabled app gains multimodal with ~0 code change.

---

## Backend shape

```
server.js
  ├── adapters/
  │   ├── fal.js          · image / video / audio (fal.ai)
  │   ├── venice.js       · image / audio / speech / video
  │   ├── replicate.js    · 1000+ models dispatcher
  │   ├── openai.js       · dall-e, tts, whisper, sora endpoints
  │   └── local-gguf.js   · llama.cpp HTTP subprocess (optional)
  ├── cakraCore.js        · provider router, cost ledger, queue
  └── routes
      POST /api/cakra/invoke        · { modality, provider, payload }
      GET  /api/cakra/cost          · per-user / per-day ledger
      GET  /api/cakra/health        · provider availability
```

**Contract types** (sketch):
```ts
type Modality = 'text' | 'image' | 'audio' | 'video' | 'embed';
type Provider = 'fal' | 'venice' | 'replicate' | 'openai' | 'local-gguf' | 'auto';
interface InvokeRequest {
  modality: Modality;
  provider?: Provider;       // 'auto' = cheapest healthy provider
  payload: ProviderPayload;  // typed per provider
  userId: string;            // resolved from JWT
  cacheKey?: string;         // dedupe identical calls
}
interface InvokeResponse { ok: true; kind: Modality; url?: string; text?: string; bytes?: number; costUsd: number; provider: Provider; cached: boolean; }
```

**Cost ledger:** every call writes a row to `cakra_calls` (per-user, per-provider,
per-day) so we can show a `CostDashboard` in Empire UI later.

**Provider auto-router** heurstics:
1. if `EMPIRE_LOCAL_MODEL` set + modality=text → local GGUF (free, offline)
2. else if `FAL_KEY` set + modality=image → fal
3. else if `VENICE_KEY` set + modality=text/image → venice
4. else → replicate → openai (cost-sorted tie-break)

## Frontend shape

```tsx
// src/lib/useCakra.ts
const { invoke, cost, providers } = useCakra();
const img = await invoke({ modality: 'image', payload: { prompt, n: 1 } });
```

Apps adopting: Browser (hero banners), Notes (cover art), Reader (illustrations),
Artifacts (chart thumbnails), Music (cover), Photos (enhance), Data Center (chart
thumbnails). Every existing AI-enabled app gets a new tab/modal.

## Sequenced landing (atomic PRs)

| PR | Scope | Time |
|---|---|---|
| **A1** | `cakraCore.js` skeleton + `/api/cakra/invoke` text pass-through, OpenAI-compatible | small |
| **A2** | `adapters/fal.js` → live image-gen in `Browser` hero (1 provider, 1 place) | small |
| **A3** | Cost ledger table + `costDashboard` SDK | small |
| **A4** | `adapters/venice.js` → audio/speech routes | medium |
| **A5** | `adapters/replicate.js` dispatcher | medium |
| **A6** | `adapters/local-gguf.js` + Llama.cpp spawn | medium-hard |
| **A7** | in-app LoRA training (fal-train / unsloth) → Data Center tile | hard |
| **A8** | full CakraModal in every AI app | medium |

## Security posture

- All `/api/cakra/*` routes require `authMiddleware` (already enforced pattern)
- Per-user rate limit (60/min default)
- Provider keys come from env, never from client
- `safePath` not relevant (no filesystem writes)
- Cost cap per user/day set in `settings`; reject at edge when exceeded

## Open questions

- Are provider keys sourced from the device's `.env`, or per-user in Data Center?
  (Decision: env first, per-user second; emit warnings if user keys present.)
- How do we cap spend when user has zero `settings` row? Default → 5 USD/day.

