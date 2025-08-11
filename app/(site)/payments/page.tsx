"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Header from "@/components/header"
import Footer from "@/components/footer"
import { GlassCard } from "@/components/glass-card"
import { FadeIn } from "@/components/motion"
import AuroraBg from "@/components/aurora-bg"
import { PRODUCTS } from "@/src/stripe-config"
import { useAuth } from "@/components/auth-provider"
import { createClient } from "@/lib/supabase/client"
import { CreditCard, Loader2, CheckCircle2 } from 'lucide-react'

export default function PaymentsPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState<string | null>(null)
  const [subscription, setSubscription] = useState<any>(null)
  const [orders, setOrders] = useState<any[]>([])

  const handleCheckout = async (priceId: string, mode: 'payment' | 'subscription') => {
    if (!user) {
      window.location.href = '/auth/login'
      return
    }

    setLoading(priceId)

    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        throw new Error('No active session')
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/stripe-checkout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          price_id: priceId,
          success_url: `${window.location.origin}/payments/success`,
          cancel_url: `${window.location.origin}/payments`,
          mode,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session')
      }

      if (data.url) {
        window.location.href = data.url
      }
    } catch (error: any) {
      console.error('Checkout error:', error)
      alert('Failed to start checkout process. Please try again.')
    } finally {
      setLoading(null)
    }
  }

  const fetchUserData = async () => {
    if (!user) return

    try {
      const supabase = createClient()
      
      // Fetch subscription data
      const { data: subData } = await supabase
        .from('stripe_user_subscriptions')
        .select('*')
        .maybeSingle()

      setSubscription(subData)

      // Fetch orders data
      const { data: ordersData } = await supabase
        .from('stripe_user_orders')
        .select('*')
        .order('order_date', { ascending: false })

      setOrders(ordersData || [])
    } catch (error) {
      console.error('Error fetching user data:', error)
    }
  }

  // Fetch user data when component mounts and user is available
  useState(() => {
    if (user) {
      fetchUserData()
    }
  })

  if (!user) {
    return (
      <div className="min-h-dvh bg-white relative overflow-hidden">
        <Header />
        <main className="container px-4 md:px-6 py-10 md:py-16 relative">
          <AuroraBg intensity={0.5} />
          
          <div className="max-w-2xl mx-auto text-center">
            <FadeIn>
              <GlassCard>
                <h1 className="text-2xl font-semibold text-foreground mb-4">
                  Sign In Required
                </h1>
                <p className="text-muted-foreground mb-6">
                  Please sign in to access payment options and manage your subscriptions.
                </p>
                <Button asChild className="bg-gradient-to-tr from-[#3A86FF] to-[#1f6fff] text-white hover:opacity-95">
                  <a href="/auth/login">Sign In</a>
                </Button>
              </GlassCard>
            </FadeIn>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-dvh bg-white relative overflow-hidden">
      <Header />
      <main className="container px-4 md:px-6 py-10 md:py-16 relative">
        <AuroraBg intensity={0.5} />
        
        <div className="max-w-4xl mx-auto">
          <FadeIn>
            <div className="text-center mb-8">
              <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-foreground">
                Payment Options
              </h1>
              <p className="text-muted-foreground mt-2">
                Choose from our available products and services
              </p>
            </div>
          </FadeIn>

          {/* Current Subscription Status */}
          {subscription && (
            <FadeIn delay={0.05}>
              <GlassCard className="mb-8">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">Current Subscription</h2>
                    <p className="text-muted-foreground">
                      {PRODUCTS.find(p => p.priceId === subscription.price_id)?.name || 'Unknown Plan'}
                    </p>
                  </div>
                  <Badge 
                    className={
                      subscription.subscription_status === 'active' 
                        ? "bg-green-100 text-green-800 border-green-200"
                        : "bg-yellow-100 text-yellow-800 border-yellow-200"
                    }
                  >
                    {subscription.subscription_status}
                  </Badge>
                </div>
              </GlassCard>
            </FadeIn>
          )}

          {/* Available Products */}
          <FadeIn delay={0.1}>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {PRODUCTS.map((product, index) => (
                <FadeIn key={product.id} delay={0.15 + index * 0.05}>
                  <GlassCard>
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-xl font-semibold text-foreground">{product.name}</h3>
                        <p className="text-muted-foreground mt-1">{product.description}</p>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="text-2xl font-bold text-foreground">
                          $100.00
                        </div>
                        <Badge variant="outline" className="border-slate-300 text-muted-foreground">
                          {product.mode === 'subscription' ? 'Subscription' : 'One-time'}
                        </Badge>
                      </div>

                      <Button
                        onClick={() => handleCheckout(product.priceId, product.mode)}
                        disabled={loading === product.priceId}
                        className="w-full bg-gradient-to-tr from-[#3A86FF] to-[#1f6fff] text-white hover:opacity-95"
                      >
                        {loading === product.priceId ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <CreditCard className="mr-2 h-4 w-4" />
                            {product.mode === 'subscription' ? 'Subscribe' : 'Purchase'}
                          </>
                        )}
                      </Button>
                    </div>
                  </GlassCard>
                </FadeIn>
              ))}
            </div>
          </FadeIn>

          {/* Order History */}
          {orders.length > 0 && (
            <FadeIn delay={0.2}>
              <div className="mt-12">
                <h2 className="text-2xl font-semibold text-foreground mb-6">Order History</h2>
                <GlassCard className="p-0 overflow-hidden">
                  <div className="divide-y divide-slate-200">
                    {orders.map((order) => (
                      <div key={order.order_id} className="p-4 flex items-center justify-between">
                        <div>
                          <div className="font-medium text-foreground">
                            Order #{order.order_id}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {new Date(order.order_date).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium text-foreground">
                            ${(order.amount_total / 100).toFixed(2)}
                          </div>
                          <Badge 
                            variant="outline"
                            className={
                              order.order_status === 'completed'
                                ? "border-green-200 text-green-700"
                                : "border-slate-300 text-muted-foreground"
                            }
                          >
                            {order.order_status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </GlassCard>
              </div>
            </FadeIn>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}