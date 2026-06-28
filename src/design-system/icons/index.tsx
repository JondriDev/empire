/**
 * The Empire — bespoke "alien" app-icon set.
 *
 * A deliberate Empire-specific EXTENSION of the JondriDev Design System (whose
 * own product marks are emoji): one cohesive family of minimalist, slightly
 * otherworldly monoline glyphs for the desktop shell's app identities.
 *
 * Design language: 24px grid · single 1.5 stroke · round caps/joins · generous
 * negative space · a recurring "orbital node" motif (filled dot on a ring/arc)
 * so the set reads as one alien system rather than literal pictograms.
 *
 * Icons inherit their colour from `currentColor`, so the shell's per-app accent
 * (`style={{ color }}`) and Tailwind sizing (`className="w-7 h-7"`) keep working
 * exactly as they did with the previous Lucide set — the registry just resolves
 * `getAppIcon(key)` here instead.
 *
 * This dir is design-system infrastructure (exempt from the token-violation
 * metric); `currentColor` carries no literal anyway.
 */
import type { FC, SVGProps } from 'react'

export type AppIcon = FC<SVGProps<SVGSVGElement> & { size?: number }>

/** Shared frame: every glyph is drawn in this 24×24 monoline shell. */
const S: AppIcon = ({ children, size, width, height, ...p }) => (
  <svg
    viewBox="0 0 24 24"
    width={width ?? size ?? 24}
    height={height ?? size ?? 24}
    fill="none"
    stroke="currentColor"
    strokeWidth={1.5}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    {...p}
  >
    {children}
  </svg>
)

/** The unifying motif — a solid orbital node. */
const Dot = (props: SVGProps<SVGCircleElement>) => (
  <circle r={1.15} fill="currentColor" stroke="none" {...props} />
)

// ── Glyphs (named by function; mapped to registry icon keys below) ──────────

const Calculator: AppIcon = (p) => (
  <S {...p}>
    <rect x="4.5" y="3" width="15" height="18" rx="3.5" />
    <line x1="8" y1="7" x2="16" y2="7" />
    <Dot cx="9" cy="12" /><Dot cx="13" cy="12" />
    <Dot cx="9" cy="16" /><Dot cx="15" cy="16" />
  </S>
)

const Calendar: AppIcon = (p) => (
  <S {...p}>
    <rect x="4" y="5" width="16" height="15" rx="3.5" />
    <line x1="4" y1="9.5" x2="20" y2="9.5" />
    <line x1="9" y1="3" x2="9" y2="6" /><line x1="15" y1="3" x2="15" y2="6" />
    <circle cx="12" cy="14.5" r="2.4" /><Dot cx="12" cy="14.5" />
  </S>
)

