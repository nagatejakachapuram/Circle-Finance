"use client"

import Image from "next/image"
import { useMemo, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { GlassCard } from "@/components/glass-card"
import { FadeIn } from "@/components/motion"
import { ArrowRight } from 'lucide-react'
import { ASSETS, type Asset, type Chain } from "@/lib/markets"
import { usePortfolio } from "./portfolio-context"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog"

function fmt(n: number) {
  return new Intl.NumberFormat("en-US").format(n)
}
function money(n: number, frac = 2) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: frac, maximumFractionDigits: 2 }).format(n)
}

export default function Markets() {
  const [chain, setChain] = useState<Chain | "All">("All")
  const [query, setQuery] = useState("")
  const data = useMemo(() => {
    return ASSETS.filter((a) => (chain === "All" ? true : a.chain === chain)).filter((a) =>
      query ? a.name.toLowerCase().includes(query.toLowerCase()) || a.symbol.toLowerCase().includes(query.toLowerCase()) : true
    )
  }, [chain, query])

  return (
    <section aria-labelledby="markets" className="py-16 md:py-24">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 id="markets" className="text-2xl md:text-3xl font-semibold tracking-tight text-foreground">{"Global Markets"}</h2>
            <p className="text-muted-foreground mt-2">{"Tokenized real estate markets. Buy and your holdings appear automatically below."}</p>
          </div>
          <div className="flex items-center gap-3">
            <Input placeholder="Search assets…" value={query} onChange={(e) => setQuery(e.target.value)} className="w-56 bg-white border-slate-200" />
            <Tabs value={chain} onValueChange={(v: any) => setChain(v)} className="w-fit">
              <TabsList className="bg-white/70 backdrop-blur border border-slate-200">
                <TabsTrigger value="All">{"All"}</TabsTrigger>
                <TabsTrigger value="Ethereum">{"Ethereum"}</TabsTrigger>
                <TabsTrigger value="Base">{"Base"}</TabsTrigger>
                <TabsTrigger value="Polygon">{"Polygon"}</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        <GlassCard className="mt-8 p-0 overflow-hidden">
          <div className="hidden md:grid grid-cols-[1.2fr,1fr,1fr,1fr,0.8fr] gap-2 px-5 py-3 text-xs text-muted-foreground">
            <div>{"Asset"}</div>
            <div>{"Price"}</div>
            <div>{"Yield (APY)"}</div>
            <div>{"Liquidity"}</div>
            <div className="text-right">{"Action"}</div>
          </div>
          <div className="divide-y">
            {data.map((a) => (
              <Row key={a.id} asset={a} />
            ))}
          </div>
        </GlassCard>
      </div>
    </section>
  )
}

function Row({ asset }: { asset: Asset }) {
  const [open, setOpen] = useState(false)
  const positive = asset.change24h >= 0
  return (
    <div className="px-3 md:px-5 py-3 md:py-4 hover:bg-slate-50/60 transition-colors">
      <div className="grid grid-cols-1 md:grid-cols-[1.2fr,1fr,1fr,1fr,0.8fr] gap-3 items-center">
        <div className="flex items-center gap-3">
          <Image src={asset.logo || "/placeholder.svg?height=32&width=32&query=token+icon"} alt={`${asset.name} logo`} width={32} height={32} className="rounded-md border" />
          <div>
            <div className="font-medium text-foreground">{asset.name}</div>
            <div className="text-xs text-muted-foreground flex items-center gap-2">
              <span>{asset.symbol}</span>
              <span className="h-1 w-1 rounded-full bg-slate-300" />
              <span>{asset.chain}</span>
              <Badge variant="outline" className="ml-1 border-slate-300 text-muted-foreground">{"USDC"}</Badge>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="font-medium">{money(asset.price)}</div>
          <span className={`text-xs ${positive ? "text-emerald-600" : "text-red-600"}`}>
            {positive ? "+" : ""}
            {asset.change24h.toFixed(2)}%
          </span>
        </div>

        <div className="text-foreground">{asset.apy.toFixed(2)}%</div>

        <div className="text-foreground">{money(asset.liquidity, 0)}</div>

        <div className="flex justify-end">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[#3A86FF] hover:bg-[#2f76e8] text-white">
                {"Buy"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </DialogTrigger>
            <BuyDialog asset={asset} onDone={() => setOpen(false)} />
          </Dialog>
        </div>
      </div>
    </div>
  )
}

function BuyDialog({ asset, onDone }: { asset: Asset; onDone?: () => void }) {
  const { buy } = usePortfolio()
  const [usdc, setUsdc] = useState<number>(1000)
  const tokens = Math.max(0, usdc / asset.price)

  return (
    <DialogContent className="sm:max-w-md bg-white">
      <DialogHeader>
        <DialogTitle>{"Buy "}{asset.name}</DialogTitle>
        <DialogDescription className="text-muted-foreground">
          {"Enter amount in USDC. Tokens are calculated automatically at the current price."}
        </DialogDescription>
      </DialogHeader>

      <div className="grid gap-3">
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">{"Price"}</div>
          <div className="font-medium">{money(asset.price)}</div>
        </div>

        <label className="text-sm font-medium" htmlFor="amount-usdc">{"Amount (USDC)"}</label>
        <Input
          id="amount-usdc"
          inputMode="decimal"
          value={usdc}
          onChange={(e) => setUsdc(Math.max(0, Number(e.target.value || 0)))}
          className="bg-white border-slate-200"
        />

        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">{"You receive"}</div>
          <div className="font-medium">{tokens.toFixed(4)} {" "} {asset.symbol}</div>
        </div>

        <div className="flex gap-2">
          <Button
            className="bg-[#3A86FF] hover:bg-[#2f76e8] text-white w-full"
            onClick={() => {
              if (tokens > 0) {
                buy(asset.symbol, tokens, asset.price)
                onDone?.()
              }
            }}
          >
            {"Confirm buy"}
          </Button>
          <DialogClose asChild>
            <Button variant="outline" className="w-full border-slate-200">{"Cancel"}</Button>
          </DialogClose>
        </div>
      </div>
    </DialogContent>
  )
}
