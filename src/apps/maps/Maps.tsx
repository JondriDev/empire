/**
 * Maps — connected to the Empire eventBus
 * Interactive map, location search, saved places, dark theme.
 */

import { useEffect, useState, useCallback } from 'react'
import { emit } from '../../lib/eventBus'
import { Map, Search, Navigation, MapPin, Locate, Trash2, Star, Globe, Compass } from 'lucide-react'

interface Place {
  id: string
  name: string
  address: string
  lat: number
  lng: number
  saved: boolean
  date: string
}

const WORLD_CITIES = [
  { name: 'New York', address: 'New York, NY', lat: 40.7128, lng: -74.0060 },
  { name: 'London', address: 'London, UK', lat: 51.5074, lng: -0.1278 },
  { name: 'Tokyo', address: 'Tokyo, Japan', lat: 35.6762, lng: 139.6503 },
  { name: 'Dubai', address: 'Dubai, UAE', lat: 25.2048, lng: 55.2708 },
  { name: 'Sydney', address: 'Sydney, Australia', lat: -33.8688, lng: 151.2093 },
  { name: 'Paris', address: 'Paris, France', lat: 48.8566, lng: 2.3522 },
  { name: 'San Francisco', address: 'San Francisco, CA', lat: 37.7749, lng: -122.4194 },
  { name: 'Singapore', address: 'Singapore', lat: 1.3521, lng: 103.8198 },
]

const CITY_COORDS: Record<string, { lat: number; lng: number }> = {
  'new york': { lat: 40.7128, lng: -74.0060 },
  'london': { lat: 51.5074, lng: -0.1278 },
  'tokyo': { lat: 35.6762, lng: 139.6503 },
  'dubai': { lat: 25.2048, lng: 55.2708 },
  'sydney': { lat: -33.8688, lng: 151.2093 },
  'paris': { lat: 48.8566, lng: 2.3522 },
  'san francisco': { lat: 37.7749, lng: -122.4194 },
  'singapore': { lat: 1.3521, lng: 103.8198 },
  'los angeles': { lat: 34.0522, lng: -118.2437 },
  'chicago': { lat: 41.8781, lng: -87.6298 },
  'berlin': { lat: 52.5200, lng: 13.4050 },
  'mumbai': { lat: 19.0760, lng: 72.8777 },
  'seoul': { lat: 37.5665, lng: 126.9780 },
  'hong kong': { lat: 22.3193, lng: 114.1694 },
  'moscow': { lat: 55.7558, lng: 37.6173 },
  'toronto': { lat: 43.6532, lng: -79.3832 },
}

