import express from 'express';
import path from 'path';
import fs from 'fs';
import http from 'http';
import { WebSocketServer } from 'ws';
import { fileURLToPath } from 'url';
import { exec, execSync } from 'child_process';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const PORT = process.env.PORT || 3001;
const ALLOWED_BASE = process.env.EMPIRE_ROOT || '/storage/emulated/0';
const JWT_SECRET = process.env.JWT_SECRET || 'empire-local-secret-change-in-production';
const DB_PATH = path.join(__dirname, 'data', 'empire.db');

// Ensure data directory exists
if (!fs.existsSync(path.join(__dirname, 'data'))) {
  fs.mkdirSync(path.join(__dirname, 'data'), { recursive: true });
}

// ═══════════════════════════════════════════════════════════════
// DATABASE LAYER
// ═══════════════════════════════════════════════════════════════

let db = null;
let initSqlJs = null;

async function initDatabase() {
  initSqlJs = await import('sql.js');
  const SQL = initSqlJs.default;

  // Try loading existing DB from disk
  if (fs.existsSync(DB_PATH)) {
    const buffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(buffer);
    console.log('[DB] Loaded existing database from', DB_PATH);
  } else {
    db = new SQL.Database();
    console.log('[DB] Created new in-memory database');
  }

  runMigrations(db);
  saveDatabase(); // persist after migrations
}

function saveDatabase() {
  if (!db) return;
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(DB_PATH, buffer);
}

function runMigrations(db) {
  // Create migration tracking table
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
    const pinHash = await bcrypt.hash('1234', 10);
    db.run(
      "INSERT INTO users (id, username, pin_hash, display_name) VALUES (?, ?, ?, ?)",
      [id, 'admin', pinHash, 'Admin']
    );
    // Create default settings
    db.run(
      "INSERT OR IGNORE INTO settings (id, user_id, data_json) VALUES (?, ?, '{}')",
      [uuidv4(), id]
    );
    saveDatabase();
    console.log('[AUTH] Created default user: admin / PIN: 1234');
  }
}

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid authorization header' });
  }
  const token = authHeader.slice(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
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
      req.user = jwt.verify(authHeader.slice(7), JWT_SECRET);
    } catch (e) {
      // token invalid, continue without user
    }
  }
  next();
}

// ═══════════════════════════════════════════════════════════════
// MIDDLEWARE
// ═══════════════════════════════════════════════════════════════

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});
app.use(express.json({ limit: '10mb' }));

// ─── Path safety ────────────────────────────────────────────────
function safePath(userPath) {
  if (!userPath) return ALLOWED_BASE;
  const resolved = path.resolve(String(userPath));
  if (!resolved.startsWith(path.resolve(ALLOWED_BASE))) {
    return path.resolve(ALLOWED_BASE);
  }
  return resolved;
}

// ═══════════════════════════════════════════════════════════════
// AUTH ENDPOINTS (no auth required)
// ═══════════════════════════════════════════════════════════════

