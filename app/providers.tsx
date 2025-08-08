"use client"

import { WalletProvider } from "@/components/wallet-context"
import { PortfolioProvider } from "@/components/portfolio-context"

export default function Providers({ children }: { children?: React.ReactNode }) {
  return (
    <WalletProvider>
      <PortfolioProvider>{children}</PortfolioProvider>
    </WalletProvider>
  )
}
