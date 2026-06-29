/**
 * Artifact 01 — Form Builder
 * Drag-and-drop form designer with live preview.
 * Build a form by adding fields, configure them, preview, and export JSON.
 */
import { useState } from 'react'
import { Plus, Trash2, GripVertical, Eye, Download, Type, AlignLeft, CheckSquare, Circle, ListChecks, Hash, Mail, Phone, Calendar as CalIcon } from 'lucide-react'
import { CATEGORICAL } from '../../../design-system/tokens'

type FieldType = 'text' | 'textarea' | 'number' | 'email' | 'phone' | 'date' | 'select' | 'checkbox' | 'radio'

interface Field {
  id: string
  type: FieldType
  label: string
  placeholder?: string
  required?: boolean
  options?: string[]
}

// Each field type gets a distinct categorical accent from the design-system rail
// (CATEGORICAL is 8 distinct XENO accents; the 9th type wraps cyclically).
const PALETTE: { type: FieldType; label: string; icon: any; color: string }[] = [
  { type: 'text', label: 'Short Text', icon: Type, color: CATEGORICAL[0] },
  { type: 'textarea', label: 'Long Text', icon: AlignLeft, color: CATEGORICAL[1] },
  { type: 'number', label: 'Number', icon: Hash, color: CATEGORICAL[2] },
  { type: 'email', label: 'Email', icon: Mail, color: CATEGORICAL[3] },
  { type: 'phone', label: 'Phone', icon: Phone, color: CATEGORICAL[4] },
  { type: 'date', label: 'Date', icon: CalIcon, color: CATEGORICAL[5] },
  { type: 'select', label: 'Dropdown', icon: ListChecks, color: CATEGORICAL[6] },
  { type: 'checkbox', label: 'Checkbox', icon: CheckSquare, color: CATEGORICAL[7] },
  { type: 'radio', label: 'Radio', icon: Circle, color: CATEGORICAL[8 % CATEGORICAL.length] },
]

const uid = () => Math.random().toString(36).slice(2, 10)

