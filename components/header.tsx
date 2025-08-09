"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Wallet, Menu, X } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { useState } from "react"
import { useWallet } from "./wallet-context"
import ScrollProgress from "./scroll-progress"

const nav = [
  { name: "How it Works", href: "/how-it-works" },
  { name: "Explore Estates", href: "/explore" },
  { name: "KYC Verification", href: "/kyc" },
  { name: "Get Started", href: "/get-started" },
  { name: "Docs", href: "#" },
]

export default function Header() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const { connected, connect, disconnect, address } = useWallet()

  return (
    <>
      <ScrollProgress />
      <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/70 backdrop-blur-xl">
        <div className="container px-4 md:px-6 h-16 flex items-center justify-between">
          <Link href="/" aria-label="Circle Pay home" className="inline-flex items-center gap-2">
            <div className="h-8 w-8 rounded-full ring-2 ring-slate-200/80 bg-[conic-gradient(from_180deg_at_50%_50%,#3A86FF_0%,#8ab6ff_40%,#3A86FF_100%)]" />
            <span className="font-semibold tracking-tight text-foreground">{"Circle Pay"}</span>
          </Link>

          <nav className="hidden md:flex items-center gap-1 rounded-full border border-slate-200/80 bg-white/70 backdrop-blur-xl px-1 py-1">
            {nav.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                  pathname === item.href
                    ? "text-foreground bg-slate-100"
                    : "text-muted-foreground hover:text-foreground hover:bg-slate-100"
                }`}
              >
                {item.name}
              </Link>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-2">
            {connected ? (
              <>
                <Button variant="outline" className="border-slate-200 text-foreground hover:bg-slate-100">
                  {address ? `${address.slice(0, 6)}…${address.slice(-4)}` : "Connected"}
                </Button>
                <Button onClick={disconnect} variant="ghost" className="text-muted-foreground hover:text-foreground hover:bg-slate-100">
                  {"Disconnect"}
                </Button>
              </>
            ) : (
              <Button
                onClick={connect}
                className="bg-gradient-to-tr from-[#3A86FF] to-[#1f6fff] text-white shadow-[0_10px_30px_-10px_rgba(58,134,255,0.45)] hover:opacity-95"
              >
                <Wallet className="mr-2 size-4" />
                {"Connect Wallet"}
              </Button>
            )}
          </div>

          <div className="md:hidden">
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" className="text-muted-foreground hover:text-foreground hover:bg-slate-100">
                  <Menu className="size-5" />
                  <span className="sr-only">{"Open menu"}</span>
                </Button>
              </SheetTrigger>
              <SheetContent className="bg-white text-foreground border-slate-200">
                <SheetHeader>
                  <SheetTitle>{"Circle Pay"}</SheetTitle>
                </SheetHeader>
                <div className="mt-6 flex flex-col gap-2">
                  {nav.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className="px-3 py-2 rounded-md text-sm hover:bg-slate-100 text-muted-foreground hover:text-foreground"
                    >
                      {item.name}
                    </Link>
                  ))}
                  <div className="pt-2">
                    {connected ? (
                      <Button onClick={() => setOpen(false)} variant="outline" className="w-full border-slate-200 hover:bg-slate-100">
                        {address ? `${address.slice(0, 6)}…${address.slice(-4)}` : "Connected"}
                      </Button>
                    ) : (
                      <Button
                        onClick={() => {
                          setOpen(false)
                          setTimeout(connect, 120)
                        }}
                        className="w-full bg-gradient-to-tr from-[#3A86FF] to-[#1f6fff] text-white"
                      >
                        <Wallet className="mr-2 size-4" />
                        {"Connect Wallet"}
                      </Button>
                    )}
                  </div>
                </div>
                <Button onClick={() => setOpen(false)} variant="ghost" className="absolute top-2 right-2 hover:bg-slate-100">
                  <X className="size-5" />
                  <span className="sr-only">{"Close menu"}</span>
                </Button>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>
    </>
  )
}
