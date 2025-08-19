import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { amount, chainId, recipientAddress, metadata } = body

    if (!amount || !chainId || !recipientAddress) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: amount, chainId, recipientAddress" },
        { status: 400 },
      )
    }

    // Create a payment intent ID
    const paymentIntentId = `pi_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    console.log("[v0] Payment intent created:", {
      paymentIntentId,
      amount,
      chainId,
      recipientAddress,
      metadata,
    })

    return NextResponse.json({
      success: true,
      data: {
        id: paymentIntentId,
        amount,
        chainId,
        recipientAddress,
        metadata,
        status: "requires_payment",
        created: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error("[v0] Payment intent creation failed:", error)
    return NextResponse.json({ success: false, error: "Failed to create payment intent" }, { status: 500 })
  }
}
