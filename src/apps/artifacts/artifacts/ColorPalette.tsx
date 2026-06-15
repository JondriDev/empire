/**
 * Artifact 06 — Color Palette
 * Generate harmonious palettes from a base color across 7 color theory modes.
 * Copy HEX, RGB, HSL. Export as CSS variables or Tailwind config.
 * Live accessibility contrast preview on UI mock surfaces.
 */
import { useState, useMemo, useEffect } from 'react'
import {
  Palette, Copy, Check, Download, RotateCcw, Pipette, Sparkles,
  Hash, Eye, Lock, Unlock, Shuffle, Triangle, Square, Circle,
  Layers, Contrast
} from 'lucide-react'

// ─── Color helpers ─────────────────────────────────────────────────
// All math operates in HSL for predictable harmonies. RGB only at the edges.

type RGB = { r: number; g: number; b: number }
type HSL = { h: number; s: number; l: number }

function clamp(n: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, n))
}

function hexToRgb(hex: string): RGB {
  const m = hex.replace('#', '').trim()
  const v = m.length === 3
    ? m.split('').map(c => c + c).join('')
    : m.padEnd(6, '0').slice(0, 6)
  const num = parseInt(v, 16)
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 }
}

function rgbToHex(rgb: RGB): string {
  const toHex = (n: number) => clamp(n, 0, 255).toString(16).padStart(2, '0')
  return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`.toUpperCase()
}

function rgbToHsl(rgb: RGB): HSL {
  const r = rgb.r / 255, g = rgb.g / 255, b = rgb.b / 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  const l = (max + min) / 2
  let h = 0, s = 0
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break
      case g: h = (b - r) / d + 2; break
      case b: h = (r - g) / d + 4; break
    }
    h *= 60
  }
  return { h: Math.round(h), s: Math.round(s * 100), l: Math.round(l * 100) }
}

function hslToRgb({ h, s, l }: HSL): RGB {
  const hh = ((h % 360) + 360) % 360 / 360
  const ss = clamp(s) / 100
  const ll = clamp(l) / 100
  if (ss === 0) {
    const v = Math.round(ll * 255)
    return { r: v, g: v, b: v }
  }
  const hueToRgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1
    if (t > 1) t -= 1
    if (t < 1 / 6) return p + (q - p) * 6 * t
    if (t < 1 / 2) return q
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
    return p
  }
  const q = ll < 0.5 ? ll * (1 + ss) : ll + ss - ll * ss
  const p = 2 * ll - q
  return {
    r: Math.round(hueToRgb(p, q, hh + 1 / 3) * 255),
    g: Math.round(hueToRgb(p, q, hh) * 255),
    b: Math.round(hueToRgb(p, q, hh - 1 / 3) * 255),
  }
}

function hslToHex(hsl: HSL): string {
  return rgbToHex(hslToRgb(hsl))
}

function parseHex(input: string): string | null {
  const cleaned = input.trim().replace('#', '')
  if (!/^[0-9a-fA-F]{3}$|^[0-9a-fA-F]{6}$/.test(cleaned)) return null
  const norm = cleaned.length === 3
    ? cleaned.split('').map(c => c + c).join('')
    : cleaned
  return `#${norm.toUpperCase()}`
}

// Relative luminance for WCAG contrast
function luminance(rgb: RGB): number {
  const f = (c: number) => {
    const v = c / 255
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
  }
  return 0.2126 * f(rgb.r) + 0.7152 * f(rgb.g) + 0.0722 * f(rgb.b)
}

function contrastRatio(a: RGB, b: RGB): number {
  const la = luminance(a), lb = luminance(b)
  const lighter = Math.max(la, lb), darker = Math.min(la, lb)
  return (lighter + 0.05) / (darker + 0.05)
}

// ─── Harmonies ─────────────────────────────────────────────────────

type HarmonyId = 'complementary' | 'analogous' | 'triadic' | 'tetradic' | 'split' | 'monochrome' | 'shades'

interface HarmonyDef {
  id: HarmonyId
  label: string
  icon: any
  blurb: string
  count: number
}

