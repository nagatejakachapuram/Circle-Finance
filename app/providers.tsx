"use client"

import { WalletProvider } from "@/components/wallet-context"

export default function Providers({ children }: { children?: React.ReactNode }) {
  return <WalletProvider>{children}</WalletProvider>
}
