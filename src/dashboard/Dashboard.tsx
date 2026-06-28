import { useNavigate } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import { apps, getAppIcon } from '../lib/registry'
import GlassPanel from '../components/ui/GlassPanel'
import { Star, Search, GripVertical, Telescope, X } from 'lucide-react'
import { cssVar, tint } from '../design-system/tokens'

const FAVORITES_KEY = 'empire-favorites'

export default function Dashboard() {
 const navigate = useNavigate()
 const [search, setSearch] = useState('')
 const [time, setTime] = useState(new Date())
 const [favorites, setFavorites] = useState<string[]>(() => {
 try { return JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]') } catch { return [] }
 })
 const [clockPos, setClockPos] = useState<{ x: number; y: number } | null>(() => {
 try { return JSON.parse(localStorage.getItem('empire-clock-pos') || 'null') } catch { return null }
 })
 const [isDragging, setIsDragging] = useState(false)
 const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
 const clockRef = useRef<HTMLDivElement>(null)

 useEffect(() => {
 const i = setInterval(() => setTime(new Date()), 1000)
 return () => clearInterval(i)
 }, [])

 const handleMouseDown = (e: React.MouseEvent) => {
 if (e.button !== 0) return // Only left click
 e.preventDefault()
 setIsDragging(true)
 const rect = (e.target as HTMLElement).closest('.clock-widget')?.getBoundingClientRect()
 if (rect && clockPos) {
 setDragOffset({
 x: e.clientX - rect.left,
 y: e.clientY - rect.top
 })
 }
 }

 const handleMouseMove = (e: React.MouseEvent) => {
 if (!isDragging || !clockRef.current) return
 e.preventDefault()
 const newX = e.clientX - dragOffset.x
 const newY = e.clientY - dragOffset.y
 setClockPos({ x: newX, y: newY })
 localStorage.setItem('empire-clock-pos', JSON.stringify({ x: newX, y: newY }))
 }

 const handleMouseUp = () => {
 setIsDragging(false)
 }

 // Add global mouse listeners when dragging
 useEffect(() => {
   if (isDragging) {
     document.addEventListener('mousemove', handleMouseMove as any)
     document.addEventListener('mouseup', handleMouseUp as any)
     return () => {
       document.removeEventListener('mousemove', handleMouseMove as any)
       document.removeEventListener('mouseup', handleMouseUp as any)
     }
   }
   // eslint-disable-next-line react-hooks/exhaustive-deps
 }, [isDragging, dragOffset])

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
  const secs = time.getSeconds().toString().padStart(2, '0')
  const dateStr = time.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })

  return (
    <div className="min-h-screen layer-content" style={{ background: 'var(--grad)', backgroundAttachment: 'fixed' }}>

      {/* ── Content ── */}
      <div className="relative z-10 p-6">

        {/* Header */}
        <div className="flex items-start justify-between mb-10 pt-4 gap-6 flex-wrap">

          {/* Logo block */}
          <div className="flex items-end gap-5">
            <div>
              <h1 className="text-4xl font-bold text-gradient animate-fade-in-up">
                The Empire
              </h1>
              <p className="mt-1.5 text-sm animate-fade-in" style={{ color: 'var(--text2)', animationDelay: '200ms' }}>
                Your personal application suite
              </p>
            </div>

 {/* Clock widget */}
 <div
 ref={clockRef}
 onMouseDown={handleMouseDown}
 className={`clock-widget rounded-2xl px-4 py-2.5 hidden sm:flex flex-col items-center animate-scale-in transition-shadow ${isDragging ? 'cursor-grabbing shadow-2xl' : 'cursor-grab'}`}
 style={{
 background: 'var(--gl-bg)',
 backdropFilter: 'var(--gl-blur)',
 border: '1px solid var(--gl-border-b)',
 borderTopColor: 'var(--gl-border-t)',
 boxShadow: isDragging ? `0 20px 60px ${tint('void', 30)}` : 'var(--gl-shadow)',
 animationDelay: '400ms',
 position: clockPos ? 'absolute' : 'static',
 left: clockPos?.x ?? 0,
 top: clockPos?.y ?? 0,
 zIndex: isDragging ? 1000 : 1,
 userSelect: isDragging ? 'none' : 'auto',
 }}
 >
 <div className="flex items-center gap-2 mb-1" style={{ color: 'var(--text3)' }}>
 <GripVertical className="w-3 h-3 opacity-40" />
 </div>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-mono font-medium tracking-widest" style={{ color: 'var(--text)' }}>
                  {hours}:{mins}
                </span>
                <span className="text-xs font-mono text-gray-500" style={{ color: 'var(--text3)' }}>
                  :{secs}
                </span>
              </div>
              <div className="text-[10px] tracking-wide" style={{ color: 'var(--text3)' }}>
                {dateStr}
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="relative animate-fade-in-up" style={{ animationDelay: '300ms' }}>
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
              style={{ color: 'var(--text3)' }}
            />
            <input
              type="text"
              placeholder="Search apps…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="dash-search rounded-2xl pl-9 pr-4 py-2.5 w-56 text-sm transition-all duration-200"
              style={{
                background: 'var(--gl-bg)',
                backdropFilter: 'var(--gl-blur)',
                border: '1px solid var(--gl-border-b)',
                borderTopColor: 'var(--gl-border-t)',
                color: 'var(--text)',
                boxShadow: 'var(--gl-shadow)',
              } as React.CSSProperties}
            />
          </div>
        </div>

        {/* Favorites bar */}
        {favCount > 0 && !search && (
          <div className="mb-8 animate-fade-in" style={{ animationDelay: '600ms' }}>
            <div className="flex items-center gap-2 mb-3">
              <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
              <span className="text-xs font-medium" style={{ color: 'var(--text2)' }}>
                Favorites
              </span>
              <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: tint('c-warn', 15), color: 'var(--color-orange-4)' }}>
                {favCount}
              </span>
            </div>
            <div className="flex gap-2 flex-wrap">
              {favApps.map((app, i) => {
                const Icon = getAppIcon(app.icon)
                return (
                  <button
                    key={app.id}
                    onClick={() => navigate(app.route)}
                    className="fav-btn rounded-xl px-3.5 py-2 flex items-center gap-2.5"
                    style={{
                      background: 'var(--gl-bg)',
                      backdropFilter: 'var(--gl-blur)',
                      border: '1px solid var(--gl-border-b)',
                      borderTopColor: 'var(--gl-border-t)',
                      animation: `fade-in-up var(--dur-slow) var(--ease-out) forwards`,
                      animationDelay: `${700 + i * 60}ms`,
                      opacity: 0,
                    }}
                  >
                    <Icon className="w-4 h-4" style={{ color: app.color }} />
                    <span className="text-xs hidden sm:inline" style={{ color: 'var(--text)' }}>
                      {app.name}
                    </span>
                    <button
                      onClick={e => { e.stopPropagation(); toggleFavorite(app.id) }}
                      className="w-4 h-4 rounded-full flex items-center justify-center transition-transform hover:scale-110"
                      style={{ background: tint('c-warn', 20) }}
                    >
                      <X size={10} className="font-bold" style={{ color: cssVar('c-warn') }} />
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
              <GlassPanel
                key={app.id}
                onClick={() => navigate(app.route)}
                className="app-card p-5 flex flex-col items-center text-center group relative"
              >
                {/* Favorite star */}
                <button
                  onClick={e => { e.stopPropagation(); toggleFavorite(app.id) }}
                  className={`absolute top-2.5 right-2.5 p-1 rounded-full transition-all duration-150 hover:scale-110 ${
                    isFav ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                  }`}
                  title={isFav ? 'Remove from favorites' : 'Add to favorites'}
                >
                  <Star
                    className={`w-3.5 h-3.5 transition-colors ${
                      isFav ? 'text-yellow-400 fill-yellow-400' : 'text-gray-500 hover:text-yellow-400'
                    }`}
                  />
                </button>

                {/* Icon */}
                <div
                  className="app-icon w-14 h-14 rounded-2xl flex items-center justify-center mb-3"
                  style={{
                    background: `linear-gradient(135deg, ${app.color}18 0%, ${app.color}08 100%)`,
                    boxShadow: `0 0 24px ${app.color}22`,
                  }}
                >
                  <Icon className="w-7 h-7" style={{ color: app.color }} />
                </div>

                {/* Labels */}
                <h3 className="font-medium text-sm mb-1" style={{ color: 'var(--text)' }}>
                  {app.name}
                </h3>
                <p className="text-xs line-clamp-2" style={{ color: 'var(--text3)' }}>
                  {app.description}
                </p>

                {/* Hermes badge */}
                {app.hermesEnabled && (
                  <div
                    className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded-full"
                    style={{ background: `${app.color}15`, color: `${app.color}bb` }}
                  >
                    <div className="w-1 h-1 rounded-full animate-pulse" style={{ background: app.color }} />
                    AI
                  </div>
                )}
              </GlassPanel>
            )
          })}
        </div>

        {/* Empty state */}
        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
            <Telescope size={36} className="text-cyan-400 opacity-60" />
            <p className="text-sm font-medium mb-1" style={{ color: 'var(--text2)' }}>
              No apps found
            </p>
            <p className="text-xs" style={{ color: 'var(--text3)' }}>
              Try a different search term
            </p>
          </div>
        )}

        {/* Footer */}
        <p className="text-center text-xs mt-12 pb-24 animate-fade-in" style={{ color: 'var(--text3)', animationDelay: '1s' }}>
          The Empire · {apps.length} apps · {favCount} favorites
        </p>
      </div>
    </div>
  )
}