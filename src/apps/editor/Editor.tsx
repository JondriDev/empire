import { useState } from 'react'
import { Card } from '../../components/ui'

export default function Editor() {
  const [code, setCode] = useState('')

  return (
    <Card className="p-6">
      <h1 className="text-2xl font-bold mb-4">Code Editor</h1>
      <div className="space-y-4">
        <textarea 
          className="w-full h-64 p-2 text-black"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Enter your code here..."
        />
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-blue-500 text-white rounded">
            Save
          </button>
          <button className="px-4 py-2 bg-green-500 text-white rounded">
            Run
          </button>
        </div>
      </div>
    </Card>
  )
}