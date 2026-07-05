/**
 * Calculator — emits results to eventBus, Cakra-aware
 *
 * UI polish:
 *  - Glass display with neon-cyan glow when result ready
 *  - Operator buttons use the app color (orange) theming
 *  - Memory indicators refined
 *  - History sidebar collapsible
 *  - Toast feedback on copy-to-Cakra
 */

import { useState, useCallback, useEffect, useRef } from 'react'
import { Sparkles, History, Trash2, Copy, Check } from 'lucide-react'
import { emit } from '../../lib/eventBus'
import { cssVar, tint } from '../../design-system/tokens'
import { useToast } from '../../components/ui/Toast'

type Op = '+' | '-' | '×' | '÷' | '^' | null

export default function Calculator() {
  const [display, setDisplay] = useState('0')
  const [expression, setExpression] = useState('')
  const [memory, setMemory] = useState<number | null>(null)
  const [op, setOp] = useState<Op>(null)
  const [memStore, setMemStore] = useState<number>(0)
  const [memLabel, setMemLabel] = useState('')
  const [history, setHistory] = useState<{ expr: string; result: string }[]>([])
  const [newNumber, setNewNumber] = useState(true)
  const [justCalculated, setJustCalculated] = useState(false)
  const [copied, setCopied] = useState(false)
  const handlersRef = useRef({} as Record<string, (...args: string[]) => void>)
  const toast = useToast()

  // Emit APP_OPENED for activity feed tracking
  useEffect(() => {
    emit({ type: 'APP_OPENED', appId: 'calculator' })
  }, [])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const h = handlersRef.current
      if (e.key >= '0' && e.key <= '9') h['digit']?.(e.key)
      else if (e.key === '.') h['decimal']?.()
      else if (e.key === '+') h['op+']?.()
      else if (e.key === '-') h['op-']?.()
      else if (e.key === '*') h['op×']?.()
      else if (e.key === '/') h['op÷']?.()
      else if (e.key === 'Enter' || e.key === '=') h['equals']?.()
      else if (e.key === 'Escape' || e.key === 'c') h['clear']?.()
      else if (e.key === 'Backspace') h['backspace']?.()
      else if (e.key === '%') h['percent']?.()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const inputDigit = useCallback((d: string) => {
    setJustCalculated(false)
    if (newNumber) { setDisplay(d); setNewNumber(false) }
    else setDisplay(prev => prev === '0' ? d : prev + d)
  }, [newNumber])

  const inputDecimal = useCallback(() => {
    setJustCalculated(false)
    if (newNumber) { setDisplay('0.'); setNewNumber(false) }
    else if (!display.includes('.')) setDisplay(prev => prev + '.')
  }, [display, newNumber])

  const calculate = (a: number, b: number, operation: Op): number => {
    switch (operation) {
      case '+': return a + b
      case '-': return a - b
      case '×': return a * b
      case '÷': return b !== 0 ? a / b : 0
      case '^': return Math.pow(a, b)
      default: return b
    }
  }

  const handleOp = useCallback((nextOp: Op) => {
    setJustCalculated(false)
    const num = parseFloat(display)
    if (memory === null) setMemory(num)
    else if (op) {
      const result = calculate(memory, num, op)
      setMemory(result)
      setDisplay(String(result))
    }
    setOp(nextOp)
    setNewNumber(true)
    if (op) setExpression(`${memory} ${op} ${num} `)
    else setExpression(`${num} `)
  }, [display, memory, op])

  const equals = useCallback(() => {
    const num = parseFloat(display)
    if (memory !== null && op) {
      const result = calculate(memory, num, op)
      const expr = `${memory} ${op} ${num}`
      const resultStr = String(Number.isFinite(result) ? Math.round(result * 1e10) / 1e10 : 'Error')
      setHistory(prev => [{ expr, result: resultStr }, ...prev].slice(0, 20))
      // Emit event for other apps
      emit({ type: 'CALCULATION_RESULT', expression: expr, result: resultStr })
      setDisplay(resultStr)
      setExpression(`${expr} =`)
      setMemory(null)
      setOp(null)
      setNewNumber(true)
      setJustCalculated(true)
    }
  }, [display, memory, op])

  const clear = useCallback(() => {
    setDisplay('0'); setExpression(''); setMemory(null); setOp(null); setNewNumber(true); setJustCalculated(false)
  }, [])

  const backspace = useCallback(() => {
    setJustCalculated(false)
    if (display.length > 1) setDisplay(prev => prev.slice(0, -1))
    else setDisplay('0')
  }, [display])

  const toggleSign = useCallback(() => setDisplay(prev => String(-parseFloat(prev))), [])
  const percent = useCallback(() => setDisplay(prev => String(parseFloat(prev) / 100)), [])

  const sciFunc = useCallback((fn: string) => {
    setJustCalculated(false)
    const n = parseFloat(display)
    let result: number
    switch (fn) {
      case 'sin': result = Math.sin(n * Math.PI / 180); break
      case 'cos': result = Math.cos(n * Math.PI / 180); break
      case 'tan': result = Math.tan(n * Math.PI / 180); break
      case 'log': result = Math.log10(n); break
      case 'ln': result = Math.log(n); break
      case 'sqrt': result = Math.sqrt(n); break
      case 'sq': result = n * n; break
      case 'cube': result = n * n * n; break
      default: result = n
    }
    const resultStr = String(Number.isFinite(result) ? Math.round(result * 1e10) / 1e10 : 'Error')
    setExpression(`${fn}(${n})`)
    setDisplay(resultStr)
    setNewNumber(true)
  }, [display])

  const inputPi = useCallback(() => { setDisplay(String(Math.PI)); setJustCalculated(false); setNewNumber(true) }, [])
  const inputE = useCallback(() => { setDisplay(String(Math.E)); setJustCalculated(false); setNewNumber(true) }, [])

  useEffect(() => {
    handlersRef.current = {
      digit: (d: string) => inputDigit(d),
      decimal: inputDecimal,
      'op+': () => handleOp('+'),
      'op-': () => handleOp('-'),
      'op×': () => handleOp('×'),
      'op÷': () => handleOp('÷'),
      equals,
      clear,
      backspace,
      percent,
    }
  })

  const askCakra = () => {
    sessionStorage.setItem('empire-ai-clipboard', JSON.stringify({
      text: `Calculation: ${expression || display}`,
      title: `Calc: ${display}`,
      from: 'calculator',
    }))
    toast.info('Opening Cakra', `Analyzing: ${display}`)
    setTimeout(() => { window.location.href = '/app/ai-chat' }, 200)
  }

  const copyResult = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(display)
      setCopied(true)
      toast.success('Copied to clipboard', display)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      toast.error('Copy failed', 'Clipboard access denied')
    }
  }, [display, toast])

  /* ── Calculator button styles ── */
  const baseBtn: React.CSSProperties = {
    padding: '14px 6px',
    borderRadius: 'var(--radius-lg)',
    fontSize: 'var(--text-sm)',
    fontWeight: 500,
    transition: 'all var(--dur-fast) var(--ease-spring)',
    border: '1px solid transparent',
    cursor: 'pointer',
    userSelect: 'none',
    minHeight: '44px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  }

  const digitStyle: React.CSSProperties = {
    ...baseBtn,
    background: tint('xenon', 4),
    color: 'var(--text)',
    borderColor: tint('xenon', 5),
  }
  const opStyle: React.CSSProperties = {
    ...baseBtn,
    background: tint('ember', 12),
    color: cssVar('ember'),
    borderColor: tint('ember', 18),
  }
  const opActive: React.CSSProperties = {
    ...opStyle,
    background: tint('ember', 28),
    borderColor: tint('ember', 40),
    boxShadow: `0 0 12px ${tint('ember', 25)}`,
  }
  const equalsStyle: React.CSSProperties = {
    ...baseBtn,
    background: `linear-gradient(135deg, ${cssVar('ember')} 0%, color-mix(in srgb, var(--ember) 70%, var(--void)) 100%)`,
    color: cssVar('text'),
    borderColor: tint('ember', 40),
    boxShadow: `0 4px 14px ${tint('ember', 30)}, inset 0 1px 0 ${tint('xenon', 18)}`,
    fontWeight: 600,
  }
  const clearStyle: React.CSSProperties = {
    ...baseBtn,
    background: tint('c-danger', 12),
    color: cssVar('c-danger'),
    borderColor: tint('c-danger', 18),
  }
  const fnStyle = (active: boolean): React.CSSProperties => ({
    ...baseBtn,
    padding: '10px 6px',
    fontSize: 'var(--text-xs)',
    background: active ? tint('signal', 18) : tint('signal', 8),
    color: 'var(--color-cyan-3)',
    borderColor: active ? tint('signal', 35) : tint('signal', 12),
  })

  const onEnter = (setActive?: (b: boolean) => void) => (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.transform = 'translateY(-1px) scale(1.02)'
    e.currentTarget.style.filter = 'brightness(1.15)'
    setActive?.(true)
  }
  const onLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.transform = ''
    e.currentTarget.style.filter = ''
  }
  const onPress = (_style: React.CSSProperties) => (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.transform = 'scale(0.94)'
    e.currentTarget.style.filter = 'brightness(0.92)'
    setTimeout(() => { e.currentTarget.style.transform = ''; e.currentTarget.style.filter = '' }, 100)
  }

  return (
    <div style={{ padding: '16px 20px', maxWidth: '640px', margin: '0 auto', display: 'flex', gap: '14px' }}>
      {/* Calculator pane */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {/* Display */}
        <div
          style={{
            position: 'relative',
            padding: '18px 16px 16px',
            borderRadius: 'var(--radius-xl)',
            background: `linear-gradient(180deg, ${tint('void', 40)}, ${tint('void', 20)})`,
            border: `1px solid ${tint('xenon', 6)}`,
            boxShadow: justCalculated
              ? `0 0 24px ${tint('signal', 15)}, inset 0 1px 0 ${tint('xenon', 5)}`
              : `inset 0 1px 0 ${tint('xenon', 3)}`,
            transition: 'box-shadow var(--dur-mid)',
            textAlign: 'right',
            minHeight: '88px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
          }}
        >
          {/* Top row: expression + actions */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '8px',
              marginBottom: '4px',
              minHeight: '20px',
            }}
          >
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 'var(--text-xs)',
                color: 'var(--text3)',
                flex: 1,
                textAlign: 'right',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                letterSpacing: '0.02em',
              }}
            >
              {expression}
            </div>
            <div style={{ display: 'flex', gap: '2px', flexShrink: 0 }}>
              <button
                onClick={copyResult}
                title={copied ? 'Copied!' : 'Copy result'}
                style={{
                  width: '24px', height: '24px',
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  background: 'transparent',
                  color: copied ? cssVar('c-success') : 'var(--text3)',
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all var(--dur-fast)',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text)'; e.currentTarget.style.background = tint('xenon', 5) }}
                onMouseLeave={(e) => { e.currentTarget.style.color = copied ? cssVar('c-success') : 'var(--text3)'; e.currentTarget.style.background = 'transparent' }}
              >
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              </button>
              {display !== '0' && (
                <button
                  onClick={askCakra}
                  title="Ask Cakra about this result"
                  style={{
                    width: '24px', height: '24px',
                    borderRadius: 'var(--radius-sm)',
                    border: 'none',
                    background: 'transparent',
                    color: 'var(--color-cyan-3)',
                    cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all var(--dur-fast)',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = tint('signal', 10) }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
                >
                  <Sparkles className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Main number */}
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 'var(--text-3xl)',
              fontWeight: 300,
              letterSpacing: '-0.01em',
              color: justCalculated ? 'var(--color-cyan-3)' : 'var(--text)',
              transition: 'color var(--dur-mid)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              lineHeight: 1.1,
            }}
          >
            {display}
          </div>
        </div>

        {/* Scientific row 1 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '6px' }}>
          {[['sin','sin'], ['cos','cos'], ['tan','tan'], ['log','log'], ['ln','ln']].map(([l, fn]) => (
            <button
              key={fn}
              style={fnStyle(false)}
              onClick={() => sciFunc(fn)}
              onMouseEnter={onEnter()}
              onMouseLeave={onLeave}
              onMouseDown={onPress(fnStyle(false))}
            >
              {l}
            </button>
          ))}
        </div>

        {/* Scientific row 2 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '6px' }}>
          {([['x²','sq'], ['x³','cube'], ['√','sqrt'], ['π','pi'], ['e','e']] as const).map(([l, fn]) => (
            <button
              key={l}
              style={fnStyle(false)}
              onClick={() => {
                if (fn === 'pi') inputPi()
                else if (fn === 'e') inputE()
                else sciFunc(fn as string)
              }}
              onMouseEnter={onEnter()}
              onMouseLeave={onLeave}
              onMouseDown={onPress(fnStyle(false))}
            >
              {l}
            </button>
          ))}
        </div>

        {/* Memory row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '6px' }}>
          {[
            { label: 'MS', fn: () => { setMemStore(parseFloat(display) || 0); setMemLabel('M'); toast.success('Memory saved', display) } },
            { label: 'M+', fn: () => { setMemStore((prev: number) => prev + (parseFloat(display) || 0)); setMemLabel('M+') } },
            { label: 'M-', fn: () => { setMemStore((prev: number) => prev - (parseFloat(display) || 0)); setMemLabel('M-') } },
            { label: 'MR', fn: () => { setDisplay(String(memStore)); setNewNumber(true); setJustCalculated(false) } },
            { label: 'MC', fn: () => { setMemStore(0); setMemLabel(''); toast.info('Memory cleared') } },
          ].map(b => (
            <button
              key={b.label}
              style={fnStyle(false)}
              onClick={b.fn}
              onMouseEnter={onEnter()}
              onMouseLeave={onLeave}
              onMouseDown={onPress(fnStyle(false))}
            >
              {b.label}
            </button>
          ))}
        </div>

        {memLabel && (
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-cyan-3)', marginTop: '-4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: 'var(--color-cyan-4)', boxShadow: '0 0 6px var(--color-cyan-4)', animation: 'pulse-ring 1.5s var(--ease-in-out) infinite' }} />
            Memory {memLabel}: {memStore}
          </div>
        )}

        {/* Main buttons */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
          {(['C','±','%','÷'] as const).map(b => (
            <button
              key={b}
              style={b === 'C' ? clearStyle : (b === '÷' ? (op === '÷' ? opActive : opStyle) : digitStyle)}
              onClick={() => {
                if (b === 'C') clear()
                else if (b === '±') toggleSign()
                else if (b === '%') percent()
                else handleOp(b as Op)
              }}
              onMouseEnter={onEnter()}
              onMouseLeave={onLeave}
              onMouseDown={onPress(b === 'C' ? clearStyle : (b === '÷' ? (op === '÷' ? opActive : opStyle) : digitStyle))}
            >
              {b}
            </button>
          ))}

          {([['7','7'],['8','8'],['9','9'],['×','×']] as const).map(([l, v]) => (
            <button
              key={l}
              style={v === '×' ? (op === '×' ? opActive : opStyle) : digitStyle}
              onClick={() => v === '×' ? handleOp('×') : inputDigit(v)}
              onMouseEnter={onEnter()}
              onMouseLeave={onLeave}
              onMouseDown={onPress(v === '×' ? (op === '×' ? opActive : opStyle) : digitStyle)}
            >
              {l}
            </button>
          ))}

          {([['4','4'],['5','5'],['6','6'],['-','-']] as const).map(([l, v]) => (
            <button
              key={l}
              style={v === '-' ? (op === '-' ? opActive : opStyle) : digitStyle}
              onClick={() => v === '-' ? handleOp('-') : inputDigit(v)}
              onMouseEnter={onEnter()}
              onMouseLeave={onLeave}
              onMouseDown={onPress(v === '-' ? (op === '-' ? opActive : opStyle) : digitStyle)}
            >
              {l}
            </button>
          ))}

          {([['1','1'],['2','2'],['3','3'],['+','+']] as const).map(([l, v]) => (
            <button
              key={l}
              style={v === '+' ? (op === '+' ? opActive : opStyle) : digitStyle}
              onClick={() => v === '+' ? handleOp('+') : inputDigit(v)}
              onMouseEnter={onEnter()}
              onMouseLeave={onLeave}
              onMouseDown={onPress(v === '+' ? (op === '+' ? opActive : opStyle) : digitStyle)}
            >
              {l}
            </button>
          ))}

          <button
            style={{ ...baseBtn, background: tint('xenon', 4), color: 'var(--text3)', borderColor: tint('xenon', 5) }}
            onClick={backspace}
            onMouseEnter={onEnter()}
            onMouseLeave={onLeave}
            onMouseDown={onPress(baseBtn)}
            title="Backspace"
          >
            ⌫
          </button>

          {([['0','0'],['.','.']] as const).map(([l, v]) => (
            <button
              key={l}
              style={digitStyle}
              onClick={() => v === '.' ? inputDecimal() : inputDigit(v)}
              onMouseEnter={onEnter()}
              onMouseLeave={onLeave}
              onMouseDown={onPress(digitStyle)}
            >
              {l}
            </button>
          ))}

          <button
            style={equalsStyle}
            onClick={equals}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px) scale(1.02)'; e.currentTarget.style.filter = 'brightness(1.1)' }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = ''; e.currentTarget.style.filter = '' }}
            onMouseDown={(e) => { e.currentTarget.style.transform = 'scale(0.94)'; setTimeout(() => { e.currentTarget.style.transform = '' }, 100) }}
          >
            =
          </button>
        </div>
      </div>

      {/* History sidebar */}
      <div
        className="gp"
        style={{
          width: '160px',
          padding: '12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          alignSelf: 'stretch',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '6px',
          }}
        >
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: 'var(--text-xs)',
              fontWeight: 700,
              color: 'var(--text3)',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
            }}
          >
            <History className="w-3 h-3" />
            History
          </span>
          {history.length > 0 && (
            <button
              onClick={() => { setHistory([]); toast.info('History cleared') }}
              title="Clear history"
              style={{
                padding: '3px',
                borderRadius: 'var(--radius-sm)',
                background: 'transparent',
                border: 'none',
                color: 'var(--text3)',
                cursor: 'pointer',
                display: 'flex',
                transition: 'all var(--dur-fast)',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = cssVar('c-danger'); e.currentTarget.style.background = tint('c-danger', 10) }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text3)'; e.currentTarget.style.background = 'transparent' }}
            >
              <Trash2 className="w-3 h-3" />
            </button>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', overflowY: 'auto', flex: 1, minHeight: 0 }}>
          {history.length === 0 ? (
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text3)', textAlign: 'center', padding: '16px 0', lineHeight: 1.5 }}>
              Calculations you complete will appear here
            </div>
          ) : (
            history.map((h, i) => (
              <button
                key={`${h.expr}-${h.result}-${i}`}
                onClick={() => {
                  setDisplay(h.result)
                  setExpression('')
                  setNewNumber(true)
                  setJustCalculated(false)
                }}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: '6px 8px',
                  borderRadius: 'var(--radius-md)',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'background var(--dur-fast)',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = tint('xenon', 4) }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
              >
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--text3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {h.expr}
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)', color: cssVar('ember'), fontWeight: 500 }}>
                  = {h.result}
                </div>
              </button>
            ))
          )}
        </div>

        {/* Hint */}
        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text3)', paddingTop: '6px', borderTop: `1px solid ${tint('xenon', 4)}`, display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <span>⌨️ Keyboard</span>
          <span style={{ opacity: 0.7 }}>0123456789 + - * / ↵</span>
        </div>
      </div>
    </div>
  )
}
