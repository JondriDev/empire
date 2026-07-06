import express from 'express';
import path from 'path';
import fs from 'fs';
import http from 'http';
import { WebSocketServer } from 'ws';
import { fileURLToPath } from 'url';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const PORT = process.env.PORT || 3001;
// Bind loopback by default. A 0.0.0.0 bind + CORS:* + the file/tool endpoints below
// = LAN-reachable RCE/exfil. Opt into network exposure explicitly with EMPIRE_HOST=0.0.0.0.
const HOST = process.env.EMPIRE_HOST || '127.0.0.1';
const ALLOWED_BASE = process.env.EMPIRE_ROOT || '/storage/emulated/0';
const DB_PATH = path.join(__dirname, 'data', 'empire.db');

// Ensure data directory exists
if (!fs.existsSync(path.join(__dirname, 'data'))) {
  fs.mkdirSync(path.join(__dirname, 'data'), { recursive: true });
}

// JWT secret: prefer the env var; otherwise generate a random secret ONCE and
// persist it (data/.jwt-secret, 0600). A hardcoded fallback is public in git, so
// anyone could forge tokens — never ship one.
const JWT_SECRET = loadOrCreateJwtSecret();
function loadOrCreateJwtSecret() {
  if (process.env.JWT_SECRET) return process.env.JWT_SECRET;
  const secretPath = path.join(__dirname, 'data', '.jwt-secret');
  try {
    if (fs.existsSync(secretPath)) {
      const existing = fs.readFileSync(secretPath, 'utf8').trim();
      if (existing) return existing;
    }
  } catch { /* fall through and regenerate */ }
  const secret = crypto.randomBytes(32).toString('hex');
  try { fs.writeFileSync(secretPath, secret, { mode: 0o600 }); }
  catch (e) { console.warn('[AUTH] Could not persist JWT secret, using an ephemeral one:', e.message); }
  return secret;
}

// ═══════════════════════════════════════════════════════════════
// DATABASE LAYER
// ═══════════════════════════════════════════════════════════════

let db = null;

async function initDatabase() {
 const initSqlJs = (await import('sql.js')).default;
 const SQL = await initSqlJs();

 if (fs.existsSync(DB_PATH)) {
 const buffer = fs.readFileSync(DB_PATH);
 db = new SQL.Database(buffer);
 console.log('[DB] Loaded existing database from', DB_PATH);
 } else {
 db = new SQL.Database();
 console.log('[DB] Created new database');
 }

 runMigrations(db);
 saveDatabase();
}

function saveDatabase() {
  if (!db) return;
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(DB_PATH, buffer);
}

function runMigrations(db) {
  db.run(`CREATE TABLE IF NOT EXISTS _migrations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    applied_at TEXT DEFAULT (datetime('now'))
  )`);

  const migrations = [
    {
      name: '001_users',
      sql: `CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        pin_hash TEXT NOT NULL,
        display_name TEXT DEFAULT '',
        avatar TEXT DEFAULT '',
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      )`
    },
    {
      name: '002_notes',
      sql: `CREATE TABLE IF NOT EXISTS notes (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        title TEXT NOT NULL DEFAULT '',
        content TEXT DEFAULT '',
        tags TEXT DEFAULT '[]',
        is_archived INTEGER DEFAULT 0,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (user_id) REFERENCES users(id)
      )`
    },
    {
      name: '003_events',
      sql: `CREATE TABLE IF NOT EXISTS events (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        title TEXT NOT NULL,
        date TEXT NOT NULL,
        time TEXT DEFAULT '',
        description TEXT DEFAULT '',
        color TEXT DEFAULT '#3b82f6',
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (user_id) REFERENCES users(id)
      )`
    },
    {
      name: '004_messages',
      sql: `CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        sender TEXT NOT NULL,
        content TEXT NOT NULL,
        room TEXT DEFAULT 'general',
        timestamp INTEGER NOT NULL,
        created_at TEXT DEFAULT (datetime('now'))
      )`
    },
    {
      name: '005_learning',
      sql: `CREATE TABLE IF NOT EXISTS learning_items (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        topic TEXT NOT NULL,
        learned TEXT DEFAULT '',
        date TEXT NOT NULL,
        next_review TEXT DEFAULT '',
        mastered INTEGER DEFAULT 0,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (user_id) REFERENCES users(id)
      )`
    },
    {
      name: '006_bookmarks',
      sql: `CREATE TABLE IF NOT EXISTS bookmarks (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        title TEXT NOT NULL,
        url TEXT NOT NULL,
        category TEXT DEFAULT 'general',
        favicon TEXT DEFAULT '',
        created_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (user_id) REFERENCES users(id)
      )`
    },
    {
      name: '007_dc_tables',
      sql: `CREATE TABLE IF NOT EXISTS dc_tables (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        name TEXT NOT NULL,
        schema_json TEXT DEFAULT '[]',
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (user_id) REFERENCES users(id)
      )`
    },
    {
      name: '008_dc_rows',
      sql: `CREATE TABLE IF NOT EXISTS dc_rows (
        id TEXT PRIMARY KEY,
        table_id TEXT NOT NULL,
        data_json TEXT DEFAULT '{}',
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (table_id) REFERENCES dc_tables(id)
      )`
    },
    {
      name: '009_prompts',
      sql: `CREATE TABLE IF NOT EXISTS prompts (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        title TEXT NOT NULL DEFAULT '',
        content TEXT NOT NULL,
        category TEXT DEFAULT 'general',
        is_favorite INTEGER DEFAULT 0,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (user_id) REFERENCES users(id)
      )`
    },
    {
      name: '010_settings',
      sql: `CREATE TABLE IF NOT EXISTS settings (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL UNIQUE,
        theme TEXT DEFAULT 'dark',
        sidebar_open INTEGER DEFAULT 1,
        data_json TEXT DEFAULT '{}',
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (user_id) REFERENCES users(id)
      )`
    },
    {
      name: '011_ai_conversations',
      sql: `CREATE TABLE IF NOT EXISTS ai_conversations (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        title TEXT DEFAULT 'New Chat',
        model TEXT DEFAULT 'deepseek/deepseek-v4-flash',
        messages TEXT DEFAULT '[]',
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (user_id) REFERENCES users(id)
      )`
    },
    {
      name: '012_req_log',
      sql: `CREATE TABLE IF NOT EXISTS req_log (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        method TEXT NOT NULL,
        path TEXT NOT NULL,
        status INTEGER,
        created_at TEXT DEFAULT (datetime('now'))
      )`
    },
    {
      name: '012_req_log_idx',
      sql: `CREATE INDEX IF NOT EXISTS idx_req_log_user_created ON req_log(user_id, created_at)`
    }
  ];

  const applied = new Set(
    db.exec("SELECT name FROM _migrations").reduce((acc, r) => {
      return acc.concat(r.values.map(v => v[0]));
    }, [])
  );

  for (const m of migrations) {
    if (!applied.has(m.name)) {
      try {
        db.run(m.sql);
        db.run("INSERT INTO _migrations (name) VALUES (?)", [m.name]);
        console.log(`[DB] Applied migration: ${m.name}`);
      } catch (e) {
        console.error(`[DB] Migration ${m.name} failed:`, e.message);
      }
    }
  }
}

// ═══════════════════════════════════════════════════════════════
// AUTHENTICATION
// ═══════════════════════════════════════════════════════════════

