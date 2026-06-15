# The Empire — Architecture Specification

> Version 2.0 | Generated from working codebase | All 54 API tests passing

## 1. Tech Stack

| Layer | Technology | Version | Rationale |
|---|---|---|---|
| Runtime | Node.js | 22.x (ESM) | Termux-native, ARM64 support |
| Backend Framework | Express.js | 5.x | HTTP routing, middleware, static serving |
| Database | sql.js (SQLite WASM) | 1.14.x | Zero-config, file-backed, in-process |
| Realtime | ws (WebSocket) | 8.x | Peer-to-peer messaging, SSE fallback |
| Auth | JWT (jsonwebtoken) + bcryptjs | 9.x / 3.x | Stateless tokens, PIN-based auth |
| IDs | uuid v4 | 14.x | Universally unique, no coordination needed |
| Frontend | Vanilla JS (SPA) | — | Served from `/dist`, no build step required |

## 2. Architecture Overview

```
┌─────────────────────────────────────────┐
│           Browser (SPA)                 │
│  /dist/index.html + JS bundles         │
└────────────┬────────────────────────────┘
             │ HTTP REST + WebSocket
┌────────────▼────────────────────────────┐
│        Express.js Server (port 3001)    │
│  ┌──────────────────────────────────┐   │
│  │  Middleware Stack                 │   │
│  │  • CORS (Access-Control-*)       │   │
│  │  • JSON body parser (5mb limit)  │   │
│  │  • JWT auth guard (per-route)    │   │
│  └──────────────────────────────────┘   │
│  ┌──────────┐ ┌──────────┐ ┌────────┐  │
│  │ REST API │ │ Tool API │ │  AI    │  │
│  │ (CRUD)   │ │ (Exec)   │ │ Proxy  │  │
│  └────┬─────┘ └────┬─────┘ └───┬────┘  │
│       │            │           │        │
│  ┌────▼────────────▼───────────▼────┐  │
│  │     sql.js Database Layer        │  │
│  │     data/empire.db (file-backed) │  │
│  └──────────────────────────────────┘  │
│  ┌──────────────────────────────────┐  │
│  │     WebSocket Server             │  │
│  │     Peer tracking + broadcast    │  │
│  └──────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

## 3. Database Schema

### 3.1 Users
```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  pin_hash TEXT NOT NULL,
  display_name TEXT,
  avatar TEXT,
  role TEXT DEFAULT 'user',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);
