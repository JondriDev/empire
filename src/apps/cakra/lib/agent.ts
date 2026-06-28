/**
 * Empire Agent — Agentic Loop
 * Think → Act → Observe → Respond
 *
 * Manages multi-step agentic interactions with tool calls,
 * user confirmations, and streaming responses.
 */

import type {
  Message,
  ChatMessage,
  ToolCall,
  ToolCallRequest,
  ToolResult,
  ProviderId,
  AgentPhase,
  ThinkingStep,
  ToolName,
} from './types'
import { getProvider } from './providers'
import { TOOL_LIST, isDangerousTool } from './tools'
import { executeTool, executeToolsParallel, formatToolResult } from './toolExecutor'
import { buildEmpireContext } from '../../../lib/ai'

// ─── Settings ────────────────────────────────────────────────────────────────

const SETTINGS_KEY = 'empire-agent-settings'

export interface AgentSettings {
  providers: Partial<Record<ProviderId, { apiKey: string; model: string; enabled: boolean }>>
  activeProvider: ProviderId
  autoConfirmDangerous: boolean
  showThinking: boolean
  maxTokens: number
  temperature: number
  // Cakra Auto — orchestrate across the whole NIM pool instead of one model
  orchestrate?: boolean
}

export function getSettings(): AgentSettings {
  const defaults: AgentSettings = {
    providers: {
      openrouter: { apiKey: '', model: 'meta-llama/llama-3.1-8b-instruct', enabled: true },
      groq: { apiKey: '', model: 'llama-3.3-70b-versatile', enabled: true },
      google: { apiKey: '', model: 'gemini-2.0-flash', enabled: true },
      together: { apiKey: '', model: 'meta-llama/Llama-3-70b-chat-hf', enabled: true },
      nvidia: { apiKey: '', model: 'nvidia/llama-3.1-nemotron-70b-instruct', enabled: true },
    },
    activeProvider: 'openrouter',
    autoConfirmDangerous: false,
    showThinking: false,
    maxTokens: 4096,
    temperature: 0.7,
    orchestrate: false,
  }
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      return { ...defaults, ...parsed }
    }
  } catch { /* ignore */ }
  return defaults
}

export function saveSettings(settings: Partial<AgentSettings>): AgentSettings {
  const current = getSettings()
  const updated = { ...current, ...settings }
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated))
  return updated
}

// ─── System Prompt ──────────────────────────────────────────────────────────

function buildSystemPrompt(_settings: AgentSettings): string {
  const toolsDesc = TOOL_LIST.map(t =>
    `- **${t.name}** (${t.category}${t.dangerous ? ', DANGEROUS' : ''}): ${t.description}`
  ).join('\n')

  return `You are **Cakra** — Jondri's AI that can *act* in the real world, not just chat.

You run on an Android/Termux device as part of The Empire app suite — a web-desktop OS with ~25 apps.

## Your Abilities

You have access to these tools. Use them whenever a task requires information or actions beyond conversation:

${toolsDesc}

## How to Use Tools

When you need to use a tool, respond with a JSON tool_call block (not as plain text). The format:

\`\`\`json
{"tool_calls": [{"id": "call_abc123", "name": "file_read", "arguments": {"path": "/storage/emulated/0/Documents/notes.txt"}}]}
\`\`\`

After I show you the tool result, you can decide the next step — call more tools or give your final response.

## Guidelines

- **Be purposeful** — only call tools when they genuinely help answer the user's question
- **Confirm dangerous actions** — if a tool is dangerous and auto-confirm is off, ask the user before calling it
- **Handle errors** — if a tool fails, acknowledge the error and try an alternative approach
- **Be concise** — don't call 5 tools when 1 would do
- **Respect paths** — all file paths resolve within /storage/emulated/0 (Android shared storage)
- **Show your reasoning** — briefly explain what you're about to do and why

## Important

- If the user asks to do something you can't do with available tools, say so honestly
- Never make up tool results — if you don't know, say so
- When searching the web, use the query terms the user provided
- For code execution, prefer the language the user specified, or Python if unspecified

## Live Empire Context

This is the current state across the user's apps — use it to ground answers about their data and to decide actions:

${buildEmpireContext() || '(no app context captured yet)'}`
}

// ─── Tool Call Extraction ─────────────────────────────────────────────────────

