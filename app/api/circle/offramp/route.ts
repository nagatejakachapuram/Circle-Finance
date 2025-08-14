import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { walletId, amount, currency, bankAccountId } = body

    if (!walletId || !amount || !currency || !bankAccountId) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: walletId, amount, currency, bankAccountId" },
        { status: 400 },
      )
    }

    // Mock successful offramp for now
    const mockTxHash = `0x${Math.random().toString(16).substring(2, 66)}`

    console.log(`Mock offramp: ${amount} ${currency} from wallet ${walletId} to bank ${bankAccountId}`)

    return NextResponse.json({
      success: true,
      txHash: mockTxHash,
      status: "confirmed",
      data: {
        walletId,
        amount,
        currency,
        bankAccountId,
        type: "offramp",
        timestamp: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error("Offramp error:", error)
    return NextResponse.json({ success: false, error: "Failed to process offramp" }, { status: 500 })
  }
}
