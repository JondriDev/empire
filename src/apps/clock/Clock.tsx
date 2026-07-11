import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { Card, Button, IconButton, Segmented, Select, Input } from '../../components/ui'
import { emit } from '../../lib/eventBus'
import { Clock as ClockIcon, Globe, Timer, AlarmClock, Hourglass, Play, Pause, RotateCcw, Trash2, Plus, X, Bell, BellOff } from 'lucide-react'
import {
  DAYS,
  CITY_OPTIONS,
  CLOCK_STORAGE_KEY,
  deserializeClockState,
  serializeClockState,
  formatStopwatch,
  formatTimer,
  alarmShouldFire,
  type Alarm,
  type WorldClock,
} from './clockLogic'

interface Stopwatch { elapsed: number; running: boolean; laps: number[] }

const TIMER_PRESETS = [1, 5, 10, 25] // minutes

// A short offline beep via WebAudio — replaces the original dead `alarmRef` so
// "Play sound" actually rings, with no asset to fetch and no network.
function beep() {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Ctx) return
    const ctx = new Ctx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.type = 'sine'
    osc.frequency.value = 880
    gain.gain.setValueAtTime(0.0001, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.6)
    osc.start()
    osc.stop(ctx.currentTime + 0.62)
    osc.onended = () => ctx.close()
  } catch { /* noop — audio unavailable */ }
}

function safeGet(key: string): string | null {
  try { return localStorage.getItem(key) } catch { return null }
}

