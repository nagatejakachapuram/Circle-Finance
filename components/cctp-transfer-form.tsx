"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { ArrowUpDown, Loader2, Zap, Settings, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { useWallet } from "@/hooks/use-wallet"
import { useTransferTracker } from "@/hooks/use-transfer-tracker"
import { CCTP_V2_NETWORKS, type CCTPV2Network, isFastTransferSupported } from "@/lib/cctp-config"
import { validateCCTPTransfer, calculateTransferTime } from "@/lib/cctp-utils"
import { HOOK_PRESETS, type HookConfig, type HookPreset } from "@/lib/cctp-hooks"
import { GlassCard } from "./glass-card"

const networkOptions = Object.entries(CCTP_V2_NETWORKS).map(([key, config]) => ({
  value: key as CCTPV2Network,
  label: config.name,
  chainId: config.chainId,
}))

export function CCTPTransferForm() {
  const { address, isConnected, connect, switchNetwork, currentNetwork } = useWallet()
  const { createTransfer, executeTransfer, isLoading } = useTransferTracker()

  const [sourceChain, setSourceChain] = useState<CCTPV2Network>("ethereum")
  const [destinationChain, setDestinationChain] = useState<CCTPV2Network>("base")
  const [amount, setAmount] = useState("")
  const [destinationAddress, setDestinationAddress] = useState("")
  const [estimatedTime, setEstimatedTime] = useState("")
  const [error, setError] = useState("")
  const [step, setStep] = useState<"form" | "confirm" | "executing">("form")

  // --- 1. ADD NEW STATE TO MANAGE TRANSFER EXECUTION ---
  const [isExecutingTransfer, setIsExecutingTransfer] = useState(false)

  const [useFastTransfer, setUseFastTransfer] = useState(true)
  const [fastTransferAvailable, setFastTransferAvailable] = useState(false)
  const [fastTransferStatus, setFastTransferStatus] = useState<{
    available: boolean
    maxAmount: string
    estimatedTime: number
    reason?: string
  } | null>(null)
  const [useHooks, setUseHooks] = useState(false)
  const [selectedHookPreset, setSelectedHookPreset] = useState<HookPreset | "">("")
  const [customHook, setCustomHook] = useState<HookConfig | null>(null)
  const [showAdvanced, setShowAdvanced] = useState(false)

  useEffect(() => {
    if (amount && sourceChain && destinationChain) {
      const isSupported = isFastTransferSupported(
        CCTP_V2_NETWORKS[sourceChain].chainId,
        CCTP_V2_NETWORKS[destinationChain].chainId,
        amount,
      )
      setFastTransferAvailable(isSupported)
      if (useFastTransfer && isSupported) {
        setEstimatedTime("30 seconds")
        setFastTransferStatus({
          available: true,
          maxAmount: "1000000",
          estimatedTime: 30,
        })
      } else {
        const time = calculateTransferTime(sourceChain, destinationChain)
        setEstimatedTime(time)
        setFastTransferStatus({
          available: false,
          maxAmount: "1000000",
          estimatedTime: 900,
          reason: isSupported ? "Fast Transfer disabled" : "Amount exceeds Fast Transfer limit",
        })
      }
    }
  }, [amount, sourceChain, destinationChain, useFastTransfer])

  // --- 2. CREATE A useEffect TO REACT TO NETWORK CHANGES ---
  useEffect(() => {
    // This effect runs only when we intend to transfer AND the conditions are right.
    if (!isExecutingTransfer || !address || currentNetwork !== sourceChain) {
      return
    }

    const performTransfer = async () => {
      try {
        const transferOptions = {
          useFastTransfer: useFastTransfer && fastTransferAvailable,
          hookData:
            useHooks && customHook
              ? {
                  target: customHook.target,
                  callData: customHook.callData,
                  gasLimit: customHook.gasLimit,
                }
              : undefined,
        }

        const transferId = await createTransfer(sourceChain, destinationChain, amount, address, destinationAddress)

        await executeTransfer(transferId, address)

        // Reset form on success
        setStep("form")
        setAmount("")
        setDestinationAddress("")
        setEstimatedTime("")
        setUseHooks(false)
        setSelectedHookPreset("")
        setCustomHook(null)
      } catch (err) {
        console.error("[v0] Transfer execution failed:", err)
        const errorMessage = err instanceof Error ? err.message : "Transfer failed"
        // ... (your extensive error message handling) ...
        setError(errorMessage)
        setStep("confirm")
      } finally {
        // IMPORTANT: Reset the execution state regardless of success or failure
        setIsExecutingTransfer(false)
      }
    }

    performTransfer()
  }, [
    isExecutingTransfer,
    currentNetwork,
    address,
    sourceChain,
    amount,
    createTransfer,
    destinationAddress,
    destinationChain,
    executeTransfer,
    fastTransferAvailable,
    useFastTransfer,
    useHooks,
    customHook,
  ])

  const handleSwapChains = () => {
    const temp = sourceChain
    setSourceChain(destinationChain)
    setDestinationChain(temp)
  }

  const handleAmountChange = (value: string) => {
    setAmount(value)
    setError("")
  }

  const handleHookPresetChange = (preset: HookPreset | "") => {
    setSelectedHookPreset(preset)
    if (preset && address) {
      try {
        const hookConfig = HOOK_PRESETS[preset](CCTP_V2_NETWORKS[destinationChain].chainId, amount || "1", address)
        setCustomHook(hookConfig)
      } catch (error) {
        console.error("Failed to create hook preset:", error)
        setCustomHook(null)
      }
    } else {
      setCustomHook(null)
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

  // --- 3. SIMPLIFY THE CLICK HANDLER ---
  const handleExecuteTransfer = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault()
    }

    if (!address) return

    // Set the intent to transfer, which will trigger the useEffect
    setIsExecutingTransfer(true)
    setError("")
    setStep("executing")

    // If the network is wrong, trigger the switch.
    // The useEffect will wait for the `currentNetwork` state to update.
    if (currentNetwork !== sourceChain) {
      console.log("[v0] Switching to source network:", sourceChain)
      await switchNetwork(sourceChain)
    }
  }

  const handleBack = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault()
    }
    setStep("form")
    setError("")
  }

  // ... All the JSX (return statement) remains exactly the same ...
  // No changes are needed for the rendered output.
  if (step === "confirm") {
    return (
      <GlassCard>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Confirm Transfer
            {useFastTransfer && fastTransferAvailable && (
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                <Zap className="w-3 h-3 mr-1" />
                Fast Transfer
              </Badge>
            )}
          </CardTitle>
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
              <span className="font-medium">{CCTP_V2_NETWORKS[sourceChain].name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">To:</span>
              <span className="font-medium">{CCTP_V2_NETWORKS[destinationChain].name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Destination:</span>
              <span className="font-medium font-mono text-sm">
                {destinationAddress.slice(0, 6)}...
                {destinationAddress.slice(-4)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Estimated Time:</span>
              <span className="font-medium flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {estimatedTime}
              </span>
            </div>
            {useFastTransfer && fastTransferAvailable && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Transfer Type:</span>
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  <Zap className="w-3 h-3 mr-1" />
                  Fast Transfer
                </Badge>
              </div>
            )}
            {useHooks && customHook && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Hook:</span>
                <span className="font-medium text-sm">{selectedHookPreset || "Custom Hook"}</span>
              </div>
            )}
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex gap-3">
            <Button variant="outline" onClick={handleBack} className="flex-1 bg-transparent" type="button">
              Back
            </Button>
            <Button
              onClick={handleExecuteTransfer}
              disabled={isLoading}
              className="flex-1 bg-gradient-to-tr from-[#3A86FF] to-[#1f6fff] text-white"
              type="button"
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
              <p className="text-sm text-muted-foreground">
                {useFastTransfer && fastTransferAvailable
                  ? "Fast Transfer in progress - completion in ~30 seconds"
                  : "Please confirm the transaction in your wallet"}
              </p>
            </div>
          </div>
        </CardContent>
      </GlassCard>
    )
  }

  return (
    <GlassCard>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Cross-Chain USDC Transfer
          <Badge variant="outline" className="text-xs">
            V2
          </Badge>
        </CardTitle>
        <CardDescription>Transfer USDC between supported networks using Circle's CCTP V2</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>From Network</Label>
              <Select value={sourceChain} onValueChange={(value: CCTPV2Network) => setSourceChain(value)}>
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
              <Select value={destinationChain} onValueChange={(value: CCTPV2Network) => setDestinationChain(value)}>
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
          {estimatedTime && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground flex items-center gap-1">
                <Clock className="w-4 h-4" />
                Estimated completion: {estimatedTime}
              </span>
              {useFastTransfer && fastTransferAvailable && (
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  <Zap className="w-3 h-3 mr-1" />
                  Fast
                </Badge>
              )}
            </div>
          )}
        </div>

        {amount && (
          <div className="space-y-3 p-4 bg-muted/30 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  Fast Transfer
                </Label>
                <p className="text-xs text-muted-foreground">
                  Complete transfers in ~30 seconds instead of 15+ minutes
                </p>
              </div>
              <Switch
                checked={useFastTransfer}
                onCheckedChange={setUseFastTransfer}
                disabled={!fastTransferAvailable}
              />
            </div>

            {!fastTransferAvailable && fastTransferStatus?.reason && (
              <Alert>
                <AlertDescription className="text-xs">{fastTransferStatus.reason}</AlertDescription>
              </Alert>
            )}
          </div>
        )}

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

        <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="w-full justify-between">
              <span className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Advanced Options
              </span>
              <span className="text-xs">{showAdvanced ? "Hide" : "Show"}</span>
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4 pt-4">
            <Separator />
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Enable Hooks</Label>
                  <p className="text-xs text-muted-foreground">
                    Execute additional actions after minting (e.g., swap, stake)
                  </p>
                </div>
                <Switch checked={useHooks} onCheckedChange={setUseHooks} />
              </div>

              {useHooks && (
                <div className="space-y-3 pl-4 border-l-2 border-muted">
                  <div className="space-y-2">
                    <Label>Hook Preset</Label>
                    <Select value={selectedHookPreset} onValueChange={handleHookPresetChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a hook preset" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="swapToETH">Swap to ETH</SelectItem>
                        <SelectItem value="swapToWBTC">Swap to WBTC</SelectItem>
                        <SelectItem value="stakeInAave">Stake in Aave</SelectItem>
                        <SelectItem value="stakeInCompound">Stake in Compound</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {customHook && (
                    <div className="text-xs space-y-1 p-2 bg-muted/50 rounded">
                      <p>
                        <strong>Hook:</strong> {customHook.description}
                      </p>
                      <p>
                        <strong>Gas Limit:</strong> {customHook.gasLimit.toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </CollapsibleContent>
        </Collapsible>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Button
          onClick={handleValidateAndProceed}
          disabled={!amount || !destinationAddress || isLoading}
          className="w-full bg-gradient-to-tr from-[#3A86FF] to-[#1f6fff] text-white"
          type="button"
        >
          {!isConnected ? "Connect Wallet" : "Review Transfer"}
        </Button>

        <div className="text-xs text-muted-foreground space-y-1">
          <p>• Minimum transfer: 0.01 USDC</p>
          <p>• Fast Transfer available for amounts up to 1M USDC</p>
          <p>• Hooks enable automatic DeFi operations after transfer</p>
          <p>• Gas fees apply on both source and destination networks</p>
          <p>• Transfers are irreversible once confirmed</p>
        </div>
      </CardContent>
    </GlassCard>
  )
}