app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, pin } = req.body;
    if (!username || !pin) {
      return res.status(400).json({ error: 'Username and PIN required' });
    }

    const result = db.exec("SELECT id, username, pin_hash, display_name FROM users WHERE username = ?", [username]);
    if (result.length === 0 || result[0].values.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const row = result[0].values[0];
    const [userId, dbUsername, pinHash, displayName] = row;
    const valid = await bcrypt.compare(pin, pinHash);

    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: userId, username: dbUsername, displayName },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: { id: userId, username: dbUsername, displayName }
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.put('/api/auth/pin', authMiddleware, async (req, res) => {
  try {
    const { currentPin, newPin } = req.body;
    if (!currentPin || !newPin) {
      return res.status(400).json({ error: 'Current PIN and new PIN required' });
    }

    const result = db.exec("SELECT pin_hash FROM users WHERE id = ?", [req.user.id]);
    if (result.length === 0 || result[0].values.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const valid = await bcrypt.compare(currentPin, result[0].values[0][0]);
    if (!valid) return res.status(401).json({ error: 'Current PIN is incorrect' });

    const newHash = await bcrypt.hash(newPin, 10);
    db.run("UPDATE users SET pin_hash = ?, updated_at = datetime('now') WHERE id = ?", [newHash, req.user.id]);
    saveDatabase();
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/auth/me', authMiddleware, (req, res) => {
  const result = db.exec(
    "SELECT id, username, display_name, avatar, created_at FROM users WHERE id = ?",
    [req.user.id]
  );
  if (result.length === 0 || result[0].values.length === 0) {
    return res.status(404).json({ error: 'User not found' });
  }
  const row = result[0].values[0];
  res.json({
    id: row[0],
    username: row[1],
    displayName: row[2],
    avatar: row[3],
    createdAt: row[4]
  });
});

// ═══════════════════════════════════════════════════════════════
// NOTES CRUD
// ═══════════════════════════════════════════════════════════════

app.get('/api/notes', authMiddleware, (req, res) => {
  const includeArchived = req.query.include_archived === 'true';
  const sql = includeArchived
    ? "SELECT * FROM notes WHERE user_id = ? ORDER BY updated_at DESC"
    : "SELECT * FROM notes WHERE user_id = ? AND is_archived = 0 ORDER BY updated_at DESC";
  const result = db.exec(sql, [req.user.id]);
  const notes = rowsToArray(result, ['id', 'user_id', 'title', 'content', 'tags', 'is_archived', 'created_at', 'updated_at']);
  // Parse tags JSON
  notes.forEach(n => {
    try { n.tags = JSON.parse(n.tags); } catch { n.tags = []; }
    n.is_archived = Boolean(n.is_archived);
  });
  res.json(notes);
});

app.get('/api/notes/:id', authMiddleware, (req, res) => {
  const result = db.exec("SELECT * FROM notes WHERE id = ? AND user_id = ?", [req.params.id, req.user.id]);
  if (result.length === 0 || result[0].values.length === 0) {
    return res.status(404).json({ error: 'Note not found' });
  }
  const note = rowToObject(result[0].values[0], ['id', 'user_id', 'title', 'content', 'tags', 'is_archived', 'created_at', 'updated_at']);
  try { note.tags = JSON.parse(note.tags); } catch { note.tags = []; }
  note.is_archived = Boolean(note.is_archived);
  res.json(note);
});

app.post('/api/notes', authMiddleware, (req, res) => {
  const id = uuidv4();
  const { title = '', content = '', tags = [] } = req.body;
  db.run(
    "INSERT INTO notes (id, user_id, title, content, tags) VALUES (?, ?, ?, ?, ?)",
    [id, req.user.id, title, content, JSON.stringify(tags)]
  );
  saveDatabase();
  res.status(201).json({ id, ok: true });
});

app.put('/api/notes/:id', authMiddleware, (req, res) => {
  const { title, content, tags, is_archived } = req.body;
  const sets = [];
  const params = [];
  if (title !== undefined) { sets.push("title = ?"); params.push(title); }
  if (content !== undefined) { sets.push("content = ?"); params.push(content); }
  if (tags !== undefined) { sets.push("tags = ?"); params.push(JSON.stringify(tags)); }
  if (is_archived !== undefined) { sets.push("is_archived = ?"); params.push(is_archived ? 1 : 0); }
  sets.push("updated_at = datetime('now')");

  params.push(req.params.id, req.user.id);
  db.run(
    `UPDATE notes SET ${sets.join(', ')} WHERE id = ? AND user_id = ?`,
    params
  );
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
  const result = db.exec("SELECT * FROM events WHERE user_id = ? ORDER BY date ASC", [req.user.id]);
  res.json(rowsToArray(result, ['id', 'user_id', 'title', 'date', 'time', 'description', 'color', 'created_at', 'updated_at']));
});

app.get('/api/events/:id', authMiddleware, (req, res) => {
  const result = db.exec("SELECT * FROM events WHERE id = ? AND user_id = ?", [req.params.id, req.user.id]);
  if (result.length === 0 || result[0].values.length === 0) return res.status(404).json({ error: 'Event not found' });
  res.json(rowToObject(result[0].values[0], ['id', 'user_id', 'title', 'date', 'time', 'description', 'color', 'created_at', 'updated_at']));
});

app.post('/api/events', authMiddleware, (req, res) => {
  const id = uuidv4();
  const { title, date, time = '', description = '', color = '#3b82f6' } = req.body;
  if (!title || !date) return res.status(400).json({ error: 'Title and date required' });
  db.run(
    "INSERT INTO events (id, user_id, title, date, time, description, color) VALUES (?, ?, ?, ?, ?, ?, ?)",
    [id, req.user.id, title, date, time, description, color]
  );
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
  const result = db.exec(
    "SELECT * FROM messages WHERE room = ? ORDER BY timestamp DESC LIMIT ?",
    [room, limit]
  );
  res.json(rowsToArray(result, ['id', 'sender', 'content', 'room', 'timestamp', 'created_at']));
});

app.post('/api/messages', optionalAuth, (req, res) => {
  const id = uuidv4();
  const { sender = 'anonymous', content, room = 'general' } = req.body;
  if (!content) return res.status(400).json({ error: 'Content required' });
  const timestamp = Date.now();
  db.run(
    "INSERT INTO messages (id, sender, content, room, timestamp) VALUES (?, ?, ?, ?, ?)",
    [id, sender, content, room, timestamp]
  );
  saveDatabase();
  res.status(201).json({ id, ok: true, timestamp });
});

// ═══════════════════════════════════════════════════════════════
// LEARNING ITEMS CRUD
// ═══════════════════════════════════════════════════════════════

app.get('/api/learning', authMiddleware, (req, res) => {
  const result = db.exec("SELECT * FROM learning_items WHERE user_id = ? ORDER BY date DESC", [req.user.id]);
  const items = rowsToArray(result, ['id', 'user_id', 'topic', 'learned', 'date', 'next_review', 'mastered', 'created_at', 'updated_at']);
  items.forEach(i => i.mastered = Boolean(i.mastered));
  res.json(items);
});

app.post('/api/learning', authMiddleware, (req, res) => {
  const id = uuidv4();
  const { topic, learned = '', date, next_review = '' } = req.body;
  if (!topic || !date) return res.status(400).json({ error: 'Topic and date required' });
  db.run(
    "INSERT INTO learning_items (id, user_id, topic, learned, date, next_review) VALUES (?, ?, ?, ?, ?, ?)",
    [id, req.user.id, topic, learned, date, next_review]
  );
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
  const result = db.exec("SELECT * FROM bookmarks WHERE user_id = ? ORDER BY created_at DESC", [req.user.id]);
  res.json(rowsToArray(result, ['id', 'user_id', 'title', 'url', 'category', 'favicon', 'created_at']));
});

app.post('/api/bookmarks', authMiddleware, (req, res) => {
  const id = uuidv4();
  const { title, url, category = 'general', favicon = '' } = req.body;
  if (!title || !url) return res.status(400).json({ error: 'Title and URL required' });
  db.run(
    "INSERT INTO bookmarks (id, user_id, title, url, category, favicon) VALUES (?, ?, ?, ?, ?, ?)",
    [id, req.user.id, title, url, category, favicon]
  );
  saveDatabase();
  res.status(201).json({ id, ok: true });
});

app.delete('/api/bookmarks/:id', authMiddleware, (req, res) => {
  db.run("DELETE FROM bookmarks WHERE id = ? AND user_id = ?", [req.params.id, req.user.id]);
  saveDatabase();
  res.json({ ok: true });
});

// ═══════════════════════════════════════════════════════════════
// DATA CENTER (dynamic CRUD tables)
// ═══════════════════════════════════════════════════════════════

app.get('/api/dc/tables', authMiddleware, (req, res) => {
  const result = db.exec("SELECT * FROM dc_tables WHERE user_id = ? ORDER BY created_at DESC", [req.user.id]);
  const tables = rowsToArray(result, ['id', 'user_id', 'name', 'schema_json', 'created_at', 'updated_at']);
  tables.forEach(t => {
    try { t.schema = JSON.parse(t.schema_json); } catch { t.schema = []; }
    delete t.schema_json;
  });
  res.json(tables);
});

app.post('/api/dc/tables', authMiddleware, (req, res) => {
  const id = uuidv4();
  const { name, schema = [] } = req.body;
  if (!name) return res.status(400).json({ error: 'Table name required' });
  db.run(
    "INSERT INTO dc_tables (id, user_id, name, schema_json) VALUES (?, ?, ?, ?)",
    [id, req.user.id, name, JSON.stringify(schema)]
  );
  saveDatabase();
  res.status(201).json({ id, name, ok: true });
});

app.get('/api/dc/tables/:tableId/rows', authMiddleware, (req, res) => {
  const result = db.exec(
    "SELECT r.*, t.name as table_name FROM dc_rows r JOIN dc_tables t ON r.table_id = t.id WHERE r.table_id = ? AND t.user_id = ? ORDER BY r.created_at DESC",
    [req.params.tableId, req.user.id]
  );
  const rows = rowsToArray(result, ['id', 'table_id', 'data_json', 'created_at', 'updated_at', 'table_name']);
  rows.forEach(r => {
    try { r.data = JSON.parse(r.data_json); } catch { r.data = {}; }
    delete r.data_json;
  });
  res.json(rows);
});

app.post('/api/dc/tables/:tableId/rows', authMiddleware, (req, res) => {
  const id = uuidv4();
  const { data = {} } = req.body;
  // Verify table exists and belongs to user
  const tableCheck = db.exec("SELECT id FROM dc_tables WHERE id = ? AND user_id = ?", [req.params.tableId, req.user.id]);
  if (tableCheck.length === 0 || tableCheck[0].values.length === 0) {
    return res.status(404).json({ error: 'Table not found' });
  }
  db.run(
    "INSERT INTO dc_rows (id, table_id, data_json) VALUES (?, ?, ?)",
    [id, req.params.tableId, JSON.stringify(data)]
  );
  saveDatabase();
  res.status(201).json({ id, ok: true });
});

app.put('/api/dc/tables/:tableId/rows/:rowId', authMiddleware, (req, res) => {
  const { data } = req.body;
  if (!data) return res.status(400).json({ error: 'Data required' });
  db.run(
    "UPDATE dc_rows SET data_json = ?, updated_at = datetime('now') WHERE id = ? AND table_id = ?",
    [JSON.stringify(data), req.params.rowId, req.params.tableId]
  );
  saveDatabase();
  res.json({ ok: true });
});

app.delete('/api/dc/tables/:tableId/rows/:rowId', authMiddleware, (req, res) => {
  db.run("DELETE FROM dc_rows WHERE id = ? AND table_id = ?", [req.params.rowId, req.params.tableId]);
  saveDatabase();
  res.json({ ok: true });
});

app.delete('/api/dc/tables/:tableId', authMiddleware, (req, res) => {
  // Delete all rows first, then the table
  db.run("DELETE FROM dc_rows WHERE table_id = ?", [req.params.tableId]);
  db.run("DELETE FROM dc_tables WHERE id = ? AND user_id = ?", [req.params.tableId, req.user.id]);
  saveDatabase();
  res.json({ ok: true });
});

// ═══════════════════════════════════════════════════════════════
// PROMPTS CRUD
// ═══════════════════════════════════════════════════════════════

app.get('/api/prompts', authMiddleware, (req, res) => {
  const result = db.exec("SELECT * FROM prompts WHERE user_id = ? ORDER BY updated_at DESC", [req.user.id]);
  const prompts = rowsToArray(result, ['id', 'user_id', 'title', 'content', 'category', 'is_favorite', 'created_at', 'updated_at']);
  prompts.forEach(p => p.is_favorite = Boolean(p.is_favorite));
  res.json(prompts);
});

app.post('/api/prompts', authMiddleware, (req, res) => {
  const id = uuidv4();
  const { title = '', content, category = 'general' } = req.body;
  if (!content) return res.status(400).json({ error: 'Content required' });
  db.run(
    "INSERT INTO prompts (id, user_id, title, content, category) VALUES (?, ?, ?, ?, ?)",
    [id, req.user.id, title, content, category]
  );
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
  const result = db.exec("SELECT id, user_id, title, model, created_at, updated_at FROM ai_conversations WHERE user_id = ? ORDER BY updated_at DESC", [req.user.id]);
  res.json(rowsToArray(result, ['id', 'user_id', 'title', 'model', 'created_at', 'updated_at']));
});

app.post('/api/ai/conversations', authMiddleware, (req, res) => {
  const id = uuidv4();
  const { title = 'New Chat', model = 'deepseek/deepseek-v4-flash', messages = [] } = req.body;
  db.run(
    "INSERT INTO ai_conversations (id, user_id, title, model, messages) VALUES (?, ?, ?, ?, ?)",
    [id, req.user.id, title, model, JSON.stringify(messages)]
  );
  saveDatabase();
  res.status(201).json({ id, ok: true });
});

app.get('/api/ai/conversations/:id', authMiddleware, (req, res) => {
  const result = db.exec("SELECT * FROM ai_conversations WHERE id = ? AND user_id = ?", [req.params.id, req.user.id]);
  if (result.length === 0 || result[0].values.length === 0) return res.status(404).json({ error: 'Conversation not found' });
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
  if (result.length === 0 || result[0].values.length === 0) {
    return res.json({ theme: 'dark', sidebarOpen: true });
  }
  const settings = rowToObject(result[0].values[0], ['id', 'user_id', 'theme', 'sidebar_open', 'data_json', 'created_at', 'updated_at']);
  try { Object.assign(settings, JSON.parse(settings.data_json)); } catch { /* ignore */ }
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
// EXISTING EMPIRE ENDPOINTS (file listing, download, proxy, AI chat)
// ═══════════════════════════════════════════════════════════════

// File listing
app.get('/api/files', (req, res) => {
  const dir = safePath(req.query.path);
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    const result = entries
      .filter(e => !e.name.startsWith('.'))
      .map(e => {
        const stat = fs.statSync(path.join(dir, e.name));
        return { name: e.name, type: e.isDirectory() ? 'folder' : 'file', size: e.isFile() ? (stat.size || 0) : 0, modified: stat.mtime.toISOString() };
      })
      .sort((a, b) => { if (a.type !== b.type) return a.type === 'folder' ? -1 : 1; return a.name.localeCompare(b.name); });
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
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
    const response = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; EmpireBrowser/1.0)' }, signal: AbortSignal.timeout(10000) });
    res.send(await response.text());
  } catch (e) { res.status(502).json({ error: e.message }); }
});

// ─── AI Chat Proxy ─────────────────────────────────────────────
app.post('/api/ai/chat', async (req, res) => {
  const { messages, model, temperature, maxTokens, systemPrompt, apiKey, baseUrl } = req.body;
  const finalModel = model || 'deepseek/deepseek-v4-flash';
  const finalBaseUrl = baseUrl || 'https://openrouter.ai/api/v1';
  const finalKey = apiKey || process.env.OPENROUTER_API_KEY || process.env.AI_API_KEY || '';
  const finalSystem = systemPrompt || 'You are Hermes, the AI agent powering The Empire — a personal application suite. You are helpful, concise, and have full context awareness of all apps.';

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
  const hasKey = !!(process.env.OPENROUTER_API_KEY || process.env.AI_API_KEY);
  res.json({ configured: hasKey, defaultModel: 'deepseek/deepseek-v4-flash', provider: 'openrouter', serverKey: hasKey ? 'configured' : 'missing' });
});

// ─── Tool API ──────────────────────────────────────────────────
const TOOL_DEFINITIONS = {
  file_read: { description: 'Read a file', dangerous: false, schema: { path: 'string', limit: 'number?', offset: 'number?' } },
  file_write: { description: 'Write content to a file', dangerous: true, schema: { path: 'string', content: 'string', append: 'boolean?' } },
  file_list: { description: 'List a directory', dangerous: false, schema: { path: 'string' } },
  shell_exec: { description: 'Execute a shell command', dangerous: true, schema: { command: 'string', timeout: 'number?' } },
  web_search: { description: 'Search the web', dangerous: false, schema: { query: 'string', limit: 'number?' } },
  web_fetch: { description: 'Fetch a URL', dangerous: false, schema: { url: 'string', query: 'string?' } },
  code_exec: { description: 'Execute code', dangerous: false, schema: { code: 'string', language: 'string', args: 'object?' } },
};

const DANGEROUS_PATTERNS = [
  /rm\s+-rf\s+\//, /dd\s+if=/, /mkfs/, /fdisk/, />\s*\/dev\//,
  /format\s+/, /shutdown/, /reboot/, /poweroff/, /init\s+0/,
  /:\(|:\)|递龟|汞|潘|涅|沸|活|龜|龠/,
];

const SHELL_TIMEOUT = 30_000;
const CODE_TIMEOUT = 10_000;

function validateCommand(cmd) {
  if (!cmd || typeof cmd !== 'string') return 'No command';
  for (const p of DANGEROUS_PATTERNS) { if (p.test(cmd)) return `Blocked: ${cmd.slice(0, 40)}`; }
  return null;
}

app.get('/api/tools/list', (req, res) => {
  res.json({ tools: Object.keys(TOOL_DEFINITIONS) });
});

app.post('/api/tools/execute', async (req, res) => {
  const { tool, params } = req.body;
  if (!tool || typeof tool !== 'string') return res.status(400).json({ success: false, error: 'Missing tool name' });
  const def = TOOL_DEFINITIONS[tool];
  if (!def) return res.status(400).json({ success: false, error: `Unknown tool: ${tool}` });

  switch (tool) {
    case 'file_read': {
      const { path: fp, limit = 500, offset = 1 } = params;
      if (!fp) return res.json({ success: false, error: 'Missing path' });
      try {
        const lines = fs.readFileSync(safePath(fp), 'utf8').split('\n');
        const slice = lines.slice(offset - 1, offset - 1 + limit);
        res.json({ success: true, output: slice.map((l, i) => `${offset + i}|${l}`).join('\n') });
      } catch (e) { res.json({ success: false, error: e.message }); }
      break;
    }
    case 'file_write': {
      if (def.dangerous) { const v = validateCommand(params.content); if (v) return res.json({ success: false, error: v }); }
      const { path: fp, content, append = false } = params;
      if (!fp) return res.json({ success: false, error: 'Missing path' });
      try {
        if (append) { fs.appendFileSync(safePath(fp), content, 'utf8'); }
        else { fs.writeFileSync(safePath(fp), content, 'utf8'); }
        res.json({ success: true, output: `Written ${content.length} chars to ${fp}` });
      } catch (e) { res.json({ success: false, error: e.message }); }
      break;
    }
    case 'file_list': {
      const { path: fp } = params;
      if (!fp) return res.json({ success: false, error: 'Missing path' });
      try {
        const entries = fs.readdirSync(safePath(fp), { withFileTypes: true });
        const result = entries.filter(e => !e.name.startsWith('.')).map(e => {
          const stat = fs.statSync(path.join(safePath(fp), e.name));
          return `${e.isDirectory() ? 'd' : '-'} ${e.name}${e.isFile() ? ` (${stat.size}b)` : '/'}`;
        });
        res.json({ success: true, output: result.join('\n') || '(empty)' });
      } catch (e) { res.json({ success: false, error: e.message }); }
      break;
    }
    case 'shell_exec': {
      const { command, timeout = 10 } = params;
      if (!command) return res.json({ success: false, error: 'Missing command' });
      const blocked = validateCommand(command);
      if (blocked) return res.json({ success: false, error: `Blocked: ${blocked}` });
      const actualTimeout = Math.min(timeout, SHELL_TIMEOUT / 1000) * 1000;
      exec(command, { timeout: actualTimeout, cwd: ALLOWED_BASE }, (err, stdout, stderr) => {
        if (err) { res.json({ success: false, error: err.message }); }
        else { res.json({ success: true, output: (stdout + stderr).trim() || '(no output)' }); }
      });
      break;
    }
    case 'web_search': {
      const { query, limit = 5 } = params;
      if (!query) return res.json({ success: false, error: 'Missing query' });
      try {
        const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
        const resp = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(10000) });
        const html = await resp.text();
        const results = [];
        const itemRe = /<a class="result__a"[^>]*href="([^"]+)"[^>]*>([^<]+)<\/a>/g;
        let match; let count = 0;
        while ((match = itemRe.exec(html)) && count < limit) {
          results.push({ title: match[2].replace(/<[^>]+>/g, ''), url: match[1] });
          count++;
        }
        res.json({ success: true, output: results.map(r => `• ${r.title}\n  ${r.url}`).join('\n\n') || 'No results found' });
      } catch (e) { res.json({ success: false, error: e.message }); }
      break;
    }
    case 'web_fetch': {
      const { url } = params;
      if (!url) return res.json({ success: false, error: 'Missing URL' });
      try {
        const resp = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(15000) });
        const text = await resp.text();
        res.json({ success: true, output: text.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 5000) });
      } catch (e) { res.json({ success: false, error: e.message }); }
      break;
    }
    case 'code_exec': {
      const { code, language } = params;
      if (!code || !language) return res.json({ success: false, error: 'Missing code or language' });
      if (!['python', 'javascript'].includes(language)) return res.json({ success: false, error: `Unsupported language: ${language}` });
      try {
        if (language === 'python') {
          const result = execSync(`python3 -c ${JSON.stringify(code)}`, { timeout: CODE_TIMEOUT, encoding: 'utf8', cwd: ALLOWED_BASE });
          res.json({ success: true, output: result.trim() || '(no output)' });
        } else {
          const result = execSync(`node -e ${JSON.stringify(code)}`, { timeout: CODE_TIMEOUT, encoding: 'utf8' });
          res.json({ success: true, output: result.trim() || '(no output)' });
        }
      } catch (e) { res.json({ success: false, error: e.message }); }
      break;
    }
    default: res.status(400).json({ success: false, error: `Unimplemented tool: ${tool}` });
  }
});