/** Extract tool calls from a chat completion delta */
function extractToolCalls(delta: Record<string, unknown>): ToolCall[] {
  const calls: ToolCall[] = []

  // OpenAI format
  const openaiCalls = delta.tool_calls as Array<{ index?: number; id?: string; type?: string; function?: { name?: string; arguments?: string } }> | undefined
  if (openaiCalls && Array.isArray(openaiCalls)) {
    for (const call of openaiCalls) {
      if (call.function?.name) {
        calls.push({
          id: call.id || `call_${Math.random().toString(36).slice(2, 9)}`,
          name: call.function.name,
          arguments: call.function.arguments
            ? JSON.parse(call.function.arguments)
            : {},
        })
      }
    }
  }

  return calls
}

// ─── Main Agent Loop ─────────────────────────────────────────────────────────

export interface AgentCallbacks {
  onPhaseChange: (_phase: AgentPhase) => void
  onThinking: (_step: ThinkingStep) => void
  onToken: (_token: string) => void
  onToolStart?: (_call: ToolCall) => void
  onToolCall: (_call: ToolCall, _result: ToolResult) => void
  onConfirmNeeded: (_calls: ToolCall[]) => void
  onDone: () => void
  onError: (_err: Error) => void
}

/**
 * Run a single agentic turn: send messages → stream response →
 * detect tool calls → execute tools → feed results back → stream final
 */
