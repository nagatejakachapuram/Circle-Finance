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

const detectMetaMask = async (): Promise<boolean> => {
  if (typeof window === "undefined") return false

  // Wait for page to fully load
  if (document.readyState !== "complete") {
    await new Promise((resolve) => {
      if (document.readyState === "complete") {
        resolve(void 0)
      } else {
        window.addEventListener("load", () => resolve(void 0), { once: true })
      }
    })
  }

  // Check for MetaMask specifically
  if (window.ethereum) {
    // Check if it's MetaMask specifically
    if (window.ethereum.isMetaMask) {
      console.log("[v0] MetaMask detected via isMetaMask flag")
      return true
    }

    // Check for MetaMask in providers array (for when multiple wallets are installed)
    if (window.ethereum.providers) {
      const metaMaskProvider = window.ethereum.providers.find((provider: any) => provider.isMetaMask)
      if (metaMaskProvider) {
        console.log("[v0] MetaMask detected in providers array")
        // Set the MetaMask provider as the main ethereum object
        window.ethereum = metaMaskProvider
        return true
      }
    }

    // Fallback: if ethereum exists but no specific MetaMask detection
    console.log("[v0] Generic ethereum provider detected")
    return true
  }

  console.log("[v0] No ethereum provider detected")
  return false
}

export function WalletProvider({ children }: { children?: React.ReactNode }) {
  const [address, setAddress] = useState<string | null>(null)
  const [isConnecting, setIsConnecting] = useState(false)
  const [showWalletModal, setShowWalletModal] = useState(false)

  const switchToPolygonAmoy = async () => {
    if (!window.ethereum) return false

    try {
      console.log("[v0] Attempting to switch to Polygon Amoy network...")
      // Try to switch to Polygon Amoy
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: POLYGON_AMOY_CONFIG.chainId }],
      })
      console.log("[v0] Successfully switched to Polygon Amoy network")
      return true
    } catch (switchError: any) {
      console.log("[v0] Network switch error:", switchError)
      // If network doesn't exist, add it
      if (switchError.code === 4902) {
        try {
          console.log("[v0] Adding Polygon Amoy network...")
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [POLYGON_AMOY_CONFIG],
          })
          console.log("[v0] Successfully added Polygon Amoy network")
          return true
        } catch (addError) {
          console.error("[v0] Error adding Polygon Amoy network:", addError)
          return false
        }
      }
      console.error("[v0] Error switching to Polygon Amoy:", switchError)
      return false
    }
  }

  useEffect(() => {
    const checkConnection = async () => {
      const hasMetaMask = await detectMetaMask()
      if (hasMetaMask) {
        try {
          console.log("[v0] Checking existing wallet connection...")
          const accounts = await window.ethereum.request({ method: "eth_accounts" })
          console.log("[v0] Found accounts:", accounts)
          if (accounts.length > 0) {
            setAddress(accounts[0])
            console.log("[v0] Wallet already connected:", accounts[0])
          } else {
            console.log("[v0] No wallet connected")
          }
        } catch (error) {
          console.error("[v0] Error checking wallet connection:", error)
        }
      }
    }

    checkConnection()

    // Listen for account changes
    if (typeof window !== "undefined" && window.ethereum) {
      const handleAccountsChanged = (accounts: string[]) => {
        console.log("[v0] Account changed:", accounts)
        if (accounts.length > 0) {
          setAddress(accounts[0])
        } else {
          setAddress(null)
        }
      }

      const handleChainChanged = (chainId: string) => {
        console.log("[v0] Chain changed:", chainId)
        // Reload the page when chain changes to avoid stale state
        window.location.reload()
      }

      window.ethereum.on("accountsChanged", handleAccountsChanged)
      window.ethereum.on("chainChanged", handleChainChanged)

      return () => {
        window.ethereum.removeListener("accountsChanged", handleAccountsChanged)
        window.ethereum.removeListener("chainChanged", handleChainChanged)
      }
    }
  }, [])

  const connectWallet = useCallback(async (walletId: string) => {
    console.log("[v0] Connecting wallet:", walletId)
    setIsConnecting(true)

    try {
      if (walletId === "metamask") {
        const hasMetaMask = await detectMetaMask()

        if (!hasMetaMask) {
          console.log("[v0] MetaMask not found, opening download page")
          window.open("https://metamask.io/download/", "_blank")
          return
        }

        console.log("[v0] Requesting MetaMask accounts...")
        const accounts = await window.ethereum.request({
          method: "eth_requestAccounts",
        })

        console.log("[v0] MetaMask accounts received:", accounts)
        if (accounts.length > 0) {
          setAddress(accounts[0])
          console.log("[v0] Wallet connected successfully:", accounts[0])

          // Switch to Polygon Amoy network
          const networkSwitched = await switchToPolygonAmoy()
          if (!networkSwitched) {
            alert(
              "Please manually switch to Polygon Amoy testnet in your wallet settings.\n\nNetwork Details:\nName: Polygon Amoy Testnet\nRPC URL: https://rpc-amoy.polygon.technology/\nChain ID: 80002",
            )
          }

          setShowWalletModal(false)
        }
      } else {
        // For other wallets, show installation message
        alert(`${walletId} integration coming soon! Please use MetaMask for now.`)
      }
    } catch (error: any) {
      console.error("[v0] Error connecting wallet:", error)
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
    console.log("[v0] Opening wallet selection modal")
    setShowWalletModal(true)
  }, [])

  const disconnect = useCallback(() => {
    console.log("[v0] Disconnecting wallet")
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
