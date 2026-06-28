/**
 * Artifacts App — Imperial Suite
 * Top-level window that hosts the Artifact Gallery + immersive artifact launch.
 *
 * Click an artifact in the gallery → slides into fullscreen (within this window).
 * Back button → returns to the gallery grid.
 */
import { useState, useEffect, useCallback } from 'react'
import { ArrowLeft, X } from 'lucide-react'
import ArtifactGallery from './ArtifactGallery'
import FormBuilder from './artifacts/FormBuilder'
import ChartBuilder from './artifacts/ChartBuilder'
import Kanban from './artifacts/Kanban'
import Flashcards from './artifacts/Flashcards'
import MarkdownStudio from './artifacts/MarkdownStudio'
import ColorPalette from './artifacts/ColorPalette'
import { cssVar } from '../../design-system/tokens'

// Lazy-ish: import all statically for instant switching inside this window.
// They're small and self-contained; preloading costs ~5KB total.
// Each artifact carries a distinct design-system accent (matches ArtifactGallery).
const ARTIFACT_RENDERERS: Record<string, { component: any; title: string; accent: string }> = {
  'form-builder':     { component: FormBuilder,     title: 'Form Builder',     accent: cssVar('ion') },
  'chart-builder':    { component: ChartBuilder,    title: 'Chart Builder',    accent: cssVar('signal') },
  'kanban':           { component: Kanban,          title: 'Kanban Board',     accent: cssVar('c-danger') },
  'flashcards':       { component: Flashcards,      title: 'Flashcards',       accent: cssVar('aurora') },
  'markdown-editor':  { component: MarkdownStudio,  title: 'Markdown Studio',  accent: cssVar('c-warn') },
  'color-palette':    { component: ColorPalette,    title: 'Color Palette',    accent: cssVar('plasma') },
}

export default function ArtifactsApp() {
  const [activeId, setActiveId] = useState<string | null>(null)

  const handleLaunch = useCallback((id: string) => {
    if (ARTIFACT_RENDERERS[id]) setActiveId(id)
  }, [])

  const handleClose = useCallback(() => setActiveId(null), [])

  // Keyboard: Esc returns to gallery
  useEffect(() => {
    if (!activeId) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [activeId, handleClose])

  // If launching an artifact, render it fullscreen inside this window
  if (activeId && ARTIFACT_RENDERERS[activeId]) {
    const { component: Component, title, accent } = ARTIFACT_RENDERERS[activeId]
    return (
      <div className="h-screen flex flex-col bg-slate-950 text-white overflow-hidden">
        <div
          className="flex items-center gap-3 px-4 py-2.5 border-b backdrop-blur-sm shrink-0"
          style={{
            background: `linear-gradient(90deg, color-mix(in srgb, ${accent} 8%, transparent), transparent 60%), color-mix(in srgb, var(--void) 50%, transparent)`,
            borderBottomColor: `color-mix(in srgb, ${accent} 19%, transparent)`,
          }}
        >
          <button
            onClick={handleClose}
            className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs transition-colors"
            title="Back to gallery (Esc)"
          >
            <ArrowLeft size={12} /> Gallery
          </button>
          <div className="flex-1" />
          <span
            className="px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider font-bold"
            style={{ background: `color-mix(in srgb, ${accent} 15%, transparent)`, color: accent, border: `1px solid color-mix(in srgb, ${accent} 25%, transparent)` }}
          >
            {title}
          </span>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-rose-500/30 border border-white/10 text-white/70 hover:text-white transition-colors"
            title="Close"
          >
            <X size={12} />
          </button>
        </div>
        <div className="flex-1 overflow-hidden">
          <Component />
        </div>
      </div>
    )
  }

  // Otherwise: show the gallery
  return <ArtifactGallery onLaunch={handleLaunch} />
}
