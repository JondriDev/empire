import { useState, useEffect } from 'react'
import { Card } from '../../components/ui'
import { emit } from '../../lib/eventBus'

export default function Grammar(){
  const [text, setText] = useState('')
  const [correctedText, setCorrectedText] = useState('')

  useEffect(() => {
    emit({ type: 'APP_OPENED', appId: 'grammar' })
  }, [])

  const handleCorrect = () => {
    // Mock correction
    const corrected = text.replace(/\s+/g, ' ').trim()
    setCorrectedText(corrected)
    emit({ type: 'CODE_RUN', language: 'grammar', code: text, output: corrected })
  }

  return (
    <Card className="p-6">
      <h1 className="text-2xl font-bold mb-4">Grammar Fix</h1>
      <div className="space-y-4">
        <textarea 
          className="w-full p-2 text-black"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Enter text to check grammar"
        />
        <button onClick={handleCorrect} className="px-4 py-2 bg-blue-500 text-white rounded">
          Check Grammar
        </button>
        <div className="mt-4 p-4 bg-gray-800 rounded">
          <h2 className="text-lg font-semibold mb-2">Corrected Text:</h2>
          <p>{correctedText || "No corrections yet"}</p>
        </div>
      </div>
    </Card>
  )
}