import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { walletId, recipientAddress, amount, userToken } = body

    if (!walletId || !recipientAddress || !amount) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: walletId, recipientAddress, amount" },
        { status: 400 },
      )
    }

    // Check if Circle API is configured
    const circleApiKey = process.env.CIRCLE_API_KEY
    if (!circleApiKey) {
      return NextResponse.json(
        {
          success: false,
          error: "Circle API not configured. Please add CIRCLE_API_KEY environment variable in Project Settings.",
        },
        { status: 500 },
      )
    }

    console.log("Attempting Circle API call with:", { walletId, recipientAddress, amount })

    try {
      const circleResponse = await fetch("https://api.circle.com/v1/w3s/user/transactions/transfer", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${circleApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: walletId,
          destinationAddress: recipientAddress,
          amounts: [amount.toString()],
          tokenId: "36b1737e-0e3b-44ac-9e28-1c0d0b5e7d9a", // USDC on Polygon Amoy
          walletId: walletId,
          fee: {
            type: "level",
            config: {
              feeLevel: "MEDIUM",
            },
          },
        }),
      })

      const responseText = await circleResponse.text()
      console.log("Circle API response:", { status: circleResponse.status, body: responseText })

      if (!circleResponse.ok) {
        let errorMessage = "Transaction failed"
        try {
          const errorData = JSON.parse(responseText)
          errorMessage = errorData.message || errorData.error || errorMessage
        } catch {
          errorMessage = `HTTP ${circleResponse.status}: ${responseText}`
        }

        return NextResponse.json(
          {
            success: false,
            error: `Circle API error: ${errorMessage}. Please ensure you have USDC balance on Polygon Amoy testnet.`,
          },
          { status: 400 },
        )
      }

      const result = JSON.parse(responseText)

      return NextResponse.json({
        success: true,
        txHash: result.data?.transactionHash,
        status: result.data?.state || "pending",
        challengeId: result.data?.challengeId,
        data: {
          walletId,
          recipientAddress,
          amount,
          currency: "USDC",
          timestamp: new Date().toISOString(),
          circleTransactionId: result.data?.id,
        },
      })
    } catch (fetchError) {
      console.error("Circle API fetch error:", fetchError)
      return NextResponse.json(
        {
          success: false,
          error: "Failed to connect to Circle API. Please check your internet connection and try again.",
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Send USDC error:", error)
    return NextResponse.json(
      {
        success: false,
        error:
          "Failed to process USDC transfer. Please ensure you have sufficient USDC balance on Polygon Amoy testnet.",
      },
      { status: 500 },
    )
  }
}
