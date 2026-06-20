import { useState, useEffect, useRef, useCallback } from 'react'
import { Card, Button } from '../../components/ui'
import { emit } from '../../lib/eventBus'
import { mirrorCollection } from '../../lib/core/sync'
import { NodeActions } from '../../components/ui/NodeActions'
import {
 Image, Upload, Trash2, ChevronLeft,
 ChevronRight, X, Heart, Download,
 Maximize2, LayoutGrid, List
} from 'lucide-react'

interface Photo {
  id: string
  url: string
  name: string
  size: number
  width?: number
  height?: number
  date: string
  tags: string[]
  favorite: boolean
}

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

  useEffect(() => {
    emit({ type: 'APP_OPENED', appId: 'photos' })
    try {
      const saved = localStorage.getItem('empire-photos')
      if (saved) setPhotos(JSON.parse(saved))
    } catch { /* ignore */ }
  }, [])

  useEffect(() => {
    try { localStorage.setItem('empire-photos', JSON.stringify(photos)) } catch { /* ignore */ }
  }, [photos])

  // Mirror photos into the Core graph as `photo` nodes so they join the
  // organism (object URLs are transient, so the node carries name/size/tags,
  // not the url).
  useEffect(() => {
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
      const url = URL.createObjectURL(file)
      return {
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        url,
        name: file.name,
        size: file.size,
        date: new Date().toISOString(),
        tags: [],
        favorite: false,
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
      img.src = photo.url
    })

    setPhotos(prev => [...prev, ...newPhotos])
  }, [])

  const toggleFavorite = (id: string) => {
    setPhotos(prev => prev.map(p => p.id === id ? { ...p, favorite: !p.favorite } : p))
  }

  const deletePhoto = (id: string) => {
    const photo = photos.find(p => p.id === id)
    if (photo) URL.revokeObjectURL(photo.url)
    setPhotos(prev => prev.filter(p => p.id !== id))
    if (selected === id) setSelected(null)
    if (lightboxIdx >= 0 && photos[lightboxIdx]?.id === id) closeLightbox()
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

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <Card className="p-3">
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="text-lg font-bold flex items-center gap-2 mr-2">
            <Image className="w-5 h-5" /> Photos
          </h1>
          <Button onClick={() => fileInputRef.current?.click()} className="text-sm bg-cyan-600 hover:bg-cyan-500">
            <Upload className="w-4 h-4 mr-1" /> Import
          </Button>
          <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={e => addFiles(e.target.files)} />

          <div className="h-6 w-px bg-white/10 mx-1" />
          <div className="flex gap-1">
                  {GRID_SIZES.map(size => (
                          <button key={size} onClick={() => setGridSize(size)} className={`px-2 py-1 text-xs rounded ${gridSize === size ? 'bg-white/20 text-white' : 'text-white/40 hover:text-white'}`}>
                                  {size}
                          </button>
                  ))}
          </div>

          <div className="h-6 w-px bg-white/10 mx-1" />
          <div className="flex gap-1">
                  <button onClick={() => setViewMode('grid')} className={`p-1 rounded ${viewMode === 'grid' ? 'bg-white/20 text-white' : 'text-white/40 hover:text-white'}`}>
                          <LayoutGrid className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => setViewMode('list')} className={`p-1 rounded ${viewMode === 'list' ? 'bg-white/20 text-white' : 'text-white/40 hover:text-white'}`}>
                          <List className="w-3.5 h-3.5" />
                  </button>
          </div>

          <div className="h-6 w-px bg-white/10 mx-1" />
          <button onClick={() => setFilter(f => f === 'all' ? 'favorites' : 'all')} className={`text-xs px-2 py-1 rounded ${filter === 'favorites' ? 'bg-pink-600/30 text-pink-300' : 'text-white/40 hover:text-white'}`}>
            <Heart className="w-3 h-3 inline mr-1" /> Favorites
          </button>

          <div className="flex-1" />
          <span className="text-xs text-white/40">{photos.length} photo{photos.length !== 1 ? 's' : ''}</span>
        </div>

        {/* Search + Tags */}
        {(allTags.length > 0 || searchTag) && (
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <input
              type="text"
              placeholder="Search photos..."
              value={searchTag}
              onChange={e => setSearchTag(e.target.value)}
              className="text-sm bg-white/10 border-0 rounded px-2 py-1 flex-1 min-w-[150px]"
            />
            <div className="flex gap-1 flex-wrap">
              {allTags.slice(0, 8).map(tag => (
                <button key={tag} onClick={() => setSearchTag(tag)} className={`text-xs px-1.5 py-0.5 rounded ${searchTag === tag ? 'bg-cyan-600 text-white' : 'bg-white/10 text-white/60 hover:bg-white/20'}`}>
                  #{tag}
                </button>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* Selected actions */}
      {selected && (
        <Card className="p-2 flex items-center gap-2">
          <span className="text-sm text-white/60">{photos.find(p => p.id === selected)?.name}</span>
          <Button onClick={() => openLightbox(filtered.findIndex(p => p.id === selected))} className="text-xs bg-white/10 hover:bg-white/20">
            <Maximize2 className="w-3 h-3 mr-1" /> View
          </Button>
          <Button onClick={() => toggleFavorite(selected)} className="text-xs bg-white/10 hover:bg-white/20">
            <Heart className="w-3 h-3 mr-1" /> Favorite
          </Button>
          <Button onClick={deleteSelected} className="text-xs bg-red-600/30 hover:bg-red-600/50 text-red-300">
            <Trash2 className="w-3 h-3 mr-1" /> Delete
          </Button>
          <Button onClick={() => setSelected(null)} className="text-xs bg-white/10 ml-auto">✕</Button>
        </Card>
      )}

      {/* Grid */}
      {filtered.length === 0 ? (
        <Card className="p-12 text-center text-white/40">
          <Image className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p>No photos yet</p>
          <p className="text-sm mt-1">Import images to get started</p>
        </Card>
      ) : viewMode === 'grid' ? (
        <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${gridSize}, 1fr)` }}>
          {filtered.map((photo, idx) => (
            <div
              key={photo.id}
              className={`relative group aspect-square bg-white/5 rounded-lg overflow-hidden cursor-pointer ${selected === photo.id ? 'ring-2 ring-cyan-600' : 'hover:ring-1 hover:ring-white/30'}`}
              onClick={() => setSelected(photo.id === selected ? null : photo.id)}
              onDoubleClick={() => openLightbox(idx)}
            >
              <img src={photo.url} alt={photo.name} className="w-full h-full object-cover" loading="lazy" />
              {photo.favorite && (
                <Heart className="absolute top-2 left-2 w-4 h-4 text-pink-500 fill-pink-500" />
              )}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition flex items-end">
                <div className="p-2 w-full opacity-0 group-hover:opacity-100 transition flex items-end gap-1">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs truncate">{photo.name}</p>
                    <p className="text-xs text-white/60">{formatBytes(photo.size)}</p>
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
                onClick={() => setSelected(photo.id === selected ? null : photo.id)}
                className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer group ${selected === photo.id ? 'bg-cyan-600/30' : 'hover:bg-white/5'}`}
              >
                <img src={photo.url} alt={photo.name} className="w-12 h-12 object-cover rounded" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate">{photo.name}</p>
                  <p className="text-xs text-white/40">{formatBytes(photo.size)} · {formatDate(new Date(photo.date))}</p>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100" onClick={e => e.stopPropagation()}>
                  <NodeActions type="photo" sourceId={photo.id} />
                  <button onClick={e => { e.stopPropagation(); toggleFavorite(photo.id) }}>
                    <Heart className={`w-4 h-4 ${photo.favorite ? 'text-pink-500 fill-pink-500' : 'text-white/40'}`} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Lightbox */}
      {lightboxIdx >= 0 && currentLightboxPhoto && (
        <div className="fixed inset-0 z-50 bg-black/95 flex flex-col" onClick={closeLightbox}>
          {/* Header */}
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <p className="text-white font-bold">{currentLightboxPhoto.name}</p>
              <span className="text-white/40 text-sm">{lightboxIdx + 1} / {filtered.length}</span>
            </div>
            <div className="flex gap-2">
              <button onClick={e => { e.stopPropagation(); toggleFavorite(currentLightboxPhoto.id) }} className="p-2 text-white/60 hover:text-white">
                <Heart className={`w-5 h-5 ${currentLightboxPhoto.favorite ? 'text-pink-500 fill-pink-500' : ''}`} />
              </button>
              <a href={currentLightboxPhoto.url} download={currentLightboxPhoto.name} onClick={e => e.stopPropagation()} className="p-2 text-white/60 hover:text-white">
                <Download className="w-5 h-5" />
              </a>
              <button onClick={e => { e.stopPropagation(); deletePhoto(currentLightboxPhoto.id) }} className="p-2 text-white/60 hover:text-red-400">
                <Trash2 className="w-5 h-5" />
              </button>
              <button onClick={closeLightbox} className="p-2 text-white/60 hover:text-white ml-2">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
          {/* Image */}
          <div className="flex-1 flex items-center justify-center relative" onClick={e => e.stopPropagation()}>
            <button onClick={e => { e.stopPropagation(); lightboxPrev() }} className="absolute left-4 p-3 bg-white/10 rounded-full hover:bg-white/20 text-white">
              <ChevronLeft className="w-6 h-6" />
            </button>
            <img src={currentLightboxPhoto.url} alt={currentLightboxPhoto.name} className="max-h-[80vh] max-w-[90vw] object-contain" />
            <button onClick={e => { e.stopPropagation(); lightboxNext() }} className="absolute right-4 p-3 bg-white/10 rounded-full hover:bg-white/20 text-white">
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>
          {/* Footer */}
          <div className="p-4 flex justify-between text-sm text-white/40">
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