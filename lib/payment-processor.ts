import { createPublicClient, createWalletClient, custom, parseUnits, formatUnits, type Hash, type Address } from "viem"
import { CCTP_CONFIG, type CCTPNetwork } from "./cctp-config"

export interface PaymentRequest {
  amount: number
  chainId: number
  recipientAddress: string
  metadata?: {
    investmentType: string
    assetName: string
    tokenAmount: number
  }
}

export interface PaymentResult {
  success: boolean
  error?: string
  requiresWalletSignature?: boolean
  transactionData?: {
    to: string
    data: string
    value: string
    gasLimit: string
  }
  paymentIntent?: any
  order?: any
  estimatedGas?: bigint
  networkFee?: string
}

export class PaymentProcessor {
  async createPaymentIntent(request: PaymentRequest): Promise<PaymentResult> {
    try {
      console.log("[v0] Creating payment intent for:", request)

      const chainConfig = Object.values(CCTP_CONFIG.chains).find(
        (chain) => chain.chainId === request.chainId
      )

      if (!chainConfig) {
        return {
          success: false,
          error: `Unsupported chain ID: ${request.chainId}`,
        }
      }

      // Convert amount to USDC units (6 decimals)
      const amountInUSDCUnits = parseUnits(request.amount.toString(), 6)

      // Create transaction data for USDC approval and transfer
      const usdcContractAddress = chainConfig.usdcAddress
      const tokenMessengerAddress = chainConfig.tokenMessenger

      // First, we need to approve the TokenMessenger to spend USDC
      const approvalData = this.encodeApprovalTransaction(tokenMessengerAddress, amountInUSDCUnits)

      return {
        success: true,
        requiresWalletSignature: true,
        transactionData: {
          to: usdcContractAddress,
          data: approvalData,
          value: "0x0",
          gasLimit: "0x15F90", // 90000 gas for approval
        },
        paymentIntent: {
          id: `pi_${Date.now()}_${Math.random().toString(36).substring(2)}`,
          amount: request.amount,
          chainId: request.chainId,
          recipientAddress: request.recipientAddress,
          metadata: request.metadata,
        },
      }
    } catch (error) {
      console.error("[v0] Payment intent creation failed:", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to create payment intent",
      }
    }
  }

  async processPayment(data: {
    paymentIntentId: string
    chainId: number
    fromAddress: string
    toAddress: string
    amount: number
  }): Promise<PaymentResult> {
    try {
      console.log("[v0] Processing payment:", data)

      const chainConfig = Object.values(CCTP_CONFIG.chains).find(
        (chain) => chain.chainId === data.chainId
      )

      if (!chainConfig) {
        return {
          success: false,
          error: `Unsupported chain ID: ${data.chainId}`,
        }
      }

      // Convert amount to USDC units (6 decimals)
      const amountInUSDCUnits = parseUnits(data.amount.toString(), 6)

      // Create transaction data for USDC transfer
      const transferData = this.encodeTransferTransaction(data.toAddress, amountInUSDCUnits)

      return {
        success: false,
        requiresWalletSignature: true,
        transactionData: {
          to: chainConfig.usdcAddress,
          data: transferData,
          value: "0x0",
          gasLimit: "0x15F90", // 90000 gas for transfer
        },
      }
    } catch (error) {
      console.error("[v0] Payment processing failed:", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to process payment",
      }
    }
  }

  private encodeApprovalTransaction(spender: string, amount: bigint): string {
    // ERC20 approve function signature: approve(address,uint256)
    const functionSelector = "0x095ea7b3" // keccak256("approve(address,uint256)").slice(0, 10)
    const spenderPadded = spender.slice(2).padStart(64, "0")
    const amountPadded = amount.toString(16).padStart(64, "0")
    
    return `${functionSelector}${spenderPadded}${amountPadded}`
  }

  private encodeTransferTransaction(recipient: string, amount: bigint): string {
    // ERC20 transfer function signature: transfer(address,uint256)
    const functionSelector = "0xa9059cbb" // keccak256("transfer(address,uint256)").slice(0, 10)
    const recipientPadded = recipient.slice(2).padStart(64, "0")
    const amountPadded = amount.toString(16).padStart(64, "0")
    
    return `${functionSelector}${recipientPadded}${amountPadded}`
  }

  async estimateGas(request: PaymentRequest, userAddress: string): Promise<bigint> {
    // Return estimated gas for USDC operations
    return BigInt(90000) // Typical gas for ERC20 operations
  }

  async checkBalance(chainId: number, userAddress: string): Promise<string> {
    try {
      const chainConfig = Object.values(CCTP_CONFIG.chains).find(
        (chain) => chain.chainId === chainId
      )

      if (!chainConfig) {
        throw new Error(`Unsupported chain ID: ${chainId}`)
      }

      // This would typically query the blockchain for USDC balance
      // For now, return a placeholder
      return "1000.00" // Mock balance
    } catch (error) {
      console.error("[v0] Balance check failed:", error)
      throw error
    }
  }
}

export const paymentProcessor = new PaymentProcessor()