/**
 * Habits API — CRUD for the Habits tracker app
 * 
 * GET    /api/habits              — list habits
 * POST   /api/habits              — create habit
 * GET    /api/habits/:id          — get single habit
 * PUT    /api/habits/:id          — update habit
 * DELETE /api/habits/:id          — delete habit
 * POST   /api/habits/:id/log      — log a completion
 * GET    /api/habits/:id/log      — get completion log
 * DELETE /api/habits/:id/log/:date — remove a completion
 * GET    /api/habits/stats         — aggregated stats
 */

import { Router } from 'express';
import { getDb } from '../database/connection.js';

const router = Router();

// List habits with optional filters
router.get('/', (req, res) => {
  const db = getDb();
  const { active, frequency, sort = 'order_asc' } = req.query;
  
  let query = 'SELECT * FROM habits WHERE 1=1';
  const params = [];
  
  if (active !== undefined) {
    query += ' AND active = ?';
    params.push(active === 'true' ? 1 : 0);
  }
  if (frequency) {
    query += ' AND frequency = ?';
    params.push(frequency);
  }
  
  const sortMap = {
    order_asc: 'sort_order ASC',
    created_desc: 'created_at DESC',
    streak_desc: 'current_streak DESC'
  };
  query += ` ORDER BY ${sortMap[sort] || 'sort_order ASC'}`;
  
  const habits = db.prepare(query).all(...params);
  res.json(habits);
});

// Aggregated stats
router.get('/stats/overview', (req, res) => {
  const db = getDb();
  const { from, to } = req.query;
  
  const today = new Date().toISOString().slice(0, 10);
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
  
  const totalHabits = db.prepare('SELECT COUNT(*) as count FROM habits WHERE active = 1').get().count;
  
  // This week's completions
  let logQuery = 'SELECT date, COUNT(DISTINCT habit_id) as completed FROM habit_logs WHERE date >= ?';
  const logParams = [weekAgo];
  if (to) { logQuery += ' AND date <= ?'; logParams.push(to); }
  logQuery += ' GROUP BY date ORDER BY date DESC';
  
  const dailyCompletions = db.prepare(logQuery).all(...logParams);
  
  // Best streaks
  const bestStreaks = db.prepare('SELECT id, title, best_streak, current_streak FROM habits ORDER BY best_streak DESC LIMIT 10').all();
  
  res.json({
    total_habits: totalHabits,
    daily_completions: dailyCompletions,
    best_streaks: bestStreaks
  });
});

// Get single habit
router.get('/:id', (req, res) => {
  const db = getDb();
  const habit = db.prepare('SELECT * FROM habits WHERE id = ?').get(req.params.id);
  
  if (!habit) return res.status(404).json({ error: 'Habit not found' });
  res.json(habit);
});

