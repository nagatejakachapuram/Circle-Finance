"use client"

import type React from "react"

import { WalletProvider, useWallet } from "@/components/wallet-context"
import { PortfolioProvider } from "@/components/portfolio-context"
import { WalletSelectionModal } from "@/components/wallet-selection-modal"

function WalletModalProvider({ children }: { children: React.ReactNode }) {
  const { showWalletModal, setShowWalletModal, connectWallet, isConnecting } = useWallet()

  return (
    <>
      {children}
      <WalletSelectionModal
        open={showWalletModal}
        onOpenChange={setShowWalletModal}
        onWalletSelect={connectWallet}
        isConnecting={isConnecting}
      />
    </>
  )
}

export default function Providers({ children }: { children?: React.ReactNode }) {
  return (
    <WalletProvider>
      <PortfolioProvider>
        <WalletModalProvider>{children}</WalletModalProvider>
      </PortfolioProvider>
    </WalletProvider>
  )
}
