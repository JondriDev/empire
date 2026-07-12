/**
 * Cakra Auto — multi-model orchestration on the server-proxied chat path.
 *
 * The tool-calling `AgentSurface`/`orchestrator.ts` call NVIDIA NIM *directly*
 * from the browser, which NIM blocks (no CORS) and which needs a client-side
 * key. This module instead drives the same NIM pool through the Empire proxy
 * (`/api/ai/chat` → server.js/Supabase), so it works in any browser with only
 * the server-side `.env` key — no CORS, no second key to paste.
 *
 * Routing:
 *   simple ask   → one frontier model, streamed (with its reasoning trace)
 *   hard problem → Thinker (plan) → Answerer (frontier, streamed), so a
 *                  different model plans the approach before the answer is written.
 *
 * Every call pins an explicit `model`, overriding the per-task router in ai.ts.
 */

import { chat, streamChat, type ChatMessage } from '../../../lib/ai'
import { NIM_DEFAULT_ROLES, lastUserText } from '../../../lib/cakra'

export interface AutoCallbacks {
  /** Answer tokens for the user. */
  onToken: (_token: string) => void
  /** Reasoning / orchestration trace (chain-of-thought + milestones). */
  onThinking: (_text: string) => void
  onDone?: () => void
  onError?: (_err: Error) => void
}

const CODE_RE =
  /```|\b(code|coding|function|method|bug|fix|error|refactor|compile|regex|api|endpoint|component|typescript|javascript|python|rust|css|html|sql|algorithm)\b/i
const HARD_RE =
  /\b(why|prove|derive|design|architect(?:ure)?|optimi[sz]e|analy[sz]e|explain how|step[- ]by[- ]step|plan|strategy|compare|trade[- ]?offs?|debug|reason|root cause)\b/i

/** A task is "hard" (worth a multi-model pass) if it's long or reasoning-shaped. */
export function isHardTask(text: string): boolean {
  return text.length > 240 || HARD_RE.test(text || '')
}

const shortName = (id: string) => id.split('/').pop() || id

/** Split the incoming messages into the shared system prompt + conversation. */
function splitMessages(messages: ChatMessage[]): { system: string; convo: ChatMessage[] } {
  const system = messages.find(m => m.role === 'system')?.content ?? ''
  const convo = messages.filter(m => m.role !== 'system')
  return { system, convo }
}

/**
 * Run one Cakra Auto turn. `messages` is the full array the chat surface would
 * otherwise stream (system + history + latest user).
 */
export async function runAutoChat(
  messages: ChatMessage[],
  cb: AutoCallbacks,
  signal?: AbortSignal,
): Promise<void> {
  const task = lastUserText(messages)
  const { system, convo } = splitMessages(messages)

  try {
    // ── Simple ask → one frontier model, streamed with its reasoning trace ──
    if (!isHardTask(task)) {
      await streamChat(
        messages,
        { model: NIM_DEFAULT_ROLES.fast, signal },
        cb.onToken,
        cb.onDone,
        cb.onError,
        cb.onThinking,
      )
      return
    }

    // ── Hard problem → Thinker → Answerer ──
    const thinkerModel = CODE_RE.test(task) ? NIM_DEFAULT_ROLES.code : NIM_DEFAULT_ROLES.plan
    const answerModel = NIM_DEFAULT_ROLES.longContext // minimax-m3, the frontier default

    cb.onThinking(`🧭 Cakra Auto — routing a hard task through a multi-model pass.\n`)
    cb.onThinking(`🧠 Thinker (${shortName(thinkerModel)}) — planning the approach…\n`)

    const plan = await chat(
      [
        {
          role: 'system',
          content:
            `${system}\n\nYou are the Thinker. Do NOT answer the user yet. Lay out a concise, ` +
            `concrete plan another model will follow to answer: key steps, facts to use, and pitfalls.`,
        },
        ...convo,
      ],
      { model: thinkerModel, maxTokens: 1400, temperature: 0.4, signal },
    )

    cb.onThinking(`🧠 Plan ready:\n${plan}\n\n`)
    cb.onThinking(`🛠️ Answerer (${shortName(answerModel)}) — writing the final answer…\n`)

    await streamChat(
      [
        {
          role: 'system',
          content:
            `${system}\n\nFollow this plan to fully and correctly answer the user. ` +
            `Output only the answer — no meta commentary about the plan.\n\n=== PLAN ===\n${plan}`,
        },
        ...convo,
      ],
      { model: answerModel, signal },
      cb.onToken,
      cb.onDone,
      cb.onError,
      cb.onThinking,
    )
  } catch (err) {
    cb.onError?.(err instanceof Error ? err : new Error(String(err)))
  }
}
