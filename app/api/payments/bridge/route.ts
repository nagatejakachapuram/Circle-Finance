import { type NextRequest, NextResponse } from "next/server"
import { paymentBridgeService } from "@/lib/payment-bridge-service"

export async function POST(request: NextRequest) {
  try {
    const bridgePaymentRequest = await request.json()

    // Validate required fields
    const requiredFields = ["productId", "customerAddress", "chainId"]
    for (const field of requiredFields) {
      if (!bridgePaymentRequest[field]) {
        return NextResponse.json({ success: false, error: `Missing required field: ${field}` }, { status: 400 })
      }
    }

    const result = await paymentBridgeService.createSmartPaymentIntent(bridgePaymentRequest)

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      ...result,
    })
  } catch (error) {
    console.error("Error creating bridge payment intent:", error)
    return NextResponse.json({ success: false, error: "Failed to create bridge payment intent" }, { status: 500 })
  }
}
