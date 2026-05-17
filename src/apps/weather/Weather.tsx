import { useState, useEffect } from 'react'
import { Card } from '../../components/ui'
import { emit } from '../../lib/eventBus'

export default function Weather() {
  const [temperature, setTemperature] = useState(72)
  const [condition, setCondition] = useState('Sunny')

  useEffect(() => {
    emit({ type: 'APP_OPENED', appId: 'weather' })
  }, [])

  const refresh = () => {
    emit({ type: 'CALCULATION_RESULT', expression: `weather: ${condition}`, result: `${temperature}°F` })
  }
  
  return (
    <Card className="p-6">
      <h1 className="text-2xl font-bold mb-4">Weather</h1>
      <div className="text-4xl font-bold mb-2">{temperature}°F</div>
      <div className="text-xl">{condition}</div>
    </Card>
  )
}