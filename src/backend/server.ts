/**
 * Empire Backend Server
 * 
 * Provides:
 * - AI API proxy (OpenRouter, OpenAI, custom endpoints)
 * - File system operations
 * - WebSocket real-time communication
 * - Local data persistence
 */

import express from 'express'
import { createServer } from 'http'
import { WebSocketServer } from 'ws'
import cors from 'cors'
import dotenv from 'dotenv'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001
const AI_API_KEY = process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY || ''
const AI_BASE_URL = process.env.AI_BASE_URL || 'https://openrouter.ai/api/v1'

// Middleware
app.use(cors())
app.use(express.json())

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// AI Chat Proxy Endpoint
app.post('/api/ai/chat', async (req, res) => {
  const { messages, model, temperature, maxTokens, systemPrompt, apiKey: clientApiKey, baseUrl: clientBaseUrl } = req.body
  
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Messages array is required' })
  }

  const apiKey = clientApiKey || AI_API_KEY
  const baseUrl = clientBaseUrl || AI_BASE_URL

  // Build messages array with system prompt
  const allMessages = systemPrompt 
    ? [{ role: 'system', content: systemPrompt }, ...messages]
    : messages

  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey && { 'Authorization': `Bearer ${apiKey}` }),
        'HTTP-Referer': 'http://localhost:3000',
        'X-Title': 'Empire App Suite'
      },
      body: JSON.stringify({
        model: model || 'deepseek/deepseek-v4-flash',
        messages: allMessages,
        temperature: temperature || 0.7,
        max_tokens: maxTokens || 2048,
        stream: true
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      return res.status(response.status).send(errorText)
    }

    // Stream response
    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')

    const reader = response.body?.getReader()
    if (!reader) {
      throw new Error('No response body')
    }

    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          res.write(`data: ${line.slice(6)}\n\n`)
        }
      }
    }

    res.write('data: [DONE]\n\n')
    res.end()
  } catch (error: unknown) {
  console.error('AI API error:', error)
  const message = error instanceof Error ? error.message : 'AI request failed'
  res.status(500).json({ error: message })
  }
})

// File operations (basic - can be extended)
app.get('/api/files', (req, res) => {
  // This would need filesystem access - placeholder for now
  res.json({ message: 'File operations require additional setup' })
})

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' })
})

// Start server
const server = createServer(app)

// WebSocket Server
const wss = new WebSocketServer({ server, path: '/ws' })

wss.on('connection', (ws) => {
  console.log('Client connected to WebSocket')
  
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message.toString())
      console.log('WS received:', data)
      
      // Broadcast to all connected clients
      wss.clients.forEach((client) => {
        if (client.readyState === client.OPEN) {
          client.send(JSON.stringify({
            type: 'BROADCAST',
            payload: data,
            timestamp: Date.now()
          }))
        }
      })
    } catch (error) {
      console.error('WS error:', error)
    }
  })

  ws.on('close', () => {
    console.log('Client disconnected')
  })

  ws.on('error', (error) => {
    console.error('WS error:', error)
  })
})

server.listen(PORT, () => {
  console.log(`Empire Backend running on http://localhost:${PORT}`)
  console.log(`WebSocket: ws://localhost:${PORT}/ws`)
})

export { app, server, wss }
