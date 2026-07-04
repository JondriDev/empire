/**
 * Artifact 02 — Chart Builder
 * Live chart sandbox. Type data, see bars/lines/areas, export SVG.
 */
import { useState, useMemo } from 'react'
import { BarChart3, LineChart as LineIcon, PieChart as PieIcon, Plus, Trash2, Shuffle, Download } from 'lucide-react'
import { CATEGORICAL, cssVar, tint } from '../../../design-system/tokens'

type ChartType = 'bar' | 'line' | 'pie'

interface Datum { label: string; value: number }

const COLORS = CATEGORICAL

const seed = (n = 6): Datum[] => [
  { label: 'Jan', value: 32 },
  { label: 'Feb', value: 58 },
  { label: 'Mar', value: 41 },
  { label: 'Apr', value: 79 },
  { label: 'May', value: 67 },
  { label: 'Jun', value: 92 },
].slice(0, n)

export default function ChartBuilder() {
  const [type, setType] = useState<ChartType>('bar')
  const [data, setData] = useState<Datum[]>(seed())
  const [title, setTitle] = useState('Monthly Revenue')

  const max = useMemo(() => Math.max(1, ...data.map(d => d.value)), [data])
  const total = useMemo(() => data.reduce((s, d) => s + d.value, 0), [data])

  const update = (i: number, patch: Partial<Datum>) => {
    setData(data.map((d, idx) => idx === i ? { ...d, ...patch } : d))
  }
  const addRow = () => setData([...data, { label: 'Item ' + (data.length + 1), value: Math.floor(Math.random() * 80 + 10) }])
  const removeRow = (i: number) => setData(data.filter((_, idx) => idx !== i))
  const randomize = () => setData(data.map(d => ({ ...d, value: Math.floor(Math.random() * 90 + 10) })))

  const exportSVG = () => {
    const svg = document.getElementById('chart-svg')
    if (!svg) return
    const serializer = new XMLSerializer()
    const source = serializer.serializeToString(svg)
    const blob = new Blob([source], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${title.replace(/\s+/g, '-').toLowerCase()}-chart.svg`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-void via-signal/20 to-void text-fg overflow-hidden">
      <div className="px-6 py-4 border-b border-hair flex items-center justify-between bg-void/20 backdrop-blur">
        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          className="bg-transparent text-2xl font-bold outline-none focus:bg-glass px-2 py-1 rounded"
        />
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-glass rounded-lg p-1 border border-hair">
            {(['bar', 'line', 'pie'] as ChartType[]).map(t => {
              const Icon = t === 'bar' ? BarChart3 : t === 'line' ? LineIcon : PieIcon
              return (
                <button
                  key={t}
                  onClick={() => setType(t)}
                  className={`px-3 py-1.5 rounded-md text-sm flex items-center gap-1.5 transition ${type === t ? 'bg-ion/30 text-ion' : 'text-muted hover:text-fg'}`}
                >
                  <Icon size={14} /> {t}
                </button>
              )
            })}
          </div>
          <button onClick={randomize} className="px-3 py-1.5 rounded-lg bg-glass hover:bg-glass border border-hair text-sm flex items-center gap-2">
            <Shuffle size={14} /> Randomize
          </button>
          <button onClick={exportSVG} className="px-3 py-1.5 rounded-lg bg-success/20 text-success border border-success/30 text-sm flex items-center gap-2 hover:bg-success/30">
            <Download size={14} /> SVG
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Data editor */}
        <div className="w-72 border-r border-hair bg-void/20 p-4 overflow-auto">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs uppercase tracking-wider text-faint font-semibold">Data Points</h3>
            <button onClick={addRow} className="text-ion hover:text-ion"><Plus size={14} /></button>
          </div>
          <div className="space-y-2">
            {data.map((d, i) => (
              <div key={i} className="flex items-center gap-2 group">
                <div className="w-3 h-3 rounded-sm" style={{ background: COLORS[i % COLORS.length] }} />
                <input
                  value={d.label}
                  onChange={e => update(i, { label: e.target.value })}
                  className="bg-glass px-2 py-1 rounded text-sm flex-1 outline-none focus:bg-glass"
                />
                <input
                  type="number"
                  value={d.value}
                  onChange={e => update(i, { value: Number(e.target.value) || 0 })}
                  className="bg-glass px-2 py-1 rounded text-sm w-16 outline-none focus:bg-glass"
                />
                <button onClick={() => removeRow(i)} className="text-danger/50 hover:text-danger opacity-0 group-hover:opacity-100 transition">
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>
          <div className="mt-6 pt-4 border-t border-hair text-xs text-muted space-y-1">
            <div className="flex justify-between"><span>Total</span><span className="text-fg font-mono">{total}</span></div>
            <div className="flex justify-between"><span>Max</span><span className="text-fg font-mono">{max}</span></div>
            <div className="flex justify-between"><span>Avg</span><span className="text-fg font-mono">{data.length ? Math.round(total / data.length) : 0}</span></div>
            <div className="flex justify-between"><span>Min</span><span className="text-fg font-mono">{Math.min(...data.map(d => d.value))}</span></div>
          </div>
        </div>

        {/* Chart canvas */}
        <div className="flex-1 p-8 overflow-auto flex items-center justify-center">
          {type === 'bar' && (
            <svg id="chart-svg" viewBox="0 0 800 500" className="w-full h-full max-w-4xl">
              <text x="400" y="30" textAnchor="middle" className="fill-fg" style={{ fontSize: 'var(--text-2xl)', fontWeight: 700 }}>{title}</text>
              {/* y axis grid */}
              {[0, 0.25, 0.5, 0.75, 1].map((p, i) => {
                const y = 380 - p * 320
                return (
                  <g key={i}>
                    <line x1="60" y1={y} x2="780" y2={y} stroke={tint('xenon', 6)} />
                    <text x="50" y={y + 4} textAnchor="end" className="fill-faint" style={{ fontSize: 'var(--text-xs)' }}>{Math.round(max * p)}</text>
                  </g>
                )
              })}
              {data.map((d, i) => {
                const w = (780 - 60) / data.length - 20
                const x = 60 + i * ((780 - 60) / data.length) + 10
                const h = (d.value / max) * 320
                const y = 380 - h
                return (
                  <g key={i}>
                    <rect x={x} y={y} width={w} height={h} rx="6" fill={COLORS[i % COLORS.length]} opacity="0.85">
                      <title>{d.label}: {d.value}</title>
                    </rect>
                    <text x={x + w / 2} y={400} textAnchor="middle" className="fill-muted" style={{ fontSize: 'var(--text-sm)' }}>{d.label}</text>
                    <text x={x + w / 2} y={y - 6} textAnchor="middle" className="fill-fg" style={{ fontSize: 'var(--text-xs)', fontWeight: 600 }}>{d.value}</text>
                  </g>
                )
              })}
            </svg>
          )}
          {type === 'line' && (
            <svg id="chart-svg" viewBox="0 0 800 500" className="w-full h-full max-w-4xl">
              <text x="400" y="30" textAnchor="middle" className="fill-fg" style={{ fontSize: 'var(--text-2xl)', fontWeight: 700 }}>{title}</text>
              <defs>
                <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={cssVar('signal')} stopOpacity="0.6" />
                  <stop offset="100%" stopColor={cssVar('signal')} stopOpacity="0" />
                </linearGradient>
              </defs>
              {[0, 0.25, 0.5, 0.75, 1].map((p, i) => {
                const y = 380 - p * 320
                return (
                  <g key={i}>
                    <line x1="60" y1={y} x2="780" y2={y} stroke={tint('xenon', 6)} />
                    <text x="50" y={y + 4} textAnchor="end" className="fill-faint" style={{ fontSize: 'var(--text-xs)' }}>{Math.round(max * p)}</text>
                  </g>
                )
              })}
              {(() => {
                const stepX = (780 - 60) / (data.length - 1 || 1)
                const points = data.map((d, i) => [60 + i * stepX, 380 - (d.value / max) * 320])
                const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p[0]} ${p[1]}`).join(' ')
                const areaPath = `${path} L ${points[points.length - 1][0]} 380 L ${points[0][0]} 380 Z`
                return (
                  <>
                    <path d={areaPath} fill="url(#lineGrad)" />
                    <path d={path} fill="none" stroke={cssVar('signal')} strokeWidth="3" strokeLinejoin="round" />
                    {points.map((p, i) => (
                      <g key={i}>
                        <circle cx={p[0]} cy={p[1]} r="5" fill="white" stroke={cssVar('signal')} strokeWidth="2">
                          <title>{data[i].label}: {data[i].value}</title>
                        </circle>
                        <text x={p[0]} y={400} textAnchor="middle" className="fill-muted" style={{ fontSize: 'var(--text-sm)' }}>{data[i].label}</text>
                      </g>
                    ))}
                  </>
                )
              })()}
            </svg>
          )}
          {type === 'pie' && (() => {
            let acc = 0
            const cx = 400, cy = 270, r = 160
            return (
              <svg id="chart-svg" viewBox="0 0 800 500" className="w-full h-full max-w-4xl">
                <text x="400" y="30" textAnchor="middle" className="fill-fg" style={{ fontSize: 'var(--text-2xl)', fontWeight: 700 }}>{title}</text>
                {data.map((d, i) => {
                  const start = (acc / total) * Math.PI * 2 - Math.PI / 2
                  acc += d.value
                  const end = (acc / total) * Math.PI * 2 - Math.PI / 2
                  const large = end - start > Math.PI ? 1 : 0
                  const x1 = cx + r * Math.cos(start)
                  const y1 = cy + r * Math.sin(start)
                  const x2 = cx + r * Math.cos(end)
                  const y2 = cy + r * Math.sin(end)
                  return (
                    <path
                      key={i}
                      d={`M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`}
                      fill={COLORS[i % COLORS.length]}
                      stroke={tint('void', 40)}
                      strokeWidth="2"
                    >
                      <title>{d.label}: {d.value} ({Math.round((d.value / total) * 100)}%)</title>
                    </path>
                  )
                })}
                <g>
                  {data.map((d, i) => {
                    const acc2 = data.slice(0, i).reduce((s, x) => s + x.value, 0)
                    const mid = ((acc2 + d.value / 2) / total) * Math.PI * 2 - Math.PI / 2
                    const lx = cx + (r * 0.6) * Math.cos(mid)
                    const ly = cy + (r * 0.6) * Math.sin(mid)
                    return (
                      <text key={i} x={lx} y={ly} textAnchor="middle" className="fill-fg" style={{ fontSize: 'var(--text-sm)', fontWeight: 700 }}>
                        {Math.round((d.value / total) * 100)}%
                      </text>
                    )
                  })}
                </g>
              </svg>
            )
          })()}
        </div>
      </div>
    </div>
  )
}
