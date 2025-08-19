"use client"
import { CCTPV2Client, type CCTPV2Transfer } from "./cctp-client"
import { attestationService, type AttestationResponse } from "./attestation-service"
import { generateMessageHash } from "./cctp-utils"
import { CCTP_V2_NETWORKS, type CCTPV2Network, type TransferOptions } from "./cctp-config"
import type { Address, Hash } from "viem"

// --- FIX: Centralize the sandbox URL to avoid hardcoding mainnet URLs ---
const CCTP_API_SANDBOX_URL = "https://iris-api-sandbox.circle.com"

export interface CCTPV2TransferResult {
  transfer: CCTPV2Transfer
  burnTxHash: Hash
  messageHash: string
  usedFastTransfer: boolean
}

export interface CompleteCCTPV2Transfer extends CCTPV2Transfer {
  messageHash: string
  attestation: string
  message: string
}

export interface FastTransferAttestation {
  messageHash: string
  attestation: string
  message: string
  fastTransferComplete: boolean
  estimatedCompletionTime: number
}

export class CCTPV2Service {
  private clients: Map<string, CCTPV2Client> = new Map()

  private getClient(sourceChain: CCTPV2Network, destinationChain: CCTPV2Network): CCTPV2Client {
    const key = `${sourceChain}-${destinationChain}`

    if (!this.clients.has(key)) {
      this.clients.set(key, new CCTPV2Client(sourceChain, destinationChain))
    }

    return this.clients.get(key)!
  }

  async initiateCCTPTransfer(
    sourceChain: CCTPV2Network,
    destinationChain: CCTPV2Network,
    amount: string,
    userAddress: Address,
    destinationAddress: Address,
    options: TransferOptions = {},
  ): Promise<CCTPV2TransferResult> {
    console.log("[v0] Initiating CCTP V2 transfer:", {
      sourceChain,
      destinationChain,
      amount,
      useFastTransfer: options.useFastTransfer,
      hasHook: !!options.hookData,
    })

    const client = this.getClient(sourceChain, destinationChain)

    if (options.useFastTransfer) {
      const fastTransferStatus = await client.checkFastTransferAvailability(amount)
      if (!fastTransferStatus.available) {
        console.log("[v0] Fast Transfer not available, falling back to standard transfer:", fastTransferStatus.reason)
        options.useFastTransfer = false
      } else {
        console.log("[v0] Fast Transfer confirmed available")
      }
    }

    const balance = await client.getUSDCBalance(userAddress)
    if (Number.parseFloat(balance) < Number.parseFloat(amount)) {
      throw new Error(`Insufficient USDC balance. Available: ${balance}, Required: ${amount}`)
    }

    console.log("[v0] Approving USDC spending for V2...")
    const approvalTx = await client.approveUSDC(userAddress, amount)

    if (approvalTx !== "0x0000000000000000000000000000000000000000000000000000000000000000") {
      console.log("[v0] Waiting for approval transaction:", approvalTx)
      await client.sourcePublicClient.waitForTransactionReceipt({ hash: approvalTx })
      console.log("[v0] V2 approval transaction confirmed")
    } else {
      console.log("[v0] Approval not needed - sufficient allowance exists")
    }

    console.log("[v0] Burning USDC with V2 features...")
    const {
      hash: burnTxHash,
      nonce,
      transfer,
    } = await client.burnUSDC(userAddress, amount, destinationAddress, options)

    const sourceNetwork = CCTP_V2_NETWORKS[sourceChain]
    const destinationNetwork = CCTP_V2_NETWORKS[destinationChain]

    const messageHash = generateMessageHash(
      0,
      sourceNetwork.domain,
      destinationNetwork.domain,
      nonce,
      sourceNetwork.tokenMessengerV2,
      destinationNetwork.tokenMessengerV2,
      options.hookData ? options.hookData.callData : "0x",
    )

    console.log("[v0] CCTP V2 transfer initiated successfully:", {
      burnTxHash,
      messageHash,
      nonce: nonce.toString(),
      usedFastTransfer: options.useFastTransfer,
      hasHook: !!options.hookData,
    })

    return {
      transfer: {
        ...transfer,
        status: "burned",
      },
      burnTxHash,
      messageHash,
      usedFastTransfer: options.useFastTransfer || false,
    }
  }

