"use client"

import type React from "react"

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"

type WalletCtx = {
  connected: boolean
  address: string | null
  connect: () => Promise<void>
  disconnect: () => void
  isConnecting: boolean
}

const Ctx = createContext<WalletCtx | undefined>(undefined)

declare global {
  interface Window {
    ethereum?: any
  }
}

export function WalletProvider({ children }: { children?: React.ReactNode }) {
  const [address, setAddress] = useState<string | null>(null)
  const [isConnecting, setIsConnecting] = useState(false)

  useEffect(() => {
    // Check if wallet was previously connected
    const checkConnection = async () => {
      if (typeof window !== "undefined" && window.ethereum) {
        try {
          const accounts = await window.ethereum.request({ method: "eth_accounts" })
          if (accounts.length > 0) {
            setAddress(accounts[0])
          }
        } catch (error) {
          console.error("Error checking wallet connection:", error)
        }
      }
    }

    checkConnection()

    // Listen for account changes
    if (typeof window !== "undefined" && window.ethereum) {
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length > 0) {
          setAddress(accounts[0])
        } else {
          setAddress(null)
        }
      }

      window.ethereum.on("accountsChanged", handleAccountsChanged)

      return () => {
        window.ethereum.removeListener("accountsChanged", handleAccountsChanged)
      }
    }
  }, [])

  const connect = useCallback(async () => {
    if (typeof window === "undefined" || !window.ethereum) {
      alert("Please install MetaMask or another Web3 wallet")
      return
    }

    setIsConnecting(true)
    try {
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      })

      if (accounts.length > 0) {
        setAddress(accounts[0])
      }
    } catch (error: any) {
      console.error("Error connecting wallet:", error)
      if (error.code === 4001) {
        // User rejected the request
        alert("Please connect your wallet to continue")
      } else {
        alert("Error connecting wallet. Please try again.")
      }
    } finally {
      setIsConnecting(false)
    }
  }, [])

  const disconnect = useCallback(() => {
    setAddress(null)
  }, [])

  const value = useMemo<WalletCtx>(
    () => ({
      connected: !!address,
      address,
      connect,
      disconnect,
      isConnecting,
    }),
    [address, connect, disconnect, isConnecting],
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useWallet(): WalletCtx {
  const ctx = useContext(Ctx)
  if (!ctx) {
    // Provide a safe default to avoid runtime errors in Next.js previews
    return {
      connected: false,
      address: null,
      connect: async () => {},
      disconnect: () => {},
      isConnecting: false,
    }
  }
  return ctx
}