async function ensureDefaultUser() {
  const result = db.exec("SELECT id FROM users WHERE username = 'admin'");
  if (result.length === 0 || result[0].values.length === 0) {
    const id = uuidv4();
    // Generate a random one-time PIN instead of a guessable default (was '1234').
    const pin = process.env.EMPIRE_ADMIN_PIN || String(crypto.randomInt(100000, 1000000));
    const pinHash = await bcrypt.hash(pin, 10);
    db.run(
      "INSERT INTO users (id, username, pin_hash, display_name) VALUES (?, ?, ?, ?)",
      [id, 'admin', pinHash, 'Admin']
    );
    db.run(
      "INSERT OR IGNORE INTO settings (id, user_id, data_json) VALUES (?, ?, '{}')",
      [uuidv4(), id]
    );
    saveDatabase();
    console.log(`\n[AUTH] Created user "admin" with a one-time PIN: ${pin}`);
    console.log('[AUTH] Shown ONCE — change it in Settings (or preset EMPIRE_ADMIN_PIN).\n');
  }
}

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid authorization header' });
  }
  const token = authHeader.slice(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] });
    req.user = decoded;
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      req.user = jwt.verify(authHeader.slice(7), JWT_SECRET, { algorithms: ['HS256'] });
    } catch (e) {
      // token invalid, continue without user
    }
  }
  next();
}

// ═══════════════════════════════════════════════════════════════
// MIDDLEWARE
// ═══════════════════════════════════════════════════════════════

// CORS: reflect only allowlisted origins (NOT '*') so a hostile web page can't read
// authed/tool/file responses if the port is reachable. Same-origin (the PWA served by
// this server) and dev are covered; add LAN origins via EMPIRE_ALLOWED_ORIGINS (comma-sep).
const ALLOWED_ORIGINS = (process.env.EMPIRE_ALLOWED_ORIGINS ||
  'http://localhost:3001,http://127.0.0.1:3001,http://localhost:5173')
  .split(',').map(s => s.trim()).filter(Boolean);
// Security headers (helmet-equivalent, no extra dep)
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Vary', 'Origin');
  }
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  // Defensive hardening headers
  res.header('X-Content-Type-Options', 'nosniff');
  res.header('X-Frame-Options', 'SAMEORIGIN');
  res.header('Referrer-Policy', 'no-referrer');
  res.header('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});
app.use(express.json({ limit: '256kb' })); // tighter: was 10mb (allows arbitrary JSON attacks)

// ═══════════════════════════════════════════════════════════════
// REQUEST LOG — append-only audit trail for sensitive endpoints
// ═══════════════════════════════════════════════════════════════
const LOGGABLE_PATH_RE = /^\/api\/(files|file\/download|proxy|tools\/execute|ai\/chat|auth\/login)/;
app.use((req, res, next) => {
  if (!LOGGABLE_PATH_RE.test(req.path)) return next();
  res.on('finish', () => {
    const uid = req.user?.id || null;
    const id = uuidv4();
    try {
      db.run(
        'INSERT INTO req_log (id, user_id, method, path, status) VALUES (?, ?, ?, ?, ?)',
        [id, uid, req.method, req.path, res.statusCode]
      );
    } catch (e) { /* swallow — logging must never break a request */ }
  });
  next();
});

// ── Tiny in-memory rate limiter (no extra dep) ──────────────────────
// Default Empire is localhost-only — this is belt-and-suspenders against accidental
// exposure. 10 login attempts per 15 min per IP, 60s lockout after burst.
const RATE = { login: new Map() };
function rateLimit(scope, max, windowMs) {
  return (req, res, next) => {
    const ip = req.ip || req.socket?.remoteAddress || 'unknown';
    const now = Date.now();
    const m = RATE[scope];
    const e = m.get(ip) || { count: 0, resetAt: now + windowMs };
    if (now > e.resetAt) { e.count = 0; e.resetAt = now + windowMs; }
    e.count += 1;
    m.set(ip, e);
    res.setHeader('X-RateLimit-Remaining', String(Math.max(0, max - e.count)));
    if (e.count > max) {
      const retry = Math.ceil((e.resetAt - now) / 1000);
      res.setHeader('Retry-After', String(retry));
      return res.status(429).json({ error: `Too many requests. Retry in ${retry}s.` });
    }
    next();
  };
}

function safePath(userPath) {
  const base = path.resolve(ALLOWED_BASE);
  if (!userPath) return base;
  const resolved = path.resolve(base, String(userPath));
  // Boundary check with a trailing separator so a sibling like `${base}evil` can't pass.
  if (resolved !== base && !resolved.startsWith(base + path.sep)) {
    return base;
  }
  return resolved;
}

// ═══════════════════════════════════════════════════════════════
// AUTH ENDPOINTS
// ═══════════════════════════════════════════════════════════════

app.post('/api/auth/login', rateLimit('login', 10, 15 * 60 * 1000), async (req, res) => {
  try {
    const { username, pin } = req.body;
    if (!username || !pin) return res.status(400).json({ error: 'Username and PIN required' });
    if (typeof username !== 'string' || typeof pin !== 'string') return res.status(400).json({ error: 'Invalid input types' });
    if (username.length > 64 || pin.length > 32 || pin.length < 1) return res.status(400).json({ error: 'Invalid input length' });

    const result = db.exec("SELECT id, username, pin_hash, display_name FROM users WHERE username = ?", [username]);
    if (result.length === 0 || result[0].values.length === 0) return res.status(401).json({ error: 'Invalid credentials' });

    const row = result[0].values[0];
    const valid = await bcrypt.compare(pin, row[2]);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ id: row[0], username: row[1], displayName: row[3] }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: row[0], username: row[1], displayName: row[3] } });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/auth/pin', authMiddleware, async (req, res) => {
  try {
    const { currentPin, newPin } = req.body;
    if (!currentPin || !newPin) return res.status(400).json({ error: 'Current PIN and new PIN required' });
    if (typeof currentPin !== 'string' || typeof newPin !== 'string') return res.status(400).json({ error: 'Invalid input types' });
    if (newPin.length < 4 || newPin.length > 32) return res.status(400).json({ error: 'New PIN must be 4-32 characters' });
    if (currentPin === newPin) return res.status(400).json({ error: 'New PIN must differ from current PIN' });
    const result = db.exec("SELECT pin_hash FROM users WHERE id = ?", [req.user.id]);
    if (result.length === 0) return res.status(404).json({ error: 'User not found' });
    const valid = await bcrypt.compare(currentPin, result[0].values[0][0]);
    if (!valid) return res.status(401).json({ error: 'Current PIN is incorrect' });
    db.run("UPDATE users SET pin_hash = ?, updated_at = datetime('now') WHERE id = ?", [await bcrypt.hash(newPin, 10), req.user.id]);
    saveDatabase();
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/auth/me', authMiddleware, (req, res) => {
  const result = db.exec("SELECT id, username, display_name, avatar, created_at FROM users WHERE id = ?", [req.user.id]);
  if (result.length === 0) return res.status(404).json({ error: 'User not found' });
  const row = result[0].values[0];
  res.json({ id: row[0], username: row[1], displayName: row[2], avatar: row[3], createdAt: row[4] });
});

// ═══════════════════════════════════════════════════════════════
// NOTES CRUD
// ═══════════════════════════════════════════════════════════════

app.get('/api/notes', authMiddleware, (req, res) => {
  const includeArchived = req.query.include_archived === 'true';
  const sql = includeArchived
    ? "SELECT * FROM notes WHERE user_id = ? ORDER BY updated_at DESC"
    : "SELECT * FROM notes WHERE user_id = ? AND is_archived = 0 ORDER BY updated_at DESC";
  const notes = rowsToArray(db.exec(sql, [req.user.id]), ['id', 'user_id', 'title', 'content', 'tags', 'is_archived', 'created_at', 'updated_at']);
  notes.forEach(n => { try { n.tags = JSON.parse(n.tags); } catch { n.tags = []; } n.is_archived = Boolean(n.is_archived); });
  res.json(notes);
});

app.get('/api/notes/:id', authMiddleware, (req, res) => {
  const result = db.exec("SELECT * FROM notes WHERE id = ? AND user_id = ?", [req.params.id, req.user.id]);
  if (result.length === 0) return res.status(404).json({ error: 'Note not found' });
  const note = rowToObject(result[0].values[0], ['id', 'user_id', 'title', 'content', 'tags', 'is_archived', 'created_at', 'updated_at']);
  try { note.tags = JSON.parse(note.tags); } catch { note.tags = []; }
  note.is_archived = Boolean(note.is_archived);
  res.json(note);
});

