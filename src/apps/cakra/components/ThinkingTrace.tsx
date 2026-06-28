/**
 * ThinkingTrace — Shows AI reasoning steps
 */

import type { ThinkingStep } from '../lib/types'
import { Zap } from 'lucide-react'
import { cssVar, tint } from '../../../design-system/tokens'

interface Props {
  steps: ThinkingStep[]
}

export default function ThinkingTrace({ steps }: Props) {
  return (
    <div
      className="mx-4 mt-2 rounded-xl p-3 text-xs"
      style={{
        background: tint('signal', 5),
        border: `1px solid ${tint('signal', 20)}`,
      }}
    >
      <div className="flex items-center gap-2 mb-2">
        <Zap className="w-3 h-3" style={{ color: cssVar('signal') }} />
        <span style={{ color: cssVar('signal'), fontWeight: 600 }}>Thinking</span>
      </div>
      <div className="space-y-1">
        {steps.map((step, i) => (
          <div key={i} className="flex gap-2">
            <span style={{ color: cssVar('text3'), minWidth: '16px' }}>{i + 1}.</span>
            <span style={{ color: cssVar('text2') }}>{step.text}</span>
          </div>
        ))}
      </div>
    </div>
  )
}