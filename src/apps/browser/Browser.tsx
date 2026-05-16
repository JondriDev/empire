import { useState } from 'react'
import { Card } from '../../components/ui'

export default function Browser() {
  const [url, setUrl] = useState('https://www.google.com')
  
  return (
    <Card className="p-6">
      <h1 className="text-2xl font-bold mb-4">Web Browser</h1>
      <div className="space-y-4">
        <input 
          type="text"
          className="w-full p-2 text-black"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Enter URL"
        />
        <div className="mt-4 p-4 bg-gray-800 rounded">
          <p>Browser would load: {url}</p>
        </div>
      </div>
    </Card>
  )
}