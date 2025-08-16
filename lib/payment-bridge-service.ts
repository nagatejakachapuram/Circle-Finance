import { paymentProcessor } from "./payment-processor"
import { cctpService } from "./cctp-service"
import { productManager } from "./product-manager"
import { CCTPClient } from "./cctp-client"
import { CCTP_CONFIG, type CCTPNetwork } from "./cctp-config"
import type { PaymentRequest, PaymentResult } from "./payment-processor"

export interface BridgePaymentRequest extends PaymentRequest {
  preferredPaymentChain?: number // Chain where user has USDC
  merchantReceiveChain?: number // Chain where merchant wants to receive payment
}

export interface BridgePaymentResult extends PaymentResult {
  bridgeRequired?: boolean
  bridgeDetails?: {
    fromChain: number
    toChain: number
    bridgeAmount: number
    estimatedTime: string
    bridgeFee: string
  }
  suggestedAction?: "pay_directly" | "bridge_then_pay" | "insufficient_funds"
}

export interface PaymentConsolidationRequest {
  merchantAddress: string
  targetChain: number
  orders: string[] // Order IDs to consolidate
}

class PaymentBridgeService {
  private cctpClient: CCTPClient

  constructor() {
    this.cctpClient = new CCTPClient()
  }

  // Enhanced payment creation that considers bridging options
  async createSmartPaymentIntent(request: BridgePaymentRequest): Promise<BridgePaymentResult> {
    try {
      console.log("[v0] Creating smart payment intent:", request)

      const product = productManager.getProduct(request.productId)
      if (!product) {
        return { success: false, error: "Product not found" }
      }

      const totalAmount = (product.price * (request.quantity || 1)) / 1e6

      // Check user's USDC balances across all supported chains
      const balanceChecks = await this.checkUSDCBalancesAcrossChains(request.customerAddress, product.supportedChains)

      // Find the best payment strategy
      const paymentStrategy = await this.determineOptimalPaymentStrategy(
        balanceChecks,
        totalAmount,
        request.chainId,
        request.preferredPaymentChain,
        product.supportedChains,
      )

      if (paymentStrategy.suggestedAction === "insufficient_funds") {
        return {
          success: false,
          error: `Insufficient USDC across all supported chains. Required: ${totalAmount} USDC`,
          suggestedAction: "insufficient_funds",
        }
      }

      // If direct payment is possible
      if (paymentStrategy.suggestedAction === "pay_directly") {
        const directPayment = await paymentProcessor.createPaymentIntent({
          ...request,
          chainId: paymentStrategy.recommendedChain!,
        })
        return {
          ...directPayment,
          suggestedAction: "pay_directly",
        }
      }

      // If bridging is required
      if (paymentStrategy.suggestedAction === "bridge_then_pay" && paymentStrategy.bridgeDetails) {
        const bridgeEstimate = await this.estimateBridgeCosts(
          paymentStrategy.bridgeDetails.fromChain,
          paymentStrategy.bridgeDetails.toChain,
          paymentStrategy.bridgeDetails.bridgeAmount,
        )

        return {
          success: true,
          bridgeRequired: true,
          bridgeDetails: {
            ...paymentStrategy.bridgeDetails,
            bridgeFee: bridgeEstimate.networkFee,
          },
          suggestedAction: "bridge_then_pay",
        }
      }

      return { success: false, error: "Unable to determine payment strategy" }
    } catch (error) {
      console.error("[v0] Error creating smart payment intent:", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to create smart payment intent",
      }
    }
  }

