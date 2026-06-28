// ── Clock — pure, storage-agnostic logic ─────────────────────────────────────
// Extracted so the Clock app's stateful surfaces (persistence, alarm firing,
// countdown timer) are unit-testable without a DOM or a real storage backend.
// The component owns React state + intervals; this module owns the maths and
// the (de)serialization, so a reload genuinely restores what the user set.

export interface Alarm {
  id: string
  time: string // 'HH:MM' 24h
  label: string
  enabled: boolean
  days: string[] // subset of DAYS
}

export interface WorldClock {
  city: string
  timezone: string // IANA tz id
}

export interface ClockState {
  alarms: Alarm[]
  worldClocks: WorldClock[]
  is24Hour: boolean
}

export const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const

// Weekday-default alarm + a spread of timezones — the seed a fresh install shows.
export const DEFAULT_ALARMS: Alarm[] = [
  { id: 'seed-morning', time: '08:00', label: 'Morning', enabled: true, days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] },
]

export const DEFAULT_WORLD_CLOCKS: WorldClock[] = [
  { city: 'New York', timezone: 'America/New_York' },
  { city: 'London', timezone: 'Europe/London' },
  { city: 'Tokyo', timezone: 'Asia/Tokyo' },
  { city: 'Dubai', timezone: 'Asia/Dubai' },
  { city: 'Sydney', timezone: 'Australia/Sydney' },
]

export function defaultClockState(): ClockState {
  return {
    alarms: DEFAULT_ALARMS.map(a => ({ ...a, days: [...a.days] })),
    worldClocks: DEFAULT_WORLD_CLOCKS.map(w => ({ ...w })),
    is24Hour: false,
  }
}

// Curated city list for the "add world clock" picker (offline, no geo API).
export const CITY_OPTIONS: WorldClock[] = [
  { city: 'Los Angeles', timezone: 'America/Los_Angeles' },
  { city: 'Denver', timezone: 'America/Denver' },
  { city: 'New York', timezone: 'America/New_York' },
  { city: 'São Paulo', timezone: 'America/Sao_Paulo' },
  { city: 'London', timezone: 'Europe/London' },
  { city: 'Paris', timezone: 'Europe/Paris' },
  { city: 'Moscow', timezone: 'Europe/Moscow' },
  { city: 'Dubai', timezone: 'Asia/Dubai' },
  { city: 'Mumbai', timezone: 'Asia/Kolkata' },
  { city: 'Singapore', timezone: 'Asia/Singapore' },
  { city: 'Tokyo', timezone: 'Asia/Tokyo' },
  { city: 'Sydney', timezone: 'Australia/Sydney' },
  { city: 'Auckland', timezone: 'Pacific/Auckland' },
  { city: 'Honolulu', timezone: 'Pacific/Honolulu' },
]

// ── Formatting ───────────────────────────────────────────────────────────────

/** Stopwatch: MM:SS.cc (counts up; centiseconds for that race feel). */
export function formatStopwatch(ms: number): string {
  const safe = Math.max(0, ms)
  const totalSeconds = Math.floor(safe / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  const centiseconds = Math.floor((safe % 1000) / 10)
  return `${pad(minutes)}:${pad(seconds)}.${pad(centiseconds)}`
}

/** Countdown timer: H:MM:SS once past an hour, else MM:SS. Rounds up so a
 *  remaining 4.2s reads "0:05" — a countdown should never show 0 while live. */
export function formatTimer(ms: number): string {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000))
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  if (hours > 0) return `${hours}:${pad(minutes)}:${pad(seconds)}`
  return `${pad(minutes)}:${pad(seconds)}`
}

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

// ── Alarm firing ─────────────────────────────────────────────────────────────

/**
 * Whether `alarm` should fire at the given moment. Pure: the component passes
 * the current HH:MM, weekday label and seconds, so this is trivially testable
 * and the fire-exactly-once-per-minute rule lives in one place.
 */
export function alarmShouldFire(
  alarm: Alarm,
  nowHHMM: string,
  todayDay: string,
  seconds: number,
): boolean {
  if (!alarm.enabled) return false
  if (seconds !== 0) return false
  if (alarm.time !== nowHHMM) return false
  return alarm.days.includes(todayDay)
}

// ── Persistence ──────────────────────────────────────────────────────────────

export const CLOCK_STORAGE_KEY = 'empire-clock-state'

export function serializeClockState(state: ClockState): string {
  return JSON.stringify({
    alarms: state.alarms,
    worldClocks: state.worldClocks,
    is24Hour: state.is24Hour,
  })
}

/**
 * Tolerant load: bad JSON, a null payload, or a partial/old shape all fall back
 * to sensible defaults field-by-field (so adding a field never wipes a user's
 * saved alarms). Always returns a fully-formed, render-safe ClockState.
 */
export function deserializeClockState(raw: string | null | undefined): ClockState {
  const base = defaultClockState()
  if (!raw) return base
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return base
  }
  if (!parsed || typeof parsed !== 'object') return base
  const p = parsed as Record<string, unknown>

  const alarms = Array.isArray(p.alarms)
    ? (p.alarms as unknown[]).filter(isAlarm).map(sanitizeAlarm)
    : base.alarms
  const worldClocks = Array.isArray(p.worldClocks)
    ? (p.worldClocks as unknown[]).filter(isWorldClock)
    : base.worldClocks
  const is24Hour = typeof p.is24Hour === 'boolean' ? p.is24Hour : base.is24Hour

  return { alarms, worldClocks, is24Hour }
}

function isAlarm(v: unknown): v is Alarm {
  if (!v || typeof v !== 'object') return false
  const a = v as Record<string, unknown>
  return typeof a.id === 'string' && typeof a.time === 'string' && Array.isArray(a.days)
}

function sanitizeAlarm(a: Alarm): Alarm {
  return {
    id: a.id,
    time: a.time,
    label: typeof a.label === 'string' ? a.label : 'Alarm',
    enabled: a.enabled !== false,
    days: a.days.filter((d): d is string => typeof d === 'string' && (DAYS as readonly string[]).includes(d)),
  }
}

function isWorldClock(v: unknown): v is WorldClock {
  if (!v || typeof v !== 'object') return false
  const w = v as Record<string, unknown>
  return typeof w.city === 'string' && typeof w.timezone === 'string'
}
