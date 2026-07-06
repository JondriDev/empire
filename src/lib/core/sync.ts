/**
 * Empire Core Sync — bridges the legacy store silos into the B-backbone graph.
 *
 * Every store-backed collection (notes, calendar events, learning items,
 * messages) is mirrored into the Core graph as CoreNodes, keyed by
 * data.sourceId = the item's store id. One subscription keeps them in lockstep:
 * add -> node appears, edit -> node updates, delete -> node (and its edges)
 * vanish. This is how every store-backed app joins the organism with NO per-app
 * code — wire once here, and Notes/Calendar/Learning/Messages all light up in
 * The Network and gain intents.
 */

import { useStore } from '../store'
import { useGraph } from './graph'
import { registerIntent } from './intents'
import { emit } from '../eventBus'
import type { CoreNode } from './graph'

/**
 * Announce a directed app→app handoff on the bus so the Network mesh lights an
 * honest synapse arc. Guards self-transfers: an intent that derives a node owned
 * by the SAME app (make-task stays graph-only in its source app; make-note-from
 * from a note into Notes) is an in-app derivation, not a synapse — so it emits
 * nothing. Only a genuine boundary crossing (e.g. a Calendar event → Notes, or a
 * note → Learning Tracker) lights an arc.
 */
function announceTransfer(_fromApp: string, _toApp: string, _label: string): void {
  if (!_fromApp || !_toApp || _fromApp === _toApp) return
  emit({ type: 'HANDOFF', fromId: _fromApp, toId: _toApp, label: _label })
}

