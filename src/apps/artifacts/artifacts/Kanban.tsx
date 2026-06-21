/**
 * Artifact 03 — Kanban Board
 * Drag tasks across columns (To Do / Doing / Done). LocalStorage persistence.
 */
import { useState, useEffect } from 'react'
import { Plus, Trash2, X, GripVertical } from 'lucide-react'
import { mirrorCollection } from '../../../lib/core/sync'
import { NodeActions } from '../../../components/ui/NodeActions'

type ColumnId = 'todo' | 'doing' | 'done'

interface Task {
  id: string
  title: string
  column: ColumnId
  tag?: string
  tagColor?: string
  created: number
}

interface Column { id: ColumnId; title: string; accent: string }

const COLUMNS: Column[] = [
  { id: 'todo', title: 'To Do', accent: '#6366f1' },
  { id: 'doing', title: 'In Progress', accent: '#22d3ee' },
  { id: 'done', title: 'Done', accent: '#10b981' },
]

const TAG_COLORS = ['#6366f1', '#22d3ee', '#10b981', '#f59e0b', '#ec4899', '#a855f7']

const STORAGE = 'empire-artifact-kanban'

const uid = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36)

const seed = (): Task[] => [
  { id: uid(), title: 'Design dashboard layout', column: 'todo', tag: 'design', tagColor: '#ec4899', created: Date.now() },
  { id: uid(), title: 'Set up auth flow', column: 'doing', tag: 'backend', tagColor: '#22d3ee', created: Date.now() },
  { id: uid(), title: 'Write unit tests', column: 'doing', tag: 'testing', tagColor: '#f59e0b', created: Date.now() },
  { id: uid(), title: 'Ship v1 release', column: 'done', tag: 'release', tagColor: '#10b981', created: Date.now() },
]

export default function Kanban() {
  const [tasks, setTasks] = useState<Task[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE)
      if (stored) return JSON.parse(stored)
    } catch {}
    return seed()
  })
  const [dragId, setDragId] = useState<string | null>(null)
  const [dragOverCol, setDragOverCol] = useState<ColumnId | null>(null)
  const [newTaskCol, setNewTaskCol] = useState<ColumnId | null>(null)
  const [newTitle, setNewTitle] = useState('')
  const [newTag, setNewTag] = useState('')

  useEffect(() => {
    try { localStorage.setItem(STORAGE, JSON.stringify(tasks)) } catch {}
    // Mirror Kanban cards into the Core graph so they join the organism.
    mirrorCollection('kanban', 'artifacts', tasks, {
      id: t => t.id,
      title: t => t.title,
      data: t => ({ column: t.column, tag: t.tag }),
    })
  }, [tasks])

  const moveTo = (id: string, col: ColumnId) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, column: col } : t))
    setDragId(null)
    setDragOverCol(null)
  }

  const addTask = (col: ColumnId) => {
    if (!newTitle.trim()) return
    const tagColor = TAG_COLORS[Math.floor(Math.random() * TAG_COLORS.length)]
    setTasks([...tasks, { id: uid(), title: newTitle.trim(), column: col, tag: newTag.trim() || undefined, tagColor, created: Date.now() }])
    setNewTitle('')
    setNewTag('')
    setNewTaskCol(null)
  }

  const remove = (id: string) => setTasks(tasks.filter(t => t.id !== id))

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-950 via-pink-950/20 to-slate-950 text-white overflow-hidden">
      <div className="px-6 py-4 border-b border-white/10 bg-black/20 backdrop-blur flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Kanban Board</h1>
          <p className="text-xs text-slate-500 mt-0.5">{tasks.length} tasks across {COLUMNS.length} columns · auto-saved</p>
        </div>
        <button
          onClick={() => { if (confirm('Clear all tasks?')) setTasks(seed()) }}
          className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-slate-300"
        >
          Reset to demo
        </button>
      </div>

      <div className="flex-1 overflow-x-auto p-6">
        <div className="flex gap-4 h-full min-w-max">
          {COLUMNS.map(col => {
            const colTasks = tasks.filter(t => t.column === col.id).sort((a, b) => b.created - a.created)
            return (
              <div
                key={col.id}
                className={`w-80 flex flex-col rounded-2xl border ${dragOverCol === col.id ? 'border-white/30 bg-white/10' : 'border-white/10 bg-white/5'} backdrop-blur transition`}
                onDragOver={e => e.preventDefault()}
                onDragEnter={() => setDragOverCol(col.id)}
                onDragLeave={() => setDragOverCol(null)}
                onDrop={() => { if (dragId) moveTo(dragId, col.id) }}
              >
                <div className="p-3 border-b border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ background: col.accent }} />
                    <h2 className="font-semibold">{col.title}</h2>
                    <span className="text-xs text-slate-500 bg-white/5 px-1.5 py-0.5 rounded-full">{colTasks.length}</span>
                  </div>
                  <button onClick={() => setNewTaskCol(col.id)} className="text-slate-400 hover:text-white"><Plus size={14} /></button>
                </div>

                <div className="flex-1 overflow-y-auto p-2 space-y-2">
                  {newTaskCol === col.id && (
                    <div className="bg-black/40 border border-indigo-400/40 rounded-lg p-2">
                      <input
                        autoFocus
                        value={newTitle}
                        onChange={e => setNewTitle(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') addTask(col.id); if (e.key === 'Escape') setNewTaskCol(null) }}
                        placeholder="Task title..."
                        className="w-full bg-transparent text-sm outline-none mb-1.5"
                      />
                      <input
                        value={newTag}
                        onChange={e => setNewTag(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') addTask(col.id) }}
                        placeholder="Tag (optional)"
                        className="w-full bg-black/30 text-xs px-2 py-1 rounded outline-none mb-1.5"
                      />
                      <div className="flex gap-1.5">
                        <button onClick={() => addTask(col.id)} className="flex-1 bg-indigo-500 text-white text-xs py-1 rounded">Add</button>
                        <button onClick={() => setNewTaskCol(null)} className="px-2 text-slate-400 hover:text-white"><X size={12} /></button>
                      </div>
                    </div>
                  )}
                  {colTasks.map(t => (
                    <div
                      key={t.id}
                      draggable
                      onDragStart={() => setDragId(t.id)}
                      onDragEnd={() => { setDragId(null); setDragOverCol(null) }}
                      className={`group bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg p-3 cursor-grab active:cursor-grabbing transition ${dragId === t.id ? 'opacity-50' : ''}`}
                    >
                      <div className="flex items-start gap-2">
                        <GripVertical size={14} className="text-slate-600 mt-0.5" />
                        <p className="flex-1 text-sm text-slate-100">{t.title}</p>
                        <NodeActions type="kanban" sourceId={t.id} />
                        <button onClick={() => remove(t.id)} className="text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition"><Trash2 size={12} /></button>
                      </div>
                      {t.tag && (
                        <div className="mt-2 flex items-center gap-1.5">
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium" style={{ background: t.tagColor + '33', color: t.tagColor }}>{t.tag}</span>
                        </div>
                      )}
                    </div>
                  ))}
                  {colTasks.length === 0 && newTaskCol !== col.id && (
                    <button
                      onClick={() => setNewTaskCol(col.id)}
                      className="w-full py-8 border-2 border-dashed border-white/10 rounded-lg text-slate-500 text-sm hover:border-white/20 hover:text-slate-300 transition"
                    >
                      Drop here or + to add
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
