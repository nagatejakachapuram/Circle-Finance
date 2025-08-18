// Circle API integration for USDC payments
import { CIRCLE_CONFIG } from "./circle-config"

export interface CirclePaymentRequest {
  walletId: string
  recipientAddress: string
  amount: number
}

export interface CircleOnrampRequest {
  walletId: string
  amount: number
  currency: string
}

export interface CircleOfframpRequest {
  walletId: string
  amount: number
  currency: string
  bankAccountId: string
}

export interface CircleBridgeRequest {
  walletId: string
  destinationChain: string
  amount: number
}

export interface CircleResponse {
  success: boolean
  data?: any
  error?: string
  txHash?: string
  status?: string
}

const API_BASE_URL = "/api/circle" // Fixed API base URL to match actual route structure

class CircleAPI {
  private async makeRequest(endpoint: string, data: any): Promise<CircleResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Circle-Client-Key": CIRCLE_CONFIG.clientKey,
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      return { success: true, ...result }
    } catch (error) {
      console.error(`Circle API error (${endpoint}):`, error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      }
    }
  }

  async sendUSDC(request: CirclePaymentRequest): Promise<CircleResponse> {
    return this.makeRequest("/send-usdc", request)
  }

  async onramp(request: CircleOnrampRequest): Promise<CircleResponse> {
    return this.makeRequest("/onramp", request)
  }

  async offramp(request: CircleOfframpRequest): Promise<CircleResponse> {
    return this.makeRequest("/offramp", request)
  }

  async bridge(request: CircleBridgeRequest): Promise<CircleResponse> {
    return this.makeRequest("/bridge", request)
  }

  async getEvents(): Promise<CircleResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/events`, {
        headers: {
          "X-Circle-Client-Key": CIRCLE_CONFIG.clientKey,
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      return { success: true, data: result }
    } catch (error) {
      console.error("Circle API error (events):", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      }
    }
  }
}

export const circleAPI = new CircleAPI()

// Investment-specific functions
export async function processInvestment(
  investmentType: "estate" | "index-fund" | "treasury",
  assetName: string,
  tokenAmount: number,
  pricePerToken: number,
  walletId: string,
  recipientAddress: string,
): Promise<CircleResponse> {
  const totalAmount = tokenAmount * pricePerToken

  // Send USDC payment for investment
  const paymentResult = await circleAPI.sendUSDC({
    walletId,
    recipientAddress,
    amount: totalAmount,
  })

  if (paymentResult.success) {
    // Log investment transaction
    console.log(`Investment processed: ${tokenAmount} tokens of ${assetName} for ${totalAmount} USDC`)

    // You could also store this in your database or state management
    return {
      success: true,
      data: {
        investmentType,
        assetName,
        tokenAmount,
        totalAmount,
        txHash: paymentResult.txHash,
        status: paymentResult.status,
      },
    }
  }

  return paymentResult
}
