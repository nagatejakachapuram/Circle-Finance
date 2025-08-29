import { cctpService } from "./cctp-service"
import { transferStorage, type StoredTransfer } from "./transfer-storage"
import { CCTP_V2_NETWORKS, type CCTPNetwork } from "./cctp-config"
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
    if (typeof window !== "undefined") {
      this.resumeActiveTransfers()
    }
  }

  private resumeActiveTransfers(): void {
    const activeTransfers = transferStorage.getActiveTransfers()
    console.log("[v0] Resuming tracking for", activeTransfers.length, "active transfers")

    activeTransfers.forEach((transfer) => {
      // CORRECTED: Check for the burnTxHash, as it's the key for polling.
      if (transfer.burnTxHash) {
        // CORRECTED: Pass the burnTxHash to the startPolling function, not the messageHash.
        this.startPolling(
          transfer.id,
          transfer.burnTxHash,
          transfer.sourceChain,
          transfer.destinationChain,
          transfer.sourceDomain,
        )
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
    const sourceDomain = CCTP_V2_NETWORKS[sourceChain].domain

    const transfer: StoredTransfer = {
      id: transferId,
      sourceChain,
      destinationChain,
      sourceDomain,
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

      this.startPolling(
        transferId,
        result.burnTxHash,
        transfer.sourceChain,
        transfer.destinationChain,
        transfer.sourceDomain,
      )

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
    if (!transfer || !transfer.messageHash || !transfer.burnTxHash) {
      throw new Error("Transfer not found or missing required transaction hashes")
    }

    try {
      this.notifyUpdate({ id: transferId, status: "attested", message: "Executing mint transaction..." })

      const mintTxHash = await cctpService.completeCCTPTransferWithBurnTx(
        transfer.messageHash,
        transfer.burnTxHash,
        userAddress as `0x${string}`,
        transfer.sourceChain,
        transfer.destinationChain,
        transfer.sourceDomain,
        false,
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
    burnTxHash: string,
    sourceChain: CCTPNetwork,
    destinationChain: CCTPNetwork,
    sourceDomain: number,
  ): void {
    this.stopPolling(transferId)
    console.log("[v0] Starting attestation polling for transfer:", transferId)

    const pollInterval = setInterval(async () => {
      try {
        const transfer = transferStorage.getTransfer(transferId)
        if (!transfer || !transfer.nonce || !transfer.messageHash) {
          this.stopPolling(transferId)
          return
        }

        const status = await cctpService.getTransferStatus(
          burnTxHash,
          transfer.messageHash,
          sourceChain,
          destinationChain,
          transfer.nonce,
          sourceDomain,
          false,
        )

        if (status.status === "attested" && status.canMint) {
          transferStorage.updateTransferStatus(transferId, "attested", { attestation: status.attestation?.attestation })
          this.notifyUpdate({
            id: transferId,
            status: "attested",
            message: "Attestation received! Ready to mint.",
            attestation: status.attestation?.attestation,
          })
          this.stopPolling(transferId)
        } else if (status.status === "minted") {
          transferStorage.updateTransferStatus(transferId, "minted")
          this.notifyUpdate({ id: transferId, status: "minted", message: "Transfer completed!" })
          this.stopPolling(transferId)
        } else if (status.status === "failed") {
          transferStorage.updateTransferStatus(transferId, "failed", { lastError: status.attestation?.error })
          this.notifyUpdate({ id: transferId, status: "failed", error: status.attestation?.error || "Transfer failed" })
          this.stopPolling(transferId)
        }
      } catch (error) {
        console.error("[v0] Polling error for transfer", transferId, ":", error)
        const transfer = transferStorage.getTransfer(transferId)
        if (transfer) {
          const retryCount = (transfer.retryCount || 0) + 1
          if (retryCount > 20) {
            transferStorage.updateTransferStatus(transferId, "failed", {
              lastError: "Max retry attempts exceeded",
              retryCount,
            })
            this.notifyUpdate({ id: transferId, status: "failed", error: "Max retry attempts exceeded" })
            this.stopPolling(transferId)
          } else {
            transferStorage.saveTransfer({ ...transfer, retryCount })
          }
        }
      }
    }, 10000)

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
    const callbacks = this.updateCallbacks.get(update.id) || []
    callbacks.forEach((callback) => callback(update))
    this.globalCallbacks.forEach((callback) => callback(update))
  }

  subscribeToTransfer(transferId: string, callback: TransferUpdateCallback): () => void {
    const callbacks = this.updateCallbacks.get(transferId) || []
    callbacks.push(callback)
    this.updateCallbacks.set(transferId, callbacks)
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
    this.activePolling.forEach((interval) => clearInterval(interval))
    this.activePolling.clear()
    this.updateCallbacks.clear()
    this.globalCallbacks.length = 0
  }
}

export const transferTracker = new TransferTracker()

if (typeof window !== "undefined") {
  window.addEventListener("beforeunload", () => {
    transferTracker.cleanup()
  })
}


