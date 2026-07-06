/**
 * ArtifactViewer — full-screen bottom-sheet that previews one generated
 * artifact in the sandboxed ArtifactFrame. Lazy-loaded on first open (from
 * ArtifactCard / the gallery) so transcripts don't pay for it.
 *
 * Header: title + type badge, Copy (source), optional Save, Close.
 * Esc closes. Save wiring arrives with the artifact store (gallery stage);
 * until a caller passes `onSave`, the button simply isn't rendered.
 */
import { useEffect, useState } from 'react'
import { Check, Copy, Save, X } from 'lucide-react'
import type { ArtifactSpec } from '../../cakra/lib/artifactProtocol'
import { cssVar, tint } from '../../../design-system/tokens'
import { useLang } from '../../../lib/i18n'
import ArtifactFrame from './ArtifactFrame'

interface Props {
  artifact: ArtifactSpec
  onClose: () => void
  /** When provided, shows a Save action (gallery persistence). */
  onSave?: () => void
  /** True once this artifact is already in the gallery. */
  saved?: boolean
}

export default function ArtifactViewer({ artifact, onClose, onSave, saved }: Props) {
  const { t } = useLang()
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(artifact.content)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      /* clipboard unavailable (http, permissions) — silently ignore */
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col justify-end"
      style={{ background: tint('void', 70), backdropFilter: 'blur(4px)' }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={artifact.title}
    >
      <div
        className="flex flex-col w-full h-[94%] rounded-t-2xl overflow-hidden animate-slide-up"
        style={{ background: cssVar('abyss'), border: '1px solid var(--border)', borderBottom: 'none' }}
        onClick={e => e.stopPropagation()}
      >
        <div
          className="flex items-center gap-2 px-3 py-2 border-b shrink-0"
          style={{ borderColor: 'var(--border)' }}
        >
          <span
            className="px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider font-bold shrink-0"
            style={{
              background: 'color-mix(in srgb, var(--c-cakra) 15%, transparent)',
              color: 'var(--c-cakra)',
            }}
          >
            {artifact.type}
          </span>
          <h2 className="flex-1 min-w-0 truncate text-sm font-semibold" style={{ color: cssVar('text') }}>
            {artifact.title}
          </h2>
          <button
            onClick={handleCopy}
            className="press p-2 rounded-lg transition-colors"
            style={{ color: copied ? cssVar('c-success') : cssVar('text2'), background: tint('xenon', 7) }}
            title={t('artifacts.copy')}
            aria-label={t('artifacts.copy')}
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          </button>
          {onSave && (
            <button
              onClick={onSave}
              disabled={saved}
              className="press flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors"
              style={saved
                ? { color: cssVar('c-success'), background: tint('c-success', 12) }
                : { color: cssVar('void'), background: 'var(--c-cakra)' }}
            >
              {saved ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
              {saved ? t('artifacts.saved') : t('artifacts.save')}
            </button>
          )}
          <button
            onClick={onClose}
            className="press p-2 rounded-lg transition-colors"
            style={{ color: cssVar('text2'), background: tint('xenon', 7) }}
            title={`${t('artifacts.close')} (Esc)`}
            aria-label={t('artifacts.close')}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 min-h-0">
          <ArtifactFrame type={artifact.type} content={artifact.content} title={artifact.title} />
        </div>
      </div>
    </div>
  )
}
