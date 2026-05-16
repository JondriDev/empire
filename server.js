import express from 'express';
import path from 'path';
import fs from 'fs';
import http from 'http';
import { WebSocketServer } from 'ws';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });
const PORT = 3001;

const ALLOWED_BASE = process.env.EMPIRE_ROOT || '/storage/emulated/0';

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});
app.use(express.json({ limit: '5mb' }));

// ─── Path safety ────────────────────────────────────────────────
function safePath(userPath) {
  if (!userPath) return ALLOWED_BASE;
  const resolved = path.resolve(String(userPath));
  if (!resolved.startsWith(path.resolve(ALLOWED_BASE))) {
    return path.resolve(ALLOWED_BASE);
  }
  return resolved;
}

// ─── Health ─────────────────────────────────────────────────────
app.get('/api/health', (req, res) => res.json({ status: 'ok', uptime: process.uptime() }));

// ─── File listing ───────────────────────────────────────────────
app.get('/api/files', (req, res) => {
  const dir = safePath(req.query.path);
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    const result = entries
      .filter(e => !e.name.startsWith('.'))
      .map(e => {
        const stat = fs.statSync(path.join(dir, e.name));
        return {
          name: e.name,
          type: e.isDirectory() ? 'folder' : 'file',
          size: e.isFile() ? (stat.size || 0) : 0,
          modified: stat.mtime.toISOString(),
        };
      })
      .sort((a, b) => {
        if (a.type !== b.type) return a.type === 'folder' ? -1 : 1;
        return a.name.localeCompare(b.name);
      });
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// File download
app.get('/api/file/download', (req, res) => {
  const filePath = safePath(req.query.path);
  if (!filePath || !fs.existsSync(filePath)) return res.status(404).json({ error: 'Not found' });
  res.sendFile(path.resolve(filePath));
});

// Web proxy
app.get('/api/proxy', async (req, res) => {
  const url = req.query.url;
  if (!url) return res.status(400).json({ error: 'URL required' });
  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; EmpireBrowser/1.0)' },
      signal: AbortSignal.timeout(10000),
    });
    const text = await response.text();
    res.send(text);
  } catch (e) {
    res.status(502).json({ error: e.message });
  }
});

// ─── AI Chat Proxy — streams LLM responses ─────────────────────
app.post('/api/ai/chat', async (req, res) => {
  const { messages, model, temperature, maxTokens, systemPrompt, apiKey, baseUrl } = req.body;

  // Default config: OpenRouter → DeepSeek V4 Flash
  const finalModel = model || 'deepseek/deepseek-v4-flash';
  const finalBaseUrl = baseUrl || 'https://openrouter.ai/api/v1';
  const finalKey = apiKey || process.env.OPENROUTER_API_KEY || process.env.AI_API_KEY || '';
  const finalSystem = systemPrompt || `You are Hermes, the AI agent powering The Empire — a personal application suite. You are helpful, concise, and have full context awareness of all apps.`;

  if (!finalKey) {
    return res.status(400).json({ error: 'No AI API key configured. Set OPENROUTER_API_KEY or provide one in the request.' });
  }

  const apiMessages = [];
  if (finalSystem) apiMessages.push({ role: 'system', content: finalSystem });
  if (messages) apiMessages.push(...messages);

  try {
    const response = await fetch(`${finalBaseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${finalKey}`,
        ...(finalBaseUrl.includes('openrouter') ? { 'HTTP-Referer': 'http://localhost:3001', 'X-Title': 'Empire AI' } : {}),
      },
      body: JSON.stringify({
        model: finalModel,
        messages: apiMessages,
        temperature: temperature ?? 0.7,
        max_tokens: maxTokens ?? 2048,
        stream: true,
      }),
      signal: AbortSignal.timeout(60000),
    });

    if (!response.ok) {
      const text = await response.text();
      return res.status(response.status).json({ error: `AI API error: ${text}` });
    }

    // Stream the response back
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        res.write('data: [DONE]\n\n');
        res.end();
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6).trim();
          if (data === '[DONE]') continue;
          // Forward raw SSE to client
          res.write(`data: ${data}\n\n`);
        }
      }
    }
  } catch (e) {
    if (!res.headersSent) {
      res.status(502).json({ error: e.message });
    } else {
      res.write(`data: {"error": "${e.message}"}\n\n`);
      res.end();
    }
  }
});

// ─── AI Config Test ─────────────────────────────────────────────
app.get('/api/ai/status', (req, res) => {
  const hasKey = !!(process.env.OPENROUTER_API_KEY || process.env.AI_API_KEY);
  res.json({
    configured: hasKey,
    defaultModel: 'deepseek/deepseek-v4-flash',
    provider: 'openrouter',
    serverKey: hasKey ? 'configured' : 'missing',
  });
});

