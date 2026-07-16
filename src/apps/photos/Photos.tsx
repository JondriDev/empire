import { useState, useEffect, useRef, useCallback } from 'react'
import { Card, Button, IconButton, Segmented, Input } from '../../components/ui'
import { emit } from '../../lib/eventBus'
import { mirrorCollection } from '../../lib/core/sync'
import { NodeActions } from '../../components/ui/NodeActions'
import { EmptyState } from '../../components/ui/Utility'
import { onActivate } from '../../lib/a11y'
import {
  putMedia, deleteMedia, loadMediaUrls,
  toStorableMeta, rehydrateMedia, shouldPersistBlob,
  type MediaRecord, type StoredMeta,
} from '../../lib/mediaStore'
import {
 Image, Upload, Trash2, ChevronLeft,
 ChevronRight, X, Heart, Download,
 Maximize2, LayoutGrid, List, Search
} from 'lucide-react'

interface Photo extends MediaRecord {
  id: string
  src: string
  name: string
  size: number
  width?: number
  height?: number
  date: string
  tags: string[]
  favorite: boolean
  /** too large to persist — viewable this session, won't survive a reload. */
  ephemeral?: boolean
}

const PHOTOS_KEY = 'empire-photos'

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const GRID_SIZES = [2, 3, 4, 6]

