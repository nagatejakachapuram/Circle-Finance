"use client"

import { motion, useReducedMotion, type MotionValue } from "framer-motion"
import { cn } from "@/lib/utils"

export default function HeroVisualPortfolio({
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
      aria-hidden="true"
      className={cn("absolute inset-0 pointer-events-none", className)}
      style={style}
    >
      {/* Device frame vibe */}
      <div className="absolute inset-0 p-6 md:p-8">
        <div className="relative h-full w-full rounded-2xl border border-slate-200 bg-white/90 backdrop-blur-xl shadow-[0_2px_10px_rgba(15,23,42,0.06),0_24px_64px_-32px_rgba(15,23,42,0.24)] overflow-hidden">
          {/* subtle gloss */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(40% 30% at 12% 0%, rgba(255,255,255,0.9), transparent 70%), radial-gradient(30% 25% at 90% 100%, rgba(58,134,255,0.08), transparent 70%)",
            }}
          />
          {/* Content grid */}
          <div className="relative h-full grid grid-rows-1 grid-cols-1 md:grid-cols-[1.2fr_0.8fr] gap-4 md:gap-6 p-4 md:p-6">
            {/* Sector Allocation card */}
            <div className="relative rounded-xl border border-slate-200 bg-white/80">
              <div className="p-4 md:p-5">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-foreground">Sector Allocation</h3>
                  <span className="text-xs text-muted-foreground">as of 11/21/2024</span>
                </div>
                <div className="mt-4 grid gap-4 md:grid-cols-[1fr_1.2fr]">
                  {/* Left list */}
                  <ul className="space-y-2">
                    {[
                      ["Technology", "32.63%"],
                      ["Financial Services", "13.45%"],
                      ["Consumer Cyclical", "10.91%"],
                      ["Healthcare", "10.58%"],
                      ["Communication Services", "8.87%"],
                      ["Industrials", "7.69%"],
                      ["Real Estate", "2.24%"],
                      ["Basic Materials", "1.85%"],
                    ].map(([label, pct]) => (
                      <li key={label as string} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="inline-block size-1.5 rounded-full bg-[#3A86FF]/60" />
                          <span className="text-xs text-muted-foreground">{label}</span>
                        </div>
                        <span className="text-xs tabular-nums text-foreground">{pct}</span>
                      </li>
                    ))}
                  </ul>
                  {/* Right treemap-like grid */}
                  <div className="relative">
                    <div className="grid grid-cols-6 grid-rows-6 gap-2">
                      {/* Pre-sized tiles to suggest a treemap */}
                      <Tile className="col-span-3 row-span-3" label="Technology" pct="32.63%" tone="dark" />
                      <Tile className="col-span-2 row-span-2" label="Consumer Cyclical" pct="10.91%" tone="mid" />
                      <Tile className="col-span-1 row-span-2" label="Healthcare" pct="10.58%" tone="mid" />
                      <Tile className="col-span-2 row-span-2" label="Financial Services" pct="13.45%" tone="mid" />
                      <Tile className="col-span-2 row-span-2" label="Industrials" pct="7.69%" tone="light" />
                      <Tile className="col-span-1 row-span-2" label="Real Estate" pct="2.24%" tone="light" />
                      <Tile className="col-span-1 row-span-2" label="Basic Materials" pct="1.85%" tone="light" />
                    </div>
                    {/* shimmering sweep */}
                    {!reduce && (
                      <motion.div
                        className="pointer-events-none absolute inset-0 rounded-lg"
                        style={{
                          background:
                            "linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.6) 50%, rgba(255,255,255,0) 100%)",
                          filter: "blur(8px)",
                        }}
                        animate={{ x: ["-20%", "120%"] }}
                        transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }}
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Buy panel card */}
            <div className="relative rounded-xl border border-slate-200 bg-white/85">
              <div className="p-4 md:p-5">
                <div className="flex items-center gap-4 text-sm">
                  <span className="font-medium text-foreground">Buy</span>
                  <span className="text-muted-foreground">Sell</span>
                  <span className="text-muted-foreground">Bridge</span>
                </div>

                <div className="mt-4 space-y-3">
                  <Row label="Order Type" value="Market Order" />
                  <div className="grid grid-cols-2 gap-2">
                    <Pill active label="Shares" />
                    <Pill label="USD" />
                  </div>
                  <Row label="Amount" value="100" />
                  <Row label="Market Price" value="$611.09" />
                  <Row label="Fee" value="$0.00" />
                  <Row label="Network Cost" value="$0.00" />
                </div>

                <div className="mt-4">
                  <div className="text-xs text-muted-foreground">Total Cost</div>
                  <div className="text-3xl font-semibold text-foreground">$61,109</div>
                </div>

                <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50/60 p-3">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Total Buying Power</span>
                    <span className="tabular-nums">$456,640</span>
                  </div>
                  <div className="mt-2 relative h-6 rounded-md bg-white/80 border border-slate-200 overflow-hidden">
                    {!reduce && (
                      <motion.div
                        className="absolute inset-y-0 left-0 w-2/3 bg-[linear-gradient(90deg,rgba(58,134,255,0.25)_0%,rgba(58,134,255,0.45)_50%,rgba(58,134,255,0.25)_100%)]"
                        animate={{ x: [0, 6, 0] }}
                        transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
                      />
                    )}
                    <div className="absolute inset-0 bg-[repeating-linear-gradient(90deg,transparent_0,transparent_10px,rgba(58,134,255,0.2)_10px,rgba(58,134,255,0.2)_12px)]" />
                    <div className="absolute inset-0 ring-1 ring-inset ring-slate-200/80 rounded-md" />
                  </div>
                  <div className="mt-1 text-[10px] text-center text-muted-foreground">2x margin</div>
                </div>

                <div className="mt-4">
                  <div className="h-10 w-full rounded-md bg-slate-900 text-white grid place-items-center text-sm">
                    Review Order
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Vignette for depth */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              boxShadow: "inset 0 -60px 120px -60px rgba(15,23,42,0.18)",
            }}
          />
        </div>
      </div>
    </motion.div>
  )
}

