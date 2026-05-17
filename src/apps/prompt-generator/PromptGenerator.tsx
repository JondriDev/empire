import { useEffect } from 'react'
import { Card } from '../../components/ui'
import { emit } from '../../lib/eventBus'

export default function PromptGenerator() {
  useEffect(() => { emit({ type: 'APP_OPENED', appId: 'prompt-generator' }) }, [])
  const generate = (prompt: string) => { emit({ type: 'PROMPT_GENERATED', prompt }) }
  return (
    <Card className="p-6">
      <h1 className="text-2xl font-bold mb-4">Prompt Generator</h1>
      <button onClick={() => generate('Write a story about...')} className="px-4 py-2 bg-pink-500 text-white rounded">Generate</button>
      <p className="mt-4">Prompt generator placeholder</p>
    </Card>
  )
}