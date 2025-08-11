"use client"

import { WalletProvider } from "@/components/wallet-context"
import { PortfolioProvider } from "@/components/portfolio-context"
import { AuthProvider } from "@/components/auth-provider"

export default function Providers({ children }: { children?: React.ReactNode }) {
  return (
    <AuthProvider>
      <WalletProvider>
        <PortfolioProvider>{children}</PortfolioProvider>
      </WalletProvider>
    </AuthProvider>
  )
}
