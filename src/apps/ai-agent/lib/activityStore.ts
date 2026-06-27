/**
 * Cakra Workspace — Activity Store
 *
 * A live, transparent log of every action Cakra takes (reading files,
 * searching the web, running code…). The agent loop writes here the moment
 * each tool starts and finishes; the Workspace panel renders it in real time.
 *
 * This is what makes Cakra glass-box instead of black-box.
 */

import { create } from 'zustand'
import type { ToolCall, ToolResult, ToolName } from './types'

export type ActivityStatus = 'running' | 'done' | 'error'

export interface ActivityEntry {
  id: string                         // == the tool call id
  tool: ToolName | string
  args: Record<string, unknown>
  status: ActivityStatus
  result?: ToolResult
  startedAt: number
  endedAt?: number
}

interface ActivityState {
  entries: ActivityEntry[]
  selectedId: string | null
  start: (_call: ToolCall) => void
  finish: (_id: string, _result: ToolResult) => void
  select: (_id: string | null) => void
  clear: () => void
}

export const useActivityStore = create<ActivityState>((set) => ({
  entries: [],
  selectedId: null,
  start: (call) =>
    set((s) => ({
      // Guard against a duplicate start for the same call id.
      entries: s.entries.some((e) => e.id === call.id)
        ? s.entries
        : [
            ...s.entries,
            {
              id: call.id,
              tool: call.name,
              args: call.arguments ?? {},
              status: 'running' as const,
              startedAt: Date.now(),
            },
          ],
      selectedId: call.id, // auto-follow the latest action, Manus-style
    })),
  finish: (id, result) =>
    set((s) => ({
      entries: s.entries.map((e) =>
        e.id === id
          ? {
              ...e,
              status: result.success ? ('done' as const) : ('error' as const),
              result,
              endedAt: Date.now(),
            }
          : e
      ),
    })),
  select: (id) => set({ selectedId: id }),
  clear: () => set({ entries: [], selectedId: null }),
}))

// ─── Human-readable description of an action ──────────────────────────────────

export interface ActivityDescriptor {
  icon: string   // emoji shown in the list / viewer
  verb: string   // e.g. "Reading file"
  target: string // e.g. "notes.txt"
  accent: string // tint for the live status indicator
}

function basename(p: string): string {
  if (!p) return ''
  const trimmed = p.replace(/\/+$/, '')
  const parts = trimmed.split('/')
  return parts[parts.length - 1] || p
}

function hostname(u: string): string {
  try {
    return new URL(u).hostname.replace(/^www\./, '')
  } catch {
    return u
  }
}

const BOOK_EXT = /\.(pdf|epub|mobi|azw3?|djvu|fb2)$/i

/** Turn a raw tool call into a friendly "what is Cakra doing" label. */
export function describeActivity(entry: ActivityEntry): ActivityDescriptor {
  const a = entry.args || {}
  switch (entry.tool) {
    case 'file_read': {
      const path = String(a.path ?? '')
      const isBook = BOOK_EXT.test(path)
      return {
        icon: isBook ? '📖' : '📄',
        verb: isBook ? 'Reading book' : 'Reading file',
        target: basename(path),
        accent: '#22d3ee',
      }
    }
    case 'file_list':
      return {
        icon: '📁',
        verb: 'Browsing folder',
        target: basename(String(a.path ?? '')) || String(a.path ?? ''),
        accent: '#22d3ee',
      }
    case 'file_write':
      return { icon: '✏️', verb: 'Writing file', target: basename(String(a.path ?? '')), accent: '#f59e0b' }
    case 'web_search':
      return { icon: '🔍', verb: 'Searching the web', target: `"${String(a.query ?? '')}"`, accent: '#a78bfa' }
    case 'web_fetch':
      return { icon: '🌐', verb: 'Reading web page', target: hostname(String(a.url ?? '')), accent: '#a78bfa' }
    case 'shell_exec':
      return { icon: '⌨️', verb: 'Running command', target: String(a.command ?? ''), accent: '#f59e0b' }
    case 'code_exec':
      return { icon: '▶️', verb: 'Running code', target: String(a.language ?? 'code'), accent: '#34d399' }
    default:
      return { icon: '🔧', verb: String(entry.tool), target: '', accent: '#22d3ee' }
  }
}

/** The single most relevant argument to surface in the viewer header. */
export function primaryArg(entry: ActivityEntry): string {
  const a = entry.args || {}
  const v = a.path ?? a.url ?? a.query ?? a.command ?? a.code ?? ''
  return typeof v === 'string' ? v : JSON.stringify(v)
}
