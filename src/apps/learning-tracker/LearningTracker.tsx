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
import { Button, IconButton, Input, TextArea } from '../../components/ui'
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
        <Button
          variant="ghost"
          size="sm"
          onClick={askCakraAll}
          icon={<Bot className="w-3.5 h-3.5" />}
          style={{ background: 'color-mix(in srgb, var(--signal) 18%, transparent)', color: 'var(--signal)' }}
        >
          Ask Cakra
        </Button>
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
        <Input
          value={topic}
          onChange={setTopic}
          placeholder="Topic (e.g. Rust ownership)"
          className="mb-2"
        />
        <TextArea
          value={learned}
          onChange={setLearned}
          placeholder="What did you learn?"
          rows={2}
          className="mb-2"
          style={{ resize: 'none', minHeight: 0 }}
        />
        <Button
          onClick={add}
          disabled={!topic.trim()}
          style={{ background: 'var(--c-success)', color: 'var(--void)' }}
        >
          Add Topic
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-4">
        {(['all', 'active', 'mastered'] as const).map(f => (
          <Button
            key={f}
            variant="ghost"
            size="sm"
            onClick={() => setFilter(f)}
            aria-pressed={filter === f}
            className="capitalize"
            style={filter === f
              ? { background: 'color-mix(in srgb, var(--c-success) 20%, transparent)', color: 'var(--c-success)' }
              : { color: 'var(--text2)' }}
          >
            {f}
          </Button>
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
              <IconButton
                onClick={() => toggleMastered(item.id, !item.mastered)}
                aria-label={item.mastered ? `Mark ${item.topic} not mastered` : `Mark ${item.topic} mastered`}
                aria-pressed={item.mastered}
                icon={item.mastered ? <Check className="w-3 h-3" /> : <span className="w-3 h-3" />}
                className="flex-shrink-0 mt-0.5"
                style={item.mastered
                  ? { width: 24, height: 24, borderRadius: 'var(--radius-md)', background: 'var(--c-success)', border: '1px solid var(--c-success)', color: 'var(--void)' }
                  : { width: 24, height: 24, borderRadius: 'var(--radius-md)', border: '1px solid var(--hair)', color: 'var(--text3)' }}
              />
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
              <span className="opacity-60 group-hover:opacity-100 focus-within:opacity-100 transition-opacity flex-shrink-0">
                <NodeActions type="learning" sourceId={item.id} />
              </span>
              <span className="opacity-60 group-hover:opacity-100 focus-within:opacity-100 transition-opacity flex-shrink-0">
                <IconButton
                  onClick={() => askCakraTopic(item)}
                  aria-label="Ask Cakra about this topic"
                  title="Ask Cakra about this topic"
                  size="sm"
                  icon={<Bot className="w-4 h-4" />}
                  style={{ color: 'var(--signal)' }}
                />
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}