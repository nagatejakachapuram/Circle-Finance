import { CCTPClient } from "./cctp-client"
import { productManager } from "./product-manager"
import type { ProductOrder, PaymentIntent } from "./types/product"
import { CCTP_CONFIG } from "./cctp-config"

export interface PaymentRequest {
  productId: string
  customerAddress: string
  chainId: number
  quantity?: number
}

export interface PaymentResult {
  success: boolean
  paymentIntent?: PaymentIntent
  order?: ProductOrder
  error?: string
  estimatedGas?: bigint
  networkFee?: string
}

export interface PaymentConfirmation {
  orderId: string
  txHash: string
  blockNumber?: number
  gasUsed?: string
  networkFee?: string
}

class PaymentProcessor {
  private cctpClient: CCTPClient

  constructor() {
    this.cctpClient = new CCTPClient()
  }

  // Create payment intent for a product
  async createPaymentIntent(request: PaymentRequest): Promise<PaymentResult> {
    try {
      console.log("[v0] Creating payment intent for:", request)

      // Validate product
      const product = productManager.getProduct(request.productId)
      if (!product) {
        return { success: false, error: "Product not found" }
      }

      if (!product.isActive) {
        return { success: false, error: "Product is not available" }
      }

      // Check if product supports the requested chain
      if (!product.supportedChains.includes(request.chainId)) {
        return {
          success: false,
          error: `Product not available on chain ${request.chainId}. Supported chains: ${product.supportedChains.join(", ")}`,
        }
      }

      // Validate customer address
      if (!this.isValidAddress(request.customerAddress)) {
        return { success: false, error: "Invalid customer address" }
      }

      // Calculate total amount
      const quantity = request.quantity || 1
      const totalAmount = product.price * quantity

      // Estimate gas costs for the payment transaction
      let estimatedGas: bigint | undefined
      let networkFee: string | undefined

      try {
        const gasEstimate = await this.estimatePaymentGas(request.chainId, totalAmount)
        estimatedGas = gasEstimate.gasLimit
        networkFee = gasEstimate.networkFee
      } catch (error) {
        console.warn("[v0] Failed to estimate gas:", error)
        // Continue without gas estimation
      }

      // Create payment intent
      const paymentIntent = productManager.createPaymentIntent({
        productId: request.productId,
        customerAddress: request.customerAddress,
        amount: totalAmount,
        chainId: request.chainId,
        status: "created",
      })

      // Create pending order
      const order = productManager.createOrder({
        productId: request.productId,
        customerAddress: request.customerAddress,
        amount: totalAmount,
        chainId: request.chainId,
        txHash: "", // Will be updated when payment is submitted
        status: "pending",
      })

      console.log("[v0] Payment intent created:", paymentIntent.id)

      return {
        success: true,
        paymentIntent,
        order,
        estimatedGas,
        networkFee,
      }
    } catch (error) {
      console.error("[v0] Error creating payment intent:", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to create payment intent",
      }
    }
  }

  // Process payment transaction
  async processPayment(paymentIntentId: string, txHash: string): Promise<PaymentResult> {
    try {
      console.log("[v0] Processing payment:", { paymentIntentId, txHash })

      // Get payment intent
      const paymentIntent = productManager.getPaymentIntent(paymentIntentId)
      if (!paymentIntent) {
        return { success: false, error: "Payment intent not found" }
      }

      // Check if payment intent is still valid
      if (paymentIntent.expiresAt < new Date()) {
        return { success: false, error: "Payment intent has expired" }
      }

      if (paymentIntent.status !== "created") {
        return { success: false, error: "Payment intent is not in a valid state" }
      }

      // Update payment intent status
      productManager.updatePaymentIntentStatus(paymentIntentId, "processing")

      // Verify the transaction on the blockchain
      const verification = await this.verifyPaymentTransaction(
        txHash,
        paymentIntent.chainId,
        paymentIntent.customerAddress,
        paymentIntent.amount,
      )

      if (!verification.success) {
        productManager.updatePaymentIntentStatus(paymentIntentId, "failed")
        return {
          success: false,
          error: verification.error || "Payment verification failed",
        }
      }

      // Update payment intent and order status
      productManager.updatePaymentIntentStatus(paymentIntentId, "succeeded")

      // Find and update the corresponding order
      const orders = productManager.getOrdersByCustomer(paymentIntent.customerAddress)
      const order = orders.find(
        (o) =>
          o.productId === paymentIntent.productId &&
          o.amount === paymentIntent.amount &&
          o.chainId === paymentIntent.chainId &&
          o.status === "pending",
      )

      if (order) {
        productManager.updateOrderStatus(order.id, "confirmed", txHash)
      }

      console.log("[v0] Payment processed successfully")

      return {
        success: true,
        paymentIntent,
        order,
      }
    } catch (error) {
      console.error("[v0] Error processing payment:", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to process payment",
      }
    }
  }

