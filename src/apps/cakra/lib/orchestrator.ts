/**
 * Cakra Orchestrator — "multi-agent system as a model", NIM-only
 *
 * Inspired by Sakana Fugu. Instead of the user hand-picking one model, Cakra
 * routes every turn across the whole NVIDIA NIM pool:
 *
 *   simple / tool task  →  one well-matched NIM model (fast, cheap)
 *   hard reasoning task →  TRINITY pass across several NIM models:
 *                          Thinker → Worker → Verifier → Synthesize
 *
 * The single-model + tool path reuses the existing agentic loop (runAgentTurn),
 * so all tool-calling, confirmation and Workspace machinery still works. Only
 * the multi-agent reasoning path is implemented here from raw NIM calls.
 */

import type { Message, ChatMessage } from './types'
import type { AgentSettings, AgentCallbacks } from './agent'
import { runAgentTurn } from './agent'
import { ARTIFACT_SYSTEM_PROMPT } from './artifactProtocol'
import { getProvider, pickNimByRole } from './providers'

// A model id that's confirmed-good in this stack — used as the fallback when a
// routed model id 404s against the live NIM catalog.
const SAFE_MODEL = 'deepseek-ai/deepseek-v4-flash'

const NIM_BASE = getProvider('nvidia').baseUrl

type TaskType = 'code' | 'reasoning' | 'general'
type Difficulty = 'simple' | 'hard'

interface TaskPlan {
  type: TaskType
  difficulty: Difficulty
  needsTools: boolean
}

const shortName = (id: string) => id.split('/').pop() || id

/** Last user message text in the history */
function lastUserText(messages: Message[]): string {
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === 'user') return messages[i].content
  }
  return ''
}

/** Conversation as plain chat turns (drop tool/system messages) */
function toConvo(messages: Message[]): ChatMessage[] {
  return messages
    .filter(m => m.role === 'user' || m.role === 'assistant')
    .map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }))
}

// ─── Raw NIM call ──────────────────────────────────────────────────────────────

interface NimOpts {
  apiKey: string
  model: string
  messages: ChatMessage[]
  temperature?: number
  maxTokens?: number
  signal?: AbortSignal
  onToken?: (_t: string) => void   // when set → stream tokens as they arrive
}

/** One NIM chat completion. Returns the full text; streams via onToken if given. */
async function nimChat(opts: NimOpts): Promise<string> {
  const res = await fetch(`${NIM_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${opts.apiKey}`,
    },
    body: JSON.stringify({
      model: opts.model,
      messages: opts.messages,
      temperature: opts.temperature ?? 0.7,
      max_tokens: opts.maxTokens ?? 4096,
      stream: !!opts.onToken,
    }),
    signal: opts.signal ?? AbortSignal.timeout(120_000),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`NIM ${opts.model} (${res.status}): ${text.slice(0, 200)}`)
  }

  // Non-streaming
  if (!opts.onToken) {
    const json = await res.json()
    return json.choices?.[0]?.message?.content ?? ''
  }

  // Streaming (SSE)
  const reader = res.body?.getReader()
  if (!reader) throw new Error('No response body')
  const decoder = new TextDecoder()
  let buffer = ''
  let full = ''
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() || ''
    for (const line of lines) {
      if (!line.startsWith('data: ')) continue
      const data = line.slice(6).trim()
      if (data === '[DONE]') continue
      try {
        const token = JSON.parse(data).choices?.[0]?.delta?.content || ''
        if (token) { full += token; opts.onToken(token) }
      } catch { /* skip malformed */ }
    }
  }
  return full
}

/** nimChat that retries once with the safe model if the routed model fails */
async function nimChatSafe(opts: NimOpts): Promise<string> {
  try {
    return await nimChat(opts)
  } catch (err) {
    if (opts.model === SAFE_MODEL) throw err
    return nimChat({ ...opts, model: SAFE_MODEL })
  }
}

// ─── Step 1: Router — classify the task ──────────────────────────────────────────

const CLASSIFY_PROMPT = `You are Cakra's router. Classify the user's latest request for model routing.
Reply with ONLY a compact JSON object, no prose:
{"type":"code|reasoning|general","difficulty":"simple|hard","needsTools":true|false}
- type: "code" for programming, "reasoning" for math/logic/analysis/multi-step thinking, else "general".
- difficulty: "hard" only if it genuinely needs deep multi-step thinking; quick factual/chatty asks are "simple".
- needsTools: true if it requires reading/writing files, running shell/code, or searching the web.`

/** Heuristic fallback if the classifier model misbehaves */
function heuristicPlan(text: string): TaskPlan {
  const t = text.toLowerCase()
  const tools = /\b(file|read|write|run|execute|shell|terminal|search the web|fetch|\.py|\.js|\.txt|directory|folder)\b/.test(t)
  const code = /\b(code|function|bug|error|compile|refactor|api|regex|python|javascript|typescript|css|html|sql)\b/.test(t)
  const hard = text.length > 240 || /\b(why|prove|derive|design|architect|optimi[sz]e|analy[sz]e|explain how|step by step|plan)\b/.test(t)
  return {
    type: code ? 'code' : hard ? 'reasoning' : 'general',
    difficulty: hard ? 'hard' : 'simple',
    needsTools: tools,
  }
}

