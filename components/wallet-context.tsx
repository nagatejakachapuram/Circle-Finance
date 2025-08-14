"use client"

import type React from "react"
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"

type WalletCtx = {
  connected: boolean
  address: string | null
  connect: () => Promise<void>
  connectWallet: (walletId: string) => Promise<void>
  disconnect: () => void
  isConnecting: boolean
  showWalletModal: boolean
  setShowWalletModal: (show: boolean) => void
}

const Ctx = createContext<WalletCtx | undefined>(undefined)

const POLYGON_AMOY_CONFIG = {
  chainId: "0x13882", // 80002 in hex
  chainName: "Polygon Amoy Testnet",
  nativeCurrency: {
    name: "MATIC",
    symbol: "MATIC",
    decimals: 18,
  },
  rpcUrls: ["https://rpc-amoy.polygon.technology/"],
  blockExplorerUrls: ["https://amoy.polygonscan.com/"],
}

declare global {
  interface Window {
    ethereum?: any
  }
}

export function WalletProvider({ children }: { children?: React.ReactNode }) {
  const [address, setAddress] = useState<string | null>(null)
  const [isConnecting, setIsConnecting] = useState(false)
  const [showWalletModal, setShowWalletModal] = useState(false)

  const switchToPolygonAmoy = async () => {
    if (!window.ethereum) return false

    try {
      // Try to switch to Polygon Amoy
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: POLYGON_AMOY_CONFIG.chainId }],
      })
      return true
    } catch (switchError: any) {
      // If network doesn't exist, add it
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [POLYGON_AMOY_CONFIG],
          })
          return true
        } catch (addError) {
          console.error("Error adding Polygon Amoy network:", addError)
          return false
        }
      }
      console.error("Error switching to Polygon Amoy:", switchError)
      return false
    }
  }

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

  const connectWallet = useCallback(async (walletId: string) => {
    setIsConnecting(true)

    try {
      if (walletId === "metamask") {
        if (typeof window === "undefined" || !window.ethereum) {
          window.open("https://metamask.io/download/", "_blank")
          return
        }

        const accounts = await window.ethereum.request({
          method: "eth_requestAccounts",
        })

        if (accounts.length > 0) {
          setAddress(accounts[0])

          const networkSwitched = await switchToPolygonAmoy()
          if (!networkSwitched) {
            alert("Please manually switch to Polygon Amoy testnet in your wallet settings.")
          }

          setShowWalletModal(false)
        }
      } else {
        // For other wallets, show installation message
        alert(`${walletId} integration coming soon! Please use MetaMask for now.`)
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

  const connect = useCallback(async () => {
    setShowWalletModal(true)
  }, [])

  const disconnect = useCallback(() => {
    setAddress(null)
  }, [])

  const value = useMemo<WalletCtx>(
    () => ({
      connected: !!address,
      address,
      connect,
      connectWallet,
      disconnect,
      isConnecting,
      showWalletModal,
      setShowWalletModal,
    }),
    [address, connect, connectWallet, disconnect, isConnecting, showWalletModal],
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
      connectWallet: async () => {},
      disconnect: () => {},
      isConnecting: false,
      showWalletModal: false,
      setShowWalletModal: () => {},
    }
  }
  return ctx
}
