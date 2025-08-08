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
      setPhase((p) => (p + 0.05) % (Math.PI * 2))
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [reduce])

  // Waveform path (screen space; perspective applies on container)
  const pathD = useMemo(() => {
    const w = 1200
    const h = 720
    const amp = 130
    const base = h * 0.5
    const freq = 1.35
    const steps = 260
    let d = `M 0 ${base.toFixed(2)}`
    for (let i = 0; i <= steps; i++) {
      const t = i / steps
      const x = t * w
      const y = base + amp * Math.sin(t * Math.PI * 2 * freq + phase) * depthEase(t)
      d += ` L ${x.toFixed(2)} ${y.toFixed(2)}`
    }
    return d
  }, [phase])

  // Moving dot position along the waveform
  const dot = useMemo(() => {
    const w = 1200
    const h = 720
    const amp = 130
    const base = h * 0.5
    const freq = 1.35
    const t = (phase / (Math.PI * 2)) % 1
    const x = t * w
    const y = base + amp * Math.sin(t * Math.PI * 2 * freq + phase) * depthEase(t)
    return { x, y }
  }, [phase])

  // Additional glints along the curve
  const glints = useMemo(() => {
    const w = 1200
    const h = 720
    const amp = 130
    const base = h * 0.5
    const freq = 1.35
    const offsets = [0.18, 0.46, 0.74]
    return offsets.map((off, idx) => {
      const t = ((phase / (Math.PI * 2)) + off) % 1
      const x = t * w
      const y = base + amp * Math.sin(t * Math.PI * 2 * freq + phase) * depthEase(t)
      return { x, y, k: 10 + idx * 4 }
    })
  }, [phase])

  const GRID = 26
  const COLS = Math.floor(1200 / GRID)
  const ROWS = Math.floor(720 / GRID)

  return (
    <motion.div
      aria-hidden="true"
      className={cn("absolute inset-0 pointer-events-none will-change-transform", className)}
      style={style}
    >
      {/* Perspective plane (close-up) */}
      <div
        className="absolute left-1/2 top-1/2 w-[220%] h-[220%] -translate-x-1/2 -translate-y-1/2 rounded-[24px] overflow-hidden"
        style={{ transform: "perspective(700px) rotateX(38deg) rotateZ(0.2deg)" }}
      >
        <svg viewBox="0 0 1200 720" className="absolute inset-0 h-full w-full">
          <defs>
            <linearGradient id="gridFadeV" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(58,134,255,0.26)" />
              <stop offset="55%" stopColor="rgba(58,134,255,0.18)" />
              <stop offset="100%" stopColor="rgba(58,134,255,0.12)" />
            </linearGradient>
            <linearGradient id="axisStrong" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="rgba(58,134,255,0)" />
              <stop offset="20%" stopColor="rgba(58,134,255,0.95)" />
              <stop offset="80%" stopColor="rgba(58,134,255,0.95)" />
              <stop offset="100%" stopColor="rgba(58,134,255,0)" />
            </linearGradient>
            <linearGradient id="axisStrongV" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(58,134,255,0)" />
              <stop offset="20%" stopColor="rgba(58,134,255,0.95)" />
              <stop offset="80%" stopColor="rgba(58,134,255,0.95)" />
              <stop offset="100%" stopColor="rgba(58,134,255,0)" />
            </linearGradient>
            <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <linearGradient id="scanlineG" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="rgba(58,134,255,0)" />
              <stop offset="50%" stopColor="rgba(58,134,255,0.3)" />
              <stop offset="100%" stopColor="rgba(58,134,255,0)" />
            </linearGradient>
            <linearGradient id="diagonalSweep" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="rgba(138,182,255,0)" />
              <stop offset="50%" stopColor="rgba(138,182,255,0.25)" />
              <stop offset="100%" stopColor="rgba(138,182,255,0)" />
            </linearGradient>
            <radialGradient id="vignette" cx="50%" cy="55%" r="75%">
              <stop offset="60%" stopColor="#000" />
              <stop offset="100%" stopColor="rgba(0,0,0,0)" />
            </radialGradient>
            <mask id="vignetteMask">
              <rect width="1200" height="720" fill="url(#vignette)" />
            </mask>
          </defs>

          {/* GRID (animated drift) */}
          <motion.g
            animate={
              reduce
                ? undefined
                : { x: [0, 6, 0], y: [0, 3, 0] }
            }
            transition={reduce ? undefined : { duration: 10, repeat: Infinity, ease: "easeInOut" }}
          >
            {/* vertical */}
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
                  strokeWidth={1.6}
                  opacity={0.98}
                />
              )
            })}
            {/* horizontal */}
            {Array.from({ length: ROWS + 1 }).map((_, i) => {
              const y = i * GRID
              const near = y > 360 ? (y - 360) / (720 - 360) : (360 - y) / 360
              const alpha = 0.16 + near * 0.14
              return (
                <line
                  key={`hx-${i}`}
                  x1={0}
                  y1={y}
                  x2={1200}
                  y2={y}
                  stroke={`rgba(58,134,255,${alpha})`}
                  strokeWidth={1.6}
                />
              )
            })}
          </motion.g>

          {/* AXES with big ticks */}
          <line x1={0} y1={360} x2={1200} y2={360} stroke="url(#axisStrong)" strokeWidth={3} filter="url(#glow)" />
          {Array.from({ length: Math.floor(1200 / (GRID * 4)) + 1 }).map((_, i) => {
            const x = i * GRID * 4
            return (
              <g key={`xt-${i}`}>
                <line x1={x} y1={346} x2={x} y2={374} stroke="rgba(58,134,255,0.9)" strokeWidth="2" />
                <text x={x} y={338} textAnchor="middle" fontSize="12" fontWeight={600} fill="rgba(58,134,255,0.95)">{i * 10}</text>
              </g>
            )
          })}
          <line x1={600} y1={0} x2={600} y2={720} stroke="url(#axisStrongV)" strokeWidth={3} filter="url(#glow)" />
          {Array.from({ length: Math.floor(720 / (GRID * 4)) + 1 }).map((_, i) => {
            const y = i * GRID * 4
            return (
              <g key={`yt-${i}`}>
                <line x1={586} y1={y} x2={614} y2={y} stroke="rgba(58,134,255,0.9)" strokeWidth="2" />
                <text x={618} y={y + 5} fontSize="12" fontWeight={600} fill="rgba(58,134,255,0.95)">{(360 - y) / 12}</text>
              </g>
            )
          })}

          {/* SCANLINE + DIAGONAL SHIMMER */}
          {!reduce && (
            <>
              <motion.rect
                x={-260}
                y={0}
                width={240}
                height={720}
                fill="url(#scanlineG)"
                animate={{ x: [-260, 1200 + 260] }}
                transition={{ duration: 6.8, repeat: Infinity, ease: "easeInOut" }}
              />
              <motion.rect
                x={-400}
                y={-200}
                width={800}
                height={400}
                transform="rotate(18 0 0)"
                fill="url(#diagonalSweep)"
                animate={{ x: [-400, 1600] }}
                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
              />
            </>
          )}

          {/* WAVEFORM */}
          <path
            d={pathD}
            stroke="rgba(58,134,255,0.95)"
            strokeWidth={3.4}
            fill="none"
            filter="url(#glow)"
            strokeLinecap="round"
          />

          {/* Main data point */}
          <g transform={`translate(${dot.x.toFixed(2)}, ${dot.y.toFixed(2)})`}>
            <circle r="6" fill="#ffffff" stroke="rgba(58,134,255,1)" strokeWidth="2.4" />
            <circle r="18" fill="rgba(58,134,255,0.32)" />
          </g>

          {/* Glint particles */}
          {glints.map((g, idx) => (
            <g key={idx} transform={`translate(${g.x.toFixed(2)}, ${g.y.toFixed(2)})`}>
              <circle r="3.2" fill="#ffffff" stroke="rgba(138,182,255,0.85)" strokeWidth="1.6" />
              <circle r={g.k} fill="rgba(138,182,255,0.18)" />
            </g>
          ))}

          {/* Horizon fog + vignette (lowered to keep clarity) */}
          <rect x={0} y={0} width={1200} height={720} fill="url(#vignette)" mask="url(#vignetteMask)" opacity="0.6" />
        </svg>
      </div>

      {/* Minimal gloss so lines remain crisp */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(38% 28% at 18% 10%, rgba(255,255,255,0.88), transparent 70%), radial-gradient(28% 22% at 85% 90%, rgba(58,134,255,0.10), transparent 70%)",
        }}
      />
    </motion.div>
  )
}

// Depth ease: reduce amplitude near far edges to simulate perspective depth
function depthEase(t: number) {
  const c = Math.abs(t - 0.5) * 2 // 0 center .. 1 edges
  const k = 1 - smoothstep(0, 1, c) * 0.35
  return k
}
function smoothstep(edge0: number, edge1: number, x: number) {
  const v = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)))
  return v * v * (3 - 2 * v)
}
