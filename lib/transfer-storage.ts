"use client";

import type { CCTPTransfer } from "./cctp-client"

export interface StoredTransfer extends CCTPTransfer {
  id: string
  sourceDomain: number;
  messageHash?: string
  createdAt: number
  updatedAt: number
  estimatedCompletionTime?: number
  retryCount?: number
  lastError?: string
}

// --- FIX START ---
// Helper function to handle BigInt serialization for JSON.stringify
function replacer(key: string, value: any) {
  if (typeof value === "bigint") {
    // Convert BigInts to strings
    return value.toString()
  }
  return value
}
// --- FIX END ---

export class TransferStorage {
  private readonly storageKey = "cctp_transfers"
  private readonly maxTransfers = 100 // Keep last 100 transfers

  private getStoredTransfers(): StoredTransfer[] {
    if (typeof window === 'undefined') {
      return [];
    }

    try {
      const stored = localStorage.getItem(this.storageKey);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error("[v0] Failed to load stored transfers:", error);
      return [];
    }
  }

  private saveTransfers(transfers: StoredTransfer[]): void {

    try {
      // Keep only the most recent transfers
      const sortedTransfers = transfers.sort((a, b) => b.updatedAt - a.updatedAt).slice(0, this.maxTransfers)

      // --- FIX START ---
      // Use the 'replacer' function to handle BigInts during serialization
      localStorage.setItem(this.storageKey, JSON.stringify(sortedTransfers, replacer))
      // --- FIX END ---
    } catch (error) {
      console.error("[v0] Failed to save transfers:", error)
    }
  }

  saveTransfer(transfer: StoredTransfer): void {
    const transfers = this.getStoredTransfers()
    const existingIndex = transfers.findIndex((t) => t.id === transfer.id)

    const updatedTransfer = {
      ...transfer,
      updatedAt: Date.now(),
    }

    if (existingIndex >= 0) {
      transfers[existingIndex] = updatedTransfer
    } else {
      transfers.push(updatedTransfer)
    }

    this.saveTransfers(transfers)
  }

  getTransfer(id: string): StoredTransfer | null {
    const transfers = this.getStoredTransfers()
    return transfers.find((t) => t.id === id) || null
  }

  getAllTransfers(): StoredTransfer[] {
    return this.getStoredTransfers()
  }

  getActiveTransfers(): StoredTransfer[] {
    return this.getStoredTransfers().filter(
      (t) => t.status === "pending" || t.status === "burned" || t.status === "attested",
    )
  }

  getTransfersByStatus(status: StoredTransfer["status"]): StoredTransfer[] {
    return this.getStoredTransfers().filter((t) => t.status === status)
  }

  updateTransferStatus(id: string, status: StoredTransfer["status"], additionalData?: Partial<StoredTransfer>): void {
    const transfer = this.getTransfer(id)
    if (transfer) {
      this.saveTransfer({
        ...transfer,
        ...additionalData,
        status,
      })
    }
  }

  deleteTransfer(id: string): void {
    const transfers = this.getStoredTransfers()
    const filteredTransfers = transfers.filter((t) => t.id !== id)
    this.saveTransfers(filteredTransfers)
  }

  clearOldTransfers(olderThanDays = 30): void {
    const cutoffTime = Date.now() - olderThanDays * 24 * 60 * 60 * 1000
    const transfers = this.getStoredTransfers()
    const recentTransfers = transfers.filter((t) => t.updatedAt > cutoffTime)
    this.saveTransfers(recentTransfers)
  }

  getTransferStats(): {
    total: number
    completed: number
    failed: number
    pending: number
    totalVolume: string
  } {
    const transfers = this.getStoredTransfers()

    const stats = transfers.reduce(
      (acc, transfer) => {
        acc.total++
        if (transfer.status === "minted") acc.completed++
        else if (transfer.status === "failed") acc.failed++
        else acc.pending++

        // The amount will now be a string, so parseFloat is appropriate here
        acc.totalVolume += Number.parseFloat(transfer.amount as string)
        return acc
      },
      { total: 0, completed: 0, failed: 0, pending: 0, totalVolume: 0 },
    )

    return {
      ...stats,
      totalVolume: stats.totalVolume.toFixed(2),
    }
  }
}

// Singleton instance
export const transferStorage = new TransferStorage()
