"use client"

import { motion, useReducedMotion } from "framer-motion"

export default function AuroraBg({
  className = "",
  intensity = 1,
}: {
  className?: string
  intensity?: number
}) {
  const reduce = useReducedMotion()

  if (reduce) {
    // Static, low-contrast halos for reduced motion users
    return (
      <div className={`pointer-events-none absolute inset-0 -z-10 ${className}`}>
        <div
          className="absolute -top-24 left-1/2 h-[60vmax] w-[60vmax] -translate-x-1/2 rounded-full blur-[80px]"
          style={{
            background:
              "radial-gradient(closest-side, rgba(58,134,255,0.14), transparent), conic-gradient(from 90deg at 50% 50%, rgba(58,134,255,0.08), transparent)",
          }}
        />
        <div
          className="absolute bottom-0 right-1/4 h-[40vmax] w-[40vmax] rounded-full blur-[100px]"
          style={{ background: "radial-gradient(closest-side, rgba(58,134,255,0.12), transparent)" }}
        />
      </div>
    )
  }

  return (
    <div className={`pointer-events-none absolute inset-0 -z-10 ${className}`}>
      {/* soft blue halo top */}
      <motion.div
        className="absolute -top-24 left-1/2 h-[60vmax] w-[60vmax] -translate-x-1/2 rounded-full blur-[80px]"
        style={{
          background:
            "radial-gradient(closest-side, rgba(58,134,255,0.22), transparent), conic-gradient(from 90deg at 50% 50%, rgba(58,134,255,0.16), transparent)",
        }}
        animate={{
          scale: [1, 1.06 * intensity, 1],
          rotate: [0, 6, 0],
          opacity: [0.65, 0.95, 0.65],
        }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
      />
      {/* faint glow bottom-right */}
      <motion.div
        className="absolute bottom-0 right-1/4 h-[40vmax] w-[40vmax] rounded-full blur-[100px]"
        style={{
          background: "radial-gradient(closest-side, rgba(58,134,255,0.18), transparent)",
        }}
        animate={{
          y: [0, -18 * intensity, 0],
          opacity: [0.28, 0.5, 0.28],
        }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  )
}
