export interface Product {
  id: string
  name: string
  description: string
  price: number // Price in USDC (6 decimals)
  currency: "USDC"
  image?: string
  category: string
  isActive: boolean
  supportedChains: number[] // Chain IDs where this product can be purchased
  metadata?: {
    [key: string]: any
  }
  createdAt: Date
  updatedAt: Date
}

export interface ProductOrder {
  id: string
  productId: string
  customerAddress: string
  amount: number
  chainId: number
  txHash: string
  status: "pending" | "confirmed" | "completed" | "failed"
  createdAt: Date
  completedAt?: Date
}

export interface PaymentIntent {
  id: string
  productId: string
  customerAddress: string
  amount: number
  chainId: number
  status: "created" | "processing" | "succeeded" | "failed"
  clientSecret: string
  createdAt: Date
  expiresAt: Date
}