function Tile({
  className,
  label,
  pct,
  tone = "mid",
}: {
  className?: string
  label: string
  pct: string
  tone?: "dark" | "mid" | "light"
}) {
  const bg =
    tone === "dark"
      ? "bg-[linear-gradient(135deg,#0f172a,#1d3b78)]"
      : tone === "mid"
      ? "bg-[linear-gradient(135deg,#264d94,#3A86FF)]"
      : "bg-[linear-gradient(135deg,#6ea2ff,#b7d0ff)]"
  return (
    <div className={cn("relative rounded-md overflow-hidden", className)}>
      <div className={cn("absolute inset-0", bg)} />
      <div className="absolute inset-0 ring-1 ring-inset ring-white/30 rounded-md" />
      <div className="absolute bottom-1.5 left-1.5 right-1.5 text-[10px] text-white/95 flex justify-between">
        <span className="truncate pr-1">{label}</span>
        <span className="tabular-nums">{pct}</span>
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[1fr_auto] items-center gap-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="h-8 min-w-[140px] rounded-md border border-slate-200 bg-white/80 px-2 text-sm text-foreground grid place-items-center">
        {value}
      </div>
    </div>
  )
}

function Pill({ label, active = false }: { label: string; active?: boolean }) {
  return (
    <div
      className={cn(
        "h-8 rounded-md border px-3 grid place-items-center text-xs",
        active
          ? "border-[#3A86FF] text-[#0f172a] bg-[linear-gradient(180deg,#eaf1ff,#ffffff)]"
          : "border-slate-200 text-muted-foreground bg-white/80"
      )}
    >
      {label}
    </div>
  )
}
