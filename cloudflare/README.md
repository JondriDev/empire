# Cakra Proxy (Cloudflare Worker) — optional alternative

> **You don't need this.** The live app already ships with a hosted proxy (a
> Supabase Edge Function, wired as Cakra's default in `src/lib/apiBase.ts`), so
> Cakra answers on https://jondridev.github.io/empire/ with **zero setup** —
> just enter your NVIDIA NIM key in **Cakra Agent → Settings**. This Cloudflare
> Worker is kept only as a self-hosted alternative if you'd rather run your own
> proxy; paste its URL into the same **Backend server** field to override.

Browsers can't call NVIDIA NIM directly — NIM sends no CORS headers, so the live
web/desktop PWA gets blocked. This tiny Worker fixes that: it holds your NIM key
as a Cloudflare **secret**, adds CORS, and speaks The Empire's existing
`/api/ai/chat` contract — so **no app code changes** are needed. You just paste
the Worker URL into Cakra's Settings.

> The **Android APK** doesn't need this — native HTTP isn't subject to browser
> CORS, so the APK calls NIM directly. This proxy is only for the **web** and
> **desktop (installable PWA)** versions.

## Deploy (one time, ~2 minutes)

From this `cloudflare/` folder:

```bash
cd cloudflare
npx wrangler login                 # opens browser, authorize Cloudflare (free account is fine)
npx wrangler deploy                # prints your URL: https://cakra-proxy.<you>.workers.dev
npx wrangler secret put NIM_API_KEY   # paste your NVIDIA NIM key (nvapi-...), press Enter
```

That's it. Test it:

```bash
curl https://cakra-proxy.<you>.workers.dev/api/health
# -> {"ok":true,"proxy":"cakra","hasKey":true}
```

`hasKey:true` confirms the secret is set.

## Point The Empire at it

1. Open the live app: https://jondridev.github.io/empire/
2. Go to **Cakra Agent → Settings**.
3. In **Backend server**, paste your Worker URL (`https://cakra-proxy.<you>.workers.dev`).
4. Save. Cakra now answers on the live web + installed desktop PWA. 🎉

## What it exposes

| Path            | Purpose                                                              |
|-----------------|---------------------------------------------------------------------|
| `/api/health`   | Health probe — makes Settings "Save & test" go green.               |
| `/api/ai/chat`  | Empire bridge contract; streams NIM's SSE straight through to Cakra.|
| `/v1/*`         | OpenAI-style passthrough for the dedicated Cakra Agent app.          |

The key never reaches the browser — it lives only in the Worker secret. To
rotate it, re-run `npx wrangler secret put NIM_API_KEY`.
