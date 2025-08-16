import { cctpService } from "./cctp-service"
import { transferStorage, type StoredTransfer } from "./transfer-storage"
import type { CCTPNetwork } from "./cctp-config"
import { generateId } from "./utils"

export interface TransferUpdate {
  id: string
  status: StoredTransfer["status"]
  progress?: number
  message?: string
  error?: string
  txHash?: string
  attestation?: string
}

export type TransferUpdateCallback = (update: TransferUpdate) => void

export class TransferTracker {
  private activePolling: Map<string, NodeJS.Timeout> = new Map()
  private updateCallbacks: Map<string, TransferUpdateCallback[]> = new Map()
  private globalCallbacks: TransferUpdateCallback[] = []

  constructor() {
    // Resume tracking for active transfers on initialization
    this.resumeActiveTransfers()
  }

  private resumeActiveTransfers(): void {
    const activeTransfers = transferStorage.getActiveTransfers()
    console.log("[v0] Resuming tracking for", activeTransfers.length, "active transfers")

    activeTransfers.forEach((transfer) => {
      if (transfer.messageHash) {
        this.startPolling(transfer.id, transfer.messageHash, transfer.sourceChain, transfer.destinationChain)
      }
    })
  }

  async createTransfer(
    sourceChain: CCTPNetwork,
    destinationChain: CCTPNetwork,
    amount: string,
    sourceAddress: string,
    destinationAddress: string,
  ): Promise<string> {
    const transferId = generateId()

    const transfer: StoredTransfer = {
      id: transferId,
      sourceChain,
      destinationChain,
      amount,
      sourceAddress: sourceAddress as `0x${string}`,
      destinationAddress: destinationAddress as `0x${string}`,
      status: "pending",
      timestamp: Date.now(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }

    transferStorage.saveTransfer(transfer)
    this.notifyUpdate({ id: transferId, status: "pending", message: "Transfer initiated" })

    return transferId
  }

  async executeTransfer(transferId: string, userAddress: string): Promise<{ burnTxHash: string; messageHash: string }> {
    const transfer = transferStorage.getTransfer(transferId)
    if (!transfer) {
      throw new Error("Transfer not found")
    }

    try {
      this.notifyUpdate({ id: transferId, status: "pending", message: "Executing burn transaction..." })

      const result = await cctpService.initiateCCTPTransfer(
        transfer.sourceChain,
        transfer.destinationChain,
        transfer.amount,
        userAddress as `0x${string}`,
        transfer.destinationAddress,
      )

      // Update transfer with burn transaction details
      transferStorage.saveTransfer({
        ...transfer,
        status: "burned",
        burnTxHash: result.burnTxHash,
        messageHash: result.messageHash,
        nonce: result.transfer.nonce,
      })

      this.notifyUpdate({
        id: transferId,
        status: "burned",
        message: "USDC burned successfully, waiting for attestation...",
        txHash: result.burnTxHash,
      })

      // Start polling for attestation
      this.startPolling(transferId, result.messageHash, transfer.sourceChain, transfer.destinationChain)

      return {
        burnTxHash: result.burnTxHash,
        messageHash: result.messageHash,
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Transfer failed"
      transferStorage.updateTransferStatus(transferId, "failed", { lastError: errorMessage })
      this.notifyUpdate({ id: transferId, status: "failed", error: errorMessage })
      throw error
    }
  }

  async completeMint(transferId: string, userAddress: string): Promise<string> {
    const transfer = transferStorage.getTransfer(transferId)
    if (!transfer || !transfer.messageHash) {
      throw new Error("Transfer not found or missing message hash")
    }

    try {
      this.notifyUpdate({ id: transferId, status: "attested", message: "Executing mint transaction..." })

      const mintTxHash = await cctpService.completeCCTPTransfer(
        transfer.messageHash,
        userAddress as `0x${string}`,
        transfer.sourceChain,
        transfer.destinationChain,
      )

      transferStorage.updateTransferStatus(transferId, "minted", { mintTxHash })
      this.notifyUpdate({
        id: transferId,
        status: "minted",
        message: "Transfer completed successfully!",
        txHash: mintTxHash,
      })

      this.stopPolling(transferId)
      return mintTxHash
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Mint failed"
      transferStorage.updateTransferStatus(transferId, "failed", { lastError: errorMessage })
      this.notifyUpdate({ id: transferId, status: "failed", error: errorMessage })
      throw error
    }
  }

  private startPolling(
    transferId: string,
    messageHash: string,
    sourceChain: CCTPNetwork,
    destinationChain: CCTPNetwork,
  ): void {
    // Clear existing polling if any
    this.stopPolling(transferId)

    console.log("[v0] Starting attestation polling for transfer:", transferId)

    const pollInterval = setInterval(async () => {
      try {
        const status = await cctpService.getTransferStatus(messageHash, sourceChain, destinationChain, BigInt(0))

        if (status.status === "attested" && status.canMint) {
          transferStorage.updateTransferStatus(transferId, "attested", {
            attestation: status.attestation?.attestation,
          })
          this.notifyUpdate({
            id: transferId,
            status: "attested",
            message: "Attestation received! Ready to mint.",
            attestation: status.attestation?.attestation,
          })
          this.stopPolling(transferId)
        } else if (status.status === "minted") {
          transferStorage.updateTransferStatus(transferId, "minted")
          this.notifyUpdate({
            id: transferId,
            status: "minted",
            message: "Transfer completed!",
          })
          this.stopPolling(transferId)
        } else if (status.status === "failed") {
          transferStorage.updateTransferStatus(transferId, "failed", {
            lastError: status.attestation?.error,
          })
          this.notifyUpdate({
            id: transferId,
            status: "failed",
            error: status.attestation?.error || "Transfer failed",
          })
          this.stopPolling(transferId)
        }
      } catch (error) {
        console.error("[v0] Polling error for transfer", transferId, ":", error)
        // Continue polling on errors, but increment retry count
        const transfer = transferStorage.getTransfer(transferId)
        if (transfer) {
          const retryCount = (transfer.retryCount || 0) + 1
          if (retryCount > 20) {
            // Stop after 20 failed attempts
            transferStorage.updateTransferStatus(transferId, "failed", {
              lastError: "Max retry attempts exceeded",
              retryCount,
            })
            this.notifyUpdate({
              id: transferId,
              status: "failed",
              error: "Max retry attempts exceeded",
            })
            this.stopPolling(transferId)
          } else {
            transferStorage.saveTransfer({ ...transfer, retryCount })
          }
        }
      }
    }, 10000) // Poll every 10 seconds

    this.activePolling.set(transferId, pollInterval)
  }

  private stopPolling(transferId: string): void {
    const interval = this.activePolling.get(transferId)
    if (interval) {
      clearInterval(interval)
      this.activePolling.delete(transferId)
      console.log("[v0] Stopped polling for transfer:", transferId)
    }
  }

  private notifyUpdate(update: TransferUpdate): void {
    // Notify transfer-specific callbacks
    const callbacks = this.updateCallbacks.get(update.id) || []
    callbacks.forEach((callback) => callback(update))

    // Notify global callbacks
    this.globalCallbacks.forEach((callback) => callback(update))
  }

  subscribeToTransfer(transferId: string, callback: TransferUpdateCallback): () => void {
    const callbacks = this.updateCallbacks.get(transferId) || []
    callbacks.push(callback)
    this.updateCallbacks.set(transferId, callbacks)

    // Return unsubscribe function
    return () => {
      const currentCallbacks = this.updateCallbacks.get(transferId) || []
      const filteredCallbacks = currentCallbacks.filter((cb) => cb !== callback)
      if (filteredCallbacks.length > 0) {
        this.updateCallbacks.set(transferId, filteredCallbacks)
      } else {
        this.updateCallbacks.delete(transferId)
      }
    }
  }

  subscribeToAllTransfers(callback: TransferUpdateCallback): () => void {
    this.globalCallbacks.push(callback)

    return () => {
      const index = this.globalCallbacks.indexOf(callback)
      if (index > -1) {
        this.globalCallbacks.splice(index, 1)
      }
    }
  }

  getTransfer(id: string): StoredTransfer | null {
    return transferStorage.getTransfer(id)
  }

  getAllTransfers(): StoredTransfer[] {
    return transferStorage.getAllTransfers()
  }

  getActiveTransfers(): StoredTransfer[] {
    return transferStorage.getActiveTransfers()
  }

  cleanup(): void {
    // Stop all active polling
    this.activePolling.forEach((interval) => clearInterval(interval))
    this.activePolling.clear()

    // Clear callbacks
    this.updateCallbacks.clear()
    this.globalCallbacks.length = 0
  }
}

// Singleton instance
export const transferTracker = new TransferTracker()

// Cleanup on page unload
if (typeof window !== "undefined") {
  window.addEventListener("beforeunload", () => {
    transferTracker.cleanup()
  })
}
