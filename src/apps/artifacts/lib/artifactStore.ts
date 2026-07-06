/**
 * artifactStore — persistence for Cakra-GENERATED artifacts.
 *
 * Storage rail (bookStore/mediaStore pattern): the meta array lives in
 * localStorage under `empire-artifacts-generated`; each artifact's content
 * is a Blob in IndexedDB (lib/mediaStore) keyed `artifact:<id>`. When the
 * IDB write fails (private mode, jsdom), the content is kept `inline` in
 * the meta instead, so saving never silently loses work.
 *
 * DISTINCT from the six built-in gallery tools: their own
 * `empire-artifact-*` localStorage keys are theirs and are never touched.
 */
import { deleteMedia, getMedia, putMedia } from '../../../lib/mediaStore'
import { emit } from '../../../lib/eventBus'
import type { ArtifactType } from '../../cakra/lib/artifactProtocol'

export const GENERATED_KEY = 'empire-artifacts-generated'

export interface GeneratedArtifactMeta {
  id: string
  type: ArtifactType
  title: string
  createdAt: number
  updatedAt: number
  /** Content size in bytes. */
  size: number
  /** Fallback: full content kept inline when IndexedDB was unavailable. */
  inline?: string
}

const blobKey = (id: string) => `artifact:${id}`

export function newArtifactId(now = Date.now()): string {
  return `art-${now.toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

/** All saved artifact metas, newest first. Tolerates corrupt storage. */
export function listGenerated(): GeneratedArtifactMeta[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(GENERATED_KEY) ?? '[]')
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeMetas(metas: GeneratedArtifactMeta[]): void {
  try {
    localStorage.setItem(GENERATED_KEY, JSON.stringify(metas))
  } catch {
    /* quota exceeded — keep the in-memory state, drop persistence */
  }
}

/** Persist one generated artifact; returns its meta (newest-first list head). */
export async function saveGenerated(artifact: {
  type: ArtifactType
  title: string
  content: string
}): Promise<GeneratedArtifactMeta> {
  const now = Date.now()
  const id = newArtifactId(now)
  const blob = new Blob([artifact.content], { type: 'text/plain' })
  const meta: GeneratedArtifactMeta = {
    id,
    type: artifact.type,
    title: artifact.title,
    createdAt: now,
    updatedAt: now,
    size: blob.size,
  }
  const stored = await putMedia(blobKey(id), blob)
  if (!stored) meta.inline = artifact.content
  writeMetas([meta, ...listGenerated()])
  emit({ type: 'ARTIFACT_CREATED', artifactId: id, title: meta.title, artifactType: meta.type })
  return meta
}

/** Recover an artifact's content, or null if it (or its blob) is gone. */
export async function getGeneratedContent(id: string): Promise<string | null> {
  const meta = listGenerated().find(m => m.id === id)
  if (!meta) return null
  if (meta.inline != null) return meta.inline
  const blob = await getMedia(blobKey(id))
  return blob ? blob.text() : null
}

/** Rename in place; returns the updated list. */
export function renameGenerated(id: string, title: string): GeneratedArtifactMeta[] {
  const metas = listGenerated().map(m =>
    m.id === id ? { ...m, title, updatedAt: Date.now() } : m,
  )
  writeMetas(metas)
  return metas
}

/** Remove meta + backing blob; returns the updated list. */
export async function deleteGenerated(id: string): Promise<GeneratedArtifactMeta[]> {
  const metas = listGenerated().filter(m => m.id !== id)
  writeMetas(metas)
  await deleteMedia(blobKey(id))
  return metas
}
