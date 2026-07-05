/**
 * Learning Tracker — connected to eventBus + Cakra
 * Track topics, log learning, quiz yourself, ask Cakra to explain.
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bot, Plus, Check, BookOpen, Brain } from 'lucide-react'
import { useStore } from '../../lib/store'
import { emit } from '../../lib/eventBus'
import { NodeActions } from '../../components/ui/NodeActions'
import { ProvenanceChip } from '../../components/ui/ProvenanceChip'
import { EmptyState } from '../../components/ui/Utility'
import type { LearningItem } from '../../lib/store'

export default function LearningTracker() {
  const navigate = useNavigate()
  const { learningItems, addLearningItem, updateLearningItem } = useStore()
  const [topic, setTopic] = useState('')
  const [learned, setLearned] = useState('')
 const [filter, setFilter] = useState<'all' | 'active' | 'mastered'>('all')

 // Emit APP_OPENED for activity feed tracking
 useEffect(() => {
 emit({ type: 'APP_OPENED', appId: 'learning-tracker' })
 }, [])

 const add = () => {
    if (!topic.trim()) return
    addLearningItem({
      id: Date.now().toString(),
      topic: topic.trim(),
      learned: learned.trim(),
      date: new Date().toISOString().split('T')[0],
      nextReview: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
      mastered: false,
    })
    emit({ type: 'LEARNING_LOGGED', topic: topic.trim(), learned: learned.trim() })
    setTopic('')
    setLearned('')
  }

  const toggleMastered = (id: string, mastered: boolean) => {
    const item = learningItems.find(l => l.id === id)
    updateLearningItem(id, { mastered })
    emit({ type: 'LEARNING_CHALLENGE', mode: 'mastery', topic: item?.topic || '', score: mastered ? 1 : 0 })
  }

  const askCakraTopic = (item: LearningItem) => {
    sessionStorage.setItem('empire-ai-clipboard', JSON.stringify({
      text: `Explain: ${item.topic}\n\nWhat I've learned:\n${item.learned}`,
      title: `Learning: ${item.topic}`,
      from: 'learning-tracker',
    }))
    navigate('/app/ai-chat')
  }

  const askCakraAll = () => {
    const summary = learningItems.map(l =>
      `• **${l.topic}**${l.mastered ? ' ✅' : ' 🔄'}\n  ${l.learned}`
    ).join('\n')
    sessionStorage.setItem('empire-ai-clipboard', JSON.stringify({
      text: `My learning progress:\n\n${summary}`,
      title: 'Learning Progress Review',
      from: 'learning-tracker',
    }))
    navigate('/app/ai-chat')
  }

  const masteredCount = learningItems.filter(l => l.mastered).length
  const filtered = learningItems.filter(l => {
    if (filter === 'mastered') return l.mastered
    if (filter === 'active') return !l.mastered
    return true
  })

  return (
    <div className="p-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-success" /> Learning Tracker
          </h1>
          <p className="text-sm text-muted mt-1">
            {masteredCount}/{learningItems.length} mastered
          </p>
        </div>
        <button
          onClick={askCakraAll}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-signal/20 text-signal text-xs hover:bg-signal/30 transition-colors"
        >
          <Bot className="w-3.5 h-3.5" /> Ask Cakra
        </button>
      </div>

      {/* Progress bar */}
      <div className="mb-6 h-2 rounded-full bg-glass overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-success to-success transition-all duration-500"
          style={{ width: `${learningItems.length ? (masteredCount / learningItems.length) * 100 : 0}%` }}
        />
      </div>

      {/* Add form */}
      <div className="p-4 rounded-2xl border border-success/20 mb-6" style={{ background: 'var(--card-bg)' }}>
        <h3 className="text-sm font-medium mb-3 flex items-center gap-1"><Plus className="w-3.5 h-3.5 text-success" /> New Topic</h3>
        <input
          value={topic}
          onChange={e => setTopic(e.target.value)}
          placeholder="Topic (e.g. Rust ownership)"
          className="w-full rounded-lg px-3 py-2 text-sm mb-2 focus:outline-none focus:ring-1 focus:ring-success/50"
          style={{ background: 'var(--input-bg)', color: 'var(--text)' }}
        />
        <textarea
          value={learned}
          onChange={e => setLearned(e.target.value)}
          placeholder="What did you learn?"
          rows={2}
          className="w-full rounded-lg px-3 py-2 text-sm mb-2 resize-none focus:outline-none focus:ring-1 focus:ring-success/50"
          style={{ background: 'var(--input-bg)', color: 'var(--text)' }}
        />
        <button
          onClick={add}
          disabled={!topic.trim()}
          className="px-4 py-1.5 rounded-lg bg-success hover:bg-success disabled:opacity-30 text-fg text-sm transition-colors"
        >
          Add Topic
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-4">
        {(['all', 'active', 'mastered'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1 rounded-full text-xs capitalize transition-colors ${
              filter === f ? 'bg-success/20 text-success' : 'text-muted hover:text-muted'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Topic list */}
      <div className="space-y-3">
        {filtered.length === 0 && (
          <EmptyState
            icon={<Brain className="w-6 h-6" />}
            title={`No ${filter !== 'all' ? filter + ' ' : ''}topics yet`}
            description="Add a topic to track what you're learning and how far you've come."
          />
        )}
        {filtered.map(item => (
          <div
            key={item.id}
            className="group relative p-4 rounded-2xl border border-hair hover:border-success/30 transition-all"
            style={{ background: 'var(--card-bg)' }}
          >
            <div className="flex items-start gap-3">
              <button
                onClick={() => toggleMastered(item.id, !item.mastered)}
                className={`w-6 h-6 rounded-lg border flex-shrink-0 mt-0.5 flex items-center justify-center transition-colors ${
                  item.mastered ? 'bg-success border-success text-fg' : 'border-hair hover:border-success/50'
                }`}
              >
                {item.mastered && <Check className="w-3 h-3" />}
              </button>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className={`font-medium ${item.mastered ? 'line-through text-faint' : ''}`}>{item.topic}</h3>
                  {item.mastered && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-success/20 text-success">Mastered</span>}
                </div>
                {item.learned && (
                  <p className="text-sm text-muted mt-1">{item.learned}</p>
                )}
                {item.from && (
                  <div className="mt-2">
                    <ProvenanceChip
                      from={item.from}
                      onDismiss={() => updateLearningItem(item.id, { from: undefined })}
                    />
                  </div>
                )}
                <div className="flex items-center gap-3 mt-2 text-xs text-faint">
                  <span>📅 {item.date}</span>
                  <span>→ Next: {item.nextReview}</span>
                </div>
              </div>
              <span className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                <NodeActions type="learning" sourceId={item.id} />
              </span>
              <button
                onClick={() => askCakraTopic(item)}
                className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-signal/20 text-signal transition-all"
                title="Ask Cakra about this topic"
              >
                <Bot className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}