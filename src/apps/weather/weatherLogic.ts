// ── Weather — pure, network-agnostic logic ───────────────────────────────────
// Extracted so the WMO-code mapping and the Open-Meteo JSON → view-model transform
// are unit-testable over a fixture, with no `fetch`. The component owns the network
// call + React state; this module owns the pure parse/mapping. Mirrors the
// clock/datacenter logic-module pattern.

export type Cat = 'clear' | 'cloud' | 'rain' | 'snow' | 'storm' | 'fog'

export interface DayForecast { day: string; cat: Cat; hi: number; lo: number }

export interface WeatherData {
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

export const EMPTY: WeatherData = {
  temp: 0, condition: '—', humidity: 0, windSpeed: 0,
  location: 'Weather', description: 'Loading…', cat: 'clear', daily: [],
}

// Shape of the slice of the Open-Meteo `/forecast` response that we consume.
export interface OpenMeteoCurrent {
  temperature_2m: number
  relative_humidity_2m: number
  wind_speed_10m: number
  weather_code: number
}
export interface OpenMeteoDaily {
  time: string[]
  weather_code: number[]
  temperature_2m_max: number[]
  temperature_2m_min: number[]
}
export interface OpenMeteoForecast {
  current: OpenMeteoCurrent
  daily?: OpenMeteoDaily
}

/** WMO weather interpretation codes → label / description / icon category. */
export function wmo(code: number): { label: string; description: string; cat: Cat } {
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

/**
 * Short weekday label for an ISO date string ('Today' for index 0).
 *
 * Open-Meteo's `daily.time` entries are date-only strings (`YYYY-MM-DD`) naming a
 * LOCAL forecast day. `new Date('2026-07-16')` parses as UTC midnight, which
 * `toLocaleDateString` then renders in the local zone — shifting the weekday back
 * a day for any negative-offset (Americas) user. Build a LOCAL Date from the parts
 * so the label names the day the forecast actually means. Falls back to the raw
 * string if the shape is unexpected.
 */
function dayLabel(iso: string, index: number): string {
  if (index === 0) return 'Today'
  const [y, m, d] = iso.split('-').map(Number)
  if (!y || !m || !d) return iso
  return new Date(y, m - 1, d).toLocaleDateString([], { weekday: 'short' })
}

/**
 * Map an Open-Meteo forecast response + resolved place name → the render-ready
 * `WeatherData`. Pure: no network, no React. Rounds temps/wind, caps the outlook
 * at 5 days, and tolerates a missing `daily` block (returns an empty outlook).
 */
export function mapForecast(data: OpenMeteoForecast, place: string): WeatherData {
  const cur = data.current
  const w = wmo(cur.weather_code)
  const daily: DayForecast[] = (data.daily?.time ?? []).slice(0, 5).map((iso, i) => ({
    day: dayLabel(iso, i),
    cat: wmo(data.daily!.weather_code[i]).cat,
    hi: Math.round(data.daily!.temperature_2m_max[i]),
    lo: Math.round(data.daily!.temperature_2m_min[i]),
  }))
  return {
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
}
