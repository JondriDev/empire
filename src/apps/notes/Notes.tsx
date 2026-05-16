import { useState } from 'react'
import { Card } from '../../components/ui'

export default function Notes() {
  const [notes, setNotes] = useState('')
  const [savedNotes, setSavedNotes] = useState<string[]>([])

  const handleSave = () => {
    if (notes.trim()) {
      setSavedNotes([...savedNotes, notes])
      setNotes('')
    }
  }

  return (
    <Card className="p-6">
      <h1 className="text-2xl font-bold mb-4">Notes</h1>
      <div className="space-y-4">
        <textarea 
          className="w-full p-2 text-black"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Enter your note here..."
        />
        <button onClick={handleSave} className="px-4 py-2 bg-blue-500 text-white rounded">
          Save Note
        </button>
        <div className="mt-4">
          <h2 className="text-lg font-semibold mb-2">Saved Notes:</h2>
          {savedNotes.map((note, index) => (
            <div key={index} className="mb-2 p-2 bg-gray-800 rounded">
              {note}
            </div>
          ))}
        </div>
      </div>
    </Card>
  )
}