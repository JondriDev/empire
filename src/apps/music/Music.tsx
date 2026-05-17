import { useEffect } from 'react'
import { Card } from '../../components/ui'
import { emit } from '../../lib/eventBus'

export default function Music() {
  useEffect(() => { emit({ type: 'APP_OPENED', appId: 'music' }) }, [])
  return (
    <Card className="p-6">
      <h1 className="text-2xl font-bold mb-4">Music Player</h1>
      <p>Music player placeholder</p>
    </Card>
  )
}