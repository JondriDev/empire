import { useEffect } from 'react'
import { Card } from '../../components/ui'
import { emit } from '../../lib/eventBus'

export default function Maps() {
  useEffect(() => { emit({ type: 'APP_OPENED', appId: 'maps' }) }, [])
  return (
    <Card className="p-6">
      <h1 className="text-2xl font-bold mb-4">Maps</h1>
      <p>Maps app placeholder</p>
    </Card>
  )
}