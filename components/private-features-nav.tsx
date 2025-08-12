"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Building2, TrendingUp, Landmark, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useWallet } from "@/components/wallet-context"

const FEATURES = [
  {
    name: "Estates",
    href: "/app/explore",
    icon: Building2,
  },
  {
    name: "Index Funds",
    href: "/app/index-funds",
    icon: TrendingUp,
  },
  {
    name: "US Treasuries",
    href: "/app/treasuries",
    icon: Landmark,
  },
]

export function PrivateFeaturesNav() {
  const pathname = usePathname()
  const { disconnect, address } = useWallet()

  return (
    <div className="border-b border-slate-200 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="container px-4 md:px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 overflow-x-auto">
            {FEATURES.map((feature) => {
              const Icon = feature.icon
              const isActive = pathname === feature.href

              return (
                <Button
                  key={feature.name}
                  variant="ghost"
                  size="sm"
                  asChild
                  className={cn(
                    "flex items-center gap-2 whitespace-nowrap transition-colors font-semibold",
                    isActive
                      ? "bg-[#3A86FF]/10 text-[#3A86FF] hover:bg-[#3A86FF]/20 font-bold"
                      : "text-slate-700 hover:text-[#3A86FF] hover:bg-slate-100",
                  )}
                >
                  <Link href={feature.href}>
                    <Icon className="w-4 h-4" />
                    {feature.name}
                  </Link>
                </Button>
              )
            })}
          </div>

          {address && (
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="font-medium">
                  {address.slice(0, 6)}...{address.slice(-4)}
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={disconnect}
                className="flex items-center gap-2 border-slate-200 text-slate-700 hover:text-red-600 hover:border-red-200 hover:bg-red-50 bg-transparent"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Disconnect</span>
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
