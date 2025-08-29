import { type NextRequest, NextResponse } from "next/server"
import { CIRCLE_CONFIG } from "@/lib/circle-config"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const walletId = searchParams.get("walletId")

    if (!walletId) {
      return NextResponse.json({ error: "Wallet ID required" }, { status: 400 })
    }

    const response = await fetch(
      `${process.env.CIRCLE_API_URL}/v1/w3s/wallets/${walletId}/balances`,
      {
        headers: {
          Authorization: `Bearer ${process.env.CIRCLE_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    )

    if (!response.ok) {
      throw new Error(`Balance check failed: ${response.statusText}`)
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Balance check error:", error)
    return NextResponse.json({ error: "Failed to check balance" }, { status: 500 })
  }
}