app.post('/api/notes', authMiddleware, (req, res) => {
  const id = uuidv4();
  const { title = '', content = '', tags = [] } = req.body;
  db.run("INSERT INTO notes (id, user_id, title, content, tags) VALUES (?, ?, ?, ?, ?)", [id, req.user.id, title, content, JSON.stringify(tags)]);
  saveDatabase();
  res.status(201).json({ id, ok: true });
});

app.put('/api/notes/:id', authMiddleware, (req, res) => {
  const { title, content, tags, is_archived } = req.body;
  const sets = []; const params = [];
  if (title !== undefined) { sets.push("title = ?"); params.push(title); }
  if (content !== undefined) { sets.push("content = ?"); params.push(content); }
  if (tags !== undefined) { sets.push("tags = ?"); params.push(JSON.stringify(tags)); }
  if (is_archived !== undefined) { sets.push("is_archived = ?"); params.push(is_archived ? 1 : 0); }
  sets.push("updated_at = datetime('now')");
  params.push(req.params.id, req.user.id);
  db.run(`UPDATE notes SET ${sets.join(', ')} WHERE id = ? AND user_id = ?`, params);
  saveDatabase();
  res.json({ ok: true });
});

app.delete('/api/notes/:id', authMiddleware, (req, res) => {
  db.run("DELETE FROM notes WHERE id = ? AND user_id = ?", [req.params.id, req.user.id]);
  saveDatabase();
  res.json({ ok: true });
});

// ═══════════════════════════════════════════════════════════════
// EVENTS CRUD
// ═══════════════════════════════════════════════════════════════

app.get('/api/events', authMiddleware, (req, res) => {
  res.json(rowsToArray(db.exec("SELECT * FROM events WHERE user_id = ? ORDER BY date ASC", [req.user.id]), ['id', 'user_id', 'title', 'date', 'time', 'description', 'color', 'created_at', 'updated_at']));
});

app.get('/api/events/:id', authMiddleware, (req, res) => {
  const result = db.exec("SELECT * FROM events WHERE id = ? AND user_id = ?", [req.params.id, req.user.id]);
  if (result.length === 0) return res.status(404).json({ error: 'Event not found' });
  res.json(rowToObject(result[0].values[0], ['id', 'user_id', 'title', 'date', 'time', 'description', 'color', 'created_at', 'updated_at']));
});

app.post('/api/events', authMiddleware, (req, res) => {
  const id = uuidv4();
  const { title, date, time = '', description = '', color = '#3b82f6' } = req.body;
  if (!title || !date) return res.status(400).json({ error: 'Title and date required' });
  db.run("INSERT INTO events (id, user_id, title, date, time, description, color) VALUES (?, ?, ?, ?, ?, ?, ?)", [id, req.user.id, title, date, time, description, color]);
  saveDatabase();
  res.status(201).json({ id, ok: true });
});

app.put('/api/events/:id', authMiddleware, (req, res) => {
  const { title, date, time, description, color } = req.body;
  const sets = []; const params = [];
  if (title !== undefined) { sets.push("title = ?"); params.push(title); }
  if (date !== undefined) { sets.push("date = ?"); params.push(date); }
  if (time !== undefined) { sets.push("time = ?"); params.push(time); }
  if (description !== undefined) { sets.push("description = ?"); params.push(description); }
  if (color !== undefined) { sets.push("color = ?"); params.push(color); }
  sets.push("updated_at = datetime('now')");
  params.push(req.params.id, req.user.id);
  db.run(`UPDATE events SET ${sets.join(', ')} WHERE id = ? AND user_id = ?`, params);
  saveDatabase();
  res.json({ ok: true });
});

app.delete('/api/events/:id', authMiddleware, (req, res) => {
  db.run("DELETE FROM events WHERE id = ? AND user_id = ?", [req.params.id, req.user.id]);
  saveDatabase();
  res.json({ ok: true });
});

// ═══════════════════════════════════════════════════════════════
// MESSAGES
// ═══════════════════════════════════════════════════════════════

app.get('/api/messages', optionalAuth, (req, res) => {
  const room = req.query.room || 'general';
  const limit = Math.min(parseInt(req.query.limit) || 100, 500);
  res.json(rowsToArray(db.exec("SELECT * FROM messages WHERE room = ? ORDER BY timestamp DESC LIMIT ?", [room, limit]), ['id', 'sender', 'content', 'room', 'timestamp', 'created_at']));
});

app.post('/api/messages', optionalAuth, (req, res) => {
  const id = uuidv4();
  const { sender = 'anonymous', content, room = 'general' } = req.body;
  if (!content) return res.status(400).json({ error: 'Content required' });
  const timestamp = Date.now();
  db.run("INSERT INTO messages (id, sender, content, room, timestamp) VALUES (?, ?, ?, ?, ?)", [id, sender, content, room, timestamp]);
  saveDatabase();
  res.status(201).json({ id, ok: true, timestamp });
});

// ═══════════════════════════════════════════════════════════════
// LEARNING ITEMS CRUD
// ═══════════════════════════════════════════════════════════════

app.get('/api/learning', authMiddleware, (req, res) => {
  const items = rowsToArray(db.exec("SELECT * FROM learning_items WHERE user_id = ? ORDER BY date DESC", [req.user.id]), ['id', 'user_id', 'topic', 'learned', 'date', 'next_review', 'mastered', 'created_at', 'updated_at']);
  items.forEach(i => i.mastered = Boolean(i.mastered));
  res.json(items);
});

app.post('/api/learning', authMiddleware, (req, res) => {
  const id = uuidv4();
  const { topic, learned = '', date, next_review = '' } = req.body;
  if (!topic || !date) return res.status(400).json({ error: 'Topic and date required' });
  db.run("INSERT INTO learning_items (id, user_id, topic, learned, date, next_review) VALUES (?, ?, ?, ?, ?, ?)", [id, req.user.id, topic, learned, date, next_review]);
  saveDatabase();
  res.status(201).json({ id, ok: true });
});

app.put('/api/learning/:id', authMiddleware, (req, res) => {
  const { topic, learned, date, next_review, mastered } = req.body;
  const sets = []; const params = [];
  if (topic !== undefined) { sets.push("topic = ?"); params.push(topic); }
  if (learned !== undefined) { sets.push("learned = ?"); params.push(learned); }
  if (date !== undefined) { sets.push("date = ?"); params.push(date); }
  if (next_review !== undefined) { sets.push("next_review = ?"); params.push(next_review); }
  if (mastered !== undefined) { sets.push("mastered = ?"); params.push(mastered ? 1 : 0); }
  sets.push("updated_at = datetime('now')");
  params.push(req.params.id, req.user.id);
  db.run(`UPDATE learning_items SET ${sets.join(', ')} WHERE id = ? AND user_id = ?`, params);
  saveDatabase();
  res.json({ ok: true });
});

app.delete('/api/learning/:id', authMiddleware, (req, res) => {
  db.run("DELETE FROM learning_items WHERE id = ? AND user_id = ?", [req.params.id, req.user.id]);
  saveDatabase();
  res.json({ ok: true });
});

// ═══════════════════════════════════════════════════════════════
// BOOKMARKS CRUD
// ═══════════════════════════════════════════════════════════════

app.get('/api/bookmarks', authMiddleware, (req, res) => {
  res.json(rowsToArray(db.exec("SELECT * FROM bookmarks WHERE user_id = ? ORDER BY created_at DESC", [req.user.id]), ['id', 'user_id', 'title', 'url', 'category', 'favicon', 'created_at']));
});

