"use client"

import { motion, type MotionValue, useReducedMotion } from "framer-motion"
import { cn } from "@/lib/utils"

export default function HeroVisual({
  className = "",
  style,
}: {
  className?: string
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
    <motion.div
      style={style}
      className={cn("absolute inset-0", className)}
    >
      {/* Glassy grid */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(58,134,255,0.12) 1px, transparent 1px), linear-gradient(to bottom, rgba(58,134,255,0.12) 1px, transparent 1px)",
          backgroundSize: "36px 36px, 36px 36px",
          backgroundPosition: "0 0, 0 0",
          maskImage:
            "radial-gradient(70% 70% at 50% 50%, #000 60%, transparent 100%)",
          WebkitMaskImage:
            "radial-gradient(70% 70% at 50% 50%, #000 60%, transparent 100%)",
        }}
      />

      {/* Animated blue sweep */}
      <motion.div
        className="absolute inset-y-0 -left-1/3 w-1/3"
        style={{
          background:
            "linear-gradient(90deg, rgba(58,134,255,0) 0%, rgba(58,134,255,0.22) 40%, rgba(58,134,255,0.0) 100%)",
          filter: "blur(8px)",
        }}
        animate={reduce ? undefined : { x: ["0%", "180%"] }}
        transition={
          reduce
            ? undefined
            : { duration: 6, repeat: Infinity, ease: "easeInOut" }
        }
      />

      {/* Floating nodes */}
      {[
        { top: "22%", left: "20%", delay: 0 },
        { top: "38%", left: "68%", delay: 0.2 },
        { top: "68%", left: "40%", delay: 0.4 },
      ].map((p, i) => (
        <motion.div
          key={i}
          className="absolute h-3.5 w-3.5 rounded-full"
          style={{ top: p.top, left: p.left }}
          animate={reduce ? undefined : { y: [0, -8, 0], opacity: [0.9, 1, 0.9] }}
          transition={reduce ? undefined : { duration: 4.5, delay: p.delay, repeat: Infinity, ease: "easeInOut" }}
        >
          <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#3A86FF] to-[#8ab6ff]" />
          <div
            className="absolute -inset-2 rounded-full"
            style={{
              background:
                "radial-gradient(closest-side, rgba(58,134,255,0.35), rgba(58,134,255,0))",
              filter: "blur(6px)",
            }}
          />
        </motion.div>
      ))}

      {/* Subtle corner highlights for gloss */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(40% 30% at 15% 10%, rgba(255,255,255,0.8), transparent 70%), radial-gradient(40% 30% at 85% 90%, rgba(58,134,255,0.10), transparent 70%)",
        }}
      />
    </motion.div>
  )
}
