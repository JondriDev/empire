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
    const base = "w-full px-3 py-2 rounded-lg bg-black/30 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-400 transition"
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
            <label key={o} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-300 text-sm">
              <input type="checkbox" onChange={e => setResponses({ ...responses, [f.id]: { ...responses[f.id], [o]: e.target.checked } })} />
              {o}
            </label>
          ))}
        </div>
      )
      case 'radio': return (
        <div className="flex flex-wrap gap-2">
          {f.options?.map(o => (
            <label key={o} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-300 text-sm">
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
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-950 via-indigo-950/30 to-slate-950 text-white overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-black/20 backdrop-blur">
        <div className="flex items-center gap-3 flex-1 max-w-md">
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="bg-transparent text-2xl font-bold outline-none focus:bg-white/5 px-2 py-1 rounded w-full"
            placeholder="Form title..."
          />
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPreview(!preview)}
            className="px-3 py-1.5 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 text-sm flex items-center gap-2 hover:bg-indigo-500/30 transition"
          >
            <Eye size={14} /> {preview ? 'Edit' : 'Preview'}
          </button>
          <button onClick={exportJSON} className="px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-sm flex items-center gap-2 hover:bg-emerald-500/30 transition">
            <Download size={14} /> Export
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex">
        {preview ? (
          <div className="flex-1 overflow-auto p-8">
            <div className="max-w-2xl mx-auto bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8">
              <h2 className="text-3xl font-bold mb-6">{title}</h2>
              <div className="space-y-5">
                {fields.length === 0 && <p className="text-slate-500 italic">No fields yet. Switch to edit mode to add some.</p>}
                {fields.map(f => (
                  <div key={f.id}>
                    <label className="block text-sm text-slate-300 mb-1.5 font-medium">
                      {f.label} {f.required && <span className="text-red-400">*</span>}
                    </label>
                    {renderPreviewInput(f)}
                  </div>
                ))}
                {fields.length > 0 && (
                  <button
                    onClick={handleSubmit}
                    className="mt-4 px-5 py-2.5 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-400 hover:to-purple-400 font-medium transition shadow-lg shadow-indigo-500/20"
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
            <div className="w-64 border-r border-white/10 bg-black/20 p-4 overflow-auto">
              <h3 className="text-xs uppercase tracking-wider text-slate-500 mb-3 font-semibold">Field Types</h3>
              <div className="space-y-1.5">
                {PALETTE.map(p => {
                  const Icon = p.icon
                  return (
                    <button
                      key={p.type}
                      onClick={() => addField(p.type)}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 text-sm transition group"
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
                  <div className="text-center py-20 text-slate-500">
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
                    className="group bg-white/5 backdrop-blur border border-white/10 rounded-xl p-4 hover:border-indigo-400/40 transition"
                  >
                    <div className="flex items-start gap-2">
                      <GripVertical size={16} className="text-slate-600 group-hover:text-slate-400 cursor-grab mt-2" />
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <input
                            value={f.label}
                            onChange={e => updateField(f.id, { label: e.target.value })}
                            className="bg-transparent font-medium text-white outline-none focus:bg-white/5 px-1 rounded flex-1"
                          />
                          <span className="text-xs uppercase tracking-wider text-slate-500 px-2 py-0.5 bg-white/5 rounded">{f.type}</span>
                        </div>
                        {f.type !== 'select' && f.type !== 'radio' && f.type !== 'checkbox' && (
                          <input
                            value={f.placeholder ?? ''}
                            onChange={e => updateField(f.id, { placeholder: e.target.value })}
                            placeholder="Placeholder..."
                            className="w-full bg-transparent text-sm text-slate-400 outline-none focus:bg-white/5 px-1 rounded"
                          />
                        )}
                        {['select', 'radio', 'checkbox'].includes(f.type) && (
                          <div className="space-y-1">
                            {f.options?.map((opt, i) => (
                              <div key={i} className="flex items-center gap-2">
                                <span className="text-slate-500 text-sm">•</span>
                                <input
                                  value={opt}
                                  onChange={e => {
                                    const next = [...(f.options || [])]
                                    next[i] = e.target.value
                                    updateField(f.id, { options: next })
                                  }}
                                  className="bg-transparent text-sm text-slate-300 outline-none focus:bg-white/5 px-1 rounded flex-1"
                                />
                                <button
                                  onClick={() => updateField(f.id, { options: f.options?.filter((_, j) => j !== i) })}
                                  className="opacity-50 hover:opacity-100 text-red-400"
                                ><Trash2 size={12} /></button>
                              </div>
                            ))}
                            <button
                              onClick={() => updateField(f.id, { options: [...(f.options || []), 'New option'] })}
                              className="text-xs text-indigo-300 hover:text-indigo-200 flex items-center gap-1 mt-1"
                            ><Plus size={12} /> Add option</button>
                          </div>
                        )}
                        <label className="flex items-center gap-2 text-xs text-slate-400 pt-1">
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
                        <button onClick={() => moveField(idx, idx - 1)} className="text-slate-500 hover:text-slate-200 text-xs">↑</button>
                        <button onClick={() => moveField(idx, idx + 1)} className="text-slate-500 hover:text-slate-200 text-xs">↓</button>
                        <button onClick={() => removeField(f.id)} className="text-red-400/60 hover:text-red-400 mt-1"><Trash2 size={14} /></button>
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
      <div className="px-6 py-2 border-t border-white/10 bg-black/20 text-xs text-slate-500 flex items-center justify-between">
        <span>{fields.length} field{fields.length === 1 ? '' : 's'} · {Object.keys(responses).length} response value{Object.keys(responses).length === 1 ? '' : 's'} set in preview</span>
        <span>Drag fields to reorder · Click Edit/Preview to switch modes</span>
      </div>
    </div>
  )
}
