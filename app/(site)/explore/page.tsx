"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { WalletGuard } from "@/components/wallet-guard"
import Header from "@/components/header"
import Footer from "@/components/footer"
import { GlassCard } from "@/components/glass-card"
import { FadeIn } from "@/components/motion"
import AuroraBg from "@/components/aurora-bg"

type Estate = {
  name: string
  region: "NA" | "EU" | "APAC" | "LATAM"
  location: string
  apy: number
  rent: "Monthly" | "Quarterly"
  price: number
  available: boolean
}

const ESTATES: Estate[] = [
  { name: "SoMa Loft Fund", region: "NA", location: "San Francisco, USA", apy: 7.2, rent: "Monthly", price: 120, available: true },
  { name: "Shoreline Residences", region: "NA", location: "Miami, USA", apy: 6.5, rent: "Monthly", price: 85, available: true },
  { name: "Eixample Offices", region: "EU", location: "Barcelona, ES", apy: 8.1, rent: "Quarterly", price: 140, available: false },
  { name: "Docklands Tower", region: "EU", location: "London, UK", apy: 6.9, rent: "Monthly", price: 150, available: true },
  { name: "Shibuya MicroLiving", region: "APAC", location: "Tokyo, JP", apy: 7.8, rent: "Quarterly", price: 110, available: true },
]

export default function ExplorePage() {
  const [query, setQuery] = useState("")
  const [region, setRegion] = useState<string>("all")
  const [sort, setSort] = useState<string>("apy_desc")

  const filtered = useMemo(() => {
    let items = ESTATES.filter((e) =>
      (region === "all" ? true : e.region === region) &&
      (query ? e.name.toLowerCase().includes(query.toLowerCase()) || e.location.toLowerCase().includes(query.toLowerCase()) : true),
    )
    if (sort === "apy_desc") items = items.sort((a, b) => b.apy - a.apy)
    if (sort === "apy_asc") items = items.sort((a, b) => a.apy - b.apy)
    if (sort === "price_asc") items = items.sort((a, b) => a.price - b.price)
    if (sort === "price_desc") items = items.sort((a, b) => b.price - a.price)
    return items
  }, [query, region, sort])

  return (
    <div className="min-h-dvh bg-white relative overflow-hidden">
      <Header />
      <main className="container px-4 md:px-6 py-10 md:py-16 relative">
        <AuroraBg intensity={0.5} />
        <div className="flex flex-col sm:flex-row sm:items-end gap-4 justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-foreground">{"Explore Estates"}</h1>
            <p className="text-muted-foreground mt-2">
              {"Access vetted, tokenized properties. Connect your wallet to view full details and invest."}
            </p>
          </div>
          <div className="flex gap-3">
            <Button asChild className="bg-gradient-to-tr from-[#3A86FF] to-[#1f6fff] text-white hover:opacity-95">
              <Link href="/auth/signup">{"Get Started"}</Link>
            </Button>
            <Button asChild variant="outline" className="border-slate-200 text-foreground hover:bg-slate-100">
              <Link href="/how-it-works">{"How it Works"}</Link>
            </Button>
          </div>
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or location..."
            className="bg-white border-slate-200 text-foreground placeholder:text-muted-foreground"
          />
          <Select value={region} onValueChange={setRegion}>
            <SelectTrigger className="bg-white border-slate-200 text-foreground">
              <SelectValue placeholder="Region" />
            </SelectTrigger>
            <SelectContent className="bg-white text-foreground border-slate-200">
              <SelectItem value="all">{"All regions"}</SelectItem>
              <SelectItem value="NA">{"North America"}</SelectItem>
              <SelectItem value="EU">{"Europe"}</SelectItem>
              <SelectItem value="APAC">{"APAC"}</SelectItem>
              <SelectItem value="LATAM">{"LATAM"}</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sort} onValueChange={setSort}>
            <SelectTrigger className="bg-white border-slate-200 text-foreground">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent className="bg-white text-foreground border-slate-200">
              <SelectItem value="apy_desc">{"APY: High to Low"}</SelectItem>
              <SelectItem value="apy_asc">{"APY: Low to High"}</SelectItem>
              <SelectItem value="price_asc">{"Price: Low to High"}</SelectItem>
              <SelectItem value="price_desc">{"Price: High to Low"}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <WalletGuard className="mt-8" gatedText="Connect your wallet to view availability and invest.">
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((prop, i) => (
              <FadeIn key={prop.name} delay={i * 0.04}>
                <GlassCard className="p-0 overflow-hidden">
                  <div className="p-0">
                    <Image
                      src="/architectural-property-night-cityscape.png"
                      alt={`Property preview for ${prop.name}`}
                      width={640}
                      height={180}
                      className="w-full h-44 object-cover"
                    />
                    <div className="p-5">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-medium text-foreground">{prop.name}</h3>
                        <Badge className="bg-[#3A86FF] text-white hover:bg-[#2f76e8]">{"USDC-Only"}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{prop.location}</p>
                      <div className="mt-4 grid grid-cols-3 gap-2 text-sm">
                        <div className="rounded px-3 py-2 bg-white/70 border border-slate-200">
                          <p className="text-muted-foreground">{"APY"}</p>
                          <p className="font-medium text-foreground">{prop.apy}%</p>
                        </div>
                        <div className="rounded px-3 py-2 bg-white/70 border border-slate-200">
                          <p className="text-muted-foreground">{"Rent"}</p>
                          <p className="font-medium text-foreground">{prop.rent}</p>
                        </div>
                        <div className="rounded px-3 py-2 bg-white/70 border border-slate-200">
                          <p className="text-muted-foreground">{"Token"}</p>
                          <p className="font-medium text-foreground">${prop.price.toFixed(2)}</p>
                        </div>
                      </div>
                      <div className="mt-5 flex items-center gap-3">
                        <Button size="sm" className="bg-gradient-to-tr from-[#3A86FF] to-[#1f6fff] text-white hover:opacity-95" asChild>
                          <Link href="/payments">{"Invest"}</Link>
                        </Button>
                        <Button size="sm" variant="outline" className="border-slate-200 text-foreground hover:bg-slate-100" asChild>
                          <Link href="#">{"Details"}</Link>
                        </Button>
                        {!prop.available && (
                          <Badge variant="outline" className="ml-auto border-slate-300 text-muted-foreground">
                            {"Waitlist"}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </GlassCard>
              </FadeIn>
            ))}
          </div>
        </WalletGuard>
      </main>
      <Footer />
    </div>
  )
}
