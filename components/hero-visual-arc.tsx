"use client"

import { motion, useReducedMotion } from "framer-motion"
import { type MotionValue } from "framer-motion"

export default function HeroVisualArc({
  style,
}: {
  style?: {
    translateX?: MotionValue<number> | number
    translateY?: MotionValue<number> | number
    rotate?: MotionValue<number> | number
    scale?: MotionValue<number> | number
    opacity?: MotionValue<number> | number
  }
}) {
  const reduce = useReducedMotion()

  return (
    <motion.div className="absolute inset-0" style={style}>
      {/* Gloss mask so arcs fade at edges */}
      <div
        className="absolute inset-0"
        style={{
          maskImage: "radial-gradient(70% 70% at 50% 50%, #000 60%, transparent 100%)",
          WebkitMaskImage: "radial-gradient(70% 70% at 50% 50%, #000 60%, transparent 100%)",
        }}
      />
      <motion.svg
        viewBox="0 0 800 600"
        className="absolute inset-0 h-full w-full"
        initial={false}
      >
        <defs>
          <linearGradient id="arcBlue" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="rgba(58,134,255,0.0)" />
            <stop offset="40%" stopColor="rgba(58,134,255,0.35)" />
            <stop offset="100%" stopColor="rgba(58,134,255,0.0)" />
          </linearGradient>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Arc 1 */}
        <motion.path
          d="M 60 520 A 420 420 0 0 1 740 140"
          stroke="url(#arcBlue)"
          strokeWidth="2"
          fill="none"
          filter="url(#glow)"
          strokeLinecap="round"
          strokeDasharray="6 10"
          animate={
            reduce
              ? undefined
              : { strokeDashoffset: [0, -120, 0], opacity: [0.9, 1, 0.9] }
          }
          transition={
            reduce ? undefined : { duration: 7, repeat: Infinity, ease: "easeInOut" }
          }
        />
        {/* Arc 2 */}
        <motion.path
          d="M 100 560 A 360 360 0 0 1 700 220"
          stroke="url(#arcBlue)"
          strokeWidth="2"
          fill="none"
          filter="url(#glow)"
          strokeLinecap="round"
          strokeDasharray="8 14"
          animate={
            reduce
              ? undefined
              : { strokeDashoffset: [0, -160, 0], opacity: [0.85, 1, 0.85] }
          }
          transition={
            reduce ? undefined : { duration: 8.5, repeat: Infinity, ease: "easeInOut" }
          }
        />
        {/* Arc 3 */}
        <motion.path
          d="M 40 440 A 480 480 0 0 1 760 60"
          stroke="url(#arcBlue)"
          strokeWidth="1.5"
          fill="none"
          filter="url(#glow)"
          strokeLinecap="round"
          strokeDasharray="5 12"
          animate={
            reduce
              ? undefined
              : { strokeDashoffset: [0, 140, 0], opacity: [0.75, 0.95, 0.75] }
          }
          transition={
            reduce ? undefined : { duration: 9.5, repeat: Infinity, ease: "easeInOut" }
          }
        />
      </motion.svg>

      {/* Soft highlights for gloss */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(40% 30% at 20% 10%, rgba(255,255,255,0.9), transparent 70%), radial-gradient(30% 25% at 85% 90%, rgba(58,134,255,0.12), transparent 70%)",
        }}
      />
    </motion.div>
  )
}
