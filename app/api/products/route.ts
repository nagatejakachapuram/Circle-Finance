import { type NextRequest, NextResponse } from "next/server"
import { productManager } from "@/lib/product-manager"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const chainId = searchParams.get("chainId")
    const category = searchParams.get("category")
    const active = searchParams.get("active")

    let products = productManager.getAllProducts()

    // Filter by chain if specified
    if (chainId) {
      products = productManager.getProductsByChain(Number.parseInt(chainId))
    }

    // Filter by active status
    if (active === "true") {
      products = products.filter((p) => p.isActive)
    }

    // Filter by category
    if (category) {
      products = products.filter((p) => p.category.toLowerCase() === category.toLowerCase())
    }

    return NextResponse.json({
      success: true,
      products,
    })
  } catch (error) {
    console.error("Error fetching products:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch products" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const productData = await request.json()

    // Validate required fields
    const requiredFields = ["name", "description", "price", "category", "supportedChains"]
    for (const field of requiredFields) {
      if (!productData[field]) {
        return NextResponse.json({ success: false, error: `Missing required field: ${field}` }, { status: 400 })
      }
    }

    const product = productManager.createProduct({
      ...productData,
      currency: "USDC",
      isActive: productData.isActive ?? true,
    })

    return NextResponse.json({
      success: true,
      product,
    })
  } catch (error) {
    console.error("Error creating product:", error)
    return NextResponse.json({ success: false, error: "Failed to create product" }, { status: 500 })
  }
}
