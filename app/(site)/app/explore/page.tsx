"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { ArrowLeft, Building, MapPin, DollarSign, Calendar, Users, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { WalletGuard } from "@/components/wallet-guard"
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
  tokensAvailable: number
  totalTokens: number
  rentPerAnnum: number
  maintenanceFee: number
  propertyType: string
  yearBuilt: number
  description: string
}

const ESTATES: Estate[] = [
  {
    name: "SoMa Loft Fund",
    region: "NA",
    location: "San Francisco, USA",
    apy: 7.2,
    rent: "Monthly",
    price: 120,
    available: true,
    tokensAvailable: 2500,
    totalTokens: 10000,
    rentPerAnnum: 8640,
    maintenanceFee: 240,
    propertyType: "Luxury Loft Complex",
    yearBuilt: 2019,
    description:
      "Premium loft complex in the heart of San Francisco's SoMa district, featuring modern amenities and high-end finishes.",
  },
  {
    name: "Shoreline Residences",
    region: "NA",
    location: "Miami, USA",
    apy: 6.5,
    rent: "Monthly",
    price: 85,
    available: true,
    tokensAvailable: 3200,
    totalTokens: 8000,
    rentPerAnnum: 5525,
    maintenanceFee: 180,
    propertyType: "Beachfront Condos",
    yearBuilt: 2021,
    description: "Stunning beachfront residential complex with ocean views and resort-style amenities in Miami Beach.",
  },
  {
    name: "Eixample Offices",
    region: "EU",
    location: "Barcelona, ES",
    apy: 8.1,
    rent: "Quarterly",
    price: 140,
    available: false,
    tokensAvailable: 0,
    totalTokens: 5000,
    rentPerAnnum: 11340,
    maintenanceFee: 320,
    propertyType: "Commercial Office",
    yearBuilt: 2018,
    description: "Modern office building in Barcelona's prestigious Eixample district, fully leased to tech companies.",
  },
  {
    name: "Docklands Tower",
    region: "EU",
    location: "London, UK",
    apy: 6.9,
    rent: "Monthly",
    price: 150,
    available: true,
    tokensAvailable: 1800,
    totalTokens: 12000,
    rentPerAnnum: 10350,
    maintenanceFee: 400,
    propertyType: "Mixed-Use Tower",
    yearBuilt: 2020,
    description: "Premium mixed-use development in London's Canary Wharf, combining residential and commercial spaces.",
  },
  {
    name: "Shibuya MicroLiving",
    region: "APAC",
    location: "Tokyo, JP",
    apy: 7.8,
    rent: "Quarterly",
    price: 110,
    available: true,
    tokensAvailable: 4100,
    totalTokens: 6000,
    rentPerAnnum: 8580,
    maintenanceFee: 280,
    propertyType: "Micro-Living Units",
    yearBuilt: 2022,
    description:
      "Innovative micro-living concept in Tokyo's vibrant Shibuya district, designed for young professionals.",
  },
]

