/**
 * Maps — a real interactive map (Leaflet + OpenStreetMap data).
 *
 * Live geocoding via Nominatim (no API key), dark CARTO tiles to match the
 * Empire UI, and bespoke SVG pin markers for search results + saved places.
 * Geolocation, saved places and recent searches persist in localStorage.
 */

import { useEffect, useRef, useState, useCallback } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { emit } from '../../lib/eventBus'
import { Map as MapIcon, Search, Navigation, MapPin, Locate, Trash2, Star } from 'lucide-react'

interface Place {
  id: string
  name: string
  address: string
  lat: number
  lng: number
  saved: boolean
  date: string
}

const ACCENT = 'var(--plasma)' // DS land-green token — Maps' accent
const QUICK = ['Tokyo', 'London', 'New York', 'Paris', 'Dubai', 'Singapore']

const escapeHtml = (s: string) =>
  s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] as string))

// Bespoke teardrop pin as a divIcon — no marker-image asset dependency.
function pinIcon(active: boolean): L.DivIcon {
  // CSS custom properties only resolve in `style`, not in SVG presentation
  // attributes — so fill/stroke go through inline style here.
  const fill = active ? 'var(--xenon)' : 'var(--plasma)'
  return L.divIcon({
    className: 'empire-map-pin',
    html: `<svg width="28" height="28" viewBox="0 0 24 24" style="stroke:var(--void);stroke-width:1"><path d="M12 2C8 2 5 5 5 9c0 5 7 13 7 13s7-8 7-13c0-4-3-7-7-7z" style="fill:${fill}"/><circle cx="12" cy="9" r="2.4" style="fill:var(--void)"/></svg>`,
    iconSize: [28, 28],
    iconAnchor: [14, 26],
    popupAnchor: [0, -24],
  })
}

