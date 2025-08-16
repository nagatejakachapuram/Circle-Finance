import { type NextRequest, NextResponse } from "next/server"
import { analyticsService } from "@/lib/analytics-service"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const dateRange = searchParams.get("dateRange")
    const chainId = searchParams.get("chainId")
    const productId = searchParams.get("productId")

    // Parse filters
    const filters: any = {}

    if (dateRange) {
      const [start, end] = dateRange.split(",")
      filters.dateRange = {
        start: new Date(start),
        end: new Date(end),
      }
    }

    if (chainId && chainId !== "all") {
      filters.chainId = Number.parseInt(chainId)
    }

    if (productId) {
      filters.productId = productId
    }

    const analytics = analyticsService.getPaymentAnalytics(filters)

    return NextResponse.json({
      success: true,
      analytics,
    })
  } catch (error) {
    console.error("Error fetching analytics:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch analytics" }, { status: 500 })
  }
}
