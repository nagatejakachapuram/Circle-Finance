import type { Product, ProductOrder, PaymentIntent } from "./types/product"

class ProductManager {
  private products: Map<string, Product> = new Map()
  private orders: Map<string, ProductOrder> = new Map()
  private paymentIntents: Map<string, PaymentIntent> = new Map()

  constructor() {
    this.loadFromStorage()
  }

  // Product Management
  createProduct(productData: Omit<Product, "id" | "createdAt" | "updatedAt">): Product {
    const product: Product = {
      ...productData,
      id: this.generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    this.products.set(product.id, product)
    this.saveToStorage()
    return product
  }

  getProduct(id: string): Product | undefined {
    return this.products.get(id)
  }

  getAllProducts(): Product[] {
    return Array.from(this.products.values())
  }

  getActiveProducts(): Product[] {
    return this.getAllProducts().filter((p) => p.isActive)
  }

  getProductsByChain(chainId: number): Product[] {
    return this.getActiveProducts().filter((p) => p.supportedChains.includes(chainId))
  }

  updateProduct(id: string, updates: Partial<Product>): Product | null {
    const product = this.products.get(id)
    if (!product) return null

    const updatedProduct = {
      ...product,
      ...updates,
      id, // Ensure ID doesn't change
      updatedAt: new Date(),
    }

    this.products.set(id, updatedProduct)
    this.saveToStorage()
    return updatedProduct
  }

  deleteProduct(id: string): boolean {
    const deleted = this.products.delete(id)
    if (deleted) {
      this.saveToStorage()
    }
    return deleted
  }

  // Order Management
  createOrder(orderData: Omit<ProductOrder, "id" | "createdAt">): ProductOrder {
    const order: ProductOrder = {
      ...orderData,
      id: this.generateId(),
      createdAt: new Date(),
    }

    this.orders.set(order.id, order)
    this.saveToStorage()
    return order
  }

  getOrder(id: string): ProductOrder | undefined {
    return this.orders.get(id)
  }

  getOrdersByCustomer(customerAddress: string): ProductOrder[] {
    return Array.from(this.orders.values()).filter(
      (order) => order.customerAddress.toLowerCase() === customerAddress.toLowerCase(),
    )
  }

  getOrdersByProduct(productId: string): ProductOrder[] {
    return Array.from(this.orders.values()).filter((order) => order.productId === productId)
  }

  updateOrderStatus(orderId: string, status: ProductOrder["status"], txHash?: string): ProductOrder | null {
    const order = this.orders.get(orderId)
    if (!order) return null

    const updatedOrder = {
      ...order,
      status,
      ...(txHash && { txHash }),
      ...(status === "completed" && { completedAt: new Date() }),
    }

    this.orders.set(orderId, updatedOrder)
    this.saveToStorage()
    return updatedOrder
  }

  // Payment Intent Management
  createPaymentIntent(
    intentData: Omit<PaymentIntent, "id" | "clientSecret" | "createdAt" | "expiresAt">,
  ): PaymentIntent {
    const intent: PaymentIntent = {
      ...intentData,
      id: this.generateId(),
      clientSecret: this.generateClientSecret(),
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
    }

    this.paymentIntents.set(intent.id, intent)
    this.saveToStorage()
    return intent
  }

  getPaymentIntent(id: string): PaymentIntent | undefined {
    return this.paymentIntents.get(id)
  }

  updatePaymentIntentStatus(id: string, status: PaymentIntent["status"]): PaymentIntent | null {
    const intent = this.paymentIntents.get(id)
    if (!intent) return null

    const updatedIntent = { ...intent, status }
    this.paymentIntents.set(id, updatedIntent)
    this.saveToStorage()
    return updatedIntent
  }

  // Analytics
  getProductStats(productId: string) {
    const orders = this.getOrdersByProduct(productId)
    const completedOrders = orders.filter((o) => o.status === "completed")

    return {
      totalOrders: orders.length,
      completedOrders: completedOrders.length,
      totalRevenue: completedOrders.reduce((sum, order) => sum + order.amount, 0),
      conversionRate: orders.length > 0 ? (completedOrders.length / orders.length) * 100 : 0,
    }
  }

  getOverallStats() {
    const allOrders = Array.from(this.orders.values())
    const completedOrders = allOrders.filter((o) => o.status === "completed")

    return {
      totalProducts: this.products.size,
      activeProducts: this.getActiveProducts().length,
      totalOrders: allOrders.length,
      completedOrders: completedOrders.length,
      totalRevenue: completedOrders.reduce((sum, order) => sum + order.amount, 0),
      averageOrderValue:
        completedOrders.length > 0
          ? completedOrders.reduce((sum, order) => sum + order.amount, 0) / completedOrders.length
          : 0,
    }
  }

  // Utility Methods
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  private generateClientSecret(): string {
    return `pi_${Math.random().toString(36).substr(2, 24)}`
  }

  private saveToStorage() {
    if (typeof window !== "undefined") {
      localStorage.setItem(
        "circle-products",
        JSON.stringify({
          products: Array.from(this.products.entries()),
          orders: Array.from(this.orders.entries()),
          paymentIntents: Array.from(this.paymentIntents.entries()),
        }),
      )
    }
  }

  private loadFromStorage() {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("circle-products")
      if (stored) {
        try {
          const data = JSON.parse(stored)
          this.products = new Map(data.products || [])
          this.orders = new Map(data.orders || [])
          this.paymentIntents = new Map(data.paymentIntents || [])
        } catch (error) {
          console.error("Failed to load products from storage:", error)
        }
      }
    }
  }

  // Initialize with sample products
  initializeSampleProducts() {
    if (this.products.size === 0) {
      const sampleProducts = [
        {
          name: "Premium API Access",
          description: "Access to our premium API with higher rate limits and advanced features",
          price: 50000000, // 50 USDC (6 decimals)
          currency: "USDC" as const,
          category: "Software",
          isActive: true,
          supportedChains: [1, 8453, 42161, 137], // Ethereum, Base, Arbitrum, Polygon
          metadata: {
            duration: "monthly",
            features: ["Higher rate limits", "Priority support", "Advanced analytics"],
          },
        },
        {
          name: "Digital Course Bundle",
          description: "Complete web3 development course with hands-on projects",
          price: 99000000, // 99 USDC
          currency: "USDC" as const,
          category: "Education",
          isActive: true,
          supportedChains: [1, 8453, 42161, 137],
          metadata: {
            duration: "lifetime",
            modules: 12,
            projects: 5,
          },
        },
        {
          name: "NFT Minting Service",
          description: "Professional NFT collection creation and deployment service",
          price: 200000000, // 200 USDC
          currency: "USDC" as const,
          category: "Services",
          isActive: true,
          supportedChains: [1, 8453, 42161],
          metadata: {
            includes: ["Smart contract", "Metadata generation", "IPFS hosting"],
          },
        },
      ]

      sampleProducts.forEach((product) => this.createProduct(product))
    }
  }
}

export const productManager = new ProductManager()

// Initialize sample products on first load
if (typeof window !== "undefined") {
  productManager.initializeSampleProducts()
}
