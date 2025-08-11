"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"

type WalletCtx = {
  connected: boolean
  address: string | null
  connect: () => void
  disconnect: () => void
}

const Ctx = createContext<WalletCtx | undefined>(undefined)

export function WalletProvider({ children }: { children?: React.ReactNode }) {
  const [address, setAddress] = useState<string | null>(null)

  useEffect(() => {
    const saved = typeof window !== "undefined" ? window.localStorage.getItem("demo.wallet.addr") : null
    if (saved) setAddress(saved)
  }, [])

  const connect = useCallback(() => {
    // Simulate wallet connection with a deterministic mock address
    const addr = "0x" + Array.from(crypto.getRandomValues(new Uint8Array(20))).map((b) => b.toString(16).padStart(2, "0")).join("")
    setAddress(addr)
    if (typeof window !== "undefined") window.localStorage.setItem("demo.wallet.addr", addr)
  }, [])

  const disconnect = useCallback(() => {
    setAddress(null)
    if (typeof window !== "undefined") window.localStorage.removeItem("demo.wallet.addr")
  }, [])

  const value = useMemo<WalletCtx>(() => ({ connected: !!address, address, connect, disconnect }), [address, connect, disconnect])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useWallet(): WalletCtx {
  const ctx = useContext(Ctx)
  if (!ctx) {
    // Provide a safe default to avoid runtime errors in Next.js previews
    return { connected: false, address: null, connect: () => {}, disconnect: () => {} }
  }
  return ctx
}
