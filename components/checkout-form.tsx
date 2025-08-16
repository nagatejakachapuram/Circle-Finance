"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { AlertCircle, CreditCard, Loader2, Zap } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { GlassCard } from "./glass-card"
import { FadeIn } from "./motion"
import { useWallet } from "@/hooks/use-wallet"
import { usePayment } from "@/hooks/use-payment"
import { CCTP_CONFIG } from "@/lib/cctp-config"
import type { Product } from "@/lib/types/product"

interface CheckoutFormProps {
  product: Product
  onSuccess?: (orderId: string) => void
  onCancel?: () => void
}

export function CheckoutForm({ product, onSuccess, onCancel }: CheckoutFormProps) {
  const [quantity, setQuantity] = useState(1)
  const [selectedChain, setSelectedChain] = useState<number>(product.supportedChains[0])
  const [isProcessing, setIsProcessing] = useState(false)
  const [paymentStep, setPaymentStep] = useState<"review" | "payment" | "confirming">("review")

  const { address, chainId, switchNetwork, isConnected } = useWallet()
  const { createPaymentIntent, processPayment, isLoading, error } = usePayment()

  const totalAmount = (product.price * quantity) / 1e6
  const supportedChains = product.supportedChains.map((id) => ({
    id,
    name: CCTP_CONFIG.chains[id]?.name || `Chain ${id}`,
  }))

  // Auto-select current chain if supported
  useEffect(() => {
    if (chainId && product.supportedChains.includes(chainId)) {
      setSelectedChain(chainId)
    }
  }, [chainId, product.supportedChains])

  const handlePayment = async () => {
    if (!address || !isConnected) {
      alert("Please connect your wallet first")
      return
    }

    try {
      setIsProcessing(true)
      setPaymentStep("payment")

      // Switch to selected network if needed
      if (chainId !== selectedChain) {
        await switchNetwork(selectedChain)
      }

      // Create payment intent
      const paymentResult = await createPaymentIntent({
        productId: product.id,
        customerAddress: address,
        chainId: selectedChain,
        quantity,
      })

      if (!paymentResult?.paymentIntent) {
        throw new Error("Failed to create payment intent")
      }

      setPaymentStep("confirming")

      // In a real implementation, you would:
      // 1. Show the user the payment details
      // 2. Have them approve the USDC transfer transaction
      // 3. Get the transaction hash
      // 4. Call processPayment with the tx hash

      // For demo purposes, we'll simulate this
      const mockTxHash = `0x${Math.random().toString(16).substr(2, 64)}`

      // Process the payment
      const success = await processPayment(paymentResult.paymentIntent.id, mockTxHash)

      if (success) {
        onSuccess?.(paymentResult.order?.id || "")
      }
    } catch (err) {
      console.error("Payment failed:", err)
    } finally {
      setIsProcessing(false)
      setPaymentStep("review")
    }
  }

  return (
    <div className="space-y-6">
      <FadeIn>
        <GlassCard>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Checkout
            </CardTitle>
            <CardDescription>Complete your purchase with USDC</CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Product Summary */}
            <div className="flex items-start gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20">
                <Zap className="h-6 w-6 text-blue-500" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">{product.name}</h3>
                <p className="text-sm text-muted-foreground">{product.description}</p>
                <Badge className="mt-1">{product.category}</Badge>
              </div>
              <div className="text-right">
                <div className="text-lg font-semibold">${(product.price / 1e6).toFixed(2)} USDC</div>
                <div className="text-sm text-muted-foreground">per item</div>
              </div>
            </div>

            <Separator />

            {/* Order Details */}
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    max="10"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, Number.parseInt(e.target.value) || 1))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="network">Payment Network</Label>
                  <Select
                    value={selectedChain.toString()}
                    onValueChange={(value) => setSelectedChain(Number.parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {supportedChains.map((chain) => (
                        <SelectItem key={chain.id} value={chain.id.toString()}>
                          {chain.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Network Mismatch Warning */}
              {chainId && chainId !== selectedChain && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    You'll need to switch to {CCTP_CONFIG.chains[selectedChain]?.name} to complete this payment.
                  </AlertDescription>
                </Alert>
              )}
            </div>

            <Separator />

            {/* Order Summary */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>
                  Subtotal ({quantity} item{quantity > 1 ? "s" : ""})
                </span>
                <span>${totalAmount.toFixed(2)} USDC</span>
              </div>
              <div className="flex justify-between">
                <span>Network fees</span>
                <span className="text-muted-foreground">Estimated at checkout</span>
              </div>
              <Separator />
              <div className="flex justify-between text-lg font-semibold">
                <span>Total</span>
                <span>${totalAmount.toFixed(2)} USDC</span>
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button variant="outline" onClick={onCancel} disabled={isProcessing}>
                Cancel
              </Button>
              <Button onClick={handlePayment} disabled={!isConnected || isProcessing || isLoading} className="flex-1">
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {paymentStep === "payment" && "Creating Payment..."}
                    {paymentStep === "confirming" && "Confirming Payment..."}
                  </>
                ) : (
                  `Pay ${totalAmount.toFixed(2)} USDC`
                )}
              </Button>
            </div>

            {/* Payment Steps */}
            {paymentStep !== "review" && (
              <div className="rounded-lg bg-muted/50 p-4">
                <div className="flex items-center gap-2 text-sm">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {paymentStep === "payment" && "Setting up payment..."}
                  {paymentStep === "confirming" && "Waiting for blockchain confirmation..."}
                </div>
              </div>
            )}
          </CardContent>
        </GlassCard>
      </FadeIn>
    </div>
  )
}
