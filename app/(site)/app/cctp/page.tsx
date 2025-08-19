"use client"

import { CCTPDashboard } from "@/components/cctp-dashboard"
import { WalletGuard } from "@/components/wallet-guard"

export default function CCTPPage() {
  return (
    <WalletGuard>
      <div className="flex-1 space-y-6 p-6">
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 -z-10"
          style={{
            background:
              "radial-gradient(1200px 800px at 50% 0%, rgba(58,134,255,0.08), transparent 60%), radial-gradient(900px 600px at 100% 0%, rgba(58,134,255,0.12), transparent 60%), #ffffff",
          }}
        />

        <div className="text-center mb-8">
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-semibold tracking-tight text-foreground mb-4">
            Cross-Chain USDC Transfers
          </h1>
          <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto">
            Transfer USDC seamlessly between supported networks using Circle's Cross-Chain Transfer Protocol
          </p>
        </div>

        <CCTPDashboard />
      </div>
    </WalletGuard>
  )
}
