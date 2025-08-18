import { type NextRequest, NextResponse } from "next/server"
import { transferTracker } from "@/lib/transfer-tracker"
import { transferStorage } from "@/lib/transfer-storage"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const limit = searchParams.get("limit")
    const offset = searchParams.get("offset")

    let transfers = transferTracker.getAllTransfers()

    // Filter by status if provided
    if (status) {
      transfers = transfers.filter((t) => t.status === status)
    }

    // Apply pagination
    const limitNum = limit ? Number.parseInt(limit) : 50
    const offsetNum = offset ? Number.parseInt(offset) : 0

    const paginatedTransfers = transfers
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .slice(offsetNum, offsetNum + limitNum)

    return NextResponse.json({
      success: true,
      transfers: paginatedTransfers.map((transfer) => ({
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
      })),
      pagination: {
        total: transfers.length,
        limit: limitNum,
        offset: offsetNum,
        hasMore: offsetNum + limitNum < transfers.length,
      },
    })
  } catch (error) {
    console.error("[v0] Transfers API error:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch transfers" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const transferId = searchParams.get("transferId")
    const action = searchParams.get("action")

    if (action === "cleanup") {
      // Clean up old completed/failed transfers
      const days = searchParams.get("days")
      const daysNum = days ? Number.parseInt(days) : 30

      transferStorage.clearOldTransfers(daysNum)

      return NextResponse.json({
        success: true,
        message: `Cleaned up transfers older than ${daysNum} days`,
      })
    }

    if (transferId) {
      transferStorage.deleteTransfer(transferId)

      return NextResponse.json({
        success: true,
        message: "Transfer deleted successfully",
      })
    }

    return NextResponse.json({ success: false, error: "Missing transferId or action parameter" }, { status: 400 })
  } catch (error) {
    console.error("[v0] Delete transfer error:", error)
    return NextResponse.json({ success: false, error: "Failed to delete transfer" }, { status: 500 })
  }
}
