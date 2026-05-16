import { useState } from 'react'
import { Card } from '../../components/ui'

export default function Grammar(){
  const [text, setText] = useState('')
  const [correctedText, setCorrectedText] = useState('')

  const handleCorrect = () => {
    // Mock correction
    setCorrectedText(text.replace(/\s+/g, ' ').trim())
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