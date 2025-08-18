import { type NextRequest, NextResponse } from "next/server"

const paymentStatuses = new Map<string, { status: string; txHash?: string; updatedAt: string }>()

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const paymentIntentId = params.id

    if (!paymentIntentId) {
      return NextResponse.json({ success: false, error: "Payment intent ID is required" }, { status: 400 })
    }

    console.log("[v0] Checking payment status:", paymentIntentId)

    const paymentStatus = paymentStatuses.get(paymentIntentId)

    if (!paymentStatus) {
      // If no status found, assume it's still pending
      return NextResponse.json({
        success: true,
        status: "pending",
        paymentIntentId,
        updatedAt: new Date().toISOString(),
      })
    }

    return NextResponse.json({
      success: true,
      status: paymentStatus.status,
      paymentIntentId,
      txHash: paymentStatus.txHash,
      updatedAt: paymentStatus.updatedAt,
    })
  } catch (error) {
    console.error("[v0] Payment status check failed:", error)
    return NextResponse.json({ success: false, error: "Failed to get payment status" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const paymentIntentId = params.id
    const body = await request.json()
    const { status, txHash } = body

    if (!paymentIntentId || !status) {
      return NextResponse.json({ success: false, error: "Payment intent ID and status are required" }, { status: 400 })
    }

    // Update payment status
    paymentStatuses.set(paymentIntentId, {
      status,
      txHash,
      updatedAt: new Date().toISOString(),
    })

    console.log("[v0] Updated payment status:", { paymentIntentId, status, txHash })

    return NextResponse.json({
      success: true,
      paymentIntentId,
      status,
      txHash,
    })
  } catch (error) {
    console.error("[v0] Payment status update failed:", error)
    return NextResponse.json({ success: false, error: "Failed to update payment status" }, { status: 500 })
  }
}
