import { type NextRequest, NextResponse } from "next/server"
import { paymentProcessor } from "@/lib/payment-processor"

export async function POST(request: NextRequest) {
  try {
    const { paymentIntentId, txHash } = await request.json()

    if (!paymentIntentId || !txHash) {
      return NextResponse.json({ success: false, error: "Missing paymentIntentId or txHash" }, { status: 400 })
    }

    const result = await paymentProcessor.processPayment(paymentIntentId, txHash)

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      paymentIntent: result.paymentIntent,
      order: result.order,
    })
  } catch (error) {
    console.error("Error processing payment:", error)
    return NextResponse.json({ success: false, error: "Failed to process payment" }, { status: 500 })
  }
}
