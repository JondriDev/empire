import { useEffect } from 'react'
import { Card } from '../../components/ui'
import { emit } from '../../lib/eventBus'

export default function Files() {
  useEffect(() => { emit({ type: 'APP_OPENED', appId: 'files' }) }, [])
  const openFile = (path: string) => { emit({ type: 'FILE_OPENED', filePath: path }) }
  return (
    <Card className="p-6">
      <h1 className="text-2xl font-bold mb-4">File Browser</h1>
      <button onClick={() => openFile('/storage/emulated/0/Documents')} className="px-4 py-2 bg-blue-500 text-white rounded">Open Documents</button>
      <p className="mt-4">File browser placeholder</p>
    </Card>
  )
}