app.post('/api/bookmarks', authMiddleware, (req, res) => {
  const id = uuidv4();
  const { title, url, category = 'general', favicon = '' } = req.body;
  if (!title || !url) return res.status(400).json({ error: 'Title and URL required' });
  db.run("INSERT INTO bookmarks (id, user_id, title, url, category, favicon) VALUES (?, ?, ?, ?, ?, ?)", [id, req.user.id, title, url, category, favicon]);
  saveDatabase();
  res.status(201).json({ id, ok: true });
});

app.delete('/api/bookmarks/:id', authMiddleware, (req, res) => {
  db.run("DELETE FROM bookmarks WHERE id = ? AND user_id = ?", [req.params.id, req.user.id]);
  saveDatabase();
  res.json({ ok: true });
});

// ═══════════════════════════════════════════════════════════════
// DATA CENTER
// ═══════════════════════════════════════════════════════════════

app.get('/api/dc/tables', authMiddleware, (req, res) => {
  const tables = rowsToArray(db.exec("SELECT * FROM dc_tables WHERE user_id = ? ORDER BY created_at DESC", [req.user.id]), ['id', 'user_id', 'name', 'schema_json', 'created_at', 'updated_at']);
  tables.forEach(t => { try { t.schema = JSON.parse(t.schema_json); } catch { t.schema = []; } delete t.schema_json; });
  res.json(tables);
});

app.post('/api/dc/tables', authMiddleware, (req, res) => {
  const id = uuidv4();
  const { name, schema = [] } = req.body;
  if (!name) return res.status(400).json({ error: 'Table name required' });
  db.run("INSERT INTO dc_tables (id, user_id, name, schema_json) VALUES (?, ?, ?, ?)", [id, req.user.id, name, JSON.stringify(schema)]);
  saveDatabase();
  res.status(201).json({ id, name, ok: true });
});

app.get('/api/dc/tables/:tableId/rows', authMiddleware, (req, res) => {
  const rows = rowsToArray(db.exec("SELECT r.*, t.name as table_name FROM dc_rows r JOIN dc_tables t ON r.table_id = t.id WHERE r.table_id = ? AND t.user_id = ? ORDER BY r.created_at DESC", [req.params.tableId, req.user.id]), ['id', 'table_id', 'data_json', 'created_at', 'updated_at', 'table_name']);
  rows.forEach(r => { try { r.data = JSON.parse(r.data_json); } catch { r.data = {}; } delete r.data_json; });
  res.json(rows);
});

app.post('/api/dc/tables/:tableId/rows', authMiddleware, (req, res) => {
  const id = uuidv4();
  const { data = {} } = req.body;
  const tableCheck = db.exec("SELECT id FROM dc_tables WHERE id = ? AND user_id = ?", [req.params.tableId, req.user.id]);
  if (tableCheck.length === 0) return res.status(404).json({ error: 'Table not found' });
  db.run("INSERT INTO dc_rows (id, table_id, data_json) VALUES (?, ?, ?)", [id, req.params.tableId, JSON.stringify(data)]);
  saveDatabase();
  res.status(201).json({ id, ok: true });
});

app.put('/api/dc/tables/:tableId/rows/:rowId', authMiddleware, (req, res) => {
  const { data } = req.body;
  if (!data) return res.status(400).json({ error: 'Data required' });
  const owns = db.exec("SELECT id FROM dc_tables WHERE id = ? AND user_id = ?", [req.params.tableId, req.user.id]);
  if (owns.length === 0 || owns[0].values.length === 0) return res.status(404).json({ error: 'Table not found' });
  db.run("UPDATE dc_rows SET data_json = ?, updated_at = datetime('now') WHERE id = ? AND table_id = ?", [JSON.stringify(data), req.params.rowId, req.params.tableId]);
  saveDatabase();
  res.json({ ok: true });
});

app.delete('/api/dc/tables/:tableId/rows/:rowId', authMiddleware, (req, res) => {
  const owns = db.exec("SELECT id FROM dc_tables WHERE id = ? AND user_id = ?", [req.params.tableId, req.user.id]);
  if (owns.length === 0 || owns[0].values.length === 0) return res.status(404).json({ error: 'Table not found' });
  db.run("DELETE FROM dc_rows WHERE id = ? AND table_id = ?", [req.params.rowId, req.params.tableId]);
  saveDatabase();
  res.json({ ok: true });
});

app.delete('/api/dc/tables/:tableId', authMiddleware, (req, res) => {
  const owns = db.exec("SELECT id FROM dc_tables WHERE id = ? AND user_id = ?", [req.params.tableId, req.user.id]);
  if (owns.length === 0 || owns[0].values.length === 0) return res.status(404).json({ error: 'Table not found' });
  db.run("DELETE FROM dc_rows WHERE table_id = ?", [req.params.tableId]);
  db.run("DELETE FROM dc_tables WHERE id = ? AND user_id = ?", [req.params.tableId, req.user.id]);
  saveDatabase();
  res.json({ ok: true });
});

// ═══════════════════════════════════════════════════════════════
// PROMPTS CRUD
// ═══════════════════════════════════════════════════════════════

app.get('/api/prompts', authMiddleware, (req, res) => {
  const prompts = rowsToArray(db.exec("SELECT * FROM prompts WHERE user_id = ? ORDER BY updated_at DESC", [req.user.id]), ['id', 'user_id', 'title', 'content', 'category', 'is_favorite', 'created_at', 'updated_at']);
  prompts.forEach(p => p.is_favorite = Boolean(p.is_favorite));
  res.json(prompts);
});

app.post('/api/prompts', authMiddleware, (req, res) => {
  const id = uuidv4();
  const { title = '', content, category = 'general' } = req.body;
  if (!content) return res.status(400).json({ error: 'Content required' });
  db.run("INSERT INTO prompts (id, user_id, title, content, category) VALUES (?, ?, ?, ?, ?)", [id, req.user.id, title, content, category]);
  saveDatabase();
  res.status(201).json({ id, ok: true });
});

app.put('/api/prompts/:id', authMiddleware, (req, res) => {
  const { title, content, category, is_favorite } = req.body;
  const sets = []; const params = [];
  if (title !== undefined) { sets.push("title = ?"); params.push(title); }
  if (content !== undefined) { sets.push("content = ?"); params.push(content); }
  if (category !== undefined) { sets.push("category = ?"); params.push(category); }
  if (is_favorite !== undefined) { sets.push("is_favorite = ?"); params.push(is_favorite ? 1 : 0); }
  sets.push("updated_at = datetime('now')");
  params.push(req.params.id, req.user.id);
  db.run(`UPDATE prompts SET ${sets.join(', ')} WHERE id = ? AND user_id = ?`, params);
  saveDatabase();
  res.json({ ok: true });
});

app.delete('/api/prompts/:id', authMiddleware, (req, res) => {
  db.run("DELETE FROM prompts WHERE id = ? AND user_id = ?", [req.params.id, req.user.id]);
  saveDatabase();
  res.json({ ok: true });
});

// ═══════════════════════════════════════════════════════════════
// AI CONVERSATIONS
// ═══════════════════════════════════════════════════════════════

app.get('/api/ai/conversations', authMiddleware, (req, res) => {
  res.json(rowsToArray(db.exec("SELECT id, user_id, title, model, created_at, updated_at FROM ai_conversations WHERE user_id = ? ORDER BY updated_at DESC", [req.user.id]), ['id', 'user_id', 'title', 'model', 'created_at', 'updated_at']));
});

app.post('/api/ai/conversations', authMiddleware, (req, res) => {
  const id = uuidv4();
  const { title = 'New Chat', model = 'deepseek/deepseek-v4-flash', messages = [] } = req.body;
  db.run("INSERT INTO ai_conversations (id, user_id, title, model, messages) VALUES (?, ?, ?, ?, ?)", [id, req.user.id, title, model, JSON.stringify(messages)]);
  saveDatabase();
  res.status(201).json({ id, ok: true });
});