  // Verify payment transaction on blockchain
  private async verifyPaymentTransaction(
    txHash: string,
    chainId: number,
    expectedFrom: string,
    expectedAmount: number,
  ): Promise<{ success: boolean; error?: string; confirmation?: PaymentConfirmation }> {
    try {
      console.log("[v0] Verifying transaction:", { txHash, chainId, expectedFrom, expectedAmount })

      // Get transaction receipt
      const receipt = await this.cctpClient.getTransactionReceipt(txHash, chainId)
      if (!receipt) {
        return { success: false, error: "Transaction not found or not confirmed" }
      }

      // Verify transaction success
      if (receipt.status !== "success") {
        return { success: false, error: "Transaction failed on blockchain" }
      }

      // Get transaction details
      const transaction = await this.cctpClient.getTransaction(txHash, chainId)
      if (!transaction) {
        return { success: false, error: "Transaction details not found" }
      }

      // Verify sender address
      if (transaction.from.toLowerCase() !== expectedFrom.toLowerCase()) {
        return {
          success: false,
          error: `Transaction sender mismatch. Expected: ${expectedFrom}, Got: ${transaction.from}`,
        }
      }

      // Parse USDC transfer events from the transaction
      const usdcTransfers = await this.parseUSDCTransfers(receipt, chainId)

      // Verify USDC transfer amount
      const totalTransferred = usdcTransfers.reduce((sum, transfer) => sum + transfer.amount, 0)

      if (totalTransferred < expectedAmount) {
        return {
          success: false,
          error: `Insufficient payment amount. Expected: ${expectedAmount / 1e6} USDC, Got: ${totalTransferred / 1e6} USDC`,
        }
      }

      const confirmation: PaymentConfirmation = {
        orderId: "", // Will be set by caller
        txHash,
        blockNumber: Number(receipt.blockNumber),
        gasUsed: receipt.gasUsed.toString(),
        networkFee: (receipt.gasUsed * receipt.effectiveGasPrice).toString(),
      }

      return { success: true, confirmation }
    } catch (error) {
      console.error("[v0] Error verifying transaction:", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Transaction verification failed",
      }
    }
  }

  // Parse USDC transfer events from transaction receipt
  private async parseUSDCTransfers(
    receipt: any,
    chainId: number,
  ): Promise<Array<{ from: string; to: string; amount: number }>> {
    try {
      const usdcAddress = CCTP_CONFIG.chains[chainId]?.usdcAddress
      if (!usdcAddress) {
        throw new Error(`USDC address not configured for chain ${chainId}`)
      }

      // USDC Transfer event signature: Transfer(address,address,uint256)
      const transferEventSignature = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef"

      const transfers = []

      for (const log of receipt.logs) {
        if (log.address.toLowerCase() === usdcAddress.toLowerCase() && log.topics[0] === transferEventSignature) {
          // Decode transfer event
          const from = `0x${log.topics[1].slice(26)}` // Remove padding
          const to = `0x${log.topics[2].slice(26)}` // Remove padding
          const amount = Number.parseInt(log.data, 16) // Convert hex to number

          transfers.push({ from, to, amount })
        }
      }

      return transfers
    } catch (error) {
      console.error("[v0] Error parsing USDC transfers:", error)
      return []
    }
  }

  // Estimate gas costs for payment
  private async estimatePaymentGas(chainId: number, amount: number): Promise<{ gasLimit: bigint; networkFee: string }> {
    try {
      // This is a simplified estimation - in production you'd call the actual contract
      const baseGasLimit = BigInt(21000) // Basic transfer
      const usdcTransferGas = BigInt(65000) // USDC transfer typically uses ~65k gas
      const totalGasLimit = baseGasLimit + usdcTransferGas

      // Get current gas price (simplified - you'd use actual network data)
      const gasPrice = await this.cctpClient.getGasPrice(chainId)
      const networkFee = (totalGasLimit * gasPrice).toString()

      return {
        gasLimit: totalGasLimit,
        networkFee,
      }
    } catch (error) {
      console.error("[v0] Error estimating gas:", error)
      throw error
    }
  }

  // Validate Ethereum address
  private isValidAddress(address: string): boolean {
    return /^0x[a-fA-F0-9]{40}$/.test(address)
  }

  // Get payment status
  async getPaymentStatus(paymentIntentId: string): Promise<{ success: boolean; status?: string; error?: string }> {
    try {
      const paymentIntent = productManager.getPaymentIntent(paymentIntentId)
      if (!paymentIntent) {
        return { success: false, error: "Payment intent not found" }
      }

      return { success: true, status: paymentIntent.status }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to get payment status",
      }
    }
  }

  // Get supported chains for a product
  getSupportedChains(productId: string): number[] {
    const product = productManager.getProduct(productId)
    return product?.supportedChains || []
  }

  // Get payment history for a customer
  getCustomerPayments(customerAddress: string): ProductOrder[] {
    return productManager.getOrdersByCustomer(customerAddress)
  }

  // Cancel payment intent
  async cancelPaymentIntent(paymentIntentId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const paymentIntent = productManager.getPaymentIntent(paymentIntentId)
      if (!paymentIntent) {
        return { success: false, error: "Payment intent not found" }
      }

      if (paymentIntent.status === "succeeded") {
        return { success: false, error: "Cannot cancel completed payment" }
      }

      productManager.updatePaymentIntentStatus(paymentIntentId, "failed")
      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to cancel payment intent",
      }
    }
  }
}

export const paymentProcessor = new PaymentProcessor()
