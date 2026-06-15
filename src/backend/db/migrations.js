/**
 * Empire Database Migrations
 * 
 * Schema covers all 21 apps' data domains:
 * - users (PIN auth)
 * - notes, events, messages, learning (from existing Zustand store)
 * - bookmarks, saved_places, prompts, phrases (additional app domains)
 * - dc_tables, dc_rows (Data Center — user-defined tables)
 * - health_records (fitness/nutrition tracking)
 * - settings (per-app + global settings)
 * - migrations (migration tracking)
 */

const MIGRATIONS = [
  {
    version: 1,
    name: 'initial_schema',
    up: `
      -- Users table (single local user, PIN-based auth)
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        pin_hash TEXT NOT NULL,
        salt TEXT NOT NULL,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      );

      -- Notes
      CREATE TABLE IF NOT EXISTS notes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL DEFAULT '',
        content TEXT NOT NULL DEFAULT '',
        tags TEXT DEFAULT '[]',
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      );

      -- Calendar events
      CREATE TABLE IF NOT EXISTS events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        date TEXT NOT NULL,
        time TEXT,
        description TEXT DEFAULT '',
        recurring TEXT DEFAULT NULL,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      );

      -- Messages
      CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sender TEXT NOT NULL DEFAULT 'user',
        content TEXT NOT NULL,
        timestamp TEXT DEFAULT (datetime('now')),
        read INTEGER DEFAULT 0
      );

      -- Learning items (spaced repetition)
      CREATE TABLE IF NOT EXISTS learning (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        topic TEXT NOT NULL,
        learned TEXT NOT NULL,
        date TEXT DEFAULT (datetime('now')),
        next_review TEXT,
        mastered INTEGER DEFAULT 0,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      );

      -- Bookmarks
      CREATE TABLE IF NOT EXISTS bookmarks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        url TEXT NOT NULL,
        title TEXT NOT NULL DEFAULT '',
        description TEXT DEFAULT '',
        category TEXT DEFAULT 'uncategorized',
        favicon TEXT DEFAULT NULL,
        created_at TEXT DEFAULT (datetime('now'))
      );

      -- Saved places (maps)
      CREATE TABLE IF NOT EXISTS saved_places (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        address TEXT DEFAULT '',
        lat REAL NOT NULL,
        lng REAL NOT NULL,
        category TEXT DEFAULT 'general',
        notes TEXT DEFAULT '',
        created_at TEXT DEFAULT (datetime('now'))
      );

      -- Prompts (prompt generator)
      CREATE TABLE IF NOT EXISTS prompts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL DEFAULT '',
        template TEXT NOT NULL,
        category TEXT DEFAULT 'general',
        variables TEXT DEFAULT '[]',
        is_favorite INTEGER DEFAULT 0,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      );

      -- Phrases (language learning / grammar)
      CREATE TABLE IF NOT EXISTS phrases (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        original TEXT NOT NULL,
        translation TEXT NOT NULL DEFAULT '',
        language TEXT DEFAULT 'en',
        context TEXT DEFAULT '',
        mastered INTEGER DEFAULT 0,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      );

      -- Data Center: user-defined tables
      CREATE TABLE IF NOT EXISTS dc_tables (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT DEFAULT '',
        columns TEXT NOT NULL DEFAULT '[]',
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      );

      -- Data Center: rows for user-defined tables
      CREATE TABLE IF NOT EXISTS dc_rows (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        table_id INTEGER NOT NULL,
        data TEXT NOT NULL DEFAULT '{}',
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (table_id) REFERENCES dc_tables(id) ON DELETE CASCADE
      );

      -- Health/fitness records
      CREATE TABLE IF NOT EXISTS health_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT NOT NULL,
        value REAL NOT NULL,
        unit TEXT DEFAULT '',
        notes TEXT DEFAULT '',
        recorded_at TEXT DEFAULT (datetime('now')),
        created_at TEXT DEFAULT (datetime('now'))
      );

      -- Settings (per-app + global)
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL DEFAULT '{}',
        scope TEXT DEFAULT 'global',
        updated_at TEXT DEFAULT (datetime('now'))
      );

      -- Alarms/reminders
      CREATE TABLE IF NOT EXISTS alarms (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        time TEXT NOT NULL,
        label TEXT DEFAULT '',
        days TEXT DEFAULT '[]',
        enabled INTEGER DEFAULT 1,
        sound TEXT DEFAULT 'default',
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      );

      -- Migration tracking
      CREATE TABLE IF NOT EXISTS _migrations (
        version INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        applied_at TEXT DEFAULT (datetime('now'))
      );
    `
  },
  {
    version: 2,
    name: 'add_indexes',
    up: `
      CREATE INDEX IF NOT EXISTS idx_notes_updated ON notes(updated_at DESC);
      CREATE INDEX IF NOT EXISTS idx_events_date ON events(date);
      CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp DESC);
      CREATE INDEX IF NOT EXISTS idx_learning_next_review ON learning(next_review);
      CREATE INDEX IF NOT EXISTS idx_bookmarks_category ON bookmarks(category);
      CREATE INDEX IF NOT EXISTS idx_saved_places_category ON saved_places(category);
      CREATE INDEX IF NOT EXISTS idx_prompts_category ON prompts(category);
      CREATE INDEX IF NOT EXISTS idx_phrases_language ON phrases(language);
      CREATE INDEX IF NOT EXISTS idx_dc_rows_table ON dc_rows(table_id);
      CREATE INDEX IF NOT EXISTS idx_health_type_date ON health_records(type, recorded_at DESC);
      CREATE INDEX IF NOT EXISTS idx_settings_scope ON settings(scope);
      CREATE INDEX IF NOT EXISTS idx_alarms_enabled ON alarms(enabled);
    `
  }
];

/**
 * Run all pending migrations
 */
export function runMigrations(db, driverType) {
  console.log('[db] Running migrations...');
  
  for (const migration of MIGRATIONS) {
    // Check if already applied
    let alreadyApplied = false;
    
    if (driverType === 'better-sqlite3') {
      const row = db.prepare('SELECT version FROM _migrations WHERE version = ?').get(migration.version);
      alreadyApplied = !!row;
    } else {
      // sql.js
      const result = db.exec('SELECT version FROM _migrations WHERE version = ?', [migration.version]);
      alreadyApplied = result.length > 0 && result[0].values.length > 0;
    }
    
    if (alreadyApplied) {
      console.log(`[db] Migration ${migration.version} (${migration.name}) — already applied, skipping`);
      continue;
    }
    
    // Apply migration
    console.log(`[db] Applying migration ${migration.version}: ${migration.name}`);
    
    if (driverType === 'better-sqlite3') {
      db.exec(migration.up);
      db.prepare('INSERT INTO _migrations (version, name) VALUES (?, ?)').run(migration.version, migration.name);
    } else {
      // sql.js — split on semicolons and run each statement
      const statements = migration.up
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));
      
      for (const stmt of statements) {
        try {
          db.run(stmt);
        } catch (err) {
          console.error(`[db] Migration ${migration.version} statement failed:`, stmt.substring(0, 80), err.message);
          throw err;
        }
      }
      
      db.run(`INSERT INTO _migrations (version, name) VALUES (${migration.version}, '${migration.name}')`);
    }
    
    console.log(`[db] Migration ${migration.version} (${migration.name}) — applied ✓`);
  }
  
  console.log('[db] All migrations complete');
}