const HARMONIES: HarmonyDef[] = [
  { id: 'analogous',     label: 'Analogous',       icon: Layers,   blurb: 'Neighbouring hues, calm & cohesive', count: 5 },
  { id: 'complementary', label: 'Complementary',   icon: Contrast, blurb: 'Opposite hues, high contrast',       count: 2 },
  { id: 'split',         label: 'Split-Complement', icon: Shuffle, blurb: 'Base + two neighbours of complement', count: 3 },
  { id: 'triadic',       label: 'Triadic',         icon: Triangle,  blurb: 'Three hues evenly spaced',           count: 3 },
  { id: 'tetradic',      label: 'Tetradic',        icon: Square,    blurb: 'Four hues in two complementary pairs', count: 4 },
  { id: 'monochrome',    label: 'Monochrome',      icon: Circle,    blurb: 'Same hue, varied lightness',         count: 5 },
  { id: 'shades',        label: 'Shades',          icon: Sparkles,  blurb: 'Mixed lightness & saturation',       count: 6 },
]

function generateHarmony(base: HSL, id: HarmonyId, count: number): HSL[] {
  const rot = (h: number, deg: number) => (h + deg + 360) % 360
  switch (id) {
    case 'analogous': {
      const span = 30
      const out: HSL[] = []
      for (let i = 0; i < count; i++) {
        const offset = ((i - Math.floor(count / 2)) * span)
        out.push({ h: rot(base.h, offset), s: base.s, l: base.l })
      }
      return out
    }
    case 'complementary': {
      return [
        base,
        { h: rot(base.h, 180), s: base.s, l: base.l },
      ]
    }
    case 'split': {
      return [
        base,
        { h: rot(base.h, 150), s: base.s, l: base.l },
        { h: rot(base.h, 210), s: base.s, l: base.l },
      ]
    }
    case 'triadic': {
      return [
        base,
        { h: rot(base.h, 120), s: base.s, l: base.l },
        { h: rot(base.h, 240), s: base.s, l: base.l },
      ]
    }
    case 'tetradic': {
      return [
        base,
        { h: rot(base.h, 90),  s: base.s, l: base.l },
        { h: rot(base.h, 180), s: base.s, l: base.l },
        { h: rot(base.h, 270), s: base.s, l: base.l },
      ]
    }
    case 'monochrome': {
      // Vary lightness while keeping it perceptual
      const out: HSL[] = []
      const stops = count === 5 ? [20, 35, 50, 65, 80] : [15, 30, 45, 60, 75, 90]
      for (const l of stops.slice(0, count)) {
        out.push({ h: base.h, s: Math.max(20, base.s - Math.abs(l - 50) * 0.4), l })
      }
      return out
    }
    case 'shades': {
      // Mixed exploration across the swatch
      const out: HSL[] = []
      const palette: HSL[] = [
        { ...base, l: 95 },
        { ...base, l: 80 },
        { ...base, l: 65 },
        { h: rot(base.h, 30),  s: base.s, l: base.l },
        { h: rot(base.h, -20), s: base.s, l: 40 },
        { ...base, l: 25 },
      ]
      return palette.slice(0, count)
    }
  }
}

// ─── Copy / export helpers ─────────────────────────────────────────

function formatForExport(swatches: { hex: string; hsl: HSL; rgb: RGB }[]): string {
  return swatches.map((s, i) => {
    return `  --color-${i + 1}: ${s.hex};  /* hsl(${s.hsl.h}, ${s.hsl.s}%, ${s.hsl.l}%)  rgb(${s.rgb.r}, ${s.rgb.g}, ${s.rgb.b}) */`
  }).join('\n')
}

function twConfigForExport(swatches: { hex: string }[]): string {
  const inner = swatches.map((s, i) => `        'brand-${i + 1}': '${s.hex}',`).join('\n')
  return `// tailwind.config.js — extend.colors\nmodule.exports = {\n  theme: {\n    extend: {\n      colors: {\n${inner}\n      },\n    },\n  },\n}\n`
}

function rgbString(rgb: RGB): string {
  return `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`
}

function hslString(hsl: HSL): string {
  return `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`
}

// ─── Component ─────────────────────────────────────────────────────

const STORAGE_BASE = 'empire-artifact-palette-base'
const STORAGE_HARMONY = 'empire-artifact-palette-harmony'
const STORAGE_SAVED = 'empire-artifact-palette-saved'
const STORAGE_LOCKS = 'empire-artifact-palette-locks'

interface SavedPalette {
  id: string
  name: string
  base: string
  harmony: HarmonyId
  created: number
}

