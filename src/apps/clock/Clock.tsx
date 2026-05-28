import { useState, useEffect, useRef, useCallback } from 'react'
import { Card, Button } from '../../components/ui'
import { emit } from '../../lib/eventBus'
import { Clock as ClockIcon, Globe, Timer, AlarmClock, Play, Pause, RotateCcw, Trash2, Plus } from 'lucide-react'

// ── Types ───────────────────────────────────────────────────────────────────
interface WorldClock { city: string; timezone: string; time: string }
interface Alarm { id: string; time: string; label: string; enabled: boolean; days: string[] }
interface Stopwatch { elapsed: number; running: boolean; laps: number[] }

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

// ── Stopwatch helpers ────────────────────────────────────────────────────────
function formatStopwatch(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  const centiseconds = Math.floor((ms % 1000) / 10)
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(centiseconds).padStart(2, '0')}`
}

// ── Clock App ───────────────────────────────────────────────────────────────
export default function Clock() {
  const [time, setTime] = useState(() => new Date().toLocaleTimeString([], { hour12: false }))
  const [date, setDate] = useState(() => new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }))
  const [timezone] = useState(() => Intl.DateTimeFormat().resolvedOptions().timeZone)
  const [is24Hour, setIs24Hour] = useState(false)
  const [worldClocks] = useState<WorldClock[]>([
    { city: 'New York', timezone: 'America/New_York', time: '' },
    { city: 'London', timezone: 'Europe/London', time: '' },
    { city: 'Tokyo', timezone: 'Asia/Tokyo', time: '' },
    { city: 'Dubai', timezone: 'Asia/Dubai', time: '' },
    { city: 'Sydney', timezone: 'Australia/Sydney', time: '' },
  ])

  // ── Alarms ──────────────────────────────────────────────────────────────
  const [alarms, setAlarms] = useState<Alarm[]>([
    { id: '1', time: '08:00', label: 'Morning', enabled: true, days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] },
  ])
  const [newAlarmTime, setNewAlarmTime] = useState('09:00')
  const [newAlarmLabel, setNewAlarmLabel] = useState('')
  const [alarmSound, setAlarmSound] = useState(false)
  const alarmRef = useRef<{ current: () => void } | null>(null)

  // ── Stopwatch ────────────────────────────────────────────────────────────
  const [stopwatch, setStopwatch] = useState<Stopwatch>({ elapsed: 0, running: false, laps: [] })
  const stopwatchRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const startTimeRef = useRef<number>(0)
  const elapsedRef = useRef<number>(0)

  // ── Active tab ──────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<'clock' | 'stopwatch' | 'alarm'>('clock')

  // ── Tick ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    emit({ type: 'APP_OPENED', appId: 'clock' })
    const tick = () => {
      const now = new Date()
      const hh = is24Hour ? '2-digit' : undefined
      setTime(now.toLocaleTimeString([], { hour12: !is24Hour, hour: hh, minute: '2-digit', second: '2-digit' }))
      setDate(now.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }))

      // Check alarms
      setAlarms(prev => prev.map(a => {
        if (!a.enabled) return a
        const alarmHHMM = a.time
        const nowHHMM = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
        const today = DAYS[now.getDay()]
        if (alarmHHMM === nowHHMM && now.getSeconds() === 0 && a.days.includes(today)) {
          if (alarmSound) {
            try { alarmRef.current?.current() } catch { /* noop */ }
          }
          // Emit event for cross-app notification
          emit({ type: 'EVENT_CREATED', eventId: a.id, title: a.label || 'Alarm', date: now.toISOString().split('T')[0], time: a.time })
        }
        return a
      }))
    }
    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
  }, [is24Hour, alarmSound])

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

  // ── World clock time ─────────────────────────────────────────────────────
  const worldTime = (tz: string) => {
    return new Date().toLocaleTimeString([], { timeZone: tz, hour: '2-digit', minute: '2-digit', hour12: !is24Hour })
  }

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      {/* Tab bar */}
      <div className="flex gap-2 p-1 bg-black/20 rounded-xl">
        {(['clock', 'stopwatch', 'alarm'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${activeTab === tab
              ? 'bg-cyan-600 text-white shadow-lg'
              : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
            {tab === 'clock' && <ClockIcon className="inline w-4 h-4 mr-1" />}
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
                <ClockIcon className="w-5 h-5 mr-2 text-cyan-300" />
                Clock
              </h1>
              <Button onClick={() => setIs24Hour(h => !h)} className="text-xs px-3 py-1">
                {is24Hour ? '24H' : '12H'}
              </Button>
            </div>
            <div className="text-center py-4">
              <div className="text-5xl font-mono font-bold tracking-wider text-white">{time}</div>
              <div className="text-base text-gray-400 mt-2">{date}</div>
              <div className="text-xs text-gray-500 mt-1 font-mono">{timezone}</div>
            </div>
          </Card>

          <Card className="p-4">
            <h2 className="text-base font-semibold mb-3 flex items-center">
              <Globe className="w-4 h-4 mr-2 text-teal-400" />
              World Clocks
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {worldClocks.map(clock => (
                <div key={clock.city} className="p-3 bg-black/20 rounded-lg border border-white/5">
                  <div className="text-xs text-gray-400 mb-1">{clock.city}</div>
                  <div className="text-xl font-mono font-semibold">{worldTime(clock.timezone)}</div>
                  <div className="text-xs text-gray-500">{clock.timezone.split('/').pop()?.replace('_', ' ')}</div>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}

      {/* ── Stopwatch Tab ── */}
      {activeTab === 'stopwatch' && (
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center">
            <Timer className="w-5 h-5 mr-2 text-cyan-300" />
            Stopwatch
          </h2>
          <div className="text-center py-6">
            <div className="text-5xl font-mono font-bold tracking-wider mb-2">
              {formatStopwatch(stopwatch.elapsed)}
            </div>
            <div className="flex justify-center gap-3 mt-4">
              <Button onClick={() => setStopwatch(s => ({ ...s, running: !s.running }))}
                className="w-14 h-14 rounded-full bg-cyan-600 hover:bg-cyan-500 flex items-center justify-center">
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
                }
              }} className="w-14 h-14 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center">
                <RotateCcw className="w-5 h-5" />
              </Button>
            </div>
          </div>
          {stopwatch.laps.length > 0 && (
            <div className="mt-4 max-h-48 overflow-y-auto">
              <h3 className="text-sm font-semibold text-gray-400 mb-2">Laps</h3>
              {stopwatch.laps.map((lap, i) => (
                <div key={i} className="flex justify-between py-1 border-b border-white/5 text-sm font-mono">
                  <span className="text-gray-400">Lap {stopwatch.laps.length - i}</span>
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
              <Plus className="w-4 h-4 mr-2 text-cyan-300" />
              Add Alarm
            </h2>
            <div className="flex gap-2 items-end">
              <div className="flex-1">
                <label className="text-xs text-gray-400 block mb-1">Time</label>
                <input type="time" value={newAlarmTime} onChange={e => setNewAlarmTime(e.target.value)}
                  className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white font-mono focus:border-cyan-500 focus:outline-none" />
              </div>
              <div className="flex-1">
                <label className="text-xs text-gray-400 block mb-1">Label</label>
                <input type="text" value={newAlarmLabel} onChange={e => setNewAlarmLabel(e.target.value)}
                  placeholder="Alarm label"
                  className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-cyan-500 focus:outline-none" />
              </div>
              <Button onClick={addAlarm} className="px-4 py-2">Add</Button>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <input type="checkbox" id="alarm-sound" checked={alarmSound} onChange={e => setAlarmSound(e.target.checked)}
                className="accent-cyan-600" />
              <label htmlFor="alarm-sound" className="text-xs text-gray-400">Play sound (uses browser audio)</label>
            </div>
          </Card>

          <Card className="p-4">
            <h2 className="text-base font-semibold mb-3 flex items-center">
              <AlarmClock className="w-4 h-4 mr-2 text-cyan-300" />
              Alarms ({alarms.filter(a => a.enabled).length} active)
            </h2>
            {alarms.length === 0 && <p className="text-gray-500 text-sm py-4 text-center">No alarms set</p>}
            {alarms.map(alarm => (
              <div key={alarm.id} className={`p-3 rounded-lg mb-2 border transition-all ${alarm.enabled ? 'border-cyan-500/30 bg-cyan-500/5' : 'border-white/5 bg-black/20 opacity-50'}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-mono font-bold">{alarm.time}</span>
                    <span className="text-sm text-gray-400">{alarm.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => toggleAlarm(alarm.id)}
                      className={`w-10 h-6 rounded-full transition-all ${alarm.enabled ? 'bg-cyan-600' : 'bg-gray-600'}`}>
                      <div className={`w-4 h-4 bg-white rounded-full transition-transform ${alarm.enabled ? 'translate-x-5' : 'translate-x-1'}`} />
                    </button>
                    <button onClick={() => removeAlarm(alarm.id)} className="text-gray-500 hover:text-red-400 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="flex gap-1 flex-wrap">
                  {DAYS.map(day => (
                    <button key={day} onClick={() => toggleDay(alarm.id, day)}
                      className={`text-xs px-2 py-1 rounded transition-all ${alarm.days.includes(day) ? 'bg-cyan-600 text-white' : 'bg-white/5 text-gray-500'}`}>
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