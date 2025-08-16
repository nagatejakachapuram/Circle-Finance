"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, CheckCircle, XCircle, Wallet, ArrowLeftRight } from "lucide-react"
import { useWallet } from "@/components/wallet-context"
import type { CircleResponse } from "@/lib/circle-api"
import { usePayment } from "@/hooks/use-payment"
import { CCTP_CONFIG } from "@/lib/cctp-config"

interface InvestmentModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  asset: {
    name: string
    price: number
    tokensAvailable: number
    minimumInvestment?: number
    apy?: number
  }
  investmentType: "estate" | "index-fund" | "treasury"
  recipientAddress: string
}

export function InvestmentModal({ open, onOpenChange, asset, investmentType, recipientAddress }: InvestmentModalProps) {
  const { address: walletAddress } = useWallet()
  const [tokenAmount, setTokenAmount] = useState(1)
  const [selectedChain, setSelectedChain] = useState<number>(11155111) // Default to Ethereum Sepolia
  const [isProcessing, setIsProcessing] = useState(false)
  const [paymentResult, setPaymentResult] = useState<CircleResponse | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [requiresSignature, setRequiresSignature] = useState(false)

  const { createPaymentIntent, processPayment, estimateGas, checkBalance } = usePayment()

  const totalCost = tokenAmount * asset.price
  const expectedReturn = asset.apy ? (totalCost * asset.apy) / 100 : 0

  // Get available chains for CCTP
  const availableChains = Object.entries(CCTP_CONFIG.chains).map(([chainId, config]) => ({
    id: Number(chainId),
    name: config.name,
    symbol: config.nativeSymbol,
  }))

  const selectedChainInfo = CCTP_CONFIG.chains[selectedChain]

  console.log("[v0] Current selectedChain:", selectedChain)
  console.log("[v0] selectedChainInfo:", selectedChainInfo)
  console.log("[v0] availableChains:", availableChains)

  const handleChainChange = (value: string) => {
    const newChain = Number(value)
    console.log("[v0] Network selection changed from", selectedChain, "to", newChain)
    setSelectedChain(newChain)
  }

  const handleInvestment = async () => {
    if (!walletAddress) {
      setPaymentResult({
        success: false,
        error: "Please connect your wallet first",
      })
      setShowResult(true)
      return
    }

    if (asset.minimumInvestment && totalCost < asset.minimumInvestment) {
      setPaymentResult({
        success: false,
        error: `Minimum investment is $${asset.minimumInvestment} USDC`,
      })
      setShowResult(true)
      return
    }

    setIsProcessing(true)
    setPaymentResult(null)
    setRequiresSignature(true)

    try {
      console.log("[v0] Creating payment intent for multi-chain investment...")

      const paymentIntent = await createPaymentIntent({
        amount: totalCost,
        chainId: selectedChain,
        recipientAddress,
        metadata: {
          investmentType,
          assetName: asset.name,
          tokenAmount,
        },
      })

      if (!paymentIntent.success) {
        throw new Error(paymentIntent.error || "Failed to create payment intent")
      }

      console.log("[v0] Processing payment on chain:", selectedChain)

      const result = await processPayment({
        paymentIntentId: paymentIntent.data!.id,
        chainId: selectedChain,
        fromAddress: walletAddress,
        toAddress: recipientAddress,
        amount: totalCost,
      })

      if (result.requiresWalletSignature && result.transactionData) {
        console.log("[v0] Requesting wallet transaction approval...")

        // Request wallet to send the transaction
        const txHash = await (window as any).ethereum.request({
          method: "eth_sendTransaction",
          params: [
            {
              from: walletAddress,
              to: result.transactionData.to,
              data: result.transactionData.data,
              value: result.transactionData.value,
              gas: result.transactionData.gasLimit,
            },
          ],
        })

        console.log("[v0] Transaction approved by user:", txHash)

        setPaymentResult({
          success: true,
          txHash: txHash,
          data: {
            walletId: walletAddress,
            recipientAddress,
            amount: totalCost,
            currency: "USDC",
            chainId: selectedChain,
            timestamp: new Date().toISOString(),
          },
        })
      } else {
        setPaymentResult(result)
      }

      setShowResult(true)
      setRequiresSignature(false)

      if (result.success || result.requiresWalletSignature) {
        // Reset form on success
        setTimeout(() => {
          setTokenAmount(1)
          setShowResult(false)
          onOpenChange(false)
        }, 3000)
      }
    } catch (error: any) {
      console.error("[v0] Investment transaction failed:", error)

      let errorMessage = `Payment failed. Please ensure you have sufficient USDC balance on ${CCTP_CONFIG.chains[selectedChain]?.name || "selected network"}.`

      if (error.code === 4001) {
        errorMessage = "Transaction was rejected by user."
      } else if (error.code === -32603) {
        errorMessage = "Insufficient USDC balance or gas fees."
      } else if (error.message?.includes("insufficient funds")) {
        errorMessage = "Insufficient USDC balance to complete this transaction."
      }

      setPaymentResult({
        success: false,
        error: errorMessage,
      })
      setShowResult(true)
      setRequiresSignature(false)
    } finally {
      setIsProcessing(false)
    }
  }

  const resetModal = () => {
    setShowResult(false)
    setPaymentResult(null)
    setTokenAmount(1)
    setRequiresSignature(false)
  }

  if (requiresSignature && isProcessing) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md bg-white border-slate-200">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wallet className="w-5 h-5 text-[#3A86FF]" />
              Wallet Signature Required
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <Alert className="border-blue-200 bg-blue-50">
              <Wallet className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                Please check your wallet and sign the transaction to transfer {totalCost.toFixed(2)} USDC for your
                investment in {asset.name}.
              </AlertDescription>
            </Alert>

            <div className="p-4 bg-slate-50 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-muted-foreground">Amount</span>
                <span className="font-medium">{totalCost.toFixed(2)} USDC</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-muted-foreground">Network</span>
                <span className="font-medium">{CCTP_CONFIG.chains[selectedChain]?.name || "Unknown"}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Tokens</span>
                <span className="font-medium">
                  {tokenAmount} {asset.name}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-8 w-8 animate-spin text-[#3A86FF]" />
            </div>

            <p className="text-sm text-center text-muted-foreground">Waiting for wallet signature...</p>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  if (showResult && paymentResult) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md bg-white border-slate-200">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {paymentResult.success ? (
                <>
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  Investment Successful
                </>
              ) : (
                <>
                  <XCircle className="w-5 h-5 text-red-600" />
                  Investment Failed
                </>
              )}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {paymentResult.success ? (
              <div className="space-y-3">
                <Alert className="border-green-200 bg-green-50">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    Your investment of {tokenAmount} tokens ({totalCost.toFixed(2)} USDC) in {asset.name} has been
                    processed successfully on {CCTP_CONFIG.chains[selectedChain]?.name}!
                  </AlertDescription>
                </Alert>

                {(paymentResult.data?.txHash || paymentResult.txHash) && (
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <p className="text-sm text-muted-foreground">Transaction Hash:</p>
                    <p className="font-mono text-xs break-all">{paymentResult.data?.txHash || paymentResult.txHash}</p>
                  </div>
                )}
              </div>
            ) : (
              <Alert className="border-red-200 bg-red-50">
                <XCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  {paymentResult.error ||
                    `Payment processing failed. Please ensure you have sufficient USDC balance on ${CCTP_CONFIG.chains[selectedChain]?.name}.`}
                </AlertDescription>
              </Alert>
            )}

            <div className="flex gap-3">
              {paymentResult.success ? (
                <Button
                  className="flex-1 bg-gradient-to-tr from-[#3A86FF] to-[#1f6fff] text-white"
                  onClick={() => onOpenChange(false)}
                >
                  Done
                </Button>
              ) : (
                <>
                  <Button
                    className="flex-1 bg-gradient-to-tr from-[#3A86FF] to-[#1f6fff] text-white"
                    onClick={resetModal}
                  >
                    Try Again
                  </Button>
                  <Button variant="outline" onClick={() => onOpenChange(false)}>
                    Cancel
                  </Button>
                </>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-white border-slate-200">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-foreground">Invest in {asset.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="p-4 bg-slate-50 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-muted-foreground">Price per Token</span>
              <span className="font-medium text-foreground">${asset.price.toFixed(2)} USDC</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Available Tokens</span>
              <span className="font-medium text-foreground">{asset.tokensAvailable.toLocaleString()}</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="chain-select" className="text-sm font-medium text-foreground">
              Payment Network
            </Label>
            <Select value={selectedChain.toString()} onValueChange={handleChainChange}>
              <SelectTrigger className="bg-white border-slate-200 text-foreground">
                <SelectValue placeholder="Select network" />
              </SelectTrigger>
              <SelectContent className="bg-white text-foreground border-slate-200">
                {availableChains.map((chain) => (
                  <SelectItem key={chain.id} value={chain.id.toString()}>
                    <div className="flex items-center gap-2">
                      <ArrowLeftRight className="w-4 h-4" />
                      {chain.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Choose the blockchain network to pay from. CCTP enables cross-chain USDC payments.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="token-amount" className="text-sm font-medium text-foreground">
              Number of Tokens
            </Label>
            <Input
              id="token-amount"
              type="number"
              min="1"
              max={asset.tokensAvailable}
              value={tokenAmount}
              onChange={(e) => setTokenAmount(Math.max(1, Number.parseInt(e.target.value) || 1))}
              className="bg-white border-slate-200 text-foreground"
              disabled={isProcessing}
            />
            <p className="text-xs text-muted-foreground">
              {asset.minimumInvestment && `Minimum: $${asset.minimumInvestment} USDC • `}
              Maximum: {asset.tokensAvailable.toLocaleString()} tokens
            </p>
          </div>

          <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-muted-foreground">Total Investment</span>
              <span className="text-lg font-semibold text-[#3A86FF]">${totalCost.toFixed(2)} USDC</span>
            </div>
            {expectedReturn > 0 && (
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Expected Annual Return</span>
                <span className="font-medium text-green-600">${expectedReturn.toFixed(2)} USDC</span>
              </div>
            )}
          </div>

          {!walletAddress && (
            <Alert className="border-yellow-200 bg-yellow-50">
              <AlertDescription className="text-yellow-800">
                Please connect your wallet to proceed with the investment.
              </AlertDescription>
            </Alert>
          )}

          <Alert className="border-blue-200 bg-blue-50">
            <Wallet className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              Ensure you have sufficient USDC balance on {selectedChainInfo?.name || "selected network"} to complete
              this transaction.
            </AlertDescription>
          </Alert>

          <div className="flex gap-3 pt-4">
            <Button
              className="flex-1 bg-gradient-to-tr from-[#3A86FF] to-[#1f6fff] text-white hover:opacity-95"
              onClick={handleInvestment}
              disabled={
                isProcessing || !walletAddress || (asset.minimumInvestment && totalCost < asset.minimumInvestment)
              }
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing Payment...
                </>
              ) : (
                "Proceed to Payment"
              )}
            </Button>
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isProcessing}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
