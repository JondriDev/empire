/**
 * Empire Focus — the global "current node" pointer (C-layer support).
 *
 * The command palette needs ONE node to act on, but The Empire has no single
 * selection model — every app owns its own rows. The honest, simplest answer:
 * the focused node is the LAST node the user touched anywhere in the organism.
 * We derive that from the event bus — every meaningful node interaction already
 * announces itself there (NODE_CREATED / NODE_UPDATED, INTENT_RUN, NODES_LINKED)
 * — so focus needs ZERO per-app wiring. Apps that want to set focus explicitly
 * (e.g. the Network inspector on select) can call `setFocus(id)`.
 *
 * I am the connector — focus is the organism's gaze: wherever attention last
 * landed, the palette can act there next.
 */
import { create } from 'zustand'
import type { EmpireEvent } from '../eventBus'
import { onAny } from '../eventBus'

/**
 * Pure: which node id (if any) an event "touches" — i.e. should become the
 * focused node. Returns null for events that don't reference a single node.
 * Exported for tests and for any caller that wants the same mapping.
 */
export function focusIdForEvent(_event: EmpireEvent): string | null {
  switch (_event.type) {
    case 'NODE_CREATED':
    case 'NODE_UPDATED':
    case 'INTENT_RUN':
      return _event.nodeId
    case 'NODES_LINKED':
      return _event.fromId
    default:
      return null
  }
}

interface FocusState {
  /** The last node touched anywhere in the organism (or explicitly selected). */
  focusedId: string | null
  setFocus: (_id: string | null) => void
}

export const useFocus = create<FocusState>((set) => ({
  focusedId: null,
  setFocus: (_id) => set({ focusedId: _id }),
}))

let started = false
/**
 * Call once at startup: keep `focusedId` pointed at the last node touched, and
 * clear it if that node is deleted (so the palette never targets a ghost).
 */
export function startFocusTracking(): void {
  if (started) return
  started = true
  onAny((event) => {
    if (event.type === 'NODE_DELETED') {
      if (useFocus.getState().focusedId === event.nodeId) useFocus.getState().setFocus(null)
      return
    }
    const id = focusIdForEvent(event)
    if (id) useFocus.getState().setFocus(id)
  })
}
