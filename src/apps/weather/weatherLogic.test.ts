import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { wmo, mapForecast, type OpenMeteoForecast } from './weatherLogic'

describe('wmo', () => {
  it('maps clear sky (code 0)', () => {
    expect(wmo(0)).toEqual({ label: 'Clear', description: 'Clear sky', cat: 'clear' })
  })
  it('maps rain (code 61) to the rain category', () => {
    expect(wmo(61).cat).toBe('rain')
  })
  it('maps snow (code 71) to the snow category', () => {
    expect(wmo(71).cat).toBe('snow')
  })
  it('maps cloud cover and thunderstorm at the extremes', () => {
    expect(wmo(3).cat).toBe('cloud')
    expect(wmo(95).cat).toBe('storm')
  })
})

const fixture: OpenMeteoForecast = {
  current: {
    temperature_2m: 18.6,
    relative_humidity_2m: 72,
    wind_speed_10m: 11.4,
    weather_code: 61, // rain
  },
  daily: {
    time: ['2026-06-29', '2026-06-30', '2026-07-01'],
    weather_code: [0, 71, 61],
    temperature_2m_max: [24.4, 9.5, 17.8],
    temperature_2m_min: [12.1, -2.6, 8.2],
  },
}

describe('mapForecast', () => {
  it('maps current conditions (rounded) + resolved place', () => {
    const w = mapForecast(fixture, 'Jakarta, ID')
    expect(w.temp).toBe(19) // 18.6 rounded
    expect(w.humidity).toBe(72)
    expect(w.windSpeed).toBe(11) // 11.4 rounded
    expect(w.condition).toBe('Rain')
    expect(w.cat).toBe('rain')
    expect(w.location).toBe('Jakarta, ID')
    expect(w.isLoading).toBe(false)
  })

  it('maps the daily outlook with rounded hi/lo and per-day category', () => {
    const w = mapForecast(fixture, 'Anywhere')
    expect(w.daily).toHaveLength(3)
    expect(w.daily[0]).toMatchObject({ day: 'Today', cat: 'clear', hi: 24, lo: 12 })
    expect(w.daily[1]).toMatchObject({ cat: 'snow', hi: 10, lo: -3 }) // 9.5→10, -2.6→-3
    expect(w.daily[2]).toMatchObject({ cat: 'rain', hi: 18, lo: 8 })
  })

  it('caps the outlook at 5 days', () => {
    const long: OpenMeteoForecast = {
      current: fixture.current,
      daily: {
        time: ['d0', 'd1', 'd2', 'd3', 'd4', 'd5', 'd6'],
        weather_code: [0, 0, 0, 0, 0, 0, 0],
        temperature_2m_max: [1, 2, 3, 4, 5, 6, 7],
        temperature_2m_min: [0, 0, 0, 0, 0, 0, 0],
      },
    }
    expect(mapForecast(long, 'X').daily).toHaveLength(5)
  })

  it('tolerates a missing daily block (empty outlook)', () => {
    const w = mapForecast({ current: fixture.current }, 'NoOutlook')
    expect(w.daily).toEqual([])
    expect(w.temp).toBe(19)
  })

  // Regression: a date-only forecast string names a LOCAL calendar day. Parsing it
  // with `new Date(iso)` yields UTC midnight, so in a negative-offset zone the
  // weekday label rendered locally shifts back a day (Fri → Thu). The label must
  // name the day the forecast means, regardless of the viewer's timezone. TZ forced
  // (mirrors related.test.ts) so a UTC CI reproduces the Americas-user failure.
  describe('local-day weekday labels (America/Los_Angeles, UTC-7/8)', () => {
    const realTZ = process.env.TZ
    beforeAll(() => { process.env.TZ = 'America/Los_Angeles' })
    afterAll(() => { process.env.TZ = realTZ })

    it('labels each forecast day by its LOCAL weekday, not the UTC instant', () => {
      // 2026-07-16 Thu, 2026-07-17 Fri, 2026-07-18 Sat.
      const dated: OpenMeteoForecast = {
        current: fixture.current,
        daily: {
          time: ['2026-07-16', '2026-07-17', '2026-07-18'],
          weather_code: [0, 0, 0],
          temperature_2m_max: [20, 20, 20],
          temperature_2m_min: [10, 10, 10],
        },
      }
      const w = mapForecast(dated, 'LA')
      expect(w.daily[0].day).toBe('Today')
      expect(w.daily[1].day).toBe('Fri') // 2026-07-17, NOT 'Thu' (the UTC-shifted label)
      expect(w.daily[2].day).toBe('Sat') // 2026-07-18, NOT 'Fri'
    })
  })
})