async function classify(messages: Message[], apiKey: string): Promise<TaskPlan> {
  const router = pickNimByRole('router')?.id ?? SAFE_MODEL
  const userText = lastUserText(messages)
  try {
    const raw = await nimChat({
      apiKey,
      model: router,
      messages: [
        { role: 'system', content: CLASSIFY_PROMPT },
        { role: 'user', content: userText.slice(0, 2000) },
      ],
      temperature: 0,
      maxTokens: 60,
    })
    const match = raw.match(/\{[\s\S]*\}/)
    if (match) {
      const p = JSON.parse(match[0])
      return {
        type: ['code', 'reasoning', 'general'].includes(p.type) ? p.type : 'general',
        difficulty: p.difficulty === 'hard' ? 'hard' : 'simple',
        needsTools: !!p.needsTools,
      }
    }
  } catch { /* fall through to heuristic */ }
  return heuristicPlan(userText)
}

/** Best single NIM model for a (non-multi-agent) task */
function pickWorkerModel(plan: TaskPlan): string {
  const role = plan.type === 'code' ? 'code' : plan.type === 'reasoning' ? 'agentic' : 'chat'
  return pickNimByRole(role)?.id ?? pickNimByRole('agentic')?.id ?? SAFE_MODEL
}

// ─── Main entry ─────────────────────────────────────────────────────────────────

export async function runOrchestratedTurn(
  messages: Message[],
  settings: AgentSettings,
  callbacks: AgentCallbacks,
): Promise<void> {
  const nim = settings.providers.nvidia
  const apiKey = nim?.apiKey ?? ''
  if (!apiKey) {
    callbacks.onError(new Error('Cakra Auto needs an NVIDIA NIM API key — add it under Nvidia NIM in Settings.'))
    return
  }

  const maxTokens = settings.maxTokens
  let n = 0
  const think = (text: string) =>
    callbacks.onThinking({ step: ++n, text, timestamp: Date.now() })

  callbacks.onPhaseChange('thinking')
  think('🧭 Cakra router — classifying task…')

  let plan: TaskPlan
  try {
    plan = await classify(messages, apiKey)
  } catch (err) {
    callbacks.onError(err instanceof Error ? err : new Error(String(err)))
    return
  }
  think(`🧭 Routed → ${plan.type} · ${plan.difficulty}${plan.needsTools ? ' · tools' : ''}`)

  // ── Path A: simple OR needs tools → one model via the existing agentic loop ──
  // (tool-calling, confirmations and the Workspace panel all keep working)
  if (plan.difficulty === 'simple' || plan.needsTools) {
    const model = pickWorkerModel(plan)
    think(`⚡ Delegating to ${shortName(model)} (single model)`)
    const workerSettings: AgentSettings = {
      ...settings,
      orchestrate: false,
      activeProvider: 'nvidia',
      providers: {
        ...settings.providers,
        nvidia: { apiKey, model, enabled: true },
      },
    }
    await runAgentTurn(messages, workerSettings, callbacks)
    return
  }

  // ── Path B: hard reasoning → TRINITY: Thinker → Worker → Verifier → Synthesize ──
  const convo = toConvo(messages)
  const task = lastUserText(messages)

  const thinkerId = pickNimByRole('reasoning')?.id ?? SAFE_MODEL
  const workerId = pickNimByRole('agentic')?.id ?? pickWorkerModel(plan)
  const verifierId = pickNimByRole('verifier', [workerId])?.id
    ?? pickNimByRole('reasoning', [thinkerId])?.id
    ?? SAFE_MODEL

  // 1) Thinker — devise an approach
  think(`🧠 Thinker (${shortName(thinkerId)}) — planning the approach…`)
  const planText = await nimChatSafe({
    apiKey, model: thinkerId, temperature: 0.4, maxTokens,
    messages: [
      { role: 'system', content: 'You are the Thinker. Do NOT answer the user yet. Lay out a concise, concrete plan/approach (key steps, facts to use, pitfalls) another model will follow to answer.' },
      ...convo,
    ],
  })
  think('🧠 Plan ready')

  // 2) Worker — produce a draft following the plan
  think(`🛠️ Worker (${shortName(workerId)}) — drafting the answer…`)
  const draft = await nimChatSafe({
    apiKey, model: workerId, temperature: settings.temperature, maxTokens,
    messages: [
      { role: 'system', content: `You are the Worker. Follow this plan to fully answer the user.${ARTIFACT_SYSTEM_PROMPT}\n\n=== PLAN ===\n${planText}` },
      ...convo,
    ],
  })
  think('🛠️ Draft ready')

  // 3) Verifier — a *different* model checks the draft
  think(`🔍 Verifier (${shortName(verifierId)}) — checking the draft…`)
  const verdict = await nimChatSafe({
    apiKey, model: verifierId, temperature: 0, maxTokens: 800,
    messages: [
      { role: 'system', content: 'You are the Verifier. Critically check the draft answer against the task for errors, gaps, or wrong claims. If it is fully correct and complete, reply exactly "OK". Otherwise list the specific problems to fix.' },
      { role: 'user', content: `TASK:\n${task}\n\nDRAFT:\n${draft}` },
    ],
  })
  const verified = /^\s*ok\b/i.test(verdict)
  think(verified ? '🔍 Verified ✓' : '🔍 Issues found — synthesizing a fix')

  // 4) Synthesize — stream the final answer to the user
  callbacks.onPhaseChange('responding')
  if (verified) {
    // Draft is good — stream it out as-is (no extra model call).
    callbacks.onToken(draft)
  } else {
    await nimChatSafe({
      apiKey, model: workerId, temperature: settings.temperature, maxTokens,
      onToken: callbacks.onToken,
      messages: [
        { role: 'system', content: `You are the Synthesizer. Produce the final, corrected answer for the user. Apply the verifier feedback. Output only the answer — no meta commentary.${ARTIFACT_SYSTEM_PROMPT}` },
        { role: 'user', content: `TASK:\n${task}\n\nDRAFT:\n${draft}\n\nVERIFIER FEEDBACK:\n${verdict}` },
      ],
    })
  }

  callbacks.onDone()
}