export default function Photos() {
  const [photos, setPhotos] = useState<Photo[]>([])
  const [selected, setSelected] = useState<string | null>(null)
  const [lightboxIdx, setLightboxIdx] = useState(-1)
  const [gridSize, setGridSize] = useState(3)
  const [filter, setFilter] = useState<'all' | 'favorites'>('all')
  const [searchTag, setSearchTag] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const fileInputRef = useRef<HTMLInputElement>(null)
  // Gate persistence until the async rehydrate finishes, so the initial empty
  // render never overwrites the saved library before its blobs are recovered.
  const hydratedRef = useRef(false)

  useEffect(() => {
    emit({ type: 'APP_OPENED', appId: 'photos' })
    let cancelled = false
    // Restore metadata from localStorage, then recover real image blobs from
    // IndexedDB and mint fresh object URLs — photos whose blob is gone are
    // dropped (no broken-image ghosts, the bug this stage fixes).
    ;(async () => {
      let meta: Array<StoredMeta<Photo>> = []
      try {
        const saved = localStorage.getItem(PHOTOS_KEY)
        if (saved) meta = JSON.parse(saved)
      } catch { /* ignore */ }
      const ids = Array.isArray(meta) ? meta.map(m => m.id) : []
      const urls = await loadMediaUrls(ids)
      const restored = rehydrateMedia<Photo>(Array.isArray(meta) ? meta : [], id => urls.get(id) ?? null)
      if (!cancelled) {
        setPhotos(restored)
        hydratedRef.current = true
      }
    })()
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    if (!hydratedRef.current) return
    try { localStorage.setItem(PHOTOS_KEY, JSON.stringify(toStorableMeta(photos))) } catch { /* ignore */ }
  }, [photos])

  // Mirror photos into the Core graph as `photo` nodes so they join the
  // organism (object URLs are transient, so the node carries name/size/tags,
  // not the url). Gate on hydration (same as the persist effect): the async IDB
  // rehydrate leaves `photos` empty on the first render, and an ungated mirror
  // would prune every persisted `photo` node — scrubbing edges + churning ids —
  // before the real library is recovered.
  useEffect(() => {
    if (!hydratedRef.current) return
    mirrorCollection('photo', 'photos', photos, {
      id: p => p.id,
      title: p => p.name,
      data: p => ({ size: p.size, tags: p.tags, favorite: p.favorite, date: p.date }),
    })
  }, [photos])

  const addFiles = useCallback((files: FileList | null) => {
    if (!files) return
    const imgs = Array.from(files).filter(f => f.type.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(f.name))
    if (!imgs.length) return

    const newPhotos: Photo[] = imgs.map(file => {
      const src = URL.createObjectURL(file)
      const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`
      // Persist the real bytes to IndexedDB so the photo survives a reload; skip
      // oversized files (quota) and keep them session-only (ephemeral).
      const ephemeral = !shouldPersistBlob(file.size)
      if (!ephemeral) void putMedia(id, file)
      return {
        id,
        src,
        name: file.name,
        size: file.size,
        date: new Date().toISOString(),
        tags: [],
        favorite: false,
        ephemeral,
      }
    })

    // Get dimensions
    newPhotos.forEach(photo => {
      const img = new window.Image()
      img.onload = () => {
        setPhotos(prev => prev.map(p =>
          p.id === photo.id ? { ...p, width: img.naturalWidth, height: img.naturalHeight } : p
        ))
      }
      img.onerror = () => { /* keep default dimensions if the blob can't decode */ }
      img.src = photo.src
    })

    setPhotos(prev => [...prev, ...newPhotos])
  }, [])

  const toggleFavorite = (id: string) => {
    setPhotos(prev => prev.map(p => p.id === id ? { ...p, favorite: !p.favorite } : p))
  }

  const deletePhoto = (id: string) => {
    const photo = photos.find(p => p.id === id)
    if (photo) URL.revokeObjectURL(photo.src)
    void deleteMedia(id)
    setPhotos(prev => prev.filter(p => p.id !== id))
    if (selected === id) setSelected(null)
    // lightboxIdx indexes the *filtered* list (what the lightbox paginates), so
    // the currently-viewed photo is filtered[lightboxIdx] — comparing against
    // photos[lightboxIdx] would test the wrong item once a filter/search is on.
    if (lightboxIdx >= 0 && filtered[lightboxIdx]?.id === id) closeLightbox()
  }

  const deleteSelected = () => {
    if (!selected) return
    deletePhoto(selected)
    setSelected(null)
  }

  const openLightbox = (idx: number) => {
    setLightboxIdx(idx)
    document.body.style.overflow = 'hidden'
  }

  const closeLightbox = () => {
    setLightboxIdx(-1)
    document.body.style.overflow = ''
  }

  const filtered = photos
    .filter(p => filter === 'favorites' ? p.favorite : true)
    .filter(p => !searchTag || p.tags.some(t => t.toLowerCase().includes(searchTag.toLowerCase())) || p.name.toLowerCase().includes(searchTag.toLowerCase()))

  const lightboxPrev = useCallback(() => setLightboxIdx(i => (i - 1 + filtered.length) % filtered.length), [filtered.length])
  const lightboxNext = useCallback(() => setLightboxIdx(i => (i + 1) % filtered.length), [filtered.length])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (lightboxIdx < 0) return
      if (e.key === 'Escape') closeLightbox()
      if (e.key === 'ArrowLeft') lightboxPrev()
      if (e.key === 'ArrowRight') lightboxNext()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [lightboxIdx, lightboxPrev, lightboxNext])

  const allTags = [...new Set(photos.flatMap(p => p.tags))].sort()

  const currentLightboxPhoto = lightboxIdx >= 0 ? filtered[lightboxIdx] : null

  // Honest empty state: distinguish an empty library from a filter/search that
  // matched nothing (a search over a non-empty library, or Favorites with none),
  // so the copy never claims "No photos yet" when photos actually exist.
  const empty = photos.length === 0
    ? { title: 'No photos yet', description: 'Import images to get started — every photo also becomes a node in The Network.' }
    : searchTag
    ? { title: 'No matches', description: `No photo matches "${searchTag}".` }
    : { title: 'No favorites yet', description: 'Tap the heart on a photo to add it here.' }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <Card className="p-3">
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="text-lg font-bold flex items-center gap-2 mr-2">
            <Image className="w-5 h-5" /> Photos
          </h1>
          <Button onClick={() => fileInputRef.current?.click()} className="text-sm bg-signal hover:bg-signal">
            <Upload className="w-4 h-4 mr-1" /> Import
          </Button>
          <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={e => addFiles(e.target.files)} />

          <div className="h-6 w-px bg-glass mx-1" />
          <Segmented
            ariaLabel="Grid columns"
            value={String(gridSize)}
            onChange={v => setGridSize(Number(v))}
            items={GRID_SIZES.map(size => ({ value: String(size), label: String(size) }))}
          />

          <div className="h-6 w-px bg-glass mx-1" />
          <Segmented
            ariaLabel="View mode"
            value={viewMode}
            onChange={v => setViewMode(v as 'grid' | 'list')}
            items={[
              { value: 'grid', icon: <LayoutGrid className="w-3.5 h-3.5" />, ariaLabel: 'Grid view' },
              { value: 'list', icon: <List className="w-3.5 h-3.5" />, ariaLabel: 'List view' },
            ]}
          />

          <div className="h-6 w-px bg-glass mx-1" />
          <Segmented
            ariaLabel="Filter"
            value={filter}
            onChange={v => setFilter(v as 'all' | 'favorites')}
            items={[
              { value: 'all', label: 'All' },
              { value: 'favorites', label: 'Favorites', icon: <Heart className="w-3 h-3" /> },
            ]}
          />

          <div className="flex-1" />
          <span className="text-xs text-faint">{photos.length} photo{photos.length !== 1 ? 's' : ''}</span>
        </div>

        {/* Search + Tags — reachable whenever there are photos (tags start
            empty and there's no tag-adding UI, so gating on tags alone made the
            filename search permanently unreachable). */}
        {photos.length > 0 && (
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <Input
              className="flex-1 min-w-[150px]"
              aria-label="Search photos"
              placeholder="Search photos..."
              icon={<Search className="w-4 h-4" />}
              value={searchTag}
              onChange={setSearchTag}
            />
            {allTags.length > 0 && (
              <Segmented
                ariaLabel="Filter by tag"
                value={searchTag}
                onChange={setSearchTag}
                items={allTags.slice(0, 8).map(tag => ({ value: tag, label: `#${tag}` }))}
              />
            )}
          </div>
        )}
      </Card>

      {/* Selected actions */}
      {selected && (
        <Card className="p-2 flex items-center gap-2">
          <span className="text-sm text-muted">{photos.find(p => p.id === selected)?.name}</span>
          <Button onClick={() => openLightbox(filtered.findIndex(p => p.id === selected))} className="text-xs bg-glass hover:bg-glass">
            <Maximize2 className="w-3 h-3 mr-1" /> View
          </Button>
          <Button onClick={() => toggleFavorite(selected)} className="text-xs bg-glass hover:bg-glass">
            <Heart className="w-3 h-3 mr-1" /> Favorite
          </Button>
          <Button onClick={deleteSelected} className="text-xs bg-danger/30 hover:bg-danger/50 text-danger">
            <Trash2 className="w-3 h-3 mr-1" /> Delete
          </Button>
          <Button onClick={() => setSelected(null)} className="text-xs bg-glass ml-auto">✕</Button>
        </Card>
      )}

      {/* Grid */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={<Image className="w-6 h-6" />}
          title={empty.title}
          description={empty.description}
        />
      ) : viewMode === 'grid' ? (
        <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${gridSize}, 1fr)` }}>
          {filtered.map((photo, idx) => (
            <div
              key={photo.id}
              role="button"
              tabIndex={0}
              aria-label={`Select ${photo.name}`}
              aria-pressed={selected === photo.id}
              className={`relative group aspect-square bg-glass rounded-lg overflow-hidden cursor-pointer ${selected === photo.id ? 'ring-2 ring-signal' : 'hover:ring-1 hover:ring-hair'}`}
              onClick={() => setSelected(photo.id === selected ? null : photo.id)}
              onKeyDown={onActivate(() => setSelected(photo.id === selected ? null : photo.id))}
              onDoubleClick={() => openLightbox(idx)}
            >
              <img src={photo.src} alt={photo.name} className="w-full h-full object-cover" loading="lazy" />
              {photo.favorite && (
                <Heart className="absolute top-2 left-2 w-4 h-4 text-danger fill-danger" />
              )}
              {photo.ephemeral && (
                <span className="absolute top-2 right-2 text-[10px] text-warn/80 px-1.5 py-0.5 rounded bg-warn/20" title="Too large to save — won't survive a reload">session</span>
              )}
              <div className="absolute inset-0 bg-void/0 group-hover:bg-void/40 transition flex items-end">
                <div className="p-2 w-full opacity-0 group-hover:opacity-100 transition flex items-end gap-1">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs truncate">{photo.name}</p>
                    <p className="text-xs text-muted">{formatBytes(photo.size)}</p>
                  </div>
                  <div onClick={e => e.stopPropagation()}>
                    <NodeActions type="photo" sourceId={photo.id} />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <Card className="p-2">
          <div className="space-y-1">
            {filtered.map(photo => (
              <div
                key={photo.id}
                role="button"
                tabIndex={0}
                aria-label={`Select ${photo.name}`}
                aria-pressed={selected === photo.id}
                onClick={() => setSelected(photo.id === selected ? null : photo.id)}
                onKeyDown={onActivate(() => setSelected(photo.id === selected ? null : photo.id))}
                className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer group ${selected === photo.id ? 'bg-signal/30' : 'hover:bg-glass'}`}
              >
                <img src={photo.src} alt={photo.name} className="w-12 h-12 object-cover rounded" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate flex items-center gap-1.5">
                    <span className="truncate">{photo.name}</span>
                    {photo.ephemeral && (
                      <span className="text-[10px] text-warn/80 px-1.5 py-0.5 rounded bg-warn/20 flex-shrink-0" title="Too large to save — won't survive a reload">session</span>
                    )}
                  </p>
                  <p className="text-xs text-faint">{formatBytes(photo.size)} · {formatDate(new Date(photo.date))}</p>
                </div>
                <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 focus-within:opacity-100" onClick={e => e.stopPropagation()}>
                  <NodeActions type="photo" sourceId={photo.id} />
                  <IconButton size="sm" variant="ghost"
                    onClick={e => { e.stopPropagation(); toggleFavorite(photo.id) }}
                    aria-label={photo.favorite ? `Unfavorite ${photo.name}` : `Favorite ${photo.name}`}
                    aria-pressed={photo.favorite}
                    icon={<Heart className={`w-4 h-4 ${photo.favorite ? 'text-danger fill-danger' : 'text-faint'}`} />} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Lightbox */}
      {lightboxIdx >= 0 && currentLightboxPhoto && (
        <div className="fixed inset-0 z-50 bg-void/95 flex flex-col" role="presentation" onClick={closeLightbox}>
          {/* Header */}
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <p className="text-fg font-bold">{currentLightboxPhoto.name}</p>
              <span className="text-faint text-sm">{lightboxIdx + 1} / {filtered.length}</span>
            </div>
            <div className="flex gap-2">
              <IconButton onClick={e => { e.stopPropagation(); toggleFavorite(currentLightboxPhoto.id) }}
                aria-label={currentLightboxPhoto.favorite ? 'Unfavorite' : 'Favorite'}
                aria-pressed={currentLightboxPhoto.favorite}
                icon={<Heart className={`w-5 h-5 ${currentLightboxPhoto.favorite ? 'text-danger fill-danger' : ''}`} />} />
              <a href={currentLightboxPhoto.src} download={currentLightboxPhoto.name} onClick={e => e.stopPropagation()} className="p-2 text-muted hover:text-fg" aria-label="Download">
                <Download className="w-5 h-5" />
              </a>
              <IconButton onClick={e => { e.stopPropagation(); deletePhoto(currentLightboxPhoto.id) }}
                aria-label="Delete photo"
                icon={<Trash2 className="w-5 h-5" />} />
              <IconButton onClick={closeLightbox} className="ml-2"
                aria-label="Close"
                icon={<X className="w-5 h-5" />} />
            </div>
          </div>
          {/* Image */}
          <div className="flex-1 flex items-center justify-center relative" onClick={e => e.stopPropagation()}>
            <IconButton onClick={e => { e.stopPropagation(); lightboxPrev() }}
              variant="secondary" size="lg"
              className="absolute left-4"
              style={{ borderRadius: 'var(--radius-full)' }}
              aria-label="Previous photo"
              icon={<ChevronLeft className="w-6 h-6" />} />
            <img src={currentLightboxPhoto.src} alt={currentLightboxPhoto.name} className="max-h-[80vh] max-w-[90vw] object-contain" />
            <IconButton onClick={e => { e.stopPropagation(); lightboxNext() }}
              variant="secondary" size="lg"
              className="absolute right-4"
              style={{ borderRadius: 'var(--radius-full)' }}
              aria-label="Next photo"
              icon={<ChevronRight className="w-6 h-6" />} />
          </div>
          {/* Footer */}
          <div className="p-4 flex justify-between text-sm text-faint">
            <span>{formatBytes(currentLightboxPhoto.size)}</span>
            {currentLightboxPhoto.width && currentLightboxPhoto.height && (
              <span>{currentLightboxPhoto.width} × {currentLightboxPhoto.height}</span>
            )}
            <span>{formatDate(new Date(currentLightboxPhoto.date))}</span>
          </div>
        </div>
      )}
    </div>
  )
}