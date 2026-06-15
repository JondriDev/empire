/**
 * Notes API — CRUD for the Notes app
 * 
 * GET    /api/notes            — list notes (with filters)
 * POST   /api/notes            — create note
 * GET    /api/notes/:id        — get single note
 * PUT    /api/notes/:id        — update note
 * DELETE /api/notes/:id        — delete note
 * POST   /api/notes/:id/pin   — toggle pin
 */

import { Router } from 'express';
import { getDb } from '../database/connection.js';

const router = Router();

// List notes with optional filters
router.get('/', (req, res) => {
  const db = getDb();
  const { folder, search, pinned, sort = 'updated_desc' } = req.query;
  
  let query = 'SELECT * FROM notes WHERE 1=1';
  const params = [];
  
  if (folder) {
    query += ' AND folder = ?';
    params.push(folder);
  }
  if (pinned !== undefined) {
    query += ' AND pinned = ?';
    params.push(pinned === 'true' ? 1 : 0);
  }
  if (search) {
    query += ' AND (title LIKE ? OR content LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }
  
  const sortMap = {
    updated_desc: 'updated_at DESC',
    updated_asc: 'updated_at ASC',
    created_desc: 'created_at DESC',
    created_asc: 'created_at ASC',
    title_asc: 'title COLLATE NOCASE ASC',
    title_desc: 'title COLLATE NOCASE DESC',
    pinned_first: 'pinned DESC, updated_at DESC'
  };
  query += ` ORDER BY ${sortMap[sort] || 'pinned DESC, updated_at DESC'}`;
  
  const notes = db.prepare(query).all(...params);
  res.json(notes);
});

// Get single note
router.get('/:id', (req, res) => {
  const db = getDb();
  const note = db.prepare('SELECT * FROM notes WHERE id = ?').get(req.params.id);
  
  if (!note) return res.status(404).json({ error: 'Note not found' });
  res.json(note);
});

// Create note
router.post('/', (req, res) => {
  const db = getDb();
  const { title, content, folder, color, pinned, tags } = req.body;
  
  if (!title) {
    return res.status(400).json({ error: 'Title is required' });
  }
  
  const now = new Date().toISOString();
  const id = `note_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  
  db.prepare(`
    INSERT INTO notes (id, title, content, folder, color, pinned, tags, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id, title, content || '', folder || 'General',
    color || null, pinned ? 1 : 0,
    tags ? JSON.stringify(tags) : null,
    now, now
  );
  
  const note = db.prepare('SELECT * FROM notes WHERE id = ?').get(id);
  res.status(201).json(note);
});

// Update note
router.put('/:id', (req, res) => {
  const db = getDb();
  const existing = db.prepare('SELECT * FROM notes WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Note not found' });
  
  const { title, content, folder, color, pinned, tags } = req.body;
  const now = new Date().toISOString();
  
  db.prepare(`
    UPDATE notes SET
      title = ?, content = ?, folder = ?, color = ?,
      pinned = ?, tags = ?, updated_at = ?
    WHERE id = ?
  `).run(
    title ?? existing.title,
    content !== undefined ? content : existing.content,
    folder ?? existing.folder,
    color ?? existing.color,
    pinned !== undefined ? (pinned ? 1 : 0) : existing.pinned,
    tags ? JSON.stringify(tags) : existing.tags,
    now,
    req.params.id
  );
  
  const updated = db.prepare('SELECT * FROM notes WHERE id = ?').get(req.params.id);
  res.json(updated);
});

// Toggle pin
router.post('/:id/pin', (req, res) => {
  const db = getDb();
  const existing = db.prepare('SELECT * FROM notes WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Note not found' });
  
  const newPinned = existing.pinned ? 0 : 1;
  const now = new Date().toISOString();
  
  db.prepare('UPDATE notes SET pinned = ?, updated_at = ? WHERE id = ?')
    .run(newPinned, now, req.params.id);
  
  res.json({ id: req.params.id, pinned: newPinned });
});

// Delete note
router.delete('/:id', (req, res) => {
  const db = getDb();
  const result = db.prepare('DELETE FROM notes WHERE id = ?').run(req.params.id);
  
  if (result.changes === 0) return res.status(404).json({ error: 'Note not found' });
  res.status(204).end();
});

export default router;