// Create habit
router.post('/', (req, res) => {
  const db = getDb();
  const { title, description, frequency, color, icon, target, sort_order } = req.body;
  
  if (!title) {
    return res.status(400).json({ error: 'Title is required' });
  }
  
  const now = new Date().toISOString();
  const id = `habit_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  
  let order = sort_order;
  if (order === undefined) {
    const max = db.prepare('SELECT MAX(sort_order) as max FROM habits').get();
    order = (max?.max ?? -1) + 1;
  }
  
  db.prepare(`
    INSERT INTO habits (id, title, description, frequency, color, icon, target, sort_order, active, current_streak, best_streak, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, 0, 0, ?, ?)
  `).run(
    id, title, description || null,
    frequency || 'daily', color || null, icon || null,
    target || 1, order, now, now
  );
  
  const habit = db.prepare('SELECT * FROM habits WHERE id = ?').get(id);
  res.status(201).json(habit);
});

// Update habit
router.put('/:id', (req, res) => {
  const db = getDb();
  const existing = db.prepare('SELECT * FROM habits WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Habit not found' });
  
  const { title, description, frequency, color, icon, target, sort_order, active } = req.body;
  const now = new Date().toISOString();
  
  db.prepare(`
    UPDATE habits SET
      title = ?, description = ?, frequency = ?, color = ?,
      icon = ?, target = ?, sort_order = ?, active = ?, updated_at = ?
    WHERE id = ?
  `).run(
    title ?? existing.title,
    description ?? existing.description,
    frequency ?? existing.frequency,
    color ?? existing.color,
    icon ?? existing.icon,
    target ?? existing.target,
    sort_order ?? existing.sort_order,
    active !== undefined ? (active ? 1 : 0) : existing.active,
    now,
    req.params.id
  );
  
  const updated = db.prepare('SELECT * FROM habits WHERE id = ?').get(req.params.id);
  res.json(updated);
});

// Log a completion for a habit
router.post('/:id/log', (req, res) => {
  const db = getDb();
  const habit = db.prepare('SELECT * FROM habits WHERE id = ?').get(req.params.id);
  if (!habit) return res.status(404).json({ error: 'Habit not found' });
  
  const { date, note } = req.body;
  const logDate = date || new Date().toISOString().slice(0, 10);
  const logId = `hlog_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const now = new Date().toISOString();
  
  // Check for duplicate
  const existing = db.prepare('SELECT id FROM habit_logs WHERE habit_id = ? AND date = ?').get(req.params.id, logDate);
  if (existing) {
    return res.status(409).json({ error: 'Already logged for this date', log_id: existing.id });
  }
  
  db.prepare(`
    INSERT INTO habit_logs (id, habit_id, date, note, created_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(logId, req.params.id, logDate, note || null, now);
  
  // Recalculate streaks
  _recalcStreaks(db, req.params.id);
  
  const log = db.prepare('SELECT * FROM habit_logs WHERE id = ?').get(logId);
  res.status(201).json(log);
});

// Get completion log for a habit
router.get('/:id/log', (req, res) => {
  const db = getDb();
  const { from, to, limit = 100 } = req.query;
  
  let query = 'SELECT * FROM habit_logs WHERE habit_id = ?';
  const params = [req.params.id];
  
  if (from) { query += ' AND date >= ?'; params.push(from); }
  if (to) { query += ' AND date <= ?'; params.push(to); }
  
  query += ' ORDER BY date DESC LIMIT ?';
  params.push(Number(limit));
  
  const logs = db.prepare(query).all(...params);
  res.json(logs);
});

// Remove a completion
router.delete('/:id/log/:date', (req, res) => {
  const db = getDb();
  const result = db.prepare('DELETE FROM habit_logs WHERE habit_id = ? AND date = ?')
    .run(req.params.id, req.params.date);
  
  if (result.changes === 0) return res.status(404).json({ error: 'Log entry not found' });
  
  _recalcStreaks(db, req.params.id);
  res.status(204).end();
});

// Delete habit (and its logs)
router.delete('/:id', (req, res) => {
  const db = getDb();
  db.transaction(() => {
    db.prepare('DELETE FROM habit_logs WHERE habit_id = ?').run(req.params.id);
    const result = db.prepare('DELETE FROM habits WHERE id = ?').run(req.params.id);
    if (result.changes === 0) throw new Error('not_found');
  })();
  
  res.status(204).end();
});

/**
 * Recalculate current_streak and best_streak for a habit.
 * Streak = consecutive days with a log entry ending at today.
 */
function _recalcStreaks(db, habitId) {
  const logs = db.prepare(
    "SELECT DISTINCT date FROM habit_logs WHERE habit_id = ? ORDER BY date DESC"
  ).all(habitId);
  
  if (logs.length === 0) {
    db.prepare('UPDATE habits SET current_streak = 0, best_streak = 0 WHERE id = ?').run(habitId);
    return;
  }
  
  let currentStreak = 0;
  let bestStreak = 0;
  let tempStreak = 1;
  const today = new Date().toISOString().slice(0, 10);
  
  // Check if today or yesterday is the most recent log
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const mostRecent = logs[0].date;
  
  if (mostRecent === today || mostRecent === yesterday) {
    currentStreak = 1;
    for (let i = 1; i < logs.length; i++) {
      const prev = new Date(logs[i - 1].date);
      const curr = new Date(logs[i].date);
      const diff = Math.round((prev - curr) / 86400000);
      if (diff === 1) {
        currentStreak++;
      } else {
        break;
      }
    }
  }
  
  // Calculate best streak across all history
  tempStreak = 1;
  const sortedLogs = [...logs].sort((a, b) => a.date.localeCompare(b.date));
  for (let i = 1; i < sortedLogs.length; i++) {
    const prev = new Date(sortedLogs[i - 1].date);
    const curr = new Date(sortedLogs[i].date);
    const diff = Math.round((curr - prev) / 86400000);
    if (diff === 1) {
      tempStreak++;
    } else {
      bestStreak = Math.max(bestStreak, tempStreak);
      tempStreak = 1;
    }
  }
  bestStreak = Math.max(bestStreak, tempStreak, currentStreak);
  
  const now = new Date().toISOString();
  db.prepare('UPDATE habits SET current_streak = ?, best_streak = ?, updated_at = ? WHERE id = ?')
    .run(currentStreak, bestStreak, now, habitId);
}

export default router;
