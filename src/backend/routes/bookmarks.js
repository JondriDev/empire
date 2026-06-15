/**
 * Bookmarks API — CRUD for the Bookmarks app
 * 
 * GET    /api/bookmarks            — list bookmarks (with filters)
 * POST   /api/bookmarks            — create bookmark
 * GET    /api/bookmarks/:id        — get single bookmark
 * PUT    /api/bookmarks/:id        — update bookmark
 * DELETE /api/bookmarks/:id        — delete bookmark
 * PATCH  /api/bookmarks/reorder    — bulk reorder
 */

import { Router } from 'express';
import { getDb } from '../database/connection.js';

const router = Router();

// List bookmarks with optional filters
router.get('/', (req, res) => {
  const db = getDb();
  const { folder, search, sort = 'order_asc' } = req.query;
  
  let query = 'SELECT * FROM bookmarks WHERE 1=1';
  const params = [];
  
  if (folder) {
    query += ' AND folder = ?';
    params.push(folder);
  }
  if (search) {
    query += ' AND (title LIKE ? OR url LIKE ? OR description LIKE ?)';
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }
  
  const sortMap = {
    order_asc: 'sort_order ASC',
    order_desc: 'sort_order DESC',
    title_asc: 'title COLLATE NOCASE ASC',
    created_desc: 'created_at DESC',
    visited_desc: 'last_visited DESC'
  };
  query += ` ORDER BY ${sortMap[sort] || 'sort_order ASC'}`;
  
  const bookmarks = db.prepare(query).all(...params);
  res.json(bookmarks);
});

// Get single bookmark
router.get('/:id', (req, res) => {
  const db = getDb();
  const bookmark = db.prepare('SELECT * FROM bookmarks WHERE id = ?').get(req.params.id);
  
  if (!bookmark) return res.status(404).json({ error: 'Bookmark not found' });
  res.json(bookmark);
});

// Create bookmark
router.post('/', (req, res) => {
  const db = getDb();
  const { title, url, description, folder, icon, sort_order } = req.body;
  
  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }
  
  const now = new Date().toISOString();
  const id = `bm_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  
  // Auto sort_order
  let order = sort_order;
  if (order === undefined) {
    const max = db.prepare('SELECT MAX(sort_order) as max FROM bookmarks WHERE folder = ?').get(folder || 'General');
    order = (max?.max ?? -1) + 1;
  }
  
  db.prepare(`
    INSERT INTO bookmarks (id, title, url, description, folder, icon, sort_order, last_visited, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id, title || url, url, description || null,
    folder || 'General', icon || null, order,
    null, now, now
  );
  
  const bookmark = db.prepare('SELECT * FROM bookmarks WHERE id = ?').get(id);
  res.status(201).json(bookmark);
});

// Update bookmark
router.put('/:id', (req, res) => {
  const db = getDb();
  const existing = db.prepare('SELECT * FROM bookmarks WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Bookmark not found' });
  
  const { title, url, description, folder, icon, sort_order } = req.body;
  const now = new Date().toISOString();
  
  db.prepare(`
    UPDATE bookmarks SET
      title = ?, url = ?, description = ?, folder = ?,
      icon = ?, sort_order = ?, updated_at = ?
    WHERE id = ?
  `).run(
    title ?? existing.title,
    url ?? existing.url,
    description ?? existing.description,
    folder ?? existing.folder,
    icon ?? existing.icon,
    sort_order ?? existing.sort_order,
    now,
    req.params.id
  );
  
  const updated = db.prepare('SELECT * FROM bookmarks WHERE id = ?').get(req.params.id);
  res.json(updated);
});

// Record visit (increment visit_count, update last_visited)
router.patch('/:id/visit', (req, res) => {
  const db = getDb();
  const existing = db.prepare('SELECT * FROM bookmarks WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Bookmark not found' });
  
  const now = new Date().toISOString();
  db.prepare(`
    UPDATE bookmarks SET visit_count = visit_count + 1, last_visited = ?, updated_at = ?
    WHERE id = ?
  `).run(now, now, req.params.id);
  
  res.json({ id: req.params.id, last_visited: now, visit_count: (existing.visit_count || 0) + 1 });
});

// Bulk reorder
router.patch('/reorder', (req, res) => {
  const db = getDb();
  const { items } = req.body;
  
  if (!Array.isArray(items)) {
    return res.status(400).json({ error: 'items array required' });
  }
  
  const update = db.prepare('UPDATE bookmarks SET sort_order = ?, updated_at = ? WHERE id = ?');
  const now = new Date().toISOString();
  
  db.transaction(() => {
    for (const item of items) {
      update.run(item.sort_order, now, item.id);
    }
  })();
  
  res.json({ reordered: items.length });
});

// Delete bookmark
router.delete('/:id', (req, res) => {
  const db = getDb();
  const result = db.prepare('DELETE FROM bookmarks WHERE id = ?').run(req.params.id);
  
  if (result.changes === 0) return res.status(404).json({ error: 'Bookmark not found' });
  res.status(204).end();
});

export default router;
