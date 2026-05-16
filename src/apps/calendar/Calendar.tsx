import { useState } from 'react'
import { Button, Card, Input } from '../../components/ui'

export default function Calendar() {
  const [date, setDate] = useState(new Date())
  
  return (
    <Card className="p-6">
      <h1 className="text-2xl font-bold mb-4">Calendar</h1>
      <p>Calendar app placeholder</p>
    </Card>
  )
}