export default function Maps() {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Place[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [currentLocation, setCurrentLocation] = useState({ lat: 40.7128, lng: -74.0060 })
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null)
  const [savedPlaces, setSavedPlaces] = useState<Place[]>([])
  const [activeTab, setActiveTab] = useState<'search' | 'saved'>('search')
  const [recentQueries, setRecentQueries] = useState<string[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    emit({ type: 'APP_OPENED', appId: 'maps' })
    try {
      const s = localStorage.getItem('empire-maps-saved')
      if (s) setSavedPlaces(JSON.parse(s))
      const r = localStorage.getItem('empire-maps-recent')
      if (r) setRecentQueries(JSON.parse(r))
    } catch { /* ignore */ }
  }, [])

  const searchLocations = useCallback((query: string) => {
    if (!query.trim()) return
    setIsSearching(true)
    setError('')

    // Simulate search with known cities + fuzzy match
    setTimeout(() => {
      const q = query.toLowerCase().trim()
      const results: Place[] = []

      // Exact city match
      const exact = CITY_COORDS[q]
      if (exact) {
        results.push({
          id: `city-${q}`,
          name: q.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
          address: `${q.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}, Earth`,
          lat: exact.lat,
          lng: exact.lng,
          saved: false,
          date: new Date().toISOString(),
        })
      }

      // Fuzzy match
      Object.entries(CITY_COORDS).forEach(([name, coords]) => {
        if (name !== q && name.includes(q)) {
          results.push({
            id: `city-${name}`,
            name: name.split(' ').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
            address: `${name.split(' ').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}`,
            lat: coords.lat,
            lng: coords.lng,
            saved: false,
            date: new Date().toISOString(),
          })
        }
      })

      // Demo results if no match
      if (results.length === 0) {
        WORLD_CITIES.slice(0, 3).forEach(c => {
          results.push({
            id: `demo-${c.name}`,
            name: c.name,
            address: c.address,
            lat: c.lat,
            lng: c.lng,
            saved: false,
            date: new Date().toISOString(),
          })
        })
      }

      setSearchResults(results.slice(0, 8))
      setIsSearching(false)
      setCurrentLocation(results[0] ? { lat: results[0].lat, lng: results[0].lng } : currentLocation)

      // Track recent query
      if (query.trim() && !recentQueries.includes(query.trim())) {
        const updated = [query.trim(), ...recentQueries].slice(0, 10)
        setRecentQueries(updated)
        localStorage.setItem('empire-maps-recent', JSON.stringify(updated))
      }
    }, 300)
  }, [currentLocation, recentQueries])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    searchLocations(searchQuery)
  }

  const getCurrentLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        pos => {
          setCurrentLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude })
          setError('')
        },
        _err => {
          setError('Location access denied. Using default location.')
        }
      )
    } else {
      setError('Geolocation not available on this device.')
    }
  }

  const savePlace = (place: Place) => {
    const existing = savedPlaces.find(p => p.id === place.id)
    if (existing) return
    const toSave = { ...place, saved: true, date: new Date().toISOString() }
    const updated = [toSave, ...savedPlaces].slice(0, 30)
    setSavedPlaces(updated)
    localStorage.setItem('empire-maps-saved', JSON.stringify(updated))
    setSearchResults(prev => prev.map(p => p.id === place.id ? { ...p, saved: true } : p))
  }

  const removePlace = (id: string) => {
    const updated = savedPlaces.filter(p => p.id !== id)
    setSavedPlaces(updated)
    localStorage.setItem('empire-maps-saved', JSON.stringify(updated))
  }

  const navigateTo = (place: Place) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lng}`
    window.open(url, '_blank')
  }

  const openInMaps = (place: Place) => {
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name)}`
    window.open(url, '_blank')
  }

  return (
    <div className="flex h-full" style={{ background: 'var(--bg)' }}>
      {/* Sidebar */}
      <div className="w-80 border-r flex flex-col" style={{ borderColor: 'var(--border)' }}>
        <div className="p-4 border-b" style={{ borderColor: 'var(--border)' }}>
          <h1 className="text-lg font-bold flex items-center gap-2">
            <Map className="w-5 h-5 text-cyan-300" /> Maps
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            {currentLocation.lat.toFixed(4)}°, {currentLocation.lng.toFixed(4)}°
          </p>
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} className="p-3 border-b" style={{ borderColor: 'var(--border)' }}>
          <div className="flex gap-2">
            <div className="flex-1 flex items-center gap-2 bg-white/10 rounded-xl px-3 py-2">
              <Search className="w-4 h-4 text-gray-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search places..."
                className="flex-1 bg-transparent text-sm focus:outline-none"
                style={{ color: 'var(--text)' }}
              />
            </div>
            <button type="submit" className="px-3 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white transition-colors">
              <Search className="w-4 h-4" />
            </button>
          </div>
          {recentQueries.length > 0 && !searchQuery && (
            <div className="flex gap-1 mt-2 flex-wrap">
              {recentQueries.slice(0, 5).map(q => (
                <button key={q} onClick={() => { setSearchQuery(q); searchLocations(q) }}
                  className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-gray-400 hover:text-white">
                  {q}
                </button>
              ))}
            </div>
          )}
        </form>

        {/* Tab buttons */}
        <div className="flex border-b" style={{ borderColor: 'var(--border)' }}>
          <button onClick={() => setActiveTab('search')}
            className={`flex-1 py-2 text-xs font-medium transition-colors ${activeTab === 'search' ? 'text-cyan-300 border-b-2 border-cyan-500' : 'text-gray-500 hover:text-gray-300'}`}>
            <Search className="w-3 h-3 inline mr-1" /> Search
          </button>
          <button onClick={() => setActiveTab('saved')}
            className={`flex-1 py-2 text-xs font-medium transition-colors ${activeTab === 'saved' ? 'text-cyan-300 border-b-2 border-cyan-500' : 'text-gray-500 hover:text-gray-300'}`}>
            <Star className="w-3 h-3 inline mr-1" /> Saved ({savedPlaces.length})
          </button>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-auto p-3 space-y-2">
          {isSearching && (
            <div className="text-center py-8">
              <Navigation className="w-8 h-8 mx-auto mb-2 text-gray-600 animate-pulse" />
              <p className="text-sm text-gray-500">Searching...</p>
            </div>
          )}

          {activeTab === 'search' && !isSearching && (
            <>
              {searchResults.length === 0 && !searchQuery && (
                <div className="text-center py-8">
                  <MapPin className="w-10 h-10 mx-auto mb-3 text-gray-600" />
                  <p className="text-sm text-gray-500">Search for any city or place</p>
                  <div className="flex flex-wrap justify-center gap-1 mt-3">
                    {WORLD_CITIES.slice(0, 6).map(c => (
                      <button key={c.name} onClick={() => { setSearchQuery(c.name); searchLocations(c.name) }}
                        className="text-xs px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400">
                        {c.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {searchResults.map(place => (
                <div key={place.id} onClick={() => setSelectedPlace(place)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    selectedPlace?.id === place.id ? 'border-cyan-500 bg-cyan-500/10' : 'border-white/10 hover:border-white/20'
                  }`} style={{ background: 'var(--card-bg)' }}>
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-cyan-300 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium">{place.name}</div>
                      <div className="text-xs text-gray-500 truncate">{place.address}</div>
                      <div className="text-[10px] text-gray-600 mt-0.5">{place.lat.toFixed(4)}°, {place.lng.toFixed(4)}°</div>
                    </div>
                    <button onClick={e => { e.stopPropagation(); savePlace(place) }}
                      className="p-1 hover:bg-yellow-500/20 rounded transition-colors">
                      <Star className={`w-3.5 h-3.5 ${place.saved ? 'text-yellow-400 fill-yellow-400' : 'text-gray-500'}`} />
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
                  <Star className="w-10 h-10 mx-auto mb-3 text-gray-600" />
                  <p className="text-sm text-gray-500">No saved places yet</p>
                  <p className="text-xs text-gray-600 mt-1">Search for a city and star it to save</p>
                </div>
              )}
              {savedPlaces.map(place => (
                <div key={place.id} onClick={() => { setSelectedPlace(place); setCurrentLocation({ lat: place.lat, lng: place.lng }) }}
                  className="p-3 rounded-xl border border-white/10 hover:border-cyan-500/30 cursor-pointer transition-all"
                  style={{ background: 'var(--card-bg)' }}>
                  <div className="flex items-start gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center flex-shrink-0">
                      <Star className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium">{place.name}</div>
                      <div className="text-xs text-gray-500">{place.address}</div>
                    </div>
                    <button onClick={e => { e.stopPropagation(); removePlace(place.id) }}
                      className="p-1 hover:bg-red-500/20 rounded transition-colors">
                      <Trash2 className="w-3.5 h-3.5 text-gray-500 hover:text-red-400" />
                    </button>
                  </div>
                  <div className="flex gap-2 mt-2">
                    <button onClick={e => { e.stopPropagation(); navigateTo(place) }}
                      className="text-xs px-2 py-1 rounded bg-cyan-600/20 text-cyan-200 hover:bg-cyan-600/30">
                      <Navigation className="w-3 h-3 inline mr-1" /> Directions
                    </button>
                    <button onClick={e => { e.stopPropagation(); openInMaps(place) }}
                      className="text-xs px-2 py-1 rounded bg-white/10 text-gray-400 hover:bg-white/20">
                      <Globe className="w-3 h-3 inline mr-1" /> Open
                    </button>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>

        {/* Location button */}
        <div className="p-3 border-t" style={{ borderColor: 'var(--border)' }}>
          <button onClick={getCurrentLocation}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-sm transition-colors">
            <Locate className="w-4 h-4" /> Use My Location
          </button>
          {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
        </div>
      </div>

      {/* Map Display */}
      <div className="flex-1 flex flex-col">
        <div className="flex-1 relative bg-black/30 m-4 rounded-2xl overflow-hidden border border-white/10">
          {/* Coordinates overlay */}
          <div className="absolute top-3 left-3 z-10 bg-black/60 backdrop-blur px-3 py-1.5 rounded-lg">
            <div className="text-xs text-gray-400">Current Center</div>
            <div className="text-sm font-mono text-white">
              {currentLocation.lat.toFixed(4)}°, {currentLocation.lng.toFixed(4)}°
            </div>
          </div>

          {/* Map content area */}
          <div className="h-full flex items-center justify-center">
            <div className="text-center max-w-md">
              <Compass className="w-16 h-16 mx-auto mb-4 text-cyan-300/50" />
              <h2 className="text-lg font-semibold mb-2">Map View</h2>
              <p className="text-sm text-gray-500 mb-4">
                Search for a place or select from the sidebar to see map details.
              </p>
              
              {selectedPlace && (
                <div className="p-4 rounded-xl border border-white/10 mx-4" style={{ background: 'var(--card-bg)' }}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-white" />
                    </div>
                    <div className="text-left">
                      <div className="font-semibold">{selectedPlace.name}</div>
                      <div className="text-xs text-gray-500">{selectedPlace.address}</div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => navigateTo(selectedPlace)}
                      className="flex-1 px-3 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs transition-colors">
                      <Navigation className="w-3 h-3 inline mr-1" /> Directions
                    </button>
                    <button onClick={() => openInMaps(selectedPlace)}
                      className="flex-1 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-gray-300 text-xs transition-colors">
                      <Globe className="w-3 h-3 inline mr-1" /> Open in Google Maps
                    </button>
                  </div>
                  <div className="mt-3 text-xs text-gray-600 font-mono">
                    {selectedPlace.lat.toFixed(6)}°N, {selectedPlace.lng.toFixed(6)}°E
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}