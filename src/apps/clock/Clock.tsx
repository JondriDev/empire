import { useState } from 'react'
import { Card } from '../../components/ui'

export default function Clock() {
  const [time, setTime] = useState(new Date().toLocaleTimeString())
  
  return (
    <Card className="p-6">
      <h1 className="text-2xl font-bold mb-4">Clock</h1>
      <p className="text-4xl font-mono">{time}</p>
    </Card>
  )
}