/**
 * ThinkingTrace — Shows AI reasoning steps
 */

import type { ThinkingStep } from '../lib/types'
import { Zap } from 'lucide-react'

interface Props {
  steps: ThinkingStep[]
}

export default function ThinkingTrace({ steps }: Props) {
  return (
    <div
      className="mx-4 mt-2 rounded-xl p-3 text-xs"
      style={{
        background: 'rgba(34,211,238,0.05)',
        border: '1px solid rgba(34,211,238,0.2)',
      }}
    >
      <div className="flex items-center gap-2 mb-2">
        <Zap className="w-3 h-3" style={{ color: '#22d3ee' }} />
        <span style={{ color: '#22d3ee', fontWeight: 600 }}>Thinking</span>
      </div>
      <div className="space-y-1">
        {steps.map((step, i) => (
          <div key={i} className="flex gap-2">
            <span style={{ color: '#475569', minWidth: '16px' }}>{i + 1}.</span>
            <span style={{ color: '#94a3b8' }}>{step.text}</span>
          </div>
        ))}
      </div>
    </div>
  )
}