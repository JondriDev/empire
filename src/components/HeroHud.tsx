/**
 * HeroHud — Empire command-center centerpiece.
 *
 * Fills the previously-empty desktop with a futuristic HUD: an animated
 * reactor core, a large monospace clock, a time-aware greeting, and a row
 * of live system status chips. Purely presentational; no app state is
 * mutated here.
 */
import { Sparkles, Activity, Layers, Cpu } from 'lucide-react'

interface HeroHudProps {
  clock: Date
  appCount: number
  runningCount: number
}

function greeting(hour: number): string {
  if (hour < 5) return 'Good night'
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

export default function HeroHud({ clock, appCount, runningCount }: HeroHudProps) {
  const hours = clock.getHours()
  const seconds = clock.getSeconds()
  const hh = String(hours % 12 || 12).padStart(2, '0')
  const mm = String(clock.getMinutes()).padStart(2, '0')
  const ss = String(seconds).padStart(2, '0')
  const ampm = hours < 12 ? 'AM' : 'PM'
  const dateLabel = clock.toLocaleDateString([], {
    weekday: 'long', month: 'long', day: 'numeric',
  })

  // Subtle, deterministic "live" readout so the HUD feels alive without jitter.
  const coreIntegrity = 97 + (seconds % 3)

  return (
    <div className="empire-hero" aria-hidden="false">
      {/* Reactor core */}
      <div className="hud-core" role="img" aria-label="Cakra core">
        <div className="hud-core-ticks" />
        <div className="hud-core-sweep" />
        <div className="hud-ring hud-ring-1" />
        <div className="hud-ring hud-ring-2" />
        <div className="hud-ring hud-ring-3" />
        <div className="hud-core-orb">
          <Sparkles className="w-8 h-8" strokeWidth={1.75} />
        </div>
      </div>

      {/* Clock */}
      <div className="hud-clock" aria-label={`${hh}:${mm} ${ampm}`}>
        <span className="hud-clock-time">{hh}<span className="hud-colon">:</span>{mm}</span>
        <div className="hud-clock-meta">
          <span className="hud-clock-sec">{ss}</span>
          <span className="hud-clock-ampm">{ampm}</span>
        </div>
      </div>

      {/* Greeting + date */}
      <div className="hud-greeting">
        <span className="hud-greeting-line">{greeting(hours)}, Commander</span>
        <span className="hud-date">{dateLabel}</span>
      </div>

      {/* Live status chips */}
      <div className="hud-chips">
        <div className="hud-chip hud-chip-live">
          <span className="hud-pulse-dot" />
          <Activity className="w-3.5 h-3.5" />
          <span>System Online</span>
        </div>
        <div className="hud-chip">
          <Layers className="w-3.5 h-3.5" />
          <span>{appCount} Apps</span>
        </div>
        <div className="hud-chip">
          <Sparkles className="w-3.5 h-3.5" />
          <span>{runningCount} Active</span>
        </div>
        <div className="hud-chip">
          <Cpu className="w-3.5 h-3.5" />
          <span>Core {coreIntegrity}%</span>
        </div>
      </div>
    </div>
  )
}
