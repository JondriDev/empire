/**
 * Empire Core Graph — the B-backbone, one shared world-state.
 *
 * Every meaningful "thing" in The Empire — a note, a task, a contact, a
 * network node — is a CoreNode in ONE store. Apps stop owning private
 * databases; they query this graph for the node types they care about and
 * write back through it. The Network app renders this graph directly, so your
 * real data becomes the hero visual.
 *
 * I am the connector — the graph is my memory, the event bus is my nervous
 * system. Every mutation here speaks on the bus (see ../eventBus).
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { emit } from '../eventBus'

export interface CoreNode {
  id: string
  /** "note" | "task" | "contact" | "file" | "event" | "app:network" ... */
  type: string
  title: string
  /** App-specific payload. Kept open so any app can extend without schema churn. */
  data: Record<string, unknown>
  /** Edges to other nodes (directed: this -> target). */
  links: string[]
  meta: { created: number; updated: number; app: string }
}

/** Fields a caller supplies; id/links/meta are filled in by the store. */
export interface NewNode {
  type: string
  title: string
  data?: Record<string, unknown>
  app: string
  links?: string[]
}

function newId(): string {
  return globalThis.crypto?.randomUUID?.()
    ?? `n_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

interface GraphState {
  nodes: Record<string, CoreNode>
  /** Create a node, persist it, announce it on the bus. Returns the node. */
  addNode: (_input: NewNode) => CoreNode
  /** Patch a node's mutable fields (title/data/links). */
  updateNode: (_id: string, _patch: Partial<Pick<CoreNode, 'title' | 'data' | 'links'>>) => void
  /** Remove a node and scrub any inbound edges to it. */
  deleteNode: (_id: string) => void
  /** Add a directed edge from -> to (idempotent). */
  link: (_fromId: string, _toId: string) => void
  /** Remove a directed edge from -> to. */
  unlink: (_fromId: string, _toId: string) => void
}

export const useGraph = create<GraphState>()(
  persist(
    (set, get) => ({
      nodes: {},

      addNode: (_input) => {
        const now = Date.now()
        const node: CoreNode = {
          id: newId(),
          type: _input.type,
          title: _input.title,
          data: _input.data ?? {},
          links: _input.links ?? [],
          meta: { created: now, updated: now, app: _input.app },
        }
        set(s => ({ nodes: { ...s.nodes, [node.id]: node } }))
        emit({ type: 'NODE_CREATED', nodeId: node.id, nodeType: node.type, title: node.title, app: node.meta.app })
        return node
      },

      updateNode: (_id, _patch) => {
        const existing = get().nodes[_id]
        if (!existing) return
        const updated: CoreNode = {
          ...existing,
          ..._patch,
          meta: { ...existing.meta, updated: Date.now() },
        }
        set(s => ({ nodes: { ...s.nodes, [_id]: updated } }))
        emit({ type: 'NODE_UPDATED', nodeId: _id, nodeType: updated.type })
      },

      deleteNode: (_id) => {
        const target = get().nodes[_id]
        if (!target) return
        set(s => {
          const nodes = { ...s.nodes }
          delete nodes[_id]
          // Scrub inbound edges so we never point at a ghost.
          for (const n of Object.values(nodes)) {
            if (n.links.includes(_id)) {
              nodes[n.id] = { ...n, links: n.links.filter(l => l !== _id) }
            }
          }
          return { nodes }
        })
        emit({ type: 'NODE_DELETED', nodeId: _id, nodeType: target.type })
      },

      link: (_fromId, _toId) => {
        const from = get().nodes[_fromId]
        if (!from || _fromId === _toId || from.links.includes(_toId)) return
        if (!get().nodes[_toId]) return
        set(s => ({
          nodes: { ...s.nodes, [_fromId]: { ...from, links: [...from.links, _toId] } },
        }))
        emit({ type: 'NODES_LINKED', fromId: _fromId, toId: _toId })
      },

      unlink: (_fromId, _toId) => {
        const from = get().nodes[_fromId]
        if (!from || !from.links.includes(_toId)) return
        set(s => ({
          nodes: { ...s.nodes, [_fromId]: { ...from, links: from.links.filter(l => l !== _toId) } },
        }))
        emit({ type: 'NODES_UNLINKED', fromId: _fromId, toId: _toId })
      },
    }),
    {
      name: 'empire-core-graph',
      partialize: (s) => ({ nodes: s.nodes }),
    }
  )
)

// ---- Selectors (use outside React via getState, or wrap in useGraph in components) ----

/** All nodes of a given type, newest first. */
export function nodesOfType(_type: string): CoreNode[] {
  return Object.values(useGraph.getState().nodes)
    .filter(n => n.type === _type)
    .sort((a, b) => b.meta.updated - a.meta.updated)
}

/** The nodes a given node links out to. */
export function neighbors(_id: string): CoreNode[] {
  const all = useGraph.getState().nodes
  const node = all[_id]
  if (!node) return []
  return node.links.map(l => all[l]).filter(Boolean)
}

/** React hook: live list of nodes of a type. */
export function useNodesOfType(_type: string): CoreNode[] {
  return useGraph(s =>
    Object.values(s.nodes)
      .filter(n => n.type === _type)
      .sort((a, b) => b.meta.updated - a.meta.updated)
  )
}