// ── Clock App ───────────────────────────────────────────────────────────────
export default function Clock() {
  // Load persisted state once (lazy) so a reload restores the user's setup
  // instead of snapping back to the seed defaults.
  const initial = useMemo(() => deserializeClockState(safeGet(CLOCK_STORAGE_KEY)), [])

  const [time, setTime] = useState(() => new Date().toLocaleTimeString([], { hour12: false }))
  const [date, setDate] = useState(() => new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }))
  const [timezone] = useState(() => Intl.DateTimeFormat().resolvedOptions().timeZone)
  const [is24Hour, setIs24Hour] = useState(initial.is24Hour)
  const [worldClocks, setWorldClocks] = useState<WorldClock[]>(initial.worldClocks)
  const [addCityTz, setAddCityTz] = useState('')

  // ── Alarms ──────────────────────────────────────────────────────────────
  const [alarms, setAlarms] = useState<Alarm[]>(initial.alarms)
  const [newAlarmTime, setNewAlarmTime] = useState('09:00')
  const [newAlarmLabel, setNewAlarmLabel] = useState('')
  const [alarmSound, setAlarmSound] = useState(false)
  const alarmsRef = useRef(alarms)
  alarmsRef.current = alarms
  const soundRef = useRef(alarmSound)
  soundRef.current = alarmSound

  // ── Stopwatch ────────────────────────────────────────────────────────────
  const [stopwatch, setStopwatch] = useState<Stopwatch>({ elapsed: 0, running: false, laps: [] })
  const stopwatchRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const startTimeRef = useRef<number>(0)
  const elapsedRef = useRef<number>(0)

  // ── Timer (countdown) ──────────────────────────────────────────────────────
  const [timerDuration, setTimerDuration] = useState(5 * 60_000)
  const [timerRemaining, setTimerRemaining] = useState(5 * 60_000)
  const [timerRunning, setTimerRunning] = useState(false)
  const [timerDone, setTimerDone] = useState(false)
  const [customMin, setCustomMin] = useState(5)
  const [customSec, setCustomSec] = useState(0)
  const timerEndRef = useRef<number>(0)

  // ── Active tab ──────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<'clock' | 'timer' | 'stopwatch' | 'alarm'>('clock')

  // ── Persist alarms / prefs / world clocks ──────────────────────────────────
  useEffect(() => {
    try {
      localStorage.setItem(CLOCK_STORAGE_KEY, serializeClockState({ alarms, worldClocks, is24Hour }))
    } catch { /* ignore quota / unavailable */ }
  }, [alarms, worldClocks, is24Hour])

  // ── Tick (clock + alarm firing) ─────────────────────────────────────────────
  useEffect(() => {
    emit({ type: 'APP_OPENED', appId: 'clock' })
    const tick = () => {
      const now = new Date()
      const hh = is24Hour ? '2-digit' : undefined
      setTime(now.toLocaleTimeString([], { hour12: !is24Hour, hour: hh, minute: '2-digit', second: '2-digit' }))
      setDate(now.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }))

      const nowHHMM = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
      const today = DAYS[now.getDay()]
      for (const a of alarmsRef.current) {
        if (alarmShouldFire(a, nowHHMM, today, now.getSeconds())) {
          if (soundRef.current) beep()
          emit({ type: 'EVENT_CREATED', eventId: a.id, title: a.label || 'Alarm', date: now.toISOString().split('T')[0], time: a.time })
        }
      }
    }
    tick()
    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
  }, [is24Hour])

  // ── Stopwatch interval ────────────────────────────────────────────────────
  useEffect(() => {
    if (stopwatch.running) {
      startTimeRef.current = Date.now() - elapsedRef.current
      stopwatchRef.current = setInterval(() => {
        elapsedRef.current = Date.now() - startTimeRef.current
        setStopwatch(prev => ({ ...prev, elapsed: elapsedRef.current }))
      }, 33)
    } else {
      if (stopwatchRef.current) { clearInterval(stopwatchRef.current); stopwatchRef.current = null }
    }
    return () => { if (stopwatchRef.current) clearInterval(stopwatchRef.current) }
  }, [stopwatch.running])

  // ── Timer interval ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!timerRunning) return
    timerEndRef.current = Date.now() + timerRemaining
    const id = setInterval(() => {
      const rem = timerEndRef.current - Date.now()
      if (rem <= 0) {
        setTimerRemaining(0)
        setTimerRunning(false)
        setTimerDone(true)
        if (soundRef.current) beep()
        const now = new Date()
        emit({ type: 'EVENT_CREATED', eventId: `timer-${now.getTime()}`, title: 'Timer finished', date: now.toISOString().split('T')[0], time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) })
      } else {
        setTimerRemaining(rem)
      }
    }, 100)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timerRunning])

  const setTimerTo = useCallback((ms: number) => {
    setTimerRunning(false)
    setTimerDone(false)
    setTimerDuration(ms)
    setTimerRemaining(ms)
  }, [])

  const toggleTimer = useCallback(() => {
    if (timerRemaining <= 0) { setTimerRemaining(timerDuration); setTimerDone(false); setTimerRunning(true); return }
    setTimerDone(false)
    setTimerRunning(r => !r)
  }, [timerRemaining, timerDuration])

  const resetTimer = useCallback(() => {
    setTimerRunning(false)
    setTimerDone(false)
    setTimerRemaining(timerDuration)
  }, [timerDuration])

  const applyCustomTimer = useCallback(() => {
    const ms = (Math.max(0, customMin) * 60 + Math.max(0, Math.min(59, customSec))) * 1000
    if (ms > 0) setTimerTo(ms)
  }, [customMin, customSec, setTimerTo])

  const addAlarm = useCallback(() => {
    if (!newAlarmTime) return
    const id = Date.now().toString()
    setAlarms(prev => [...prev, { id, time: newAlarmTime, label: newAlarmLabel || 'Alarm', enabled: true, days: [...DAYS] }])
    setNewAlarmLabel('')
  }, [newAlarmTime, newAlarmLabel])

  const removeAlarm = useCallback((id: string) => {
    setAlarms(prev => prev.filter(a => a.id !== id))
  }, [])

  const toggleAlarm = useCallback((id: string) => {
    setAlarms(prev => prev.map(a => a.id === id ? { ...a, enabled: !a.enabled } : a))
  }, [])

  const toggleDay = useCallback((alarmId: string, day: string) => {
    setAlarms(prev => prev.map(a => {
      if (a.id !== alarmId) return a
      const days = a.days.includes(day) ? a.days.filter(d => d !== day) : [...a.days, day]
      return { ...a, days }
    }))
  }, [])

  // ── World clocks ──────────────────────────────────────────────────────────
  const availableCities = useMemo(
    () => CITY_OPTIONS.filter(c => !worldClocks.some(w => w.timezone === c.timezone)),
    [worldClocks],
  )
  const addWorldClock = useCallback(() => {
    const city = CITY_OPTIONS.find(c => c.timezone === addCityTz)
    if (!city) return
    setWorldClocks(prev => prev.some(w => w.timezone === city.timezone) ? prev : [...prev, { ...city }])
    setAddCityTz('')
  }, [addCityTz])
  const removeWorldClock = useCallback((tz: string) => {
    setWorldClocks(prev => prev.filter(w => w.timezone !== tz))
  }, [])

  const worldTime = (tz: string) =>
    new Date().toLocaleTimeString([], { timeZone: tz, hour: '2-digit', minute: '2-digit', hour12: !is24Hour })

  const timerProgress = timerDuration > 0 ? Math.max(0, Math.min(1, timerRemaining / timerDuration)) : 0

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      {/* Tab bar */}
      <div className="flex justify-center">
        <Segmented
          ariaLabel="Clock mode"
          value={activeTab}
          onChange={v => setActiveTab(v as typeof activeTab)}
          items={[
            { value: 'clock', label: 'Clock', icon: <ClockIcon className="w-4 h-4" /> },
            { value: 'timer', label: 'Timer', icon: <Hourglass className="w-4 h-4" /> },
            { value: 'stopwatch', label: 'Stopwatch', icon: <Timer className="w-4 h-4" /> },
            { value: 'alarm', label: 'Alarm', icon: <AlarmClock className="w-4 h-4" /> },
          ]}
        />
      </div>

      {/* ── Clock Tab ── */}
      {activeTab === 'clock' && (
        <>
          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <h1 className="text-xl font-bold flex items-center">
                <ClockIcon className="w-5 h-5 mr-2 text-signal" />
                Clock
              </h1>
              <Button onClick={() => setIs24Hour(h => !h)} className="text-xs px-3 py-1">
                {is24Hour ? '24H' : '12H'}
              </Button>
            </div>
            <div className="text-center py-4">
              <div className="text-5xl font-mono font-bold tracking-wider text-fg">{time}</div>
              <div className="text-base text-muted mt-2">{date}</div>
              <div className="text-xs text-faint mt-1 font-mono">{timezone}</div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold flex items-center">
                <Globe className="w-4 h-4 mr-2 text-signal" />
                World Clocks
              </h2>
              {availableCities.length > 0 && (
                <div className="flex items-center gap-2">
                  <div className="w-40">
                    <Select
                      ariaLabel="Add a city"
                      value={addCityTz}
                      onChange={setAddCityTz}
                      options={[
                        { value: '', label: 'Add city…' },
                        ...availableCities.map(c => ({ value: c.timezone, label: c.city })),
                      ]}
                    />
                  </div>
                  <IconButton onClick={addWorldClock} aria-label="Add world clock" icon={<Plus className="w-4 h-4" />} disabled={!addCityTz} />
                </div>
              )}
            </div>
            {worldClocks.length === 0 ? (
              <p className="text-faint text-sm py-4 text-center">No world clocks — add a city above.</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {worldClocks.map(clock => (
                  <div key={clock.timezone} className="group relative p-3 bg-void/20 rounded-lg border border-hair">
                    <IconButton onClick={() => removeWorldClock(clock.timezone)}
                      size="sm"
                      className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity"
                      aria-label={`Remove ${clock.city}`}
                      icon={<X className="w-3 h-3" />} />
                    <div className="text-xs text-muted mb-1">{clock.city}</div>
                    <div className="text-xl font-mono font-semibold">{worldTime(clock.timezone)}</div>
                    <div className="text-xs text-faint">{clock.timezone.split('/').pop()?.replace('_', ' ')}</div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </>
      )}

      {/* ── Timer Tab ── */}
      {activeTab === 'timer' && (
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center">
            <Hourglass className="w-5 h-5 mr-2 text-signal" />
            Timer
          </h2>
          <div className="text-center py-4">
            <div className={`text-6xl font-mono font-bold tracking-wider mb-1 transition-colors ${timerDone ? 'text-signal animate-pulse' : 'text-fg'}`}>
              {formatTimer(timerRemaining)}
            </div>
            <div className="text-xs text-faint mb-4">{timerDone ? 'Time’s up' : timerRunning ? 'Counting down' : 'Ready'}</div>

            {/* Progress bar */}
            <div className="h-1.5 w-full bg-glass rounded-full overflow-hidden mb-5">
              <div className="h-full bg-signal rounded-full transition-[width] duration-200 ease-linear"
                style={{ width: `${timerProgress * 100}%` }} />
            </div>

            {/* Presets */}
            <div className="flex justify-center mb-4">
              <Segmented
                ariaLabel="Timer presets"
                value={!timerRunning ? String(timerDuration) : ''}
                onChange={v => setTimerTo(Number(v))}
                items={TIMER_PRESETS.map(min => ({ value: String(min * 60_000), label: `${min}m` }))}
              />
            </div>

            {/* Custom duration */}
            <div className="flex items-end justify-center gap-2 mb-5">
              <div>
                <label htmlFor="timer-min" className="text-xs text-muted block mb-1">Min</label>
                <Input id="timer-min" className="w-20" mono type="number" min={0} max={999}
                  aria-label="Minutes"
                  value={String(customMin)}
                  onChange={v => setCustomMin(parseInt(v) || 0)} />
              </div>
              <span className="text-faint pb-2">:</span>
              <div>
                <label htmlFor="timer-sec" className="text-xs text-muted block mb-1">Sec</label>
                <Input id="timer-sec" className="w-20" mono type="number" min={0} max={59}
                  aria-label="Seconds"
                  value={String(customSec)}
                  onChange={v => setCustomSec(Math.max(0, Math.min(59, parseInt(v) || 0)))} />
              </div>
              <Button onClick={applyCustomTimer} className="text-xs px-3 py-2">Set</Button>
            </div>

            {/* Controls */}
            <div className="flex justify-center gap-3">
              <Button onClick={toggleTimer}
                className="w-14 h-14 rounded-full bg-signal hover:bg-signal flex items-center justify-center"
                disabled={timerRemaining <= 0 && !timerDone}>
                {timerRunning ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              </Button>
              <Button onClick={resetTimer}
                className="w-14 h-14 rounded-full bg-glass hover:bg-glass flex items-center justify-center">
                <RotateCcw className="w-5 h-5" />
              </Button>
            </div>

            <div className="mt-4 flex items-center justify-center gap-2">
              <input type="checkbox" id="timer-sound" checked={alarmSound} onChange={e => setAlarmSound(e.target.checked)}
                className="accent-signal" />
              <label htmlFor="timer-sound" className="text-xs text-muted">Beep when done</label>
            </div>
          </div>
        </Card>
      )}

      {/* ── Stopwatch Tab ── */}
      {activeTab === 'stopwatch' && (
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center">
            <Timer className="w-5 h-5 mr-2 text-signal" />
            Stopwatch
          </h2>
          <div className="text-center py-6">
            <div className="text-5xl font-mono font-bold tracking-wider mb-2">
              {formatStopwatch(stopwatch.elapsed)}
            </div>
            <div className="flex justify-center gap-3 mt-4">
              <Button onClick={() => setStopwatch(s => ({ ...s, running: !s.running }))}
                className="w-14 h-14 rounded-full bg-signal hover:bg-signal flex items-center justify-center">
                {stopwatch.running ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              </Button>
              <Button onClick={() => {
                if (!stopwatch.running) {
                  if (stopwatch.elapsed > 0) {
                    setStopwatch({ elapsed: 0, running: false, laps: [] })
                    elapsedRef.current = 0
                  } else {
                    setStopwatch(s => ({ ...s, laps: [s.elapsed, ...s.laps] }))
                  }
                } else {
                  setStopwatch(s => ({ ...s, laps: [s.elapsed, ...s.laps] }))
                }
              }} className="w-14 h-14 rounded-full bg-glass hover:bg-glass flex items-center justify-center">
                <RotateCcw className="w-5 h-5" />
              </Button>
            </div>
          </div>
          {stopwatch.laps.length > 0 && (
            <div className="mt-4 max-h-48 overflow-y-auto">
              <h3 className="text-sm font-semibold text-muted mb-2">Laps</h3>
              {stopwatch.laps.map((lap, i) => (
                <div key={i} className="flex justify-between py-1 border-b border-hair text-sm font-mono">
                  <span className="text-muted">Lap {stopwatch.laps.length - i}</span>
                  <span>{formatStopwatch(lap)}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* ── Alarm Tab ── */}
      {activeTab === 'alarm' && (
        <>
          <Card className="p-4">
            <h2 className="text-base font-semibold mb-3 flex items-center">
              <Plus className="w-4 h-4 mr-2 text-signal" />
              Add Alarm
            </h2>
            <div className="flex gap-2 items-end">
              <div className="flex-1">
                <label htmlFor="alarm-time" className="text-xs text-muted block mb-1">Time</label>
                <Input id="alarm-time" className="w-full" mono type="time" aria-label="Alarm time"
                  value={newAlarmTime} onChange={setNewAlarmTime} />
              </div>
              <div className="flex-1">
                <label htmlFor="alarm-label" className="text-xs text-muted block mb-1">Label</label>
                <Input id="alarm-label" className="w-full" placeholder="Alarm label" aria-label="Alarm label"
                  value={newAlarmLabel} onChange={setNewAlarmLabel} />
              </div>
              <Button onClick={addAlarm} className="px-4 py-2">Add</Button>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <input type="checkbox" id="alarm-sound" checked={alarmSound} onChange={e => setAlarmSound(e.target.checked)}
                className="accent-signal" />
              <label htmlFor="alarm-sound" className="text-xs text-muted">Play sound when an alarm fires</label>
            </div>
          </Card>

          <Card className="p-4">
            <h2 className="text-base font-semibold mb-3 flex items-center">
              <AlarmClock className="w-4 h-4 mr-2 text-signal" />
              Alarms ({alarms.filter(a => a.enabled).length} active)
            </h2>
            {alarms.length === 0 && <p className="text-faint text-sm py-4 text-center">No alarms set</p>}
            {alarms.map(alarm => (
              <div key={alarm.id} className={`p-3 rounded-lg mb-2 border transition-all ${alarm.enabled ? 'border-signal/30 bg-signal/5' : 'border-hair bg-void/20 opacity-50'}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-mono font-bold">{alarm.time}</span>
                    <span className="text-sm text-muted">{alarm.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <IconButton onClick={() => toggleAlarm(alarm.id)}
                      aria-label={alarm.enabled ? `Disable ${alarm.label}` : `Enable ${alarm.label}`}
                      aria-pressed={alarm.enabled}
                      variant={alarm.enabled ? 'primary' : 'ghost'}
                      icon={alarm.enabled ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />} />
                    <IconButton onClick={() => removeAlarm(alarm.id)}
                      aria-label={`Remove ${alarm.label}`}
                      icon={<Trash2 className="w-4 h-4" />} />
                  </div>
                </div>
                <div className="flex gap-1 flex-wrap" role="group" aria-label="Repeat days">
                  {DAYS.map(day => (
                    <Button key={day} size="sm" onClick={() => toggleDay(alarm.id, day)}
                      aria-pressed={alarm.days.includes(day)}
                      variant={alarm.days.includes(day) ? 'primary' : 'ghost'}
                      className="text-xs">
                      {day}
                    </Button>
                  ))}
                </div>
              </div>
            ))}
          </Card>
        </>
      )}
    </div>
  )
}
