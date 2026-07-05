import { useState, useEffect, useRef } from 'react'
import { Card, Button } from '../../components/ui'
import { EmptyState } from '../../components/ui/Utility'
import { emit } from '../../lib/eventBus'
import {
  putMedia, deleteMedia, loadMediaUrls,
  toStorableMeta, rehydrateMedia, shouldPersistBlob,
  type MediaRecord, type StoredMeta,
} from '../../lib/mediaStore'
import {
 Play, Pause, SkipBack, SkipForward, VolumeX,
 Maximize, Film, ListVideo,
 Plus, X, Volume1
} from 'lucide-react'

interface VideoItem extends MediaRecord {
  id: string
  title: string
  src: string
  duration: number
  size: number
  type: string
  date: string
  /** too large to persist — playable this session, won't survive a reload. */
  ephemeral?: boolean
}

const PLAYLIST_KEY = 'empire-video-playlist'

function formatTime(seconds: number): string {
  if (!seconds || isNaN(seconds)) return '0:00'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  return `${m}:${s.toString().padStart(2, '0')}`
}

export default function Video() {
  const [videos, setVideos] = useState<VideoItem[]>([])
  const [current, setCurrent] = useState<VideoItem | null>(null)
  const [playing, setPlaying] = useState(false)
  const [volume, setVolume] = useState(0.8)
  const [muted, setMuted] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [playbackRate, setPlaybackRate] = useState(1)
  const [showPlaylist, setShowPlaylist] = useState(true)
  const [_fullscreen, setFullscreen] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  // Gate persistence until the async rehydrate finishes (see Music.tsx).
  const hydratedRef = useRef(false)

  useEffect(() => {
    emit({ type: 'APP_OPENED', appId: 'video' })
    let cancelled = false
    // Restore metadata, then recover real blobs from IndexedDB and mint fresh
    // object URLs — videos whose blob is gone are dropped (no unplayable ghosts).
    ;(async () => {
      let meta: Array<StoredMeta<VideoItem>> = []
      try {
        const saved = localStorage.getItem(PLAYLIST_KEY)
        if (saved) meta = JSON.parse(saved)
      } catch { /* ignore */ }
      const urls = await loadMediaUrls(Array.isArray(meta) ? meta.map(m => m.id) : [])
      const restored = rehydrateMedia<VideoItem>(Array.isArray(meta) ? meta : [], id => urls.get(id) ?? null)
      if (!cancelled) {
        setVideos(restored)
        hydratedRef.current = true
      }
    })()
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    if (!hydratedRef.current) return
    try { localStorage.setItem(PLAYLIST_KEY, JSON.stringify(toStorableMeta(videos))) } catch { /* ignore */ }
  }, [videos])

  // Keep the live <video> element in sync with volume, mute and playback rate.
  // Re-runs on track change so a freshly-mounted element honours the current
  // settings — the mute toggle previously updated only the icon, never the
  // element, and a new video ignored the chosen volume until the slider moved.
  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    video.volume = volume
    video.muted = muted
    video.playbackRate = playbackRate
  }, [volume, muted, playbackRate, current])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === ' ' && current) { e.preventDefault(); togglePlay() }
      if (e.key === 'ArrowRight') skip(10)
      if (e.key === 'ArrowLeft') skip(-10)
      if (e.key === 'ArrowUp') setVolume(v => Math.min(1, v + 0.1))
      if (e.key === 'ArrowDown') setVolume(v => Math.max(0, v - 0.1))
      if (e.key === 'f') toggleFullscreen()
      if (e.key === 'm') setMuted(m => !m)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const vidFiles = files.filter(f => f.type.startsWith('video/') || /\.(mp4|webm|mov|avi|mkv|m4v)$/i.test(f.name))
    if (!vidFiles.length) return

    const newVideos: VideoItem[] = vidFiles.map(file => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`
      // Persist bytes to IndexedDB so the video survives a reload; skip oversized
      // files (quota) and keep them session-only (ephemeral).
      const ephemeral = !shouldPersistBlob(file.size)
      if (!ephemeral) void putMedia(id, file)
      return {
        id,
        title: file.name.replace(/\.[^.]+$/, ''),
        src: URL.createObjectURL(file),
        duration: 0,
        size: file.size,
        type: file.type || 'video/mp4',
        date: new Date().toISOString(),
        ephemeral,
      }
    })

    setVideos(prev => [...prev, ...newVideos])
    if (!current && newVideos.length > 0) playVideo(newVideos[0])
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const playVideo = (video: VideoItem) => {
    setCurrent(video)
    setPlaying(true)
    emit({ type: 'AI_QUERY', query: `Playing: ${video.title}`, context: 'video', app: 'video' })
  }

  const togglePlay = () => {
    if (!videoRef.current || !current) return
    if (playing) videoRef.current.pause()
    else videoRef.current.play()
  }

  const skip = (secs: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime + secs)
    }
  }

  const seek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (videoRef.current) {
      videoRef.current.currentTime = parseFloat(e.target.value)
      setCurrentTime(parseFloat(e.target.value))
    }
  }

  const toggleFullscreen = () => {
    if (!containerRef.current) return
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen()
      setFullscreen(true)
    } else {
      document.exitFullscreen()
      setFullscreen(false)
    }
  }

  const removeVideo = (id: string) => {
    const vid = videos.find(v => v.id === id)
    if (vid) URL.revokeObjectURL(vid.src)
    void deleteMedia(id)
    setVideos(prev => {
      const next = prev.filter(v => v.id !== id)
      if (current?.id === id) {
        setCurrent(next[0] || null)
        setPlaying(false)
      }
      return next
    })
  }

  const changeRate = (rate: number) => {
    setPlaybackRate(rate)
    if (videoRef.current) videoRef.current.playbackRate = rate
  }

  return (
    <div className="space-y-4">
      <Card className="p-3">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-bold flex items-center gap-2">
            <Film className="w-5 h-5" /> Video Player
          </h1>
          <Button onClick={() => fileInputRef.current?.click()} className="text-sm bg-signal hover:bg-signal ml-auto">
            <Plus className="w-4 h-4 mr-1" /> Add Video
          </Button>
          <input ref={fileInputRef} type="file" accept="video/*" multiple className="hidden" onChange={handleFileSelect} />
          <Button onClick={() => setShowPlaylist(p => !p)} className="text-sm bg-glass hover:bg-glass">
            <ListVideo className="w-4 h-4" />
          </Button>
        </div>
      </Card>

      <div className="flex gap-4" style={{ flexDirection: showPlaylist ? 'row' : 'column' }}>
        {/* Player */}
        <div ref={containerRef} className="flex-1">
          {current ? (
            <Card className="overflow-hidden bg-void">
              <video
                ref={videoRef}
                src={current.src}
                autoPlay
                onTimeUpdate={() => setCurrentTime(videoRef.current?.currentTime || 0)}
                onLoadedMetadata={() => setDuration(videoRef.current?.duration || 0)}
                onPlay={() => setPlaying(true)}
                onPause={() => setPlaying(false)}
                onEnded={() => {
                  const idx = videos.findIndex(v => v.id === current?.id)
                  if (idx < videos.length - 1) playVideo(videos[idx + 1])
                  else setPlaying(false)
                }}
                onClick={togglePlay}
                className="w-full cursor-pointer"
                style={{ display: 'block', maxHeight: '60vh', margin: '0 auto' }}
              />
              {/* Video Controls */}
              <div className="p-3 space-y-2">
                <input
                  type="range"
                  min={0}
                  max={duration || 100}
                  value={currentTime}
                  onChange={seek}
                  className="w-full h-1 accent-signal cursor-pointer"
                />
                <div className="flex items-center gap-3 flex-wrap">
                  <button onClick={togglePlay} className="p-2 bg-glass text-void rounded-full hover:bg-glass">
                    {playing ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                  </button>
                  <button onClick={() => skip(-10)} className="p-1.5 text-muted hover:text-fg">
                    <SkipBack className="w-4 h-4" /> <span className="text-xs ml-0.5">10</span>
                  </button>
                  <button onClick={() => skip(10)} className="p-1.5 text-muted hover:text-fg">
                    <SkipForward className="w-4 h-4" /> <span className="text-xs ml-0.5">10</span>
                  </button>
                  <div className="flex items-center gap-1 flex-1">
                    <button onClick={() => setMuted(m => !m)} className="p-1 text-muted hover:text-fg">
                      {muted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume1 className="w-4 h-4" />}
                    </button>
                    <input
                      type="range"
                      min={0} max={1} step={0.05}
                      value={muted ? 0 : volume}
                      onChange={e => { setVolume(parseFloat(e.target.value)); setMuted(false) }}
                      className="w-20 h-1 accent-signal cursor-pointer"
                    />
                  </div>
                  <span className="text-xs text-muted">{formatTime(currentTime)} / {formatTime(duration)}</span>
                  <div className="flex items-center gap-1">
                    {([0.5, 1, 1.5, 2] as const).map(rate => (
                      <button key={rate} onClick={() => changeRate(rate)} className={`text-xs px-1.5 py-0.5 rounded ${playbackRate === rate ? 'bg-signal text-fg' : 'text-faint hover:text-fg'}`}>
                        {rate}×
                      </button>
                    ))}
                  </div>
                  <button onClick={toggleFullscreen} className="p-1.5 text-muted hover:text-fg">
                    <Maximize className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-sm text-fg truncate">{current.title}</p>
              </div>
            </Card>
          ) : (
            <Card className="flex items-center justify-center py-20 bg-void/50">
              <EmptyState
                size="sm"
                icon={<Film className="w-5 h-5" />}
                title="No video selected"
                description="Add video files to get started"
              />
            </Card>
          )}
        </div>

        {/* Playlist */}
        {showPlaylist && videos.length > 0 && (
          <Card className="w-64 p-3 flex-shrink-0">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-bold flex items-center gap-1"><ListVideo className="w-4 h-4" /> Playlist</h2>
              <span className="text-xs text-faint">{videos.length}</span>
            </div>
            <div className="space-y-1 max-h-[60vh] overflow-y-auto">
              {videos.map((video, i) => (
                <div
                  key={video.id}
                  onClick={() => playVideo(video)}
                  className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer group transition ${current?.id === video.id ? 'bg-signal/30' : 'hover:bg-glass'}`}
                >
                  <span className="text-xs text-faint w-5 text-center">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs truncate ${current?.id === video.id ? 'text-signal font-bold' : ''}`}>{video.title}</p>
                    {video.duration > 0 && <p className="text-xs text-faint">{formatTime(video.duration)}</p>}
                    {video.ephemeral && <p className="text-[10px] text-warn/70" title="Too large to save — won't survive a reload">session-only</p>}
                  </div>
                  <button onClick={e => { e.stopPropagation(); removeVideo(video.id) }} className="opacity-0 group-hover:opacity-100 text-faint hover:text-danger p-1">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}