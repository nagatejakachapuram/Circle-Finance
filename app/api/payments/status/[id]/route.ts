import { type NextRequest, NextResponse } from "next/server"
import { paymentProcessor } from "@/lib/payment-processor"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const result = await paymentProcessor.getPaymentStatus(params.id)

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      status: result.status,
    })
  } catch (error) {
    console.error("Error getting payment status:", error)
    return NextResponse.json({ success: false, error: "Failed to get payment status" }, { status: 500 })
  }
}
