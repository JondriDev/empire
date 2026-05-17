import { useState, useEffect } from 'react'
import { Card } from '../../components/ui'
import { emit } from '../../lib/eventBus'

export default function Clock() {
  const [time, setTime] = useState(new Date().toLocaleTimeString())

  useEffect(() => {
    emit({ type: 'APP_OPENED', appId: 'clock' })
    const interval = setInterval(() => setTime(new Date().toLocaleTimeString()), 1000)
    return () => clearInterval(interval)
  }, [])
  
  return (
    <Card className="p-6">
      <h1 className="text-2xl font-bold mb-4">Clock</h1>
      <p className="text-4xl font-mono">{time}</p>
    </Card>
  )
}