  // Execute bridge + payment flow
  async executeBridgePayment(
    bridgeDetails: BridgePaymentResult["bridgeDetails"],
    paymentRequest: PaymentRequest,
  ): Promise<{ success: boolean; bridgeTxHash?: string; paymentTxHash?: string; error?: string }> {
    try {
      console.log("[v0] Executing bridge + payment flow")

      if (!bridgeDetails) {
        return { success: false, error: "Bridge details required" }
      }

      // Step 1: Bridge USDC to target chain
      const sourceChain = this.getNetworkName(bridgeDetails.fromChain)
      const destChain = this.getNetworkName(bridgeDetails.toChain)

      if (!sourceChain || !destChain) {
        return { success: false, error: "Unsupported chain for bridging" }
      }

      const bridgeResult = await cctpService.initiateCCTPTransfer(
        sourceChain,
        destChain,
        (bridgeDetails.bridgeAmount * 1e6).toString(), // Convert to 6 decimals
        paymentRequest.customerAddress as `0x${string}`,
        paymentRequest.customerAddress as `0x${string}`,
      )

      console.log("[v0] Bridge initiated:", bridgeResult.burnTxHash)

      // Step 2: Wait for attestation and complete bridge
      const mintTxHash = await cctpService.completeCCTPTransfer(
        bridgeResult.messageHash,
        paymentRequest.customerAddress as `0x${string}`,
        sourceChain,
        destChain,
      )

      console.log("[v0] Bridge completed:", mintTxHash)

      // Step 3: Create and process payment on destination chain
      const paymentResult = await paymentProcessor.createPaymentIntent({
        ...paymentRequest,
        chainId: bridgeDetails.toChain,
      })

      if (!paymentResult.success || !paymentResult.paymentIntent) {
        return {
          success: false,
          bridgeTxHash: bridgeResult.burnTxHash,
          error: "Bridge successful but payment creation failed",
        }
      }

      // In a real implementation, the payment would be processed automatically
      // For now, we'll return the bridge transaction hash
      return {
        success: true,
        bridgeTxHash: bridgeResult.burnTxHash,
        paymentTxHash: mintTxHash,
      }
    } catch (error) {
      console.error("[v0] Bridge payment execution failed:", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Bridge payment execution failed",
      }
    }
  }

  // Consolidate merchant payments from multiple chains to a single chain
  async consolidatePayments(request: PaymentConsolidationRequest): Promise<{
    success: boolean
    consolidationTxHashes?: string[]
    totalConsolidated?: number
    error?: string
  }> {
    try {
      console.log("[v0] Consolidating payments:", request)

      const consolidationTxHashes: string[] = []
      let totalConsolidated = 0

      // Get orders to consolidate
      const orders = request.orders
        .map((orderId) => {
          // Find order across all customer addresses (simplified for demo)
          const allOrders = productManager
            .getAllProducts()
            .flatMap((product) => productManager.getOrdersByProduct(product.id))
          return allOrders.find((order) => order.id === orderId)
        })
        .filter(Boolean)

      // Group orders by chain
      const ordersByChain = orders.reduce(
        (acc, order) => {
          if (!order) return acc
          if (!acc[order.chainId]) acc[order.chainId] = []
          acc[order.chainId].push(order)
          return acc
        },
        {} as Record<number, typeof orders>,
      )

      // Bridge from each source chain to target chain
      for (const [chainIdStr, chainOrders] of Object.entries(ordersByChain)) {
        const sourceChainId = Number.parseInt(chainIdStr)

        // Skip if already on target chain
        if (sourceChainId === request.targetChain) {
          totalConsolidated += chainOrders.reduce((sum, order) => sum + (order?.amount || 0), 0)
          continue
        }

        const totalAmount = chainOrders.reduce((sum, order) => sum + (order?.amount || 0), 0)
        const sourceChain = this.getNetworkName(sourceChainId)
        const targetChain = this.getNetworkName(request.targetChain)

        if (!sourceChain || !targetChain) {
          console.warn(`Skipping unsupported chain: ${sourceChainId}`)
          continue
        }

        // Bridge the consolidated amount
        const bridgeResult = await cctpService.initiateCCTPTransfer(
          sourceChain,
          targetChain,
          totalAmount.toString(),
          request.merchantAddress as `0x${string}`,
          request.merchantAddress as `0x${string}`,
        )

        const mintTxHash = await cctpService.completeCCTPTransfer(
          bridgeResult.messageHash,
          request.merchantAddress as `0x${string}`,
          sourceChain,
          targetChain,
        )

        consolidationTxHashes.push(bridgeResult.burnTxHash, mintTxHash)
        totalConsolidated += totalAmount
      }

      return {
        success: true,
        consolidationTxHashes,
        totalConsolidated: totalConsolidated / 1e6, // Convert back to USDC
      }
    } catch (error) {
      console.error("[v0] Payment consolidation failed:", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Payment consolidation failed",
      }
    }
  }

