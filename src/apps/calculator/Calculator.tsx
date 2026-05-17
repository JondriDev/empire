/**
 * Calculator — emits results to eventBus, Hermes-aware
 */

import { useState, useCallback, useEffect, useRef } from 'react'
import { Bot } from 'lucide-react'
import { emit } from '../../lib/eventBus'

type Op = '+' | '-' | '×' | '÷' | '^' | null

export default function Calculator() {
  const [display, setDisplay] = useState('0')
  const [expression, setExpression] = useState('')
  const [memory, setMemory] = useState<number | null>(null)
  const [op, setOp] = useState<Op>(null)
  const [history, setHistory] = useState<{ expr: string; result: string }[]>([])
  const [newNumber, setNewNumber] = useState(true)
  const handlersRef = useRef({} as Record<string, (...args: any[]) => void>)

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
    if (newNumber) { setDisplay(d); setNewNumber(false) }
    else setDisplay(prev => prev === '0' ? d : prev + d)
  }, [newNumber])

  const inputDecimal = useCallback(() => {
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
    const num = parseFloat(display)
    if (memory === null) setMemory(num)
    else if (op) {
      const result = calculate(memory, num, op)
      setMemory(result)
      setDisplay(String(result))
    }
    setOp(nextOp)
    setNewNumber(true)
    if (op) setExpression(`${memory} ${op} ${num} ${nextOp || ''}`)
    else setExpression(`${num} ${nextOp || ''}`)
  }, [display, memory, op])

  const equals = useCallback(() => {
    const num = parseFloat(display)
    if (memory !== null && op) {
      const result = calculate(memory, num, op)
      const expr = `${memory} ${op} ${num} =`
      const resultStr = String(result)
      setHistory(prev => [{ expr, result: resultStr }, ...prev].slice(0, 20))
      // Emit event for other apps
      emit({ type: 'CALCULATION_RESULT', expression: `${memory} ${op} ${num}`, result: resultStr })
      setDisplay(resultStr)
      setExpression('')
      setMemory(null)
      setOp(null)
      setNewNumber(true)
    }
  }, [display, memory, op])

  const clear = useCallback(() => {
    setDisplay('0'); setExpression(''); setMemory(null); setOp(null); setNewNumber(true)
  }, [])

  const backspace = useCallback(() => {
    if (display.length > 1) setDisplay(prev => prev.slice(0, -1))
    else setDisplay('0')
  }, [display])

  const toggleSign = useCallback(() => setDisplay(prev => String(-parseFloat(prev))), [])
  const percent = useCallback(() => setDisplay(prev => String(parseFloat(prev) / 100)), [])

  const sciFunc = useCallback((fn: string) => {
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
    setExpression(`${fn}(${n})`)
    setDisplay(String(Number.isFinite(result) ? Math.round(result * 1e10) / 1e10 : 'Error'))
    setNewNumber(true)
  }, [display])

  const inputPi = useCallback(() => setDisplay(String(Math.PI)), [])
  const inputE = useCallback(() => setDisplay(String(Math.E)), [])

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

  const askHermes = () => {
    sessionStorage.setItem('empire-ai-clipboard', JSON.stringify({
      text: `Calculation: ${expression} ${display}`,
      title: `Calc: ${display}`,
      from: 'calculator',
    }))
    window.location.href = '/app/ai-chat'
  }

  const btnClass = "px-3 py-3 rounded-xl text-sm font-medium transition-all duration-100 active:scale-95 select-none"

  return (
    <div className="p-4 md:p-6 max-w-md mx-auto">
      <div className="flex gap-4">
        <div className="flex-1">
          {/* Display */}
          <div className="bg-black/30 rounded-2xl p-4 mb-4 text-right border border-white/5">
            <div className="flex items-center justify-between mb-1">
              <span className="text-gray-500 text-xs">{expression}</span>
              {display !== '0' && (
                <button onClick={askHermes} className="p-1 rounded-lg hover:bg-purple-500/20 text-purple-400 transition-colors" title="Ask Hermes about this result">
                  <Bot className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <div className="text-3xl font-light tracking-wider overflow-hidden text-ellipsis">{display}</div>
          </div>

          {/* Scientific row */}
          <div className="grid grid-cols-5 gap-1.5 mb-2">
            {[['sin','sin'], ['cos','cos'], ['tan','tan'], ['log','log'], ['ln','ln']].map(([l, fn]) => (
              <button key={fn} onClick={() => sciFunc(fn)} className={`${btnClass} bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 text-xs`}>{l}</button>
            ))}
          </div>
          <div className="grid grid-cols-5 gap-1.5 mb-3">
            {[['x²','sq'], ['x³','cube'], ['√','sqrt'], ['π','pi'], ['e','e']].map(([l, fn]) => (
              <button key={fn} onClick={() => fn === 'pi' ? inputPi() : fn === 'e' ? inputE() : sciFunc(fn)} className={`${btnClass} bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 text-xs`}>{l}</button>
            ))}
          </div>

          {/* Main buttons */}
          <div className="grid grid-cols-4 gap-1.5">
            {['C','±','%','÷'].map(b => (
              <button key={b} onClick={() => b === 'C' ? clear() : b === '±' ? toggleSign() : b === '%' ? percent() : handleOp('÷')} className={`${btnClass} ${'÷%'.includes(b) ? 'bg-orange-500/20 text-orange-300 hover:bg-orange-500/30' : b === 'C' ? 'bg-red-500/20 text-red-300 hover:bg-red-500/30' : 'bg-white/5 hover:bg-white/10'}`}>{b}</button>
            ))}
            {[['7','7'],['8','8'],['9','9'],['×','×']].map(([l, v]) => (
              <button key={l} onClick={() => v === '×' ? handleOp('×') : inputDigit(v)} className={`${btnClass} ${v === '×' ? 'bg-orange-500/20 text-orange-300 hover:bg-orange-500/30' : 'bg-white/5 hover:bg-white/10'}`}>{l}</button>
            ))}
            {[['4','4'],['5','5'],['6','6'],['-','-']].map(([l, v]) => (
              <button key={l} onClick={() => v === '-' ? handleOp('-') : inputDigit(v)} className={`${btnClass} ${v === '-' ? 'bg-orange-500/20 text-orange-300 hover:bg-orange-500/30' : 'bg-white/5 hover:bg-white/10'}`}>{l}</button>
            ))}
            {[['1','1'],['2','2'],['3','3'],['+','+']].map(([l, v]) => (
              <button key={l} onClick={() => v === '+' ? handleOp('+') : inputDigit(v)} className={`${btnClass} ${v === '+' ? 'bg-orange-500/20 text-orange-300 hover:bg-orange-500/30' : 'bg-white/5 hover:bg-white/10'}`}>{l}</button>
            ))}
            <button onClick={backspace} className={`${btnClass} bg-white/5 hover:bg-white/10 text-gray-300`}>⌫</button>
            {[['0','0'],['.','.']].map(([l, v]) => (
              <button key={l} onClick={() => v === '.' ? inputDecimal() : inputDigit(v)} className={`${btnClass} bg-white/5 hover:bg-white/10`}>{l}</button>
            ))}
            <button onClick={equals} className={`${btnClass} bg-orange-500/30 text-orange-300 hover:bg-orange-500/40`}>=</button>
          </div>
        </div>

        {/* History sidebar */}
        <div className="w-36 bg-white/5 rounded-2xl p-3 border border-white/5 hidden sm:block">
          <h3 className="text-xs text-gray-400 mb-2 font-medium">History</h3>
          <div className="space-y-1 overflow-auto max-h-[400px]">
            {history.length === 0 && <p className="text-gray-600 text-xs">No calculations yet</p>}
            {history.map((h, i) => (
              <button
                key={i}
                onClick={() => {
                  setDisplay(h.result)
                  setExpression('')
                  setNewNumber(true)
                }}
                className="w-full text-left py-1 border-b border-white/5 last:border-0 hover:bg-white/5 rounded px-1 transition-colors"
              >
                <div className="text-xs text-gray-500">{h.expr}</div>
                <div className="text-xs text-orange-300 font-medium">{h.result}</div>
              </button>
            ))}
          </div>
          {history.length > 0 && (
            <button onClick={() => setHistory([])} className="text-xs text-red-400 mt-2 hover:text-red-300">Clear</button>
          )}
        </div>
      </div>
    </div>
  )
}