app.get('/api/ai/conversations/:id', authMiddleware, (req, res) => {
  const result = db.exec("SELECT * FROM ai_conversations WHERE id = ? AND user_id = ?", [req.params.id, req.user.id]);
  if (result.length === 0) return res.status(404).json({ error: 'Conversation not found' });
  const conv = rowToObject(result[0].values[0], ['id', 'user_id', 'title', 'model', 'messages', 'created_at', 'updated_at']);
  try { conv.messages = JSON.parse(conv.messages); } catch { conv.messages = []; }
  res.json(conv);
});

app.put('/api/ai/conversations/:id', authMiddleware, (req, res) => {
  const { title, model, messages } = req.body;
  const sets = []; const params = [];
  if (title !== undefined) { sets.push("title = ?"); params.push(title); }
  if (model !== undefined) { sets.push("model = ?"); params.push(model); }
  if (messages !== undefined) { sets.push("messages = ?"); params.push(JSON.stringify(messages)); }
  sets.push("updated_at = datetime('now')");
  params.push(req.params.id, req.user.id);
  db.run(`UPDATE ai_conversations SET ${sets.join(', ')} WHERE id = ? AND user_id = ?`, params);
  saveDatabase();
  res.json({ ok: true });
});

app.delete('/api/ai/conversations/:id', authMiddleware, (req, res) => {
  db.run("DELETE FROM ai_conversations WHERE id = ? AND user_id = ?", [req.params.id, req.user.id]);
  saveDatabase();
  res.json({ ok: true });
});

// ═══════════════════════════════════════════════════════════════
// SETTINGS
// ═══════════════════════════════════════════════════════════════

app.get('/api/settings', authMiddleware, (req, res) => {
  const result = db.exec("SELECT * FROM settings WHERE user_id = ?", [req.user.id]);
  if (result.length === 0) return res.json({ theme: 'dark', sidebarOpen: true });
  const settings = rowToObject(result[0].values[0], ['id', 'user_id', 'theme', 'sidebar_open', 'data_json', 'created_at', 'updated_at']);
  try { Object.assign(settings, JSON.parse(settings.data_json)); } catch {}
  delete settings.data_json;
  settings.sidebarOpen = Boolean(settings.sidebar_open);
  delete settings.sidebar_open;
  res.json(settings);
});

app.put('/api/settings', authMiddleware, (req, res) => {
  const { theme, sidebar_open } = req.body;
  const sets = []; const params = [];
  if (theme !== undefined) { sets.push("theme = ?"); params.push(theme); }
  if (sidebar_open !== undefined) { sets.push("sidebar_open = ?"); params.push(sidebar_open ? 1 : 0); }
  sets.push("updated_at = datetime('now')");
  params.push(req.user.id);
  db.run(`UPDATE settings SET ${sets.join(', ')} WHERE user_id = ?`, params);
  saveDatabase();
  res.json({ ok: true });
});

// ═══════════════════════════════════════════════════════════════
// HEALTH
// ═══════════════════════════════════════════════════════════════

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime(), db: db ? 'connected' : 'disconnected' });
});

// ═══════════════════════════════════════════════════════════════
// HERMES COMMAND CENTER API
// ═══════════════════════════════════════════════════════════════

const HERMES_HOME = process.env.HERMES_HOME || path.join(os.homedir(), '.hermes');

app.get('/api/hermes/status', async (req, res) => {
  try {
    const version = '0.16.0';
    const skillsDir = path.join(HERMES_HOME, 'skills');
    const pluginsDir = path.join(HERMES_HOME, 'plugins');
    let skillsCount = 0, pluginsCount = 0;

    try { skillsCount = fs.readdirSync(skillsDir).filter(f => !f.startsWith('.')).length; } catch {}
    try { pluginsCount = fs.readdirSync(pluginsDir).filter(f => !f.startsWith('.') && !f.endsWith('.py')).length; } catch {}

    // Count MCP servers from all profile configs
    let mcpCount = 0;
    const profileDirs = [path.join(HERMES_HOME, 'profiles', 'default')];
    if (fs.existsSync(path.join(HERMES_HOME, 'profiles'))) {
      for (const profile of fs.readdirSync(path.join(HERMES_HOME, 'profiles'))) {
        const mcpDir = path.join(HERMES_HOME, 'profiles', profile, 'mcp');
        if (fs.existsSync(mcpDir)) mcpCount += fs.readdirSync(mcpDir).filter(f => f.endsWith('.json')).length;
      }
    }

    // Read config for model/provider info
    let model = 'deepseek-ai/deepseek-v4-flash';
    let provider = 'nvidia';
    try {
      const configRaw = fs.readFileSync(path.join(HERMES_HOME, 'config.yaml'), 'utf8');
      const modelMatch = configRaw.match(/^\s*default:\s+(.+)$/m);
      if (modelMatch) model = modelMatch[1].trim();
      // provider is inferred from base_url
      if (configRaw.includes('nvidia.com')) provider = 'nvidia';
      else if (configRaw.includes('openrouter')) provider = 'openrouter';
    } catch {}

    // Memory
    const memUsage = process.memoryUsage();
    const memCurrent = Math.round(memUsage.rss / 1024 / 1024);
    const memLimit = 400;

    // System
    const osInfo = await import('os');
    const totalMem = Math.round(osInfo.totalmem() / 1024 / 1024);
    const freeMem = Math.round(osInfo.freemem() / 1024 / 1024);

    let storageInfo = 'unknown';
    try {
      const df = execSync('df -h /storage/emulated/0 2>/dev/null || df -h / 2>/dev/null || echo "unknown"', { encoding: 'utf8', timeout: 3000 });
      storageInfo = df.split('\n').filter(l => l.trim() && !l.startsWith('Filesystem')).pop()?.replace(/\s+/g, ' ').trim() || 'unknown';
    } catch {}

    const hasAiKey = !!(process.env.OPENROUTER_API_KEY || process.env.AI_API_KEY || process.env.NVIDIA_API_KEY);

    res.json({
      version,
      uptime: process.uptime(),
      model,
      provider,
      configured: hasAiKey,
      skillsCount,
      pluginsCount,
      mcpCount,
      memoryUsage: { current: memCurrent, limit: memLimit, percent: Math.round((memCurrent / memLimit) * 100) },
      system: {
        os: `Linux ${osInfo.release()}`,
        arch: osInfo.arch(),
        memory: `${totalMem}MB total / ${freeMem}MB free`,
        storage: storageInfo,
      },
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/hermes/skills', async (req, res) => {
  try {
    const skillsDir = path.join(HERMES_HOME, 'skills');
    if (!fs.existsSync(skillsDir)) return res.json({ skills: [] });

    const skills = [];
    const entries = fs.readdirSync(skillsDir, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.name.startsWith('.')) continue;
      const skillPath = path.join(skillsDir, entry.name);
      const skillMd = path.join(skillPath, 'SKILL.md');
      let description = '';
      let category = '';

      if (fs.existsSync(skillMd)) {
        const content = fs.readFileSync(skillMd, 'utf8').slice(0, 300);
        const descMatch = content.match(/description:\s*"([^"]+)"/);
        if (descMatch) description = descMatch[1];
        // Category is the parent directory name if entry is a subfolder
      }

      // If it's a category directory (has subdirectories with SKILL.md)
      if (entry.isDirectory()) {
        const subs = fs.readdirSync(skillPath, { withFileTypes: true });
        const subSkills = subs.filter(s => s.isDirectory()).map(s => s.name);
        for (const sub of subSkills) {
          const subMd = path.join(skillPath, sub, 'SKILL.md');
          let subDesc = '';
          if (fs.existsSync(subMd)) {
            const subContent = fs.readFileSync(subMd, 'utf8').slice(0, 300);
            const d = subContent.match(/description:\s*"([^"]+)"/);
            if (d) subDesc = d[1];
          }
          skills.push({ name: `${entry.name}/${sub}`, category: entry.name, description: subDesc });
        }
      } else if (entry.name.endsWith('.md')) {
        const content = fs.readFileSync(skillPath, 'utf8').slice(0, 200);
        const d = content.match(/description:\s*"([^"]+)"/);
        skills.push({ name: entry.name.replace(/\.md$/, ''), category: '', description: d ? d[1] : '' });
      }
    }

    // Sort: categorized first, then alphabetical
    skills.sort((a, b) => {
      if (a.category && !b.category) return -1;
      if (!a.category && b.category) return 1;
      return a.name.localeCompare(b.name);
    });

    res.json({ skills: skills.slice(0, 200), total: skills.length });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/hermes/mcps', async (req, res) => {
  try {
    const servers = [];
    const profilesDir = path.join(HERMES_HOME, 'profiles');

    if (fs.existsSync(profilesDir)) {
      for (const profile of fs.readdirSync(profilesDir)) {
        const mcpDir = path.join(profilesDir, profile, 'mcp');
        if (fs.existsSync(mcpDir)) {
          for (const file of fs.readdirSync(mcpDir)) {
            if (file.endsWith('.json')) {
              try {
                const data = JSON.parse(fs.readFileSync(path.join(mcpDir, file), 'utf8'));
                servers.push({
                  name: file.replace(/\.json$/, ''),
                  command: data.command || data.cmd || '',
                  args: data.args || [],
                  status: data.status || 'disconnected',
                  tools: data.tools || [],
                  profile,
                });
              } catch {}
            }
          }
        }
      }
    }

    res.json({ servers, total: servers.length });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ═══════════════════════════════════════════════════════════════
// EXISTING EMPIRE ENDPOINTS
// ═══════════════════════════════════════════════════════════════

// File listing
app.get('/api/files', authMiddleware, (req, res) => {
  const dir = safePath(req.query.path);
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    const result = entries.filter(e => !e.name.startsWith('.')).map(e => {
      const stat = fs.statSync(path.join(dir, e.name));
      return { name: e.name, type: e.isDirectory() ? 'folder' : 'file', size: e.isFile() ? (stat.size || 0) : 0, modified: stat.mtime.toISOString() };
    }).sort((a, b) => { if (a.type !== b.type) return a.type === 'folder' ? -1 : 1; return a.name.localeCompare(b.name); });
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/file/download', authMiddleware, (req, res) => {
  const filePath = safePath(req.query.path);
  if (!filePath || !fs.existsSync(filePath)) return res.status(404).json({ error: 'Not found' });
  res.sendFile(path.resolve(filePath));
});

// SSRF-safe proxy: allowlist https + http, block private/loopback/link-local IPs
const PRIVATE_IPV4 = /^(10\.|127\.|169\.254\.|172\.(1[6-9]|2[0-9]|3[01])\.|192\.168\.|0\.|255\.)/;
function isPrivateIpv6(addr) {
  // loopback, link-local (fe80::/10), unique-local (fc00::/7), unspecified (::)
  if (!addr) return true;
  const lc = addr.toLowerCase();
  if (lc === '::1' || lc === '::') return true;
  if (lc.startsWith('fe80:') || lc.startsWith('fc') || lc.startsWith('fd')) return true;
  return false;
}
function isPrivateHost(hostname) {
  if (!hostname) return true;
  if (hostname === 'localhost' || hostname.endsWith('.localhost')) return true;
  if (PRIVATE_IPV4.test(hostname)) return true;
  if (isPrivateIpv6(hostname)) return true;
  return false;
}
function isSafeProxyUrl(raw) {
  let url;
  try { url = new URL(raw); } catch { return false; }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return false;
  if (isPrivateHost(url.hostname)) return false;
  return true;
}

app.get('/api/proxy', authMiddleware, rateLimit('proxy', 60, 60 * 1000), async (req, res) => {
  const url = req.query.url;
  if (!url || typeof url !== 'string') return res.status(400).json({ error: 'URL required' });
  if (!isSafeProxyUrl(url)) return res.status(403).json({ error: 'URL not allowed (private/loopback blocked)' });
  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; EmpireBrowser/1.0)' },
      signal: AbortSignal.timeout(10000),
      redirect: 'follow',
    });
    res.set('Content-Type', response.headers.get('content-type') || 'text/plain');
    res.send(await response.text());
  } catch (e) { res.status(502).json({ error: e.message }); }
});

