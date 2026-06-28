import { useState, useEffect, useCallback } from 'react'
import {
  CloudSun, Cloud, CloudRain, CloudSnow, CloudFog, Zap, Sun,
  Settings, RefreshCw, Thermometer, Droplets, Wind, AlertCircle, MapPin,
} from 'lucide-react'
import { emit } from '../../lib/eventBus'

/**
 * Weather — real forecasts via Open-Meteo (free, no API key, CORS-friendly).
 *
 * Geocodes a place name (or uses device geolocation for "Auto") then pulls the
 * current conditions + a multi-day outlook. WMO weather codes map to a small
 * set of categories so one icon set covers every condition.
 */

const WEATHER_CONFIG_KEY = 'empire-weather-config'

interface WeatherConfig { location: string } // 'Auto' → device geolocation

type Cat = 'clear' | 'cloud' | 'rain' | 'snow' | 'storm' | 'fog'

interface DayForecast { day: string; cat: Cat; hi: number; lo: number }

interface WeatherData {
  temp: number
  condition: string
  humidity: number
  windSpeed: number
  location: string
  description: string
  cat: Cat
  daily: DayForecast[]
  isLoading?: boolean
  error?: string
}

const EMPTY: WeatherData = {
  temp: 0, condition: '—', humidity: 0, windSpeed: 0,
  location: 'Weather', description: 'Loading…', cat: 'clear', daily: [],
}

// WMO weather interpretation codes → label / description / icon category.
function wmo(code: number): { label: string; description: string; cat: Cat } {
  if (code === 0) return { label: 'Clear', description: 'Clear sky', cat: 'clear' }
  if (code <= 2) return { label: 'Partly Cloudy', description: 'Partly cloudy', cat: 'cloud' }
  if (code === 3) return { label: 'Overcast', description: 'Overcast', cat: 'cloud' }
  if (code <= 48) return { label: 'Fog', description: 'Fog', cat: 'fog' }
  if (code <= 57) return { label: 'Drizzle', description: 'Light drizzle', cat: 'rain' }
  if (code <= 67) return { label: 'Rain', description: 'Rain', cat: 'rain' }
  if (code <= 77) return { label: 'Snow', description: 'Snow', cat: 'snow' }
  if (code <= 82) return { label: 'Showers', description: 'Rain showers', cat: 'rain' }
  if (code <= 86) return { label: 'Snow', description: 'Snow showers', cat: 'snow' }
  return { label: 'Storm', description: 'Thunderstorm', cat: 'storm' }
}

const CAT_ICON: Record<Cat, typeof Sun> = {
  clear: Sun, cloud: Cloud, rain: CloudRain, snow: CloudSnow, storm: Zap, fog: CloudFog,
}
// Consume the JondriDev DS palette tokens (Earth-from-Space) — never raw hex.
const CAT_COLOR: Record<Cat, string> = {
  clear: 'var(--c-warn)', cloud: 'var(--c-mesin)', rain: 'var(--c-cakra)',
  snow: 'var(--xenon)', storm: 'var(--c-kosakata)', fog: 'var(--text3)',
}

interface GeoPlace { lat: number; lon: number; name: string }

async function geocode(name: string): Promise<GeoPlace> {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(name)}&count=1&language=en&format=json`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Geocoding failed (${res.status})`)
  const data = await res.json()
  const r = data.results?.[0]
  if (!r) throw new Error(`No place found for "${name}"`)
  return { lat: r.latitude, lon: r.longitude, name: r.country_code ? `${r.name}, ${r.country_code}` : r.name }
}

function getPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) return reject(new Error('No geolocation'))
    navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 8000, maximumAge: 600000 })
  })
}

