"use client"

import type React from "react"

import { motion, useReducedMotion, type MotionValue } from "framer-motion"
import { cn } from "@/lib/utils"
import { Building, Home, Factory, ShoppingBag, Warehouse } from "lucide-react"

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
    <motion.div aria-hidden="true" className={cn("absolute inset-0 pointer-events-none", className)} style={style}>
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
          <div className="relative h-full grid grid-rows-1 grid-cols-1 md:grid-cols-[1.4fr_0.6fr] gap-4 md:gap-6 p-4 md:p-6">
            {/* Holdings Table */}
            <div className="relative rounded-xl border border-slate-200 bg-white/80">
              <div className="p-4 md:p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-foreground">Holdings</h3>
                  <div className="text-xs text-muted-foreground">
                    <span className="mr-2">Tracked Asset</span>
                    <span>Token Ticker</span>
                  </div>
                </div>

                {/* Holdings Table Header */}
                <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr] gap-2 pb-2 border-b border-slate-200 text-xs text-muted-foreground">
                  <div>Asset</div>
                  <div className="text-right">Value</div>
                  <div className="text-right">24h ($)</div>
                  <div className="text-right">24h (%)</div>
                  <div className="text-center">Category</div>
                  <div className="text-center">Last 7 Days</div>
                </div>

                {/* Holdings Rows */}
                <div className="space-y-2 mt-3">
                  <HoldingRow
                    icon={<Building className="w-4 h-4" />}
                    name="Miami Commercial Plaza"
                    ticker="MCP"
                    value="$70,370.40"
                    change24h="$119.63"
                    changePercent="0.17%"
                    category="Commercial"
                    trend="up"
                  />
                  <HoldingRow
                    icon={<Home className="w-4 h-4" />}
                    name="Brooklyn Residential Fund"
                    ticker="BRF"
                    value="$58,691.40"
                    change24h="$1,285.34"
                    changePercent="2.19%"
                    category="Residential"
                    trend="up"
                  />
                  <HoldingRow
                    icon={<Factory className="w-4 h-4" />}
                    name="Austin Industrial Complex"
                    ticker="AIC"
                    value="$40,318.00"
                    change24h="$4.80"
                    changePercent="0.012%"
                    category="Industrial"
                    trend="up"
                  />
                  <HoldingRow
                    icon={<ShoppingBag className="w-4 h-4" />}
                    name="Seattle Retail Spaces"
                    ticker="SRS"
                    value="$37,853.20"
                    change24h="-$741.92"
                    changePercent="-1.96%"
                    category="Retail"
                    trend="down"
                  />
                  <HoldingRow
                    icon={<Warehouse className="w-4 h-4" />}
                    name="Denver Mixed-Use Development"
                    ticker="DMD"
                    value="$21,087.00"
                    change24h="-$206.65"
                    changePercent="-0.98%"
                    category="Mixed-Use"
                    trend="down"
                  />
                </div>
              </div>
            </div>

            {/* Account Summary */}
            <div className="relative rounded-xl border border-slate-200 bg-white/85">
              <div className="p-4 md:p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-foreground">Account</h3>
                  <div className="px-2 py-1 rounded-full bg-green-100 text-green-700 text-xs font-medium">Healthy</div>
                </div>

                {/* Account Metrics */}
                <div className="space-y-3">
                  <AccountRow label="Total Buying Power" value="$395,531" />
                  <AccountRow label="Total Holdings" value="$228,320" />
                  <AccountRow label="Margin Used" value="$61,109" />
                  <AccountRow label="Margin Available" value="$167,211" />
                  <AccountRow label="Margin Call Threshold" value="$81,479" />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 mt-6">
                  <button className="flex-1 h-10 rounded-md bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 transition-colors">
                    Deposit
                  </button>
                  <button className="flex-1 h-10 rounded-md border border-slate-300 text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors">
                    Withdraw
                  </button>
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

function HoldingRow({
  icon,
  name,
  ticker,
  value,
  change24h,
  changePercent,
  category,
  trend,
}: {
  icon: React.ReactNode
  name: string
  ticker: string
  value: string
  change24h: string
  changePercent: string
  category: string
  trend: "up" | "down"
}) {
  const isPositive = trend === "up"

  return (
    <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr] gap-2 py-2 items-center text-xs hover:bg-slate-50/50 rounded-md px-1">
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">{icon}</div>
        <div>
          <div className="font-medium text-foreground">{name}</div>
          <div className="text-muted-foreground">{ticker}</div>
        </div>
      </div>
      <div className="text-right font-medium text-foreground">{value}</div>
      <div className={cn("text-right font-medium", isPositive ? "text-green-600" : "text-red-600")}>{change24h}</div>
      <div className={cn("text-right font-medium", isPositive ? "text-green-600" : "text-red-600")}>
        {isPositive ? "▲" : "▼"} {changePercent}
      </div>
      <div className="text-center text-muted-foreground">{category}</div>
      <div className="flex justify-center">
        <MiniChart trend={trend} />
      </div>
    </div>
  )
}

function AccountRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-foreground">{value}</span>
    </div>
  )
}

function MiniChart({ trend }: { trend: "up" | "down" }) {
  return (
    <div className="w-12 h-6 relative">
      <svg width="48" height="24" viewBox="0 0 48 24" className="overflow-visible">
        <path
          d={trend === "up" ? "M2,20 Q12,16 24,12 Q36,8 46,4" : "M2,4 Q12,8 24,12 Q36,16 46,20"}
          stroke={trend === "up" ? "#16a34a" : "#dc2626"}
          strokeWidth="1.5"
          fill="none"
          className="opacity-80"
        />
      </svg>
    </div>
  )
}
