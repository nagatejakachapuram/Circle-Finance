"use client"

import Image from "next/image"
import { useMemo } from "react"
import { GlassCard } from "@/components/glass-card"
import { FadeIn } from "@/components/motion"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { usePortfolio } from "./portfolio-context"
import { ASSETS } from "@/lib/markets"

function money(n: number, frac = 2) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: frac, maximumFractionDigits: 2 }).format(n)
}

export default function Holdings() {
  const { holdings, clear } = usePortfolio()

  const rows = useMemo(() => {
    return holdings.map((h) => {
      const asset = ASSETS.find((a) => a.symbol === h.symbol)
      const price = asset?.price ?? 0
      const name = asset?.name ?? h.symbol
      const logo = asset?.logo
      const value = h.tokens * price
      const pnl = value - h.cost
      const pnlPct = h.cost > 0 ? (pnl / h.cost) * 100 : 0
      return { ...h, name, logo, value, price, pnl, pnlPct }
    })
  }, [holdings])

  if (rows.length === 0) {
    return (
      <section aria-labelledby="holdings" className="py-12">
        <div className="container px-4 md:px-6">
          <GlassCard>
            <h3 id="holdings" className="text-lg font-medium text-foreground">{"Your Holdings"}</h3>
            <p className="text-sm text-muted-foreground mt-2">
              {"You don’t own any assets yet. Buy from Global Markets and they’ll appear here automatically."}
            </p>
          </GlassCard>
        </div>
      </section>
    )
  }

  const totalValue = rows.reduce((s, r) => s + r.value, 0)
  const totalCost = rows.reduce((s, r) => s + r.cost, 0)
  const totalPnl = totalValue - totalCost

  return (
    <section aria-labelledby="holdings" className="py-16">
      <div className="container px-4 md:px-6">
        <div className="flex items-end justify-between">
          <div>
            <h2 id="holdings" className="text-2xl md:text-3xl font-semibold tracking-tight text-foreground">{"Your Holdings"}</h2>
            <p className="text-muted-foreground mt-1">{"Assets you purchased appear here in real-time."}</p>
          </div>
          <div className="text-right">
            <div className="text-sm text-muted-foreground">{"Portfolio value"}</div>
            <div className="text-xl font-semibold">
              {money(totalValue)}{" "}
              <Badge variant="outline" className={`ml-2 ${totalPnl >= 0 ? "text-emerald-700 border-emerald-200" : "text-red-700 border-red-200"}`}>
                {totalPnl >= 0 ? "+" : ""}
                {money(totalPnl)}
              </Badge>
            </div>
          </div>
        </div>

        <GlassCard className="mt-6 p-0 overflow-hidden">
          <div className="hidden md:grid grid-cols-[1.2fr,1fr,1fr,1fr] gap-2 px-5 py-3 text-xs text-muted-foreground">
            <div>{"Asset"}</div>
            <div>{"Tokens"}</div>
            <div>{"Value"}</div>
            <div>{"PnL"}</div>
          </div>
          <div className="divide-y">
            {rows.map((r) => (
              <FadeIn key={r.symbol}>
                <div className="px-3 md:px-5 py-3 md:py-4 grid grid-cols-1 md:grid-cols-[1.2fr,1fr,1fr,1fr] gap-3 items-center">
                  <div className="flex items-center gap-3">
                    <Image src={r.logo || "/placeholder.svg?height=32&width=32&query=token+icon"} alt={`${r.name} logo`} width={32} height={32} className="rounded-md border" />
                    <div>
                      <div className="font-medium text-foreground">{r.name}</div>
                      <div className="text-xs text-muted-foreground">{r.symbol}</div>
                    </div>
                  </div>
                  <div className="text-foreground">{r.tokens.toFixed(4)}</div>
                  <div className="text-foreground">{money(r.value)}</div>
                  <div className={`${r.pnl >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                    {r.pnl >= 0 ? "+" : ""}
                    {money(r.pnl)}
                    <span className="text-xs text-muted-foreground">{" ("}{r.pnlPct.toFixed(2)}%{")"}</span>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </GlassCard>

        <div className="mt-3 flex justify-end">
          <Button variant="outline" className="border-slate-200" onClick={clear}>{"Clear portfolio (demo)"}</Button>
        </div>
      </div>
    </section>
  )
}
