import { useEffect } from 'react'
import { Card } from '../../components/ui'
import { emit } from '../../lib/eventBus'

export default function Photos() {
  useEffect(() => { emit({ type: 'APP_OPENED', appId: 'photos' }) }, [])
  return (
    <Card className="p-6">
      <h1 className="text-2xl font-bold mb-4">Photos</h1>
      <p>Photos app placeholder</p>
    </Card>
  )
}