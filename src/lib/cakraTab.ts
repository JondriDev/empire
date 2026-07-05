/**
 * cakraTab — which tab the unified Cakra surface should show.
 *
 * Cakra absorbed the Prompt Generator, Token Counter, Code Editor, and
 * Artifacts as tabs.
 * Their legacy app ids live on as registry *aliases* (so handoffs, automations,
 * and /app/<id> deep-links keep working); opening an alias sets the requested
 * tab here, which CakraShell reads. Kept in `lib` (not the app) so the window
 * store can set it without an app→lib cycle.
 */
import { create } from 'zustand'

export type CakraTab = 'chat' | 'solver' | 'artifacts' | 'prompt' | 'tokens' | 'code'

interface CakraTabState {
  tab: CakraTab
  setTab: (t: CakraTab) => void
}

export const useCakraTab = create<CakraTabState>((set) => ({
  tab: 'chat',
  setTab: (tab) => set({ tab }),
}))

/** Imperative setter for non-React callers (e.g. windowStore.openAppById). */
export function setCakraTab(tab: CakraTab): void {
  useCakraTab.getState().setTab(tab)
}
