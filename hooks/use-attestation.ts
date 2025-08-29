"use client"

import { useState, useEffect, useCallback } from "react"
import { attestationService, type AttestationResponse, type MessageStatus } from "@/lib/attestation-service"
import type { CCTPNetwork } from "@/lib/cctp-config"
import { CCTP_V2_NETWORKS } from "@/lib/cctp-config"

interface UseAttestationOptions {
  autoStart?: boolean
  onComplete?: (attestation: AttestationResponse) => void
  onError?: (error: string) => void
  onProgress?: (attempt: number, maxAttempts: number) => void
}

export function useAttestation(messageHash?: string,
  sourceChain?: CCTPNetwork,   // ✅ added
  nonce?: bigint,              // ✅ added
  options: UseAttestationOptions = {}) {
  const [attestation, setAttestation] = useState<AttestationResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null)

  const fetchAttestation = useCallback(
    async (hash: string) => {
      if (!hash || !sourceChain || nonce === undefined) return

      setIsLoading(true)
      setError(null)
      setProgress(null)

      try {
        const result = await attestationService.waitForAttestation(
          hash,
          CCTP_V2_NETWORKS[sourceChain].domain,
          nonce?.toString(),
          (attempt: number, maxAttempts: number) => {
            setProgress({ current: attempt, total: maxAttempts })
            options.onProgress?.(attempt, maxAttempts)
          }
        )


        setAttestation(result)

        if (result.status === "complete") {
          options.onComplete?.(result)
        } else if (result.status === "failed") {
          setError(result.error || "Attestation failed")
          options.onError?.(result.error || "Attestation failed")
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to fetch attestation"
        setError(errorMessage)
        options.onError?.(errorMessage)
      } finally {
        setIsLoading(false)
        setProgress(null)
      }
    },
    [options, sourceChain, nonce],
  )

  const checkAttestation = useCallback(async (hash: string) => {
    if (!hash) return null

    try {
      if (!sourceChain) return null;
      const result = await attestationService.getAttestation(
        CCTP_V2_NETWORKS[sourceChain].domain,
        hash,
        nonce?.toString()
      )

      setAttestation(result)
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to check attestation"
      setError(errorMessage)
      return null
    }
  }, [])

  const reset = useCallback(() => {
    setAttestation(null)
    setIsLoading(false)
    setError(null)
    setProgress(null)
  }, [])

  useEffect(() => {
    if (messageHash && options.autoStart) {
      fetchAttestation(messageHash)
    }
  }, [messageHash, options.autoStart, fetchAttestation])

  return {
    attestation,
    isLoading,
    error,
    progress,
    fetchAttestation,
    checkAttestation,
    reset,
  }
}

export function useMessageStatus(
  messageHash?: string,
  burnTxHash?: string,
  sourceChain?: CCTPNetwork,
  destinationChain?: CCTPNetwork,
  nonce?: bigint,
) {
  const [status, setStatus] = useState<MessageStatus | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchStatus = useCallback(async () => {
    if (!messageHash || !sourceChain || !destinationChain || nonce === undefined) return

    setIsLoading(true)
    setError(null)

    try {
      const result = await attestationService.getMessageStatus(
        messageHash,
        burnTxHash ?? "",
        sourceChain,
        destinationChain,
        nonce!,
        CCTP_V2_NETWORKS[sourceChain].domain
      )

      setStatus(result)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch message status"
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }, [messageHash, sourceChain, destinationChain, nonce])

  const refresh = useCallback(() => {
    fetchStatus()
  }, [fetchStatus])

  useEffect(() => {
    fetchStatus()
  }, [fetchStatus])

  return {
    status,
    isLoading,
    error,
    refresh,
  }
}

export function useAttestationHealth() {
  const [health, setHealth] = useState<{ status: "healthy" | "degraded" | "down"; latency?: number } | null>(null)
  const [isChecking, setIsChecking] = useState(false)

  const checkHealth = useCallback(async () => {
    setIsChecking(true)
    try {
      const result = await attestationService.getServiceHealth()
      setHealth(result)
    } catch (err) {
      setHealth({ status: "down" })
    } finally {
      setIsChecking(false)
    }
  }, [])

  useEffect(() => {
    checkHealth()
    // Check health every 30 seconds
    const interval = setInterval(checkHealth, 30000)
    return () => clearInterval(interval)
  }, [checkHealth])

  return {
    health,
    isChecking,
    checkHealth,
  }
}
