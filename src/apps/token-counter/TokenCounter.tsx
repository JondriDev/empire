import { useEffect } from 'react'
import { Card } from '../../components/ui'
import { emit } from '../../lib/eventBus'

export default function TokenCounter() {
  useEffect(() => { emit({ type: 'APP_OPENED', appId: 'token-counter' }) }, [])
  const count = (text: string) => { emit({ type: 'TOKEN_COUNTED', text, count: text.split(/\s+/).length, model: 'estimate' }) }
  return (
    <Card className="p-6">
      <h1 className="text-2xl font-bold mb-4">Token Counter</h1>
      <button onClick={() => count('sample text')} className="px-4 py-2 bg-blue-500 text-white rounded">Count</button>
      <p className="mt-4">Token counter placeholder</p>
    </Card>
  )
}