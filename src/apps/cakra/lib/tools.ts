/**
 * Empire Agent — Tool Registry
 * Defines all available tools and their JSON schemas for LLM tool-calling
 */

import type { Tool, ToolName } from './types'

// ─── JSON Schemas for each tool ────────────────────────────────────────────────

const FILE_READ_SCHEMA = {
  type: 'object',
  properties: {
    path: {
      type: 'string',
      description: 'Absolute path to the file to read. Example: /storage/emulated/0/Documents/readme.txt',
    },
    limit: {
      type: 'number',
      description: 'Maximum number of lines to read. Default: 100',
    },
    offset: {
      type: 'number',
      description: 'Line offset to start reading from. Default: 1',
    },
  },
  required: ['path'],
}

const FILE_WRITE_SCHEMA = {
  type: 'object',
  properties: {
    path: {
      type: 'string',
      description: 'Absolute path to write to. Example: /storage/emulated/0/Documents/output.txt',
    },
    content: {
      type: 'string',
      description: 'Content to write to the file.',
    },
    append: {
      type: 'boolean',
      description: 'If true, append to file instead of overwriting. Default: false',
    },
  },
  required: ['path', 'content'],
}

const FILE_LIST_SCHEMA = {
  type: 'object',
  properties: {
    path: {
      type: 'string',
      description: 'Directory path to list. Example: /storage/emulated/0/Documents',
    },
  },
  required: ['path'],
}

const SHELL_EXEC_SCHEMA = {
  type: 'object',
  properties: {
    command: {
      type: 'string',
      description: 'Shell command to execute. Max 30s timeout. Restricted: no rm -rf /, dd, mkfs, etc.',
    },
    timeout: {
      type: 'number',
      description: 'Timeout in seconds. Max: 30. Default: 10',
    },
  },
  required: ['command'],
}

const WEB_SEARCH_SCHEMA = {
  type: 'object',
  properties: {
    query: {
      type: 'string',
      description: 'Search query for web search.',
    },
    limit: {
      type: 'number',
      description: 'Maximum number of results. Default: 5',
    },
  },
  required: ['query'],
}

const WEB_FETCH_SCHEMA = {
  type: 'object',
  properties: {
    url: {
      type: 'string',
      description: 'Full URL to fetch. Example: https://example.com',
    },
    query: {
      type: 'string',
      description: 'Optional: specific topic to extract from the page (AI will look for this).',
    },
  },
  required: ['url'],
}

const CODE_EXEC_SCHEMA = {
  type: 'object',
  properties: {
    code: {
      type: 'string',
      description: 'Code to execute.',
    },
    language: {
      type: 'string',
      enum: ['python', 'javascript'],
      description: 'Programming language: python or javascript',
    },
    args: {
      type: 'object',
      description: 'Optional: key-value pairs to make available as variables/arguments.',
    },
  },
  required: ['code', 'language'],
}

// ─── Tool Registry ────────────────────────────────────────────────────────────

export const TOOLS: Record<ToolName, Tool> = {
  file_read: {
    name: 'file_read',
    description: 'Read the contents of a file. Shows line numbers and limits output for large files. Use this to inspect code, configs, notes, or any text file.',
    schema: FILE_READ_SCHEMA,
    dangerous: false,
    category: 'filesystem',
    icon: '📄',
  },
  file_write: {
    name: 'file_write',
    description: 'Write or append content to a file. Creates the file if it doesn\'t exist. Use this to save code, notes, or any text content.',
    schema: FILE_WRITE_SCHEMA,
    dangerous: true,
    category: 'filesystem',
    icon: '✏️',
  },
  file_list: {
    name: 'file_list',
    description: 'List files and folders in a directory. Shows name, type, size, and modified date. Use this to explore the filesystem.',
    schema: FILE_LIST_SCHEMA,
    dangerous: false,
    category: 'filesystem',
    icon: '📁',
  },
  shell_exec: {
    name: 'shell_exec',
    description: 'Execute a shell command on the Android/Termux device. Can run any CLI program (find, grep, curl, node, python, etc.). Returns stdout + stderr.',
    schema: SHELL_EXEC_SCHEMA,
    dangerous: true,
    category: 'terminal',
    icon: '⌨️',
  },
  web_search: {
    name: 'web_search',
    description: 'Search the web using DuckDuckGo. Returns top results with titles, URLs, and snippets. Use for current information or to find resources.',
    schema: WEB_SEARCH_SCHEMA,
    dangerous: false,
    category: 'web',
    icon: '🔍',
  },
  web_fetch: {
    name: 'web_fetch',
    description: 'Extract content from a URL. Returns cleaned text content. Good for reading articles, docs, or scraping web pages.',
    schema: WEB_FETCH_SCHEMA,
    dangerous: false,
    category: 'web',
    icon: '🌐',
  },
  code_exec: {
    name: 'code_exec',
    description: 'Execute Python or JavaScript code in a sandboxed environment. Returns stdout and stderr. Use for calculations, data processing, text manipulation.',
    schema: CODE_EXEC_SCHEMA,
    dangerous: false,
    category: 'code',
    icon: '▶️',
  },
}

export const TOOL_LIST = Object.values(TOOLS)

/** Get a tool by name */
export function getTool(name: ToolName): Tool | undefined {
  return TOOLS[name]
}

/** Get all tools for a category */
export function getToolsByCategory(category: Tool['category']): Tool[] {
  return TOOL_LIST.filter(t => t.category === category)
}

/** Get tool schemas formatted for OpenAI-style function calling */
export function getToolSchemas() {
  return TOOL_LIST.map(tool => ({
    type: 'function' as const,
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.schema,
    },
  }))
}

/** Get tool names as a list */
export function getToolNames(): ToolName[] {
  return Object.keys(TOOLS) as ToolName[]
}

/** Check if a tool is dangerous (requires user confirmation) */
export function isDangerousTool(name: ToolName): boolean {
  return TOOLS[name]?.dangerous ?? false
}