// AI Chat Proxy
app.post('/api/ai/chat', authMiddleware, rateLimit('ai-chat', 120, 60 * 1000), async (req, res) => {
  const { messages, model, temperature, maxTokens, systemPrompt, apiKey, baseUrl } = req.body;
  const finalModel = model || 'deepseek-ai/deepseek-v4-flash';
  const nvidiaKey = process.env.NVIDIA_API_KEY;
  const orKey = process.env.OPENROUTER_API_KEY;
  const aiKey = process.env.AI_API_KEY;

  // Auto-route to Nvidia NIM when user passes NVIDIA key and no explicit baseUrl/apiKey
  const useNvidia = !apiKey && !baseUrl && !!nvidiaKey;
  const finalBaseUrl = baseUrl || (useNvidia ? 'https://integrate.api.nvidia.com/v1' : 'https://openrouter.ai/api/v1');
  const finalKey = apiKey || (useNvidia ? nvidiaKey : (orKey || aiKey || ''));
  const finalSystem = systemPrompt || 'You are Hermes, the AI agent powering The Empire.';

  if (!finalKey) return res.status(400).json({ error: 'No AI API key configured.' });

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
        ...(finalBaseUrl.includes('nvidia.com') ? { 'User-Agent': 'EmpireAI/1.0' } : {}),
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

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) { res.write('data: [DONE]\n\n'); res.end(); break; }
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6).trim();
          if (data === '[DONE]') continue;
          res.write(`data: ${data}\n\n`);
        }
      }
    }
  } catch (e) {
    if (!res.headersSent) { res.status(502).json({ error: e.message }); }
    else { res.write(`data: {"error": "${e.message}"}\n\n`); res.end(); }
  }
});

app.get('/api/ai/status', (req, res) => {
  const hasKey = !!(process.env.OPENROUTER_API_KEY || process.env.AI_API_KEY || process.env.NVIDIA_API_KEY);
  const usingNvidia = !!process.env.NVIDIA_API_KEY;
  res.json({
    configured: hasKey,
    defaultModel: 'deepseek-ai/deepseek-v4-flash',
    provider: usingNvidia ? 'nvidia' : 'openrouter',
    serverKey: hasKey ? 'configured' : 'missing',
    baseUrl: usingNvidia ? 'https://integrate.api.nvidia.com/v1' : 'https://openrouter.ai/api/v1',
  });
});

// Tool API
const TOOL_DEFINITIONS = {
  file_read: { description: 'Read a file', dangerous: false, schema: { path: 'string', limit: 'number?', offset: 'number?' } },
  file_write: { description: 'Write content to a file', dangerous: true, schema: { path: 'string', content: 'string', append: 'boolean?' } },
  file_list: { description: 'List a directory', dangerous: false, schema: { path: 'string' } },
  shell_exec: { description: 'Execute a shell command', dangerous: true, schema: { command: 'string', timeout: 'number?' } },
  web_search: { description: 'Search the web', dangerous: false, schema: { query: 'string', limit: 'number?' } },
  web_fetch: { description: 'Fetch a URL', dangerous: false, schema: { url: 'string' } },
  code_exec: { description: 'Execute code', dangerous: true, schema: { code: 'string', language: 'string' } },
};