/** Fresh id for a store entity created by a cross-app intent (mirrors graph.ts newId). */
function newEntityId(): string {
  return globalThis.crypto?.randomUUID?.()
    ?? `entity_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

type Snapshot = ReturnType<typeof useStore.getState>

/** How one store collection maps into the Core graph. */
interface Mirror<T> {
  type: string
  app: string
  items: (_s: Snapshot) => T[]
  id: (_item: T) => string
  title: (_item: T) => string
  data: (_item: T) => Record<string, unknown>
}

/** Upsert the graph so its <type> nodes exactly match the current store items. */
function reconcile<T>(_m: Mirror<T>, _items: T[]): void {
  const g = useGraph.getState()
  const existing = new Map<string, CoreNode>()
  for (const n of Object.values(g.nodes)) {
    if (n.type === _m.type) existing.set(String(n.data.sourceId), n)
  }
  const seen = new Set<string>()
  for (const item of _items) {
    const sid = _m.id(item)
    seen.add(sid)
    const title = _m.title(item)
    const data = { ..._m.data(item), sourceId: sid }
    const node = existing.get(sid)
    if (!node) {
      g.addNode({ type: _m.type, title, data, app: _m.app })
    } else if (node.title !== title || JSON.stringify(node.data) !== JSON.stringify(data)) {
      g.updateNode(node.id, { title, data })
    }
  }
  for (const [sid, node] of existing) {
    if (!seen.has(sid)) g.deleteNode(node.id)
  }
}

/** Bind a typed mirror to a zero-arg syncer that reads the live store. */
function syncerFor<T>(_m: Mirror<T>): () => void {
  return () => reconcile(_m, _m.items(useStore.getState()))
}

// Store-backed collections only. Calendar keeps events in its OWN localStorage,
// so it is NOT listed here — it mirrors itself via mirrorCollection() (otherwise
// this central pass, seeing store.events empty, would delete Calendar's nodes).
const syncers: Array<() => void> = [
  syncerFor<Snapshot['notes'][number]>({
    type: 'note', app: 'notes',
    items: s => s.notes,
    id: n => n.id,
    title: n => n.title,
    data: n => ({ content: n.content, tags: n.tags, ...(n.from !== undefined ? { from: n.from } : {}) }),
  }),
  syncerFor<Snapshot['learningItems'][number]>({
    type: 'learning', app: 'learning-tracker',
    items: s => s.learningItems,
    id: l => l.id,
    title: l => l.topic,
    data: l => ({ learned: l.learned, mastered: l.mastered, nextReview: l.nextReview, ...(l.from !== undefined ? { from: l.from } : {}) }),
  }),
  syncerFor<Snapshot['messages'][number]>({
    type: 'message', app: 'messages',
    items: s => s.messages,
    id: m => m.id,
    title: m => `${m.sender}: ${m.content.slice(0, 40)}`,
    data: m => ({ sender: m.sender, content: m.content }),
  }),
]

/**
 * Mirror a collection that lives OUTSIDE the global store (own localStorage /
 * component state). Call from a useEffect on the data: any app joins the
 * organism in ~3 lines without a global store.
 */
export function mirrorCollection<T>(
  _type: string,
  _app: string,
  _items: T[],
  _map: { id: (_i: T) => string; title: (_i: T) => string; data: (_i: T) => Record<string, unknown> },
): void {
  reconcile({ type: _type, app: _app, items: () => _items, id: _map.id, title: _map.title, data: _map.data }, _items)
}

function syncAll(): void {
  for (const run of syncers) run()
}

/** Default cross-app intents (C-layer) for the mirrored types. */
function registerCoreIntents(): void {
  registerIntent({
    id: 'make-task',
    label: 'Make Task from this',
    icon: '✓',
    accepts: n => ['note', 'event', 'learning', 'message', 'goal', 'kanban', 'dataset', 'file', 'photo', 'prompt', 'book'].includes(n.type),
    run: n => {
      const g = useGraph.getState()
      const task = g.addNode({ type: 'task', title: `Do: ${n.title}`, data: { done: false, from: n.id }, app: n.meta.app })
      g.link(n.id, task.id)
      announceTransfer(n.meta.app, task.meta.app, 'make task')
    },
  })

  registerIntent({
    id: 'make-note-from',
    label: 'Make Note from this',
    icon: '📝',
    // Any node can spawn a note — except notes themselves (would just clone).
    accepts: n => n.type !== 'note',
    run: n => {
      // Route through the REAL store — NOT g.addNode. `note` is a centrally-mirrored
      // type, so a graph-only node (no sourceId) is a phantom: it never appears in
      // Notes and reconcile() prunes it on the next store mutation / reload. Writing
      // the store fires useStore.subscribe(syncAll) synchronously, so the mirrored
      // note node exists (sourceId-keyed, owned by `notes`) the moment addNote returns.
      const content = typeof n.data.content === 'string' ? n.data.content : n.title
      const id = newEntityId()
      useStore.getState().addNote({ id, title: `Note: ${n.title}`, content, tags: [], updatedAt: Date.now(), from: n.id })
      // Best-effort mesh edge source → mirrored note (lineage already flows via data.from).
      const note = Object.values(useGraph.getState().nodes).find(x => x.type === 'note' && x.data.sourceId === id)
      if (note) useGraph.getState().link(n.id, note.id)
      // Honest arc: the note is owned by `notes`, so any non-notes source crosses a boundary.
      announceTransfer(n.meta.app, 'notes', 'make note')
    },
  })

  registerIntent({
    id: 'add-to-learning',
    label: 'Add to Learning',
    icon: '🎓',
    accepts: n => ['note', 'message'].includes(n.type),
    run: n => {
      // Route through the REAL store — NOT g.addNode (same rail as make-note-from).
      // `learning` is a centrally-mirrored type, so a graph-only node (no sourceId)
      // is a phantom reconcile() prunes. addLearningItem fires useStore.subscribe(
      // syncAll) synchronously, so the sourceId-keyed `learning` mirror (owned by
      // learning-tracker) exists the moment it returns. `date`/`nextReview` are ISO
      // day strings; `learned` starts empty; `from` preserves lineage on the mirror.
      const id = newEntityId()
      const today = new Date().toISOString().slice(0, 10)
      useStore.getState().addLearningItem({ id, topic: n.title, learned: '', date: today, nextReview: today, mastered: false, from: n.id })
      // Best-effort mesh edge source → mirrored learning item (lineage flows via data.from).
      const learning = Object.values(useGraph.getState().nodes).find(x => x.type === 'learning' && x.data.sourceId === id)
      if (learning) useGraph.getState().link(n.id, learning.id)
      // Honest arc: the item is owned by learning-tracker, so a note/message source crosses a boundary.
      announceTransfer(n.meta.app, 'learning-tracker', 'to learning')
    },
  })
}

let started = false
/** Call once at startup. Registers intents, mirrors current state, and keeps it synced. */
export function startCoreSync(): void {
  if (started) return
  started = true
  registerCoreIntents()
  syncAll()
  useStore.subscribe(syncAll)
}
