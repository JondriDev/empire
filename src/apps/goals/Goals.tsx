/** 
 * Goals Tracker — connected to eventBus + Hermes
 * Track personal goals, set deadlines, track progress, ask Hermes for advice.
 */

import { useState, useEffect } from 'react'
import { Bot, Plus, Check, Target, Flag } from 'lucide-react'
import { emit } from '../../lib/eventBus'

interface Goal {
  id: string
  title: string
  description: string
  deadline: string
  createdAt: string
  completed: boolean
  progress: number // 0-100
}

export default function Goals() {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [deadline, setDeadline] = useState('')
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
  }, [goals])

  const add = () => {
    if (!title.trim()) return
    const newGoal: Goal = {
      id: Date.now().toString(),
      title: title.trim(),
      description: description.trim(),
      deadline: deadline || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      createdAt: new Date().toISOString().split('T')[0],
      completed: false,
      progress: 0
    }
    
    setGoals(prev => [...prev, newGoal])
    emit({ type: 'NOTE_CREATED', noteId: newGoal.id, title: newGoal.title, content: newGoal.description, tags: ['goal'] })
    setTitle('')
    setDescription('')
    setDeadline('')
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

  const askHermesGoal = (goal: Goal) => {
    sessionStorage.setItem('empire-ai-clipboard', JSON.stringify({
      text: `Goal: ${goal.title}\n\nDescription: ${goal.description}\nDeadline: ${goal.deadline}\nProgress: ${goal.progress}%`,
      title: `Goal: ${goal.title}`,
      from: 'goals',
    }))
    window.location.href = '/app/ai-chat'
  }

  const askHermesAll = () => {
    const summary = goals.map(g =>
      `• **${g.title}**${g.completed ? ' ✅' : ' 🔄'}\n  ${g.description}\n  Progress: ${g.progress}% | Deadline: ${g.deadline}`
    ).join('\n')
    sessionStorage.setItem('empire-ai-clipboard', JSON.stringify({
      text: `My goals progress:\n\n${summary}`,
      title: 'Goals Progress Review',
      from: 'goals',
    }))
    window.location.href = '/app/ai-chat'
  }

  const completedCount = goals.filter(g => g.completed).length
  const filtered = goals.filter(g => {
    if (filter === 'completed') return g.completed
    if (filter === 'active') return !g.completed
    return true
  })

  return (
    <div className="p-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Target className="w-6 h-6 text-blue-400" /> Goals Tracker
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            {completedCount}/{goals.length} completed
          </p>
        </div>
        <button
          onClick={askHermesAll}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-500/20 text-blue-200 text-xs hover:bg-blue-500/30 transition-colors"
        >
          <Bot className="w-3.5 h-3.5" /> Ask Hermes
        </button>
      </div>

      {/* Progress bar */}
      <div className="mb-6 h-2 rounded-full bg-white/5 overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-400 transition-all duration-500"
          style={{ width: `${goals.length ? (completedCount / goals.length) * 100 : 0}%` }}
        />
      </div>

      {/* Add form */}
      <div className="p-4 rounded-2xl border border-blue-500/20 mb-6" style={{ background: 'var(--card-bg)' }}>
        <h3 className="text-sm font-medium mb-3 flex items-center gap-1"><Plus className="w-3.5 h-3.5 text-blue-400" /> New Goal</h3>
        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Goal title (e.g. Learn React)"
          className="w-full rounded-lg px-3 py-2 text-sm mb-2 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
          style={{ background: 'var(--input-bg)', color: 'var(--text)' }}
        />
        <textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="Description"
          rows={2}
          className="w-full rounded-lg px-3 py-2 text-sm mb-2 resize-none focus:outline-none focus:ring-1 focus:ring-blue-500/50"
          style={{ background: 'var(--input-bg)', color: 'var(--text)' }}
        />
        <input
          type="date"
          value={deadline}
          onChange={e => setDeadline(e.target.value)}
          className="w-full rounded-lg px-3 py-2 text-sm mb-2 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
          style={{ background: 'var(--input-bg)', color: 'var(--text)' }}
        />
        <button
          onClick={add}
          disabled={!title.trim()}
          className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-30 text-white text-sm transition-colors"
        >
          Add Goal
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-4">
        {(['all', 'active', 'completed'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1 rounded-full text-xs capitalize transition-colors ${
              filter === f ? 'bg-blue-500/20 text-blue-300' : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Goals list */}
      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="text-center py-12">
            <Flag className="w-12 h-12 mx-auto mb-3 text-gray-600" />
            <p className="text-gray-500 text-sm">No {filter !== 'all' ? filter : ''} goals yet</p>
          </div>
        )}
        {filtered.map(goal => (
          <div
            key={goal.id}
            className="group relative p-4 rounded-2xl border border-white/5 hover:border-blue-500/30 transition-all"
            style={{ background: 'var(--card-bg)' }}
          >
            <div className="flex items-start gap-3">
              <button
                onClick={() => toggleCompleted(goal.id, !goal.completed)}
                className={`w-6 h-6 rounded-lg border flex-shrink-0 mt-0.5 flex items-center justify-center transition-colors ${
                  goal.completed ? 'bg-blue-500 border-blue-500 text-white' : 'border-white/20 hover:border-blue-500/50'
                }`}
              >
                {goal.completed && <Check className="w-3 h-3" />}
              </button>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className={`font-medium ${goal.completed ? 'line-through text-gray-500' : ''}`}>{goal.title}</h3>
                  {goal.completed && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300">Completed</span>}
                </div>
                {goal.description && (
                  <p className="text-sm text-gray-400 mt-1">{goal.description}</p>
                )}
                <div className="flex items-center gap-3 mt-2 text-xs text-gray-600">
                  <span>📅 Created: {goal.createdAt}</span>
                  <span>⏰ Deadline: {goal.deadline}</span>
                </div>
                
                {/* Progress slider */}
                <div className="mt-3">
                  <div className="flex justify-between text-xs mb-1">
                    <span>Progress</span>
                    <span>{goal.progress}%</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="100" 
                    value={goal.progress}
                    onChange={(e) => updateProgress(goal.id, parseInt(e.target.value))}
                    className="w-full h-1.5 rounded-full appearance-none bg-gray-700"
                    style={{
                      background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${goal.progress}%, #374151 ${goal.progress}%, #374151 100%)`
                    }}
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <button
                  onClick={() => askHermesGoal(goal)}
                  className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-blue-500/20 text-blue-300 transition-all"
                  title="Ask Hermes about this goal"
                >
                  <Bot className="w-4 h-4" />
                </button>
                <button
                  onClick={() => deleteGoal(goal.id)}
                  className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-500/20 text-red-300 transition-all"
                  title="Delete goal"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}