import { type NextRequest, NextResponse } from "next/server"
import { paymentBridgeService } from "@/lib/payment-bridge-service"

export async function POST(request: NextRequest) {
  try {
    const consolidationRequest = await request.json()

    // Validate required fields
    const requiredFields = ["merchantAddress", "targetChain", "orders"]
    for (const field of requiredFields) {
      if (!consolidationRequest[field]) {
        return NextResponse.json({ success: false, error: `Missing required field: ${field}` }, { status: 400 })
      }
    }

    const result = await paymentBridgeService.consolidatePayments(consolidationRequest)

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      consolidationTxHashes: result.consolidationTxHashes,
      totalConsolidated: result.totalConsolidated,
    })
  } catch (error) {
    console.error("Error consolidating payments:", error)
    return NextResponse.json({ success: false, error: "Failed to consolidate payments" }, { status: 500 })
  }
}
