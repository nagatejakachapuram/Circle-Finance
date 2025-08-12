"use client"

import { Wallet } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { GlassCard } from "./glass-card"
import { useWallet } from "./wallet-context"

export function WalletGuard({
  children,
  className = "",
  gatedText = "You must connect your wallet to access this content.",
}: {
  children?: React.ReactNode
  className?: string
  gatedText?: string
}) {
  const { connected, connect } = useWallet()
  if (connected) return <div className={className}>{children}</div>
  return (
    <div className={className}>
      <GlassCard>
        <div className="flex items-center justify-between gap-4">
          <p className="text-muted-foreground">{gatedText}</p>
          <Button onClick={connect} className="bg-gradient-to-tr from-[#3A86FF] to-[#1f6fff] text-white hover:opacity-95">
            <Wallet className="mr-2 size-4" />
            {"Connect Wallet"}
          </Button>
        </div>
      </GlassCard>
    </div>
  )
}
