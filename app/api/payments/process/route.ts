import { type NextRequest, NextResponse } from "next/server"
import { CCTP_V2_NETWORKS } from "@/lib/cctp-config"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { paymentIntentId, chainId, fromAddress, toAddress, amount } = body

    if (!paymentIntentId || !chainId || !fromAddress || !toAddress || !amount) {
      return NextResponse.json({ success: false, error: "Missing required payment parameters" }, { status: 400 })
    }

    // Find the network configuration
    const network = Object.values(CCTP_V2_NETWORKS).find((n) => n.chainId === chainId)
    if (!network) {
      return NextResponse.json({ success: false, error: "Unsupported network" }, { status: 400 })
    }

    console.log("[v0] Processing payment:", {
      paymentIntentId,
      chainId,
      fromAddress,
      toAddress,
      amount,
      network: network.name,
    })

    // Convert amount to wei (USDC has 6 decimals)
    const amountInWei = (Number.parseFloat(amount) * 1000000).toString(16)

    // USDC transfer function signature: transfer(address,uint256)
    const transferFunctionSignature = "0xa9059cbb"
    const paddedToAddress = toAddress.slice(2).padStart(64, "0")
    const paddedAmount = amountInWei.padStart(64, "0")
    const transferData = transferFunctionSignature + paddedToAddress + paddedAmount

    return NextResponse.json({
      success: true,
      requiresWalletSignature: true,
      transactionData: {
        to: network.usdcAddress, // Use actual USDC contract address
        data: transferData, // Proper USDC transfer call data
        value: "0x0",
        gasLimit: "0x186A0", // 100,000 gas for USDC transfer
      },
      paymentIntentId,
    })
  } catch (error) {
    console.error("[v0] Payment processing failed:", error)
    return NextResponse.json({ success: false, error: "Failed to process payment" }, { status: 500 })
  }
}