export default function AppExplorePage() {
  const [query, setQuery] = useState("")
  const [region, setRegion] = useState<string>("all")
  const [sort, setSort] = useState<string>("apy_desc")
  const [selectedProperty, setSelectedProperty] = useState<Estate | null>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showInvestModal, setShowInvestModal] = useState(false)
  const [investmentAmount, setInvestmentAmount] = useState(1)

  const filtered = useMemo(() => {
    let items = ESTATES.filter(
      (e) =>
        (region === "all" ? true : e.region === region) &&
        (query
          ? e.name.toLowerCase().includes(query.toLowerCase()) || e.location.toLowerCase().includes(query.toLowerCase())
          : true),
    )
    if (sort === "apy_desc") items = items.sort((a, b) => b.apy - a.apy)
    if (sort === "apy_asc") items = items.sort((a, b) => a.apy - b.apy)
    if (sort === "price_asc") items = items.sort((a, b) => a.price - b.price)
    if (sort === "price_desc") items = items.sort((a, b) => b.price - a.price)
    return items
  }, [query, region, sort])

  const handleViewDetails = (property: Estate) => {
    setSelectedProperty(property)
    setShowDetailsModal(true)
  }

  const handleInvestNow = (property: Estate) => {
    setSelectedProperty(property)
    setShowInvestModal(true)
  }

  const totalInvestmentCost = selectedProperty ? investmentAmount * selectedProperty.price : 0

  return (
    <div className="min-h-dvh bg-white relative overflow-hidden">
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container px-4 md:px-6 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild className="text-foreground hover:bg-slate-100">
              <Link href="/app">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to App
              </Link>
            </Button>
            <div className="flex items-center gap-2">
              <Building className="w-5 h-5 text-[#3A86FF]" />
              <h1 className="text-lg font-semibold text-foreground">Explore Estates</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="container px-4 md:px-6 py-10 md:py-16 relative">
        <AuroraBg intensity={0.3} />

        <div className="flex flex-col sm:flex-row sm:items-end gap-4 justify-between">
          <div>
            <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-foreground">
              Investment Opportunities
            </h2>
            <p className="text-muted-foreground mt-2">Vetted, tokenized properties available for verified investors</p>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            KYC Verified
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
              <SelectItem value="all">All regions</SelectItem>
              <SelectItem value="NA">North America</SelectItem>
              <SelectItem value="EU">Europe</SelectItem>
              <SelectItem value="APAC">APAC</SelectItem>
              <SelectItem value="LATAM">LATAM</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sort} onValueChange={setSort}>
            <SelectTrigger className="bg-white border-slate-200 text-foreground">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent className="bg-white text-foreground border-slate-200">
              <SelectItem value="apy_desc">APY: High to Low</SelectItem>
              <SelectItem value="apy_asc">APY: Low to High</SelectItem>
              <SelectItem value="price_asc">Price: Low to High</SelectItem>
              <SelectItem value="price_desc">Price: High to Low</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <WalletGuard className="mt-8" gatedText="Wallet connection required to view investment details.">
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
                        <Badge className="bg-[#3A86FF] text-white hover:bg-[#2f76e8]">USDC-Only</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{prop.location}</p>
                      <div className="mt-4 grid grid-cols-3 gap-2 text-sm">
                        <div className="rounded px-3 py-2 bg-white/70 border border-slate-200">
                          <p className="text-muted-foreground">APY</p>
                          <p className="font-medium text-foreground">{prop.apy}%</p>
                        </div>
                        <div className="rounded px-3 py-2 bg-white/70 border border-slate-200">
                          <p className="text-muted-foreground">Rent</p>
                          <p className="font-medium text-foreground">{prop.rent}</p>
                        </div>
                        <div className="rounded px-3 py-2 bg-white/70 border border-slate-200">
                          <p className="text-muted-foreground">Token</p>
                          <p className="font-medium text-foreground">${prop.price.toFixed(2)}</p>
                        </div>
                      </div>
                      <div className="mt-5 flex items-center gap-3">
                        <Button
                          size="sm"
                          className="bg-gradient-to-tr from-[#3A86FF] to-[#1f6fff] text-white hover:opacity-95"
                          onClick={() => handleInvestNow(prop)}
                          disabled={!prop.available}
                        >
                          Invest Now
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-slate-200 text-foreground hover:bg-slate-100 bg-transparent"
                          onClick={() => handleViewDetails(prop)}
                        >
                          View Details
                        </Button>
                        {!prop.available && (
                          <Badge variant="outline" className="ml-auto border-slate-300 text-muted-foreground">
                            Waitlist
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

        <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
          <DialogContent className="max-w-2xl bg-white border-slate-200">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold text-foreground">{selectedProperty?.name}</DialogTitle>
            </DialogHeader>
            {selectedProperty && (
              <div className="space-y-6">
                <Image
                  src="/architectural-property-night-cityscape.png"
                  alt={selectedProperty.name}
                  width={640}
                  height={240}
                  className="w-full h-60 object-cover rounded-lg"
                />

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-[#3A86FF]" />
                      <div>
                        <p className="text-sm text-muted-foreground">Location</p>
                        <p className="font-medium text-foreground">{selectedProperty.location}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Building className="w-4 h-4 text-[#3A86FF]" />
                      <div>
                        <p className="text-sm text-muted-foreground">Property Type</p>
                        <p className="font-medium text-foreground">{selectedProperty.propertyType}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-[#3A86FF]" />
                      <div>
                        <p className="text-sm text-muted-foreground">Year Built</p>
                        <p className="font-medium text-foreground">{selectedProperty.yearBuilt}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-[#3A86FF]" />
                      <div>
                        <p className="text-sm text-muted-foreground">Tokens Available</p>
                        <p className="font-medium text-foreground">
                          {selectedProperty.tokensAvailable.toLocaleString()} /{" "}
                          {selectedProperty.totalTokens.toLocaleString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-[#3A86FF]" />
                      <div>
                        <p className="text-sm text-muted-foreground">Price per Token</p>
                        <p className="font-medium text-foreground">${selectedProperty.price.toFixed(2)} USDC</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-[#3A86FF]" />
                      <div>
                        <p className="text-sm text-muted-foreground">Expected APY</p>
                        <p className="font-medium text-foreground">{selectedProperty.apy}%</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-lg">
                  <div>
                    <p className="text-sm text-muted-foreground">Rent per Annum</p>
                    <p className="font-medium text-foreground">
                      ${selectedProperty.rentPerAnnum.toLocaleString()} USDC
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Maintenance Fee</p>
                    <p className="font-medium text-foreground">
                      ${selectedProperty.maintenanceFee.toLocaleString()} USDC
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-2">Description</p>
                  <p className="text-foreground">{selectedProperty.description}</p>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    className="bg-gradient-to-tr from-[#3A86FF] to-[#1f6fff] text-white hover:opacity-95"
                    onClick={() => {
                      setShowDetailsModal(false)
                      handleInvestNow(selectedProperty)
                    }}
                    disabled={!selectedProperty.available}
                  >
                    Invest Now
                  </Button>
                  <Button variant="outline" onClick={() => setShowDetailsModal(false)}>
                    Close
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        <Dialog open={showInvestModal} onOpenChange={setShowInvestModal}>
          <DialogContent className="max-w-md bg-white border-slate-200">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold text-foreground">
                Invest in {selectedProperty?.name}
              </DialogTitle>
            </DialogHeader>
            {selectedProperty && (
              <div className="space-y-6">
                <div className="p-4 bg-slate-50 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-muted-foreground">Price per Token</span>
                    <span className="font-medium text-foreground">${selectedProperty.price.toFixed(2)} USDC</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Available Tokens</span>
                    <span className="font-medium text-foreground">
                      {selectedProperty.tokensAvailable.toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="investment-amount" className="text-sm font-medium text-foreground">
                    Number of Tokens
                  </Label>
                  <Input
                    id="investment-amount"
                    type="number"
                    min="1"
                    max={selectedProperty.tokensAvailable}
                    value={investmentAmount}
                    onChange={(e) => setInvestmentAmount(Math.max(1, Number.parseInt(e.target.value) || 1))}
                    className="bg-white border-slate-200 text-foreground"
                  />
                  <p className="text-xs text-muted-foreground">
                    Maximum: {selectedProperty.tokensAvailable.toLocaleString()} tokens
                  </p>
                </div>

                <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-muted-foreground">Total Investment</span>
                    <span className="text-lg font-semibold text-[#3A86FF]">${totalInvestmentCost.toFixed(2)} USDC</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Expected Annual Return</span>
                    <span className="font-medium text-green-600">
                      ${((totalInvestmentCost * selectedProperty.apy) / 100).toFixed(2)} USDC
                    </span>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    className="flex-1 bg-gradient-to-tr from-[#3A86FF] to-[#1f6fff] text-white hover:opacity-95"
                    onClick={() => {
                      // Here you would integrate with payment processing
                      alert(
                        `Investment of ${investmentAmount} tokens (${totalInvestmentCost.toFixed(2)} USDC) initiated!`,
                      )
                      setShowInvestModal(false)
                    }}
                  >
                    Proceed to Payment
                  </Button>
                  <Button variant="outline" onClick={() => setShowInvestModal(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </main>
    </div>
  )
}
