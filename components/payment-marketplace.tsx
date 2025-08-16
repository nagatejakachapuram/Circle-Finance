"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowLeft, ShoppingBag, History, TrendingUp } from "lucide-react"
import { ProductCatalog } from "./product-catalog"
import { CheckoutForm } from "./checkout-form"
import { GlassCard } from "./glass-card"
import { FadeIn } from "./motion"
import { useWallet } from "@/hooks/use-wallet"
import type { Product } from "@/lib/types/product"

export function PaymentMarketplace() {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [showCheckout, setShowCheckout] = useState(false)
  const [completedOrder, setCompletedOrder] = useState<string | null>(null)
  const { isConnected, address } = useWallet()

  const handleProductSelect = (product: Product) => {
    setSelectedProduct(product)
    setShowCheckout(true)
  }

  const handleCheckoutSuccess = (orderId: string) => {
    setCompletedOrder(orderId)
    setShowCheckout(false)
    setSelectedProduct(null)
  }

  const handleCheckoutCancel = () => {
    setShowCheckout(false)
    setSelectedProduct(null)
  }

  if (showCheckout && selectedProduct) {
    return (
      <div className="space-y-6">
        <FadeIn>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={handleCheckoutCancel}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Products
            </Button>
            <div className="h-4 w-px bg-border" />
            <Badge variant="outline">Checkout</Badge>
          </div>
        </FadeIn>

        <CheckoutForm product={selectedProduct} onSuccess={handleCheckoutSuccess} onCancel={handleCheckoutCancel} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <FadeIn>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">USDC Marketplace</h1>
            <p className="text-muted-foreground">Pay with USDC on any supported blockchain</p>
          </div>
          {isConnected && (
            <Badge variant="outline" className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              Connected: {address?.slice(0, 6)}...{address?.slice(-4)}
            </Badge>
          )}
        </div>
      </FadeIn>

      {/* Success Message */}
      {completedOrder && (
        <FadeIn>
          <GlassCard className="border-green-500/20 bg-green-500/5">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500/20">
                  <ShoppingBag className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-green-600">Payment Successful!</h3>
                  <p className="text-sm text-muted-foreground">Order ID: {completedOrder}</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setCompletedOrder(null)} className="ml-auto">
                  Dismiss
                </Button>
              </div>
            </CardContent>
          </GlassCard>
        </FadeIn>
      )}

      {/* Main Content */}
      <FadeIn delay={0.1}>
        <Tabs defaultValue="products" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="products" className="flex items-center gap-2">
              <ShoppingBag className="h-4 w-4" />
              Products
            </TabsTrigger>
            <TabsTrigger value="orders" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              My Orders
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="products" className="space-y-6">
            <ProductCatalog onProductSelect={handleProductSelect} />
          </TabsContent>

          <TabsContent value="orders" className="space-y-6">
            <OrderHistory />
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <PaymentAnalytics />
          </TabsContent>
        </Tabs>
      </FadeIn>
    </div>
  )
}

function OrderHistory() {
  return (
    <GlassCard>
      <CardHeader>
        <CardTitle>Order History</CardTitle>
        <CardDescription>Your recent purchases and payments</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8">
          <History className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No orders yet</h3>
          <p className="text-muted-foreground">Your order history will appear here after your first purchase</p>
        </div>
      </CardContent>
    </GlassCard>
  )
}

function PaymentAnalytics() {
  return (
    <GlassCard>
      <CardHeader>
        <CardTitle>Payment Analytics</CardTitle>
        <CardDescription>Insights into your payment activity</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8">
          <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Analytics coming soon</h3>
          <p className="text-muted-foreground">Detailed payment analytics and insights will be available here</p>
        </div>
      </CardContent>
    </GlassCard>
  )
}
