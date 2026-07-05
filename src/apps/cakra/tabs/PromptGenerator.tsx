import { useState, useEffect } from 'react'
import { Card, Button } from '../../../components/ui'
import { emit } from '../../../lib/eventBus'
import { apiUrl } from '../../../lib/apiBase'
import { mirrorCollection } from '../../../lib/core/sync'
import { NodeActions } from '../../../components/ui/NodeActions'
import { ProvenanceChip } from '../../../components/ui/ProvenanceChip'
import { useInboundHandoff } from '../../../lib/useInboundHandoff'
import {
  Wand2, Copy, Check, Sparkles, MessageSquare,
  Code, BookOpen, PenTool, Zap, Tag
} from 'lucide-react'

type Category = 'general' | 'coding' | 'creative' | 'analysis' | 'learning' | 'communication'

interface PromptTemplate {
  id: string
  name: string
  description: string
  category: Category
  icon: React.ReactNode
  template: string
  variables: string[]
}

interface SavedPrompt {
  id: string
  title: string
  content: string
  category: Category
  createdAt: string
}

const TEMPLATES: PromptTemplate[] = [
  {
    id: 'explain-code',
    name: 'Explain Code',
    description: 'Generate a clear explanation of any code snippet',
    category: 'coding',
    icon: <Code className="w-4 h-4" />,
    template: 'Explain this code in detail, line by line:\n\n```\n{{code}}\n```\n\nFocus on: what it does, how it works, and any potential issues.',
    variables: ['code'],
  },
  {
    id: 'review-code',
    name: 'Code Review',
    description: 'Get a thorough code review with suggestions',
    category: 'coding',
    icon: <Code className="w-4 h-4" />,
    template: 'Review this code and provide feedback on:\n1. Code quality and readability\n2. Potential bugs or edge cases\n3. Performance improvements\n4. Security concerns\n\n```\n{{code}}\n```',
    variables: ['code'],
  },
  {
    id: 'blog-post',
    name: 'Blog Post',
    description: 'Write an engaging blog post on any topic',
    category: 'creative',
    icon: <PenTool className="w-4 h-4" />,
    template: 'Write a blog post about "{{topic}}".\n\nRequirements:\n- Tone: {{tone}}\n- Target audience: {{audience}}\n- Length: {{length}} words\n- Include an attention-grabbing headline\n- Add subheadings and bullet points where appropriate',
    variables: ['topic', 'tone', 'audience', 'length'],
  },
  {
    id: 'summarize-article',
    name: 'Summarize Article',
    description: 'Condense long text into key points',
    category: 'analysis',
    icon: <BookOpen className="w-4 h-4" />,
    template: 'Summarize the following text in {{style}} style.\n\nExtract the main points and present them in a structured format.\n\nText:\n{{text}}',
    variables: ['style', 'text'],
  },
  {
    id: 'study-notes',
    name: 'Study Notes',
    description: 'Create comprehensive study notes from material',
    category: 'learning',
    icon: <BookOpen className="w-4 h-4" />,
    template: 'Create detailed study notes from this material.\n\nFormat should include:\n- Key concepts and definitions\n- Important facts and figures\n- Relationships between ideas\n- Questions for self-testing\n- Real-world examples\n\nMaterial:\n{{material}}',
    variables: ['material'],
  },
  {
    id: 'email-draft',
    name: 'Email Draft',
    description: 'Write professional emails for various purposes',
    category: 'communication',
    icon: <MessageSquare className="w-4 h-4" />,
    template: 'Write a {{type}} email with the following details:\n\nSubject: {{subject}}\nRecipient: {{recipient}}\nTone: {{tone}}\n\nMain message:\n{{message}}',
    variables: ['type', 'subject', 'recipient', 'tone', 'message'],
  },
  {
    id: 'quick-fix',
    name: 'Quick Fix',
    description: 'Explain and fix a bug quickly',
    category: 'coding',
    icon: <Zap className="w-4 h-4" />,
    template: 'There is a bug in this code:\n\n```\n{{code}}\n```\n\nError message:\n{{error}}\n\nProvide:\n1. Root cause analysis\n2. The fixed code\n3. Prevention tips',
    variables: ['code', 'error'],
  },
  {
    id: 'essay-outline',
    name: 'Essay Outline',
    description: 'Structure a well-organized essay',
    category: 'creative',
    icon: <PenTool className="w-4 h-4" />,
    template: 'Create an essay outline for the topic: "{{topic}}"\n\nRequirements:\n- Thesis statement\n- Introduction hook\n- {{num_body}} body paragraphs with supporting arguments\n- Counter-argument and rebuttal\n- Conclusion with call to action',
    variables: ['topic', 'num_body'],
  },
  {
    id: 'decision-matrix',
    name: 'Decision Matrix',
    description: 'Analyze options with a weighted criteria comparison',
    category: 'analysis',
    icon: <Sparkles className="w-4 h-4" />,
    template: 'Help me analyze these options using a decision matrix.\n\nOptions: {{options}}\n\nCriteria to consider: {{criteria}}\n\nFor each option, evaluate against each criteria and provide a weighted recommendation.',
    variables: ['options', 'criteria'],
  },
  {
    id: 'mock-interview',
    name: 'Mock Interview',
    description: 'Practice interview questions and answers',
    category: 'learning',
    icon: <MessageSquare className="w-4 h-4" />,
    template: 'Act as a {{role}} interviewer. Ask me {{num}} interview questions about {{topic}}.\n\nAfter I answer each question:\n1. Provide feedback on my answer\n2. Suggest improvements\n3. Give an example of a strong response\n\nStart with your first question.',
    variables: ['role', 'num', 'topic'],
  },
]

