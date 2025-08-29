"use client"

import { useState, useCallback } from "react"

export interface PaymentRequest {
  amount: number
  currency?: string
  chainId: number
  recipientAddress: string
  paymentMethodId?: string
  returnUrl?: string
  metadata?: Record<string, any>
}

export interface TransactionData {
  to: string
  data: string
  value: string
  gasLimit?: string
}

export interface PaymentResult {
  success: boolean
  error?: string
  paymentIntent?: {
    id: string
    clientSecret?: string
  }
  order?: {
    id: string
    status: string
  }
  estimatedGas?: bigint
  networkFee?: number

  // Added for wallet signing flow
  requiresWalletSignature?: boolean
  transactionData?: TransactionData
  txHash?: string
  data?: any
}

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
        return { success: false, error: data.error }
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
      return { success: false, error: errorMessage }
    } finally {
      setIsLoading(false)
    }
  }, [])

  const processPayment = useCallback(async (params: {
    paymentIntentId: string
    chainId: number
    fromAddress: string
    toAddress: string
    amount: number
  }): Promise<PaymentResult> => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/payments/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      })

      const data = await response.json()

      if (!data.success) {
        setError(data.error)
        return { success: false, error: data.error }
      }

      // Example: backend may return tx data for wallet signature
      return {
        success: true,
        requiresWalletSignature: data.requiresWalletSignature,
        transactionData: data.transactionData,
        txHash: data.txHash,
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to process payment"
      setError(errorMessage)
      return { success: false, error: errorMessage }
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