export default function Maps() {
  const mapEl = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const layerRef = useRef<L.LayerGroup | null>(null)

  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Place[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null)
  const [savedPlaces, setSavedPlaces] = useState<Place[]>([])
  const [activeTab, setActiveTab] = useState<'search' | 'saved'>('search')
  const [recentQueries, setRecentQueries] = useState<string[]>([])
  const [error, setError] = useState('')

  // ── Load persisted state ───────────────────────────────────────────────
  useEffect(() => {
    emit({ type: 'APP_OPENED', appId: 'maps' })
    try {
      const s = localStorage.getItem('empire-maps-saved')
      if (s) setSavedPlaces(JSON.parse(s))
      const r = localStorage.getItem('empire-maps-recent')
      if (r) setRecentQueries(JSON.parse(r))
    } catch { /* ignore */ }
  }, [])

  // ── Initialise the Leaflet map once ────────────────────────────────────
  useEffect(() => {
    if (!mapEl.current || mapRef.current) return
    const map = L.map(mapEl.current, { zoomControl: true, attributionControl: true }).setView([20, 0], 2)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
      maxZoom: 19,
    }).addTo(map)
    layerRef.current = L.layerGroup().addTo(map)
    mapRef.current = map

    // Windowed containers mount at 0×0 then resize — keep Leaflet in sync.
    const ro = new ResizeObserver(() => map.invalidateSize())
    ro.observe(mapEl.current)
    const t = setTimeout(() => map.invalidateSize(), 200)

    return () => {
      clearTimeout(t)
      ro.disconnect()
      map.remove()
      mapRef.current = null
      layerRef.current = null
    }
  }, [])

  const flyTo = useCallback((lat: number, lng: number, zoom = 12) => {
    mapRef.current?.flyTo([lat, lng], zoom, { duration: 0.8 })
  }, [])

  const selectPlace = useCallback((p: Place) => {
    setSelectedPlace(p)
    flyTo(p.lat, p.lng)
  }, [flyTo])

  // ── Render markers for the visible list ────────────────────────────────
  useEffect(() => {
    const layer = layerRef.current
    if (!layer) return
    layer.clearLayers()
    const places = activeTab === 'saved' ? savedPlaces : searchResults
    places.forEach(p => {
      const marker = L.marker([p.lat, p.lng], { icon: pinIcon(selectedPlace?.id === p.id) })
      marker.bindPopup(`<strong>${escapeHtml(p.name)}</strong><br/>${escapeHtml(p.address)}`)
      marker.on('click', () => setSelectedPlace(p))
      marker.addTo(layer)
    })
  }, [searchResults, savedPlaces, activeTab, selectedPlace])

  // ── Real geocoding via Nominatim (OSM, no key) ─────────────────────────
  const searchLocations = useCallback(async (query: string) => {
    const q = query.trim()
    if (!q) return
    setIsSearching(true)
    setError('')
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=8&q=${encodeURIComponent(q)}`,
        { headers: { Accept: 'application/json' } },
      )
      if (!res.ok) throw new Error(`Search failed (${res.status})`)
      const data: unknown = await res.json()
      const results: Place[] = (Array.isArray(data) ? data : [])
        .map((d: Record<string, unknown>, i: number) => ({
          id: `osm-${(d.place_id as number) ?? i}`,
          name: String(d.display_name || '').split(',')[0] || q,
          address: String(d.display_name || ''),
          lat: parseFloat(String(d.lat)),
          lng: parseFloat(String(d.lon)),
          saved: false,
          date: new Date().toISOString(),
        }))
        .filter(p => Number.isFinite(p.lat) && Number.isFinite(p.lng))
        .map(p => ({ ...p, saved: savedPlaces.some(s => s.id === p.id) }))

      setSearchResults(results)
      setActiveTab('search')
      if (results[0]) selectPlace(results[0])
      else setError('No places found. Try another search.')

      setRecentQueries(prev => {
        if (prev.includes(q)) return prev
        const updated = [q, ...prev].slice(0, 10)
        localStorage.setItem('empire-maps-recent', JSON.stringify(updated))
        return updated
      })
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Search failed')
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }, [savedPlaces, selectPlace])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    searchLocations(searchQuery)
  }

  const getCurrentLocation = () => {
    if (!('geolocation' in navigator)) {
      setError('Geolocation not available on this device.')
      return
    }
    navigator.geolocation.getCurrentPosition(
      pos => {
        setError('')
        flyTo(pos.coords.latitude, pos.coords.longitude, 13)
      },
      () => setError('Location access denied.'),
    )
  }

  const savePlace = (place: Place) => {
    if (savedPlaces.some(p => p.id === place.id)) return
    const updated = [{ ...place, saved: true, date: new Date().toISOString() }, ...savedPlaces].slice(0, 30)
    setSavedPlaces(updated)
    localStorage.setItem('empire-maps-saved', JSON.stringify(updated))
    setSearchResults(prev => prev.map(p => (p.id === place.id ? { ...p, saved: true } : p)))
  }

  const removePlace = (id: string) => {
    const updated = savedPlaces.filter(p => p.id !== id)
    setSavedPlaces(updated)
    localStorage.setItem('empire-maps-saved', JSON.stringify(updated))
    setSearchResults(prev => prev.map(p => (p.id === id ? { ...p, saved: false } : p)))
  }

  const directionsTo = (place: Place) => {
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lng}`, '_blank')
  }

  const center = selectedPlace ?? { lat: 20, lng: 0 }

  return (
    <div className="flex h-full" style={{ background: 'var(--bg)' }}>
      {/* Pin icons render as bare SVG, not Leaflet's default white box. */}
      <style>{`.leaflet-div-icon.empire-map-pin{background:transparent;border:none}`}</style>

      {/* Sidebar */}
      <div className="w-80 border-r flex flex-col" style={{ borderColor: 'var(--border)' }}>
        <div className="p-4 border-b" style={{ borderColor: 'var(--border)' }}>
          <h1 className="text-lg font-bold flex items-center gap-2">
            <MapIcon className="w-5 h-5" style={{ color: ACCENT }} /> Maps
          </h1>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text3)' }}>
            {center.lat.toFixed(4)}°, {center.lng.toFixed(4)}°
          </p>
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} className="p-3 border-b" style={{ borderColor: 'var(--border)' }}>
          <div className="flex gap-2">
            <div className="flex-1 flex items-center gap-2 bg-glass rounded-xl px-3 py-2">
              <Search className="w-4 h-4" style={{ color: 'var(--text3)' }} />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search any place or address…"
                className="flex-1 bg-transparent text-sm focus:outline-none"
                style={{ color: 'var(--text)' }}
              />
            </div>
            <button type="submit" className="px-3 py-2 rounded-xl text-fg transition-colors" style={{ background: ACCENT }}>
              <Search className="w-4 h-4" />
            </button>
          </div>
          {recentQueries.length > 0 && !searchQuery && (
            <div className="flex gap-1 mt-2 flex-wrap">
              {recentQueries.slice(0, 5).map(q => (
                <button
                  key={q}
                  onClick={() => { setSearchQuery(q); searchLocations(q) }}
                  className="text-[10px] px-2 py-0.5 rounded-full bg-glass hover:bg-glass"
                  style={{ color: 'var(--text3)' }}
                >
                  {q}
                </button>
              ))}
            </div>
          )}
        </form>

        {/* Tabs */}
        <div className="flex border-b" style={{ borderColor: 'var(--border)' }}>
          <button
            onClick={() => setActiveTab('search')}
            className="flex-1 py-2 text-xs font-medium transition-colors"
            style={{ color: activeTab === 'search' ? ACCENT : 'var(--text3)', borderBottom: activeTab === 'search' ? `2px solid ${ACCENT}` : '2px solid transparent' }}
          >
            <Search className="w-3 h-3 inline mr-1" /> Search
          </button>
          <button
            onClick={() => setActiveTab('saved')}
            className="flex-1 py-2 text-xs font-medium transition-colors"
            style={{ color: activeTab === 'saved' ? ACCENT : 'var(--text3)', borderBottom: activeTab === 'saved' ? `2px solid ${ACCENT}` : '2px solid transparent' }}
          >
            <Star className="w-3 h-3 inline mr-1" /> Saved ({savedPlaces.length})
          </button>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-auto p-3 space-y-2">
          {isSearching && (
            <div className="text-center py-8">
              <Navigation className="w-8 h-8 mx-auto mb-2 animate-pulse" style={{ color: 'var(--text3)' }} />
              <p className="text-sm" style={{ color: 'var(--text3)' }}>Searching…</p>
            </div>
          )}
          {error && !isSearching && <p className="text-xs text-danger px-1">{error}</p>}

          {activeTab === 'search' && !isSearching && (
            <>
              {searchResults.length === 0 && !error && (
                <div className="text-center py-8">
                  <MapPin className="w-10 h-10 mx-auto mb-3" style={{ color: 'var(--text3)' }} />
                  <p className="text-sm" style={{ color: 'var(--text3)' }}>Search for any city, place, or address</p>
                  <div className="flex flex-wrap justify-center gap-1 mt-3">
                    {QUICK.map(c => (
                      <button
                        key={c}
                        onClick={() => { setSearchQuery(c); searchLocations(c) }}
                        className="text-xs px-2 py-1 rounded-lg bg-glass hover:bg-glass"
                        style={{ color: 'var(--text2)' }}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {searchResults.map(place => (
                <div
                  key={place.id}
                  onClick={() => selectPlace(place)}
                  className="p-3 rounded-xl border cursor-pointer transition-all"
                  style={{
                    background: 'var(--card-bg)',
                    borderColor: selectedPlace?.id === place.id ? ACCENT : 'var(--border)',
                  }}
                >
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: ACCENT }} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{place.name}</div>
                      <div className="text-xs truncate" style={{ color: 'var(--text3)' }}>{place.address}</div>
                    </div>
                    <button
                      onClick={e => { e.stopPropagation(); place.saved ? removePlace(place.id) : savePlace(place) }}
                      className="p-1 hover:bg-warn/20 rounded transition-colors"
                      title={place.saved ? 'Unsave' : 'Save'}
                    >
                      <Star className={`w-3.5 h-3.5 ${place.saved ? 'text-warn fill-warn' : ''}`} style={place.saved ? {} : { color: 'var(--text3)' }} />
                    </button>
                  </div>
                </div>
              ))}
            </>
          )}

          {activeTab === 'saved' && (
            <>
              {savedPlaces.length === 0 && (
                <div className="text-center py-8">
                  <Star className="w-10 h-10 mx-auto mb-3" style={{ color: 'var(--text3)' }} />
                  <p className="text-sm" style={{ color: 'var(--text3)' }}>No saved places yet</p>
                  <p className="text-xs mt-1" style={{ color: 'var(--text3)' }}>Search for a place and star it to save</p>
                </div>
              )}
              {savedPlaces.map(place => (
                <div
                  key={place.id}
                  onClick={() => selectPlace(place)}
                  className="p-3 rounded-xl border cursor-pointer transition-all"
                  style={{ background: 'var(--card-bg)', borderColor: selectedPlace?.id === place.id ? ACCENT : 'var(--border)' }}
                >
                  <div className="flex items-start gap-2">
                    <Star className="w-4 h-4 mt-0.5 flex-shrink-0 text-warn fill-warn" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{place.name}</div>
                      <div className="text-xs truncate" style={{ color: 'var(--text3)' }}>{place.address}</div>
                    </div>
                    <button
                      onClick={e => { e.stopPropagation(); removePlace(place.id) }}
                      className="p-1 hover:bg-danger/20 rounded transition-colors"
                      title="Remove"
                    >
                      <Trash2 className="w-3.5 h-3.5" style={{ color: 'var(--text3)' }} />
                    </button>
                  </div>
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={e => { e.stopPropagation(); directionsTo(place) }}
                      className="text-xs px-2 py-1 rounded transition-colors"
                      style={{ background: 'color-mix(in srgb, var(--plasma) 22%, transparent)', color: ACCENT }}
                    >
                      <Navigation className="w-3 h-3 inline mr-1" /> Directions
                    </button>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>

        {/* Location button */}
        <div className="p-3 border-t" style={{ borderColor: 'var(--border)' }}>
          <button
            onClick={getCurrentLocation}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-fg text-sm transition-colors"
            style={{ background: ACCENT }}
          >
            <Locate className="w-4 h-4" /> Use My Location
          </button>
        </div>
      </div>

      {/* Map */}
      <div className="flex-1 relative" style={{ minHeight: 0 }}>
        <div ref={mapEl} className="absolute inset-0" />
        {selectedPlace && (
          <div
            className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[1000] w-[min(92%,28rem)] rounded-2xl border p-4 backdrop-blur"
            style={{ background: 'var(--card-bg)', borderColor: 'var(--border)' }}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: ACCENT }}>
                <MapPin className="w-5 h-5 text-fg" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-semibold truncate">{selectedPlace.name}</div>
                <div className="text-xs truncate" style={{ color: 'var(--text3)' }}>{selectedPlace.address}</div>
              </div>
              <button
                onClick={() => selectedPlace.saved ? removePlace(selectedPlace.id) : savePlace(selectedPlace)}
                className="p-2 rounded-lg hover:bg-glass transition-colors"
                title={selectedPlace.saved ? 'Unsave' : 'Save'}
              >
                <Star className={`w-4 h-4 ${selectedPlace.saved ? 'text-warn fill-warn' : ''}`} style={selectedPlace.saved ? {} : { color: 'var(--text3)' }} />
              </button>
              <button
                onClick={() => directionsTo(selectedPlace)}
                className="px-3 py-2 rounded-lg text-fg text-xs transition-colors flex items-center gap-1"
                style={{ background: ACCENT }}
              >
                <Navigation className="w-3 h-3" /> Directions
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
