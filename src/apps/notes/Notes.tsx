/**
 * Notes — connected to the Empire eventBus
 *
 * Every note creation, update, and deletion is broadcast to all apps.
 * "Ask Hermes" lets you analyze or summarize any note.
 *
 * UI polish: uses EmpireButton, EmpireInput/TextArea, EmptyState primitives
 * + toast notifications for feedback (no console.log).
 */

import { useState, useEffect } from 'react'
import { Plus, Trash2, Edit2, X, Check, StickyNote, Sparkles, FileText, MessageSquare } from 'lucide-react'
import { useStore } from '../../lib/store'
import { emit } from '../../lib/eventBus'
import type { Note } from '../../lib/store'
import { Button, Input, TextArea, Card, Badge } from '../../components/ui'
import { EmptyState, SectionHeader } from '../../components/ui/Utility'
import { useToast } from '../../components/ui/Toast'

export default function Notes() {
  const { notes, addNote, updateNote, deleteNote } = useStore()
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editContent, setEditContent] = useState('')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const toast = useToast()

  // Emit APP_OPENED for activity feed tracking
  useEffect(() => {
    emit({ type: 'APP_OPENED', appId: 'notes' })
  }, [])

  const handleCreate = () => {
    if (!title.trim() && !content.trim()) {
      toast.warning('Empty note', 'Add a title or some content first.')
      return
    }
    const note: Note = {
      id: Date.now().toString(),
      title: title.trim() || 'Untitled',
      content: content.trim(),
      updatedAt: Date.now(),
      tags: [],
    }
    addNote(note)
    emit({ type: 'NOTE_CREATED', noteId: note.id, title: note.title, content: note.content, tags: note.tags })
    toast.success('Note saved', note.title)
    setTitle('')
    setContent('')
    setShowForm(false)
  }

  const handleDelete = (id: string) => {
    const note = notes.find(n => n.id === id)
    deleteNote(id)
    emit({ type: 'NOTE_DELETED', noteId: id })
    toast.info('Note deleted', note?.title)
  }

  const startEditing = (note: Note) => {
    setEditingId(note.id)
    setEditTitle(note.title)
    setEditContent(note.content)
  }

  const handleSaveEdit = (id: string) => {
    if (!editTitle.trim() && !editContent.trim()) {
      toast.warning('Empty note', 'Add a title or some content first.')
      return
    }
    const updated: Partial<Note> = {
      title: editTitle.trim() || 'Untitled',
      content: editContent.trim(),
      updatedAt: Date.now(),
    }
    updateNote(id, updated)
    emit({ type: 'NOTE_UPDATED', noteId: id, title: updated.title!, content: updated.content! })
    toast.success('Note updated')
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
    toast.info('Opening Hermes', `Analyzing "${note.title}"...`)
    setTimeout(() => { window.location.href = '/app/ai-chat' }, 200)
  }

  const totalWords = notes.reduce((acc, n) => acc + (n.content.trim() ? n.content.trim().split(/\s+/).length : 0), 0)

  return (
    <div style={{ padding: '24px 28px', maxWidth: '780px', margin: '0 auto' }}>
      {/* Header */}
      <SectionHeader
        icon={<StickyNote className="w-4 h-4" />}
        title="Notes"
        subtitle={`${notes.length} ${notes.length === 1 ? 'note' : 'notes'} · ${totalWords.toLocaleString()} words`}
        action={
          !showForm && (
            <Button
              variant="primary"
              icon={<Plus className="w-4 h-4" />}
              onClick={() => setShowForm(true)}
              size="md"
            >
              New Note
            </Button>
          )
        }
      />

      {/* New note form */}
      {showForm && (
        <Card
          padding="md"
          className="animate-fade-in-up"
          style={{ marginTop: '20px' }}
          role="dialog"
          aria-label="Create new note"
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              e.preventDefault();
              setShowForm(false); setTitle(''); setContent('');
            }
            // Ctrl/Cmd+Enter saves
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              handleCreate();
            }
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <Badge variant="info">New</Badge>
            <span style={{ fontSize: '11px', color: 'var(--text3)' }}>
              Save to your library — Hermes can analyze it later
            </span>
          </div>
          <Input
            value={title}
            onChange={setTitle}
            placeholder="Note title…"
            icon={<FileText className="w-4 h-4" />}
            style={{ marginBottom: '10px' }}
            // Use autoFocus on first render
            autoFocus
          />
          <TextArea
            value={content}
            onChange={setContent}
            placeholder="Write your note… (Cmd/Ctrl+Enter to save)"
            rows={5}
            style={{ marginBottom: '14px' }}
          />
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <Button
              variant="ghost"
              onClick={() => { setShowForm(false); setTitle(''); setContent('') }}
              aria-label="Cancel and close new note form"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              icon={<Check className="w-4 h-4" />}
              onClick={handleCreate}
              aria-label="Save note"
            >
              Save Note
            </Button>
          </div>
        </Card>
      )}

      {/* Notes list */}
      {notes.length === 0 && !showForm && (
        <div style={{ marginTop: '32px' }}>
          <EmptyState
            icon={<StickyNote className="w-6 h-6" />}
            title="No notes yet"
            description="Capture a thought, paste a quote, or jot a meeting summary. Hermes can summarize or analyze any note."
            action={
              <Button
                variant="primary"
                icon={<Plus className="w-4 h-4" />}
                onClick={() => setShowForm(true)}
              >
                Create your first note
              </Button>
            }
          />
        </div>
      )}

      {notes.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '20px' }}>
          {notes.map(note => (
            <NoteCard
              key={note.id}
              note={note}
              isEditing={editingId === note.id}
              onStartEdit={() => startEditing(note)}
              onSaveEdit={() => handleSaveEdit(note.id)}
              onCancelEdit={cancelEdit}
              onDelete={() => handleDelete(note.id)}
              onAskHermes={() => askHermes(note)}
              editTitle={editTitle}
              editContent={editContent}
              setEditTitle={setEditTitle}
              setEditContent={setEditContent}
            />
          ))}
        </div>
      )}
    </div>
  )
}

