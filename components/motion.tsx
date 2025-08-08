"use client"

import { motion, type HTMLMotionProps } from "framer-motion"

export function FadeIn({
  delay = 0,
  children,
  ...props
}: HTMLMotionProps<"div"> & { delay?: number }) {
  return (
    <motion.div
      initial={{ y: 14, opacity: 0 }}
      whileInView={{ y: 0, opacity: 1 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ delay, duration: 0.5, ease: "easeOut" }}
      {...props}
    >
      {children}
    </motion.div>
  )
}
