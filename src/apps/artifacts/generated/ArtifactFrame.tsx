/**
 * ArtifactFrame — the sandboxed preview iframe for generated artifacts.
 *
 * SECURITY INVARIANT: `sandbox="allow-scripts"` and NOTHING else. Never add
 * `allow-same-origin` — the opaque origin is what keeps untrusted artifact
 * code away from the app's DOM, localStorage, and IndexedDB. Network is
 * denied by the CSP that buildArtifactSrcDoc injects; `allow=""` +
 * `referrerPolicy="no-referrer"` close the remaining leaks.
 */
import { useMemo } from 'react'
import type { ArtifactType } from '../../cakra/lib/artifactProtocol'
import { buildArtifactSrcDoc } from './artifactRender'

interface Props {
  type: ArtifactType
  content: string
  title: string
}

export default function ArtifactFrame({ type, content, title }: Props) {
  const srcDoc = useMemo(() => buildArtifactSrcDoc({ type, content }), [type, content])
  return (
    <iframe
      sandbox="allow-scripts"
      srcDoc={srcDoc}
      referrerPolicy="no-referrer"
      allow=""
      title={title}
      className="w-full h-full"
      style={{ border: 'none', background: 'var(--bg)' }}
    />
  )
}
