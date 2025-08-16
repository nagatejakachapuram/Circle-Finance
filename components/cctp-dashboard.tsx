"use client"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useTransferStats } from "@/hooks/use-transfer-tracker"
import { useAttestationHealth } from "@/hooks/use-attestation"
import { CCTPTransferForm } from "./cctp-transfer-form"
import { TransferHistory } from "./transfer-history"
import { GlassCard } from "./glass-card"
import { FadeIn } from "./motion"

export function CCTPDashboard() {
  const stats = useTransferStats()
  const { health } = useAttestationHealth()

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <FadeIn>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <GlassCard>
            <CardHeader className="pb-2">
              <CardDescription>Total Transfers</CardDescription>
              <CardTitle className="text-2xl">{stats.total}</CardTitle>
            </CardHeader>
          </GlassCard>

          <GlassCard>
            <CardHeader className="pb-2">
              <CardDescription>Completed</CardDescription>
              <CardTitle className="text-2xl text-green-600">{stats.completed}</CardTitle>
            </CardHeader>
          </GlassCard>

          <GlassCard>
            <CardHeader className="pb-2">
              <CardDescription>Active</CardDescription>
              <CardTitle className="text-2xl text-blue-600">{stats.pending}</CardTitle>
            </CardHeader>
          </GlassCard>

          <GlassCard>
            <CardHeader className="pb-2">
              <CardDescription>Total Volume</CardDescription>
              <CardTitle className="text-2xl">{stats.totalVolume} USDC</CardTitle>
            </CardHeader>
          </GlassCard>
        </div>
      </FadeIn>

      {/* Service Health */}
      {health && (
        <FadeIn delay={0.1}>
          <GlassCard>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      health.status === "healthy"
                        ? "bg-green-500"
                        : health.status === "degraded"
                          ? "bg-yellow-500"
                          : "bg-red-500"
                    }`}
                  />
                  <span className="text-sm font-medium">Circle Attestation Service: {health.status}</span>
                </div>
                {health.latency && <span className="text-sm text-muted-foreground">{health.latency}ms</span>}
              </div>
            </CardContent>
          </GlassCard>
        </FadeIn>
      )}

      {/* Main Content */}
      <FadeIn delay={0.2}>
        <Tabs defaultValue="transfer" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="transfer">New Transfer</TabsTrigger>
            <TabsTrigger value="history">Transfer History</TabsTrigger>
          </TabsList>

          <TabsContent value="transfer" className="space-y-6">
            <CCTPTransferForm />
          </TabsContent>

          <TabsContent value="history" className="space-y-6">
            <TransferHistory />
          </TabsContent>
        </Tabs>
      </FadeIn>
    </div>
  )
}
