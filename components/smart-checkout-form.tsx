"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { AlertCircle, ArrowRight, Clock, Zap, BracketsIcon as Bridge } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { GlassCard } from "./glass-card"
import { FadeIn } from "./motion"
import { useWallet } from "@/hooks/use-wallet"
import { paymentBridgeService } from "@/lib/payment-bridge-service"
import { CCTP_CONFIG } from "@/lib/cctp-config"
import type { Product } from "@/lib/types/product"
import type { BridgePaymentResult } from "@/lib/payment-bridge-service"

interface SmartCheckoutFormProps {
  product: Product
  onSuccess?: (orderId: string) => void
  onCancel?: () => void
}

export function SmartCheckoutForm({ product, onSuccess, onCancel }: SmartCheckoutFormProps) {
  const [quantity, setQuantity] = useState(1)
  const [paymentStrategy, setPaymentStrategy] = useState<BridgePaymentResult | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [currentStep, setCurrentStep] = useState<"analyzing" | "bridge" | "payment" | "complete">("analyzing")

  const { address, chainId, isConnected } = useWallet()
  const totalAmount = (product.price * quantity) / 1e6

  // Analyze payment options when component loads
  useEffect(() => {
    if (address && isConnected) {
      analyzePaymentOptions()
    }
  }, [address, isConnected, product.id, quantity])

  const analyzePaymentOptions = async () => {
    if (!address) return

    setIsAnalyzing(true)
    try {
      const result = await paymentBridgeService.createSmartPaymentIntent({
        productId: product.id,
        customerAddress: address,
        chainId: chainId || product.supportedChains[0],
        quantity,
        preferredPaymentChain: chainId,
      })

      setPaymentStrategy(result)
    } catch (error) {
      console.error("Failed to analyze payment options:", error)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const executePayment = async () => {
    if (!paymentStrategy || !address) return

    setIsProcessing(true)
    setCurrentStep("payment")

    try {
      if (paymentStrategy.suggestedAction === "pay_directly") {
        // Direct payment
        console.log("[v0] Executing direct payment")
        // Implementation would call payment processor directly
        setTimeout(() => {
          setCurrentStep("complete")
          onSuccess?.("direct-payment-order-id")
        }, 2000)
      } else if (paymentStrategy.suggestedAction === "bridge_then_pay" && paymentStrategy.bridgeDetails) {
        // Bridge + payment flow
        setCurrentStep("bridge")
        console.log("[v0] Executing bridge + payment flow")

        const result = await paymentBridgeService.executeBridgePayment(paymentStrategy.bridgeDetails, {
          productId: product.id,
          customerAddress: address,
          chainId: paymentStrategy.bridgeDetails.toChain,
          quantity,
        })

        if (result.success) {
          setCurrentStep("complete")
          onSuccess?.("bridge-payment-order-id")
        } else {
          throw new Error(result.error || "Bridge payment failed")
        }
      }
    } catch (error) {
      console.error("Payment execution failed:", error)
      setCurrentStep("analyzing")
    } finally {
      setIsProcessing(false)
    }
  }

  if (isAnalyzing) {
    return (
      <FadeIn>
        <GlassCard>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold">Analyzing Payment Options</h3>
                <p className="text-muted-foreground">Finding the best way to complete your purchase...</p>
              </div>
            </div>
          </CardContent>
        </GlassCard>
      </FadeIn>
    )
  }

  if (!paymentStrategy) {
    return (
      <FadeIn>
        <GlassCard>
          <CardContent className="pt-6">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>Failed to analyze payment options. Please try again.</AlertDescription>
            </Alert>
          </CardContent>
        </GlassCard>
      </FadeIn>
    )
  }

  return (
    <div className="space-y-6">
      <FadeIn>
        <GlassCard>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Smart Checkout
            </CardTitle>
            <CardDescription>Optimized payment flow with automatic bridging</CardDescription>
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
                <div className="text-2xl font-bold text-blue-600">${totalAmount.toFixed(2)} USDC</div>
                <div className="text-sm text-muted-foreground">Total</div>
              </div>
            </div>

            <Separator />

            {/* Payment Strategy */}
            {paymentStrategy.suggestedAction === "pay_directly" && (
              <div className="rounded-lg bg-green-500/10 border border-green-500/20 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500/20">
                    <Zap className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-green-600">Direct Payment Available</h4>
                    <p className="text-sm text-muted-foreground">You have sufficient USDC balance for direct payment</p>
                  </div>
                </div>
              </div>
            )}

            {paymentStrategy.suggestedAction === "bridge_then_pay" && paymentStrategy.bridgeDetails && (
              <div className="rounded-lg bg-blue-500/10 border border-blue-500/20 p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500/20">
                    <Bridge className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-blue-600">Bridge + Payment Required</h4>
                    <p className="text-sm text-muted-foreground">
                      We'll bridge your USDC and complete the payment automatically
                    </p>
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">From:</span>
                    <Badge variant="outline">{CCTP_CONFIG.chains[paymentStrategy.bridgeDetails.fromChain]?.name}</Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">To:</span>
                    <Badge variant="outline">{CCTP_CONFIG.chains[paymentStrategy.bridgeDetails.toChain]?.name}</Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{paymentStrategy.bridgeDetails.estimatedTime}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">Bridge Fee:</span>
                    <span>
                      ${(Number.parseFloat(paymentStrategy.bridgeDetails.bridgeFee || "0") / 1e18).toFixed(4)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {paymentStrategy.suggestedAction === "insufficient_funds" && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Insufficient USDC balance across all supported networks. Please add funds to continue.
                </AlertDescription>
              </Alert>
            )}

            {/* Processing Steps */}
            {isProcessing && (
              <div className="rounded-lg bg-muted/50 p-4">
                <div className="flex items-center gap-3">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500" />
                  <div>
                    {currentStep === "bridge" && <span>Bridging USDC to target network...</span>}
                    {currentStep === "payment" && <span>Processing payment...</span>}
                    {currentStep === "complete" && <span>Payment completed successfully!</span>}
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button variant="outline" onClick={onCancel} disabled={isProcessing}>
                Cancel
              </Button>
              <Button
                onClick={executePayment}
                disabled={!isConnected || isProcessing || paymentStrategy.suggestedAction === "insufficient_funds"}
                className="flex-1"
              >
                {isProcessing ? (
                  "Processing..."
                ) : paymentStrategy.suggestedAction === "bridge_then_pay" ? (
                  <>
                    Bridge & Pay ${totalAmount.toFixed(2)} USDC
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                ) : (
                  `Pay ${totalAmount.toFixed(2)} USDC`
                )}
              </Button>
            </div>
          </CardContent>
        </GlassCard>
      </FadeIn>
    </div>
  )
}
