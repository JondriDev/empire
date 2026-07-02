/**
 * Calendar — connected to the Empire eventBus
 * Full event CRUD, month/year grid, dark theme, Cakra integration.
 */

import { useState, useEffect, useCallback } from 'react'
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, Trash2, X, Check, Clock } from 'lucide-react'
import { emit } from '../../lib/eventBus'
import { mirrorCollection } from '../../lib/core/sync'
import { NodeActions } from '../../components/ui/NodeActions'
import { useInboundHandoff } from '../../lib/useInboundHandoff'
import { ProvenanceChip } from '../../components/ui/ProvenanceChip'
import { LineageTrail } from '../../components/ui/LineageTrail'
import { tint } from '../../design-system/tokens'

interface CalendarEvent {
  id: string
  title: string
  date: string
  time: string
  description: string
  tags: string[]
  color: string
  /** Source app id when created via a cross-app handoff (S3). Optional → backward-compatible. */
  from?: string
}

const EVENT_COLORS = [
  { name: 'Purple', value: 'bg-signal' },
  { name: 'Blue', value: 'bg-ion' },
  { name: 'Green', value: 'bg-success' },
  { name: 'Red', value: 'bg-danger' },
  { name: 'Orange', value: 'bg-ember' },
  { name: 'Teal', value: 'bg-signal' },
  { name: 'Pink', value: 'bg-danger' },
  { name: 'Yellow', value: 'bg-warn' },
]

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null)

  // Form state
  const [newTitle, setNewTitle] = useState('')
  const [newTime, setNewTime] = useState('12:00')
  const [newDescription, setNewDescription] = useState('')
  const [newTags, setNewTags] = useState('')
  const [newColor, setNewColor] = useState('bg-signal')
  const [newDate, setNewDate] = useState('')
  // Durable source of an inbound-created event; stamped onto the saved event so
  // its origin survives a reload (the sessionStorage chip is consumed on mount).
  const [draftFrom, setDraftFrom] = useState<string | undefined>(undefined)

  useEffect(() => {
    emit({ type: 'APP_OPENED', appId: 'calendar' })
    try {
      const saved = localStorage.getItem('empire-calendar-events')
      if (saved) setEvents(JSON.parse(saved))
    } catch { /* ignore */ }
  }, [])

  useEffect(() => {
    try { localStorage.setItem('empire-calendar-events', JSON.stringify(events)) } catch { /* ignore */ }
    // Mirror Calendar's events into the Core graph so they join the organism.
    mirrorCollection('event', 'calendar', events, {
      id: e => e.id,
      title: e => e.title,
      data: e => ({ date: e.date, time: e.time, description: e.description, tags: e.tags }),
    })
  }, [events])

  // Natural inbound: a cross-app HANDOFF (text → draft event) opens the New
  // Event form prefilled on today. Wired into Calendar's OWN create flow — no
  // central `event` syncer (that would delete Calendar's self-mirrored nodes).
  const inbound = useInboundHandoff<{ text?: string; title?: string; from?: string }>('empire-calendar-clipboard')
  useEffect(() => {
    if (!inbound.payload?.text) return
    const t = inbound.payload.text
    const todayStr = new Date().toISOString().split('T')[0]
    setNewDate(todayStr)
    setNewTitle(inbound.payload.title || t.split('\n')[0].slice(0, 80))
    setNewTime('12:00')
    setNewDescription(inbound.payload.title ? t : '')
    setNewTags('')
    setNewColor('bg-signal')
    setEditingEvent(null)
    setSelectedDate(todayStr)
    setShowForm(true)
    setDraftFrom(inbound.payload.from)
  }, [inbound.payload])

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const today = new Date().toISOString().split('T')[0]

  const pad = (n: number) => n.toString().padStart(2, '0')

  const navigate = (delta: number) => {
    setCurrentDate(new Date(year, month + delta, 1))
  }

  const getEventsForDay = useCallback((day: number) => {
    const dateStr = `${year}-${pad(month + 1)}-${pad(day)}`
    return events.filter(e => e.date === dateStr).sort((a, b) => a.time.localeCompare(b.time))
  }, [events, year, month])

  const formatDate = (year: number, month: number, day: number) =>
    `${year}-${pad(month + 1)}-${pad(day)}`

  const openAddForm = (day: number) => {
    const dateStr = formatDate(year, month, day)
    setNewDate(dateStr)
    setNewTitle('')
    setNewTime('12:00')
    setNewDescription('')
    setNewTags('')
    setNewColor('bg-signal')
    setEditingEvent(null)
    setSelectedDate(dateStr)
    setShowForm(true)
    setDraftFrom(undefined) // manual create has no cross-app source
  }

  const openEditForm = (event: CalendarEvent) => {
    setEditingEvent(event)
    setNewTitle(event.title)
    setNewTime(event.time)
    setNewDescription(event.description)
    setNewTags(event.tags.join(', '))
    setNewColor(event.color)
    setNewDate(event.date)
    setShowForm(true)
  }

  const saveEvent = () => {
    if (!newTitle.trim()) return
    const tags = newTags.split(',').map(t => t.trim()).filter(Boolean)

    if (editingEvent) {
      const updated = events.map(e =>
        e.id === editingEvent.id
          ? { ...e, title: newTitle.trim(), time: newTime, description: newDescription, tags, color: newColor }
          : e
      )
      setEvents(updated)
      emit({ type: 'EVENT_UPDATED', eventId: editingEvent.id, title: newTitle.trim(), date: newDate, time: newTime })
    } else {
      const event: CalendarEvent = {
        id: Date.now().toString(),
        title: newTitle.trim(),
        date: newDate,
        time: newTime,
        description: newDescription,
        tags,
        color: newColor,
        ...(draftFrom ? { from: draftFrom } : {}),
      }
      setEvents(prev => [...prev, event])
      emit({ type: 'EVENT_CREATED', eventId: event.id, title: event.title, date: event.date, time: event.time })
    }
    setShowForm(false)
    setEditingEvent(null)
    setDraftFrom(undefined)
  }

  const deleteEvent = (id: string) => {
    setEvents(prev => prev.filter(e => e.id !== id))
    emit({ type: 'EVENT_DELETED', eventId: id })
    setShowForm(false)
    setEditingEvent(null)
  }

  const todayEvents = getEventsForDay(new Date().getDate())
  const selectedEvents = selectedDate ? events.filter(e => e.date === selectedDate).sort((a, b) => a.time.localeCompare(b.time)) : []

  // Build calendar grid
  const calendarDays: (number | null)[] = []
  for (let i = 0; i < firstDay; i++) calendarDays.push(null)
  for (let d = 1; d <= daysInMonth; d++) calendarDays.push(d)
  while (calendarDays.length % 7 !== 0) calendarDays.push(null)

  return (
    <div className="flex h-full" style={{ background: 'var(--bg)' }}>
      {/* Calendar Grid */}
      <div className="flex-1 flex flex-col overflow-hidden p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <CalendarIcon className="w-6 h-6 text-signal" /> Calendar
          </h1>
          <div className="flex items-center gap-2">
            <span className="text-base font-semibold">{MONTHS[month]} {year}</span>
            <button onClick={() => navigate(-1)}
              className="p-1.5 rounded-lg hover:bg-glass text-muted transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button onClick={() => setCurrentDate(new Date())}
              className="px-2 py-1 rounded-lg bg-signal/20 text-signal text-xs hover:bg-signal/30 transition-colors">
              Today
            </button>
            <button onClick={() => navigate(1)}
              className="p-1.5 rounded-lg hover:bg-glass text-muted transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {inbound.source && (
          <div className="mb-3">
            <ProvenanceChip from={inbound.source} onDismiss={() => { inbound.dismiss(); setDraftFrom(undefined) }} />
          </div>
        )}

        {/* Day headers */}
        <div className="grid grid-cols-7 mb-1">
          {DAYS.map(d => (
            <div key={d} className="text-center text-xs font-medium text-faint py-2">{d}</div>
          ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-7 gap-px bg-glass rounded-xl overflow-hidden flex-1">
          {calendarDays.map((day, i) => {
            if (day === null) {
              return <div key={`empty-${i}`} className="bg-void/20 p-2 min-h-[80px]" />
            }
            const dateStr = formatDate(year, month, day)
            const isToday = dateStr === today
            const dayEvents = getEventsForDay(day)
            const isSelected = dateStr === selectedDate

            return (
              <div
                key={day}
                onClick={() => setSelectedDate(dateStr)}
                className={`bg-void/30 p-1.5 min-h-[80px] cursor-pointer transition-colors hover:bg-glass ${
                  isSelected ? 'ring-1 ring-signal' : ''
                } ${isToday ? 'bg-signal/10' : ''}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-xs font-medium ${isToday ? 'text-signal' : 'text-muted'}`}>
                    {day}
                  </span>
                  <button onClick={e => { e.stopPropagation(); openAddForm(day) }}
                    className="p-0.5 rounded hover:bg-glass opacity-0 hover:opacity-100 transition-opacity">
                    <Plus className="w-3 h-3 text-signal" />
                  </button>
                </div>
                <div className="space-y-0.5">
                  {dayEvents.slice(0, 3).map(e => (
                    <div key={e.id}
                      onClick={e_ => { e_.stopPropagation(); openEditForm(e) }}
                      className={`text-[10px] px-1 py-0.5 rounded truncate text-fg ${e.color} cursor-pointer hover:opacity-80`}>
                      {e.time} {e.title}
                    </div>
                  ))}
                  {dayEvents.length > 3 && (
                    <div className="text-[10px] text-faint px-1">+{dayEvents.length - 3} more</div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Sidebar */}
      <div className="w-72 border-l p-4 overflow-y-auto flex flex-col" style={{ borderColor: 'var(--border)' }}>
        <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <Clock className="w-4 h-4 text-signal" />
          {selectedDate === today || !selectedDate ? "Today's Events" : `Events for ${selectedDate}`}
        </h2>

        {/* Mini today */}
        <div className="text-center p-3 rounded-xl bg-glass border border-hair mb-4">
          <div className="text-3xl font-bold text-signal">{new Date().getDate()}</div>
          <div className="text-xs text-faint">{MONTHS[new Date().getMonth()]} {new Date().getFullYear()}</div>
          <div className="text-xs text-faint mt-1">{new Date().toLocaleDateString('en-US', { weekday: 'long' })}</div>
        </div>

        {/* Events list */}
        <div className="flex-1 space-y-2">
          {(selectedDate ? selectedEvents : todayEvents).length === 0 && (
            <div className="text-center py-8">
              <CalendarIcon className="w-8 h-8 mx-auto mb-2 text-faint" />
              <p className="text-sm text-faint">No events</p>
              <p className="text-xs text-faint mt-1">Click a day to add one</p>
            </div>
          )}
          {(selectedDate ? selectedEvents : todayEvents).map(e => (
            <div key={e.id} onClick={() => openEditForm(e)}
              className="p-3 rounded-xl border border-hair hover:border-signal/30 cursor-pointer transition-all group"
              style={{ background: 'var(--card-bg)' }}>
              <div className="flex items-start gap-2">
                <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${e.color}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-medium">{e.time}</span>
                    {e.tags.length > 0 && (
                      <span className="text-[10px] px-1 py-0.5 rounded bg-signal/20 text-signal ml-auto">
                        {e.tags[0]}
                      </span>
                    )}
                  </div>
                  <div className="text-sm font-semibold mt-0.5">{e.title}</div>
                  {e.description && (
                    <div className="text-xs text-faint mt-0.5 line-clamp-2">{e.description}</div>
                  )}
                  {e.from && (
                    <div className="mt-1.5" onClick={ev => ev.stopPropagation()}>
                      <LineageTrail app="calendar" from={e.from} />
                    </div>
                  )}
                </div>
                <span onClick={(ev) => ev.stopPropagation()} className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                  <NodeActions type="event" sourceId={e.id} />
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Quick add */}
        <button onClick={() => {
          const todayStr = today
          setNewDate(todayStr)
          setNewTitle('')
          setNewTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }))
          setNewDescription('')
          setNewTags('')
          setNewColor('bg-signal')
          setEditingEvent(null)
          setSelectedDate(todayStr)
          setShowForm(true)
          setDraftFrom(undefined)
        }} className="mt-3 flex items-center justify-center gap-1 px-4 py-2 rounded-xl bg-signal hover:bg-signal text-fg text-sm transition-colors">
          <Plus className="w-4 h-4" /> Add Event
        </button>
      </div>

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: tint('void', 60) }}>
          <div className="w-full max-w-md rounded-2xl border border-hair p-6" style={{ background: 'var(--card-bg)' }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <CalendarIcon className="w-4 h-4" /> {editingEvent ? 'Edit Event' : 'New Event'}
              </h2>
              <button onClick={() => { setShowForm(false); setEditingEvent(null) }}
                className="text-muted hover:text-fg"><X className="w-4 h-4" /></button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-muted mb-1 block">Title</label>
                <input value={newTitle} onChange={e => setNewTitle(e.target.value)}
                  className="w-full bg-glass border-0 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-signal"
                  placeholder="Event title..." autoFocus />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-muted mb-1 block">Date</label>
                  <input type="date" value={newDate} onChange={e => setNewDate(e.target.value)}
                    className="w-full bg-glass border-0 rounded-lg px-3 py-2 text-sm text-fg focus:outline-none focus:ring-1 focus:ring-signal" />
                </div>
                <div>
                  <label className="text-xs text-muted mb-1 block">Time</label>
                  <input type="time" value={newTime} onChange={e => setNewTime(e.target.value)}
                    className="w-full bg-glass border-0 rounded-lg px-3 py-2 text-sm text-fg focus:outline-none focus:ring-1 focus:ring-signal" />
                </div>
              </div>
              <div>
                <label className="text-xs text-muted mb-1 block">Description</label>
                <textarea value={newDescription} onChange={e => setNewDescription(e.target.value)}
                  className="w-full bg-glass border-0 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-signal"
                  rows={2} placeholder="Event description..." />
              </div>
              <div>
                <label className="text-xs text-muted mb-1 block">Tags (comma separated)</label>
                <input value={newTags} onChange={e => setNewTags(e.target.value)}
                  className="w-full bg-glass border-0 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-signal"
                  placeholder="work, personal, etc." />
              </div>
              <div>
                <label className="text-xs text-muted mb-1 block">Color</label>
                <div className="flex gap-2">
                  {EVENT_COLORS.map(c => (
                    <button key={c.name} onClick={() => setNewColor(c.value)}
                      className={`w-6 h-6 rounded-full ${c.value} ${newColor === c.value ? 'ring-2 ring-signal ring-offset-2 ring-offset-void' : ''}`}
                      title={c.name} />
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              {editingEvent && (
                <button onClick={() => deleteEvent(editingEvent.id)}
                  className="px-4 py-2 rounded-xl bg-danger/20 hover:bg-danger/30 text-danger text-sm flex items-center gap-1 transition-colors">
                  <Trash2 className="w-4 h-4" /> Delete
                </button>
              )}
              <button onClick={() => { setShowForm(false); setEditingEvent(null) }}
                className="flex-1 px-4 py-2 rounded-xl border border-hair text-sm hover:bg-glass transition-colors">
                Cancel
              </button>
              <button onClick={saveEvent}
                className="flex-1 px-4 py-2 rounded-xl bg-signal hover:bg-signal text-fg text-sm flex items-center gap-1 justify-center transition-colors">
                <Check className="w-4 h-4" /> {editingEvent ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}