/**
 * The Empire — alien app-icon barrel.
 *
 * The glyph *components* live in `./glyphs` (a pure component module, so React
 * Fast Refresh stays happy). This barrel holds the non-component surface — the
 * registry-key → glyph map and the `getAppIcon` resolver — kept in a `.ts` file
 * with NO component export so `react-refresh/only-export-components` never fires
 * (the rule only flags non-component exports when a file ALSO exports a
 * component). Same split precedent as `network/nodeColors.ts`.
 *
 * Public surface is unchanged: consumers still
 *   `import { getAppIcon, type AppIcon } from '../design-system/icons'`.
 */
import {
  Calculator,
  Calendar,
  Clock,
  Weather,
  Grammar,
  Language,
  Music,
  Video,
  Files,
  Cache,
  Browser,
  Editor,
  Notes,
  Photos,
  Datacenter,
  Maps,
  Messages,
  Prompt,
  Tokens,
  Learning,
  Goals,
  Artifacts,
  NetworkIcon,
  InboxIcon,
  Reader,
  Cakra,
  Search,
  Timeline,
  Node,
} from './glyphs'
import type { AppIcon } from './glyphs'

export type { AppIcon }

/** Map registry `icon` keys → alien glyphs. (Keys preserved from the prior
 *  Lucide names to avoid registry churn; `cakra` is the renamed AI app.) */
export const alienIcons: Record<string, AppIcon> = {
  Calculator,
  Calendar,
  Clock,
  CloudSun: Weather,
  SpellCheck: Grammar,
  Languages: Language,
  Music,
  Video,
  Folder: Files,
  Trash2: Cache,
  Globe: Browser,
  Code2: Editor,
  StickyNote: Notes,
  Image: Photos,
  Database: Datacenter,
  MapPin: Maps,
  MessageSquare: Messages,
  Wand2: Prompt,
  Hash: Tokens,
  GraduationCap: Learning,
  Target: Goals,
  Palette: Artifacts,
  Network: NetworkIcon,
  Inbox: InboxIcon,
  Reader,
  cakra: Cakra,
  Search,
  Timeline,
}

/** The bare orbital node, shown when a registry `icon` key has no glyph. */
const FallbackIcon: AppIcon = Node

/** Resolve an app's icon component by its registry `icon` key. */
export function getAppIcon(key: string): AppIcon {
  return alienIcons[key] ?? FallbackIcon
}
