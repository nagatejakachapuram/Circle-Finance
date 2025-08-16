"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart,
} from "recharts"
import { DollarSign, ShoppingCart, Users, Activity, ArrowUpRight, RefreshCw } from "lucide-react"
import { GlassCard } from "./glass-card"
import { FadeIn } from "./motion"
import { analyticsService, type PaymentAnalytics } from "@/lib/analytics-service"
import { CCTP_CONFIG } from "@/lib/cctp-config"

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"]

export function AnalyticsDashboard() {
  const [analytics, setAnalytics] = useState<PaymentAnalytics | null>(null)
  const [realTimeMetrics, setRealTimeMetrics] = useState<any>(null)
  const [selectedTimeRange, setSelectedTimeRange] = useState("30d")
  const [selectedChain, setSelectedChain] = useState<string>("all")
  const [isLoading, setIsLoading] = useState(true)

  // Load analytics data
  useEffect(() => {
    loadAnalytics()
    loadRealTimeMetrics()

    // Set up real-time updates
    const interval = setInterval(loadRealTimeMetrics, 30000) // Update every 30 seconds
    return () => clearInterval(interval)
  }, [selectedTimeRange, selectedChain])

  const loadAnalytics = async () => {
    setIsLoading(true)
    try {
      // Calculate date range based on selection
      const dateRange = getDateRange(selectedTimeRange)
      const filters = {
        dateRange,
        ...(selectedChain !== "all" && { chainId: Number.parseInt(selectedChain) }),
      }

      const data = analyticsService.getPaymentAnalytics(filters)
      setAnalytics(data)
    } catch (error) {
      console.error("Failed to load analytics:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadRealTimeMetrics = async () => {
    try {
      const metrics = analyticsService.getRealTimeMetrics()
      setRealTimeMetrics(metrics)
    } catch (error) {
      console.error("Failed to load real-time metrics:", error)
    }
  }

  const getDateRange = (range: string) => {
    const end = new Date()
    const start = new Date()

    switch (range) {
      case "7d":
        start.setDate(start.getDate() - 7)
        break
      case "30d":
        start.setDate(start.getDate() - 30)
        break
      case "90d":
        start.setDate(start.getDate() - 90)
        break
      default:
        start.setDate(start.getDate() - 30)
    }

    return { start, end }
  }

  if (isLoading || !analytics) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <GlassCard key={i}>
              <div className="animate-pulse p-6">
                <div className="h-4 bg-muted rounded w-1/2 mb-2" />
                <div className="h-8 bg-muted rounded w-3/4" />
              </div>
            </GlassCard>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <FadeIn>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Payment Analytics</h1>
            <p className="text-muted-foreground">Comprehensive insights into your payment performance</p>
          </div>
          <div className="flex items-center gap-3">
            <Select value={selectedTimeRange} onValueChange={setSelectedTimeRange}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedChain} onValueChange={setSelectedChain}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Chains</SelectItem>
                {Object.entries(CCTP_CONFIG.chains).map(([chainId, config]) => (
                  <SelectItem key={chainId} value={chainId}>
                    {config.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={loadAnalytics}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </FadeIn>

      {/* Real-time Metrics */}
      {realTimeMetrics && (
        <FadeIn delay={0.1}>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <GlassCard>
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Orders Today
                </CardDescription>
                <CardTitle className="text-2xl">{realTimeMetrics.ordersToday}</CardTitle>
              </CardHeader>
            </GlassCard>

            <GlassCard>
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Revenue Today
                </CardDescription>
                <CardTitle className="text-2xl">${realTimeMetrics.revenueToday.toFixed(2)}</CardTitle>
              </CardHeader>
            </GlassCard>

            <GlassCard>
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Active Customers
                </CardDescription>
                <CardTitle className="text-2xl">{realTimeMetrics.activeCustomers}</CardTitle>
              </CardHeader>
            </GlassCard>

            <GlassCard>
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4" />
                  Pending Orders
                </CardDescription>
                <CardTitle className="text-2xl text-orange-600">{realTimeMetrics.pendingOrders}</CardTitle>
              </CardHeader>
            </GlassCard>
          </div>
        </FadeIn>
      )}

      {/* Overview Stats */}
      <FadeIn delay={0.2}>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <GlassCard>
            <CardHeader className="pb-2">
              <CardDescription>Total Revenue</CardDescription>
              <CardTitle className="text-2xl text-green-600">${analytics.overview.totalRevenue.toFixed(2)}</CardTitle>
            </CardHeader>
          </GlassCard>

          <GlassCard>
            <CardHeader className="pb-2">
              <CardDescription>Total Orders</CardDescription>
              <CardTitle className="text-2xl">{analytics.overview.totalOrders}</CardTitle>
            </CardHeader>
          </GlassCard>

          <GlassCard>
            <CardHeader className="pb-2">
              <CardDescription>Avg Order Value</CardDescription>
              <CardTitle className="text-2xl">${analytics.overview.averageOrderValue.toFixed(2)}</CardTitle>
            </CardHeader>
          </GlassCard>

          <GlassCard>
            <CardHeader className="pb-2">
              <CardDescription>Conversion Rate</CardDescription>
              <CardTitle className="text-2xl">{analytics.overview.conversionRate.toFixed(1)}%</CardTitle>
            </CardHeader>
          </GlassCard>

          <GlassCard>
            <CardHeader className="pb-2">
              <CardDescription>Active Products</CardDescription>
              <CardTitle className="text-2xl">{analytics.overview.activeProducts}</CardTitle>
            </CardHeader>
          </GlassCard>
        </div>
      </FadeIn>

      {/* Main Analytics */}
      <FadeIn delay={0.3}>
        <Tabs defaultValue="revenue" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="revenue">Revenue</TabsTrigger>
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="chains">Chains</TabsTrigger>
            <TabsTrigger value="customers">Customers</TabsTrigger>
            <TabsTrigger value="bridge">Bridge</TabsTrigger>
          </TabsList>

          <TabsContent value="revenue" className="space-y-6">
            <RevenueAnalytics analytics={analytics} />
          </TabsContent>

          <TabsContent value="products" className="space-y-6">
            <ProductAnalytics analytics={analytics} />
          </TabsContent>

          <TabsContent value="chains" className="space-y-6">
            <ChainAnalytics analytics={analytics} />
          </TabsContent>

          <TabsContent value="customers" className="space-y-6">
            <CustomerAnalytics analytics={analytics} />
          </TabsContent>

          <TabsContent value="bridge" className="space-y-6">
            <BridgeAnalytics analytics={analytics} />
          </TabsContent>
        </Tabs>
      </FadeIn>
    </div>
  )
}

// Revenue Analytics Component
function RevenueAnalytics({ analytics }: { analytics: PaymentAnalytics }) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <GlassCard>
        <CardHeader>
          <CardTitle>Revenue Over Time</CardTitle>
          <CardDescription>Daily revenue for the selected period</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={analytics.revenueByPeriod}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="period" />
              <YAxis />
              <Tooltip formatter={(value) => [`$${Number(value).toFixed(2)}`, "Revenue"]} />
              <Area type="monotone" dataKey="revenue" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </GlassCard>

      <GlassCard>
        <CardHeader>
          <CardTitle>Order Status Distribution</CardTitle>
          <CardDescription>Breakdown of order statuses</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={analytics.orderStatusDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ status, percentage }) => `${status} (${percentage.toFixed(1)}%)`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="count"
              >
                {analytics.orderStatusDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </GlassCard>
    </div>
  )
}

// Product Analytics Component
function ProductAnalytics({ analytics }: { analytics: PaymentAnalytics }) {
  return (
    <GlassCard>
      <CardHeader>
        <CardTitle>Top Performing Products</CardTitle>
        <CardDescription>Products ranked by revenue performance</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {analytics.topProducts.slice(0, 10).map((item, index) => (
            <div key={item.product.id} className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500/20 text-sm font-semibold">
                  {index + 1}
                </div>
                <div>
                  <h4 className="font-semibold">{item.product.name}</h4>
                  <p className="text-sm text-muted-foreground">{item.orders} orders</p>
                </div>
              </div>
              <div className="text-right">
                <div className="font-semibold">${item.revenue.toFixed(2)}</div>
                <div className="text-sm text-muted-foreground">{item.conversionRate.toFixed(1)}% conversion</div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </GlassCard>
  )
}

// Chain Analytics Component
function ChainAnalytics({ analytics }: { analytics: PaymentAnalytics }) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <GlassCard>
        <CardHeader>
          <CardTitle>Revenue by Chain</CardTitle>
          <CardDescription>Payment distribution across blockchain networks</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analytics.revenueByChain}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="chainName" />
              <YAxis />
              <Tooltip formatter={(value) => [`$${Number(value).toFixed(2)}`, "Revenue"]} />
              <Bar dataKey="revenue" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </GlassCard>

      <GlassCard>
        <CardHeader>
          <CardTitle>Chain Performance</CardTitle>
          <CardDescription>Detailed breakdown by network</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analytics.revenueByChain.map((chain) => (
              <div key={chain.chainId} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Badge variant="outline">{chain.chainName}</Badge>
                  <span className="text-sm text-muted-foreground">{chain.orders} orders</span>
                </div>
                <div className="text-right">
                  <div className="font-semibold">${chain.revenue.toFixed(2)}</div>
                  <div className="text-sm text-muted-foreground">{chain.percentage.toFixed(1)}%</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </GlassCard>
    </div>
  )
}

// Customer Analytics Component
function CustomerAnalytics({ analytics }: { analytics: PaymentAnalytics }) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <GlassCard>
        <CardHeader>
          <CardTitle>Customer Overview</CardTitle>
          <CardDescription>Key customer metrics and insights</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <div className="text-2xl font-bold">{analytics.customerInsights.totalCustomers}</div>
              <div className="text-sm text-muted-foreground">Total Customers</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <div className="text-2xl font-bold">{analytics.customerInsights.returningCustomers}</div>
              <div className="text-sm text-muted-foreground">Returning Customers</div>
            </div>
          </div>
          <div className="text-center p-4 rounded-lg bg-muted/50">
            <div className="text-2xl font-bold">${analytics.customerInsights.averageCustomerValue.toFixed(2)}</div>
            <div className="text-sm text-muted-foreground">Average Customer Value</div>
          </div>
        </CardContent>
      </GlassCard>

      <GlassCard>
        <CardHeader>
          <CardTitle>Top Customers</CardTitle>
          <CardDescription>Highest value customers by total spending</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {analytics.customerInsights.topCustomers.slice(0, 8).map((customer, index) => (
              <div key={customer.address} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500/20 text-xs font-semibold">
                    {index + 1}
                  </div>
                  <span className="font-mono text-sm">
                    {customer.address.slice(0, 6)}...{customer.address.slice(-4)}
                  </span>
                </div>
                <div className="text-right">
                  <div className="font-semibold">${customer.totalSpent.toFixed(2)}</div>
                  <div className="text-xs text-muted-foreground">{customer.orderCount} orders</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </GlassCard>
    </div>
  )
}

// Bridge Analytics Component
function BridgeAnalytics({ analytics }: { analytics: PaymentAnalytics }) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <GlassCard>
        <CardHeader>
          <CardTitle>Bridge Overview</CardTitle>
          <CardDescription>Cross-chain transfer statistics</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <div className="text-2xl font-bold">${analytics.bridgeAnalytics.totalBridgeVolume.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">Total Bridge Volume</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <div className="text-2xl font-bold">{analytics.bridgeAnalytics.bridgeTransactions}</div>
              <div className="text-sm text-muted-foreground">Bridge Transactions</div>
            </div>
          </div>
          <div className="text-center p-4 rounded-lg bg-muted/50">
            <div className="text-2xl font-bold">{analytics.bridgeAnalytics.averageBridgeTime}</div>
            <div className="text-sm text-muted-foreground">Average Bridge Time</div>
          </div>
        </CardContent>
      </GlassCard>

      <GlassCard>
        <CardHeader>
          <CardTitle>Popular Bridge Routes</CardTitle>
          <CardDescription>Most used cross-chain transfer paths</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {analytics.bridgeAnalytics.popularBridgeRoutes.map((route, index) => (
              <div key={`${route.fromChain}-${route.toChain}`} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500/20 text-xs font-semibold">
                    {index + 1}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{CCTP_CONFIG.chains[route.fromChain]?.name}</Badge>
                    <ArrowUpRight className="h-3 w-3" />
                    <Badge variant="outline">{CCTP_CONFIG.chains[route.toChain]?.name}</Badge>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold">${route.volume.toLocaleString()}</div>
                  <div className="text-xs text-muted-foreground">{route.count} transfers</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </GlassCard>
    </div>
  )
}