const DANGEROUS_PATTERNS = [/rm\s+-rf\s+\//, /dd\s+if=/, /mkfs/, /fdisk/, />\s*\/dev\//, /format\s+/, /shutdown/, /reboot/, /poweroff/, /init\s+0/];
const SHELL_TIMEOUT = 30_000;
const CODE_TIMEOUT = 10_000;

// Tools that run shells / interpreters / write files are OFF by default — the
// pattern denylist above is trivially bypassable, so exposing them over HTTP is
// effectively unauthenticated RCE. Opt in with EMPIRE_ENABLE_DANGEROUS_TOOLS=1.
const DANGEROUS_TOOLS = new Set(['shell_exec', 'code_exec', 'file_write']);
const DANGEROUS_TOOLS_ENABLED = process.env.EMPIRE_ENABLE_DANGEROUS_TOOLS === '1';

function validateCommand(cmd) {
  if (!cmd || typeof cmd !== 'string') return 'No command';
  for (const p of DANGEROUS_PATTERNS) { if (p.test(cmd)) return `Blocked: ${cmd.slice(0, 40)}`; }
  return null;
}

app.get('/api/tools/list', (req, res) => {
  res.json({ tools: Object.keys(TOOL_DEFINITIONS) });
});

app.post('/api/tools/execute', authMiddleware, async (req, res) => {
  const { tool, params } = req.body;
  if (!tool) return res.status(400).json({ success: false, error: 'Missing tool name' });
  const def = TOOL_DEFINITIONS[tool];
  if (!def) return res.status(400).json({ success: false, error: `Unknown tool: ${tool}` });
  if ((def.dangerous || DANGEROUS_TOOLS.has(tool)) && !DANGEROUS_TOOLS_ENABLED) {
    return res.status(403).json({ success: false, error: `Tool "${tool}" is disabled. Set EMPIRE_ENABLE_DANGEROUS_TOOLS=1 to enable shell/code/file-write tools.` });
  }

  try {
    switch (tool) {
      case 'file_read': {
        const { path: fp, limit = 500, offset = 1 } = params;
        const lines = fs.readFileSync(safePath(fp), 'utf8').split('\n');
        const slice = lines.slice(offset - 1, offset - 1 + limit);
        res.json({ success: true, output: slice.map((l, i) => `${offset + i}|${l}`).join('\n') });
        break;
      }
      case 'file_write': {
        const { path: fp, content, append = false } = params;
        if (typeof content !== 'string') return res.json({ success: false, error: 'content must be a string' });
        if (content.length > 1024 * 1024) return res.json({ success: false, error: 'content exceeds 1 MiB cap' });
        if (append) { fs.appendFileSync(safePath(fp), content, 'utf8'); }
        else { fs.writeFileSync(safePath(fp), content, 'utf8'); }
        res.json({ success: true, output: `Written ${content.length} chars to ${fp}` });
        break;
      }
      case 'file_list': {
        const entries = fs.readdirSync(safePath(params.path), { withFileTypes: true });
        const result = entries.filter(e => !e.name.startsWith('.')).map(e => {
          const stat = fs.statSync(path.join(safePath(params.path), e.name));
          return `${e.isDirectory() ? 'd' : '-'} ${e.name}${e.isFile() ? ` (${stat.size}b)` : '/'}`;
        });
        res.json({ success: true, output: result.join('\n') || '(empty)' });
        break;
      }
      case 'shell_exec': {
        const { command, timeout = 10 } = params;
        const blocked = validateCommand(command);
        if (blocked) return res.json({ success: false, error: `Blocked: ${blocked}` });
        const actualTimeout = Math.min(timeout, SHELL_TIMEOUT / 1000) * 1000;
        exec(command, { timeout: actualTimeout, cwd: ALLOWED_BASE }, (err, stdout, stderr) => {
          if (err) return res.json({ success: false, error: err.message });
          res.json({ success: true, output: (stdout + stderr).trim() || '(no output)' });
        });
        break;
      }
      case 'web_search': {
        const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(params.query)}`;
        const resp = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(10000) });
        const html = await resp.text();
        const results = [];
        const itemRe = /<a class="result__a"[^>]*href="([^"]+)"[^>]*>([^<]+)<\/a>/g;
        let match; let count = 0;
        const limit = params.limit || 5;
        while ((match = itemRe.exec(html)) && count < limit) {
          results.push({ title: match[2].replace(/<[^>]+>/g, ''), url: match[1] });
          count++;
        }
        res.json({ success: true, output: results.map(r => `\u2022 ${r.title}\n  ${r.url}`).join('\n\n') || 'No results found' });
        break;
      }
      case 'web_fetch': {
        const resp = await fetch(params.url, { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(15000) });
        const text = await resp.text();
        res.json({ success: true, output: text.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 5000) });
        break;
      }
      case 'code_exec': {
        const { code, language } = params;
        if (!['python', 'javascript'].includes(language)) return res.json({ success: false, error: `Unsupported: ${language}` });
        const result = language === 'python'
          ? execSync(`python3 -c ${JSON.stringify(code)}`, { timeout: CODE_TIMEOUT, encoding: 'utf8', cwd: ALLOWED_BASE })
          : execSync(`node -e ${JSON.stringify(code)}`, { timeout: CODE_TIMEOUT, encoding: 'utf8' });
        res.json({ success: true, output: result.trim() || '(no output)' });
        break;
      }
      default: res.status(400).json({ success: false, error: `Unimplemented: ${tool}` });
    }
  } catch (e) { res.json({ success: false, error: e.message }); }
});

// ═══════════════════════════════════════════════════════════════
// CAKRA v2 — Multimodal AI Core (RFC: docs/rfc/cakra-v2.md)
// ═══════════════════════════════════════════════════════════════
// Provider adapter registry. Each adapter exposes:
//   async invoke({ modality, payload, userId, cacheKey }) -> { ok, kind, url?, text?, bytes, costUsd, provider, cached }
// Adapters may return text OR a data-URL/URL depending on modality.
// A1 ships a working text pass-through + a deterministic 'placeholder' provider
// for image preview (no paid API). Real fal/venice adapters land in A2.

const CAKRA_PROVIDERS = {
  text: {
    openai_compat: {
      name: 'openai_compat',
      async invoke({ payload }) {
        // Reuses the same upstream as /api/ai/chat but routes through CakraCore
        // so we get cost ledger + cache for free.
        const { messages, model, temperature = 0.7, maxTokens = 2048 } = payload || {};
        if (!Array.isArray(messages)) throw new Error('payload.messages must be an array');
        const nvidiaKey = process.env.NVIDIA_API_KEY;
        const orKey = process.env.OPENROUTER_API_KEY;
        const aiKey = process.env.AI_API_KEY;
        const useNvidia = !!nvidiaKey;
        const baseUrl = useNvidia ? 'https://integrate.api.nvidia.com/v1' : 'https://openrouter.ai/api/v1';
        const apiKey = useNvidia ? nvidiaKey : (orKey || aiKey || '');
        if (!apiKey) throw new Error('No AI API key configured');
        const resp = await fetch(`${baseUrl}/chat/completions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
          body: JSON.stringify({ model: model || 'deepseek-ai/deepseek-v4-flash', messages, temperature, max_tokens: maxTokens, stream: false }),
          signal: AbortSignal.timeout(60000),
        });
        if (!resp.ok) throw new Error(`AI upstream ${resp.status}`);
        const json = await resp.json();
        const text = json.choices?.[0]?.message?.content || '';
        return { kind: 'text', text, bytes: text.length, costUsd: 0.001, provider: 'openai_compat' };
      },
    },
  },
  image: {
    placeholder: {
      name: 'placeholder',
      async invoke({ payload }) {
        // Deterministic SVG data-URL. Used for A1 scaffolding so the Browser hero
        // can render without a paid provider. A2 swaps this for a real fal call.
        const prompt = String(payload?.prompt || '');
        const seed = [...prompt].reduce((a, c) => (a * 33 + c.charCodeAt(0)) >>> 0, 0);
        const hue = seed % 360;
        const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 512 512'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='hsl(${hue},70%,20%)'/><stop offset='1' stop-color='hsl(${(hue + 60) % 360},70%,45%)'/></linearGradient></defs><rect width='512' height='512' fill='url(#g)'/><text x='256' y='256' fill='rgba(255,255,255,0.85)' font-family='Sora, system-ui' font-size='22' text-anchor='middle' dominant-baseline='middle'>${prompt.slice(0, 60).replace(/[<>&]/g, '')}</text></svg>`;
        const b64 = Buffer.from(svg).toString('base64');
        return { kind: 'image', url: `data:image/svg+xml;base64,${b64}`, bytes: svg.length, costUsd: 0, provider: 'placeholder' };
      },
    },
  },
};