export default function Weather() {
  const [config, setConfig] = useState<WeatherConfig>(() => {
    try {
      const saved = localStorage.getItem(WEATHER_CONFIG_KEY)
      if (saved) return JSON.parse(saved)
    } catch { /* ignore */ }
    return { location: 'Auto' }
  })

  const [weather, setWeather] = useState<WeatherData>({ ...EMPTY, isLoading: true })
  const [showSettings, setShowSettings] = useState(false)
  const [tempLocation, setTempLocation] = useState('')

  const fetchWeather = useCallback(async (cfg: WeatherConfig) => {
    setWeather(prev => ({ ...prev, isLoading: true, error: undefined }))
    try {
      let lat: number, lon: number, place: string
      if (!cfg.location || cfg.location === 'Auto') {
        try {
          const pos = await getPosition()
          lat = pos.coords.latitude; lon = pos.coords.longitude; place = 'Your location'
        } catch {
          const g = await geocode('Jakarta'); lat = g.lat; lon = g.lon; place = g.name
        }
      } else {
        const g = await geocode(cfg.location); lat = g.lat; lon = g.lon; place = g.name
      }

      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}`
        + `&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code`
        + `&daily=weather_code,temperature_2m_max,temperature_2m_min`
        + `&wind_speed_unit=kmh&timezone=auto&forecast_days=5`
      const res = await fetch(url)
      if (!res.ok) throw new Error(`Weather API error (${res.status})`)
      const data = await res.json()

      const cur = data.current
      const w = wmo(cur.weather_code)
      const daily: DayForecast[] = (data.daily?.time ?? []).slice(0, 5).map((iso: string, i: number) => ({
        day: i === 0 ? 'Today' : new Date(iso).toLocaleDateString([], { weekday: 'short' }),
        cat: wmo(data.daily.weather_code[i]).cat,
        hi: Math.round(data.daily.temperature_2m_max[i]),
        lo: Math.round(data.daily.temperature_2m_min[i]),
      }))

      const next: WeatherData = {
        temp: Math.round(cur.temperature_2m),
        condition: w.label,
        humidity: cur.relative_humidity_2m,
        windSpeed: Math.round(cur.wind_speed_10m),
        location: place,
        description: w.description,
        cat: w.cat,
        daily,
        isLoading: false,
      }
      setWeather(next)
      emit({ type: 'WEATHER_UPDATED', temp: next.temp, condition: next.condition, humidity: next.humidity, windSpeed: next.windSpeed, location: next.location, description: next.description })
    } catch (error: unknown) {
      setWeather(prev => ({ ...prev, isLoading: false, error: error instanceof Error ? error.message : 'Failed to fetch weather' }))
    }
  }, [])

  useEffect(() => {
    emit({ type: 'APP_OPENED', appId: 'weather' })
    fetchWeather(config)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSaveConfig = () => {
    const newConfig: WeatherConfig = { location: tempLocation.trim() || 'Auto' }
    setConfig(newConfig)
    localStorage.setItem(WEATHER_CONFIG_KEY, JSON.stringify(newConfig))
    setShowSettings(false)
    fetchWeather(newConfig)
  }

  const MainIcon = CAT_ICON[weather.cat]

  return (
    <div className="p-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: `${CAT_COLOR[weather.cat]}22` }}>
            <MainIcon className="w-7 h-7" style={{ color: CAT_COLOR[weather.cat] }} />
          </div>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-1.5">
              {weather.location}
            </h1>
            <p className="text-sm text-gray-400 capitalize">{weather.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => fetchWeather(config)} className="p-2 rounded-xl hover:bg-white/10 transition-colors" title="Refresh">
            <RefreshCw className={`w-5 h-5 ${weather.isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => { setTempLocation(config.location === 'Auto' ? '' : config.location); setShowSettings(true) }}
            className="p-2 rounded-xl hover:bg-white/10 transition-colors"
            title="Settings"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Display */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="p-6 rounded-2xl border border-white/10" style={{ background: 'var(--card-bg)' }}>
          <div className="flex items-center gap-2 mb-2">
            <Thermometer className="w-4 h-4 text-red-400" />
            <span className="text-xs text-gray-400">Temperature</span>
          </div>
          {weather.isLoading ? <div className="text-4xl font-light text-gray-600 animate-pulse">--°C</div>
            : <div className="text-4xl font-light">{weather.temp}°C</div>}
        </div>

        <div className="p-6 rounded-2xl border border-white/10" style={{ background: 'var(--card-bg)' }}>
          <div className="flex items-center gap-2 mb-2">
            <CloudSun className="w-4 h-4 text-yellow-400" />
            <span className="text-xs text-gray-400">Condition</span>
          </div>
          {weather.isLoading ? <div className="text-lg font-medium text-gray-600 animate-pulse">--</div>
            : <div className="text-lg font-medium">{weather.condition}</div>}
        </div>

        <div className="p-6 rounded-2xl border border-white/10" style={{ background: 'var(--card-bg)' }}>
          <div className="flex items-center gap-2 mb-2">
            <Droplets className="w-4 h-4 text-blue-400" />
            <span className="text-xs text-gray-400">Humidity</span>
          </div>
          {weather.isLoading ? <div className="text-2xl font-light text-gray-600 animate-pulse">--%</div>
            : <div className="text-2xl font-light">{weather.humidity}%</div>}
        </div>

        <div className="p-6 rounded-2xl border border-white/10" style={{ background: 'var(--card-bg)' }}>
          <div className="flex items-center gap-2 mb-2">
            <Wind className="w-4 h-4 text-teal-400" />
            <span className="text-xs text-gray-400">Wind</span>
          </div>
          {weather.isLoading ? <div className="text-2xl font-light text-gray-600 animate-pulse">-- km/h</div>
            : <div className="text-2xl font-light">{weather.windSpeed} km/h</div>}
        </div>
      </div>

      {/* Multi-day outlook */}
      {weather.daily.length > 0 && (
        <div className="grid grid-cols-5 gap-2 mb-4">
          {weather.daily.map((d, i) => {
            const DayIcon = CAT_ICON[d.cat]
            return (
              <div key={i} className="p-3 rounded-xl border border-white/10 flex flex-col items-center gap-1.5" style={{ background: 'var(--card-bg)' }}>
                <span className="text-[11px] text-gray-400">{d.day}</span>
                <DayIcon className="w-5 h-5" style={{ color: CAT_COLOR[d.cat] }} />
                <span className="text-xs"><span className="font-medium">{d.hi}°</span> <span className="text-gray-500">{d.lo}°</span></span>
              </div>
            )
          })}
        </div>
      )}

      {/* Source / last updated */}
      {!weather.isLoading && !weather.error && (
        <div className="text-center text-[10px] text-gray-600">
          Open-Meteo · updated {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      )}

      {/* Error Display */}
      {weather.error && (
        <div className="mt-4 p-3 rounded-xl border border-red-500/20 bg-red-500/10 text-xs text-red-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{weather.error}</span>
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={() => setShowSettings(false)}>
          <div className="w-full max-w-md rounded-2xl border border-white/10 p-6" style={{ background: 'var(--card-bg)' }} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Settings className="w-4 h-4" /> Weather Settings
              </h2>
              <button onClick={() => setShowSettings(false)} className="text-gray-400 hover:text-white">
                <span className="text-xl">×</span>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-400 mb-1 block flex items-center gap-1"><MapPin className="w-3 h-3" /> Location</label>
                <input
                  value={tempLocation}
                  onChange={e => setTempLocation(e.target.value)}
                  className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  style={{ background: 'var(--input-bg)', color: 'var(--text)' }}
                  placeholder="City name (leave empty to use your location)"
                />
                <p className="text-[10px] text-gray-600 mt-1">Powered by Open-Meteo — free, no API key.</p>
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button onClick={() => setShowSettings(false)} className="flex-1 px-4 py-2 rounded-xl border border-white/10 text-sm hover:bg-white/5 transition-colors">
                Cancel
              </button>
              <button onClick={handleSaveConfig} className="flex-1 px-4 py-2 rounded-xl bg-blue-600 text-white text-sm hover:bg-blue-500 transition-colors">
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