/* ── Single NoteCard subcomponent ── */
interface NoteCardProps {
  note: Note
  isEditing: boolean
  onStartEdit: () => void
  onSaveEdit: () => void
  onCancelEdit: () => void
  onDelete: () => void
  onAskHermes: () => void
  editTitle: string
  editContent: string
  setEditTitle: (v: string) => void
  setEditContent: (v: string) => void
}

function NoteCard({ note, isEditing, onStartEdit, onSaveEdit, onCancelEdit, onDelete, onAskHermes, editTitle, editContent, setEditTitle, setEditContent }: NoteCardProps) {
  return (
    <div
      className="gp gp-interactive"
      style={{
        padding: '16px',
        position: 'relative',
        transition: 'all var(--dur-base) var(--ease-out)',
      }}
    >
      {/* Color tab indicating note color app */}
      <div
        style={{
          position: 'absolute',
          top: 12,
          left: 0,
          width: 3,
          height: 24,
          borderRadius: '0 3px 3px 0',
          background: '#eab308',
          opacity: 0.7,
        }}
      />

      {isEditing ? (
        <>
          <Input
            value={editTitle}
            onChange={setEditTitle}
            placeholder="Note title…"
            style={{ marginBottom: '10px' }}
            autoFocus
          />
          <TextArea
            value={editContent}
            onChange={setEditContent}
            placeholder="Write your note…"
            rows={5}
            style={{ marginBottom: '14px' }}
          />
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <Button variant="ghost" size="sm" onClick={onCancelEdit}>Cancel</Button>
            <Button variant="primary" size="sm" icon={<Check className="w-3.5 h-3.5" />} onClick={onSaveEdit}>
              Save
            </Button>
          </div>
        </>
      ) : (
        <>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h3
                style={{
                  fontSize: 'var(--text-base)',
                  fontWeight: 600,
                  color: 'var(--text)',
                  margin: 0,
                  lineHeight: 1.4,
                  letterSpacing: '-0.01em',
                }}
                className="line-clamp-1"
              >
                {note.title}
              </h3>
              {note.content && (
                <p
                  style={{
                    fontSize: 'var(--text-sm)',
                    color: 'var(--text2)',
                    margin: '6px 0 0',
                    lineHeight: 1.55,
                    whiteSpace: 'pre-wrap',
                  }}
                  className="line-clamp-3"
                >
                  {note.content}
                </p>
              )}
              {note.tags.length > 0 && (
                <div style={{ display: 'flex', gap: '6px', marginTop: '10px', flexWrap: 'wrap' }}>
                  {note.tags.map(tag => (
                    <Badge key={tag} variant="info">{tag}</Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '2px', flexShrink: 0 }}>
              <ActionIconBtn title="Edit note" onClick={onStartEdit} icon={<Edit2 className="w-3.5 h-3.5" />} />
              <ActionIconBtn
                title="Ask Hermes"
                onClick={onAskHermes}
                icon={<Sparkles className="w-3.5 h-3.5" />}
                accent="#a855f7"
              />
              <ActionIconBtn
                title="Delete"
                onClick={onDelete}
                icon={<Trash2 className="w-3.5 h-3.5" />}
                accent="#ef4444"
              />
            </div>
          </div>

          {/* Metadata footer */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginTop: '12px',
              paddingTop: '10px',
              borderTop: '1px solid rgba(255,255,255,0.04)',
              fontSize: '10px',
              color: 'var(--text3)',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            <span>
              {new Date(note.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
              {' · '}
              {(note.content.trim() ? note.content.trim().split(/\s+/).length : 0)} words
            </span>
            <button
              onClick={onAskHermes}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                background: 'none',
                border: 'none',
                color: 'var(--color-cyan-3)',
                cursor: 'pointer',
                fontSize: '10px',
                fontWeight: 500,
                padding: '2px 4px',
                borderRadius: '4px',
                transition: 'background var(--dur-fast)',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(34,211,238,0.08)' }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
            >
              <MessageSquare className="w-2.5 h-2.5" />
              Analyze
            </button>
          </div>
        </>
      )}
    </div>
  )
}

function ActionIconBtn({ icon, title, onClick, accent }: { icon: React.ReactNode; title: string; onClick: () => void; accent?: string }) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        padding: '6px',
        borderRadius: 'var(--radius-md)',
        background: 'transparent',
        border: 'none',
        color: 'var(--text3)',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all var(--dur-fast) var(--ease-spring)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.color = accent || 'var(--text)'
        e.currentTarget.style.background = accent ? `${accent}1F` : 'rgba(255,255,255,0.06)'
        e.currentTarget.style.transform = 'scale(1.1)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.color = 'var(--text3)'
        e.currentTarget.style.background = 'transparent'
        e.currentTarget.style.transform = 'scale(1)'
      }}
      onMouseDown={(e) => { e.currentTarget.style.transform = 'scale(0.92)' }}
      onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1.1)' }}
    >
      {icon}
    </button>
  )
}

