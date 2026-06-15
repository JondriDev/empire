/**
 * Empire Database Layer
 * 
 * Uses sql.js (WASM-based SQLite) as primary driver for Termux/ARM compatibility.
 * better-sqlite3 is attempted as a fast native fallback but is optional.
 * 
 * Database file: ~/Desktop/empire/data/empire.db
 */

import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
import os from 'os';

// Resolve database path
const EMPIRE_ROOT = path.resolve(os.homedir(), 'Desktop', 'empire');
const DATA_DIR = path.join(EMPIRE_ROOT, 'data');
const DB_PATH = path.join(DATA_DIR, 'empire.db');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

let db = null;
let driverType = 'none';

/**
 * Initialize database with sql.js (WASM) — works everywhere including Termux/ARM
 */
async function initSqlJs() {
  const initModule = await import('sql.js');
  const SQL = initModule.default || initModule;
  
  // sql.js needs the WASM binary — use default CDN location
  const sqlJs = await SQL();
  
  let buffer = null;
  if (fs.existsSync(DB_PATH)) {
    buffer = fs.readFileSync(DB_PATH);
  }
  
  const database = buffer
    ? new sqlJs.Database(buffer)
    : new sqlJs.Database();
  
  driverType = 'sql.js';
  return database;
}

/**
 * Try better-sqlite3 native driver — faster but may not compile on Termux
 */
function initBetterSqlite3() {
  try {
    const Database = require('better-sqlite3');
    const database = new Database(DB_PATH);
    database.pragma('journal_mode = WAL');
    database.pragma('foreign_keys = ON');
    driverType = 'better-sqlite3';
    return database;
  } catch (err) {
    console.warn('[db] better-sqlite3 unavailable, falling back to sql.js:', err.message);
    return null;
  }
}

/**
 * Save sql.js database to disk (not needed for better-sqlite3 — auto-persists)
 */
function saveToDisk() {
  if (driverType === 'sql.js' && db) {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_PATH, buffer);
  }
}

// Auto-save interval for sql.js (every 30 seconds when dirty)
let saveInterval = null;
let dirty = false;

function markDirty() {
  dirty = true;
}

function startAutoSave() {
  if (driverType === 'sql.js' && !saveInterval) {
    saveInterval = setInterval(() => {
      if (dirty) {
        saveToDisk();
        dirty = false;
      }
    }, 30000);
    
    // Graceful shutdown
    const shutdown = () => {
      if (dirty) saveToDisk();
      if (saveInterval) clearInterval(saveInterval);
      process.exit(0);
    };
    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  }
}

/**
 * Run a SQL statement (INSERT, UPDATE, DELETE, DDL)
 */
export function run(sql, params = []) {
  if (!db) throw new Error('Database not initialized. Call initDb() first.');
  
  if (driverType === 'better-sqlite3') {
    const stmt = db.prepare(sql);
    const info = stmt.run(...params);
    return { lastInsertRowid: info.lastInsertRowid, changes: info.changes };
  }
  
  // sql.js
  db.run(sql, params);
  markDirty();
  const lastInsertRowid = db.exec('SELECT last_insert_rowid() as id');
  const id = lastInsertRowid.length > 0 ? lastInsertRowid[0].values[0][0] : null;
  return { lastInsertRowid: id, changes: db.getRowsModified() };
}

/**
 * Get a single row
 */
export function get(sql, params = []) {
  if (!db) throw new Error('Database not initialized. Call initDb() first.');
  
  if (driverType === 'better-sqlite3') {
    const stmt = db.prepare(sql);
    return stmt.get(...params) || null;
  }
  
  // sql.js — returns {columns, values} or []
  const result = db.exec(sql, params);
  if (!result.length || !result[0].values.length) return null;
  
  const columns = result[0].columns;
  const values = result[0].values[0];
  const row = {};
  columns.forEach((col, i) => { row[col] = values[i]; });
  return row;
}

/**
 * Get all rows
 */
export function all(sql, params = []) {
  if (!db) throw new Error('Database not initialized. Call initDb() first.');
  
  if (driverType === 'better-sqlite3') {
    const stmt = db.prepare(sql);
    return stmt.all(...params);
  }
  
  // sql.js
  const result = db.exec(sql, params);
  if (!result.length) return [];
  
  const columns = result[0].columns;
  return result[0].values.map(row => {
    const obj = {};
    columns.forEach((col, i) => { obj[col] = row[i]; });
    return obj;
  });
}

/**
 * Initialize the database connection and run migrations
 */
export async function initDb() {
  if (db) return db;
  
  // Try native driver first, fall back to WASM
  const nativeDb = initBetterSqlite3();
  if (nativeDb) {
    db = nativeDb;
    console.log(`[db] Connected using better-sqlite3 → ${DB_PATH}`);
  } else {
    db = await initSqlJs();
    startAutoSave();
    console.log(`[db] Connected using sql.js (WASM) → ${DB_PATH}`);
  }
  
  // Run migrations
  const { runMigrations } = await import('./migrations.js');
  await runMigrations(db, driverType);
  
  return db;
}

/**
 * Close the database connection
 */
export function closeDb() {
  if (dirty) saveToDisk();
  if (saveInterval) clearInterval(saveInterval);
  if (db) {
    db.close();
    db = null;
  }
}

export { DB_PATH, DATA_DIR, driverType };
