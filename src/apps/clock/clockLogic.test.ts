import { describe, it, expect } from 'vitest'
import {
  formatStopwatch,
  formatTimer,
  alarmShouldFire,
  serializeClockState,
  deserializeClockState,
  defaultClockState,
  type Alarm,
  type ClockState,
} from './clockLogic'

describe('formatStopwatch', () => {
  it('formats zero as 00:00.00', () => {
    expect(formatStopwatch(0)).toBe('00:00.00')
  })
  it('formats minutes, seconds and centiseconds', () => {
    // 1m 23s 450ms → 01:23.45
    expect(formatStopwatch(83_450)).toBe('01:23.45')
  })
  it('clamps negatives to zero', () => {
    expect(formatStopwatch(-500)).toBe('00:00.00')
  })
})

describe('formatTimer', () => {
  it('shows MM:SS below an hour', () => {
    expect(formatTimer(5 * 60_000)).toBe('05:00')
  })
  it('shows H:MM:SS at or above an hour', () => {
    expect(formatTimer(3 * 3600_000 + 4 * 60_000 + 9_000)).toBe('3:04:09')
  })
  it('rounds up so a live countdown never shows 0 early', () => {
    // 4.2s remaining should read 0:05, not 0:04
    expect(formatTimer(4_200)).toBe('00:05')
  })
  it('floors at 00:00 when done', () => {
    expect(formatTimer(0)).toBe('00:00')
    expect(formatTimer(-1000)).toBe('00:00')
  })
})

describe('alarmShouldFire', () => {
  const base: Alarm = { id: 'a', time: '08:00', label: 'Wake', enabled: true, days: ['Mon', 'Tue'] }

  it('fires on an exact match at the top of the minute on an enabled day', () => {
    expect(alarmShouldFire(base, '08:00', 'Mon', 0)).toBe(true)
  })
  it('does not fire when disabled', () => {
    expect(alarmShouldFire({ ...base, enabled: false }, '08:00', 'Mon', 0)).toBe(false)
  })
  it('does not fire on a day not in the schedule', () => {
    expect(alarmShouldFire(base, '08:00', 'Wed', 0)).toBe(false)
  })
  it('only fires at second 0 (once per minute)', () => {
    expect(alarmShouldFire(base, '08:00', 'Mon', 1)).toBe(false)
  })
  it('does not fire when the time differs', () => {
    expect(alarmShouldFire(base, '08:01', 'Mon', 0)).toBe(false)
  })
})

describe('clock state persistence', () => {
  it('round-trips a full state through serialize/deserialize', () => {
    const state: ClockState = {
      alarms: [{ id: 'x', time: '09:30', label: 'Standup', enabled: true, days: ['Mon'] }],
      worldClocks: [{ city: 'Berlin', timezone: 'Europe/Berlin' }],
      is24Hour: true,
    }
    expect(deserializeClockState(serializeClockState(state))).toEqual(state)
  })

  it('falls back to defaults on null / empty input', () => {
    expect(deserializeClockState(null)).toEqual(defaultClockState())
    expect(deserializeClockState(undefined)).toEqual(defaultClockState())
    expect(deserializeClockState('')).toEqual(defaultClockState())
  })

  it('falls back to defaults on malformed JSON', () => {
    expect(deserializeClockState('{not json')).toEqual(defaultClockState())
  })

  it('migrates a partial/old shape field-by-field (missing fields keep defaults)', () => {
    // An older save that only had alarms — worldClocks/is24Hour must default, not vanish.
    const old = JSON.stringify({ alarms: [{ id: 'o', time: '07:00', label: 'Old', enabled: true, days: ['Sun'] }] })
    const got = deserializeClockState(old)
    expect(got.alarms).toHaveLength(1)
    expect(got.alarms[0].id).toBe('o')
    expect(got.worldClocks).toEqual(defaultClockState().worldClocks)
    expect(got.is24Hour).toBe(false)
  })

  it('drops corrupt entries and unknown weekdays without throwing', () => {
    const dirty = JSON.stringify({
      alarms: [
        { id: 'good', time: '06:00', label: 'OK', enabled: true, days: ['Mon', 'Notaday'] },
        { time: 'no-id' }, // missing id → dropped
        42, // not an object → dropped
      ],
      worldClocks: [{ city: 'X', timezone: 'Etc/UTC' }, { city: 'bad' }],
      is24Hour: 'yes', // wrong type → default false
    })
    const got = deserializeClockState(dirty)
    expect(got.alarms).toHaveLength(1)
    expect(got.alarms[0].days).toEqual(['Mon']) // 'Notaday' filtered out
    expect(got.worldClocks).toHaveLength(1)
    expect(got.is24Hour).toBe(false)
  })
})
