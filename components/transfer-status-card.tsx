"use client"

import { useState } from "react"
import { CheckCircle2, Clock, AlertCircle, ExternalLink, Copy, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { useTransfer } from "@/hooks/use-transfer-tracker"
import { useWallet } from "@/hooks/use-wallet"
import { formatTransferProgress, formatTimeAgo, getExplorerUrl } from "@/lib/utils"
import { CCTP_NETWORKS } from "@/lib/cctp-config"
import { GlassCard } from "./glass-card"

interface TransferStatusCardProps {
  transferId: string
  onMintComplete?: () => void
}

export function TransferStatusCard({ transferId, onMintComplete }: TransferStatusCardProps) {
  const { transfer, refreshTransfer } = useTransfer(transferId)
  const { address, switchNetwork } = useWallet()
  const [isMinting, setIsMinting] = useState(false)

  if (!transfer) {
    return (
      <GlassCard>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">Transfer not found</div>
        </CardContent>
      </GlassCard>
    )
  }

  const { label, progress } = formatTransferProgress(transfer.status)
  const sourceNetwork = CCTP_NETWORKS[transfer.sourceChain]
  const destinationNetwork = CCTP_NETWORKS[transfer.destinationChain]

  const getStatusColor = (status: string) => {
    switch (status) {
      case "minted":
        return "bg-green-100 text-green-700"
      case "failed":
        return "bg-red-100 text-red-700"
      case "attested":
        return "bg-blue-100 text-blue-700"
      default:
        return "bg-yellow-100 text-yellow-700"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "minted":
        return <CheckCircle2 className="h-4 w-4" />
      case "failed":
        return <AlertCircle className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const handleMint = async () => {
    if (!address) return

    try {
      setIsMinting(true)
      // Switch to destination network
      await switchNetwork(transfer.destinationChain)

      // Execute mint (this would be handled by the transfer tracker)
      // await completeMint(transferId, address)

      onMintComplete?.()
    } catch (error) {
      console.error("Mint failed:", error)
    } finally {
      setIsMinting(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  return (
    <GlassCard>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Transfer Status</CardTitle>
            <CardDescription>
              {transfer.amount} USDC • {sourceNetwork.name} → {destinationNetwork.name}
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={refreshTransfer}
            className="text-muted-foreground hover:text-foreground"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Status Badge and Progress */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Badge className={getStatusColor(transfer.status)}>
              {getStatusIcon(transfer.status)}
              <span className="ml-1">{label}</span>
            </Badge>
            <span className="text-sm text-muted-foreground">{formatTimeAgo(transfer.updatedAt)}</span>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </div>

        {/* Transfer Details */}
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Transfer ID:</span>
            <div className="flex items-center gap-2">
              <span className="font-mono">{transfer.id.slice(0, 8)}...</span>
              <Button variant="ghost" size="sm" className="h-auto p-1" onClick={() => copyToClipboard(transfer.id)}>
                <Copy className="h-3 w-3" />
              </Button>
            </div>
          </div>

          {transfer.burnTxHash && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Burn Tx:</span>
              <div className="flex items-center gap-2">
                <span className="font-mono">{transfer.burnTxHash.slice(0, 8)}...</span>
                <Button variant="ghost" size="sm" className="h-auto p-1" asChild>
                  <a
                    href={getExplorerUrl(sourceNetwork.chainId, transfer.burnTxHash)}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </Button>
              </div>
            </div>
          )}

          {transfer.mintTxHash && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Mint Tx:</span>
              <div className="flex items-center gap-2">
                <span className="font-mono">{transfer.mintTxHash.slice(0, 8)}...</span>
                <Button variant="ghost" size="sm" className="h-auto p-1" asChild>
                  <a
                    href={getExplorerUrl(destinationNetwork.chainId, transfer.mintTxHash)}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </Button>
              </div>
            </div>
          )}

          {transfer.messageHash && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Message Hash:</span>
              <div className="flex items-center gap-2">
                <span className="font-mono">{transfer.messageHash.slice(0, 8)}...</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-1"
                  onClick={() => copyToClipboard(transfer.messageHash!)}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Action Button */}
        {transfer.status === "attested" && (
          <Button
            onClick={handleMint}
            disabled={isMinting}
            className="w-full bg-gradient-to-tr from-[#3A86FF] to-[#1f6fff] text-white"
          >
            {isMinting ? "Minting..." : "Complete Transfer (Mint)"}
          </Button>
        )}

        {transfer.status === "failed" && transfer.lastError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700 font-medium">Error</p>
            <p className="text-xs text-red-600 mt-1">{transfer.lastError}</p>
          </div>
        )}
      </CardContent>
    </GlassCard>
  )
}
