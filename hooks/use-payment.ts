"use client"

import { useState, useCallback } from "react"
import type { PaymentRequest, PaymentResult } from "@/lib/payment-processor"

export function usePayment() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createPaymentIntent = useCallback(async (request: PaymentRequest): Promise<PaymentResult | null> => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/payments/intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
      })

      const data = await response.json()

      if (!data.success) {
        setError(data.error)
        return null
      }

      return {
        success: true,
        paymentIntent: data.paymentIntent,
        order: data.order,
        estimatedGas: data.estimatedGas ? BigInt(data.estimatedGas) : undefined,
        networkFee: data.networkFee,
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to create payment intent"
      setError(errorMessage)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [])

  const processPayment = useCallback(async (paymentIntentId: string, txHash: string): Promise<boolean> => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/payments/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentIntentId, txHash }),
      })

      const data = await response.json()

      if (!data.success) {
        setError(data.error)
        return false
      }

      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to process payment"
      setError(errorMessage)
      return false
    } finally {
      setIsLoading(false)
    }
  }, [])

  const getPaymentStatus = useCallback(async (paymentIntentId: string): Promise<string | null> => {
    try {
      const response = await fetch(`/api/payments/status/${paymentIntentId}`)
      const data = await response.json()

      if (!data.success) {
        setError(data.error)
        return null
      }

      return data.status
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to get payment status"
      setError(errorMessage)
      return null
    }
  }, [])

  return {
    createPaymentIntent,
    processPayment,
    getPaymentStatus,
    isLoading,
    error,
  }
}
