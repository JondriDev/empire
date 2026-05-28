/**
 * Empire Agent — Tool Executor
 * Executes tools via the backend server API
 */

import type { ToolCallRequest, ToolResult, ToolName } from './types'

const SERVER = '' // Use relative URL (same origin, served by Empire backend)

/**
 * Execute a tool call via the server API
 */
export async function executeTool(call: ToolCallRequest): Promise<ToolResult> {
  try {
    const response = await fetch(`${SERVER}/api/tools/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tool: call.tool,
        params: call.params,
        callId: call.callId,
      }),
    })

    if (!response.ok) {
      const text = await response.text()
      return { success: false, error: `Server error ${response.status}: ${text}` }
    }

    const data = await response.json()
    return {
      success: data.success ?? true,
      output: data.output ?? '',
      error: data.error,
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return { success: false, error: `Network error: ${message}` }
  }
}

/**
 * Execute multiple tool calls in parallel
 */
export async function executeToolsParallel(calls: ToolCallRequest[]): Promise<Record<string, ToolResult>> {
  const results = await Promise.all(
    calls.map(async (call) => {
      const result = await executeTool(call)
      return { callId: call.callId, result }
    })
  )

  const map: Record<string, ToolResult> = {}
  for (const { callId, result } of results) {
    map[callId] = result
  }
  return map
}

/**
 * List available tools from the server
 */
export async function listTools(): Promise<ToolName[]> {
  try {
    const response = await fetch(`${SERVER}/api/tools/list`)
    if (!response.ok) return []
    const data = await response.json()
    return data.tools as ToolName[]
  } catch {
    return []
  }
}

/**
 * Format a tool result for display
 */
export function formatToolResult(result: ToolResult, maxLength = 8000): string {
  if (result.error) {
    return `⚠️ Error:\n${result.error}`
  }
  if (!result.output) return '(no output)'
  const output = result.output.length > maxLength
    ? result.output.slice(0, maxLength) + `\n... [truncated, ${result.output.length - maxLength} more chars]`
    : result.output
  return output
}

/**
 * Format a tool call for display in the UI
 */
export function formatToolCall(name: ToolName, params: Record<string, unknown>): string {
  const lines = [`**${name}**`]
  for (const [key, value] of Object.entries(params)) {
    const formatted = typeof value === 'string' && value.length > 100
      ? value.slice(0, 100) + '...'
      : JSON.stringify(value)
    lines.push(`  • ${key}: ${formatted}`)
  }
  return lines.join('\n')
}