import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { walletId, recipientAddress, amount } = body

    if (!walletId || !recipientAddress || !amount) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: walletId, recipientAddress, amount" },
        { status: 400 },
      )
    }

    console.log("[v0] Processing real USDC transfer request:", { walletId, recipientAddress, amount })

    // Return transaction request that frontend must execute with MetaMask
    return NextResponse.json({
      success: false,
      requiresWalletSignature: true,
      transactionData: {
        to: "0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582", // USDC contract on Polygon Amoy
        data: `0xa9059cbb000000000000000000000000${recipientAddress.slice(2)}${amount.toString(16).padStart(64, "0")}`, // transfer(address,uint256)
        value: "0x0",
        gasLimit: "0x5208", // 21000 gas
      },
      message: "Please approve the USDC transfer transaction in your wallet",
      usdcContract: "0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582",
      network: "Polygon Amoy Testnet",
    })
  } catch (error) {
    console.error("[v0] Send USDC error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to prepare USDC transfer transaction",
      },
      { status: 500 },
    )
  }
}
