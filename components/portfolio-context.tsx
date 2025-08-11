"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"

export type Holding = {
  symbol: string
  tokens: number
  cost: number // total USDC spent
}

type PortfolioCtx = {
  holdings: Holding[]
  buy: (symbol: string, tokens: number, price: number) => void
  clear: () => void
}

const PortfolioContext = createContext<PortfolioCtx | undefined>(undefined)

const STORAGE_KEY = "circle.pay.portfolio.v1"

export function PortfolioProvider({ children }: { children?: React.ReactNode }) {
  const [holdings, setHoldings] = useState<Holding[]>([])

  useEffect(() => {
    try {
      const raw = typeof window !== "undefined" ? window.localStorage.getItem(STORAGE_KEY) : null
      if (raw) setHoldings(JSON.parse(raw))
    } catch {}
  }, [])

  useEffect(() => {
    try {
      if (typeof window !== "undefined") window.localStorage.setItem(STORAGE_KEY, JSON.stringify(holdings))
    } catch {}
  }, [holdings])

  const buy = useCallback((symbol: string, tokens: number, price: number) => {
    setHoldings((prev) => {
      const idx = prev.findIndex((h) => h.symbol === symbol)
      const spend = tokens * price
      if (idx >= 0) {
        const h = prev[idx]
        const updated = { ...h, tokens: h.tokens + tokens, cost: h.cost + spend }
        const clone = [...prev]
        clone[idx] = updated
        return clone
      }
      return [...prev, { symbol, tokens, cost: spend }]
    })
  }, [])

  const clear = useCallback(() => setHoldings([]), [])

  const value = useMemo<PortfolioCtx>(() => ({ holdings, buy, clear }), [holdings, buy, clear])
  return <PortfolioContext.Provider value={value}>{children}</PortfolioContext.Provider>
}

export function usePortfolio(): PortfolioCtx {
  const ctx = useContext(PortfolioContext)
  if (!ctx) return { holdings: [], buy: () => {}, clear: () => {} }
  return ctx
}
