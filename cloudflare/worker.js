/**
 * Cakra Proxy — Cloudflare Worker
 * ================================
 * Browsers can't call NVIDIA NIM directly (no CORS), so the live web/desktop
 * PWA routes Cakra's AI through this tiny Worker. It:
 *   - holds your NIM key as a Cloudflare *secret* (never exposed in the browser)
 *   - adds the CORS headers a browser needs
 *   - speaks the Empire's existing `/api/ai/chat` contract (so NO app rewrite),
 *     and also passes through `/v1/*` for the dedicated Cakra Agent.
 *
 * Deploy (see README.md): `npx wrangler deploy` then
 * `npx wrangler secret put NIM_API_KEY`. Paste the printed *.workers.dev URL
 * into The Empire → Cakra Agent → Settings → "Backend server".
 */

const NIM_BASE = 'https://integrate.api.nvidia.com/v1'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
}

const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  })

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS })

    const url = new URL(request.url)
    const key = env.NIM_API_KEY

    // Health probe — makes "Save & test" in Cakra Settings go green.
    if (url.pathname === '/api/health') return json({ ok: true, proxy: 'cakra', hasKey: Boolean(key) })

    // Empire bridge contract: { messages, model, systemPrompt, temperature, maxTokens }.
    if (url.pathname === '/api/ai/chat' && request.method === 'POST') {
      let body
      try {
        body = await request.json()
      } catch {
        return json({ error: 'Invalid JSON' }, 400)
      }
      const {
        messages = [],
        model = 'deepseek-ai/deepseek-v4-flash',
        systemPrompt,
        temperature = 0.7,
        maxTokens = 2048,
        apiKey,
        baseUrl,
      } = body

      const useKey = apiKey || key
      if (!useKey) return json({ error: 'No NIM key — run: wrangler secret put NIM_API_KEY' }, 500)

      // Never send the server's own NIM key to a client-supplied host (key exfiltration).
      // A custom baseUrl is only honored when the caller brings its own apiKey.
      const base = (apiKey && baseUrl ? baseUrl : NIM_BASE).replace(/\/+$/, '')
      const nimMessages = systemPrompt ? [{ role: 'system', content: systemPrompt }, ...messages] : messages

      const upstream = await fetch(`${base}/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${useKey}` },
        body: JSON.stringify({
          model,
          messages: nimMessages,
          temperature,
          max_tokens: maxTokens,
          stream: true,
        }),
      })

      if (!upstream.ok) {
        const txt = await upstream.text()
        return json({ error: `NIM ${upstream.status}: ${txt.slice(0, 500)}` }, upstream.status)
      }

      // Stream NIM's SSE straight through — ai.ts already parses this format.
      return new Response(upstream.body, {
        status: 200,
        headers: { ...CORS, 'Content-Type': 'text/event-stream; charset=utf-8', 'Cache-Control': 'no-cache' },
      })
    }

    // Generic passthrough for the dedicated Cakra Agent (OpenAI-style /v1/*).
    if (url.pathname.startsWith('/v1/')) {
      const headers = new Headers(request.headers)
      headers.delete('host')
      headers.delete('origin')
      if (!headers.get('Authorization') && key) headers.set('Authorization', `Bearer ${key}`)
      const upstream = await fetch(`https://integrate.api.nvidia.com${url.pathname}${url.search}`, {
        method: request.method,
        headers,
        body: request.method === 'GET' || request.method === 'HEAD' ? undefined : request.body,
      })
      const out = new Headers(upstream.headers)
      for (const [k, v] of Object.entries(CORS)) out.set(k, v)
      return new Response(upstream.body, { status: upstream.status, headers: out })
    }

    return json({ error: 'Cakra proxy: not found', paths: ['/api/health', '/api/ai/chat', '/v1/*'] }, 404)
  },
}
