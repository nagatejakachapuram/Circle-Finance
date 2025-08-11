"use client"

import Link from "next/link"
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  useReducedMotion,
  useScroll,
} from "framer-motion"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Wallet, ArrowRight } from 'lucide-react'
import { useWallet } from "./wallet-context"
import AuroraBg from "./aurora-bg"
import { GlassCard } from "./glass-card"
import { useCallback, useRef } from "react"
import HeroVisualGrid from "./hero-visual"
import HeroVisualArc from "./hero-visual-arc"
import HeroVisualMesh from "./hero-visual-mesh"
import HeroVisualPortfolio from "./hero-visual-portfolio"

export default function Hero() {
  const { connected, connect } = useWallet()
  const reduce = useReducedMotion()
  const ref = useRef<HTMLDivElement | null>(null)
  const search = useSearchParams()
  const visual = (search?.get("visual") || "portfolio").toLowerCase() as "portfolio" | "arc" | "mesh" | "grid"

  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const smx = useSpring(mx, { stiffness: 60, damping: 12, mass: 0.4 })
  const smy = useSpring(my, { stiffness: 60, damping: 12, mass: 0.4 })

  const tx = useTransform(smx, (v) => v * 26)
  const ty = useTransform(smy, (v) => v * 20)
  const rot = useTransform(smx, (v) => v * -4)

  const handleMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (reduce) return
      const el = ref.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const x = (e.clientX - rect.left) / rect.width
      const y = (e.clientY - rect.top) / rect.height
      mx.set((x - 0.5) * 2)
      my.set((y - 0.5) * 2)
    },
    [mx, my, reduce]
  )

  const handleLeave = useCallback(() => {
    mx.set(0)
    my.set(0)
  }, [mx, my])

  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] })
  const depthScale = useTransform(scrollYProgress, [0, 0.5, 1], [1.08, 1, 0.95])
  const depthOpacity = useTransform(scrollYProgress, [0, 1], [1, 0.9])

  const visualStyle = {
    translateX: reduce ? 0 : (tx as any),
    translateY: reduce ? 0 : (ty as any),
    rotate: reduce ? 0 : (rot as any),
    scale: reduce ? 1 : (depthScale as any),
    opacity: reduce ? 1 : (depthOpacity as any),
  }

  return (
    <section className="relative overflow-hidden">
      <AuroraBg intensity={1.2} />
      <div className="container px-4 md:px-6 py-16 md:py-28 relative">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <motion.div
              initial={{ y: 12, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/70 backdrop-blur px-3 py-1 text-xs text-muted-foreground"
            >
              {"USDC-Native • ERC-3643 • CCTP"}
            </motion.div>

            <motion.h1
              initial={{ y: 16, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.05, duration: 0.6 }}
              className="mt-4 text-4xl md:text-6xl font-semibold tracking-tight"
            >
              <span className="bg-gradient-to-b from-slate-900 to-slate-700 bg-clip-text text-transparent">
                {"Tokenized Real Estate. USDC-Native. Fully On-Chain."}
              </span>
            </motion.h1>

            <motion.p
              initial={{ y: 16, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.12, duration: 0.6 }}
              className="mt-5 text-muted-foreground text-lg max-w-xl"
            >
              {"Circle Pay brings real-world property to the blockchain with compliance-first rails. Invest transparently and earn rent in USDC."}
            </motion.p>

            <motion.div
              initial={{ y: 16, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.18, duration: 0.6 }}
              className="mt-8 flex flex-wrap gap-3"
            >
              <Button asChild className="bg-gradient-to-tr from-[#3A86FF] to-[#1f6fff] text-white shadow-[0_10px_30px_-10px_rgba(58,134,255,0.45)] hover:opacity-95">
                <Link href="/explore">
                  {"Explore Estates"}
                  <ArrowRight className="ml-2 size-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" className="border-slate-200 text-foreground hover:bg-slate-100">
                <Link href="/auth/signup">{"Get Started"}</Link>
              </Button>
              <Button
                onClick={connect}
                variant={connected ? "outline" : "default"}
                className={
                  connected
                    ? "border-slate-200 text-foreground hover:bg-slate-100"
                    : "bg-[#3A86FF] hover:bg-[#2f76e8] text-white"
                }
              >
                <Wallet className="mr-2 size-4" />
                {connected ? "Wallet Connected" : "Connect Wallet"}
              </Button>
            </motion.div>
          </div>

          <motion.div
            ref={ref}
            onMouseMove={handleMove}
            onMouseLeave={handleLeave}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7 }}
            className="relative h-[34rem] md:h-[40rem]"
            aria-hidden="true"
          >
            <GlassCard className="absolute inset-0 p-0 overflow-hidden bg-white/85">
              <div
                className="absolute inset-0"
                style={{
                  background:
                    "linear-gradient(180deg, rgba(255,255,255,0.95), rgba(255,255,255,0.7)), linear-gradient(120deg, rgba(58,134,255,0.06), rgba(58,134,255,0))",
                }}
              />
              {visual === "portfolio" ? (
                <HeroVisualPortfolio style={visualStyle} />
              ) : visual === "arc" ? (
                <HeroVisualArc style={visualStyle} />
              ) : visual === "mesh" ? (
                <HeroVisualMesh style={visualStyle} />
              ) : (
                <HeroVisualGrid style={visualStyle} />
              )}
            </GlassCard>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
