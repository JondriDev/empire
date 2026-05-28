import express from 'express';
import path from 'path';
import fs from 'fs';
import http from 'http';
import { WebSocketServer } from 'ws';
import { fileURLToPath } from 'url';
import { exec, execSync } from 'child_process';

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

// ─── File listing ────────────────────────────────────────────────
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

      if (msg.type === 'chat') {
        broadcast({
          type: 'message',
          sender: id,
          content: msg.content,
          timestamp: Date.now(),
        }, ws);
      } else if (msg.type === 'app-event') {
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

// ─── Tool Registry & Execution ──────────────────────────────────────────────

const TOOL_DEFINITIONS = {
  file_read: {
    description: 'Read a file', dangerous: false,
    schema: { path: 'string', limit: 'number?', offset: 'number?' }
  },
  file_write: {
    description: 'Write content to a file', dangerous: true,
    schema: { path: 'string', content: 'string', append: 'boolean?' }
  },
  file_list: {
    description: 'List a directory', dangerous: false,
    schema: { path: 'string' }
  },
  shell_exec: {
    description: 'Execute a shell command', dangerous: true,
    schema: { command: 'string', timeout: 'number?' }
  },
  web_search: {
    description: 'Search the web', dangerous: false,
    schema: { query: 'string', limit: 'number?' }
  },
  web_fetch: {
    description: 'Fetch a URL', dangerous: false,
    schema: { url: 'string', query: 'string?' }
  },
  code_exec: {
    description: 'Execute code', dangerous: false,
    schema: { code: 'string', language: 'string', args: 'object?' }
  },
}

const DANGEROUS_PATTERNS = [
  /rm\s+-rf\s+\//, /dd\s+if=/, /mkfs/, /fdisk/, />\s*\/dev\//,
  /format\s+/, /shutdown/, /reboot/, /poweroff/, /init\s+0/,
  /:\/|\:\)|递龟|汞|潘|涅|沸|活|龜|龠/, // junk filter
]

const SHELL_TIMEOUT = 30_000
const CODE_TIMEOUT = 10_000

function validateCommand(cmd) {
  if (!cmd || typeof cmd !== 'string') return 'No command'
  for (const p of DANGEROUS_PATTERNS) {
    if (p.test(cmd)) return `Blocked: ${cmd.slice(0, 40)}`
  }
  return null
}

// ─── Tool API (before static serving) ───────────────────────────
// ─── GET /api/tools/list ─────────────────────────────────────────────────────
app.get('/api/tools/list', (req, res) => {
  res.json({ tools: Object.keys(TOOL_DEFINITIONS) })
})

