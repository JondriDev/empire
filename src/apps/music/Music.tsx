import { useState, useEffect, useRef, useCallback } from 'react'
import { Card, Button } from '../../components/ui'
import { emit } from '../../lib/eventBus'
import {
  Play, Pause, SkipBack, SkipForward, Volume2, VolumeX,
  Music as MusicIcon, Trash2, ListMusic,
  Shuffle, Repeat, Plus, X
} from 'lucide-react'

interface Track {
  id: string
  title: string
  artist: string
  album?: string
  duration: number
  src: string
  cover?: string
}

function formatTime(seconds: number): string {
  if (!seconds || isNaN(seconds)) return '0:00'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

function guessMeta(file: File): Partial<Track> {
  const name = file.name.replace(/\.[^.]+$/, '')
  const parts = name.split(' - ')
  if (parts.length >= 2) return { artist: parts[0].trim(), title: parts[1].trim() }
  return { title: name }
}

function slugify(str: string) {
  return str.replace(/\s+/g, '-').replace(/[^a-z0-9-]/gi, '').toLowerCase()
}

export default function Music() {
  const [playlist, setPlaylist] = useState<Track[]>([])
  const [current, setCurrent] = useState<Track | null>(null)
  const [playing, setPlaying] = useState(false)
  const [volume, setVolume] = useState(0.8)
  const [muted, setMuted] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [shuffle, setShuffle] = useState(false)
  const [repeat, setRepeat] = useState<'none' | 'one' | 'all'>('none')
  const [_dragged, setDragged] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    emit({ type: 'APP_OPENED', appId: 'music' })
    // Restore playlist from localStorage
    try {
      const saved = localStorage.getItem('empire-music-playlist')
      if (saved) setPlaylist(JSON.parse(saved))
      const savedVol = localStorage.getItem('empire-music-volume')
      if (savedVol) setVolume(parseFloat(savedVol))
    } catch { /* ignore */ }
  }, [])

  useEffect(() => {
    try { localStorage.setItem('empire-music-playlist', JSON.stringify(playlist)) } catch { /* ignore */ }
  }, [playlist])

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume
    try { localStorage.setItem('empire-music-volume', String(volume)) } catch { /* ignore */ }
  }, [volume])

  useEffect(() => {
    if (!audioRef.current) return
    const audio = audioRef.current
    const onTimeUpdate = () => setCurrentTime(audio.currentTime)
    const onDuration = () => setDuration(audio.duration || 0)
    const onEnded = () => handleTrackEnd()
    const onPlay = () => setPlaying(true)
    const onPause = () => setPlaying(false)
    audio.addEventListener('timeupdate', onTimeUpdate)
    audio.addEventListener('durationchange', onDuration)
    audio.addEventListener('ended', onEnded)
    audio.addEventListener('play', onPlay)
    audio.addEventListener('pause', onPause)
    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate)
      audio.removeEventListener('durationchange', onDuration)
      audio.removeEventListener('ended', onEnded)
      audio.removeEventListener('play', onPlay)
      audio.removeEventListener('pause', onPause)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, repeat, shuffle])

  const handleTrackEnd = useCallback(() => {
    if (repeat === 'one') {
      audioRef.current?.play()
      return
    }
    const idx = playlist.findIndex(t => t.id === current?.id)
    if (shuffle) {
      const next = playlist[Math.floor(Math.random() * playlist.length)]
      if (next) playTrack(next)
    } else if (repeat === 'all' && idx === playlist.length - 1) {
      playTrack(playlist[0])
    } else if (idx < playlist.length - 1) {
      playTrack(playlist[idx + 1])
    } else {
      setPlaying(false)
    }
  }, [current, playlist, repeat, shuffle])

  const playTrack = (track: Track) => {
    setCurrent(track)
    setPlaying(true)
    emit({ type: 'AI_QUERY', query: `Now playing: ${track.title}`, context: 'music', app: 'music' })
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const audioFiles = files.filter(f => f.type.startsWith('audio/') || /\.(mp3|wav|ogg|m4a|flac|aac)$/i.test(f.name))
    if (!audioFiles.length) return

    const newTracks: Track[] = audioFiles.map(file => {
      const meta = guessMeta(file)
      const src = URL.createObjectURL(file)
      return {
        id: `${Date.now()}-${slugify(file.name)}`,
        title: meta.title || file.name,
        artist: meta.artist || 'Unknown Artist',
        album: meta.album || '',
        duration: 0,
        src,
      }
    })

    setPlaylist(prev => {
      const updated = [...prev, ...newTracks]
      if (!current && updated.length > 0) {
        setTimeout(() => playTrack(updated[0]), 100)
      }
      return updated
    })

    // Get duration after load
    newTracks.forEach(track => {
      const audio = new Audio(track.src)
      audio.addEventListener('loadedmetadata', () => {
        setPlaylist(prev => prev.map(t =>
          t.id === track.id ? { ...t, duration: audio.duration } : t
        ))
      })
    })

    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const removeTrack = (id: string) => {
    const track = playlist.find(t => t.id === id)
    if (track) URL.revokeObjectURL(track.src)
    setPlaylist(prev => {
      const next = prev.filter(t => t.id !== id)
      if (current?.id === id) {
        setCurrent(next[0] || null)
        setPlaying(false)
      }
      return next
    })
  }

  const clearPlaylist = () => {
    playlist.forEach(t => URL.revokeObjectURL(t.src))
    setPlaylist([])
    setCurrent(null)
    setPlaying(false)
  }

  const playPause = () => {
    if (!current) {
      if (playlist.length > 0) playTrack(playlist[0])
      return
    }
    if (audioRef.current) {
      if (playing) audioRef.current.pause()
      else audioRef.current.play()
    }
  }

  const prevTrack = () => {
    if (!current) return
    const idx = playlist.findIndex(t => t.id === current.id)
    const prev = playlist[idx - 1] || playlist[playlist.length - 1]
    playTrack(prev)
  }

  const nextTrack = () => {
    if (!current) return
    const idx = playlist.findIndex(t => t.id === current.id)
    if (shuffle) {
      const next = playlist[Math.floor(Math.random() * playlist.length)]
      if (next) playTrack(next)
    } else {
      const next = playlist[idx + 1] || playlist[0]
      if (next) playTrack(next)
    }
  }

  const seek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (audioRef.current) {
      audioRef.current.currentTime = parseFloat(e.target.value)
      setCurrentTime(parseFloat(e.target.value))
    }
  }

  const totalDuration = playlist.reduce((sum, t) => sum + (t.duration || 0), 0)

  return (
    <div className="space-y-4">
      {current && (
        <audio ref={audioRef} src={current.src} autoPlay onLoadedMetadata={() => setDuration(audioRef.current?.duration || 0)} />
      )}

      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <ListMusic className="w-5 h-5" />
            Music Player
          </h1>
          <div className="flex gap-2">
            <Button onClick={() => fileInputRef.current?.click()} className="text-sm bg-cyan-600 hover:bg-cyan-500">
              <Plus className="w-4 h-4 mr-1" /> Add Files
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*"
              multiple
              className="hidden"
              onChange={handleFileSelect}
            />
          </div>
        </div>

        {/* Now Playing */}
        {current ? (
          <div className="bg-white/5 rounded-xl p-4 mb-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-purple-600 to-pink-500 flex items-center justify-center flex-shrink-0">
                <MusicIcon className="w-8 h-8 text-white/80" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-lg truncate">{current.title}</p>
                <p className="text-white/60 text-sm truncate">{current.artist}</p>
              </div>
            </div>

            {/* Progress */}
            <div className="mt-3">
              <input
                type="range"
                min={0}
                max={duration || 100}
                value={currentTime}
                onChange={seek}
                className="w-full h-1 accent-cyan-600 cursor-pointer"
              />
              <div className="flex justify-between text-xs text-white/40 mt-1">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-4 mt-3">
              <button onClick={() => setShuffle(s => !s)} className={`p-2 rounded-full transition ${shuffle ? 'bg-cyan-600 text-white' : 'text-white/40 hover:text-white'}`}>
                <Shuffle className="w-4 h-4" />
              </button>
              <button onClick={prevTrack} className="p-2 text-white/60 hover:text-white transition">
                <SkipBack className="w-5 h-5" />
              </button>
              <button onClick={playPause} className="p-4 bg-white text-black rounded-full hover:bg-white/90 transition shadow-lg">
                {playing ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-0.5" />}
              </button>
              <button onClick={nextTrack} className="p-2 text-white/60 hover:text-white transition">
                <SkipForward className="w-5 h-5" />
              </button>
              <button onClick={() => setRepeat(r => r === 'none' ? 'all' : r === 'all' ? 'one' : 'none')} className={`p-2 rounded-full transition ${repeat !== 'none' ? 'bg-cyan-600 text-white' : 'text-white/40 hover:text-white'}`}>
                <Repeat className={`w-4 h-4 ${repeat === 'one' ? 'text-xs' : ''}`} />
              </button>
            </div>

            {/* Volume */}
            <div className="flex items-center gap-2 mt-3">
              <button onClick={() => setMuted(m => !m)} className="text-white/40 hover:text-white">
                {muted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={muted ? 0 : volume}
                onChange={e => { setVolume(parseFloat(e.target.value)); setMuted(false) }}
                className="flex-1 h-1 accent-cyan-600 cursor-pointer"
              />
            </div>
          </div>
        ) : (
          <div className="text-center py-12 text-white/40">
            <MusicIcon className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No track playing</p>
            <p className="text-sm mt-1">Add audio files to get started</p>
          </div>
        )}

        {/* Stats bar */}
        <div className="flex items-center justify-between text-xs text-white/40 border-t border-white/5 pt-3">
          <span>{playlist.length} track{playlist.length !== 1 ? 's' : ''}</span>
          <span>{formatTime(totalDuration)} total</span>
          {current && <span>{playlist.findIndex(t => t.id === current.id) + 1} / {playlist.length}</span>}
        </div>
      </Card>

      {/* Playlist */}
      {playlist.length > 0 && (
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold flex items-center gap-2">
              <ListMusic className="w-4 h-4" /> Playlist
            </h2>
            <Button onClick={clearPlaylist} className="text-xs bg-red-600/30 hover:bg-red-600/50 text-red-300">
              <Trash2 className="w-3 h-3 mr-1" /> Clear
            </Button>
          </div>
          <div className="space-y-1 max-h-[40vh] overflow-y-auto">
            {playlist.map((track, i) => (
              <div
                key={track.id}
                onDoubleClick={() => playTrack(track)}
                className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer group transition ${current?.id === track.id ? 'bg-cyan-600/30' : 'hover:bg-white/5'}`}
                draggable
                onDragStart={(e) => { setDragged(true); e.dataTransfer.setData('text/plain', track.id) }}
                onDragEnd={() => setDragged(false)}
                onDragOver={e => e.preventDefault()}
                onDrop={e => {
                  e.preventDefault()
                  setDragged(false)
                  const fromId = e.dataTransfer.getData('text/plain')
                  const fromIdx = playlist.findIndex(t => t.id === fromId)
                  const toIdx = i
                  if (fromIdx !== toIdx && fromIdx !== -1) {
                    setPlaylist(prev => {
                      const next = [...prev]
                      const [moved] = next.splice(fromIdx, 1)
                      next.splice(toIdx, 0, moved)
                      return next
                    })
                  }
                }}
              >
                <span className="w-6 text-center text-xs text-white/30">{i + 1}</span>
                <MusicIcon className="w-4 h-4 text-white/30 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className={`text-sm truncate ${current?.id === track.id ? 'text-cyan-200 font-bold' : ''}`}>{track.title}</p>
                  <p className="text-xs text-white/40 truncate">{track.artist}</p>
                </div>
                <span className="text-xs text-white/30">{track.duration ? formatTime(track.duration) : '—'}</span>
                <button
                  onClick={e => { e.stopPropagation(); removeTrack(track.id) }}
                  className="opacity-0 group-hover:opacity-100 text-white/30 hover:text-red-400 transition p-1"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}