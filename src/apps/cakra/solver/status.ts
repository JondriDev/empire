/**
 * Cakra Solver — status glyphs shared by the panel and detail views.
 * Lives outside the component files so react-refresh stays happy.
 */
import type { Problem } from './types'

export const STATUS_GLYPH: Record<Problem['status'], string> = {
  open: '○',
  analyzing: '◐',
  decomposed: '🧩',
  planned: '📋',
  solved: '✅',
  blocked: '🚫',
}
