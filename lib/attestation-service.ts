import type { CCTPNetwork } from "./cctp-config"

export interface AttestationResponse {
  status: "pending" | "complete" | "failed"
  attestation?: string
  message?: string
  messageHash?: string
  error?: string
}

export interface MessageStatus {
  messageHash: string
  sourceChain: CCTPNetwork
  destinationChain: CCTPNetwork
  nonce: bigint
  status: "pending" | "attested" | "failed"
  attestation?: string
  message?: string
  timestamp: number
}

export class AttestationService {
  private readonly baseUrl = "https://iris-api.circle.com"
  private readonly maxRetries = 60 // 5 minutes with 5-second intervals
  private readonly retryInterval = 5000 // 5 seconds

  constructor() {}

  async getAttestation(messageHash: string): Promise<AttestationResponse> {
    try {
      console.log("[v0] Fetching attestation for message hash:", messageHash)

      const response = await fetch(`${this.baseUrl}/attestations/${messageHash}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        if (response.status === 404) {
          return {
            status: "pending",
            error: "Attestation not yet available",
          }
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()

      if (data.status === "complete" && data.attestation) {
        return {
          status: "complete",
          attestation: data.attestation,
          message: data.message,
          messageHash,
        }
      } else if (data.status === "pending") {
        return {
          status: "pending",
          error: "Attestation is being processed",
        }
      } else {
        return {
          status: "failed",
          error: data.error || "Unknown attestation error",
        }
      }
    } catch (error) {
      console.error("[v0] Attestation service error:", error)
      return {
        status: "failed",
        error: error instanceof Error ? error.message : "Failed to fetch attestation",
      }
    }
  }

  async waitForAttestation(
    messageHash: string,
    onProgress?: (attempt: number, maxAttempts: number) => void,
  ): Promise<AttestationResponse> {
    console.log("[v0] Starting attestation polling for:", messageHash)

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        onProgress?.(attempt, this.maxRetries)

        const result = await this.getAttestation(messageHash)

        if (result.status === "complete") {
          console.log("[v0] Attestation received successfully")
          return result
        }

        if (result.status === "failed") {
          console.error("[v0] Attestation failed:", result.error)
          return result
        }

        // Status is pending, wait and retry
        if (attempt < this.maxRetries) {
          console.log(
            `[v0] Attestation pending, retrying in ${this.retryInterval / 1000}s (${attempt}/${this.maxRetries})`,
          )
          await new Promise((resolve) => setTimeout(resolve, this.retryInterval))
        }
      } catch (error) {
        console.error(`[v0] Attestation attempt ${attempt} failed:`, error)

        if (attempt === this.maxRetries) {
          return {
            status: "failed",
            error: "Max retry attempts reached",
          }
        }

        await new Promise((resolve) => setTimeout(resolve, this.retryInterval))
      }
    }

    return {
      status: "failed",
      error: "Attestation timeout - max retries exceeded",
    }
  }

  async getMessageStatus(
    messageHash: string,
    sourceChain: CCTPNetwork,
    destinationChain: CCTPNetwork,
    nonce: bigint,
  ): Promise<MessageStatus> {
    const attestationResult = await this.getAttestation(messageHash)

    return {
      messageHash,
      sourceChain,
      destinationChain,
      nonce,
      status:
        attestationResult.status === "complete"
          ? "attested"
          : attestationResult.status === "failed"
            ? "failed"
            : "pending",
      attestation: attestationResult.attestation,
      message: attestationResult.message,
      timestamp: Date.now(),
    }
  }

  async getMultipleAttestations(messageHashes: string[]): Promise<Record<string, AttestationResponse>> {
    console.log("[v0] Fetching multiple attestations:", messageHashes.length)

    const results: Record<string, AttestationResponse> = {}

    // Process in batches to avoid overwhelming the API
    const batchSize = 5
    for (let i = 0; i < messageHashes.length; i += batchSize) {
      const batch = messageHashes.slice(i, i + batchSize)
      const batchPromises = batch.map(async (hash) => {
        const result = await this.getAttestation(hash)
        return { hash, result }
      })

      const batchResults = await Promise.allSettled(batchPromises)

      batchResults.forEach((promiseResult, index) => {
        const hash = batch[index]
        if (promiseResult.status === "fulfilled") {
          results[hash] = promiseResult.value.result
        } else {
          results[hash] = {
            status: "failed",
            error: "Failed to fetch attestation",
          }
        }
      })

      // Small delay between batches
      if (i + batchSize < messageHashes.length) {
        await new Promise((resolve) => setTimeout(resolve, 100))
      }
    }

    return results
  }

  async isAttestationReady(messageHash: string): Promise<boolean> {
    const result = await this.getAttestation(messageHash)
    return result.status === "complete"
  }

  // Helper method to construct message hash from transaction details
  constructMessageHash(
    sourceDomain: number,
    destinationDomain: number,
    nonce: bigint,
    sender: string,
    recipient: string,
    messageBody: string,
  ): string {
    // This would typically use the same hashing logic as in cctp-utils.ts
    // For now, return a placeholder that would be replaced with actual implementation
    return `0x${sourceDomain.toString(16).padStart(8, "0")}${destinationDomain.toString(16).padStart(8, "0")}${nonce.toString(16).padStart(16, "0")}`
  }

  // Get attestation service health status
  async getServiceHealth(): Promise<{ status: "healthy" | "degraded" | "down"; latency?: number }> {
    const startTime = Date.now()

    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      const latency = Date.now() - startTime

      if (response.ok) {
        return { status: "healthy", latency }
      } else if (response.status >= 500) {
        return { status: "down", latency }
      } else {
        return { status: "degraded", latency }
      }
    } catch (error) {
      const latency = Date.now() - startTime
      console.error("[v0] Health check failed:", error)
      return { status: "down", latency }
    }
  }
}

// Singleton instance
export const attestationService = new AttestationService()
