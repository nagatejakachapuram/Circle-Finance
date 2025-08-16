"use client"

import { useState } from "react"
import { ChevronDown, Filter, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useTransferTracker } from "@/hooks/use-transfer-tracker"
import { formatTimeAgo } from "@/lib/utils"
import { CCTP_NETWORKS } from "@/lib/cctp-config"
import { GlassCard } from "./glass-card"
import { TransferStatusCard } from "./transfer-status-card"

export function TransferHistory() {
  const { transfers } = useTransferTracker()
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [selectedTransfer, setSelectedTransfer] = useState<string | null>(null)

  const filteredTransfers = transfers.filter((transfer) => {
    const matchesSearch =
      transfer.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transfer.sourceChain.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transfer.destinationChain.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === "all" || transfer.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case "minted":
        return "bg-green-100 text-green-700"
      case "failed":
        return "bg-red-100 text-red-700"
      case "attested":
        return "bg-blue-100 text-blue-700"
      case "burned":
        return "bg-yellow-100 text-yellow-700"
      default:
        return "bg-gray-100 text-gray-700"
    }
  }

  if (selectedTransfer) {
    return (
      <div className="space-y-4">
        <Button
          variant="ghost"
          onClick={() => setSelectedTransfer(null)}
          className="text-muted-foreground hover:text-foreground"
        >
          ← Back to History
        </Button>
        <TransferStatusCard transferId={selectedTransfer} />
      </div>
    )
  }

  return (
    <GlassCard>
      <CardHeader>
        <CardTitle>Transfer History</CardTitle>
        <CardDescription>View and manage your cross-chain USDC transfers</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search transfers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="burned">Burned</SelectItem>
              <SelectItem value="attested">Attested</SelectItem>
              <SelectItem value="minted">Completed</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Transfer List */}
        <div className="space-y-3">
          {filteredTransfers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {transfers.length === 0 ? "No transfers yet" : "No transfers match your filters"}
            </div>
          ) : (
            filteredTransfers.map((transfer) => (
              <Card
                key={transfer.id}
                className="cursor-pointer hover:bg-slate-50 transition-colors"
                onClick={() => setSelectedTransfer(transfer.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{transfer.amount} USDC</span>
                        <Badge className={getStatusColor(transfer.status)}>{transfer.status}</Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {CCTP_NETWORKS[transfer.sourceChain].name} → {CCTP_NETWORKS[transfer.destinationChain].name}
                      </div>
                      <div className="text-xs text-muted-foreground">{formatTimeAgo(transfer.createdAt)}</div>
                    </div>
                    <ChevronDown className="h-4 w-4 text-muted-foreground rotate-[-90deg]" />
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </CardContent>
    </GlassCard>
  )
}
