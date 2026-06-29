import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { Card, Button } from '../../components/ui'
import { emit } from '../../lib/eventBus'
import { Clock as ClockIcon, Globe, Timer, AlarmClock, Hourglass, Play, Pause, RotateCcw, Trash2, Plus, X } from 'lucide-react'
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
      <div className="flex gap-2 p-1 bg-void/20 rounded-xl">
        {(['clock', 'timer', 'stopwatch', 'alarm'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${activeTab === tab
              ? 'bg-signal text-fg shadow-lg'
              : 'text-muted hover:text-fg hover:bg-glass'}`}>
            {tab === 'clock' && <ClockIcon className="inline w-4 h-4 mr-1" />}
            {tab === 'timer' && <Hourglass className="inline w-4 h-4 mr-1" />}
            {tab === 'stopwatch' && <Timer className="inline w-4 h-4 mr-1" />}
            {tab === 'alarm' && <AlarmClock className="inline w-4 h-4 mr-1" />}
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
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
                  <select value={addCityTz} onChange={e => setAddCityTz(e.target.value)}
                    className="bg-void/30 border border-hair rounded-lg px-2 py-1 text-sm text-fg focus:border-signal focus:outline-none">
                    <option value="">Add city…</option>
                    {availableCities.map(c => <option key={c.timezone} value={c.timezone}>{c.city}</option>)}
                  </select>
                  <Button onClick={addWorldClock} className="text-xs px-2 py-1" disabled={!addCityTz}>
                    <Plus className="w-3 h-3" />
                  </Button>
                </div>
              )}
            </div>
            {worldClocks.length === 0 ? (
              <p className="text-faint text-sm py-4 text-center">No world clocks — add a city above.</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {worldClocks.map(clock => (
                  <div key={clock.timezone} className="group relative p-3 bg-void/20 rounded-lg border border-hair">
                    <button onClick={() => removeWorldClock(clock.timezone)}
                      className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 text-faint hover:text-danger transition"
                      aria-label={`Remove ${clock.city}`}>
                      <X className="w-3 h-3" />
                    </button>
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
            <div className="flex justify-center gap-2 mb-4 flex-wrap">
              {TIMER_PRESETS.map(min => (
                <button key={min} onClick={() => setTimerTo(min * 60_000)}
                  className={`text-sm px-3 py-1.5 rounded-lg transition ${timerDuration === min * 60_000 && !timerRunning
                    ? 'bg-signal text-fg' : 'bg-glass text-muted hover:text-fg hover:bg-glass'}`}>
                  {min}m
                </button>
              ))}
            </div>

            {/* Custom duration */}
            <div className="flex items-end justify-center gap-2 mb-5">
              <div>
                <label className="text-xs text-muted block mb-1">Min</label>
                <input type="number" min={0} max={999} value={customMin}
                  onChange={e => setCustomMin(parseInt(e.target.value) || 0)}
                  className="w-16 bg-void/30 border border-hair rounded-lg px-2 py-1.5 text-fg text-center font-mono focus:border-signal focus:outline-none" />
              </div>
              <span className="text-faint pb-2">:</span>
              <div>
                <label className="text-xs text-muted block mb-1">Sec</label>
                <input type="number" min={0} max={59} value={customSec}
                  onChange={e => setCustomSec(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
                  className="w-16 bg-void/30 border border-hair rounded-lg px-2 py-1.5 text-fg text-center font-mono focus:border-signal focus:outline-none" />
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
                <label className="text-xs text-muted block mb-1">Time</label>
                <input type="time" value={newAlarmTime} onChange={e => setNewAlarmTime(e.target.value)}
                  className="w-full bg-void/30 border border-hair rounded-lg px-3 py-2 text-fg font-mono focus:border-signal focus:outline-none" />
              </div>
              <div className="flex-1">
                <label className="text-xs text-muted block mb-1">Label</label>
                <input type="text" value={newAlarmLabel} onChange={e => setNewAlarmLabel(e.target.value)}
                  placeholder="Alarm label"
                  className="w-full bg-void/30 border border-hair rounded-lg px-3 py-2 text-fg focus:border-signal focus:outline-none" />
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
                    <button onClick={() => toggleAlarm(alarm.id)}
                      className={`w-10 h-6 rounded-full transition-all ${alarm.enabled ? 'bg-signal' : 'bg-faint'}`}>
                      <div className={`w-4 h-4 bg-glass rounded-full transition-transform ${alarm.enabled ? 'translate-x-5' : 'translate-x-1'}`} />
                    </button>
                    <button onClick={() => removeAlarm(alarm.id)} className="text-faint hover:text-danger transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="flex gap-1 flex-wrap">
                  {DAYS.map(day => (
                    <button key={day} onClick={() => toggleDay(alarm.id, day)}
                      className={`text-xs px-2 py-1 rounded transition-all ${alarm.days.includes(day) ? 'bg-signal text-fg' : 'bg-glass text-faint'}`}>
                      {day}
                    </button>
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
