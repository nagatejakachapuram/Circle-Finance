"use client"

import { useState } from "react"
import { ArrowUpDown, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useWallet } from "@/hooks/use-wallet"
import { useTransferTracker } from "@/hooks/use-transfer-tracker"
import { CCTP_NETWORKS, type CCTPNetwork } from "@/lib/cctp-config"
import { validateCCTPTransfer, calculateTransferTime } from "@/lib/cctp-utils"
import { GlassCard } from "./glass-card"

const networkOptions = Object.entries(CCTP_NETWORKS).map(([key, config]) => ({
  value: key as CCTPNetwork,
  label: config.name,
  chainId: config.chainId,
}))

export function CCTPTransferForm() {
  const { address, isConnected, connect, switchNetwork, currentNetwork } = useWallet()
  const { createTransfer, executeTransfer, isLoading } = useTransferTracker()

  const [sourceChain, setSourceChain] = useState<CCTPNetwork>("ethereum")
  const [destinationChain, setDestinationChain] = useState<CCTPNetwork>("base")
  const [amount, setAmount] = useState("")
  const [destinationAddress, setDestinationAddress] = useState("")
  const [estimatedTime, setEstimatedTime] = useState("")
  const [error, setError] = useState("")
  const [step, setStep] = useState<"form" | "confirm" | "executing">("form")

  const handleSwapChains = () => {
    const temp = sourceChain
    setSourceChain(destinationChain)
    setDestinationChain(temp)
  }

  const handleAmountChange = (value: string) => {
    setAmount(value)
    setError("")

    if (value && sourceChain && destinationChain) {
      const time = calculateTransferTime(sourceChain, destinationChain)
      setEstimatedTime(time)
    }
  }

  const handleValidateAndProceed = () => {
    if (!isConnected) {
      connect()
      return
    }

    const validation = validateCCTPTransfer(sourceChain, destinationChain, amount)
    if (!validation.isValid) {
      setError(validation.error || "Invalid transfer")
      return
    }

    if (!destinationAddress) {
      setError("Please enter a destination address")
      return
    }

    setStep("confirm")
  }

  const handleExecuteTransfer = async () => {
    if (!address) return

    try {
      setStep("executing")
      setError("")

      // Switch to source network if needed
      if (currentNetwork !== sourceChain) {
        await switchNetwork(sourceChain)
      }

      // Create and execute transfer
      const transferId = await createTransfer(sourceChain, destinationChain, amount, address, destinationAddress)

      await executeTransfer(transferId, address)

      // Reset form
      setStep("form")
      setAmount("")
      setDestinationAddress("")
      setEstimatedTime("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Transfer failed")
      setStep("confirm")
    }
  }

  const handleBack = () => {
    setStep("form")
    setError("")
  }

  if (step === "confirm") {
    return (
      <GlassCard>
        <CardHeader>
          <CardTitle>Confirm Transfer</CardTitle>
          <CardDescription>Review your cross-chain USDC transfer details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Amount:</span>
              <span className="font-medium">{amount} USDC</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">From:</span>
              <span className="font-medium">{CCTP_NETWORKS[sourceChain].name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">To:</span>
              <span className="font-medium">{CCTP_NETWORKS[destinationChain].name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Destination:</span>
              <span className="font-medium font-mono text-sm">
                {destinationAddress.slice(0, 6)}...{destinationAddress.slice(-4)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Estimated Time:</span>
              <span className="font-medium">{estimatedTime}</span>
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex gap-3">
            <Button variant="outline" onClick={handleBack} className="flex-1 bg-transparent">
              Back
            </Button>
            <Button
              onClick={handleExecuteTransfer}
              disabled={isLoading}
              className="flex-1 bg-gradient-to-tr from-[#3A86FF] to-[#1f6fff] text-white"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Executing...
                </>
              ) : (
                "Confirm Transfer"
              )}
            </Button>
          </div>
        </CardContent>
      </GlassCard>
    )
  }

  if (step === "executing") {
    return (
      <GlassCard>
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-[#3A86FF]" />
            <div>
              <h3 className="font-medium">Executing Transfer</h3>
              <p className="text-sm text-muted-foreground">Please confirm the transaction in your wallet</p>
            </div>
          </div>
        </CardContent>
      </GlassCard>
    )
  }

  return (
    <GlassCard>
      <CardHeader>
        <CardTitle>Cross-Chain USDC Transfer</CardTitle>
        <CardDescription>Transfer USDC between supported networks using Circle's CCTP</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Network Selection */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>From Network</Label>
              <Select value={sourceChain} onValueChange={(value: CCTPNetwork) => setSourceChain(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {networkOptions.map((network) => (
                    <SelectItem key={network.value} value={network.value}>
                      {network.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>To Network</Label>
              <Select value={destinationChain} onValueChange={(value: CCTPNetwork) => setDestinationChain(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {networkOptions.map((network) => (
                    <SelectItem key={network.value} value={network.value}>
                      {network.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-center">
            <Button variant="outline" size="sm" onClick={handleSwapChains} className="rounded-full p-2 bg-transparent">
              <ArrowUpDown className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Amount Input */}
        <div className="space-y-2">
          <Label htmlFor="amount">Amount (USDC)</Label>
          <Input
            id="amount"
            type="number"
            placeholder="0.00"
            value={amount}
            onChange={(e) => handleAmountChange(e.target.value)}
            min="0.01"
            step="0.01"
          />
          {estimatedTime && <p className="text-sm text-muted-foreground">Estimated completion time: {estimatedTime}</p>}
        </div>

        {/* Destination Address */}
        <div className="space-y-2">
          <Label htmlFor="destination">Destination Address</Label>
          <Input
            id="destination"
            placeholder="0x..."
            value={destinationAddress}
            onChange={(e) => setDestinationAddress(e.target.value)}
          />
          <div className="flex items-center gap-2">
            <Button
              variant="link"
              size="sm"
              className="h-auto p-0 text-xs"
              onClick={() => address && setDestinationAddress(address)}
            >
              Use my address
            </Button>
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Action Button */}
        <Button
          onClick={handleValidateAndProceed}
          disabled={!amount || !destinationAddress || isLoading}
          className="w-full bg-gradient-to-tr from-[#3A86FF] to-[#1f6fff] text-white"
        >
          {!isConnected ? "Connect Wallet" : "Review Transfer"}
        </Button>

        {/* Network Info */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p>• Minimum transfer: 0.01 USDC</p>
          <p>• Gas fees apply on both source and destination networks</p>
          <p>• Transfers are irreversible once confirmed</p>
        </div>
      </CardContent>
    </GlassCard>
  )
}
