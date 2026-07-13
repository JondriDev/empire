/**
 * Artifact 01 — Form Builder
 * Drag-and-drop form designer with live preview.
 * Build a form by adding fields, configure them, preview, and export JSON.
 */
import { useState } from 'react'
import { Plus, Trash2, GripVertical, Eye, Download, Type, AlignLeft, CheckSquare, Circle, ListChecks, Hash, Mail, Phone, Calendar as CalIcon, ChevronUp, ChevronDown } from 'lucide-react'
import { CATEGORICAL } from '../../../design-system/tokens'
import { Button, IconButton, Input, TextArea, Select } from '../../../components/ui'

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
    const val = typeof responses[f.id] === 'string' ? responses[f.id] : ''
    switch (f.type) {
      case 'textarea': return <TextArea value={val} placeholder={f.placeholder} onChange={v => setResponses({ ...responses, [f.id]: v })} />
      case 'select': return (
        <Select
          value={val}
          ariaLabel={f.label}
          onChange={v => setResponses({ ...responses, [f.id]: v })}
          options={[{ value: '', label: 'Choose...' }, ...(f.options ?? []).map(o => ({ value: o, label: o }))]}
        />
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
      default: return <Input type={f.type} value={val} placeholder={f.placeholder} onChange={v => setResponses({ ...responses, [f.id]: v })} />
    }
  }

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-void via-ion/30 to-void text-fg overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-hair flex items-center justify-between bg-void/20 backdrop-blur">
        <div className="flex items-center gap-3 flex-1 max-w-md">
          <Input
            value={title}
            onChange={setTitle}
            className="flex-1"
            aria-label="Form title"
            placeholder="Form title..."
          />
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" icon={<Eye size={14} />} onClick={() => setPreview(!preview)}>
            {preview ? 'Edit' : 'Preview'}
          </Button>
          <Button variant="primary" size="sm" icon={<Download size={14} />} onClick={exportJSON}>
            Export
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
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
                  <Button variant="primary" size="lg" className="mt-4" onClick={handleSubmit}>
                    Submit
                  </Button>
                )}
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Palette */}
            <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-hair bg-void/20 p-4 overflow-auto max-h-[40dvh] md:max-h-none">
              <h3 className="text-xs uppercase tracking-wider text-faint mb-3 font-semibold">Field Types</h3>
              <div className="space-y-1.5">
                {PALETTE.map(p => {
                  const Icon = p.icon
                  return (
                    <Button
                      key={p.type}
                      variant="secondary"
                      size="sm"
                      fullWidth
                      onClick={() => addField(p.type)}
                      icon={<Icon size={14} style={{ color: p.color }} />}
                      iconRight={<Plus size={12} style={{ opacity: 0.5 }} />}
                      style={{ justifyContent: 'flex-start', borderLeft: `3px solid ${p.color}` }}
                    >
                      <span style={{ flex: 1, textAlign: 'left' }}>{p.label}</span>
                    </Button>
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
                          <Input
                            value={f.label}
                            onChange={v => updateField(f.id, { label: v })}
                            className="flex-1"
                            aria-label="Field label"
                          />
                          <span className="text-xs uppercase tracking-wider text-faint px-2 py-0.5 bg-glass rounded">{f.type}</span>
                        </div>
                        {f.type !== 'select' && f.type !== 'radio' && f.type !== 'checkbox' && (
                          <Input
                            value={f.placeholder ?? ''}
                            onChange={v => updateField(f.id, { placeholder: v })}
                            placeholder="Placeholder..."
                            aria-label="Field placeholder"
                          />
                        )}
                        {['select', 'radio', 'checkbox'].includes(f.type) && (
                          <div className="space-y-1">
                            {f.options?.map((opt, i) => (
                              <div key={i} className="flex items-center gap-2">
                                <span className="text-faint text-sm">•</span>
                                <Input
                                  value={opt}
                                  onChange={v => {
                                    const next = [...(f.options || [])]
                                    next[i] = v
                                    updateField(f.id, { options: next })
                                  }}
                                  className="flex-1"
                                  aria-label={`Option ${i + 1}`}
                                />
                                <IconButton
                                  variant="ghost"
                                  size="sm"
                                  aria-label={`Remove option ${i + 1}`}
                                  onClick={() => updateField(f.id, { options: f.options?.filter((_, j) => j !== i) })}
                                  icon={<Trash2 size={12} />}
                                />
                              </div>
                            ))}
                            <Button
                              variant="ghost"
                              size="sm"
                              icon={<Plus size={12} />}
                              onClick={() => updateField(f.id, { options: [...(f.options || []), 'New option'] })}
                            >Add option</Button>
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
                        <IconButton variant="ghost" size="sm" aria-label="Move field up" onClick={() => moveField(idx, idx - 1)} icon={<ChevronUp size={14} />} />
                        <IconButton variant="ghost" size="sm" aria-label="Move field down" onClick={() => moveField(idx, idx + 1)} icon={<ChevronDown size={14} />} />
                        <IconButton variant="ghost" size="sm" aria-label="Remove field" onClick={() => removeField(f.id)} icon={<Trash2 size={14} />} />
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