const SEED_PALETTES: SavedPalette[] = [
  { id: 's1', name: 'Indigo Sunrise',  base: '#6366F1', harmony: 'analogous',     created: Date.now() - 86_400_000 * 3 },
  { id: 's2', name: 'Cyan Bold',       base: '#06B6D4', harmony: 'complementary', created: Date.now() - 86_400_000 * 2 },
  { id: 's3', name: 'Pink Pop',        base: '#EC4899', harmony: 'triadic',       created: Date.now() - 86_400_000 * 1 },
]

export default function ColorPalette() {
  const [base, setBase] = useState<string>(() => {
    try { return localStorage.getItem(STORAGE_BASE) || '#6366F1' } catch { return '#6366F1' }
  })
  const [harmony, setHarmony] = useState<HarmonyId>(() => {
    try {
      const v = localStorage.getItem(STORAGE_HARMONY)
      if (v && HARMONIES.some(h => h.id === v)) return v as HarmonyId
    } catch {}
    return 'analogous'
  })
  const [hexInput, setHexInput] = useState(base)
  const [inputError, setInputError] = useState<string | null>(null)
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null)
  const [saved, setSaved] = useState<SavedPalette[]>(() => {
    try {
      const v = localStorage.getItem(STORAGE_SAVED)
      if (v) return JSON.parse(v)
    } catch {}
    return SEED_PALETTES
  })
  const [locks, setLocks] = useState<Set<number>>(() => {
    try {
      const v = localStorage.getItem(STORAGE_LOCKS)
      if (v) return new Set(JSON.parse(v))
    } catch {}
    return new Set()
  })
  const [seed, setSeed] = useState(0)  // bump to regenerate non-locked swatches

  // Sync hex input on external base change
  useEffect(() => {
    setHexInput(base)
    setInputError(null)
  }, [base])

  // Persist
  useEffect(() => { try { localStorage.setItem(STORAGE_BASE, base) } catch {} }, [base])
  useEffect(() => { try { localStorage.setItem(STORAGE_HARMONY, harmony) } catch {} }, [harmony])
  useEffect(() => { try { localStorage.setItem(STORAGE_SAVED, JSON.stringify(saved)) } catch {} }, [saved])
  useEffect(() => {
    try { localStorage.setItem(STORAGE_LOCKS, JSON.stringify([...locks])) } catch {}
  }, [locks])

  const baseHsl = useMemo(() => rgbToHsl(hexToRgb(base)), [base])
  const def = HARMONIES.find(h => h.id === harmony)!
  const generated = useMemo(() => generateHarmony(baseHsl, harmony, def.count), [baseHsl, harmony, def.count, seed])

  const swatches = useMemo(() => generated.map((hsl, i) => {
    const rgb = hslToRgb(hsl)
    const hex = hslToHex(hsl)
    return { hex, hsl, rgb, locked: locks.has(i) }
  }), [generated, locks])

  // Pick accessible foreground (white or near-black) for swatch text
  const fgFor = (rgb: RGB) => luminance(rgb) > 0.55 ? '#0F172A' : '#FFFFFF'

  // ─── Handlers ──────────────────────────────

  const handleHexChange = (v: string) => {
    setHexInput(v)
    const parsed = parseHex(v)
    if (parsed) {
      setBase(parsed)
      setInputError(null)
    } else if (v.trim().length > 0) {
      setInputError('Invalid hex (e.g. #6366F1)')
    } else {
      setInputError(null)
    }
  }

  const handleSwatchClick = (idx: number) => {
    if (copiedIdx === idx) return
    const s = swatches[idx]
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(s.hex).catch(() => {})
    }
    setCopiedIdx(idx)
    window.setTimeout(() => setCopiedIdx(null), 1200)
  }

  const handleApplySaved = (p: SavedPalette) => {
    setBase(p.base)
    setHarmony(p.harmony)
    setSeed(s => s + 1)
  }

  const handleSaveCurrent = () => {
    const name = `${def.label} · ${base}`
    setSaved(prev => [
      { id: Math.random().toString(36).slice(2, 9), name, base, harmony, created: Date.now() },
      ...prev,
    ].slice(0, 24))
  }

  const handleDeleteSaved = (id: string) => {
    setSaved(prev => prev.filter(p => p.id !== id))
  }

  const toggleLock = (idx: number) => {
    setLocks(prev => {
      const next = new Set(prev)
      if (next.has(idx)) next.delete(idx)
      else next.add(idx)
      return next
    })
  }

  const handleRandomize = () => {
    const h = Math.floor(Math.random() * 360)
    const s = 55 + Math.floor(Math.random() * 35)
    const l = 40 + Math.floor(Math.random() * 25)
    setBase(hslToHex({ h, s, l }))
    setSeed(s => s + 1)
  }

  const handleExport = (kind: 'css' | 'tw') => {
    const text = kind === 'css'
      ? `:root {\n${formatForExport(swatches)}\n}\n`
      : twConfigForExport(swatches)
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = kind === 'css' ? 'palette.css' : 'tailwind.colors.js'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleExportJson = () => {
    const data = {
      base,
      harmony,
      generatedAt: new Date().toISOString(),
      swatches: swatches.map(s => ({
        hex: s.hex,
        rgb: s.rgb,
        hsl: s.hsl,
      })),
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'palette.json'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-950 via-violet-950/20 to-slate-950 text-white overflow-hidden">
      {/* ─── Toolbar ────────────────────────────── */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/10 bg-black/30 backdrop-blur-sm">
        <div className="flex items-center gap-2 mr-2">
          <Palette size={16} className="text-violet-300" />
          <span className="font-bold tracking-tight">Color Palette</span>
          <span className="text-[10px] uppercase tracking-[0.18em] text-violet-400/70 font-mono">artifact 06</span>
        </div>

        <div className="flex-1" />

        <button
          onClick={handleRandomize}
          title="Randomize base color"
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs transition-colors"
        >
          <Shuffle size={12} /> Random
        </button>
        <button
          onClick={handleSaveCurrent}
          title="Save current palette"
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs transition-colors"
        >
          <Sparkles size={12} /> Save
        </button>
        <div className="w-px h-5 bg-white/10 mx-1" />
        <button
          onClick={() => handleExport('css')}
          title="Export as CSS variables"
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs transition-colors"
        >
          <Download size={12} /> CSS
        </button>
        <button
          onClick={handleExportJson}
          title="Export as JSON"
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs transition-colors"
        >
          <Hash size={12} /> JSON
        </button>
      </div>

      {/* ─── Scrollable body ────────────────────── */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-5xl mx-auto px-6 py-6 space-y-6">
          {/* Base color input + harmony picker */}
          <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4">
            {/* Base picker card */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-[0.18em] text-slate-400 font-semibold flex items-center gap-1.5">
                  <Pipette size={12} /> Base color
                </span>
              </div>

              <div className="flex items-center gap-3">
                <label className="relative shrink-0 cursor-pointer group">
                  <div
                    className="w-16 h-16 rounded-xl border border-white/20 shadow-lg transition-transform group-hover:scale-105"
                    style={{ background: base }}
                  />
                  <input
                    type="color"
                    value={base}
                    onChange={e => setBase(e.target.value.toUpperCase())}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    title="Pick a color"
                  />
                </label>
                <div className="flex-1 min-w-0 space-y-1.5">
                  <input
                    type="text"
                    value={hexInput}
                    onChange={e => handleHexChange(e.target.value)}
                    placeholder="#6366F1"
                    spellCheck={false}
                    className={`w-full px-3 py-2 rounded-lg bg-black/40 border font-mono text-sm uppercase tracking-wide outline-none transition-colors ${
                      inputError
                        ? 'border-rose-500/50 focus:border-rose-400'
                        : 'border-white/10 focus:border-violet-400/60'
                    }`}
                  />
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
                    <span>HSL {baseHsl.h}°, {baseHsl.s}%, {baseHsl.l}%</span>
                    <span>RGB {hexToRgb(base).r},{hexToRgb(base).g},{hexToRgb(base).b}</span>
                  </div>
                  {inputError && (
                    <div className="text-[10px] text-rose-400">{inputError}</div>
                  )}
                </div>
              </div>

              <button
                onClick={handleRandomize}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-violet-500/10 hover:bg-violet-500/20 border border-violet-400/30 text-violet-200 text-xs font-medium transition-colors"
              >
                <Shuffle size={12} /> Surprise me
              </button>
            </div>

            {/* Harmony picker */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur p-4">
              <div className="text-xs uppercase tracking-[0.18em] text-slate-400 font-semibold mb-3">
                Harmony
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                {HARMONIES.map(h => {
                  const Icon = h.icon
                  const active = h.id === harmony
                  return (
                    <button
                      key={h.id}
                      onClick={() => { setHarmony(h.id); setSeed(s => s + 1) }}
                      className={`text-left px-3 py-2.5 rounded-xl border transition-all ${
                        active
                          ? 'bg-violet-500/15 border-violet-400/50 shadow-[0_0_0_1px_rgba(167,139,250,0.2)]'
                          : 'border-white/10 bg-black/20 hover:bg-black/40 hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Icon size={14} className={active ? 'text-violet-300' : 'text-slate-400'} />
                        <span className={`text-xs font-semibold ${active ? 'text-white' : 'text-slate-300'}`}>
                          {h.label}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5 leading-tight">{h.blurb}</div>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* ─── Generated palette ──────────────────── */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur p-5">
            <div className="flex items-end justify-between mb-4">
              <div>
                <div className="text-xs uppercase tracking-[0.18em] text-slate-400 font-semibold">
                  Generated · {def.label}
                </div>
                <div className="text-sm text-slate-500 mt-0.5">
                  Tap a swatch to copy its HEX · click the lock to keep it across regenerations
                </div>
              </div>
              <div className="text-[10px] text-slate-500 font-mono">
                {swatches.length} colors {locks.size > 0 ? `· ${locks.size} locked` : ''}
              </div>
            </div>

            <div
              className="grid gap-2 rounded-xl overflow-hidden border border-white/10"
              style={{ gridTemplateColumns: `repeat(${swatches.length}, minmax(0, 1fr))` }}
            >
              {swatches.map((s, i) => {
                const fg = fgFor(s.rgb)
                const isCopied = copiedIdx === i
                return (
                  <button
                    key={i}
                    onClick={() => handleSwatchClick(i)}
                    className="group relative h-44 sm:h-52 flex flex-col justify-between p-3 text-left transition-all hover:scale-[1.02] hover:z-10 hover:shadow-2xl focus:outline-none focus:ring-2 focus:ring-white/40"
                    style={{ background: s.hex, color: fg }}
                    title={`${s.hex} · click to copy`}
                  >
                    {/* Top: copy indicator */}
                    <div className="flex items-start justify-between">
                      <span
                        className="px-1.5 py-0.5 rounded text-[10px] font-mono opacity-60 group-hover:opacity-100 transition-opacity"
                        style={{
                          background: fg === '#FFFFFF' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)',
                        }}
                      >
                        #{i + 1}
                      </span>
                      {isCopied ? (
                        <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider">
                          <Check size={11} /> Copied
                        </span>
                      ) : (
                        <Copy size={12} className="opacity-0 group-hover:opacity-70 transition-opacity" />
                      )}
                    </div>

                    {/* Bottom: hex + lock */}
                    <div className="space-y-0.5">
                      <div className="font-mono text-sm font-bold tracking-wide">
                        {s.hex}
                      </div>
                      <div className="font-mono text-[10px] opacity-70 leading-tight">
                        {hslString(s.hsl)}
                      </div>
                      <div className="font-mono text-[10px] opacity-60 leading-tight">
                        {rgbString(s.rgb)}
                      </div>
                    </div>

                    {/* Lock button (corner) */}
                    <span
                      onClick={(e) => { e.stopPropagation(); toggleLock(i) }}
                      className="absolute top-2 right-7 p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                      style={{
                        background: fg === '#FFFFFF' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)',
                      }}
                      title={s.locked ? 'Unlock' : 'Lock'}
                    >
                      {s.locked ? <Lock size={11} /> : <Unlock size={11} className="opacity-60" />}
                    </span>

                    {s.locked && (
                      <span
                        className="absolute top-2 right-7 p-1 rounded"
                        style={{
                          background: fg === '#FFFFFF' ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.25)',
                        }}
                      >
                        <Lock size={11} />
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* ─── Live accessibility preview ──────────── */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur p-5">
            <div className="flex items-end justify-between mb-4">
              <div>
                <div className="text-xs uppercase tracking-[0.18em] text-slate-400 font-semibold flex items-center gap-2">
                  <Eye size={12} /> Live Preview · Contrast Lab
                </div>
                <div className="text-sm text-slate-500 mt-0.5">
                  See how your palette performs on buttons, cards, and text — with WCAG ratios
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Sample card */}
              <div
                className="rounded-xl p-5 border"
                style={{
                  background: swatches[2]?.hex || '#1e293b',
                  color: fgFor(swatches[2]?.rgb || { r: 30, g: 30, b: 30 }),
                  borderColor: 'rgba(255,255,255,0.1)',
                }}
              >
                <div className="text-xs uppercase tracking-wider opacity-70 mb-1">Imperial</div>
                <div className="text-lg font-bold mb-2">Color Palette</div>
                <p className="text-sm opacity-80 leading-relaxed mb-4">
                  Generative harmonies for designers — copy, lock, and export ready-to-use palettes.
                </p>
                <div className="flex gap-2">
                  <button
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold"
                    style={{
                      background: swatches[0]?.hex || '#6366f1',
                      color: fgFor(swatches[0]?.rgb || { r: 99, g: 102, b: 241 }),
                    }}
                  >
                    Primary
                  </button>
                  <button
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold border"
                    style={{
                      borderColor: fgFor(swatches[2]?.rgb || { r: 30, g: 30, b: 30 }),
                      background: 'transparent',
                      color: fgFor(swatches[2]?.rgb || { r: 30, g: 30, b: 30 }),
                    }}
                  >
                    Secondary
                  </button>
                </div>
              </div>

              {/* Contrast ratio table */}
              <div className="rounded-xl border border-white/10 bg-black/30 overflow-hidden">
                <div className="px-4 py-2 text-[10px] uppercase tracking-[0.18em] text-slate-400 font-semibold border-b border-white/10 bg-black/40">
                  Contrast against base
                </div>
                <div className="divide-y divide-white/5">
                  {swatches.map((s, i) => {
                    const ratio = contrastRatio(s.rgb, hexToRgb(base))
                    const aa = ratio >= 4.5
                    const aaa = ratio >= 7
                    return (
                      <div key={i} className="flex items-center gap-3 px-3 py-2 text-xs">
                        <div
                          className="w-6 h-6 rounded shrink-0 border border-white/10"
                          style={{ background: s.hex }}
                        />
                        <span className="font-mono opacity-80 w-20">{s.hex}</span>
                        <span className="font-mono opacity-60 w-12">#{i + 1}</span>
                        <span className="flex-1" />
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${aa ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-400/30' : 'bg-rose-500/15 text-rose-300 border border-rose-400/30'}`}>
                          AA
                        </span>
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${aaa ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-400/30' : 'bg-slate-500/10 text-slate-500 border border-white/5'}`}>
                          AAA
                        </span>
                        <span className="font-mono opacity-70 w-12 text-right">{ratio.toFixed(1)}:1</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* ─── Saved palettes ─────────────────────── */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-xs uppercase tracking-[0.18em] text-slate-400 font-semibold flex items-center gap-2">
                  <Sparkles size={12} /> Saved Palettes
                </div>
                <div className="text-sm text-slate-500 mt-0.5">
                  Click to restore · saved locally to your browser
                </div>
              </div>
              <span className="text-[10px] text-slate-500 font-mono">{saved.length}</span>
            </div>

            {saved.length === 0 ? (
              <div className="rounded-xl border border-dashed border-white/10 p-8 text-center text-xs text-slate-500">
                No saved palettes yet. Generate one above and click <span className="text-violet-300">Save</span>.
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {saved.map(p => {
                  const r = renderSavedPreview(p)
                  return (
                    <div
                      key={p.id}
                      className="group relative rounded-xl overflow-hidden border border-white/10 bg-black/30 hover:border-white/20 transition-colors"
                    >
                      <button
                        onClick={() => handleApplySaved(p)}
                        className="block w-full text-left"
                      >
                        <div className="flex h-12">
                          {r.map((c, i) => (
                            <div key={i} className="flex-1" style={{ background: c }} />
                          ))}
                        </div>
                        <div className="px-3 py-2">
                          <div className="text-xs font-semibold truncate">{p.name}</div>
                          <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                            {p.base} · {p.harmony}
                          </div>
                        </div>
                      </button>
                      <button
                        onClick={() => handleDeleteSaved(p.id)}
                        title="Remove"
                        className="absolute top-1.5 right-1.5 p-1 rounded bg-black/40 hover:bg-rose-500/40 text-white/60 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <RotateCcw size={11} />
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="text-center text-[10px] text-slate-600 font-mono">
            All math runs in your browser · palettes saved to localStorage
          </div>
        </div>
      </div>
    </div>
  )

  // Helper rendered inline to avoid hoisting issues
  function renderSavedPreview(p: SavedPalette): string[] {
    const sw = generateHarmony(rgbToHsl(hexToRgb(p.base)), p.harmony, HARMONIES.find(h => h.id === p.harmony)?.count || 5)
    return sw.map(s => hslToHex(s))
  }
}
