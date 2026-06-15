/**
 * Messages API — CRUD for the Messages app
 * 
 * GET    /api/messages            — list messages (with filters)
 * POST   /api/messages            — create message
 * GET    /api/messages/:id        — get single message
 * PUT    /api/messages/:id        — update message
 * DELETE /api/messages/:id        — delete message
 * PATCH  /api/messages/:id/read   — mark as read
 * GET    /api/messages/conversations — list conversation threads
 */

import { Router } from 'express';
import { getDb } from '../database/connection.js';

const router = Router();

// List conversations (unique senders/threads)
router.get('/conversations', (req, res) => {
  const db = getDb();
  const { limit = 50 } = req.query;
  
  const conversations = db.prepare(`
    SELECT sender, COUNT(*) as total,
           SUM(CASE WHEN read = 0 THEN 1 ELSE 0 END) as unread_count,
           MAX(timestamp) as last_message_at
    FROM messages
    GROUP BY sender
    ORDER BY last_message_at DESC
    LIMIT ?
  `).all(Number(limit));
  
  res.json(conversations);
});

// List messages with optional filters
router.get('/', (req, res) => {
  const db = getDb();
  const { sender, search, read, sort = 'newest', limit = 100, offset = 0 } = req.query;
  
  let query = 'SELECT * FROM messages WHERE 1=1';
  const params = [];
  
  if (sender) {
    query += ' AND sender = ?';
    params.push(sender);
  }
  if (search) {
    query += ' AND (content LIKE ? OR sender LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }
  if (read !== undefined) {
    query += ' AND read = ?';
    params.push(read === 'true' ? 1 : 0);
  }
  
  const sortMap = {
    newest: 'timestamp DESC',
    oldest: 'timestamp ASC'
  };
  query += ` ORDER BY ${sortMap[sort] || 'timestamp DESC'}`;
  query += ' LIMIT ? OFFSET ?';
  params.push(Number(limit), Number(offset));
  
  const messages = db.prepare(query).all(...params);
  
  // Get total count for pagination
  let countQuery = 'SELECT COUNT(*) as total FROM messages WHERE 1=1';
  const countParams = [];
  if (sender) { countQuery += ' AND sender = ?'; countParams.push(sender); }
  if (search) { countQuery += ' AND (content LIKE ? OR sender LIKE ?)'; countParams.push(`%${search}%`, `%${search}%`); }
  if (read !== undefined) { countQuery += ' AND read = ?'; countParams.push(read === 'true' ? 1 : 0); }
  
  const total = db.prepare(countQuery).get(...countParams).total;
  
  res.json({ messages, total, limit: Number(limit), offset: Number(offset) });
});

// Get single message
router.get('/:id', (req, res) => {
  const db = getDb();
  const message = db.prepare('SELECT * FROM messages WHERE id = ?').get(req.params.id);
  
  if (!message) return res.status(404).json({ error: 'Message not found' });
  res.json(message);
});

// Create message
router.post('/', (req, res) => {
  const db = getDb();
  const { sender, content, timestamp } = req.body;
  
  if (!content) {
    return res.status(400).json({ error: 'Content is required' });
  }
  
  const now = new Date().toISOString();
  const id = `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  
  db.prepare(`
    INSERT INTO messages (id, sender, content, timestamp, read, created_at, updated_at)
    VALUES (?, ?, ?, ?, 0, ?, ?)
  `).run(
    id, sender || 'unknown', content,
    timestamp || now, now, now
  );
  
  const message = db.prepare('SELECT * FROM messages WHERE id = ?').get(id);
  res.status(201).json(message);
});

// Update message
router.put('/:id', (req, res) => {
  const db = getDb();
  const existing = db.prepare('SELECT * FROM messages WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Message not found' });
  
  const { sender, content } = req.body;
  const now = new Date().toISOString();
  
  db.prepare(`
    UPDATE messages SET sender = ?, content = ?, updated_at = ?
    WHERE id = ?
  `).run(
    sender ?? existing.sender,
    content ?? existing.content,
    now,
    req.params.id
  );
  
  const updated = db.prepare('SELECT * FROM messages WHERE id = ?').get(req.params.id);
  res.json(updated);
});

// Mark as read
router.patch('/:id/read', (req, res) => {
  const db = getDb();
  const existing = db.prepare('SELECT * FROM messages WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Message not found' });
  
  const now = new Date().toISOString();
  const readVal = req.body.read !== undefined ? (req.body.read ? 1 : 0) : 1;
  
  db.prepare('UPDATE messages SET read = ?, updated_at = ? WHERE id = ?')
    .run(readVal, now, req.params.id);
  
  res.json({ id: req.params.id, read: readVal });
});

// Mark all as read for a sender
router.patch('/read-all', (req, res) => {
  const db = getDb();
  const { sender } = req.body;
  
  if (!sender) {
    return res.status(400).json({ error: 'Sender is required' });
  }
  
  const result = db.prepare('UPDATE messages SET read = 1, updated_at = ? WHERE sender = ? AND read = 0')
    .run(new Date().toISOString(), sender);
  
  res.json({ marked_read: result.changes });
});

// Delete message
router.delete('/:id', (req, res) => {
  const db = getDb();
  const result = db.prepare('DELETE FROM messages WHERE id = ?').run(req.params.id);
  
  if (result.changes === 0) return res.status(404).json({ error: 'Message not found' });
  res.status(204).end();
});

export default router;