export async function runAgentTurn(
  messages: Message[],
  settings: AgentSettings,
  callbacks: AgentCallbacks
): Promise<void> {
  const provider = getProvider(settings.activeProvider)
  const providerSettings = settings.providers[settings.activeProvider]

  if (!providerSettings?.apiKey && settings.activeProvider !== 'google') {
    callbacks.onError(new Error(`No API key configured for ${provider.name}. Add one in Settings.`))
    return
  }

  const model = providerSettings?.model || provider.models[0]?.id
  if (!model) {
    callbacks.onError(new Error(`No model selected for ${provider.name}`))
    return
  }

  callbacks.onPhaseChange('thinking')

  const systemPrompt = buildSystemPrompt(settings)
  const toolSchemas = TOOL_LIST.map(t => ({
    type: 'function' as const,
    function: {
      name: t.name,
      description: t.description,
      parameters: t.schema,
    },
  }))

  // Build messages for provider
  const openaiMessages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    ...messages.filter(m => m.role !== 'system').map(m => {
      if (m.role === 'tool') {
        return { role: 'tool' as const, content: m.content, tool_call_id: m.toolCallId }
      }
      return { role: m.role as 'user' | 'assistant', content: m.content }
    }),
  ]

  // ─── Streaming call ────────────────────────────────────────────────────────
  try {
    const response = await fetch(`${provider.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${providerSettings?.apiKey ?? ''}`,
        ...(settings.activeProvider === 'openrouter' ? {
          'HTTP-Referer': 'http://localhost:3001',
          'X-Title': 'Cakra',
        } : {}),
      },
      body: JSON.stringify({
        model,
        messages: openaiMessages,
        tools: toolSchemas,
        tool_choice: 'auto',
        temperature: settings.temperature,
        max_tokens: settings.maxTokens,
        stream: true,
      }),
      signal: AbortSignal.timeout(120_000),
    })

    if (!response.ok) {
      const text = await response.text()
      callbacks.onError(new Error(`${provider.name} error (${response.status}): ${text}`))
      return
    }

    const reader = response.body?.getReader()
    if (!reader) {
      callbacks.onError(new Error('No response body'))
      return
    }

    const toolCallsAccumulated: Record<string, ToolCall> = {}
    let buffer = ''
    const decoder = new TextDecoder()
    let finalContent = ''
    let pendingToolCalls: ToolCall[] = []

    // ─── Step 1: Stream and collect tool calls ────────────────────────────────
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
          const parsed = JSON.parse(data)
          const delta = parsed.choices?.[0]?.delta || {}

          // Handle content tokens
          if (delta.content) {
            callbacks.onToken(delta.content)
            finalContent += delta.content
          }

          // Handle tool calls
          const calls = extractToolCalls(delta)
          for (const call of calls) {
            if (!toolCallsAccumulated[call.id]) {
              toolCallsAccumulated[call.id] = call
              pendingToolCalls = [...Object.values(toolCallsAccumulated)]
              callbacks.onPhaseChange('tool_calls')
            }
          }
        } catch { /* skip */ }
      }
    }

    // ─── Step 2: Filter dangerous tool calls needing confirmation ─────────────
    const confirmedCalls: ToolCall[] = []
    const needsConfirm: ToolCall[] = []

    for (const call of pendingToolCalls) {
      if (isDangerousTool(call.name as ToolName) && !settings.autoConfirmDangerous) {
        needsConfirm.push(call)
      } else {
        confirmedCalls.push(call)
      }
    }

    if (needsConfirm.length > 0) {
      callbacks.onConfirmNeeded(needsConfirm)
      // Wait for user confirmation — caller must call executePendingTools
      return
    }

    // ─── Step 3: Execute all confirmed tool calls ──────────────────────────────
    if (confirmedCalls.length > 0) {
      callbacks.onPhaseChange('tool_results')

      // Announce + execute each tool individually so the Workspace panel can
      // show every action live (started → result), instead of running silently.
      const results: Record<string, ToolResult> = {}
      await Promise.all(confirmedCalls.map(async (c) => {
        callbacks.onToolStart?.(c)
        const result = await executeTool({ tool: c.name as ToolName, params: c.arguments, callId: c.id })
        results[c.id] = result
        callbacks.onToolCall(c, result)
      }))

      // Feed tool results back to the model for final response
      const toolResultMessages: ChatMessage[] = confirmedCalls.map(c => ({
        role: 'tool' as const,
        content: formatToolResult(results[c.id]),
        tool_call_id: c.id,
      }))

      // Add tool results as assistant termination message
      const updatedMessages: ChatMessage[] = [
        ...openaiMessages,
        { role: 'assistant', content: finalContent, tool_calls: confirmedCalls.map(c => ({
          id: c.id,
          type: 'function',
          function: { name: c.name, arguments: JSON.stringify(c.arguments) },
        })) },
        ...toolResultMessages,
      ]

      // ─── Step 4: Stream final response with tool results ──────────────────
      callbacks.onPhaseChange('responding')

      const finalResponse = await fetch(`${provider.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${providerSettings?.apiKey ?? ''}`,
        },
        body: JSON.stringify({
          model,
          messages: updatedMessages,
          tools: toolSchemas,
          tool_choice: 'auto',
          temperature: settings.temperature,
          max_tokens: settings.maxTokens,
          stream: true,
        }),
        signal: AbortSignal.timeout(120_000),
      })

      if (!finalResponse.ok) {
        callbacks.onError(new Error(`${provider.name} error on tool result: ${finalResponse.status}`))
        return
      }

      const finalReader = finalResponse.body?.getReader()
      if (finalReader) {
        let fBuffer = ''
        const fDecoder = new TextDecoder()
        while (true) {
          const { done, value: fValue } = await finalReader.read()
          if (done) break
          fBuffer += fDecoder.decode(fValue, { stream: true })
          const fLines = fBuffer.split('\n')
          fBuffer = fLines.pop() || ''
          for (const line of fLines) {
            if (!line.startsWith('data: ')) continue
            const fData = line.slice(6).trim()
            if (fData === '[DONE]') continue
            try {
              const fParsed = JSON.parse(fData)
              const fContent = fParsed.choices?.[0]?.delta?.content || ''
              if (fContent) callbacks.onToken(fContent)
            } catch { /* skip */ }
          }
        }
      }
    }

    callbacks.onDone()
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      callbacks.onError(new Error('Request timed out after 120s'))
    } else {
      callbacks.onError(err instanceof Error ? err : new Error(String(err)))
    }
  }
}

/**
 * Execute tool calls that were pending user confirmation
 * Call this after user approves dangerous tool calls
 */
export async function executePendingToolCalls(
  pendingCalls: ToolCall[],
  messagesSoFar: ChatMessage[],
  settings: AgentSettings,
  callbacks: AgentCallbacks
): Promise<void> {
  callbacks.onPhaseChange('tool_results')

  const toolRequests: ToolCallRequest[] = pendingCalls.map(c => ({
    tool: c.name as ToolName,
    params: c.arguments,
    callId: c.id,
  }))

  pendingCalls.forEach(c => callbacks.onToolStart?.(c))
  const results = await executeToolsParallel(toolRequests)

  // Notify of each result
  for (const call of pendingCalls) {
    callbacks.onToolCall(call, results[call.id])
  }

  callbacks.onDone()
}