"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Building2, TrendingUp, Landmark, PieChart, Settings, Home, LogOut, ArrowLeftRight, Loader2, Fingerprint, AlertTriangle } from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { useWallet } from "@/components/wallet-context"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

const menuItems = [
  {
    title: "Dashboard",
    url: "/app",
    icon: Home,
  },
  {
    title: "CCTP V2 Bridge",
    url: "/app/cctp",
    icon: ArrowLeftRight,
  },
  {
    title: "Estates",
    url: "/app/explore",
    icon: Building2,
  },
  {
    title: "Index Funds",
    url: "/app/index-funds",
    icon: TrendingUp,
  },
  {
    title: "US Treasuries",
    url: "/app/treasuries",
    icon: Landmark,
  },
  {
    title: "Portfolio",
    url: "/app/portfolio",
    icon: PieChart,
  },
  {
    title: "Settings",
    url: "/app/settings",
    icon: Settings,
  },
]

export function AppSidebar() {
  const pathname = usePathname()
  const { disconnect, address } = useWallet()

  // --- START: State and Effect for fetching identity ---
  const [identityAddress, setIdentityAddress] = useState<string | null>(null)
  const [isCheckingIdentity, setIsCheckingIdentity] = useState(true)

  useEffect(() => {
    const checkIdentity = async () => {
      if (!address) {
        setIsCheckingIdentity(false)
        setIdentityAddress(null)
        return
      }

      setIsCheckingIdentity(true)
      try {
        const response = await fetch(`${API_BASE_URL}/identity/${address}`);
        if (!response.ok) {
          throw new Error("Failed to fetch identity status")
        }
        const data = await response.json()
        const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000"

        if (data.identityAddress && data.identityAddress !== ZERO_ADDRESS) {
          setIdentityAddress(data.identityAddress)
        } else {
          setIdentityAddress(null)
        }
      } catch (error) {
        console.error("Error fetching identity:", error)
        setIdentityAddress(null)
      } finally {
        setIsCheckingIdentity(false)
      }
    }

    checkIdentity()
  }, [address]) // Re-run this effect whenever the connected address changes
  // --- END: State and Effect for fetching identity ---

  return (
    <Sidebar variant="inset">
      <SidebarHeader>
        <Link
          href="/"
          className="flex items-center gap-2 px-4 py-2 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
        >
          <div className="h-8 w-8 rounded-full ring-2 ring-slate-200/80 bg-[conic-gradient(from_180deg_at_50%_50%,#3A86FF_0%,#8ab6ff_40%,#3A86FF_100%)]" />
          <span className="font-semibold tracking-tight text-foreground">CircleX Finance</span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={pathname === item.url}>
                    <Link href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        {address && (
          <div className="p-4 border-t">
            {/* --- START: Identity Status Section --- */}
            <div className="mb-4 pb-4 border-b">
              {isCheckingIdentity ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground animate-pulse">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Checking Identity...</span>
                </div>
              ) : identityAddress ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Fingerprint className="w-4 h-4 text-blue-500" />
                  <span className="font-medium text-foreground">
                    OnchainID: {identityAddress.slice(0, 6)}...{identityAddress.slice(-4)}
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-sm text-amber-600">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="font-medium">Identity Not Verified</span>
                </div>
              )}
            </div>
            {/* --- END: Identity Status Section --- */}

            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="font-medium">
                {address.slice(0, 6)}...{address.slice(-4)}
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={disconnect}
              className="w-full flex items-center gap-2 border-slate-200 text-slate-700 hover:text-red-600 hover:border-red-200 hover:bg-red-50 bg-transparent"
            >
              <LogOut className="w-4 h-4" />
              Disconnect
            </Button>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  )
}
