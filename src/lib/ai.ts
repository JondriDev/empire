/**
 * Empire AI Bridge — connects to LLM API (OpenRouter) via server proxy
 *
 * I am the AI. This is how every app in the Empire talks to me.
 * Defaults to DeepSeek V4 Flash — same model I'm running on.
 */

const AI_CONFIG_KEY = 'empire-ai-config'

export interface AIConfig {
  provider: 'openrouter' | 'openai' | 'custom'
  model: string
  apiKey: string
  baseUrl: string
  systemPrompt: string
  temperature: number
  maxTokens: number
}

const DEFAULT_CONFIG: AIConfig = {
  provider: 'openrouter',
  model: 'deepseek/deepseek-v4-flash',
  apiKey: '',
  baseUrl: 'https://openrouter.ai/api/v1',
  systemPrompt: `You are Hermes, the AI agent powering The Empire — Jondri's personal application suite. You run on an Android device via Termux with a Mac-themed XFCE desktop. Be concise, helpful, and slightly playful. You have full context of all 20 apps in the Empire and can help with any of them. When asked about data from another app, use the context provided.`,
  temperature: 0.7,
  maxTokens: 2048,
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface ChatOptions {
  temperature?: number
  maxTokens?: number
  signal?: AbortSignal
}

export function getConfig(): AIConfig {
  try {
    const raw = localStorage.getItem(AI_CONFIG_KEY)
    if (raw) return { ...DEFAULT_CONFIG, ...JSON.parse(raw) }
  } catch { /* ignore */ }
  return { ...DEFAULT_CONFIG }
}

export function saveConfig(config: Partial<AIConfig>): AIConfig {
  const current = getConfig()
  const updated = { ...current, ...config }
  localStorage.setItem(AI_CONFIG_KEY, JSON.stringify(updated))
  return updated
}

export function resetConfig(): AIConfig {
  localStorage.removeItem(AI_CONFIG_KEY)
  return { ...DEFAULT_CONFIG }
}

/** Stream a chat completion via the server proxy endpoint. */
export async function streamChat(
  messages: ChatMessage[],
  options: ChatOptions = {},
  onToken: (_token: string) => void,
  onDone?: () => void,
  onError?: (_err: Error) => void
): Promise<void> {
  const config = getConfig()
  const controller = new AbortController()
  const signal = options.signal || controller.signal

  try {
    const response = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages,
        model: config.model,
        temperature: options.temperature ?? config.temperature,
        maxTokens: options.maxTokens ?? config.maxTokens,
        systemPrompt: config.systemPrompt,
        ...(config.apiKey ? { apiKey: config.apiKey, baseUrl: config.baseUrl } : {}),
      }),
      signal,
    })

    if (!response.ok) {
      const text = await response.text()
      throw new Error(`AI API error (${response.status}): ${text}`)
    }

    const reader = response.body?.getReader()
    if (!reader) throw new Error('No response body')

    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6).trim()
          if (data === '[DONE]') continue
          try {
            const parsed = JSON.parse(data)
            const content = parsed.choices?.[0]?.delta?.content || ''
            if (content) onToken(content)
          } catch { /* skip malformed */ }
        }
      }
    }

    onDone?.()
  } catch (err: unknown) {
    if (err instanceof Error && err.name === 'AbortError') {
      onDone?.()
      return
    }
    onError?.(err instanceof Error ? err : new Error(String(err)))
  }
}

/** Non-streaming chat completion. Returns full response text. */
export async function chat(
  messages: ChatMessage[],
  options: ChatOptions = {}
): Promise<string> {
  return new Promise((resolve, reject) => {
    let result = ''
    streamChat(
      messages,
      options,
      (token) => { result += token },
      () => resolve(result),
      (err) => reject(err)
    )
  })
}

/** Build a context prompt from empire app data for AI awareness. */
export function buildEmpireContext(): string {
  try {
    const storeRaw = localStorage.getItem('empire-store')
    if (!storeRaw) return ''

    const store = JSON.parse(storeRaw)
    const state = store.state || store
    const parts: string[] = ['Current Empire state:']

    if (state.notes?.length) {
      parts.push(`\n📝 Notes (${state.notes.length}):`)
      state.notes.slice(0, 5).forEach((n: any) =>
        parts.push(`  - "${n.title}": ${(n.content || '').substring(0, 80)}`)
      )
    }

    if (state.events?.length) {
      parts.push(`\n📅 Upcoming events (${state.events.length}):`)
      state.events.slice(0, 3).forEach((e: any) =>
        parts.push(`  - ${e.title} on ${e.date} at ${e.time}`)
      )
    }

    if (state.learningItems?.length) {
      const mastered = state.learningItems.filter((l: any) => l.mastered).length
      parts.push(`\n🎓 Learning: ${state.learningItems.length} topics (${mastered} mastered)`)
    }

    if (state.messages?.length) {
      parts.push(`\n💬 Chat messages: ${state.messages.length}`)
    }

    return parts.join('\n')
  } catch {
    return ''
  }
}

export function getModelName(): string {
  const config = getConfig()
  return config.model
}

/** Check if AI is configured (has API key or uses server-side default) */
export function isConfigured(): boolean {
  return true // server-side has a fallback
}