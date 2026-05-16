import { useState } from 'react'
import { Card } from '../../components/ui'

export default function Language() {
  const [input, setInput] = useState('')
  const [translation, setTranslation] = useState('')

  const handleTranslate = () => {
    // Mock translation
    setTranslation(`Translated: ${input}`)
  }

  return (
    <Card className="p-6">
      <h1 className="text-2xl font-bold mb-4">Language Lab</h1>
      <div className="space-y-4">
        <textarea 
          className="w-full p-2 text-black"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Enter text to translate"
        />
        <button onClick={handleTranslate} className="px-4 py-2 bg-blue-500 text-white rounded">
          Translate
        </button>
        <div className="mt-4 p-4 bg-gray-800 rounded">
          <h2 className="text-lg font-semibold mb-2">Translation:</h2>
          <p>{translation || "No translation yet"}</p>
        </div>
      </div>
    </Card>
  )
}