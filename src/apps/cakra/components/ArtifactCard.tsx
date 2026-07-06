/**
 * ArtifactCard — the tappable in-transcript card for a generated artifact.
 *
 * No iframe here: the sandboxed preview only exists inside ArtifactViewer,
 * which is lazy-loaded on first tap so the chat transcript stays light.
 * While the fence is still open (`complete:false`) the card shows a
 * building state — "Building artifact…" if the reply is still streaming,
 * "Interrupted" if the stream ended mid-fence.
 */
import { Suspense, lazy, useState } from 'react'
import { AppWindow, ChevronRight, FileText, Loader2, Shapes } from 'lucide-react'
import type { ArtifactSpec, ArtifactType } from '../lib/artifactProtocol'
import { cssVar, tint } from '../../../design-system/tokens'

const ArtifactViewer = lazy(() => import('../../artifacts/generated/ArtifactViewer'))

const TYPE_ICONS: Record<ArtifactType, typeof AppWindow> = {
  html: AppWindow,
  svg: Shapes,
  markdown: FileText,
}

interface Props {
  artifact: ArtifactSpec
  /** True while the assistant reply is still streaming in. */
  streaming?: boolean
}

export default function ArtifactCard({ artifact, streaming = false }: Props) {
  const [open, setOpen] = useState(false)
  const building = !artifact.complete && streaming
  const interrupted = !artifact.complete && !streaming
  const Icon = TYPE_ICONS[artifact.type]

  const status = building
    ? 'Building artifact…'
    : interrupted
      ? 'Interrupted — partial content'
      : `Ready · tap to open · ${artifact.type}`

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        disabled={building}
        className="press flex items-center gap-3 w-full max-w-md my-2 px-3 py-2.5 rounded-xl text-left transition-colors"
        style={{
          background: 'color-mix(in srgb, var(--c-cakra) 8%, transparent)',
          border: '1px solid color-mix(in srgb, var(--c-cakra) 22%, transparent)',
        }}
      >
        <span
          className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: 'color-mix(in srgb, var(--c-cakra) 15%, transparent)', color: 'var(--c-cakra)' }}
        >
          {building
            ? <Loader2 className="w-4 h-4 animate-spin" />
            : <Icon className="w-4 h-4" />}
        </span>
        <span className="flex-1 min-w-0">
          <span className="block truncate text-sm font-medium" style={{ color: cssVar('text') }}>
            {artifact.title}
          </span>
          <span
            className="block text-xs"
            style={{ color: interrupted ? cssVar('c-warn') : cssVar('text2') }}
          >
            {status}
          </span>
        </span>
        {!building && <ChevronRight className="w-4 h-4 shrink-0" style={{ color: tint('xenon', 40) }} />}
      </button>

      {open && (
        <Suspense fallback={null}>
          <ArtifactViewer artifact={artifact} onClose={() => setOpen(false)} />
        </Suspense>
      )}
    </>
  )
}
