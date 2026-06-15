/**
 * Calendar API — CRUD for the Calendar app
 * 
 * GET    /api/calendar           — list events (with date range filter)
 * POST   /api/calendar           — create event
 * GET    /api/calendar/:id       — get single event
 * PUT    /api/calendar/:id       — update event
 * DELETE /api/calendar/:id       — delete event
 */

import { Router } from 'express';
import { getDb } from '../database/connection.js';

const router = Router();

// List events with optional date range filter
router.get('/', (req, res) => {
  const db = getDb();
  const { from, to, category, search } = req.query;
  
  let query = 'SELECT * FROM events WHERE 1=1';
  const params = [];
  
  if (from) {
    query += ' AND date >= ?';
    params.push(from);
  }
  if (to) {
    query += ' AND date <= ?';
    params.push(to);
  }
  if (category) {
    query += ' AND category = ?';
    params.push(category);
  }
  if (search) {
    query += ' AND (title LIKE ? OR description LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }
  
  query += ' ORDER BY date ASC, time ASC';
  
  const events = db.prepare(query).all(...params);
  res.json(events);
});

// Get single event
router.get('/:id', (req, res) => {
  const db = getDb();
  const event = db.prepare('SELECT * FROM events WHERE id = ?').get(req.params.id);
  
  if (!event) return res.status(404).json({ error: 'Event not found' });
  res.json(event);
});

// Create event
router.post('/', (req, res) => {
  const db = getDb();
  const { title, date, time, description, category, color, recurrence } = req.body;
  
  if (!title || !date) {
    return res.status(400).json({ error: 'Title and date are required' });
  }
  
  const now = new Date().toISOString();
  const id = `evt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  
  db.prepare(`
    INSERT INTO events (id, title, date, time, description, category, color, recurrence, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, title, date, time || null, description || null, category || 'general', color || null, recurrence || null, now, now);
  
  const event = db.prepare('SELECT * FROM events WHERE id = ?').get(id);
  res.status(201).json(event);
});

// Update event
router.put('/:id', (req, res) => {
  const db = getDb();
  const existing = db.prepare('SELECT * FROM events WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Event not found' });
  
  const { title, date, time, description, category, color, recurrence } = req.body;
  const now = new Date().toISOString();
  
  db.prepare(`
    UPDATE events SET
      title = ?, date = ?, time = ?, description = ?,
      category = ?, color = ?, recurrence = ?, updated_at = ?
    WHERE id = ?
  `).run(
    title ?? existing.title,
    date ?? existing.date,
    time ?? existing.time,
    description ?? existing.description,
    category ?? existing.category,
    color ?? existing.color,
    recurrence ?? existing.recurrence,
    now,
    req.params.id
  );
  
  const updated = db.prepare('SELECT * FROM events WHERE id = ?').get(req.params.id);
  res.json(updated);
});

// Delete event
router.delete('/:id', (req, res) => {
  const db = getDb();
  const result = db.prepare('DELETE FROM events WHERE id = ?').run(req.params.id);
  
  if (result.changes === 0) return res.status(404).json({ error: 'Event not found' });
  res.status(204).end();
});

export default router;
