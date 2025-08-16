"use client"

import { useState, useEffect } from "react"
import type { Address } from "viem"
import { SUPPORTED_CHAINS, type CCTPNetwork, getNetworkByChainId, CCTP_NETWORKS } from "@/lib/cctp-config"

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

  const connect = async () => {
    if (!window.ethereum) {
      throw new Error("MetaMask not installed")
    }

    setWallet((prev) => ({ ...prev, isConnecting: true }))

    try {
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      })

      const chainId = await window.ethereum.request({
        method: "eth_chainId",
      })

      const networkConfig = getNetworkByChainId(Number.parseInt(chainId, 16))
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
    } catch (error) {
      setWallet((prev) => ({ ...prev, isConnecting: false }))
      throw error
    }
  }

  const switchNetwork = async (targetNetwork: CCTPNetwork) => {
    if (!window.ethereum) {
      throw new Error("MetaMask not installed")
    }

    const network = SUPPORTED_CHAINS.find((chain) => chain.network === targetNetwork)
    if (!network) {
      throw new Error("Unsupported network")
    }

    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: `0x${network.id.toString(16)}` }],
      })
    } catch (error: any) {
      // Network not added to MetaMask
      if (error.code === 4902) {
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: `0x${network.id.toString(16)}`,
              chainName: network.name,
              nativeCurrency: network.nativeCurrency,
              rpcUrls: [network.rpcUrls.default.http[0]],
              blockExplorerUrls: [network.blockExplorers.default.url],
            },
          ],
        })
      } else {
        throw error
      }
    }
  }

  useEffect(() => {
    if (!window.ethereum) return

    const handleAccountsChanged = (accounts: string[]) => {
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
