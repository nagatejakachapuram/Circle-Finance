"use client"

import { useState, useCallback } from "react"
import { paymentProcessor, type PaymentRequest, type PaymentResult } from "@/lib/payment-processor"

export function usePayment() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createPaymentIntent = useCallback(async (request: PaymentRequest): Promise<PaymentResult> => {
    setIsLoading(true)
    setError(null)

    try {
      return await paymentProcessor.createPaymentIntent(request)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to create payment intent"
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setIsLoading(false)
    }
  }, [])

  const processPayment = useCallback(async (data: {
    paymentIntentId: string
    chainId: number
    fromAddress: string
    toAddress: string
    amount: number
  }): Promise<PaymentResult> => {
    setIsLoading(true)
    setError(null)

    try {
      return await paymentProcessor.processPayment(data)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to process payment"
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setIsLoading(false)
    }
  }, [])

  const estimateGas = useCallback(async (request: PaymentRequest, userAddress: string): Promise<bigint> => {
    try {
      return await paymentProcessor.estimateGas(request, userAddress)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to estimate gas"
      setError(errorMessage)
      return BigInt(90000) // Fallback gas estimate
    }
  }, [])

  const checkBalance = useCallback(async (chainId: number, userAddress: string): Promise<string> => {
    try {
      return await paymentProcessor.checkBalance(chainId, userAddress)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to check balance"
      setError(errorMessage)
      return "0"
    }
  }, [])

  return {
    createPaymentIntent,
    processPayment,
    estimateGas,
    checkBalance,
    isLoading,
    error,
  }
}