  async completeCCTPTransfer(
    messageHash: string,
    userAddress: Address,
    sourceChain: CCTPV2Network,
    destinationChain: CCTPV2Network,
    usedFastTransfer = false,
  ): Promise<Hash> {
    console.log("[v0] Completing CCTP V2 transfer:", {
      messageHash,
      sourceChain,
      destinationChain,
      usedFastTransfer,
    })
    const sourceDomain = CCTP_V2_NETWORKS[sourceChain].domain
    let attestationResult: AttestationResponse

    if (usedFastTransfer) {
      console.log("[v0] Using Fast Transfer attestation service...")
      attestationResult = await this.waitForFastTransferAttestation(messageHash, sourceDomain)
    } else {
      console.error("[v0] Error: Standard attestation requires burn transaction hash, not message hash")
      throw new Error(
        "Standard attestation requires burn transaction hash. Please use the completeCCTPTransferWithBurnTx method.",
      )
    }

    if (attestationResult.status !== "complete" || !attestationResult.attestation || !attestationResult.message) {
      throw new Error(`V2 Attestation failed: ${attestationResult.error}`)
    }

    const client = this.getClient(sourceChain, destinationChain)
    const { hash: mintTxHash } = await client.mintUSDC(
      attestationResult.message,
      attestationResult.attestation,
      userAddress,
    )

    console.log("[v0] CCTP V2 transfer completed successfully:", mintTxHash)
    return mintTxHash
  }

  async completeCCTPTransferWithBurnTx(
    messageHash: string,
    burnTxHash: string,
    userAddress: Address,
    sourceChain: CCTPV2Network,
    destinationChain: CCTPV2Network,
    sourceDomain: number,
    usedFastTransfer = false,
  ): Promise<Hash> {
    console.log("[v0] Completing CCTP V2 transfer with burn tx:", {
      messageHash,
      burnTxHash,
      sourceChain,
      destinationChain,
      usedFastTransfer,
    })

    let attestationResult: AttestationResponse

    if (usedFastTransfer) {
      console.log("[v0] Using Fast Transfer attestation service...")
      attestationResult = await this.waitForFastTransferAttestation(messageHash, sourceDomain)
    } else {
      console.log("[v0] Using standard attestation with burn transaction hash...")
      attestationResult = await attestationService.waitForAttestation(burnTxHash, sourceDomain)
    }

    if (attestationResult.status !== "complete" || !attestationResult.attestation || !attestationResult.message) {
      throw new Error(`V2 Attestation failed: ${attestationResult.error}`)
    }

    const client = this.getClient(sourceChain, destinationChain)
    const { hash: mintTxHash } = await client.mintUSDC(
      attestationResult.message,
      attestationResult.attestation,
      userAddress,
    )

    console.log("[v0] CCTP V2 transfer completed successfully:", mintTxHash)
    return mintTxHash
  }

