import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { walletId, amount, currency } = body

    if (!walletId || !amount || !currency) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: walletId, amount, currency" },
        { status: 400 },
      )
    }

    // Mock successful onramp for now
    const mockTxHash = `0x${Math.random().toString(16).substring(2, 66)}`

    console.log(`Mock onramp: ${amount} ${currency} to wallet ${walletId}`)

    return NextResponse.json({
      success: true,
      txHash: mockTxHash,
      status: "confirmed",
      data: {
        walletId,
        amount,
        currency,
        type: "onramp",
        timestamp: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error("Onramp error:", error)
    return NextResponse.json({ success: false, error: "Failed to process onramp" }, { status: 500 })
  }
}
