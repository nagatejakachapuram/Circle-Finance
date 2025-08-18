"use client"

import { useEffect, useState } from "react"

export default function ScrollProgress() {
  const [progress, setProgress] = useState(0)
  useEffect(() => {
    const onScroll = () => {
      const h = document.documentElement
      const p = (h.scrollTop / (h.scrollHeight - h.clientHeight)) * 100
      setProgress(p)
    }
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])
  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-50 h-0.5">
      <div
        className="h-full bg-gradient-to-r from-[#3A86FF] via-[#7a6bff] to-[#432E9D] transition-[width] duration-150"
        style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
      />
    </div>
  )
}