const CATEGORY_COLORS: Record<Category, string> = {
  general: 'bg-faint/30 text-muted',
  coding: 'bg-ion/30 text-ion',
  creative: 'bg-danger/30 text-danger',
  analysis: 'bg-signal/30 text-signal',
  learning: 'bg-success/30 text-success',
  communication: 'bg-warn/30 text-warn',
}

const CATEGORY_LABELS: Record<Category, string> = {
  general: 'General', coding: 'Coding', creative: 'Creative',
  analysis: 'Analysis', learning: 'Learning', communication: 'Communication',
}

export default function PromptGenerator() {
  const [selectedTemplate, setSelectedTemplate] = useState<PromptTemplate | null>(null)
  const [variables, setVariables] = useState<Record<string, string>>({})
  const [generated, setGenerated] = useState('')
  const [copied, setCopied] = useState(false)
  const [saved, setSaved] = useState<SavedPrompt[]>([])
  const [showTemplates, setShowTemplates] = useState(true)
  const [categoryFilter, setCategoryFilter] = useState<Category | 'all'>('all')
  const [customPrompt, setCustomPrompt] = useState('')
  const [mode, setMode] = useState<'template' | 'custom'>('template')
  const [generatedTitle, setGeneratedTitle] = useState('')

  const inbound = useInboundHandoff<{ text?: string; from?: string }>('empire-prompt-clipboard')

  useEffect(() => {
    emit({ type: 'APP_OPENED', appId: 'prompt-generator' })
    try {
      const savedData = localStorage.getItem('empire-prompt-generator-saved')
      if (savedData) setSaved(JSON.parse(savedData))
    } catch { /* ignore */ }
  }, [])

  // Preload the handed-off text into the template variables once it's read.
  useEffect(() => {
    if (inbound.payload?.text) {
      const t = inbound.payload.text
      setVariables(prev => ({ ...prev, code: t, text: t }))
    }
  }, [inbound.payload])

  useEffect(() => {
    try { localStorage.setItem('empire-prompt-generator-saved', JSON.stringify(saved)) } catch { /* ignore */ }
  }, [saved])

  // Mirror saved prompts into the Core graph as `prompt` nodes so the
  // generator's history joins the organism and gains cross-app intents.
  useEffect(() => {
    mirrorCollection('prompt', 'prompt-generator', saved, {
      id: p => p.id,
      title: p => p.title,
      data: p => ({ content: p.content, category: p.category, createdAt: p.createdAt }),
    })
  }, [saved])

  const applyTemplate = (template: PromptTemplate) => {
    setSelectedTemplate(template)
    setVariables({})
    setGenerated('')
    setShowTemplates(false)
    setMode('template')
  }

  const generate = () => {
    if (!selectedTemplate) return
    let prompt = selectedTemplate.template
    selectedTemplate.variables.forEach(v => {
      const val = variables[v] || ''
      prompt = prompt.replace(new RegExp(`\\{\\{${v}\\}\\}`, 'g'), val || `{{${v}}}`)
    })
    setGenerated(prompt)
    setGeneratedTitle(selectedTemplate.name)
    emit({ type: 'PROMPT_GENERATED', prompt })
  }

 const [enhancing, setEnhancing] = useState(false)

 const enhanceWithAI = async () => {
 if (!generated && !customPrompt) return
 const input = generated || customPrompt
 setEnhancing(true)
 try {
 const res = await fetch(apiUrl('/api/ai/chat'), {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ messages: [{ role: 'user', content: `Improve this prompt for better AI responses. Make it more specific, clear, and effective. Return only the improved prompt:\n\n${input}` }] }),
 })
 if (res.ok) {
 const data = await res.json()
 if (data.content) setGenerated(data.content)
 }
 } catch { /* ignore */ }
 setEnhancing(false)
 }

  const copyToClipboard = async () => {
    const text = generated || customPrompt
    if (!text) return
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch { /* ignore */ }
  }

  const savePrompt = () => {
    const text = generated || customPrompt
    if (!text) return
    const prompt: SavedPrompt = {
      id: Date.now().toString(),
      title: generatedTitle || `Prompt ${saved.length + 1}`,
      content: text,
      category: selectedTemplate?.category || 'general',
      createdAt: new Date().toISOString(),
    }
    setSaved(prev => [prompt, ...prev])
    emit({ type: 'PROMPT_GENERATED', prompt: text })
  }

  const loadSaved = (prompt: SavedPrompt) => {
    setGenerated(prompt.content)
    setGeneratedTitle(prompt.title)
    setCustomPrompt(prompt.content)
    setMode('custom')
    setShowTemplates(false)
  }

  const deleteSaved = (id: string) => setSaved(prev => prev.filter(p => p.id !== id))

  const _importFromText = (text: string) => {
  setCustomPrompt(text)
  setMode('custom')
  setShowTemplates(false)
  }

  const extractVariables = (template: string) => {
    const matches = template.match(/\{\{(\w+)\}\}/g) || []
    return [...new Set(matches.map(m => m.replace(/\{\{|\}\}/g, '')))]
  }

  const filteredTemplates = TEMPLATES.filter(t => categoryFilter === 'all' || t.category === categoryFilter)
  const filteredSaved = saved.filter(p => categoryFilter === 'all' || p.category === categoryFilter)

  return (
    <div className="space-y-4">
      <Card className="p-3">
        <div className="flex items-center gap-2 mb-3">
          <h1 className="text-lg font-bold flex items-center gap-2">
            <Wand2 className="w-5 h-5" /> Prompt Generator
          </h1>
          <div className="flex gap-1 ml-auto">
            <button onClick={() => { setMode('template'); setShowTemplates(true) }} className={`text-xs px-3 py-1 rounded ${mode === 'template' ? 'bg-signal text-fg' : 'bg-glass text-muted hover:text-fg'}`}>
              Templates
            </button>
            <button onClick={() => setMode('custom')} className={`text-xs px-3 py-1 rounded ${mode === 'custom' ? 'bg-signal text-fg' : 'bg-glass text-muted hover:text-fg'}`}>
              Custom
            </button>
          </div>
        </div>

        {inbound.source && (
          <div className="mb-2">
            <ProvenanceChip from={inbound.source} onDismiss={inbound.dismiss} />
          </div>
        )}

        {/* Category filter */}
        <div className="flex gap-1 flex-wrap">
          <button onClick={() => setCategoryFilter('all')} className={`text-xs px-2 py-0.5 rounded ${categoryFilter === 'all' ? 'bg-glass text-fg' : 'text-faint'}`}>All</button>
          {(Object.keys(CATEGORY_LABELS) as Category[]).map(cat => (
            <button key={cat} onClick={() => setCategoryFilter(cat)} className={`text-xs px-2 py-0.5 rounded ${categoryFilter === cat ? CATEGORY_COLORS[cat] : 'text-faint'}`}>
              {CATEGORY_LABELS[cat]}
            </button>
          ))}
        </div>
      </Card>

      {showTemplates ? (
        <>
          {/* Template Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {filteredTemplates.map(template => (
              <div
                key={template.id}
                onClick={() => applyTemplate(template)}
                className={`p-3 cursor-pointer transition hover:bg-glass rounded-2xl shadow-2xl ${selectedTemplate?.id === template.id ? 'ring-1 ring-signal' : ''}`}
                style={{
                  background: 'var(--gl-bg)',
                  backdropFilter: 'var(--gl-blur)',
                  border: '1px solid var(--gl-border-b)',
                  borderTopColor: 'var(--gl-border-t)',
                  boxShadow: 'var(--gl-shadow)',
                }}
              >
                <div className="flex items-center gap-2 mb-1">
                  {template.icon}
                  <span className="font-bold text-sm">{template.name}</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded ml-auto ${CATEGORY_COLORS[template.category]}`}>
                    {CATEGORY_LABELS[template.category]}
                  </span>
                </div>
                <p className="text-xs text-muted">{template.description}</p>
              </div>
            ))}
          </div>

 {/* Saved Prompts */}
 <Card className="p-3">
 <h2 className="text-sm font-bold mb-2 flex items-center gap-2"><Tag className="w-4 h-4" /> Saved Prompts</h2>
 {filteredSaved.length === 0 ? (
 <p className="text-center text-faint text-sm py-6">No saved prompts yet — generate one and tap Save to store it here.</p>
 ) : (
 <div className="space-y-1">
 {filteredSaved.map(p => (
 <div key={p.id} className="flex items-center gap-2 p-2 rounded hover:bg-glass group">
 <button onClick={() => loadSaved(p)} className="flex-1 text-left">
 <p className="text-sm">{p.title}</p>
 <p className="text-xs text-faint truncate">{p.content}</p>
 </button>
 <NodeActions type="prompt" sourceId={p.id} />
 <button onClick={() => deleteSaved(p.id)} className="opacity-0 group-hover:opacity-100 text-faint hover:text-danger text-xs">✕</button>
 </div>
 ))}
 </div>
 )}
 </Card>
        </>
      ) : (
        <>
          {/* Variable inputs */}
          {selectedTemplate && (
            <Card className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h2 className="font-bold">{selectedTemplate.name}</h2>
                  <p className="text-xs text-muted">{selectedTemplate.description}</p>
                </div>
                <Button onClick={() => setShowTemplates(true)} className="text-xs bg-glass hover:bg-glass">
                  ← Templates
                </Button>
              </div>
              <div className="space-y-3">
                {extractVariables(selectedTemplate.template).map(v => (
                  <div key={v}>
                    <label className="text-xs text-muted capitalize mb-1 block">{v.replace(/_/g, ' ')}</label>
                    <input
                      type="text"
                      value={variables[v] || ''}
                      onChange={e => setVariables(prev => ({ ...prev, [v]: e.target.value }))}
                      placeholder={`Enter ${v.replace(/_/g, ' ')}...`}
                      className="w-full bg-glass border-0 rounded px-3 py-2 text-sm"
                    />
                  </div>
                ))}
                <Button onClick={generate} className="w-full bg-signal hover:bg-signal">
                  <Sparkles className="w-4 h-4 mr-2" /> Generate Prompt
                </Button>
              </div>
            </Card>
          )}

          {/* Custom mode */}
          {mode === 'custom' && (
            <Card className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h2 className="font-bold">Custom Prompt</h2>
                {saved.length > 0 && (
                  <select onChange={e => { const p = saved.find(s => s.id === e.target.value); if (p) loadSaved(p) }} className="bg-glass border-0 rounded px-2 py-1 text-xs">
                    <option value="">Load saved...</option>
                    {saved.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                  </select>
                )}
              </div>
              <textarea
                value={customPrompt}
                onChange={e => setCustomPrompt(e.target.value)}
                placeholder="Write your prompt here... or start from a template above"
                className="w-full bg-glass border-0 rounded px-3 py-2 text-sm min-h-[150px] resize-y"
              />
            </Card>
          )}

          {/* Generated output */}
          {(generated || customPrompt) && (
            <Card className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-sm flex items-center gap-2">
                  <Sparkles className="w-4 h-4" /> Generated Prompt
                </h3>
                <div className="flex gap-2">
 <Button onClick={enhanceWithAI} className="text-xs bg-signal/30 hover:bg-signal/50 text-signal opacity-50 cursor-not-allowed">
 <Sparkles className={`w-3 h-3 mr-1 ${enhancing ? 'animate-pulse' : ''}`} /> {enhancing ? 'Enhancing…' : 'Enhance'}
                  </Button>
                  <Button onClick={copyToClipboard} className="text-xs bg-glass hover:bg-glass">
                    {copied ? <><Check className="w-3 h-3 mr-1" /> Copied</> : <><Copy className="w-3 h-3 mr-1" /> Copy</>}
                  </Button>
                  <Button onClick={savePrompt} className="text-xs bg-success/30 hover:bg-success/50 text-success">
                    <Tag className="w-3 h-3 mr-1" /> Save
                  </Button>
                </div>
              </div>
              <pre className="text-sm whitespace-pre-wrap bg-void/30 rounded p-3 min-h-[100px] max-h-[400px] overflow-y-auto font-mono">
                {generated || customPrompt}
              </pre>
            </Card>
          )}
        </>
      )}
    </div>
  )
}