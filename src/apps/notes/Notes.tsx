/**
 * Notes — connected to the Empire eventBus
 *
 * Every note creation, update, and deletion is broadcast to all apps.
 * "Ask Cakra" lets you analyze or summarize any note.
 *
 * UI polish: uses EmpireButton, EmpireInput/TextArea, EmptyState primitives
 * + toast notifications for feedback (no console.log).
 */

import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Trash2, Edit2, Check, StickyNote, Sparkles, FileText, MessageSquare } from 'lucide-react'
import { useStore } from '../../lib/store'
import { emit } from '../../lib/eventBus'
import { useGraph } from '../../lib/core/graph'
import { useFocus } from '../../lib/core/focus'
import type { Note } from '../../lib/store'
import { Button, IconButton, Input, TextArea, Card, Badge } from '../../components/ui'
import { EmptyState, SectionHeader } from '../../components/ui/Utility'
import { useToast } from '../../components/ui/Toast'
import { NodeActions } from '../../components/ui/NodeActions'
import { cssVar, tint } from '../../design-system/tokens'
import { ProvenanceChip } from '../../components/ui/ProvenanceChip'

/** A note received via cross-app handoff carries a `from-<source>` tag (S6a). */
const FROM_PREFIX = 'from-'

export default function Notes() {
  const navigate = useNavigate()
  const { notes, addNote, updateNote, deleteNote } = useStore()
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editContent, setEditContent] = useState('')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const toast = useToast()

  // Deep-link landing: a Search hit opens Notes with the organism's gaze
  // (useFocus) on one graph node; that node mirrors a note via data.sourceId.
  // We scroll that card into view and ring it once — landing on the exact entity.
  const focusedId = useFocus(s => s.focusedId)
  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map())
  const handledFocus = useRef<string | null>(null)
  const [landedId, setLandedId] = useState<string | null>(null)

  // Emit APP_OPENED for activity feed tracking
  useEffect(() => {
    emit({ type: 'APP_OPENED', appId: 'notes' })
  }, [])

  useEffect(() => {
    if (!focusedId || handledFocus.current === focusedId) return
    const gnode = useGraph.getState().nodes[focusedId]
    const noteId = gnode && gnode.type === 'note' ? String(gnode.data.sourceId ?? '') : ''
    const el = noteId ? cardRefs.current.get(noteId) : null
    if (!el) return // card not rendered yet / not a note we own — retry when notes change
    handledFocus.current = focusedId
    el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    setLandedId(noteId)
    const t = setTimeout(() => setLandedId(null), 1700)
    return () => clearTimeout(t)
  }, [focusedId, notes])

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

  // Strip the provenance tag(s) when the source chip is dismissed — leaves any
  // user-authored tags intact.
  const handleDismissSource = (note: Note) => {
    updateNote(note.id, { tags: note.tags.filter(t => !t.startsWith(FROM_PREFIX)) })
  }

  const askCakra = (note: Note) => {
    sessionStorage.setItem('empire-ai-clipboard', JSON.stringify({
      text: `${note.title}\n\n${note.content}`,
      title: note.title,
      from: 'notes',
    }))
    toast.info('Opening Cakra', `Analyzing "${note.title}"...`)
    setTimeout(() => { navigate('/app/ai-chat') }, 200)
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
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text3)' }}>
              Save to your library — Cakra can analyze it later
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
            description="Capture a thought, paste a quote, or jot a meeting summary. Cakra can summarize or analyze any note."
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
              landed={landedId === note.id}
              cardRef={el => { if (el) cardRefs.current.set(note.id, el); else cardRefs.current.delete(note.id) }}
              isEditing={editingId === note.id}
              onStartEdit={() => startEditing(note)}
              onSaveEdit={() => handleSaveEdit(note.id)}
              onCancelEdit={cancelEdit}
              onDelete={() => handleDelete(note.id)}
              onAskCakra={() => askCakra(note)}
              onDismissSource={() => handleDismissSource(note)}
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
  landed?: boolean
  cardRef?: (_el: HTMLDivElement | null) => void
  isEditing: boolean
  onStartEdit: () => void
  onSaveEdit: () => void
  onCancelEdit: () => void
  onDelete: () => void
  onAskCakra: () => void
  onDismissSource: () => void
  editTitle: string
  editContent: string
  setEditTitle: (v: string) => void
  setEditContent: (v: string) => void
}

