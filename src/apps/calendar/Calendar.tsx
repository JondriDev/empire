import { useState, useEffect } from 'react'
import { Button, Card, Input } from '../../components/ui'
import { emit } from '../../lib/eventBus'

export default function Calendar() {
  const [date, setDate] = useState(new Date())

  useEffect(() => {
    emit({ type: 'APP_OPENED', appId: 'calendar' })
  }, [])

  const createEvent = () => {
    emit({ type: 'EVENT_CREATED', eventId: Date.now().toString(), title: 'New Event', date: new Date().toISOString().split('T')[0], time: '12:00' })
  }

  return (
    <Card className="p-6">
      <h1 className="text-2xl font-bold mb-4">Calendar</h1>
      <button onClick={createEvent} className="mb-4 px-4 py-2 bg-blue-500 text-white rounded">+ Add Event</button>
      <p>Calendar app placeholder</p>
    </Card>
  )
}