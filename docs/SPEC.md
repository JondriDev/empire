# Empire AI Agent — Redesign Spec

## 1. Concept & Vision

**Name:** Hermes Agent (formerly AI Chat)
**Tagline:** "Your AI that actually does things."

Hermes Agent is a fully agentic AI app for Android/Termux — not a chatbot that talks, but an AI that *acts*. It spawns real tools: reading files, running shell commands, searching the web, executing code. Inspired by Claude Desktop and Codex Desktop, but built for the free-tier resource landscape (OpenRouter, Nvidia NIM, Groq, Google AI Studio) and Android's unique constraints.

The feel: a professional developer tool with the warmth of a personal assistant. Every action the AI takes is visible and reversible. The user is always in control — the AI asks before doing dangerous things, shows its reasoning, and can be interrupted at any time.

---

## 2. Design Language

**Aesthetic:** Dark IDE meets glass-morphism. Professional, not flashy. The kind of tool a developer would keep open all day.

**Colors:**
- Background: `#0a0e1a` (deep navy-black)
- Surface: `#111827` (card backgrounds)
- Border: `#1e2d4a` (subtle glass edges)
- Primary: `#6366f1` (indigo — actions, AI messages)
- Secondary: `#22d3ee` (cyan — tool calls, thinking traces)
- Accent Green: `#10b981` (success, tool done)
- Accent Red: `#ef4444` (errors, destructive)
- Accent Amber: `#f59e0b` (confirmation, warnings)
- Text Primary: `#f1f5f9`
- Text Secondary: `#94a3b8`
- Text Muted: `#475569`

**Typography:**
- UI: Inter (sans-serif)
- Code/Tools: JetBrains Mono (monospace)
- Sizes: 12px metadata, 14px body, 16px headings, 24px+ hero

**Motion:**
- Tool call cards: slide-in from left with spring easing (300ms)
- Thinking dots: pulse animation while AI reasons
- Message stream: character-by-character fade-in
- Tool results: accordion expand (200ms ease-out)

---

## 3. Architecture

```
src/
├── apps/ai-agent/
│   ├── Agent.tsx              # Main app shell
│   ├── components/
│   │   ├── ChatPanel.tsx      # Message list + input
│   │   ├── ToolCallCard.tsx   # Inline tool call display
│   │   ├── ThinkingTrace.tsx  # Reasoning display
│   │   ├── ModelPicker.tsx    # Provider/model selector
│   │   ├── SettingsPanel.tsx  # API keys, config
│   │   └── ToolResult.tsx     # Expandable tool output
│   ├── lib/
│   │   ├── providers/         # Multi-provider AI layer
│   │   │   ├── index.ts        # Unified provider interface
│   │   │   ├── openrouter.ts   # OpenRouter free models
│   │   │   ├── groq.ts         # Groq free tier
│   │   │   ├── google.ts       # Google AI Studio (gemini-2.0-flash free)
│   │   │   ├── together.ts      # Together AI free
│   │   │   └── nvidia.ts       # Nvidia NIM
│   │   ├── tools/              # Tool definitions & registry
│   │   │   ├── index.ts        # Tool schema + registry
│   │   │   ├── fileOps.ts      # Read/write/list files
│   │   │   ├── shell.ts        # Terminal command execution
│   │   │   ├── webSearch.ts    # Web search via server proxy
│   │   │   └── codeRunner.ts   # Execute code snippets
│   │   ├── agent.ts            # Agent loop (Think → Act → Observe)
│   │   └── types.ts            # Shared TypeScript types
```

**Agent Loop:**
```
User Input
    ↓
[ THINK ] — AI analyzes request, decides tool(s)
    ↓
[ ACT ]   — Execute tool(s) via server API
    ↓
[ OBSERVE ] — Parse tool results, feed back to AI
    ↓
[ RESPOND ] — AI synthesizes final response
    ↓
Display to user
```

---

## 4. Providers (All Free Tier)

### OpenRouter Free Models
| Model ID | Context | Notes |
|----------|---------|-------|
| `meta-llama/llama-3.1-8b-instruct` | 128K | Best overall free model |
| `mistralai/mistral-7b-instruct` | 32K | Fast, reliable |
| `qwen/qwen-2.5-72b-instruct` | 32K | Best reasoning free |

### Groq Free Tier (LPU Inference)
| Model ID | Context | Notes |
|----------|---------|-------|
| `groq/llama-3.3-70b-versatile` | 128K | Fast inference |
| `groq/llama-3.1-8b-instant` | 128K | Very fast |
| `groq/mixtral-8x7b-32768` | 32K | Good for agents |

### Google AI Studio (Gemini Free)
| Model ID | Context | Notes |
|----------|---------|-------|
| `gemini-2.0-flash` | 1M | Fast, free, great tools |
| `gemini-1.5-flash` | 1M | Reliable |

