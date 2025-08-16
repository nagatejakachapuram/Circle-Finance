import { CCTPClient, type CCTPTransfer } from "./cctp-client"
import { attestationService, type AttestationResponse } from "./attestation-service"
import { generateMessageHash } from "./cctp-utils"
import { CCTP_NETWORKS, type CCTPNetwork } from "./cctp-config"
import type { Address, Hash } from "viem"

export interface CCTPTransferResult {
  transfer: CCTPTransfer
  burnTxHash: Hash
  messageHash: string
}

export interface CompleteCCTPTransfer extends CCTPTransfer {
  messageHash: string
  attestation: string
  message: string
}

export class CCTPService {
  private clients: Map<string, CCTPClient> = new Map()

  private getClient(sourceChain: CCTPNetwork, destinationChain: CCTPNetwork): CCTPClient {
    const key = `${sourceChain}-${destinationChain}`

    if (!this.clients.has(key)) {
      this.clients.set(key, new CCTPClient(sourceChain, destinationChain))
    }

    return this.clients.get(key)!
  }

  async initiateCCTPTransfer(
    sourceChain: CCTPNetwork,
    destinationChain: CCTPNetwork,
    amount: string,
    userAddress: Address,
    destinationAddress: Address,
  ): Promise<CCTPTransferResult> {
    console.log("[v0] Initiating CCTP transfer:", { sourceChain, destinationChain, amount })

    const client = this.getClient(sourceChain, destinationChain)

    // Step 1: Check USDC balance
    const balance = await client.getUSDCBalance(userAddress)
    if (Number.parseFloat(balance) < Number.parseFloat(amount)) {
      throw new Error(`Insufficient USDC balance. Available: ${balance}, Required: ${amount}`)
    }

    // Step 2: Approve USDC spending
    console.log("[v0] Approving USDC spending...")
    const approvalTx = await client.approveUSDC(userAddress, amount)
    console.log("[v0] Approval transaction:", approvalTx)

    // Step 3: Burn USDC and get nonce
    console.log("[v0] Burning USDC...")
    const { hash: burnTxHash, nonce, transfer } = await client.burnUSDC(userAddress, amount, destinationAddress)

    // Step 4: Generate message hash for attestation
    const sourceNetwork = CCTP_NETWORKS[sourceChain]
    const destinationNetwork = CCTP_NETWORKS[destinationChain]

    const messageHash = generateMessageHash(
      0, // version
      sourceNetwork.domain,
      destinationNetwork.domain,
      nonce,
      sourceNetwork.tokenMessenger,
      destinationNetwork.tokenMessenger,
      "0x", // messageBody for USDC transfers is typically empty
    )

    console.log("[v0] CCTP transfer initiated successfully:", {
      burnTxHash,
      messageHash,
      nonce: nonce.toString(),
    })

    return {
      transfer: {
        ...transfer,
        status: "burned",
      },
      burnTxHash,
      messageHash,
    }
  }

  async completeCCTPTransfer(
    messageHash: string,
    userAddress: Address,
    sourceChain: CCTPNetwork,
    destinationChain: CCTPNetwork,
  ): Promise<Hash> {
    console.log("[v0] Completing CCTP transfer:", { messageHash, sourceChain, destinationChain })

    // Step 1: Get attestation
    const attestationResult = await attestationService.waitForAttestation(messageHash)

    if (attestationResult.status !== "complete" || !attestationResult.attestation || !attestationResult.message) {
      throw new Error(`Attestation failed: ${attestationResult.error}`)
    }

    // Step 2: Mint USDC on destination chain
    const client = this.getClient(sourceChain, destinationChain)
    const { hash: mintTxHash } = await client.mintUSDC(
      attestationResult.message,
      attestationResult.attestation,
      userAddress,
    )

    console.log("[v0] CCTP transfer completed successfully:", mintTxHash)
    return mintTxHash
  }

  async getTransferStatus(
    messageHash: string,
    sourceChain: CCTPNetwork,
    destinationChain: CCTPNetwork,
    nonce: bigint,
  ): Promise<{
    status: "pending" | "burned" | "attested" | "minted" | "failed"
    attestation?: AttestationResponse
    canMint: boolean
  }> {
    try {
      // Check attestation status
      const attestationResult = await attestationService.getAttestation(messageHash)

      let status: "pending" | "burned" | "attested" | "minted" | "failed" = "burned"
      let canMint = false

      if (attestationResult.status === "complete") {
        status = "attested"
        canMint = true

        // Check if already minted by looking at destination chain
        const client = this.getClient(sourceChain, destinationChain)
        const isUsed = await client.isMessageUsed(messageHash)

        if (isUsed) {
          status = "minted"
          canMint = false
        }
      } else if (attestationResult.status === "failed") {
        status = "failed"
      }

      return {
        status,
        attestation: attestationResult,
        canMint,
      }
    } catch (error) {
      console.error("[v0] Failed to get transfer status:", error)
      return {
        status: "failed",
        canMint: false,
      }
    }
  }

  async estimateTransferTime(sourceChain: CCTPNetwork, destinationChain: CCTPNetwork): Promise<string> {
    // Base times in minutes for different networks
    const networkTimes: Record<CCTPNetwork, number> = {
      ethereum: 15,
      base: 2,
      arbitrum: 5,
      polygon: 10,
    }

    const sourceTime = networkTimes[sourceChain] || 10
    const destTime = networkTimes[destinationChain] || 10
    const attestationTime = 5 // Circle attestation service time

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

// Singleton instance
export const cctpService = new CCTPService()
