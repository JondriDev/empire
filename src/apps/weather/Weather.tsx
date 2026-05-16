import { useState } from 'react'
import { Card } from '../../components/ui'

export default function Weather() {
  const [temperature, setTemperature] = useState(72)
  const [condition, setCondition] = useState('Sunny')
  
  return (
    <Card className="p-6">
      <h1 className="text-2xl font-bold mb-4">Weather</h1>
      <div className="text-4xl font-bold mb-2">{temperature}°F</div>
      <div className="text-xl">{condition}</div>
    </Card>
  )
}