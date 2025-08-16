import { productManager } from "./product-manager"
import type { Product, ProductOrder } from "./types/product"
import { CCTP_CONFIG } from "./cctp-config"

export interface PaymentAnalytics {
  overview: {
    totalRevenue: number
    totalOrders: number
    averageOrderValue: number
    conversionRate: number
    activeProducts: number
  }
  revenueByPeriod: Array<{
    period: string
    revenue: number
    orders: number
  }>
  revenueByChain: Array<{
    chainId: number
    chainName: string
    revenue: number
    orders: number
    percentage: number
  }>
  topProducts: Array<{
    product: Product
    revenue: number
    orders: number
    conversionRate: number
  }>
  orderStatusDistribution: Array<{
    status: string
    count: number
    percentage: number
  }>
  customerInsights: {
    totalCustomers: number
    returningCustomers: number
    averageCustomerValue: number
    topCustomers: Array<{
      address: string
      totalSpent: number
      orderCount: number
    }>
  }
  bridgeAnalytics: {
    totalBridgeVolume: number
    bridgeTransactions: number
    popularBridgeRoutes: Array<{
      fromChain: number
      toChain: number
      volume: number
      count: number
    }>
    averageBridgeTime: string
  }
}

export interface AnalyticsFilters {
  dateRange?: {
    start: Date
    end: Date
  }
  chainId?: number
  productId?: string
  status?: string
}

class AnalyticsService {
  // Get comprehensive payment analytics
  getPaymentAnalytics(filters: AnalyticsFilters = {}): PaymentAnalytics {
    const allProducts = productManager.getAllProducts()
    const allOrders = this.getAllOrdersWithFilters(filters)
    const completedOrders = allOrders.filter((order) => order.status === "completed")

    // Overview metrics
    const totalRevenue = completedOrders.reduce((sum, order) => sum + order.amount, 0) / 1e6
    const totalOrders = allOrders.length
    const averageOrderValue = completedOrders.length > 0 ? totalRevenue / completedOrders.length : 0
    const conversionRate = totalOrders > 0 ? (completedOrders.length / totalOrders) * 100 : 0
    const activeProducts = allProducts.filter((p) => p.isActive).length

    // Revenue by period (last 30 days)
    const revenueByPeriod = this.calculateRevenueByPeriod(completedOrders, 30)

    // Revenue by chain
    const revenueByChain = this.calculateRevenueByChain(completedOrders)

    // Top products
    const topProducts = this.calculateTopProducts(allProducts, allOrders, completedOrders)

    // Order status distribution
    const orderStatusDistribution = this.calculateOrderStatusDistribution(allOrders)

    // Customer insights
    const customerInsights = this.calculateCustomerInsights(completedOrders)

    // Bridge analytics (simulated for demo)
    const bridgeAnalytics = this.calculateBridgeAnalytics()

    return {
      overview: {
        totalRevenue,
        totalOrders,
        averageOrderValue,
        conversionRate,
        activeProducts,
      },
      revenueByPeriod,
      revenueByChain,
      topProducts,
      orderStatusDistribution,
      customerInsights,
      bridgeAnalytics,
    }
  }

  // Get real-time metrics
  getRealTimeMetrics(): {
    ordersToday: number
    revenueToday: number
    activeCustomers: number
    pendingOrders: number
  } {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const allOrders = this.getAllOrdersWithFilters({
      dateRange: { start: today, end: new Date() },
    })

    const completedToday = allOrders.filter((order) => order.status === "completed")
    const pendingOrders = allOrders.filter((order) => order.status === "pending").length

    return {
      ordersToday: allOrders.length,
      revenueToday: completedToday.reduce((sum, order) => sum + order.amount, 0) / 1e6,
      activeCustomers: new Set(allOrders.map((order) => order.customerAddress)).size,
      pendingOrders,
    }
  }

  // Get product performance metrics
  getProductPerformance(productId: string): {
    totalRevenue: number
    totalOrders: number
    conversionRate: number
    averageOrderValue: number
    revenueByChain: Array<{ chainId: number; revenue: number; orders: number }>
    recentOrders: ProductOrder[]
  } {
    const orders = productManager.getOrdersByProduct(productId)
    const completedOrders = orders.filter((order) => order.status === "completed")

    const totalRevenue = completedOrders.reduce((sum, order) => sum + order.amount, 0) / 1e6
    const totalOrders = orders.length
    const conversionRate = totalOrders > 0 ? (completedOrders.length / totalOrders) * 100 : 0
    const averageOrderValue = completedOrders.length > 0 ? totalRevenue / completedOrders.length : 0

    // Revenue by chain for this product
    const revenueByChain = this.calculateRevenueByChain(completedOrders)

    // Recent orders (last 10)
    const recentOrders = orders
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10)