// ─── POST /api/tools/execute ─────────────────────────────────────────────────
app.post('/api/tools/execute', async (req, res) => {
  const { tool, params } = req.body
  if (!tool || typeof tool !== 'string') {
    return res.status(400).json({ success: false, error: 'Missing tool name' })
  }

  const def = TOOL_DEFINITIONS[tool]
  if (!def) {
    return res.status(400).json({ success: false, error: `Unknown tool: ${tool}` })
  }

  switch (tool) {
    case 'file_read': {
      const { path: fp, limit = 500, offset = 1 } = params
      if (!fp) return res.json({ success: false, error: 'Missing path' })
      const resolved = safePath(fp)
      try {
        const lines = fs.readFileSync(resolved, 'utf8').split('\n')
        const slice = lines.slice(offset - 1, offset - 1 + limit)
        res.json({ success: true, output: slice.map((l, i) => `${offset + i}|${l}`).join('\n') })
      } catch (e) {
        res.json({ success: false, error: e.message })
      }
      break
    }

    case 'file_write': {
      if (def.dangerous) {
        const validation = validateCommand(params.content)
        if (validation) return res.json({ success: false, error: validation })
      }
      const { path: fp, content, append = false } = params
      if (!fp) return res.json({ success: false, error: 'Missing path' })
      const resolved = safePath(fp)
      try {
        if (append) {
          fs.appendFileSync(resolved, content, 'utf8')
        } else {
          fs.writeFileSync(resolved, content, 'utf8')
        }
        res.json({ success: true, output: `Written ${content.length} chars to ${fp}` })
      } catch (e) {
        res.json({ success: false, error: e.message })
      }
      break
    }

    case 'file_list': {
      const { path: fp } = params
      if (!fp) return res.json({ success: false, error: 'Missing path' })
      const resolved = safePath(fp)
      try {
        const entries = fs.readdirSync(resolved, { withFileTypes: true })
        const result = entries
          .filter(e => !e.name.startsWith('.'))
          .map(e => {
            const stat = fs.statSync(path.join(resolved, e.name))
            const type = e.isDirectory() ? 'dir' : 'file'
            const size = e.isFile() ? stat.size : 0
            return `${type == 'dir' ? 'd' : '-'} ${e.name}${type === 'file' ? ` (${size}b)` : '/'}`
          })
        res.json({ success: true, output: result.join('\n') || '(empty)' })
      } catch (e) {
        res.json({ success: false, error: e.message })
      }
      break
    }

    case 'shell_exec': {
      const { command, timeout = 10 } = params
      if (!command) return res.json({ success: false, error: 'Missing command' })
      const blocked = validateCommand(command)
      if (blocked) return res.json({ success: false, error: `Blocked: ${blocked}` })

      const actualTimeout = Math.min(timeout, SHELL_TIMEOUT / 1000) * 1000
      exec(command, { timeout: actualTimeout, cwd: ALLOWED_BASE }, (err, stdout, stderr) => {
        if (err) {
          res.json({ success: false, error: err.message })
        } else {
          res.json({ success: true, output: (stdout + stderr).trim() || '(no output)' })
        }
      })
      break
    }

    case 'web_search': {
      const { query, limit = 5 } = params
      if (!query) return res.json({ success: false, error: 'Missing query' })
      try {
        const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`
        const resp = await fetch(url, {
          headers: { 'User-Agent': 'Mozilla/5.0' },
          signal: AbortSignal.timeout(10000),
        })
        const html = await resp.text()
        const results = []
        const itemRe = /<a class="result__a"[^>]*href="([^"]+)"[^>]*>([^<]+)<\/a>/g
        let match
        let count = 0
        while ((match = itemRe.exec(html)) && count < limit) {
          const url = match[1]
          const title = match[2].replace(/<[^>]+>/g, '')
          results.push({ title, url })
          count++
        }
        res.json({
          success: true,
          output: results.map(r => `• ${r.title}\n  ${r.url}`).join('\n\n') || 'No results found'
        })
      } catch (e) {
        res.json({ success: false, error: e.message })
      }
      break
    }

    case 'web_fetch': {
      const { url } = params
      if (!url) return res.json({ success: false, error: 'Missing URL' })
      try {
        const resp = await fetch(url, {
          headers: { 'User-Agent': 'Mozilla/5.0' },
          signal: AbortSignal.timeout(15000),
        })
        const text = await resp.text()
        const clean = text.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
        res.json({ success: true, output: clean.slice(0, 5000) })
      } catch (e) {
        res.json({ success: false, error: e.message })
      }
      break
    }

    case 'code_exec': {
      const { code, language } = params
      if (!code || !language) return res.json({ success: false, error: 'Missing code or language' })
      if (!['python', 'javascript'].includes(language)) {
        return res.json({ success: false, error: `Unsupported language: ${language}` })
      }
      try {
        if (language === 'python') {
          const result = execSync(`python3 -c ${JSON.stringify(code)}`, {
            timeout: CODE_TIMEOUT,
            encoding: 'utf8',
            cwd: ALLOWED_BASE,
          })
          res.json({ success: true, output: result.trim() || '(no output)' })
        } else {
          const result = execSync(`node -e ${JSON.stringify(code)}`, {
            timeout: CODE_TIMEOUT,
            encoding: 'utf8',
          })
          res.json({ success: true, output: result.trim() || '(no output)' })
        }
      } catch (e) {
        res.json({ success: false, error: e.message })
      }
      break
    }

    default:
      res.status(400).json({ success: false, error: `Unimplemented tool: ${tool}` })
  }
})

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
  console.log('  Tool API:      http://localhost:' + PORT + '/api/tools/list');
  console.log('  WebSocket:     ws://localhost:' + PORT);
  console.log('  Dashboard:     http://localhost:' + PORT);
  console.log('  Default AI:    DeepSeek V4 Flash via OpenRouter\n');
});