import { type NextRequest, NextResponse } from "next/server"
import { transferTracker } from "@/lib/transfer-tracker"
import { cctpService } from "@/lib/cctp-service"
import { validateCCTPTransfer } from "@/lib/cctp-utils"
import { CCTP_NETWORKS, type CCTPNetwork } from "@/lib/cctp-config"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      action,
      sourceChain,
      destinationChain,
      amount,
      sourceAddress,
      destinationAddress,
      transferId,
      userAddress,
    } = body

    switch (action) {
      case "initiate":
        return await handleInitiateTransfer(sourceChain, destinationChain, amount, sourceAddress, destinationAddress)

      case "execute":
        return await handleExecuteTransfer(transferId, userAddress)

      case "mint":
        return await handleMintTransfer(transferId, userAddress)

      case "status":
        return await handleGetStatus(transferId)

      case "estimate":
        return await handleEstimate(sourceChain, destinationChain, amount, userAddress)

      default:
        return NextResponse.json(
          { success: false, error: "Invalid action. Supported actions: initiate, execute, mint, status, estimate" },
          { status: 400 },
        )
    }
  } catch (error) {
    console.error("[v0] Bridge API error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to process bridge request",
      },
      { status: 500 },
    )
  }
}

async function handleInitiateTransfer(
  sourceChain: CCTPNetwork,
  destinationChain: CCTPNetwork,
  amount: string,
  sourceAddress: string,
  destinationAddress: string,
) {
  // Validate input parameters
  if (!sourceChain || !destinationChain || !amount || !sourceAddress || !destinationAddress) {
    return NextResponse.json(
      {
        success: false,
        error: "Missing required fields: sourceChain, destinationChain, amount, sourceAddress, destinationAddress",
      },
      { status: 400 },
    )
  }

  // Validate CCTP networks
  if (!CCTP_NETWORKS[sourceChain] || !CCTP_NETWORKS[destinationChain]) {
    return NextResponse.json(
      { success: false, error: "Unsupported network. Supported networks: ethereum, base, arbitrum, polygon" },
      { status: 400 },
    )
  }

  // Validate transfer parameters
  const validation = validateCCTPTransfer(sourceChain, destinationChain, amount)
  if (!validation.isValid) {
    return NextResponse.json({ success: false, error: validation.error }, { status: 400 })
  }

  try {
    // Create transfer record
    const transferId = await transferTracker.createTransfer(
      sourceChain,
      destinationChain,
      amount,
      sourceAddress,
      destinationAddress,
    )

    // Get estimated completion time
    const estimatedTime = await cctpService.estimateTransferTime(sourceChain, destinationChain)

    console.log(
      `[v0] CCTP transfer initiated: ${transferId} - ${amount} USDC from ${sourceChain} to ${destinationChain}`,
    )

    return NextResponse.json({
      success: true,
      transferId,
      estimatedTime,
      status: "initiated",
      data: {
        sourceChain,
        destinationChain,
        amount,
        sourceAddress,
        destinationAddress,
        timestamp: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error("[v0] Failed to initiate transfer:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to initiate transfer" },
      { status: 500 },
    )
  }
}

async function handleExecuteTransfer(transferId: string, userAddress: string) {
  if (!transferId || !userAddress) {
    return NextResponse.json(
      { success: false, error: "Missing required fields: transferId, userAddress" },
      { status: 400 },
    )
  }

  try {
    const result = await transferTracker.executeTransfer(transferId, userAddress)

    console.log(`[v0] CCTP burn executed for transfer ${transferId}: ${result.burnTxHash}`)

    return NextResponse.json({
      success: true,
      burnTxHash: result.burnTxHash,
      messageHash: result.messageHash,
      status: "burned",
      message: "USDC burned successfully, waiting for attestation",
      data: {
        transferId,
        burnTxHash: result.burnTxHash,
        messageHash: result.messageHash,
        timestamp: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error("[v0] Failed to execute transfer:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to execute transfer" },
      { status: 500 },
    )
  }
}

async function handleMintTransfer(transferId: string, userAddress: string) {
  if (!transferId || !userAddress) {
    return NextResponse.json(
      { success: false, error: "Missing required fields: transferId, userAddress" },
      { status: 400 },
    )
  }

  try {
    const mintTxHash = await transferTracker.completeMint(transferId, userAddress)

    console.log(`[v0] CCTP mint completed for transfer ${transferId}: ${mintTxHash}`)

    return NextResponse.json({
      success: true,
      mintTxHash,
      status: "completed",
      message: "Transfer completed successfully",
      data: {
        transferId,
        mintTxHash,
        timestamp: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error("[v0] Failed to complete mint:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to complete mint" },
      { status: 500 },
    )
  }
}

async function handleGetStatus(transferId: string) {
  if (!transferId) {
    return NextResponse.json({ success: false, error: "Missing required field: transferId" }, { status: 400 })
  }

  try {
    const transfer = transferTracker.getTransfer(transferId)

    if (!transfer) {
      return NextResponse.json({ success: false, error: "Transfer not found" }, { status: 404 })
    }

    // Get detailed status if we have a message hash
    let detailedStatus = null
    if (transfer.messageHash && transfer.status !== "minted" && transfer.status !== "failed") {
      try {
        detailedStatus = await cctpService.getTransferStatus(
          transfer.messageHash,
          transfer.sourceChain,
          transfer.destinationChain,
          transfer.nonce || BigInt(0),
        )
      } catch (error) {
        console.error("[v0] Failed to get detailed status:", error)
      }
    }

    return NextResponse.json({
      success: true,
      transfer: {
        id: transfer.id,
        sourceChain: transfer.sourceChain,
        destinationChain: transfer.destinationChain,
        amount: transfer.amount,
        status: transfer.status,
        burnTxHash: transfer.burnTxHash,
        mintTxHash: transfer.mintTxHash,
        messageHash: transfer.messageHash,
        createdAt: transfer.createdAt,
        updatedAt: transfer.updatedAt,
        lastError: transfer.lastError,
      },
      detailedStatus,
      canMint: detailedStatus?.canMint || false,
    })
  } catch (error) {
    console.error("[v0] Failed to get transfer status:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to get transfer status" },
      { status: 500 },
    )
  }
}

async function handleEstimate(
  sourceChain: CCTPNetwork,
  destinationChain: CCTPNetwork,
  amount: string,
  userAddress: string,
) {
  if (!sourceChain || !destinationChain || !amount || !userAddress) {
    return NextResponse.json(
      { success: false, error: "Missing required fields: sourceChain, destinationChain, amount, userAddress" },
      { status: 400 },
    )
  }

  // Validate networks
  if (!CCTP_NETWORKS[sourceChain] || !CCTP_NETWORKS[destinationChain]) {
    return NextResponse.json({ success: false, error: "Unsupported network" }, { status: 400 })
  }

  try {
    const estimatedTime = await cctpService.estimateTransferTime(sourceChain, destinationChain)

    // Note: Gas estimation requires wallet connection, so we provide approximate values
    const approximateGasCosts = {
      burnGasCost: "0.01", // Approximate ETH cost for burn
      mintGasCost: "0.005", // Approximate ETH cost for mint
      totalCostETH: "0.015",
    }

    return NextResponse.json({
      success: true,
      estimation: {
        estimatedTime,
        gasCosts: approximateGasCosts,
        sourceNetwork: CCTP_NETWORKS[sourceChain].name,
        destinationNetwork: CCTP_NETWORKS[destinationChain].name,
        amount,
        timestamp: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error("[v0] Failed to estimate transfer:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to estimate transfer" },
      { status: 500 },
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get("action")
    const transferId = searchParams.get("transferId")

    if (action === "status" && transferId) {
      return await handleGetStatus(transferId)
    }

    if (action === "list") {
      // Get all transfers (could be filtered by user in a real app)
      const transfers = transferTracker.getAllTransfers()

      return NextResponse.json({
        success: true,
        transfers: transfers.map((transfer) => ({
          id: transfer.id,
          sourceChain: transfer.sourceChain,
          destinationChain: transfer.destinationChain,
          amount: transfer.amount,
          status: transfer.status,
          createdAt: transfer.createdAt,
          updatedAt: transfer.updatedAt,
        })),
      })
    }

    return NextResponse.json(
      { success: false, error: "Invalid GET request. Supported actions: status, list" },
      { status: 400 },
    )
  } catch (error) {
    console.error("[v0] Bridge GET API error:", error)
    return NextResponse.json({ success: false, error: "Failed to process request" }, { status: 500 })
  }
}
