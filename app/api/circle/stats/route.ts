import { type NextRequest, NextResponse } from "next/server"
import { transferStorage } from "@/lib/transfer-storage"
import { attestationService } from "@/lib/attestation-service"

export async function GET(request: NextRequest) {
  try {
    // Get transfer statistics
    const stats = transferStorage.getTransferStats()

    // Get attestation service health
    const serviceHealth = await attestationService.getServiceHealth()

    // Get active transfers count
    const activeTransfers = transferStorage.getActiveTransfers()

    return NextResponse.json({
      success: true,
      stats: {
        ...stats,
        active: activeTransfers.length,
      },
      serviceHealth,
      activeTransfers: activeTransfers.map((transfer) => ({
        id: transfer.id,
        sourceChain: transfer.sourceChain,
        destinationChain: transfer.destinationChain,
        amount: transfer.amount,
        status: transfer.status,
        createdAt: transfer.createdAt,
      })),
    })
  } catch (error) {
    console.error("[v0] Stats API error:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch statistics" }, { status: 500 })
  }
}