export default function FormBuilder() {
  const [title, setTitle] = useState('Untitled Form')
  const [fields, setFields] = useState<Field[]>([
    { id: uid(), type: 'text', label: 'Full Name', placeholder: 'Jane Doe', required: true },
    { id: uid(), type: 'email', label: 'Email Address', required: true },
  ])
  const [preview, setPreview] = useState(false)
  const [responses, setResponses] = useState<Record<string, any>>({})
  const [dragIdx, setDragIdx] = useState<number | null>(null)

  const addField = (type: FieldType) => {
    const def = PALETTE.find(p => p.type === type)!
    const newField: Field = {
      id: uid(),
      type,
      label: def.label,
      placeholder: type === 'select' || type === 'radio' ? undefined : 'Enter ' + def.label.toLowerCase(),
      required: false,
      options: ['select', 'radio', 'checkbox'].includes(type) ? ['Option 1', 'Option 2'] : undefined,
    }
    setFields([...fields, newField])
  }

  const updateField = (id: string, patch: Partial<Field>) => {
    setFields(fields.map(f => f.id === id ? { ...f, ...patch } : f))
  }

  const removeField = (id: string) => setFields(fields.filter(f => f.id !== id))

  const moveField = (from: number, to: number) => {
    if (to < 0 || to >= fields.length) return
    const next = [...fields]
    const [moved] = next.splice(from, 1)
    next.splice(to, 0, moved)
    setFields(next)
  }

  const exportJSON = () => {
    const data = JSON.stringify({ title, fields }, null, 2)
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = title.replace(/\s+/g, '-').toLowerCase() + '.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleSubmit = () => {
    alert('Form submitted!\n\n' + JSON.stringify(responses, null, 2))
  }

  const renderPreviewInput = (f: Field) => {
    const base = "w-full px-3 py-2 rounded-lg bg-void/30 border border-hair text-fg placeholder-faint focus:outline-none focus:border-ion transition"
    switch (f.type) {
      case 'textarea': return <textarea placeholder={f.placeholder} className={base + ' min-h-[80px]'} onChange={e => setResponses({ ...responses, [f.id]: e.target.value })} />
      case 'select': return (
        <select className={base} onChange={e => setResponses({ ...responses, [f.id]: e.target.value })}>
          <option value="">Choose...</option>
          {f.options?.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      )
      case 'checkbox': return (
        <div className="flex flex-wrap gap-2">
          {f.options?.map(o => (
            <label key={o} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-glass border border-hair text-muted text-sm">
              <input type="checkbox" onChange={e => setResponses({ ...responses, [f.id]: { ...responses[f.id], [o]: e.target.checked } })} />
              {o}
            </label>
          ))}
        </div>
      )
      case 'radio': return (
        <div className="flex flex-wrap gap-2">
          {f.options?.map(o => (
            <label key={o} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-glass border border-hair text-muted text-sm">
              <input type="radio" name={f.id} onChange={() => setResponses({ ...responses, [f.id]: o })} />
              {o}
            </label>
          ))}
        </div>
      )
      default: return <input type={f.type} placeholder={f.placeholder} className={base} onChange={e => setResponses({ ...responses, [f.id]: e.target.value })} />
    }
  }

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-void via-ion/30 to-void text-fg overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-hair flex items-center justify-between bg-void/20 backdrop-blur">
        <div className="flex items-center gap-3 flex-1 max-w-md">
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="bg-transparent text-2xl font-bold outline-none focus:bg-glass px-2 py-1 rounded w-full"
            placeholder="Form title..."
          />
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPreview(!preview)}
            className="px-3 py-1.5 rounded-lg bg-ion/20 text-ion border border-ion/30 text-sm flex items-center gap-2 hover:bg-ion/30 transition"
          >
            <Eye size={14} /> {preview ? 'Edit' : 'Preview'}
          </button>
          <button onClick={exportJSON} className="px-3 py-1.5 rounded-lg bg-success/20 text-success border border-success/30 text-sm flex items-center gap-2 hover:bg-success/30 transition">
            <Download size={14} /> Export
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex">
        {preview ? (
          <div className="flex-1 overflow-auto p-8">
            <div className="max-w-2xl mx-auto bg-glass backdrop-blur-xl border border-hair rounded-2xl p-8">
              <h2 className="text-3xl font-bold mb-6">{title}</h2>
              <div className="space-y-5">
                {fields.length === 0 && <p className="text-faint italic">No fields yet. Switch to edit mode to add some.</p>}
                {fields.map(f => (
                  <div key={f.id}>
                    <label className="block text-sm text-muted mb-1.5 font-medium">
                      {f.label} {f.required && <span className="text-danger">*</span>}
                    </label>
                    {renderPreviewInput(f)}
                  </div>
                ))}
                {fields.length > 0 && (
                  <button
                    onClick={handleSubmit}
                    className="mt-4 px-5 py-2.5 rounded-lg bg-gradient-to-r from-ion to-ion hover:from-ion hover:to-ion font-medium transition shadow-lg shadow-ion/20"
                  >
                    Submit
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Palette */}
            <div className="w-64 border-r border-hair bg-void/20 p-4 overflow-auto">
              <h3 className="text-xs uppercase tracking-wider text-faint mb-3 font-semibold">Field Types</h3>
              <div className="space-y-1.5">
                {PALETTE.map(p => {
                  const Icon = p.icon
                  return (
                    <button
                      key={p.type}
                      onClick={() => addField(p.type)}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg bg-glass hover:bg-glass border border-hair text-fg text-sm transition group"
                      style={{ borderLeftColor: p.color, borderLeftWidth: 3 } as any}
                    >
                      <Icon size={14} style={{ color: p.color }} />
                      <span className="flex-1 text-left">{p.label}</span>
                      <Plus size={12} className="opacity-0 group-hover:opacity-100 transition" />
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Canvas */}
            <div className="flex-1 overflow-auto p-6">
              <div className="max-w-2xl mx-auto space-y-3">
                {fields.length === 0 && (
                  <div className="text-center py-20 text-faint">
                    <Plus size={48} className="mx-auto mb-3 opacity-30" />
                    <p>Click a field type on the left to add it</p>
                  </div>
                )}
                {fields.map((f, idx) => (
                  <div
                    key={f.id}
                    draggable
                    onDragStart={() => setDragIdx(idx)}
                    onDragOver={e => e.preventDefault()}
                    onDrop={() => { if (dragIdx !== null) moveField(dragIdx, idx); setDragIdx(null) }}
                    className="group bg-glass backdrop-blur border border-hair rounded-xl p-4 hover:border-ion/40 transition"
                  >
                    <div className="flex items-start gap-2">
                      <GripVertical size={16} className="text-faint group-hover:text-muted cursor-grab mt-2" />
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <input
                            value={f.label}
                            onChange={e => updateField(f.id, { label: e.target.value })}
                            className="bg-transparent font-medium text-fg outline-none focus:bg-glass px-1 rounded flex-1"
                          />
                          <span className="text-xs uppercase tracking-wider text-faint px-2 py-0.5 bg-glass rounded">{f.type}</span>
                        </div>
                        {f.type !== 'select' && f.type !== 'radio' && f.type !== 'checkbox' && (
                          <input
                            value={f.placeholder ?? ''}
                            onChange={e => updateField(f.id, { placeholder: e.target.value })}
                            placeholder="Placeholder..."
                            className="w-full bg-transparent text-sm text-muted outline-none focus:bg-glass px-1 rounded"
                          />
                        )}
                        {['select', 'radio', 'checkbox'].includes(f.type) && (
                          <div className="space-y-1">
                            {f.options?.map((opt, i) => (
                              <div key={i} className="flex items-center gap-2">
                                <span className="text-faint text-sm">•</span>
                                <input
                                  value={opt}
                                  onChange={e => {
                                    const next = [...(f.options || [])]
                                    next[i] = e.target.value
                                    updateField(f.id, { options: next })
                                  }}
                                  className="bg-transparent text-sm text-muted outline-none focus:bg-glass px-1 rounded flex-1"
                                />
                                <button
                                  onClick={() => updateField(f.id, { options: f.options?.filter((_, j) => j !== i) })}
                                  className="opacity-50 hover:opacity-100 text-danger"
                                ><Trash2 size={12} /></button>
                              </div>
                            ))}
                            <button
                              onClick={() => updateField(f.id, { options: [...(f.options || []), 'New option'] })}
                              className="text-xs text-ion hover:text-ion flex items-center gap-1 mt-1"
                            ><Plus size={12} /> Add option</button>
                          </div>
                        )}
                        <label className="flex items-center gap-2 text-xs text-muted pt-1">
                          <input
                            type="checkbox"
                            checked={f.required || false}
                            onChange={e => updateField(f.id, { required: e.target.checked })}
                            className="rounded"
                          />
                          Required field
                        </label>
                      </div>
                      <div className="flex flex-col gap-1">
                        <button onClick={() => moveField(idx, idx - 1)} className="text-faint hover:text-fg text-xs">↑</button>
                        <button onClick={() => moveField(idx, idx + 1)} className="text-faint hover:text-fg text-xs">↓</button>
                        <button onClick={() => removeField(f.id)} className="text-danger/60 hover:text-danger mt-1"><Trash2 size={14} /></button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Footer hint */}
      <div className="px-6 py-2 border-t border-hair bg-void/20 text-xs text-faint flex items-center justify-between">
        <span>{fields.length} field{fields.length === 1 ? '' : 's'} · {Object.keys(responses).length} response value{Object.keys(responses).length === 1 ? '' : 's'} set in preview</span>
        <span>Drag fields to reorder · Click Edit/Preview to switch modes</span>
      </div>
    </div>
  )
}
