/**
 * Empire Agent — Types
 * Shared TypeScript interfaces for the agent system
 */

// ─── Messages ─────────────────────────────────────────────────────────────────

export type MessageRole = 'system' | 'user' | 'assistant' | 'tool'

export interface Message {
  id: string
  role: MessageRole
  content: string
  timestamp: number
  toolCallId?: string    // If this is a tool result, which call it answers
  toolName?: string     // If this is a tool result
  error?: boolean        // If this message is an error
}

export interface ChatMessage {
  role: MessageRole
  content: string
  tool_calls?: {
    id: string
    type: 'function'
    function: {
      name: string
      arguments: string   // JSON string — OpenAI API format
    }
  }[]
  tool_call_id?: string
}

export interface ToolCall {
  id: string
  name: string
  arguments: Record<string, unknown>
}

// ─── Providers ─────────────────────────────────────────────────────────────────

export type ProviderId = 'openrouter' | 'groq' | 'google' | 'together' | 'nvidia'

export interface Provider {
  id: ProviderId
  name: string
  logo: string          // SVG or emoji
  baseUrl: string
  apiKeyLabel: string
  models: ModelInfo[]
  free: boolean
  color: string          // Brand color for UI
}

export interface ModelInfo {
  id: string             // Full model ID (e.g. "meta-llama/llama-3.1-8b-instruct")
  name: string           // Display name
  contextWindow: number  // In tokens
  provider: ProviderId
  notes?: string
}

export interface ProviderConfig {
  apiKey: string
  model: string          // Model ID
  enabled: boolean
}

// ─── Tools ─────────────────────────────────────────────────────────────────────

export type ToolName = 'file_read' | 'file_write' | 'file_list' | 'shell_exec' | 'web_search' | 'web_fetch' | 'code_exec'

export interface Tool {
  name: ToolName
  description: string
  schema: Record<string, unknown>  // JSON Schema
  dangerous: boolean
  category: 'filesystem' | 'terminal' | 'web' | 'code'
  icon: string
}

export interface ToolResult {
  success: boolean
  output?: string
  error?: string
}

export interface ToolCallRequest {
  tool: ToolName
  params: Record<string, unknown>
  callId: string
}

// ─── Agent State ────────────────────────────────────────────────────────────────

export type AgentPhase =
  | 'idle'
  | 'thinking'
  | 'tool_calls'
  | 'tool_results'
  | 'responding'
  | 'error'

export interface AgentState {
  phase: AgentPhase
  currentToolCalls: ToolCall[]
  thinkingSteps: ThinkingStep[]
  streamingContent: string
  pendingConfirmations: ToolCall[]   // Dangerous tools awaiting user confirm
}

export interface ThinkingStep {
  step: number
  text: string
  timestamp: number
}

// ─── Settings ───────────────────────────────────────────────────────────────────

export interface AgentSettings {
  providers: Record<ProviderId, ProviderConfig>
  activeProvider: ProviderId
  activeModel: string
  autoConfirmDangerous: boolean
  showThinking: boolean
  maxTokens: number
  temperature: number
}