// In-memory call cache (5-minute TTL)
const cakraCache = new Map();
const CAKRA_CACHE_TTL = 5 * 60 * 1000;
function cakraCacheKey(req) { return JSON.stringify({ p: req.provider || 'auto', m: req.modality, pay: req.payload }); }

async function cakraInvoke(req, userId) {
  const modality = req.modality;
  const family = CAKRA_PROVIDERS[modality];
  if (!family) return { ok: false, error: `Unknown modality: ${modality}` };

  let providerKey = req.provider;
  if (!providerKey || providerKey === 'auto') {
    providerKey = Object.keys(family)[0]; // A1: first; A2+ introduces health-aware router
  }
  const adapter = family[providerKey];
  if (!adapter) return { ok: false, error: `No provider "${providerKey}" for modality "${modality}"` };

  const ck = cakraCacheKey({ ...req, provider: providerKey });
  const cached = cakraCache.get(ck);
  if (cached && Date.now() - cached.t < CAKRA_CACHE_TTL) {
    return { ...cached.v, cached: true };
  }

  const res = await adapter.invoke({ ...req, userId });
  cakraCache.set(ck, { t: Date.now(), v: res });

  // Ledger row in req_log table — cost usd is appended to req_log output column later.
  try {
    db.run(
      'INSERT INTO cakra_calls (id, user_id, modality, provider, cost_usd, bytes) VALUES (?, ?, ?, ?, ?, ?)',
      [uuidv4(), userId || null, modality, res.provider || providerKey, res.costUsd || 0, res.bytes || 0]
    );
  } catch (_e) { /* table may not exist on first boot */ }

  return { ...res, cached: false };
}

// === Cakra migration (only adds table; safe if schema is fresh or already migrated) ===
try {
  db.run(`CREATE TABLE IF NOT EXISTS _migrations (name TEXT PRIMARY KEY, applied_at TEXT DEFAULT (datetime('now')))`);
} catch (_e) {}
try {
  db.run(`CREATE TABLE IF NOT EXISTS cakra_calls (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    modality TEXT NOT NULL,
    provider TEXT NOT NULL,
    cost_usd REAL DEFAULT 0,
    bytes INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  )`);
} catch (_e) {}
try {
  db.run(`CREATE INDEX IF NOT EXISTS idx_cakra_calls_user ON cakra_calls(user_id, created_at)`);
} catch (_e) {}

// === Cakra routes ===
app.post('/api/cakra/invoke', authMiddleware, rateLimit('cakra', 60, 60 * 1000), async (req, res) => {
  const { modality, provider, payload } = req.body || {};
  if (!modality) return res.status(400).json({ ok: false, error: 'modality required' });
  try {
    const result = await cakraInvoke({ modality, provider, payload }, req.user?.id);
    res.json({ ok: true, ...result });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

app.get('/api/cakra/health', authMiddleware, (_req, res) => {
  const providers = {};
  for (const [modality, family] of Object.entries(CAKRA_PROVIDERS)) {
    providers[modality] = Object.keys(family);
  }
  res.json({ ok: true, providers, env: {
    nvidia: !!process.env.NVIDIA_API_KEY,
    openrouter: !!process.env.OPENROUTER_API_KEY,
    fal: !!process.env.FAL_KEY,
    venice: !!process.env.VENICE_API_KEY,
    openai: !!process.env.OPENAI_API_KEY,
    replicate: !!process.env.REPLICATE_API_TOKEN,
  }});
});

app.get('/api/cakra/cost', authMiddleware, (req, res) => {
  try {
    const result = db.exec(
      "SELECT modality, provider, SUM(cost_usd) AS total_usd, COUNT(*) AS calls FROM cakra_calls WHERE user_id = ? AND created_at >= datetime('now', '-30 day') GROUP BY modality, provider",
      [req.user.id]
    );
    const rows = (result[0]?.values || []).map(v => ({ modality: v[0], provider: v[1], total_usd: v[2], calls: v[3] }));
    res.json({ ok: true, rows });
  } catch (e) {
    res.json({ ok: true, rows: [], note: 'cost ledger warming up' });
  }
});

// ═══════════════════════════════════════════════════════════════
// WEBSOCKET
// ═══════════════════════════════════════════════════════════════

const peers = new Map();
wss.on('connection', (ws) => {
  const id = 'peer-' + Math.random().toString(36).substring(2, 8);
  peers.set(id, ws);
  ws.send(JSON.stringify({ type: 'welcome', id }));
  broadcast({ type: 'peers', count: peers.size });

  ws.on('message', (data) => {
    try {
      const msg = JSON.parse(data.toString());
      if (msg.type === 'chat') broadcast({ type: 'message', sender: id, content: msg.content, timestamp: Date.now() }, ws);
      else if (msg.type === 'app-event') broadcast({ type: 'app-event', app: msg.app, event: msg.event, data: msg.data, sender: id, timestamp: Date.now() });
      else if (msg.type === 'ping') ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
      else broadcast({ type: 'message', sender: id, content: msg, timestamp: Date.now() }, ws);
    } catch {}
  });

  ws.on('close', () => { peers.delete(id); broadcast({ type: 'peers', count: peers.size }); });
});

function broadcast(message, excludeWs = null) {
  const json = JSON.stringify(message);
  peers.forEach((client) => { if (client !== excludeWs && client.readyState === 1) client.send(json); });
}

// ═══════════════════════════════════════════════════════════════
// STATIC SERVING
// ═══════════════════════════════════════════════════════════════

const distPath = path.join(__dirname, 'dist');
app.use(express.static(distPath));
app.get('/{*path}', (req, res) => { res.sendFile(path.join(distPath, 'index.html')); });

// ═══════════════════════════════════════════════════════════════
// STARTUP
// ═══════════════════════════════════════════════════════════════

async function startServer() {
  try {
    await initDatabase();
    await ensureDefaultUser();

    server.listen(PORT, HOST, () => {
      console.log('\n  🏛️  The Empire — Backend API v2');
      console.log('  ──────────────────────────────────────');
      console.log(`  API Server:    http://localhost:${PORT}`);
      console.log(`  DB:            ${DB_PATH}`);
      console.log(`  Host:          ${HOST} (set EMPIRE_HOST=0.0.0.0 to expose on LAN)`);
      console.log(`  Auth:          /api/auth/login (admin / PIN shown above on first run)`);
      console.log(`  Health:        /api/health`);
      console.log(`  Notes API:     /api/notes`);
      console.log(`  Events API:    /api/events`);
      console.log(`  Learning API:  /api/learning`);
      console.log(`  Bookmarks API: /api/bookmarks`);
      console.log(`  AI Proxy:      /api/ai/chat`);
      console.log(`  Tool API:      /api/tools/list`);
      console.log(`  WebSocket:     ws://localhost:${PORT}`);
      console.log(`  Static:        http://localhost:${PORT}\n`);
    });
  } catch (e) {
    console.error('[FATAL] Server startup failed:', e);
    process.exit(1);
  }
}

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════

import { exec, execSync } from 'child_process';
import os from 'os';

function rowsToArray(result, columns) {
  if (result.length === 0) return [];
  return result[0].values.map(row => rowToObject(row, columns));
}

function rowToObject(row, columns) {
  const obj = {};
  columns.forEach((col, i) => { obj[col] = row[i]; });
  return obj;
}

startServer();