// ═══════════════════════════════════════════════════════════════
// WEBSOCKET
// ═══════════════════════════════════════════════════════════════

const peers = new Map();

wss.on('connection', (ws, req) => {
  const id = 'peer-' + Math.random().toString(36).substring(2, 8);
  peers.set(id, ws);
  ws.send(JSON.stringify({ type: 'welcome', id }));
  broadcast({ type: 'peers', count: peers.size });

  ws.on('message', (data) => {
    try {
      const msg = JSON.parse(data.toString());
      if (msg.type === 'chat') {
        broadcast({ type: 'message', sender: id, content: msg.content, timestamp: Date.now() }, ws);
      } else if (msg.type === 'app-event') {
        broadcast({ type: 'app-event', app: msg.app, event: msg.event, data: msg.data, sender: id, timestamp: Date.now() });
      } else if (msg.type === 'ping') {
        ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
      } else {
        broadcast({ type: 'message', sender: id, content: msg, timestamp: Date.now() }, ws);
      }
    } catch (e) { /* ignore malformed */ }
  });

  ws.on('close', () => { peers.delete(id); broadcast({ type: 'peers', count: peers.size }); });
});

function broadcast(message, excludeWs = null) {
  const json = JSON.stringify(message);
  peers.forEach((client, peerId) => {
    if (client !== excludeWs && client.readyState === 1) client.send(json);
  });
}

// ═══════════════════════════════════════════════════════════════
// STATIC SERVING
// ═══════════════════════════════════════════════════════════════

const distPath = path.join(__dirname, 'dist');
app.use(express.static(distPath));
app.get('/app{*path}', (req, res) => { res.sendFile(path.join(distPath, 'index.html'), (err) => { if (err) res.status(500).send('Error loading app'); }); });
app.get('/', (req, res) => { res.sendFile(path.join(distPath, 'index.html'), (err) => { if (err) res.status(500).send('Error loading app'); }); });
app.get('{*path}', (req, res) => { res.sendFile(path.join(distPath, 'index.html')); });

// ═══════════════════════════════════════════════════════════════
// STARTUP
// ═══════════════════════════════════════════════════════════════

async function startServer() {
  try {
    await initDatabase();
    await ensureDefaultUser();

    server.listen(PORT, '0.0.0.0', () => {
      console.log('\n  🏛️  The Empire — Hermes Connected v2');
      console.log('  ──────────────────────────────────────');
      console.log(`  API Server:    http://localhost:${PORT}`);
      console.log(`  DB:            ${DB_PATH}`);
      console.log(`  Auth:          /api/auth/login (admin / 1234)`);
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