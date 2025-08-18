"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ExternalLink } from "lucide-react"
import { useIsMobile } from "@/components/ui/use-mobile"

interface WalletOption {
  id: string
  name: string
  icon: string
  installed?: boolean
  recent?: boolean
  popular?: boolean
}

const walletOptions: WalletOption[] = [
  {
    id: "metamask",
    name: "MetaMask",
    icon: "🦊",
    popular: true,
    recent: true,
  },
  {
    id: "coinbase",
    name: "Coinbase Wallet",
    icon: "🔵",
    popular: true,
  },
  {
    id: "walletconnect",
    name: "WalletConnect",
    icon: "🔗",
    popular: true,
  },
  {
    id: "rainbow",
    name: "Rainbow",
    icon: "🌈",
    popular: true,
  },
  {
    id: "brave",
    name: "Brave Wallet",
    icon: "🦁",
    installed: true,
  },
  {
    id: "trust",
    name: "Trust Wallet",
    icon: "🛡️",
    popular: true,
  },
]

interface WalletSelectionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onWalletSelect: (walletId: string) => Promise<void>
  isConnecting: boolean
}

export function WalletSelectionModal({ open, onOpenChange, onWalletSelect, isConnecting }: WalletSelectionModalProps) {
  const [selectedWallet, setSelectedWallet] = useState<string | null>(null)
  const isMobile = useIsMobile()

  const handleWalletClick = async (walletId: string) => {
    setSelectedWallet(walletId)
    await onWalletSelect(walletId)
    setSelectedWallet(null)
  }

  const installedWallets = walletOptions.filter((w) => w.installed)
  const popularWallets = walletOptions.filter((w) => w.popular && !w.installed)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md w-[95vw] max-w-[420px] bg-slate-900 border-slate-800 text-white">
        <DialogHeader className="pb-4">
          <DialogTitle className="text-xl font-semibold">Connect a Wallet</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {installedWallets.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-purple-400 mb-3">Installed</h3>
              <div className="space-y-2">
                {installedWallets.map((wallet) => (
                  <Button
                    key={wallet.id}
                    variant="ghost"
                    className={`w-full justify-start ${isMobile ? "h-14" : "h-12"} text-left hover:bg-slate-800 disabled:opacity-50 transition-all`}
                    onClick={() => handleWalletClick(wallet.id)}
                    disabled={isConnecting}
                  >
                    <span className="text-2xl mr-3">{wallet.icon}</span>
                    <span className="text-base font-medium">{wallet.name}</span>
                    {selectedWallet === wallet.id && isConnecting && (
                      <div className="ml-auto">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      </div>
                    )}
                  </Button>
                ))}
              </div>
            </div>
          )}

          <div>
            <h3 className="text-sm font-medium text-slate-400 mb-3">Popular</h3>
            <div className="space-y-2">
              {popularWallets.map((wallet) => (
                <Button
                  key={wallet.id}
                  variant="ghost"
                  className={`w-full justify-start ${isMobile ? "h-14" : "h-12"} text-left hover:bg-slate-800 disabled:opacity-50 transition-all`}
                  onClick={() => handleWalletClick(wallet.id)}
                  disabled={isConnecting}
                >
                  <span className="text-2xl mr-3">{wallet.icon}</span>
                  <div className="flex flex-col items-start">
                    <span className="text-base font-medium">{wallet.name}</span>
                    {wallet.recent && <span className="text-xs text-purple-400">Recent</span>}
                  </div>
                  {selectedWallet === wallet.id && isConnecting && (
                    <div className="ml-auto">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    </div>
                  )}
                </Button>
              ))}
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-800">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-400">New to Ethereum wallets?</span>
            <Button
              variant="link"
              className={`text-purple-400 hover:text-purple-300 p-0 ${isMobile ? "h-auto min-h-[44px]" : "h-auto"}`}
              onClick={() => window.open("https://ethereum.org/wallets/", "_blank")}
            >
              Learn More
              <ExternalLink className="ml-1 h-3 w-3" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
