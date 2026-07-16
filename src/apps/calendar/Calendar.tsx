/**
 * Calendar — connected to the Empire eventBus
 * Full event CRUD, month/year grid, dark theme, Cakra integration.
 */

import { useState, useEffect, useCallback } from 'react'
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, Trash2, X, Check, Clock } from 'lucide-react'
import { emit } from '../../lib/eventBus'
import { mirrorCollection } from '../../lib/core/sync'
import { NodeActions } from '../../components/ui/NodeActions'
import { Button, IconButton, Input, TextArea } from '../../components/ui'
import { useInboundHandoff } from '../../lib/useInboundHandoff'
import { onActivate } from '../../lib/a11y'
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
  // Hydrate synchronously so the first render already holds saved events —
  // otherwise the `[events]` save+mirror effect runs with `[]` on mount and
  // prunes every persisted `event` node before the load lands (Calendar
  // self-mirrors its own storage; the empty-first-render prune churned ids).
  // Migrate-in-place: `tags`/`color` were added later, so a legacy event (the
  // store's `CalendarEvent` shape predates them) has neither — default them so
  // the render never reads `.tags.length` off undefined (a crash) or a `${color}`
  // class off undefined.
  const [events, setEvents] = useState<CalendarEvent[]>(() => {
    try {
      const saved = localStorage.getItem('empire-calendar-events')
      const raw: unknown = saved ? JSON.parse(saved) : []
      if (!Array.isArray(raw)) return []
      return raw.map((e): CalendarEvent => ({
        ...e,
        tags: Array.isArray(e.tags) ? e.tags : [],
        color: typeof e.color === 'string' && e.color ? e.color : 'bg-signal',
      }))
    } catch { return [] }
  })
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
          ? { ...e, title: newTitle.trim(), date: newDate, time: newTime, description: newDescription, tags, color: newColor }
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
    <div className="flex flex-col md:flex-row h-full" style={{ background: 'var(--bg)' }}>
      {/* Calendar Grid */}
      <div className="flex-1 flex flex-col overflow-hidden p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <CalendarIcon className="w-6 h-6 text-signal" /> Calendar
          </h1>
          <div className="flex items-center gap-2">
            <span className="text-base font-semibold">{MONTHS[month]} {year}</span>
            <IconButton size="sm" aria-label="Previous month" onClick={() => navigate(-1)}
              icon={<ChevronLeft className="w-4 h-4" />} />
            <Button size="sm" onClick={() => setCurrentDate(new Date())}>Today</Button>
            <IconButton size="sm" aria-label="Next month" onClick={() => navigate(1)}
              icon={<ChevronRight className="w-4 h-4" />} />
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
              return <div key={`empty-${i}`} className="bg-void/20 p-2 min-h-[52px] md:min-h-[80px]" />
            }
            const dateStr = formatDate(year, month, day)
            const isToday = dateStr === today
            const dayEvents = getEventsForDay(day)
            const isSelected = dateStr === selectedDate

            return (
              <div
                key={day}
                role="button"
                tabIndex={0}
                aria-label={`Select ${dateStr}`}
                onClick={() => setSelectedDate(dateStr)}
                onKeyDown={onActivate(() => setSelectedDate(dateStr))}
                className={`group bg-void/30 p-1.5 min-h-[52px] md:min-h-[80px] cursor-pointer transition-colors hover:bg-glass ${
                  isSelected ? 'ring-1 ring-signal' : ''
                } ${isToday ? 'bg-signal/10' : ''}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-xs font-medium ${isToday ? 'text-signal' : 'text-muted'}`}>
                    {day}
                  </span>
                  <span className="opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                    <IconButton size="sm" aria-label={`Add event on ${dateStr}`}
                      onClick={e => { e.stopPropagation(); openAddForm(day) }}
                      style={{ width: 22, height: 22 }}
                      icon={<Plus className="w-3 h-3 text-signal" />} />
                  </span>
                </div>
                <div className="space-y-0.5">
                  {dayEvents.slice(0, 3).map(e => (
                    <div key={e.id}
                      role="button"
                      tabIndex={0}
                      aria-label={`Edit ${e.title}`}
                      onClick={e_ => { e_.stopPropagation(); openEditForm(e) }}
                      onKeyDown={onActivate(() => openEditForm(e))}
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
      <div className="w-full md:w-72 border-t md:border-t-0 md:border-l p-4 overflow-y-auto flex flex-col" style={{ borderColor: 'var(--border)' }}>
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
            <div key={e.id} role="button" tabIndex={0} aria-label={`Edit ${e.title}`}
              onClick={() => openEditForm(e)}
              onKeyDown={onActivate(() => openEditForm(e))}
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
        <Button variant="primary" fullWidth className="mt-3" icon={<Plus className="w-4 h-4" />}
          onClick={() => {
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
          }}>
          Add Event
        </Button>
      </div>

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: tint('void', 60) }}>
          <div className="w-full max-w-md rounded-2xl border border-hair p-6" style={{ background: 'var(--card-bg)' }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <CalendarIcon className="w-4 h-4" /> {editingEvent ? 'Edit Event' : 'New Event'}
              </h2>
              <IconButton size="sm" variant="ghost" aria-label="Close"
                onClick={() => { setShowForm(false); setEditingEvent(null) }}
                icon={<X className="w-4 h-4" />} />
            </div>

            <div className="space-y-3">
              <div>
                <label htmlFor="cal-title" className="text-xs text-muted mb-1 block">Title</label>
                <Input value={newTitle} onChange={setNewTitle} id="cal-title"
                  placeholder="Event title..." autoFocus />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label htmlFor="cal-date" className="text-xs text-muted mb-1 block">Date</label>
                  <Input type="date" value={newDate} onChange={setNewDate} id="cal-date" />
                </div>
                <div>
                  <label htmlFor="cal-time" className="text-xs text-muted mb-1 block">Time</label>
                  <Input type="time" value={newTime} onChange={setNewTime} id="cal-time" />
                </div>
              </div>
              <div>
                <label htmlFor="cal-desc" className="text-xs text-muted mb-1 block">Description</label>
                <TextArea value={newDescription} onChange={setNewDescription} id="cal-desc"
                  rows={2} placeholder="Event description..." style={{ minHeight: '60px' }} />
              </div>
              <div>
                <label htmlFor="cal-tags" className="text-xs text-muted mb-1 block">Tags (comma separated)</label>
                <Input value={newTags} onChange={setNewTags} id="cal-tags"
                  placeholder="work, personal, etc." />
              </div>
              <div>
                <span className="text-xs text-muted mb-1 block">Color</span>
                <div className="flex gap-2" role="group" aria-label="Event color">
                  {EVENT_COLORS.map(c => (
                    <IconButton key={c.name} size="sm" aria-label={c.name}
                      aria-pressed={newColor === c.value}
                      onClick={() => setNewColor(c.value)}
                      style={{ width: 24, height: 24, background: 'transparent', border: 'none', padding: 0 }}
                      icon={<span className={`block w-6 h-6 rounded-full ${c.value} ${newColor === c.value ? 'ring-2 ring-signal ring-offset-2 ring-offset-void' : ''}`} />} />
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              {editingEvent && (
                <Button variant="danger" onClick={() => deleteEvent(editingEvent.id)}
                  icon={<Trash2 className="w-4 h-4" />}>
                  Delete
                </Button>
              )}
              <Button variant="secondary" className="flex-1"
                onClick={() => { setShowForm(false); setEditingEvent(null) }}>
                Cancel
              </Button>
              <Button variant="primary" className="flex-1" onClick={saveEvent}
                icon={<Check className="w-4 h-4" />}>
                {editingEvent ? 'Update' : 'Create'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}