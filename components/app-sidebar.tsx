"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Building2, TrendingUp, Landmark, PieChart, Settings, Home, LogOut, ArrowLeftRight } from "lucide-react"
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

const menuItems = [
  {
    title: "Dashboard",
    url: "/app",
    icon: Home,
  },
  {
    title: "CCTP Bridge", // Added CCTP Bridge menu item
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

  return (
    <Sidebar variant="inset">
      <SidebarHeader>
        <Link
          href="/"
          className="flex items-center gap-2 px-4 py-2 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
        >
          <div className="h-8 w-8 rounded-full ring-2 ring-slate-200/80 bg-[conic-gradient(from_180deg_at_50%_50%,#3A86FF_0%,#8ab6ff_40%,#3A86FF_100%)]" />
          <span className="font-semibold tracking-tight text-foreground">Circle Pay</span>
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
