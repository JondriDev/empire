/** 
 * Goals Tracker — connected to eventBus + Cakra
 * Track personal goals, set deadlines, track progress, ask Cakra for advice.
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bot, Plus, Check, Target, Flag, Trash2 } from 'lucide-react'
import { emit } from '../../lib/eventBus'
import { mirrorCollection } from '../../lib/core/sync'
import { Button, IconButton, Input, TextArea, Slider } from '../../components/ui'
import { NodeActions } from '../../components/ui/NodeActions'
import { useInboundHandoff } from '../../lib/useInboundHandoff'
import { ProvenanceChip } from '../../components/ui/ProvenanceChip'
import { LineageTrail } from '../../components/ui/LineageTrail'
import { EmptyState } from '../../components/ui/Utility'

interface Goal {
  id: string
  title: string
  description: string
  deadline: string
  createdAt: string
  completed: boolean
  progress: number // 0-100
  /** Source app id when created via a cross-app handoff (S3). Optional → backward-compatible. */
  from?: string
}

export default function Goals() {
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [deadline, setDeadline] = useState('')
  const [draftFrom, setDraftFrom] = useState<string | undefined>(undefined)
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all')
  const [goals, setGoals] = useState<Goal[]>([])

  // Load goals from localStorage on component mount
  useEffect(() => {
    const savedGoals = localStorage.getItem('empire-goals')
    if (savedGoals) {
      try {
        setGoals(JSON.parse(savedGoals))
      } catch (e) {
        console.error('Failed to parse goals', e)
      }
    }
    
    // Emit APP_OPENED for activity feed tracking
    emit({ type: 'APP_OPENED', appId: 'goals' })
  }, [])

  // Save goals to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('empire-goals', JSON.stringify(goals))
    // Mirror goals into the Core graph so they join the organism.
    mirrorCollection('goal', 'goals', goals, {
      id: g => g.id,
      title: g => g.title,
      data: g => ({ description: g.description, deadline: g.deadline, progress: g.progress, completed: g.completed }),
    })
  }, [goals])

  // Natural inbound: a cross-app HANDOFF (text → new goal) prefills the New Goal
  // form so the receive lands in Goals' own create flow.
  const inbound = useInboundHandoff<{ text?: string; title?: string; from?: string }>('empire-goals-clipboard')
  useEffect(() => {
    if (!inbound.payload?.text) return
    const t = inbound.payload.text
    setTitle(inbound.payload.title || t.split('\n')[0].slice(0, 80))
    setDescription(inbound.payload.title ? t : '')
    // Remember the source so the SAVED goal carries it durably (survives reload).
    setDraftFrom(inbound.payload.from)
  }, [inbound.payload])

  const add = () => {
    if (!title.trim()) return
    const newGoal: Goal = {
      id: Date.now().toString(),
      title: title.trim(),
      description: description.trim(),
      deadline: deadline || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      createdAt: new Date().toISOString().split('T')[0],
      completed: false,
      progress: 0,
      ...(draftFrom ? { from: draftFrom } : {}),
    }

    setGoals(prev => [...prev, newGoal])
    emit({ type: 'NOTE_CREATED', noteId: newGoal.id, title: newGoal.title, content: newGoal.description, tags: ['goal'] })
    setTitle('')
    setDescription('')
    setDeadline('')
    setDraftFrom(undefined)
  }

  const toggleCompleted = (id: string, completed: boolean) => {
    const goal = goals.find(g => g.id === id)
    if (goal) {
      setGoals(prev => prev.map(g => g.id === id ? { ...g, completed, progress: completed ? 100 : g.progress } : g))
      emit({ type: 'NOTE_UPDATED', noteId: id, title: goal.title, content: goal.description })
    }
  }

  const updateProgress = (id: string, progress: number) => {
    const goal = goals.find(g => g.id === id)
    if (goal) {
      const completed = progress === 100
      setGoals(prev => prev.map(g => g.id === id ? { ...g, progress, completed } : g))
      emit({ type: 'NOTE_UPDATED', noteId: id, title: goal.title, content: goal.description })
    }
  }

  const deleteGoal = (id: string) => {
    setGoals(prev => prev.filter(g => g.id !== id))
    emit({ type: 'NOTE_DELETED', noteId: id })
  }

  const askCakraGoal = (goal: Goal) => {
    sessionStorage.setItem('empire-ai-clipboard', JSON.stringify({
      text: `Goal: ${goal.title}\n\nDescription: ${goal.description}\nDeadline: ${goal.deadline}\nProgress: ${goal.progress}%`,
      title: `Goal: ${goal.title}`,
      from: 'goals',
    }))
    navigate('/app/ai-chat')
  }

  const askCakraAll = () => {
    const summary = goals.map(g =>
      `• **${g.title}**${g.completed ? ' ✅' : ' 🔄'}\n  ${g.description}\n  Progress: ${g.progress}% | Deadline: ${g.deadline}`
    ).join('\n')
    sessionStorage.setItem('empire-ai-clipboard', JSON.stringify({
      text: `My goals progress:\n\n${summary}`,
      title: 'Goals Progress Review',
      from: 'goals',
    }))
    navigate('/app/ai-chat')
  }

  const completedCount = goals.filter(g => g.completed).length
  const filtered = goals.filter(g => {
    if (filter === 'completed') return g.completed
    if (filter === 'active') return !g.completed
    return true
  })

  // One accent per view — Goals reads as electric-blue "ion" (matches its
  // registry tile). Everything else routes through the Deep-Field text tokens
  // so editing a design-system token restyles this app with the rest.
  const ACCENT = 'var(--ion)'

  return (
    <div className="p-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: 'var(--text)' }}>
            <Target className="w-6 h-6" style={{ color: ACCENT }} /> Goals Tracker
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text2)' }}>
            {completedCount}/{goals.length} completed
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={askCakraAll}
          icon={<Bot className="w-3.5 h-3.5" />}
          style={{ background: 'color-mix(in srgb, var(--ion) 18%, transparent)', color: ACCENT }}
        >
          Ask Cakra
        </Button>
      </div>

      {inbound.source && (
        <div className="mb-4">
          <ProvenanceChip from={inbound.source} onDismiss={() => { inbound.dismiss(); setDraftFrom(undefined) }} />
        </div>
      )}

      {/* Progress bar */}
      <div className="mb-6 h-2 rounded-full overflow-hidden" style={{ background: 'var(--input-bg)' }}>
        <div
          className="h-full rounded-full"
          style={{
            width: `${goals.length ? (completedCount / goals.length) * 100 : 0}%`,
            background: `linear-gradient(to right, var(--ion), var(--signal))`,
            transition: 'width var(--dur-slow) var(--ease-out)',
          }}
        />
      </div>

      {/* Add form */}
      <div className="gp p-4 rounded-2xl mb-6">
        <h3 className="text-sm font-medium mb-3 flex items-center gap-1" style={{ color: 'var(--text)' }}>
          <Plus className="w-3.5 h-3.5" style={{ color: ACCENT }} /> New Goal
        </h3>
        <Input
          value={title}
          onChange={setTitle}
          placeholder="Goal title (e.g. Learn React)"
          className="mb-2"
        />
        <TextArea
          value={description}
          onChange={setDescription}
          placeholder="Description"
          rows={2}
          className="mb-2"
          style={{ resize: 'none', minHeight: 0 }}
        />
        <Input
          type="date"
          value={deadline}
          onChange={setDeadline}
          className="mb-2"
        />
        <Button
          onClick={add}
          disabled={!title.trim()}
          style={{ background: ACCENT, color: 'var(--void)' }}
        >
          Add Goal
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-4">
        {(['all', 'active', 'completed'] as const).map(f => (
          <Button
            key={f}
            variant="ghost"
            size="sm"
            onClick={() => setFilter(f)}
            aria-pressed={filter === f}
            className="capitalize"
            style={
              filter === f
                ? { background: 'color-mix(in srgb, var(--ion) 18%, transparent)', color: ACCENT }
                : { color: 'var(--text2)' }
            }
          >
            {f}
          </Button>
        ))}
      </div>

      {/* Goals list */}
      <div className="space-y-3">
        {filtered.length === 0 && (
          <EmptyState
            icon={<Flag className="w-6 h-6" />}
            title={`No ${filter !== 'all' ? filter + ' ' : ''}goals yet`}
            description="Set a goal and Cakra will help you break it into steps."
          />
        )}
        {filtered.map(goal => (
          <div
            key={goal.id}
            className="gp gp-interactive group relative p-4 rounded-2xl"
          >
            <div className="flex items-start gap-3">
              <IconButton
                onClick={() => toggleCompleted(goal.id, !goal.completed)}
                aria-label={goal.completed ? `Mark ${goal.title} incomplete` : `Mark ${goal.title} complete`}
                aria-pressed={goal.completed}
                icon={goal.completed ? <Check className="w-3 h-3" /> : <span className="w-3 h-3" />}
                className="flex-shrink-0 mt-0.5"
                style={
                  goal.completed
                    ? { width: 24, height: 24, borderRadius: 'var(--radius-md)', background: ACCENT, border: `1px solid ${ACCENT}`, color: 'var(--void)' }
                    : { width: 24, height: 24, borderRadius: 'var(--radius-md)', border: '1px solid var(--hair)', color: 'var(--text3)' }
                }
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium" style={{ color: goal.completed ? 'var(--text3)' : 'var(--text)', textDecoration: goal.completed ? 'line-through' : 'none' }}>{goal.title}</h3>
                  {goal.completed && <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: 'color-mix(in srgb, var(--ion) 18%, transparent)', color: ACCENT }}>Completed</span>}
                </div>
                {goal.description && (
                  <p className="text-sm mt-1" style={{ color: 'var(--text2)' }}>{goal.description}</p>
                )}
                {goal.from && (
                  <div className="mt-2">
                    <LineageTrail app="goals" from={goal.from} />
                  </div>
                )}
                <div className="flex items-center gap-3 mt-2 text-xs" style={{ color: 'var(--text3)' }}>
                  <span>📅 Created: {goal.createdAt}</span>
                  <span>⏰ Deadline: {goal.deadline}</span>
                </div>

                {/* Progress slider */}
                <div className="mt-3">
                  <div className="flex justify-between text-xs mb-1" style={{ color: 'var(--text2)' }}>
                    <span>Progress</span>
                    <span>{goal.progress}%</span>
                  </div>
                  <Slider
                    min={0}
                    max={100}
                    value={goal.progress}
                    onChange={(v) => updateProgress(goal.id, v)}
                    aria-label={`Progress for ${goal.title}`}
                    style={{ height: '6px', borderRadius: 'var(--radius-full)' }}
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <NodeActions type="goal" sourceId={goal.id} />
                <span className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <IconButton
                    onClick={() => askCakraGoal(goal)}
                    aria-label="Ask Cakra about this goal"
                    title="Ask Cakra about this goal"
                    size="sm"
                    icon={<Bot className="w-4 h-4" />}
                    style={{ color: ACCENT }}
                  />
                </span>
                <span className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <IconButton
                    onClick={() => deleteGoal(goal.id)}
                    aria-label="Delete goal"
                    title="Delete goal"
                    size="sm"
                    icon={<Trash2 className="w-4 h-4" />}
                    style={{ color: 'var(--ember)' }}
                  />
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}