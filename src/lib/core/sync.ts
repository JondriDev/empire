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
 * by the SAME app (make-task / make-note-from stay in their source app) is an
 * in-app derivation, not a synapse — so it emits nothing. Only a genuine
 * boundary crossing (e.g. a note → Learning Tracker) lights an arc.
 */
function announceTransfer(_fromApp: string, _toApp: string, _label: string): void {
  if (!_fromApp || !_toApp || _fromApp === _toApp) return
  emit({ type: 'HANDOFF', fromId: _fromApp, toId: _toApp, label: _label })
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
    data: n => ({ content: n.content, tags: n.tags }),
  }),
  syncerFor<Snapshot['learningItems'][number]>({
    type: 'learning', app: 'learning-tracker',
    items: s => s.learningItems,
    id: l => l.id,
    title: l => l.topic,
    data: l => ({ learned: l.learned, mastered: l.mastered, nextReview: l.nextReview }),
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
      const g = useGraph.getState()
      const content = typeof n.data.content === 'string' ? n.data.content : n.title
      const note = g.addNode({ type: 'note', title: `Note: ${n.title}`, data: { content, tags: [], from: n.id }, app: n.meta.app })
      g.link(n.id, note.id)
      announceTransfer(n.meta.app, note.meta.app, 'make note')
    },
  })

  registerIntent({
    id: 'add-to-learning',
    label: 'Add to Learning',
    icon: '🎓',
    accepts: n => ['note', 'message'].includes(n.type),
    run: n => {
      const g = useGraph.getState()
      const learning = g.addNode({ type: 'learning', title: n.title, data: { learned: false, mastered: false, from: n.id }, app: 'learning-tracker' })
      g.link(n.id, learning.id)
      announceTransfer(n.meta.app, learning.meta.app, 'to learning')
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