  // Check USDC balances across multiple chains
  private async checkUSDCBalancesAcrossChains(
    userAddress: string,
    supportedChains: number[],
  ): Promise<Record<number, number>> {
    const balances: Record<number, number> = {}

    for (const chainId of supportedChains) {
      try {
        const balance = await this.cctpClient.getUSDCBalance(userAddress as `0x${string}`, chainId)
        balances[chainId] = Number.parseFloat(balance)
      } catch (error) {
        console.warn(`Failed to get balance for chain ${chainId}:`, error)
        balances[chainId] = 0
      }
    }

    return balances
  }

  // Determine optimal payment strategy
  private async determineOptimalPaymentStrategy(
    balances: Record<number, number>,
    requiredAmount: number,
    preferredChain: number,
    userPreferredChain?: number,
    supportedChains: number[] = [],
  ): Promise<{
    suggestedAction: "pay_directly" | "bridge_then_pay" | "insufficient_funds"
    recommendedChain?: number
    bridgeDetails?: {
      fromChain: number
      toChain: number
      bridgeAmount: number
      estimatedTime: string
    }
  }> {
    // Check if user has enough on preferred chain
    if (balances[preferredChain] >= requiredAmount) {
      return {
        suggestedAction: "pay_directly",
        recommendedChain: preferredChain,
      }
    }

    // Check if user has enough on their preferred chain
    if (userPreferredChain && balances[userPreferredChain] >= requiredAmount) {
      return {
        suggestedAction: "pay_directly",
        recommendedChain: userPreferredChain,
      }
    }

    // Find any chain with sufficient balance
    for (const chainId of supportedChains) {
      if (balances[chainId] >= requiredAmount) {
        return {
          suggestedAction: "pay_directly",
          recommendedChain: chainId,
        }
      }
    }

    // Check if bridging is possible
    const totalBalance = Object.values(balances).reduce((sum, balance) => sum + balance, 0)
    if (totalBalance < requiredAmount) {
      return { suggestedAction: "insufficient_funds" }
    }

    // Find best chain to bridge from
    const bestSourceChain = Object.entries(balances)
      .filter(([chainId]) => supportedChains.includes(Number.parseInt(chainId)))
      .sort(([, balanceA], [, balanceB]) => balanceB - balanceA)[0]

    if (!bestSourceChain || bestSourceChain[1] < requiredAmount) {
      return { suggestedAction: "insufficient_funds" }
    }

    const sourceChainId = Number.parseInt(bestSourceChain[0])
    const sourceNetwork = this.getNetworkName(sourceChainId)
    const destNetwork = this.getNetworkName(preferredChain)

    if (!sourceNetwork || !destNetwork) {
      return { suggestedAction: "insufficient_funds" }
    }

    const estimatedTime = await cctpService.estimateTransferTime(sourceNetwork, destNetwork)

    return {
      suggestedAction: "bridge_then_pay",
      bridgeDetails: {
        fromChain: sourceChainId,
        toChain: preferredChain,
        bridgeAmount: requiredAmount,
        estimatedTime,
      },
    }
  }

  // Estimate bridge costs
  private async estimateBridgeCosts(
    fromChain: number,
    toChain: number,
    amount: number,
  ): Promise<{ networkFee: string; estimatedTime: string }> {
    try {
      const sourceNetwork = this.getNetworkName(fromChain)
      const destNetwork = this.getNetworkName(toChain)

      if (!sourceNetwork || !destNetwork) {
        throw new Error("Unsupported chain for bridging")
      }

      // Estimate gas costs (simplified)
      const burnGas = await this.cctpClient.getGasPrice(fromChain)
      const mintGas = await this.cctpClient.getGasPrice(toChain)
      const totalNetworkFee = (burnGas * BigInt(200000) + mintGas * BigInt(150000)).toString()

      const estimatedTime = await cctpService.estimateTransferTime(sourceNetwork, destNetwork)

      return {
        networkFee: totalNetworkFee,
        estimatedTime,
      }
    } catch (error) {
      console.error("[v0] Failed to estimate bridge costs:", error)
      return {
        networkFee: "0",
        estimatedTime: "~15 minutes",
      }
    }
  }

  // Helper to convert chain ID to network name
  private getNetworkName(chainId: number): CCTPNetwork | null {
    const chainConfig = CCTP_CONFIG.chains[chainId]
    return (chainConfig?.name as CCTPNetwork) || null
  }
}

export const paymentBridgeService = new PaymentBridgeService()