### Together AI Free
| Model ID | Context | Notes |
|----------|---------|-------|
| `meta-llama/Llama-3-70b-chat-hf` | 8K | Strong reasoning |

### Nvidia NIM
| Model ID | Context | Notes |
|----------|---------|-------|
| `nvidia/llama-3.1-nemotron-70b-instruct` | 128K | High quality |
| `meta/llama-3-70b-instruct` | 8K | NIM free endpoint |

---

## 5. Tools

### Tool Schema (JSON Schema for LLM tool calling)
```typescript
interface Tool {
  name: string           // e.g. "file_read"
  description: string    // Human-readable description
  schema: object         // JSON Schema for parameters
  dangerous: boolean     // If true, requires confirmation
}
```

### Available Tools

#### 1. `file_read` (non-dangerous)
- **Params:** `{ path: string, limit?: number, offset?: number }`
- **Access:** Resolves relative to ALLOWED_BASE (`/storage/emulated/0`)
- **Output:** First N lines of file, or error

#### 2. `file_write` (dangerous)
- **Params:** `{ path: string, content: string, append?: boolean }`
- **Access:** Resolves within ALLOWED_BASE
- **Output:** Success/error

#### 3. `file_list` (non-dangerous)
- **Params:** `{ path: string }`
- **Output:** File/folder listing with size, modified date

#### 4. `shell_exec` (dangerous)
- **Params:** `{ command: string, timeout?: number }`
- **Security:** Commands are allowed-list limited on Android (no rm -rf, etc.)
- **Timeout:** Max 30 seconds
- **Output:** stdout + stderr

#### 5. `web_search` (non-dangerous)
- **Params:** `{ query: string, limit?: number }`
- **Output:** Search results with titles, URLs, snippets

#### 6. `web_fetch` (non-dangerous)
- **Params:** `{ url: string }`
- **Output:** Extracted content from URL

#### 7. `code_exec` (non-dangerous)
- **Params:** `{ code: string, language: "python" | "javascript" }`
- **Security:** Sandboxed execution via server
- **Timeout:** Max 10 seconds
- **Output:** stdout + stderr

---

## 6. UI Components

### ChatPanel
- Message list with auto-scroll
- User messages: right-aligned, indigo background
- AI messages: left-aligned, dark surface
- Tool call cards: full-width, cyan border, expand in-place
- Thinking indicator: animated dots between "thinking" messages
- Input: textarea at bottom, Shift+Enter for newline, Enter to send

### ToolCallCard
States:
- **Pending:** spinner + "Running {tool_name}..."
- **Success:** green left border, collapsible output
- **Error:** red left border, error message

### ThinkingTrace
- Collapsible section showing AI's reasoning
- Format: numbered steps with timestamps
- Toggle: "Show thinking" / "Hide thinking"

### ModelPicker
- Dropdown in header
- Shows: Provider icon + Model name + context size
- Quick switch between configured providers

### SettingsPanel
- API key inputs per provider (stored in localStorage)
- Model preference per provider
- Default tool permissions (auto-confirm dangerous)
- Clear conversation button

---

## 7. Backend Changes

### New Endpoints

#### `POST /api/tools/execute`
```json
{
  "tool": "file_read" | "file_write" | "file_list" | "shell_exec" | "web_search" | "web_fetch" | "code_exec",
  "params": { ... }
}
```

#### `GET /api/tools/list`
Returns all available tools and their schemas.

#### `POST /api/ai/agent`
Agent-mode chat that handles tool calls and streaming in a single request:
```json
{
  "messages": [...],
  "provider": "openrouter",
  "model": "meta-llama/llama-3.1-8b-instruct",
  "tools": ["file_read", "file_list", "shell_exec", "web_search"]
}
```
Returns SSE stream with `content` and `tool_call` events.

---

## 8. Security

- All file operations resolve within ALLOWED_BASE
- Shell commands blocklisted: `rm -rf`, `dd`, `mkfs`, `> /dev/`, format, fdisk
- Shell timeout: 30 seconds max
- API keys stored in localStorage (user's device, not server)
- Dangerous tool calls require user confirmation (modal)
- No code execution can access network or filesystem directly

---

## 9. Mobile Considerations

- Responsive: full-screen on mobile, split-view on tablet/desktop
- Touch: tap to expand tool results, swipe to dismiss
- Keyboard: full keyboard support, shortcuts (Ctrl+Enter = send, Ctrl+/ = toggle tools)
- Input: auto-focus, voice input via system keyboard

---

## 10. Success Metrics

- All 7 tools functional and tested
- 5+ free providers configured and working
- Agent can complete a multi-step task (read file → analyze → write result)
- Zero crashes, clean TypeScript, zero console errors
- Build passes with 0 warnings