/**
 * Todos API — CRUD for the Todos app
 * 
 * GET    /api/todos            — list todos (with filters)
 * POST   /api/todos            — create todo
 * GET    /api/todos/:id        — get single todo
 * PUT    /api/todos/:id        — update todo
 * DELETE /api/todos/:id        — delete todo
 * PATCH  /api/todos/:id/toggle — toggle completed
 * PATCH  /api/todos/reorder    — bulk reorder
 */

import { Router } from 'express';
import { getDb } from '../database/connection.js';

const router = Router();

// List todos with optional filters
router.get('/', (req, res) => {
  const db = getDb();
  const { list, completed, priority, search, sort = 'order_asc' } = req.query;
  
  let query = 'SELECT * FROM todos WHERE 1=1';
  const params = [];
  
  if (list) {
    query += ' AND list = ?';
    params.push(list);
  }
  if (completed !== undefined) {
    query += ' AND completed = ?';
    params.push(completed === 'true' ? 1 : 0);
  }
  if (priority) {
    query += ' AND priority = ?';
    params.push(priority);
  }
  if (search) {
    query += ' AND (title LIKE ? OR notes LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }
  
  const sortMap = {
    order_asc: 'sort_order ASC',
    order_desc: 'sort_order DESC',
    priority_desc: "CASE priority WHEN 'high' THEN 3 WHEN 'medium' THEN 2 WHEN 'low' THEN 1 ELSE 0 END DESC",
    priority_asc: "CASE priority WHEN 'high' THEN 3 WHEN 'medium' THEN 2 WHEN 'low' THEN 1 ELSE 0 END ASC",
    due_asc: 'due_date ASC',
    created_desc: 'created_at DESC'
  };
  query += ` ORDER BY completed ASC, ${sortMap[sort] || 'sort_order ASC'}`;
  
  const todos = db.prepare(query).all(...params);
  res.json(todos);
});

// Get single todo
router.get('/:id', (req, res) => {
  const db = getDb();
  const todo = db.prepare('SELECT * FROM todos WHERE id = ?').get(req.params.id);
  
  if (!todo) return res.status(404).json({ error: 'Todo not found' });
  res.json(todo);
});

// Create todo
router.post('/', (req, res) => {
  const db = getDb();
  const { title, notes, list, priority, due_date, sort_order } = req.body;
  
  if (!title) {
    return res.status(400).json({ error: 'Title is required' });
  }
  
  const now = new Date().toISOString();
  const id = `todo_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  
  // Auto sort_order: put at end of list
  let order = sort_order;
  if (order === undefined) {
    const max = db.prepare('SELECT MAX(sort_order) as max FROM todos WHERE list = ?').get(list || 'default');
    order = (max?.max ?? -1) + 1;
  }
  
  db.prepare(`
    INSERT INTO todos (id, title, notes, list, priority, due_date, completed, sort_order, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?, ?)
  `).run(id, title, notes || null, list || 'default', priority || 'medium', due_date || null, order, now, now);
  
  const todo = db.prepare('SELECT * FROM todos WHERE id = ?').get(id);
  res.status(201).json(todo);
});

// Update todo
router.put('/:id', (req, res) => {
  const db = getDb();
  const existing = db.prepare('SELECT * FROM todos WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Todo not found' });
  
  const { title, notes, list, priority, due_date, completed, sort_order } = req.body;
  const now = new Date().toISOString();
  
  db.prepare(`
    UPDATE todos SET
      title = ?, notes = ?, list = ?, priority = ?,
      due_date = ?, completed = ?, sort_order = ?, updated_at = ?
    WHERE id = ?
  `).run(
    title ?? existing.title,
    notes ?? existing.notes,
    list ?? existing.list,
    priority ?? existing.priority,
    due_date ?? existing.due_date,
    completed !== undefined ? (completed ? 1 : 0) : existing.completed,
    sort_order ?? existing.sort_order,
    now,
    req.params.id
  );
  
  const updated = db.prepare('SELECT * FROM todos WHERE id = ?').get(req.params.id);
  res.json(updated);
});

// Toggle completed
router.patch('/:id/toggle', (req, res) => {
  const db = getDb();
  const existing = db.prepare('SELECT * FROM todos WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Todo not found' });
  
  const newCompleted = existing.completed ? 0 : 1;
  const now = new Date().toISOString();
  
  db.prepare('UPDATE todos SET completed = ?, updated_at = ? WHERE id = ?')
    .run(newCompleted, now, req.params.id);
  
  res.json({ id: req.params.id, completed: newCompleted });
});

// Bulk reorder
router.patch('/reorder', (req, res) => {
  const db = getDb();
  const { items } = req.body; // [{ id, sort_order }]
  
  if (!Array.isArray(items)) {
    return res.status(400).json({ error: 'items array required' });
  }
  
  const update = db.prepare('UPDATE todos SET sort_order = ?, updated_at = ? WHERE id = ?');
  const now = new Date().toISOString();
  
  db.transaction(() => {
    for (const item of items) {
      update.run(item.sort_order, now, item.id);
    }
  })();
  
  res.json({ reordered: items.length });
});

// Delete todo
router.delete('/:id', (req, res) => {
  const db = getDb();
  const result = db.prepare('DELETE FROM todos WHERE id = ?').run(req.params.id);
  
  if (result.changes === 0) return res.status(404).json({ error: 'Todo not found' });
  res.status(204).end();
});

export default router;