const Clock: AppIcon = (p) => (
  <S {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5 V12 H15.5" />
    <Dot cx="12" cy="3.5" />
  </S>
)

const Weather: AppIcon = (p) => (
  <S {...p}>
    <circle cx="8.5" cy="8" r="3" />
    <path d="M7.5 18 h8.5 a3 3 0 0 0 0.3 -6 a4.3 4.3 0 0 0 -8 -1.2 a3.2 3.2 0 0 0 -0.8 7.2 Z" />
    <Dot cx="16.5" cy="6" />
  </S>
)

const Grammar: AppIcon = (p) => (
  <S {...p}>
    <path d="M4 16 L7.5 7 L11 16" /><line x1="5.4" y1="13" x2="9.6" y2="13" />
    <path d="M13.5 13.5 l2.4 2.4 L21 9.5" />
    <Dot cx="17.5" cy="6.5" />
  </S>
)

const Language: AppIcon = (p) => (
  <S {...p}>
    <circle cx="8.5" cy="8.5" r="5" />
    <path d="M13.5 21 l3.3 -9 l3.3 9 M14.6 18 h4.4" />
    <Dot cx="8.5" cy="8.5" />
  </S>
)

const Music: AppIcon = (p) => (
  <S {...p}>
    <circle cx="7" cy="17" r="2.4" /><circle cx="17" cy="15" r="2.4" />
    <path d="M9.4 17 V6 L19.4 4 V15" />
  </S>
)

const Video: AppIcon = (p) => (
  <S {...p}>
    <rect x="3" y="6" width="13" height="12" rx="3.5" />
    <path d="M16 10 L21 7 V17 L16 14 Z" />
    <path d="M8 9.8 L12.5 12 L8 14.2 Z" />
  </S>
)

const Files: AppIcon = (p) => (
  <S {...p}>
    <path d="M3.5 7.5 a2 2 0 0 1 2 -2 h3.4 l2 2.5 h7.6 a2 2 0 0 1 2 2 v6.5 a2 2 0 0 1 -2 2 H5.5 a2 2 0 0 1 -2 -2 Z" />
    <Dot cx="12" cy="14" />
  </S>
)

const Cache: AppIcon = (p) => (
  <S {...p}>
    <path d="M5 7 h14" />
    <path d="M9 7 V5.6 a1.6 1.6 0 0 1 1.6 -1.6 h2.8 a1.6 1.6 0 0 1 1.6 1.6 V7" />
    <path d="M6.7 7 l1 11.4 a2 2 0 0 0 2 1.6 h4.6 a2 2 0 0 0 2 -1.6 l1 -11.4" />
    <Dot cx="12" cy="13.5" />
  </S>
)

const Browser: AppIcon = (p) => (
  <S {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <ellipse cx="12" cy="12" rx="3.6" ry="8.5" />
    <line x1="3.5" y1="12" x2="20.5" y2="12" />
    <Dot cx="12" cy="12" />
  </S>
)

const Editor: AppIcon = (p) => (
  <S {...p}>
    <path d="M8.5 7.5 L4 12 L8.5 16.5" />
    <path d="M15.5 7.5 L20 12 L15.5 16.5" />
    <Dot cx="12" cy="12" />
  </S>
)

const Notes: AppIcon = (p) => (
  <S {...p}>
    <path d="M5 5.5 a1.5 1.5 0 0 1 1.5 -1.5 h11 a1.5 1.5 0 0 1 1.5 1.5 v7.5 l-6 6 H6.5 A1.5 1.5 0 0 1 5 18.5 Z" />
    <path d="M19 13 h-4.5 a1.5 1.5 0 0 0 -1.5 1.5 V19" />
    <line x1="8.5" y1="9" x2="15" y2="9" />
  </S>
)

const Photos: AppIcon = (p) => (
  <S {...p}>
    <rect x="4" y="4" width="16" height="16" rx="3.5" />
    <circle cx="9" cy="9.5" r="1.7" />
    <path d="M4.5 17 L10 12.5 L14 16 L17 13.2 L19.5 15.5" />
  </S>
)

const Datacenter: AppIcon = (p) => (
  <S {...p}>
    <ellipse cx="12" cy="6" rx="7" ry="2.6" />
    <path d="M5 6 V12 c0 1.4 3.1 2.6 7 2.6 s7 -1.2 7 -2.6 V6" />
    <path d="M5 12 V18 c0 1.4 3.1 2.6 7 2.6 s7 -1.2 7 -2.6 V12" />
  </S>
)

const Maps: AppIcon = (p) => (
  <S {...p}>
    <path d="M12 21 c-4 -5 -6.5 -8 -6.5 -11 a6.5 6.5 0 0 1 13 0 c0 3 -2.5 6 -6.5 11 Z" />
    <circle cx="12" cy="10" r="2.3" />
  </S>
)

const Messages: AppIcon = (p) => (
  <S {...p}>
    <path d="M5.5 4 h13 A2.5 2.5 0 0 1 21 6.5 v7 A2.5 2.5 0 0 1 18.5 16 H11 l-4.5 4 v-4 H5.5 A2.5 2.5 0 0 1 3 13.5 v-7 A2.5 2.5 0 0 1 5.5 4 Z" />
    <Dot cx="8.5" cy="10" /><Dot cx="12" cy="10" /><Dot cx="15.5" cy="10" />
  </S>
)

const Prompt: AppIcon = (p) => (
  <S {...p}>
    <path d="M5 19 L14.5 9.5" />
    <path d="M16 4 l1 2.2 2.2 1 -2.2 1 -1 2.2 -1 -2.2 -2.2 -1 2.2 -1 Z" />
    <Dot cx="7.5" cy="6.5" /><Dot cx="19" cy="14" />
  </S>
)

const Tokens: AppIcon = (p) => (
  <S {...p}>
    <line x1="9.5" y1="4" x2="7.5" y2="20" />
    <line x1="16.5" y1="4" x2="14.5" y2="20" />
    <line x1="4.5" y1="9" x2="20" y2="9" />
    <line x1="4" y1="15" x2="19.5" y2="15" />
  </S>
)

const Learning: AppIcon = (p) => (
  <S {...p}>
    <path d="M2.5 9 L12 5 L21.5 9 L12 13 Z" />
    <path d="M6 11 V15.5 c0 1.4 2.7 2.5 6 2.5 s6 -1.1 6 -2.5 V11" />
    <path d="M21.5 9 V13.5" /><Dot cx="21.5" cy="14" />
  </S>
)

const Goals: AppIcon = (p) => (
  <S {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <circle cx="12" cy="12" r="4.4" />
    <Dot cx="12" cy="12" />
    <line x1="12" y1="0.8" x2="12" y2="3.2" /><line x1="20.8" y1="12" x2="23.2" y2="12" />
  </S>
)

const Artifacts: AppIcon = (p) => (
  <S {...p}>
    <path d="M12 3.5 a8.5 8.5 0 1 0 0 17 a2.2 2.2 0 0 0 1.9 -3.3 a2 2 0 0 1 1.8 -3 H17.2 a3.8 3.8 0 0 0 3.8 -4 A8.6 8.6 0 0 0 12 3.5 Z" />
    <Dot cx="8" cy="9" /><Dot cx="12" cy="7.3" /><Dot cx="15.5" cy="9" />
  </S>
)

const NetworkIcon: AppIcon = (p) => (
  <S {...p}>
    <circle cx="12" cy="12.5" r="2.3" />
    <circle cx="12" cy="4.5" r="2.2" />
    <circle cx="5" cy="18" r="2.2" />
    <circle cx="19" cy="18" r="2.2" />
    <path d="M12 6.7 V10.2 M10.2 13.9 L6.4 16.4 M13.8 13.9 L17.6 16.4" />
  </S>
)

const InboxIcon: AppIcon = (p) => (
  <S {...p}>
    <path d="M4 13 L6.6 5.8 A1.6 1.6 0 0 1 8.1 4.7 h7.8 a1.6 1.6 0 0 1 1.5 1.1 L20 13 v3.5 a2 2 0 0 1 -2 2 H6 a2 2 0 0 1 -2 -2 Z" />
    <path d="M4 13 h4 a1 1 0 0 1 1 1 a3 3 0 0 0 6 0 a1 1 0 0 1 1 -1 h4" />
  </S>
)

/** Cakra — the flagship AI. A wheel/orbit (cakra = wheel): core node, ring,
 *  cardinal spokes, and one orbiting satellite. */
const Cakra: AppIcon = (p) => (
  <S {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <circle cx="12" cy="12" r="2.4" />
    <path d="M12 3.5 V9.6 M12 14.4 V20.5 M3.5 12 H9.6 M14.4 12 H20.5" />
    <Dot cx="18" cy="6" />
  </S>
)

/** Fallback — the bare orbital node. */
const Node: AppIcon = (p) => (
  <S {...p}>
    <circle cx="12" cy="12" r="6.5" />
    <Dot cx="12" cy="12" />
    <Dot cx="19.5" cy="7.5" />
  </S>
)

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
  cakra: Cakra,
}

export const FallbackIcon: AppIcon = Node

/** Resolve an app's icon component by its registry `icon` key. */
export function getAppIcon(key: string): AppIcon {
  return alienIcons[key] ?? FallbackIcon
}