// ─── Data Center ────────────────────────────────────────────────
const dcTables = {
  users: [
    { id: 1, name: 'Admin', email: 'admin@empire.app', role: 'admin', created: new Date().toISOString() },
    { id: 2, name: 'Demo User', email: 'demo@empire.app', role: 'user', created: new Date().toISOString() },
    { id: 3, name: 'Guest', email: 'guest@empire.app', role: 'viewer', created: new Date().toISOString() },
  ],
  products: [
    { id: 1, name: 'Empire OS', price: 0, category: 'software', inStock: true },
    { id: 2, name: 'Web Suite', price: 29, category: 'software', inStock: true },
    { id: 3, name: 'Cloud Sync', price: 9, category: 'service', inStock: true },
    { id: 4, name: 'AI Assistant', price: 19, category: 'service', inStock: true },
  ],
  activity: [
    { id: 1, action: 'Server started', user: 'System', timestamp: new Date().toISOString() },
  ],
};
let dcIdCounter = 5;

app.get('/api/dc/tables', (req, res) => res.json(Object.keys(dcTables)));
app.get('/api/dc/table/:name', (req, res) => res.json(dcTables[req.params.name] || []));
app.post('/api/dc/table/:name', (req, res) => {
  if (!dcTables[req.params.name]) dcTables[req.params.name] = [];
  const entry = { id: dcIdCounter++, ...req.body, created: new Date().toISOString() };
  dcTables[req.params.name].push(entry);
  res.json({ ok: true, id: entry.id });
});
app.delete('/api/dc/table/:name/:id', (req, res) => {
  const { name, id } = req.params;
  if (!dcTables[name]) return res.status(404).json({ error: 'Table not found' });
  const idx = dcTables[name].findIndex(e => String(e.id) === id);
  if (idx === -1) return res.status(404).json({ error: 'Entry not found' });
  dcTables[name].splice(idx, 1);
  res.json({ ok: true });
});

// ─── Enhanced WebSocket — Hermes-aware relay ────────────────────
const peers = new Map();

wss.on('connection', (ws, req) => {
  const id = 'peer-' + Math.random().toString(36).substring(2, 8);
  peers.set(id, ws);
  ws.send(JSON.stringify({ type: 'welcome', id }));
  console.log('[WS] Connected:', id);

  // Broadcast peer count
  broadcast({ type: 'peers', count: peers.size });

  ws.on('message', (data) => {
    try {
      const msg = JSON.parse(data.toString());

      // Handle different message types
      if (msg.type === 'chat') {
        // Relay chat messages to all other peers
        broadcast({
          type: 'message',
          sender: id,
          content: msg.content,
          timestamp: Date.now(),
        }, ws);
      } else if (msg.type === 'app-event') {
        // Broadcast app events to all peers (including AI bridge)
        broadcast({
          type: 'app-event',
          app: msg.app,
          event: msg.event,
          data: msg.data,
          sender: id,
          timestamp: Date.now(),
        });
      } else if (msg.type === 'ping') {
        ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
      } else {
        // Legacy relay — forward raw message
        broadcast({
          type: 'message',
          sender: id,
          content: msg,
          timestamp: Date.now(),
        }, ws);
      }
    } catch (e) { /* ignore malformed */ }
  });

  ws.on('close', () => {
    peers.delete(id);
    broadcast({ type: 'peers', count: peers.size });
    console.log('[WS] Disconnected:', id);
  });
});

function broadcast(message, excludeWs = null) {
  const json = JSON.stringify(message);
  peers.forEach((client, peerId) => {
    if (client !== excludeWs && client.readyState === 1) {
      client.send(json);
    }
  });
}

// ─── Static serving ─────────────────────────────────────────────
const distPath = path.join(__dirname, 'dist');
app.use(express.static(distPath));
app.get('/app{*path}', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'), (err) => {
    if (err) res.status(500).send('Error loading app');
  });
});
app.get('/', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'), (err) => {
    if (err) res.status(500).send('Error loading app');
  });
});
app.get('{*path}', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

server.listen(PORT, '0.0.0.0', () => {
  console.log('\n  🏛️  The Empire — Hermes Connected');
  console.log('  ───────────────────────────────────');
  console.log('  API Server:    http://localhost:' + PORT);
  console.log('  AI Chat Proxy: http://localhost:' + PORT + '/api/ai/chat');
  console.log('  WebSocket:     ws://localhost:' + PORT);
  console.log('  Dashboard:     http://localhost:' + PORT);
  console.log('  Default AI:    DeepSeek V4 Flash via OpenRouter\n');
});