/**
 * Empire Intents — the C-layer, circulatory system.
 *
 * Apps don't call each other directly. They declare what they can DO with a
 * node ("Open in Browser", "Make Task from this Note"), and the Core routes:
 * right-click a node -> intentsFor(node) -> menu -> runIntent(). This is what
 * makes The Empire feel like one OS instead of 26 windows — Unix pipes /
 * Android intents for your own apps.
 *
 * Every run announces itself on the bus (see ../eventBus), so automation and
 * the Network app can watch the flow.
 */

import type { CoreNode } from './graph'
import { emit } from '../eventBus'

export interface Intent {
  /** Stable id, e.g. "note.to-task", "url.open". */
  id: string
  /** Human label shown in the action menu. */
  label: string
  /** Optional glyph/emoji for the menu. */
  icon?: string
  /** Which nodes this intent applies to. */
  accepts: (_node: CoreNode) => boolean
  /** Do the thing. May open an app, create nodes, call the backend, etc. */
  run: (_node: CoreNode) => void | Promise<void>
}

const registry = new Map<string, Intent>()

/** Register an intent. Returns an unregister function. */
export function registerIntent(_intent: Intent): () => void {
  registry.set(_intent.id, _intent)
  return () => registry.delete(_intent.id)
}

/** Every intent that accepts this node, in registration order. */
export function intentsFor(_node: CoreNode): Intent[] {
  return [...registry.values()].filter(i => i.accepts(_node))
}

/** Run an intent against a node by id. Announces on the bus. No-op if missing/rejected. */
export async function runIntent(_intentId: string, _node: CoreNode): Promise<void> {
  const intent = registry.get(_intentId)
  if (!intent || !intent.accepts(_node)) return
  emit({ type: 'INTENT_RUN', intentId: _intentId, nodeId: _node.id })
  await intent.run(_node)
}

/** All registered intents (for debugging / a "what can The Empire do?" view). */
export function allIntents(): Intent[] {
  return [...registry.values()]
}
