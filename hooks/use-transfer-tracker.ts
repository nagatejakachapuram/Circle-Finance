"use client"

import { useState, useEffect, useCallback } from "react"
import { transferTracker, type TransferUpdate } from "@/lib/transfer-tracker"
import { transferStorage, type StoredTransfer } from "@/lib/transfer-storage"
import type { CCTPNetwork } from "@/lib/cctp-config"

export function useTransferTracker() {
  const [transfers, setTransfers] = useState<StoredTransfer[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const refreshTransfers = useCallback(() => {
    const allTransfers = transferTracker.getAllTransfers()
    setTransfers(allTransfers)
  }, [])

  const createTransfer = useCallback(
    async (
      sourceChain: CCTPNetwork,
      destinationChain: CCTPNetwork,
      amount: string,
      sourceAddress: string,
      destinationAddress: string,
    ) => {
      setIsLoading(true)
      try {
        const transferId = await transferTracker.createTransfer(
          sourceChain,
          destinationChain,
          amount,
          sourceAddress,
          destinationAddress,
        )
        refreshTransfers()
        return transferId
      } finally {
        setIsLoading(false)
      }
    },
    [refreshTransfers],
  )

  const executeTransfer = useCallback(
    async (transferId: string, userAddress: string) => {
      setIsLoading(true)
      try {
        const result = await transferTracker.executeTransfer(transferId, userAddress)
        refreshTransfers()
        return result
      } finally {
        setIsLoading(false)
      }
    },
    [refreshTransfers],
  )

  const completeMint = useCallback(
    async (transferId: string, userAddress: string) => {
      setIsLoading(true)
      try {
        const mintTxHash = await transferTracker.completeMint(transferId, userAddress)
        refreshTransfers()
        return mintTxHash
      } finally {
        setIsLoading(false)
      }
    },
    [refreshTransfers],
  )

  useEffect(() => {
    refreshTransfers()

    // Subscribe to all transfer updates
    const unsubscribe = transferTracker.subscribeToAllTransfers(() => {
      refreshTransfers()
    })

    return unsubscribe
  }, [refreshTransfers])

  return {
    transfers,
    isLoading,
    createTransfer,
    executeTransfer,
    completeMint,
    refreshTransfers,
    activeTransfers: transfers.filter(
      (t) => t.status === "pending" || t.status === "burned" || t.status === "attested",
    ),
    completedTransfers: transfers.filter((t) => t.status === "minted"),
    failedTransfers: transfers.filter((t) => t.status === "failed"),
  }
}

export function useTransfer(transferId?: string) {
  const [transfer, setTransfer] = useState<StoredTransfer | null>(null)
  const [updates, setUpdates] = useState<TransferUpdate[]>([])

  const refreshTransfer = useCallback(() => {
    if (transferId) {
      const currentTransfer = transferTracker.getTransfer(transferId)
      setTransfer(currentTransfer)
    }
  }, [transferId])

  useEffect(() => {
    if (!transferId) return

    refreshTransfer()

    // Subscribe to updates for this specific transfer
    const unsubscribe = transferTracker.subscribeToTransfer(transferId, (update) => {
      setUpdates((prev) => [...prev, update])
      refreshTransfer()
    })

    return unsubscribe
  }, [transferId, refreshTransfer])

  return {
    transfer,
    updates,
    refreshTransfer,
  }
}

export function useTransferStats() {
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    failed: 0,
    pending: 0,
    totalVolume: "0",
  })

  const refreshStats = useCallback(() => {
    const currentStats = transferStorage.getTransferStats()
    setStats(currentStats)
  }, [])

  useEffect(() => {
    refreshStats()

    // Subscribe to transfer updates to refresh stats
    const unsubscribe = transferTracker.subscribeToAllTransfers(() => {
      refreshStats()
    })

    return unsubscribe
  }, [refreshStats])

  return stats
}
