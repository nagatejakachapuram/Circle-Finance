"use client"

import { useState, useEffect } from "react"
import type { Address } from "viem"
import { type CCTPNetwork, CCTP_NETWORKS } from "@/lib/cctp-config"

interface WalletState {
  address: Address | null
  chainId: number | null
  isConnected: boolean
  isConnecting: boolean
  currentNetwork: CCTPNetwork | null
}

export function useWallet() {
  const [wallet, setWallet] = useState<WalletState>({
    address: null,
    chainId: null,
    isConnected: false,
    isConnecting: false,
    currentNetwork: null,
  })

  useEffect(() => {
    const checkConnection = async () => {
      if (!window.ethereum) return

      try {
        console.log("[v0] Checking existing wallet connection...")
        const accounts = await window.ethereum.request({ method: "eth_accounts" })
        console.log("[v0] Found accounts:", accounts)

        if (accounts.length > 0) {
          const chainId = await window.ethereum.request({ method: "eth_chainId" })
          const currentNetwork = Object.keys(CCTP_NETWORKS).find(
            (key) => CCTP_NETWORKS[key as CCTPNetwork].chainId === Number.parseInt(chainId, 16),
          ) as CCTPNetwork | null

          setWallet({
            address: accounts[0] as Address,
            chainId: Number.parseInt(chainId, 16),
            isConnected: true,
            isConnecting: false,
            currentNetwork,
          })
        } else {
          console.log("[v0] No wallet connected")
        }
      } catch (error) {
        console.error("[v0] Failed to check wallet connection:", error)
      }
    }

    checkConnection()
  }, [])

  const connect = async () => {
    if (!window.ethereum) {
      throw new Error("MetaMask not installed")
    }

    console.log("[v0] Connecting wallet: metamask")
    setWallet((prev) => ({ ...prev, isConnecting: true }))

    try {
      console.log("[v0] Requesting MetaMask accounts...")
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      })

      const chainId = await window.ethereum.request({
        method: "eth_chainId",
      })

      const currentNetwork = Object.keys(CCTP_NETWORKS).find(
        (key) => CCTP_NETWORKS[key as CCTPNetwork].chainId === Number.parseInt(chainId, 16),
      ) as CCTPNetwork | null

      console.log("[v0] MetaMask accounts received:", accounts)
      setWallet({
        address: accounts[0] as Address,
        chainId: Number.parseInt(chainId, 16),
        isConnected: true,
        isConnecting: false,
        currentNetwork,
      })

      console.log("[v0] Wallet connected successfully:", accounts[0])
    } catch (error) {
      setWallet((prev) => ({ ...prev, isConnecting: false }))
      throw error
    }
  }

  const switchNetwork = async (targetNetwork: CCTPNetwork) => {
    if (!window.ethereum) {
      throw new Error("MetaMask not installed");
    }

    const networkConfig = CCTP_NETWORKS[targetNetwork];
    if (!networkConfig) {
      throw new Error("Unsupported network");
    }

    try {
      console.log("[v0] Attempting to switch to", networkConfig.name, "network...");
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: `0x${networkConfig.chainId.toString(16)}` }],
      });
      console.log("[v0] Successfully switched to", networkConfig.name, "network");

      // --- THE FIX: Manually update the state after a successful switch ---
      setWallet((prev) => ({
        ...prev,
        chainId: networkConfig.chainId,
        currentNetwork: targetNetwork,
      }));
      // --------------------------------------------------------------------

    } catch (error: any) {
      if (error.code === 4902) {
        console.log("[v0] Network not found, adding to MetaMask...");
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: `0x${networkConfig.chainId.toString(16)}`,
              chainName: networkConfig.name,
              nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
              rpcUrls: [networkConfig.rpcUrl],
              blockExplorerUrls: [networkConfig.explorer],
            },
          ],
        });

        // --- THE FIX: Also update state after adding and switching ---
        setWallet((prev) => ({
          ...prev,
          chainId: networkConfig.chainId,
          currentNetwork: targetNetwork,
        }));
        // -----------------------------------------------------------
      } else {
        throw error;
      }
    }
  };

  useEffect(() => {
    if (!window.ethereum) return

    const handleAccountsChanged = (accounts: string[]) => {
      console.log("[v0] Account changed:", accounts)
      if (accounts.length === 0) {
        setWallet({
          address: null,
          chainId: null,
          isConnected: false,
          isConnecting: false,
          currentNetwork: null,
        })
      } else {
        setWallet((prev) => ({
          ...prev,
          address: accounts[0] as Address,
        }))
      }
    }

    const handleChainChanged = (chainId: string) => {
      const newChainId = Number.parseInt(chainId, 16)
      const currentNetwork = Object.keys(CCTP_NETWORKS).find(
        (key) => CCTP_NETWORKS[key as CCTPNetwork].chainId === newChainId,
      ) as CCTPNetwork | null

      console.log("[v0] Chain changed to:", newChainId, "Network:", currentNetwork)
      setWallet((prev) => ({
        ...prev,
        chainId: newChainId,
        currentNetwork,
      }))
    }

    window.ethereum.on("accountsChanged", handleAccountsChanged)
    window.ethereum.on("chainChanged", handleChainChanged)

    return () => {
      window.ethereum.removeListener("accountsChanged", handleAccountsChanged)
      window.ethereum.removeListener("chainChanged", handleChainChanged)
    }
  }, [])

  return {
    ...wallet,
    connect,
    switchNetwork,
    disconnect: () =>
      setWallet({
        address: null,
        chainId: null,
        isConnected: false,
        isConnecting: false,
        currentNetwork: null,
      }),
  }
}
