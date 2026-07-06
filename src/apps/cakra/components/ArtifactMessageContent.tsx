/**
 * ArtifactMessageContent — renders an assistant message that contains
 * artifact fences. Text segments go through the host surface's own
 * `renderText` (so each chat keeps its formatting), artifact segments
 * become tappable ArtifactCards. Hosts gate on `hasArtifacts(content)`
 * and keep their plain fast path for ordinary messages.
 */
import { Fragment, useMemo, type ReactNode } from 'react'
import { parseArtifactSegments } from '../lib/artifactProtocol'
import ArtifactCard from './ArtifactCard'

interface Props {
  content: string
  /** True while this message is still streaming in. */
  streaming?: boolean
  /** How the host renders plain text (markdown-lite, pre-wrap, …). */
  renderText: (text: string) => ReactNode
}

export default function ArtifactMessageContent({ content, streaming = false, renderText }: Props) {
  const segments = useMemo(() => parseArtifactSegments(content), [content])
  return (
    <>
      {segments.map((seg, i) =>
        seg.kind === 'text'
          ? <Fragment key={i}>{renderText(seg.text)}</Fragment>
          : <ArtifactCard key={i} artifact={seg.artifact} streaming={streaming} />
      )}
    </>
  )
}
