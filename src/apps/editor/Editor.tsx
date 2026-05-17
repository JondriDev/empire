import { useState, useEffect } from 'react'
import { Card } from '../../components/ui'
import { emit } from '../../lib/eventBus'

export default function Editor() {
  const [code, setCode] = useState('')

  useEffect(() => {
    emit({ type: 'APP_OPENED', appId: 'editor' })
  }, [])

  const runCode = () => {
    emit({ type: 'CODE_RUN', language: 'javascript', code, output: 'Code executed (mock)' })
  }

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
          <button className="px-4 py-2 bg-blue-500 text-white rounded" onClick={() => emit({ type: 'FILE_OPENED', filePath: 'editor:save' })}>
            Save
          </button>
          <button className="px-4 py-2 bg-green-500 text-white rounded" onClick={runCode}>
            Run
          </button>
        </div>
      </div>
    </Card>
  )
}