  // --- FIX: Updated function signature and logic ---
  private async waitForFastTransferAttestation(
    messageHash: string,
    sourceDomain: number,
  ): Promise<AttestationResponse> {
    const maxAttempts = 20
    const pollInterval = 2000

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        console.log(`[v0] Fast Transfer attestation attempt ${attempt}/${maxAttempts}`)

        const response = await fetch(`${CCTP_API_SANDBOX_URL}/v2/messages/${sourceDomain}?messageHash=${messageHash}`)

        if (response.ok) {
          const data = await response.json()
          const message = data.messages?.[0]

          if (message && message.attestation && message.attestation !== "PENDING") {
            console.log("[v0] Fast Transfer attestation received!")
            return {
              status: "complete",
              attestation: message.attestation,
              message: message.message,
            }
          }
        }

        if (attempt < maxAttempts) {
          await new Promise((resolve) => setTimeout(resolve, pollInterval))
        }
      } catch (error) {
        console.error(`[v0] Fast Transfer attestation attempt ${attempt} failed:`, error)
      }
    }

    console.log("[v0] Fast Transfer attestation timeout")
    return { status: "failed", error: "Fast Transfer attestation timeout - max retries exceeded" }
  }

  // --- FIX: Updated entire method to correctly use sourceDomain and sandbox URL ---
  async getTransferStatus(
    burnTxHash: string,
    messageHash: string,
    sourceChain: CCTPV2Network,
    destinationChain: CCTPV2Network,
    nonce: bigint,
    sourceDomain: number, // Added sourceDomain as a required parameter for reliability
    usedFastTransfer = false,
  ): Promise<{
    status: "pending" | "burned" | "attested" | "minted" | "failed"
    attestation?: AttestationResponse
    canMint: boolean
    fastTransferComplete?: boolean
  }> {
    try {
      let attestationResult: AttestationResponse

      if (usedFastTransfer) {
        try {
          const response = await fetch(`${CCTP_API_SANDBOX_URL}/v2/messages/${sourceDomain}?messageHash=${messageHash}`)
          if (response.ok) {
            const data = await response.json()
            const message = data.messages?.[0]
            attestationResult = {
              status: message && message.attestation && message.attestation !== "PENDING" ? "complete" : "pending",
              attestation: message?.attestation,
              message: message?.message,
            }
          } else {
            attestationResult = await attestationService.getAttestation(sourceDomain, burnTxHash)
          }
        } catch (error) {
          console.error("[v0] Fast Transfer status check failed, using standard service:", error)
          attestationResult = await attestationService.getAttestation(sourceDomain, burnTxHash)
        }
      } else {
        attestationResult = await attestationService.getAttestation(sourceDomain, burnTxHash)
      }

      let status: "pending" | "burned" | "attested" | "minted" | "failed" = "burned"
      let canMint = false
      let fastTransferComplete = false

      if (attestationResult.status === "complete") {
        status = "attested"
        canMint = true
        fastTransferComplete = usedFastTransfer

        const client = this.getClient(sourceChain, destinationChain)
        const isUsed = await client.isMessageUsed(messageHash)

        if (isUsed) {
          status = "minted"
          canMint = false
        }
      } else if (attestationResult.status === "failed") {
        status = "failed"
      }

      return { status, attestation: attestationResult, canMint, fastTransferComplete }
    } catch (error) {
      console.error("[v0] Failed to get V2 transfer status:", error)
      return { status: "failed", canMint: false, fastTransferComplete: false }
    }
  }

  async estimateTransferTime(
    sourceChain: CCTPV2Network,
    destinationChain: CCTPV2Network,
    amount?: string,
    useFastTransfer = false,
  ): Promise<string> {
    if (useFastTransfer && amount) {
      const sourceNetwork = CCTP_V2_NETWORKS[sourceChain]
      const destinationNetwork = CCTP_V2_NETWORKS[destinationChain]
      if (sourceNetwork.fastTransferEnabled && destinationNetwork.fastTransferEnabled) {
        const amountBigInt = BigInt(Number.parseFloat(amount) * 1000000)
        const maxAmountBigInt = BigInt(sourceNetwork.fastTransferAllowance)
        if (amountBigInt <= maxAmountBigInt) {
          return "~30 seconds"
        }
      }
    }

    const networkTimes: Record<CCTPV2Network, number> = { ethereum: 12, base: 2, arbitrum: 4, polygon: 8 }
    const sourceTime = networkTimes[sourceChain] || 8
    const destTime = networkTimes[destinationChain] || 8
    const attestationTime = 3
    const totalMinutes = Math.max(sourceTime, destTime) + attestationTime

    if (totalMinutes < 60) {
      return `~${totalMinutes} minutes`
    } else {
      const hours = Math.floor(totalMinutes / 60)
      const minutes = totalMinutes % 60
      return minutes > 0 ? `~${hours}h ${minutes}m` : `~${hours}h`
    }
  }
}

export const CCTPService = CCTPV2Service
export type CCTPTransferResult = CCTPV2TransferResult
export type CompleteCCTPTransfer = CompleteCCTPV2Transfer
export const cctpService = new CCTPV2Service()