```
Default user: `admin` / PIN `1234` (bcrypt hashed).

### 3.2 Notes
```sql
CREATE TABLE notes (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT DEFAULT '',
  tags TEXT DEFAULT '[]',
  is_pinned INTEGER DEFAULT 0,
  category TEXT DEFAULT '',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```
Tags stored as JSON array string.

### 3.3 Events
```sql
CREATE TABLE events (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  date TEXT NOT NULL,
  time TEXT DEFAULT '',
  end_date TEXT,
  end_time TEXT,
  color TEXT DEFAULT '#4a9eff',
  location TEXT DEFAULT '',
  recurrence TEXT DEFAULT 'none',
  reminder INTEGER DEFAULT 0,
  category TEXT DEFAULT '',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### 3.4 Learning
```sql
CREATE TABLE learning (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  topic TEXT NOT NULL,
  description TEXT DEFAULT '',
  date TEXT NOT NULL,
  mastered INTEGER DEFAULT 0,
  notes TEXT DEFAULT '',
  category TEXT DEFAULT '',
  difficulty TEXT DEFAULT 'beginner',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### 3.5 Bookmarks
```sql
CREATE TABLE bookmarks (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  description TEXT DEFAULT '',
  category TEXT DEFAULT '',
  icon TEXT DEFAULT '',
  is_favorite INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### 3.6 Prompts
```sql
CREATE TABLE prompts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT DEFAULT '',
  is_favorite INTEGER DEFAULT 0,
  use_count INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### 3.7 Messages
```sql
CREATE TABLE messages (
  id TEXT PRIMARY KEY,
  sender TEXT NOT NULL,
  content TEXT NOT NULL,
  room TEXT DEFAULT 'general',
  created_at TEXT DEFAULT (datetime('now'))
);
```
No FK to users — supports bot/system messages.

### 3.8 AI Conversations
```sql
CREATE TABLE ai_conversations (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT DEFAULT 'New Chat',
  model TEXT DEFAULT 'deepseek/deepseek-v4-flash',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE ai_messages (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('user','assistant','system')),
  content TEXT NOT NULL,
  model TEXT DEFAULT '',
  tokens INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (conversation_id) REFERENCES ai_conversations(id)
);
```

### 3.9 Data Center (Custom Tables)
```sql
CREATE TABLE dc_tables (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  schema TEXT DEFAULT '[]',
  icon TEXT DEFAULT '',
  color TEXT DEFAULT '#4a9eff',
  sort_order INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE dc_rows (
  id TEXT PRIMARY KEY,
  table_id TEXT NOT NULL,
  data TEXT DEFAULT '{}',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (table_id) REFERENCES dc_tables(id)
);
```
Schema stored as JSON array of column definitions. Row data stored as JSON object keyed by column name.

### 3.10 Settings
```sql
CREATE TABLE settings (
  user_id TEXT PRIMARY KEY,
  theme TEXT DEFAULT 'dark',
  language TEXT DEFAULT 'en',
  sidebar_open INTEGER DEFAULT 1,
  compact_mode INTEGER DEFAULT 0,
  default_view TEXT DEFAULT 'dashboard',
  notification_enabled INTEGER DEFAULT 1,
  custom_css TEXT DEFAULT '',
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### 3.11 Migrations
```sql
CREATE TABLE _migrations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  applied_at TEXT DEFAULT (datetime('now'))
);
```

## 4. API Contract

### 4.1 Authentication

| Method | Path | Auth | Status | Description |
|---|---|---|---|---|
| POST | `/api/auth/login` | No | 200 / 400 / 401 | Login with `{username, pin}` → `{token, user}` |
| GET | `/api/auth/me` | Yes | 200 / 401 | Current user profile |
| PUT | `/api/auth/pin` | Yes | 200 / 400 | Change PIN `{currentPin, newPin}` |

**Auth guard**: Routes requiring auth return `401` with `{error}` if token missing/invalid.

### 4.2 Notes

| Method | Path | Auth | Status | Description |
|---|---|---|---|---|
| GET | `/api/notes` | Yes | 200 | List all notes (newest first) |
| GET | `/api/notes/:id` | Yes | 200 / 404 | Get single note |
| POST | `/api/notes` | Yes | 201 / 400 | Create note `{title, content?, tags?}` |
| PUT | `/api/notes/:id` | Yes | 200 / 404 | Update note fields |
| DELETE | `/api/notes/:id` | Yes | 200 / 404 | Delete note |

### 4.3 Events

| Method | Path | Auth | Status | Description |
|---|---|---|---|---|
| GET | `/api/events` | Yes | 200 | List events (supports `?month=YYYY-MM`) |
| GET | `/api/events/:id` | Yes | 200 / 404 | Get event |
| POST | `/api/events` | Yes | 201 / 400 | Create event `{title, date}` |
| PUT | `/api/events/:id` | Yes | 200 / 404 | Update event |
| DELETE | `/api/events/:id` | Yes | 200 / 404 | Delete event |

### 4.4 Learning

| Method | Path | Auth | Status | Description |
|---|---|---|---|---|
| GET | `/api/learning` | Yes | 200 | List learning items |
| POST | `/api/learning` | Yes | 201 / 400 | Create `{topic, date}` |
| PUT | `/api/learning/:id` | Yes | 200 / 404 | Update (toggle mastered, etc.) |
| DELETE | `/api/learning/:id` | Yes | 200 / 404 | Delete |

### 4.5 Bookmarks

| Method | Path | Auth | Status | Description |
|---|---|---|---|---|
| GET | `/api/bookmarks` | Yes | 200 | List bookmarks |
| POST | `/api/bookmarks` | Yes | 201 / 400 | Create `{title, url, category?}` |
| DELETE | `/api/bookmarks/:id` | Yes | 200 / 404 | Delete |

### 4.6 Prompts

| Method | Path | Auth | Status | Description |
|---|---|---|---|---|
| GET | `/api/prompts` | Yes | 200 | List prompts |
| POST | `/api/prompts` | Yes | 201 / 400 | Create `{title, content}` |
| PUT | `/api/prompts/:id` | Yes | 200 / 404 | Update |
| DELETE | `/api/prompts/:id` | Yes | 200 / 404 | Delete |

### 4.7 Data Center

| Method | Path | Auth | Status | Description |
|---|---|---|---|---|
| GET | `/api/dc/tables` | Yes | 200 | List custom tables |
| POST | `/api/dc/tables` | Yes | 201 / 400 | Create table `{name, schema}` |
| GET | `/api/dc/tables/:id` | Yes | 200 / 404 | Get table + rows |
| DELETE | `/api/dc/tables/:id` | Yes | 200 / 404 | Delete table + rows |
| POST | `/api/dc/tables/:id/rows` | Yes | 201 / 400 | Add row `{data}` |
| PUT | `/api/dc/tables/:tid/rows/:rid` | Yes | 200 / 404 | Update row |
| DELETE | `/api/dc/tables/:tid/rows/:rid` | Yes | 200 / 404 | Delete row |

### 4.8 AI

| Method | Path | Auth | Status | Description |
|---|---|---|---|---|
| GET | `/api/ai/status` | No | 200 | Check AI key configuration |
| POST | `/api/ai/chat` | Yes | 200 (SSE) | Stream AI chat response |
| GET | `/api/ai/conversations` | Yes | 200 | List conversations |
| POST | `/api/ai/conversations` | Yes | 201 | Create conversation |
| GET | `/api/ai/conversations/:id` | Yes | 200 / 404 | Get conversation + messages |
| PUT | `/api/ai/conversations/:id` | Yes | 200 | Update conversation |
| DELETE | `/api/ai/conversations/:id` | Yes | 200 | Delete conversation |

### 4.9 Messages

| Method | Path | Auth | Status | Description |
|---|---|---|---|---|
| GET | `/api/messages` | No | 200 | Recent messages `?room=general&limit=50` |
| POST | `/api/messages` | No | 201 / 400 | Send message `{sender, content, room?}` |

### 4.10 Settings

| Method | Path | Auth | Status | Description |
|---|---|---|---|---|
| GET | `/api/settings` | Yes | 200 | User settings |
| PUT | `/api/settings` | Yes | 200 | Update settings |

### 4.11 Tools

| Method | Path | Auth | Status | Description |
|---|---|---|---|---|
| GET | `/api/tools/list` | No | 200 | Available tools |
| POST | `/api/tools/execute` | No | 200 / 400 | Execute tool `{tool, params}` |

### 4.12 System

| Method | Path | Auth | Status | Description |
|---|---|---|---|---|
| GET | `/api/health` | No | 200 | Health check `{status, uptime, db}` |

## 5. WebSocket Protocol

Connection: `ws://localhost:3001`

Messages are JSON. Supported types:

| Client → Server | Server → Client |
|---|---|
| `{type: "chat", content: "..."}` | `{type: "message", sender, content, timestamp}` |
| `{type: "app-event", app, event, data}` | `{type: "app-event", app, event, data, sender, timestamp}` |
| `{type: "ping"}` | `{type: "pong", timestamp}` |
| — | `{type: "welcome", id}` (on connect) |
| — | `{type: "peers", count}` (on connect/disconnect) |

## 6. Security Model

- **JWT tokens**: HMAC-SHA256, 24h expiry, secret from `JWT_SECRET` env var
- **Path sandboxing**: All file operations clamped to `ALLOWED_BASE` (default: `/storage/emulated/0`)
- **Dangerous command blocking**: Shell commands matched against patterns (`rm -rf /`, `mkfs`, `dd if=`, etc.)
- **Timeouts**: Shell exec 30s, code exec 10s, web fetch 10-15s
- **CORS**: Full `Access-Control-Allow-Origin: *` (local-network app)

## 7. Deployment

Target: Termux on Android (ARM64)

```bash
# Install
cd ~/Desktop/empire
npm install

# Run
node server.js

# Environment variables
PORT=3001               # Default: 3001
JWT_SECRET=...          # Default: 'empire-local-secret-change-in-production'
EMPIRE_ROOT=/storage/emulated/0  # File sandbox root
OPENROUTER_API_KEY=...  # AI chat proxy (optional)
```

Database persists at `data/empire.db`. Static frontend served from `dist/`.

## 8. Test Results

54/54 endpoints verified with correct HTTP status codes:

- Auth: login (200), bad-pin (401), missing-fields (400), me (200)
- Notes: CRUD (201/200/200/200), 404 for missing
- Events: CRUD (201/200/200/200), 400 for missing title
- Learning: CRUD (201/200/200/200)
- Bookmarks: CRUD (201/200/200), 400 for missing URL
- Prompts: CRUD (201/200/200/200), 400 for missing content
- Data Center: tables + rows full CRUD (201/200/200/200)
- AI Conversations: CRUD (201/200/200/200)
- Settings: GET (200), PUT (200)
- Messages: GET (200), POST (201), 400 for missing content
- Tools: list (200), AI status (200)
- Auth guard: unauth GET/POST → 401
