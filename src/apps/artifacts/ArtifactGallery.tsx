/**
 * Artifact Gallery — Imperial Suite
 * Showcase and launcher for all self-contained mini-apps
 * (form builder, chart builder, kanban, flashcards, markdown editor, color palette).
 *
 * Each card opens its artifact in an immersive fullscreen mode inside the Empire
 * window. Designed to feel like the macOS Launchpad for builders.
 */
import { useState } from 'react'
import { FormInput, BarChart3, Columns, GraduationCap, FileText, Palette, Sparkles, ArrowRight, Star, Zap, Code2 } from 'lucide-react'
import { cssVar } from '../../design-system/tokens'

type IconKey = 'form' | 'chart' | 'kanban' | 'flash' | 'markdown' | 'palette'

interface ArtifactMeta {
  id: string
  icon: IconKey
  title: string
  tagline: string
  description: string
  accent: string
  badges: string[]
  preview: string
  highlight?: boolean
}

const ICONS: Record<IconKey, any> = {
  form: FormInput,
  chart: BarChart3,
  kanban: Columns,
  flash: GraduationCap,
  markdown: FileText,
  palette: Palette,
}

const ARTIFACTS: ArtifactMeta[] = [
  {
    id: 'form-builder',
    icon: 'form',
    title: 'Form Builder',
    tagline: 'Drag, drop, deploy.',
    description: 'Design a custom form with a growing palette of field types. Live preview, JSON export, fully responsive output.',
    accent: cssVar('ion'),
    badges: ['Drag & Drop', 'Live Preview', 'Export JSON'],
    preview: '▢  Full Name      ▢▢▢▢▢▢\n▢  Email          ▢▢▢▢▢▢\n▢  Date           ▢▢/▢▢/▢▢\n    [+ Add Field]',
    highlight: true,
  },
  {
    id: 'chart-builder',
    icon: 'chart',
    title: 'Chart Builder',
    tagline: 'Data talks, charts listen.',
    description: 'Sandbox for live charts. Bar, line, pie — switch modes in a click, edit data inline, export to SVG.',
    accent: cssVar('signal'),
    badges: ['Bar', 'Line', 'Pie', 'SVG Export'],
    preview: '  ▆ ▇ ▅ █ ▊ ▌\n  Jan Feb Mar Apr\n  ▁▂▃▄▅▆▇  •••',
  },
  {
    id: 'kanban',
    icon: 'kanban',
    title: 'Kanban Board',
    tagline: 'Tasks, in motion.',
    description: 'Three-column board with drag-to-reorder, auto-save to localStorage, colored tags, and instant add.',
    accent: cssVar('c-danger'),
    badges: ['Drag & Drop', 'Auto-save', 'Tags'],
    preview: '┌─To Do──┬─Doing─┬─Done──┐\n│ Task A │ Task C │Task E │\n│ Task B │ Task D │      │\n└────────┴───────┴───────┘',
  },
  {
    id: 'flashcards',
    icon: 'flash',
    title: 'Flashcards',
    tagline: 'Learn. Flip. Repeat.',
    description: 'Spaced-repetition decks. Build your own or pick from the sample library. Track what you know.',
    accent: cssVar('aurora'),
    badges: ['Spaced Rep', 'Custom Decks', 'Mastery Tracking'],
    preview: '┌─────────────────┐\n│ What is a      │\n│   closure?     │\n│      FLIP  →   │\n└─────────────────┘',
  },
  {
    id: 'markdown-editor',
    icon: 'markdown',
    title: 'Markdown Studio',
    tagline: 'Write beautifully.',
    description: 'Split-pane markdown editor with live preview, syntax hints, copy-to-clipboard, and .md download.',
    accent: cssVar('c-warn'),
    badges: ['Live Preview', 'Split Pane', 'Download .md'],
    preview: '# Hello\n **bold** *italic*\n - one\n - two\n ```code```',
    highlight: true,
  },
  {
    id: 'color-palette',
    icon: 'palette',
    title: 'Color Palette',
    tagline: 'Harmony, swatched.',
    description: 'Generate beautiful palettes from base colors across complementary, triadic, analogous, and more.',
    accent: cssVar('plasma'),
    badges: ['7 Harmonies', 'Copy HEX', 'Export CSS'],
    preview: '■ ■ ■ ■ ■\n■ ■ ■ ■ ■\n■ ■ ■ ■ ■\n▦ 7 harmonies',
    highlight: true,
  },
]

