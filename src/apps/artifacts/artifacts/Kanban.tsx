/**
 * Artifact 03 — Kanban Board
 * Drag tasks across columns (To Do / Doing / Done). LocalStorage persistence.
 */
import { useState, useEffect } from 'react'
import { Plus, Trash2, X, GripVertical } from 'lucide-react'
import { mirrorCollection } from '../../../lib/core/sync'
import { NodeActions } from '../../../components/ui/NodeActions'
import { Button, IconButton, Input } from '../../../components/ui'
import { CATEGORICAL, cssVar } from '../../../design-system/tokens'

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
  { id: 'todo', title: 'To Do', accent: cssVar('ion') },
  { id: 'doing', title: 'In Progress', accent: cssVar('signal') },
  { id: 'done', title: 'Done', accent: cssVar('c-success') },
]

// Distinct categorical accents for tags (design-system rail).
const TAG_COLORS = CATEGORICAL

const STORAGE = 'empire-artifact-kanban'

const uid = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36)

const seed = (): Task[] => [
  { id: uid(), title: 'Design dashboard layout', column: 'todo', tag: 'design', tagColor: CATEGORICAL[6], created: Date.now() },
  { id: uid(), title: 'Set up auth flow', column: 'doing', tag: 'backend', tagColor: CATEGORICAL[1], created: Date.now() },
  { id: uid(), title: 'Write unit tests', column: 'doing', tag: 'testing', tagColor: CATEGORICAL[2], created: Date.now() },
  { id: uid(), title: 'Ship v1 release', column: 'done', tag: 'release', tagColor: CATEGORICAL[4], created: Date.now() },
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
    <div className="h-full flex flex-col bg-gradient-to-br from-void via-danger/20 to-void text-fg overflow-hidden">
      <div className="px-6 py-4 border-b border-hair bg-void/20 backdrop-blur flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Kanban Board</h1>
          <p className="text-xs text-faint mt-0.5">{tasks.length} tasks across {COLUMNS.length} columns · auto-saved</p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => { if (confirm('Clear all tasks?')) setTasks(seed()) }}
        >
          Reset to demo
        </Button>
      </div>

      <div className="flex-1 overflow-x-auto p-6">
        <div className="flex gap-4 h-full min-w-max">
          {COLUMNS.map(col => {
            const colTasks = tasks.filter(t => t.column === col.id).sort((a, b) => b.created - a.created)
            return (
              <div
                key={col.id}
                className={`w-80 flex flex-col rounded-2xl border ${dragOverCol === col.id ? 'border-hair bg-glass' : 'border-hair bg-glass'} backdrop-blur transition`}
                onDragOver={e => e.preventDefault()}
                onDragEnter={() => setDragOverCol(col.id)}
                onDragLeave={() => setDragOverCol(null)}
                onDrop={() => { if (dragId) moveTo(dragId, col.id) }}
              >
                <div className="p-3 border-b border-hair flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ background: col.accent }} />
                    <h2 className="font-semibold">{col.title}</h2>
                    <span className="text-xs text-faint bg-glass px-1.5 py-0.5 rounded-full">{colTasks.length}</span>
                  </div>
                  <IconButton variant="ghost" size="sm" aria-label={`Add task to ${col.title}`} onClick={() => setNewTaskCol(col.id)} icon={<Plus size={14} />} />
                </div>

                <div className="flex-1 overflow-y-auto p-2 space-y-2">
                  {newTaskCol === col.id && (
                    <div className="bg-void/40 border border-ion/40 rounded-lg p-2 space-y-1.5">
                      <Input
                        autoFocus
                        value={newTitle}
                        onChange={setNewTitle}
                        onKeyDown={e => { if (e.key === 'Enter') addTask(col.id); if (e.key === 'Escape') setNewTaskCol(null) }}
                        placeholder="Task title..."
                        aria-label="Task title"
                      />
                      <Input
                        value={newTag}
                        onChange={setNewTag}
                        onKeyDown={e => { if (e.key === 'Enter') addTask(col.id) }}
                        placeholder="Tag (optional)"
                        aria-label="Task tag"
                      />
                      <div className="flex gap-1.5">
                        <Button variant="primary" size="sm" fullWidth onClick={() => addTask(col.id)}>Add</Button>
                        <IconButton variant="ghost" size="sm" aria-label="Cancel new task" onClick={() => setNewTaskCol(null)} icon={<X size={12} />} />
                      </div>
                    </div>
                  )}
                  {colTasks.map(t => (
                    <div
                      key={t.id}
                      draggable
                      onDragStart={() => setDragId(t.id)}
                      onDragEnd={() => { setDragId(null); setDragOverCol(null) }}
                      className={`group bg-glass hover:bg-glass border border-hair rounded-lg p-3 cursor-grab active:cursor-grabbing transition ${dragId === t.id ? 'opacity-50' : ''}`}
                    >
                      <div className="flex items-start gap-2">
                        <GripVertical size={14} className="text-faint mt-0.5" />
                        <p className="flex-1 text-sm text-fg">{t.title}</p>
                        <NodeActions type="kanban" sourceId={t.id} />
                        <IconButton variant="ghost" size="sm" aria-label={`Remove task ${t.title}`} className="opacity-0 group-hover:opacity-100" onClick={() => remove(t.id)} icon={<Trash2 size={12} />} />
                      </div>
                      {t.tag && (
                        <div className="mt-2 flex items-center gap-1.5">
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium" style={{ background: `color-mix(in srgb, ${t.tagColor} 20%, transparent)`, color: t.tagColor }}>{t.tag}</span>
                        </div>
                      )}
                    </div>
                  ))}
                  {colTasks.length === 0 && newTaskCol !== col.id && (
                    <Button
                      variant="ghost"
                      fullWidth
                      onClick={() => setNewTaskCol(col.id)}
                      style={{ padding: '32px 0', border: '2px dashed var(--gl-border-b)' }}
                    >
                      Drop here or + to add
                    </Button>
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
