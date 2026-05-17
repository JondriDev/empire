import { useEffect } from 'react'
import { Card } from '../../components/ui'
import { emit } from '../../lib/eventBus'

export default function Video() {
  useEffect(() => { emit({ type: 'APP_OPENED', appId: 'video' }) }, [])
  return (
    <Card className="p-6">
      <h1 className="text-2xl font-bold mb-4">Video Player</h1>
      <p>Video player placeholder</p>
    </Card>
  )
}