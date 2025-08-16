import { type NextRequest, NextResponse } from "next/server"
import { paymentProcessor } from "@/lib/payment-processor"

export async function POST(request: NextRequest) {
  try {
    const paymentRequest = await request.json()

    // Validate required fields
    const requiredFields = ["productId", "customerAddress", "chainId"]
    for (const field of requiredFields) {
      if (!paymentRequest[field]) {
        return NextResponse.json({ success: false, error: `Missing required field: ${field}` }, { status: 400 })
      }
    }

    const result = await paymentProcessor.createPaymentIntent(paymentRequest)

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      paymentIntent: result.paymentIntent,
      order: result.order,
      estimatedGas: result.estimatedGas?.toString(),
      networkFee: result.networkFee,
    })
  } catch (error) {
    console.error("Error creating payment intent:", error)
    return NextResponse.json({ success: false, error: "Failed to create payment intent" }, { status: 500 })
  }
}