    return {
      totalRevenue,
      totalOrders,
      conversionRate,
      averageOrderValue,
      revenueByChain,
      recentOrders,
    }
  }

  // Private helper methods
  private getAllOrdersWithFilters(filters: AnalyticsFilters): ProductOrder[] {
    const allProducts = productManager.getAllProducts()
    let allOrders: ProductOrder[] = []

    // Collect all orders from all products
    for (const product of allProducts) {
      const productOrders = productManager.getOrdersByProduct(product.id)
      allOrders = allOrders.concat(productOrders)
    }

    // Apply filters
    if (filters.dateRange) {
      allOrders = allOrders.filter((order) => {
        const orderDate = new Date(order.createdAt)
        return orderDate >= filters.dateRange!.start && orderDate <= filters.dateRange!.end
      })
    }

    if (filters.chainId) {
      allOrders = allOrders.filter((order) => order.chainId === filters.chainId)
    }

    if (filters.productId) {
      allOrders = allOrders.filter((order) => order.productId === filters.productId)
    }

    if (filters.status) {
      allOrders = allOrders.filter((order) => order.status === filters.status)
    }

    return allOrders
  }

  private calculateRevenueByPeriod(orders: ProductOrder[], days: number) {
    const periods: Array<{ period: string; revenue: number; orders: number }> = []
    const now = new Date()

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now)
      date.setDate(date.getDate() - i)
      date.setHours(0, 0, 0, 0)

      const nextDate = new Date(date)
      nextDate.setDate(nextDate.getDate() + 1)

      const dayOrders = orders.filter((order) => {
        const orderDate = new Date(order.createdAt)
        return orderDate >= date && orderDate < nextDate
      })

      periods.push({
        period: date.toISOString().split("T")[0],
        revenue: dayOrders.reduce((sum, order) => sum + order.amount, 0) / 1e6,
        orders: dayOrders.length,
      })
    }

    return periods
  }

  private calculateRevenueByChain(orders: ProductOrder[]) {
    const chainStats: Record<number, { revenue: number; orders: number }> = {}

    for (const order of orders) {
      if (!chainStats[order.chainId]) {
        chainStats[order.chainId] = { revenue: 0, orders: 0 }
      }
      chainStats[order.chainId].revenue += order.amount
      chainStats[order.chainId].orders += 1
    }

    const totalRevenue = Object.values(chainStats).reduce((sum, stats) => sum + stats.revenue, 0)

    return Object.entries(chainStats)
      .map(([chainId, stats]) => ({
        chainId: Number.parseInt(chainId),
        chainName: CCTP_CONFIG.chains[Number.parseInt(chainId)]?.name || `Chain ${chainId}`,
        revenue: stats.revenue / 1e6,
        orders: stats.orders,
        percentage: totalRevenue > 0 ? (stats.revenue / totalRevenue) * 100 : 0,
      }))
      .sort((a, b) => b.revenue - a.revenue)
  }

  private calculateTopProducts(products: Product[], allOrders: ProductOrder[], completedOrders: ProductOrder[]) {
    return products
      .map((product) => {
        const productOrders = allOrders.filter((order) => order.productId === product.id)
        const productCompletedOrders = completedOrders.filter((order) => order.productId === product.id)

        const revenue = productCompletedOrders.reduce((sum, order) => sum + order.amount, 0) / 1e6
        const orders = productCompletedOrders.length
        const conversionRate = productOrders.length > 0 ? (orders / productOrders.length) * 100 : 0

        return {
          product,
          revenue,
          orders,
          conversionRate,
        }
      })
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10)
  }

  private calculateOrderStatusDistribution(orders: ProductOrder[]) {
    const statusCounts: Record<string, number> = {}

    for (const order of orders) {
      statusCounts[order.status] = (statusCounts[order.status] || 0) + 1
    }

    const total = orders.length

    return Object.entries(statusCounts).map(([status, count]) => ({
      status,
      count,
      percentage: total > 0 ? (count / total) * 100 : 0,
    }))
  }

  private calculateCustomerInsights(completedOrders: ProductOrder[]) {
    const customerStats: Record<string, { totalSpent: number; orderCount: number }> = {}

    for (const order of completedOrders) {
      if (!customerStats[order.customerAddress]) {
        customerStats[order.customerAddress] = { totalSpent: 0, orderCount: 0 }
      }
      customerStats[order.customerAddress].totalSpent += order.amount
      customerStats[order.customerAddress].orderCount += 1
    }

    const totalCustomers = Object.keys(customerStats).length
    const returningCustomers = Object.values(customerStats).filter((stats) => stats.orderCount > 1).length
    const totalRevenue = Object.values(customerStats).reduce((sum, stats) => sum + stats.totalSpent, 0)
    const averageCustomerValue = totalCustomers > 0 ? totalRevenue / totalCustomers / 1e6 : 0

    const topCustomers = Object.entries(customerStats)
      .map(([address, stats]) => ({
        address,
        totalSpent: stats.totalSpent / 1e6,
        orderCount: stats.orderCount,
      }))
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 10)

    return {
      totalCustomers,
      returningCustomers,
      averageCustomerValue,
      topCustomers,
    }
  }

  private calculateBridgeAnalytics() {
    // Simulated bridge analytics for demo
    return {
      totalBridgeVolume: 125000, // $125k USDC
      bridgeTransactions: 342,
      popularBridgeRoutes: [
        { fromChain: 1, toChain: 8453, volume: 45000, count: 123 }, // Ethereum to Base
        { fromChain: 42161, toChain: 1, volume: 32000, count: 87 }, // Arbitrum to Ethereum
        { fromChain: 137, toChain: 8453, volume: 28000, count: 76 }, // Polygon to Base
        { fromChain: 8453, toChain: 1, volume: 20000, count: 56 }, // Base to Ethereum
      ],
      averageBridgeTime: "~8 minutes",
    }
  }
}

export const analyticsService = new AnalyticsService()
