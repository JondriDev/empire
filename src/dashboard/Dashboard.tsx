import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { apps, getAppIcon } from '../lib/registry'
import GlassPanel from '../components/ui/GlassPanel'
import { Clock, Star } from 'lucide-react'

const FAVORITES_KEY = 'empire-favorites'

export default function Dashboard() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [time, setTime] = useState(new Date())
  const [favorites, setFavorites] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]') } catch { return [] }
  })

  useEffect(() => {
    const i = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(i)
  }, [])

  const toggleFavorite = (id: string) => {
    const next = favorites.includes(id) ? favorites.filter(f => f !== id) : [...favorites, id]
    setFavorites(next)
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(next))
  }

  const filtered = apps.filter(a =>
    a.name.toLowerCase().includes(search.toLowerCase()) ||
    a.description.toLowerCase().includes(search.toLowerCase())
  )

  const favApps = apps.filter(a => favorites.includes(a.id))
  const favCount = favApps.length

  const hours = time.getHours().toString().padStart(2, '0')
  const mins = time.getMinutes().toString().padStart(2, '0')

  return (
    <div className="min-h-screen p-6" style={{ background: 'var(--grad)', backgroundAttachment: 'fixed', color: 'var(--text)' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-8 pt-4 flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-4xl font-bold" style={{ background: 'linear-gradient(135deg, #1a8caa, #5b8fb9, #66d9a0)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>The Empire</h1>
            <p className="mt-1 text-sm" style={{ color: 'var(--text2)' }}>Your personal application suite</p>
          </div>
          <div className="rounded-xl px-4 py-2 text-center hidden sm:block" style={{ background: 'var(--gl-bg)', backdropFilter: 'var(--gl-blur)', border: '1px solid var(--gl-border-b)', borderTopColor: 'var(--gl-border-t)', boxShadow: 'var(--gl-shadow)' }}>
            <div className="text-xl font-light tracking-widest">{hours}:{mins}</div>
            <div className="text-[10px]" style={{ color: 'var(--text3)' }}>{time.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</div>
          </div>
        </div>
        <input
          type="text"
          placeholder="Search apps..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="rounded-xl px-4 py-2 w-64 text-sm focus:outline-none transition-colors"
          style={{ background: 'var(--gl-bg)', border: '1px solid var(--gl-border-b)', borderTopColor: 'var(--gl-border-t)', color: 'var(--text)' } as React.CSSProperties}
        />
      </div>

      {/* Favorites bar */}
      {favCount > 0 && !search && (
        <div className="mb-6">
          <div className="flex items-center gap-2 text-xs mb-2" style={{ color: 'var(--text2)' }}>
            <Star className="w-3 h-3 text-yellow-400" />
            <span>Favorites</span>
          </div>
          <div className="flex gap-2">
            {favApps.map(app => {
              const Icon = getAppIcon(app.icon)
              return (
                <button key={app.id} onClick={() => navigate(app.route)}
                  className="rounded-xl px-3 py-2 flex items-center gap-2 transition-colors group relative"
                  style={{ background: 'var(--gl-bg)', backdropFilter: 'var(--gl-blur)', border: '1px solid var(--gl-border-b)', borderTopColor: 'var(--gl-border-t)' }}>
                  <Icon className="w-4 h-4" style={{ color: app.color }} />
                  <span className="text-xs hidden sm:inline">{app.name}</span>
                  <button onClick={e => { e.stopPropagation(); toggleFavorite(app.id) }}
                    className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-[8px] text-yellow-900">✕</span>
                  </button>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* App Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {filtered.map(app => {
          const Icon = getAppIcon(app.icon)
          const isFav = favorites.includes(app.id)
          return (
            <GlassPanel key={app.id} onClick={() => navigate(app.route)} className="p-5 flex flex-col items-center text-center group relative">
              <button onClick={e => { e.stopPropagation(); toggleFavorite(app.id) }}
                className={`absolute top-2 right-2 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity ${isFav ? 'opacity-100' : ''}`}
                title={isFav ? 'Remove from favorites' : 'Add to favorites'}>
                <Star className={`w-3 h-3 ${isFav ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'}`} />
              </button>
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3 transition-transform group-hover:scale-110" style={{ background: `${app.color}22`, boxShadow: `0 0 20px ${app.color}33` }}>
                <Icon className="w-7 h-7" style={{ color: app.color }} />
              </div>
              <h3 className="font-medium text-sm">{app.name}</h3>
              <p className="text-gray-500 text-xs mt-1 line-clamp-2">{app.description}</p>
            </GlassPanel>
          )
        })}
      </div>

      {/* Footer */}
      <p className="text-center text-xs mt-12 pb-24" style={{ color: 'var(--text3)' }}>
        The Empire v1.0 — {apps.length} applications · {favCount} favorites
      </p>
    </div>
  )
}