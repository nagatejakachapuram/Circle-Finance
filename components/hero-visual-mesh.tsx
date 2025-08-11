"use client"

import { motion, useReducedMotion } from "framer-motion"
import { type MotionValue } from "framer-motion"

export default function HeroVisualMesh({
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
      {/* Mesh blobs */}
      <motion.div
        className="absolute h-[70%] w-[70%] left-[5%] top-[10%] rounded-[40%]"
        style={{
          background:
            "radial-gradient(closest-side, rgba(58,134,255,0.35), rgba(58,134,255,0.05))",
          filter: "blur(20px)",
        }}
        animate={reduce ? undefined : { rotate: [0, 8, 0], scale: [1, 1.05, 1] }}
        transition={reduce ? undefined : { duration: 16, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute h-[60%] w-[60%] right-[0%] bottom-[5%] rounded-[45%]"
        style={{
          background:
            "radial-gradient(closest-side, rgba(138,182,255,0.35), rgba(58,134,255,0.05))",
          filter: "blur(18px)",
        }}
        animate={reduce ? undefined : { rotate: [0, -10, 0], scale: [1.02, 0.98, 1.02] }}
        transition={reduce ? undefined : { duration: 18, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute h-[45%] w-[45%] right-[20%] top-[8%] rounded-[50%]"
        style={{
          background:
            "radial-gradient(closest-side, rgba(255,255,255,0.9), rgba(255,255,255,0))",
          filter: "blur(14px)",
        }}
        animate={reduce ? undefined : { y: [0, -10, 0] }}
        transition={reduce ? undefined : { duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Mask to keep edges soft */}
      <div
        className="absolute inset-0"
        style={{
          maskImage: "radial-gradient(70% 70% at 50% 50%, #000 60%, transparent 100%)",
          WebkitMaskImage: "radial-gradient(70% 70% at 50% 50%, #000 60%, transparent 100%)",
        }}
      />
    </motion.div>
  )
}