export default function ArtifactGallery({ onLaunch }: { onLaunch?: (id: string) => void }) {
  const [hovered, setHovered] = useState<string | null>(null)

  return (
    <div className="h-full overflow-auto bg-gradient-to-br from-void via-ion/20 to-void text-fg">
      {/* Hero */}
      <div className="relative px-8 pt-10 pb-8 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none opacity-40">
          <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full bg-ion/20 blur-3xl" />
          <div className="absolute top-20 right-1/4 w-80 h-80 rounded-full bg-danger/15 blur-3xl" />
        </div>

        <div className="relative max-w-6xl mx-auto">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles size={18} className="text-ion" />
            <span className="text-xs uppercase tracking-[0.25em] text-ion font-semibold">Imperial Suite</span>
          </div>
          <h1 className="text-5xl font-black tracking-tight mb-2 bg-gradient-to-r from-xenon via-ion to-ion bg-clip-text text-transparent">
            Artifacts
          </h1>
          <p className="text-muted text-lg max-w-2xl">
            Self-contained mini-apps for makers. Drag, build, ship — every artifact is an entire tool in your pocket.
          </p>
          <div className="mt-4 flex items-center gap-4 text-xs text-faint">
            <span className="flex items-center gap-1.5"><Zap size={12} className="text-warn" /> 6 artifacts</span>
            <span className="flex items-center gap-1.5"><Code2 size={12} className="text-signal" /> All client-side</span>
            <span className="flex items-center gap-1.5"><Star size={12} className="text-danger" /> 3 highlighted this week</span>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="px-8 pb-12">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {ARTIFACTS.map((a, i) => {
            const Icon = ICONS[a.icon]
            const isHovered = hovered === a.id
            return (
              <button
                key={a.id}
                onMouseEnter={() => setHovered(a.id)}
                onMouseLeave={() => setHovered(null)}
                onClick={() => onLaunch?.(a.id)}
                className="group relative text-left rounded-2xl border border-hair bg-glass/[0.03] backdrop-blur p-5 hover:bg-glass/[0.06] hover:border-hair transition-all duration-300 hover:-translate-y-1 overflow-hidden animate-fadeIn"
                style={{
                  animationDelay: `${i * 60}ms`,
                  animationFillMode: 'both',
                } as any}
              >
                {/* Highlight ribbon */}
                {a.highlight && (
                  <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-0.5 rounded-full bg-warn/15 border border-warn/30 text-warn text-[10px] uppercase tracking-wider font-bold">
                    <Star size={9} fill="currentColor" /> New
                  </div>
                )}

                {/* Glow blob */}
                <div
                  className="absolute -top-12 -right-12 w-40 h-40 rounded-full blur-3xl opacity-30 group-hover:opacity-50 transition-opacity duration-500"
                  style={{ background: a.accent }}
                />

                {/* Header */}
                <div className="relative flex items-start justify-between mb-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg"
                    style={{
                      background: `linear-gradient(135deg, ${a.accent}, color-mix(in srgb, ${a.accent} 50%, transparent))`,
                      boxShadow: `0 8px 24px color-mix(in srgb, ${a.accent} 19%, transparent)`,
                    }}
                  >
                    <Icon size={22} className="text-fg" />
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <ArrowRight size={18} className="text-muted group-hover:text-fg group-hover:translate-x-1 transition-all" />
                  </div>
                </div>

                {/* Title + tagline */}
                <div className="relative mb-2">
                  <h3 className="text-xl font-bold tracking-tight">{a.title}</h3>
                  <p className="text-xs font-mono text-faint mt-0.5">{a.tagline}</p>
                </div>

                {/* Description */}
                <p className="relative text-sm text-muted leading-relaxed mb-4">
                  {a.description}
                </p>

                {/* Preview */}
                <div
                  className="relative rounded-lg p-3 mb-3 font-mono text-xs whitespace-pre text-muted border border-hair"
                  style={{
                    background: `linear-gradient(135deg, color-mix(in srgb, ${a.accent} 6%, transparent), transparent)`,
                  }}
                >
                  {a.preview}
                </div>

                {/* Badges */}
                <div className="relative flex flex-wrap gap-1.5">
                  {a.badges.map(b => (
                    <span
                      key={b}
                      className="px-2 py-0.5 rounded-full bg-glass border border-hair text-muted text-[10px] uppercase tracking-wider"
                      style={isHovered ? { color: a.accent, borderColor: `color-mix(in srgb, ${a.accent} 25%, transparent)` } : {}}
                    >
                      {b}
                    </span>
                  ))}
                </div>
              </button>
            )
          })}
        </div>

        {/* Footer */}
        <div className="max-w-6xl mx-auto mt-10 text-center text-xs text-faint">
          Tap any tile to launch · All artifacts are standalone and save data locally to your browser
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn { animation: fadeIn 0.5s ease-out; }
      `}</style>
    </div>
  )
}
