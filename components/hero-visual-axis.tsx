"use client"

import { motion, useReducedMotion, type MotionValue } from "framer-motion"
import { useEffect, useMemo, useRef, useState } from "react"
import { cn } from "@/lib/utils"

type Style = {
  translateX?: MotionValue<number> | number
  translateY?: MotionValue<number> | number
  rotate?: MotionValue<number> | number
  scale?: MotionValue<number> | number
  opacity?: MotionValue<number> | number
}

export default function HeroVisualAxis({
  className = "",
  style,
}: {
  className?: string
  style?: Style
}) {
  const reduce = useReducedMotion()
  const [phase, setPhase] = useState(0)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    if (reduce) return
    const tick = () => {
      setPhase((p) => (p + 0.04) % (Math.PI * 2))
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [reduce])

  // Waveform path (screen space; plane applies perspective)
  const pathD = useMemo(() => {
    const w = 1200
    const h = 720
    const amp = 110
    const base = h * 0.5
    const freq = 1.25
    const steps = 220
    let d = `M 0 ${base.toFixed(2)}`
    for (let i = 0; i <= steps; i++) {
      const t = i / steps
      const x = t * w
      const y = base + amp * Math.sin(t * Math.PI * 2 * freq + phase) * depthEase(t)
      d += ` L ${x.toFixed(2)} ${y.toFixed(2)}`
    }
    return d
  }, [phase])

  const dot = useMemo(() => {
    const w = 1200
    const h = 720
    const amp = 110
    const base = h * 0.5
    const freq = 1.25
    const t = (phase / (Math.PI * 2)) % 1
    const x = t * w
    const y = base + amp * Math.sin(t * Math.PI * 2 * freq + phase) * depthEase(t)
    return { x, y }
  }, [phase])

  const GRID = 30 // px spacing (denser)
  const COLS = Math.floor(1200 / GRID)
  const ROWS = Math.floor(720 / GRID)

  return (
    <motion.div
      aria-hidden="true"
      className={cn("absolute inset-0 pointer-events-none will-change-transform", className)}
      style={style}
    >
      {/* Perspective plane container (closer view) */}
      <div
        className="absolute left-1/2 top-1/2 w-[180%] h-[180%] -translate-x-1/2 -translate-y-1/2 rounded-[24px] overflow-hidden"
        style={{ transform: "perspective(900px) rotateX(46deg) rotateZ(0.3deg)" }}
      >
        <svg viewBox="0 0 1200 720" className="absolute inset-0 h-full w-full">
          <defs>
            {/* Grid visibility tuning */}
            <linearGradient id="gridFadeV" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(58,134,255,0.22)" />
              <stop offset="55%" stopColor="rgba(58,134,255,0.16)" />
              <stop offset="100%" stopColor="rgba(58,134,255,0.10)" />
            </linearGradient>
            <linearGradient id="axisStrong" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="rgba(58,134,255,0)" />
              <stop offset="20%" stopColor="rgba(58,134,255,0.85)" />
              <stop offset="80%" stopColor="rgba(58,134,255,0.85)" />
              <stop offset="100%" stopColor="rgba(58,134,255,0)" />
            </linearGradient>
            <linearGradient id="axisStrongV" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(58,134,255,0)" />
              <stop offset="20%" stopColor="rgba(58,134,255,0.85)" />
              <stop offset="80%" stopColor="rgba(58,134,255,0.85)" />
              <stop offset="100%" stopColor="rgba(58,134,255,0)" />
            </linearGradient>
            <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <linearGradient id="scanlineG" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="rgba(58,134,255,0)" />
              <stop offset="50%" stopColor="rgba(58,134,255,0.26)" />
              <stop offset="100%" stopColor="rgba(58,134,255,0)" />
            </linearGradient>
            {/* Vignette mask */}
            <radialGradient id="vignette" cx="50%" cy="55%" r="70%">
              <stop offset="60%" stopColor="#000" />
              <stop offset="100%" stopColor="rgba(0,0,0,0)" />
            </radialGradient>
            <mask id="vignetteMask">
              <rect width="1200" height="720" fill="url(#vignette)" />
            </mask>
          </defs>

          {/* GRID: vertical lines */}
          {Array.from({ length: COLS + 1 }).map((_, i) => {
            const x = i * GRID
            return (
              <line
                key={`vx-${i}`}
                x1={x}
                y1={0}
                x2={x}
                y2={720}
                stroke="url(#gridFadeV)"
                strokeWidth={1.25}
                opacity={0.95}
              />
            )
          })}
          {/* GRID: horizontal lines */}
          {Array.from({ length: ROWS + 1 }).map((_, i) => {
            const y = i * GRID
            // Slightly stronger towards the camera
            const near = y > 360 ? (y - 360) / (720 - 360) : (360 - y) / 360
            const alpha = 0.12 + near * 0.12
            return (
              <line
                key={`hx-${i}`}
                x1={0}
                y1={y}
                x2={1200}
                y2={y}
                stroke={`rgba(58,134,255,${alpha})`}
                strokeWidth={1.25}
              />
            )
          })}

          {/* AXES */}
          <line x1={0} y1={360} x2={1200} y2={360} stroke="url(#axisStrong)" strokeWidth={2.6} filter="url(#glow)" />
          {/* X ticks + labels */}
          {Array.from({ length: Math.floor(1200 / (GRID * 4)) + 1 }).map((_, i) => {
            const x = i * GRID * 4
            return (
              <g key={`xt-${i}`}>
                <line x1={x} y1={350} x2={x} y2={372} stroke="rgba(58,134,255,0.75)" strokeWidth={1.6} />
                <text x={x} y={345} textAnchor="middle" fontSize="11" fill="rgba(58,134,255,0.9)">{i * 10}</text>
              </g>
            )
          })}
          <line x1={600} y1={0} x2={600} y2={720} stroke="url(#axisStrongV)" strokeWidth={2.6} filter="url(#glow)" />
          {/* Y ticks + labels */}
          {Array.from({ length: Math.floor(720 / (GRID * 4)) + 1 }).map((_, i) => {
            const y = i * GRID * 4
            return (
              <g key={`yt-${i}`}>
                <line x1={588} y1={y} x2={612} y2={y} stroke="rgba(58,134,255,0.75)" strokeWidth={1.6} />
                <text x={616} y={y + 4} fontSize="11" fill="rgba(58,134,255,0.9)">{(360 - y) / 12}</text>
              </g>
            )
          })}

          {/* SCANLINE */}
          {!reduce && (
            <motion.rect
              x={-240}
              y={0}
              width={216}
              height={720}
              fill="url(#scanlineG)"
              animate={{ x: [-240, 1200 + 240] }}
              transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
            />
          )}

          {/* WAVEFORM */}
          <path
            d={pathD}
            stroke="rgba(58,134,255,0.85)"
            strokeWidth={3}
            fill="none"
            filter="url(#glow)"
            strokeLinecap="round"
          />

          {/* Moving data point */}
          <g transform={`translate(${dot.x.toFixed(2)}, ${dot.y.toFixed(2)})`}>
            <circle r="5.5" fill="#ffffff" stroke="rgba(58,134,255,0.9)" strokeWidth="2.2" />
            <circle r="16" fill="rgba(58,134,255,0.26)" />
          </g>

          {/* Edge fog + vignette */}
          <rect x={0} y={0} width={1200} height={720} fill="url(#vignette)" mask="url(#vignetteMask)" opacity="0.75" />
        </svg>
      </div>

      {/* Screen-space gloss */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(40% 30% at 18% 10%, rgba(255,255,255,0.92), transparent 70%), radial-gradient(30% 25% at 85% 90%, rgba(58,134,255,0.12), transparent 70%)",
        }}
      />
    </motion.div>
  )
}

// Ease amplitude toward center to suggest depth
function depthEase(t: number) {
  const c = Math.abs(t - 0.5) * 2 // 0 center .. 1 edges
  const k = 1 - smoothstep(0, 1, c) * 0.35
  return k
}
function smoothstep(edge0: number, edge1: number, x: number) {
  const v = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)))
  return v * v * (3 - 2 * v)
}