function NoteCard({ note, landed, cardRef, isEditing, onStartEdit, onSaveEdit, onCancelEdit, onDelete, onAskCakra, onDismissSource, editTitle, editContent, setEditTitle, setEditContent }: NoteCardProps) {
  // Provenance tag → source app; the remaining tags render as normal badges.
  const fromTag = note.tags.find(t => t.startsWith(FROM_PREFIX))
  const source = fromTag?.slice(FROM_PREFIX.length)
  const otherTags = note.tags.filter(t => !t.startsWith(FROM_PREFIX))
  return (
    <div
      ref={cardRef}
      className={`gp gp-interactive${landed ? ' focus-land' : ''}`}
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
          borderRadius: '0 var(--radius-sm) var(--radius-sm) 0',
          background: cssVar('c-warn'),
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
              {source && (
                <div style={{ marginTop: '10px' }}>
                  <ProvenanceChip from={source} onDismiss={onDismissSource} />
                </div>
              )}
              {otherTags.length > 0 && (
                <div style={{ display: 'flex', gap: '6px', marginTop: '10px', flexWrap: 'wrap' }}>
                  {otherTags.map(tag => (
                    <Badge key={tag} variant="info">{tag}</Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '2px', flexShrink: 0 }}>
              <NodeActions type="note" sourceId={note.id} />
              <ActionIconBtn title="Edit note" onClick={onStartEdit} icon={<Edit2 className="w-3.5 h-3.5" />} />
              <ActionIconBtn
                title="Ask Cakra"
                onClick={onAskCakra}
                icon={<Sparkles className="w-3.5 h-3.5" />}
                accent={cssVar('plasma')}
              />
              <ActionIconBtn
                title="Delete"
                onClick={onDelete}
                icon={<Trash2 className="w-3.5 h-3.5" />}
                accent={cssVar('c-danger')}
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
              borderTop: `1px solid ${tint('xenon', 4)}`,
              fontSize: 'var(--text-xs)',
              color: 'var(--text3)',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            <span>
              {new Date(note.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
              {' · '}
              {(note.content.trim() ? note.content.trim().split(/\s+/).length : 0)} words
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={onAskCakra}
              icon={<MessageSquare className="w-2.5 h-2.5" />}
              style={{
                gap: '4px',
                color: 'var(--color-cyan-3)',
                fontSize: 'var(--text-xs)',
                padding: '2px 4px',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = tint('signal', 8) }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
            >
              Analyze
            </Button>
          </div>
        </>
      )}
    </div>
  )
}

function ActionIconBtn({ icon, title, onClick, accent }: { icon: React.ReactNode; title: string; onClick: () => void; accent?: string }) {
  return (
    <IconButton
      onClick={onClick}
      title={title}
      aria-label={title}
      icon={icon}
      size="sm"
      style={{
        color: 'var(--text3)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.color = accent || 'var(--text)'
        e.currentTarget.style.background = accent ? `color-mix(in srgb, ${accent} 12%, transparent)` : tint('xenon', 6)
        e.currentTarget.style.transform = 'scale(1.1)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.color = 'var(--text3)'
        e.currentTarget.style.background = 'transparent'
        e.currentTarget.style.transform = 'scale(1)'
      }}
      onMouseDown={(e) => { e.currentTarget.style.transform = 'scale(0.92)' }}
      onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1.1)' }}
    />
  )
}

