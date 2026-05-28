/**
 * Notes — connected to the Empire eventBus
 *
 * Every note creation, update, and deletion is broadcast to all apps.
 * "Ask Hermes" lets you analyze or summarize any note.
 */

import { useState, useEffect } from 'react'
import { Bot, Plus, Trash2, Edit2, X, Check } from 'lucide-react'
import { useStore } from '../../lib/store'
import { emit } from '../../lib/eventBus'
import type { Note } from '../../lib/store'

export default function Notes() {
  const { notes, addNote, updateNote, deleteNote } = useStore()
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editContent, setEditContent] = useState('')
 const [title, setTitle] = useState('')
 const [content, setContent] = useState('')

 // Emit APP_OPENED for activity feed tracking
 useEffect(() => {
 emit({ type: 'APP_OPENED', appId: 'notes' })
 }, [])

 const handleCreate = () => {
    if (!title.trim() && !content.trim()) return
    const note: Note = {
      id: Date.now().toString(),
      title: title.trim() || 'Untitled',
      content: content.trim(),
      updatedAt: Date.now(),
      tags: [],
    }
    addNote(note)
    emit({ type: 'NOTE_CREATED', noteId: note.id, title: note.title, content: note.content, tags: note.tags })
    setTitle('')
    setContent('')
    setShowForm(false)
  }

  const handleDelete = (id: string) => {
    deleteNote(id)
    emit({ type: 'NOTE_DELETED', noteId: id })
  }

  const startEditing = (note: Note) => {
    setEditingId(note.id)
    setEditTitle(note.title)
    setEditContent(note.content)
  }

  const handleSaveEdit = (id: string) => {
    if (!editTitle.trim() && !editContent.trim()) return
    const updated: Partial<Note> = {
      title: editTitle.trim() || 'Untitled',
      content: editContent.trim(),
      updatedAt: Date.now(),
    }
    updateNote(id, updated)
    emit({ type: 'NOTE_UPDATED', noteId: id, title: updated.title!, content: updated.content! })
    setEditingId(null)
    setEditTitle('')
    setEditContent('')
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditTitle('')
    setEditContent('')
  }

  const askHermes = (note: Note) => {
    sessionStorage.setItem('empire-ai-clipboard', JSON.stringify({
      text: `${note.title}\n\n${note.content}`,
      title: note.title,
      from: 'notes',
    }))
    window.location.href = '/app/ai-chat'
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Notes</h1>
          <p className="text-sm text-gray-400">{notes.length} note{notes.length !== 1 ? 's' : ''} · Tap any note to analyze with Hermes</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-sm transition-colors"
        >
          <Plus className="w-4 h-4" /> New Note
        </button>
      </div>

      {/* New note form */}
      {showForm && (
        <div className="mb-6 p-4 rounded-2xl border border-cyan-500/20" style={{ background: 'var(--card-bg)' }}>
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Note title..."
            className="w-full bg-transparent text-lg font-semibold mb-2 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 rounded placeholder:text-gray-600"
            style={{ color: 'var(--text)' }}
          />
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="Write your note..."
            rows={4}
            className="w-full bg-transparent text-sm resize-none focus:outline-none focus:ring-1 focus:ring-cyan-500/50 rounded placeholder:text-gray-600"
            style={{ color: 'var(--text)' }}
          />
          <div className="flex gap-2 mt-3">
            <button onClick={handleCreate} className="px-4 py-1.5 rounded-lg bg-cyan-600 text-white text-sm hover:bg-cyan-500">Save</button>
            <button onClick={() => { setShowForm(false); setTitle(''); setContent('') }} className="px-4 py-1.5 rounded-lg border border-white/10 text-sm hover:bg-white/5">Cancel</button>
          </div>
        </div>
      )}

      {/* Notes list */}
      {notes.length === 0 && (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 flex items-center justify-center mx-auto mb-4">
            <Plus className="w-8 h-8 text-cyan-300" />
          </div>
          <h2 className="text-lg font-medium mb-2">No notes yet</h2>
          <p className="text-sm text-gray-500">Create your first note or ask Hermes to summarize something.</p>
        </div>
      )}

      <div className="space-y-3">
        {notes.map(note => (
          <div
            key={note.id}
            className="group relative p-4 rounded-2xl border border-white/5 hover:border-cyan-500/30 transition-all duration-200"
            style={{ background: 'var(--card-bg)' }}
          >
            {/* View mode */}
            {editingId !== note.id ? (
              <>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate">{note.title}</h3>
                    <p className="text-sm text-gray-400 mt-1 line-clamp-2">{note.content || 'No content'}</p>
                    {note.tags.length > 0 && (
                      <div className="flex gap-1 mt-2 flex-wrap">
                        {note.tags.map(tag => (
                          <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-200">{tag}</span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                    <button
                      onClick={() => startEditing(note)}
                      className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                      title="Edit note"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => askHermes(note)}
                      className="p-1.5 rounded-lg hover:bg-cyan-500/20 text-cyan-300 transition-colors"
                      title="Ask Hermes about this note"
                    >
                      <Bot className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(note.id)}
                      className="p-1.5 rounded-lg hover:bg-red-500/20 text-red-400 transition-colors"
                      title="Delete note"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Timestamp */}
                <div className="text-[10px] text-gray-600 mt-2">
                  {new Date(note.updatedAt).toLocaleDateString()} · {note.content.split(/\s+/).filter(Boolean).length} words
                </div>
              </>
            ) : (
              /* Edit mode */
              <>
                <input
                  value={editTitle}
                  onChange={e => setEditTitle(e.target.value)}
                  placeholder="Note title..."
                  className="w-full bg-transparent text-lg font-semibold mb-2 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 rounded placeholder:text-gray-600 border-b border-cyan-500/30 pb-1"
                  style={{ color: 'var(--text)' }}
                  autoFocus
                />
                <textarea
                  value={editContent}
                  onChange={e => setEditContent(e.target.value)}
                  placeholder="Write your note..."
                  rows={4}
                  className="w-full bg-transparent text-sm resize-none focus:outline-none focus:ring-1 focus:ring-cyan-500/50 rounded placeholder:text-gray-600 mt-2"
                  style={{ color: 'var(--text)' }}
                />
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => handleSaveEdit(note.id)}
                    className="px-3 py-1.5 rounded-lg bg-cyan-600 text-white text-xs hover:bg-cyan-500 flex items-center gap-1"
                  >
                    <Check className="w-3 h-3" /> Save
                  </button>
                  <button
                    onClick={cancelEdit}
                    className="px-3 py-1.5 rounded-lg border border-white/10 text-xs hover:bg-white/5 flex items-center gap-1"
                  >
                    <X className="w-3 h-3" /> Cancel
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}