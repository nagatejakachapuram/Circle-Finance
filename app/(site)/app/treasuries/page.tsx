"use client"

import { useMemo, useState } from "react"
import { Landmark, Shield, DollarSign, Calendar, Users, TrendingUp } from "lucide-react"
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

type Treasury = {
  name: string
  maturity: "3M" | "6M" | "1Y" | "2Y" | "5Y" | "10Y" | "30Y"
  yield: number
  price: number
  available: boolean
  tokensAvailable: number
  totalTokens: number
  minimumInvestment: number
  issueDate: string
  maturityDate: string
  couponRate: number
  description: string
  cusip: string
}

const TREASURIES: Treasury[] = [
  {
    name: "3-Month Treasury Bill",
    maturity: "3M",
    yield: 5.2,
    price: 100,
    available: true,
    tokensAvailable: 50000,
    totalTokens: 100000,
    minimumInvestment: 100,
    issueDate: "2024-01-15",
    maturityDate: "2024-04-15",
    couponRate: 0,
    description:
      "Short-term government security with 3-month maturity, backed by the full faith and credit of the US government.",
    cusip: "912796XX1",
  },
  {
    name: "6-Month Treasury Bill",
    maturity: "6M",
    yield: 5.1,
    price: 100,
    available: true,
    tokensAvailable: 35000,
    totalTokens: 75000,
    minimumInvestment: 100,
    issueDate: "2024-01-15",
    maturityDate: "2024-07-15",
    couponRate: 0,
    description: "Medium-term treasury bill offering stable returns with 6-month maturity period.",
    cusip: "912796XX2",
  },
  {
    name: "1-Year Treasury Note",
    maturity: "1Y",
    yield: 4.8,
    price: 100,
    available: true,
    tokensAvailable: 25000,
    totalTokens: 50000,
    minimumInvestment: 100,
    issueDate: "2024-01-15",
    maturityDate: "2025-01-15",
    couponRate: 4.75,
    description: "One-year treasury note with semi-annual coupon payments, ideal for conservative investors.",
    cusip: "912828XX3",
  },
  {
    name: "2-Year Treasury Note",
    maturity: "2Y",
    yield: 4.6,
    price: 100,
    available: true,
    tokensAvailable: 18000,
    totalTokens: 40000,
    minimumInvestment: 100,
    issueDate: "2024-01-15",
    maturityDate: "2026-01-15",
    couponRate: 4.5,
    description: "Two-year treasury note providing steady income with moderate duration risk.",
    cusip: "912828XX4",
  },
  {
    name: "5-Year Treasury Note",
    maturity: "5Y",
    yield: 4.3,
    price: 100,
    available: true,
    tokensAvailable: 12000,
    totalTokens: 30000,
    minimumInvestment: 100,
    issueDate: "2024-01-15",
    maturityDate: "2029-01-15",
    couponRate: 4.25,
    description: "Five-year treasury note offering attractive yields for medium-term investment horizons.",
    cusip: "912828XX5",
  },
  {
    name: "10-Year Treasury Note",
    maturity: "10Y",
    yield: 4.2,
    price: 100,
    available: false,
    tokensAvailable: 0,
    totalTokens: 25000,
    minimumInvestment: 100,
    issueDate: "2024-01-15",
    maturityDate: "2034-01-15",
    couponRate: 4.125,
    description: "Benchmark 10-year treasury note, widely used as a reference for long-term interest rates.",
    cusip: "912828XX6",
  },
  {
    name: "30-Year Treasury Bond",
    maturity: "30Y",
    yield: 4.4,
    price: 100,
    available: true,
    tokensAvailable: 8000,
    totalTokens: 20000,
    minimumInvestment: 100,
    issueDate: "2024-01-15",
    maturityDate: "2054-01-15",
    couponRate: 4.375,
    description: "Long-term treasury bond providing stable income over three decades with highest duration exposure.",
    cusip: "912810XX7",
  },
]

export default function TreasuriesPage() {
  const [query, setQuery] = useState("")
  const [maturity, setMaturity] = useState<string>("all")
  const [sort, setSort] = useState<string>("yield_desc")
  const [selectedTreasury, setSelectedTreasury] = useState<Treasury | null>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showInvestModal, setShowInvestModal] = useState(false)
  const [investmentAmount, setInvestmentAmount] = useState(1)

  const filtered = useMemo(() => {
    let items = TREASURIES.filter(
      (t) =>
        (maturity === "all" ? true : t.maturity === maturity) &&
        (query
          ? t.name.toLowerCase().includes(query.toLowerCase()) || t.maturity.toLowerCase().includes(query.toLowerCase())
          : true),
    )
    if (sort === "yield_desc") items = items.sort((a, b) => b.yield - a.yield)
    if (sort === "yield_asc") items = items.sort((a, b) => a.yield - b.yield)
    if (sort === "maturity_asc")
      items = items.sort((a, b) => {
        const order = ["3M", "6M", "1Y", "2Y", "5Y", "10Y", "30Y"]
        return order.indexOf(a.maturity) - order.indexOf(b.maturity)
      })
    if (sort === "maturity_desc")
      items = items.sort((a, b) => {
        const order = ["3M", "6M", "1Y", "2Y", "5Y", "10Y", "30Y"]
        return order.indexOf(b.maturity) - order.indexOf(a.maturity)
      })
    return items
  }, [query, maturity, sort])

  const handleViewDetails = (treasury: Treasury) => {
    setSelectedTreasury(treasury)
    setShowDetailsModal(true)
  }

  const handleInvestNow = (treasury: Treasury) => {
    setSelectedTreasury(treasury)
    setShowInvestModal(true)
  }

  const totalInvestmentCost = selectedTreasury ? investmentAmount * selectedTreasury.price : 0

  const getMaturityColor = (maturity: string) => {
    if (["3M", "6M"].includes(maturity)) return "bg-green-100 text-green-700"
    if (["1Y", "2Y"].includes(maturity)) return "bg-blue-100 text-blue-700"
    if (["5Y", "10Y"].includes(maturity)) return "bg-yellow-100 text-yellow-700"
    return "bg-purple-100 text-purple-700"
  }

  return (
    <div className="min-h-dvh bg-white relative overflow-hidden flex">
      <div className="border-b border-slate-200 bg-white/80 backdrop-blur-sm sticky top-0 z-50 w-64">
        {/* Sidebar content can be added here */}
      </div>

      <div className="flex-1 space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
              <Landmark className="w-8 h-8 text-[#3A86FF]" />
              US Treasuries
            </h1>
            <p className="text-muted-foreground mt-1">
              US Treasury securities backed by the full faith and credit of the government
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            KYC Verified
          </div>
        </div>

        <main className="container px-4 md:px-6 py-10 md:py-16 relative">
          <AuroraBg intensity={0.3} />

          <div className="flex flex-col sm:flex-row sm:items-end gap-4 justify-between">
            <div>
              <p className="text-muted-foreground mt-2">
                US Treasury securities backed by the full faith and credit of the government
              </p>
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
              placeholder="Search treasuries..."
              className="bg-white border-slate-200 text-foreground placeholder:text-muted-foreground"
            />
            <Select value={maturity} onValueChange={setMaturity}>
              <SelectTrigger className="bg-white border-slate-200 text-foreground">
                <SelectValue placeholder="Maturity" />
              </SelectTrigger>
              <SelectContent className="bg-white text-foreground border-slate-200">
                <SelectItem value="all">All Maturities</SelectItem>
                <SelectItem value="3M">3 Months</SelectItem>
                <SelectItem value="6M">6 Months</SelectItem>
                <SelectItem value="1Y">1 Year</SelectItem>
                <SelectItem value="2Y">2 Years</SelectItem>
                <SelectItem value="5Y">5 Years</SelectItem>
                <SelectItem value="10Y">10 Years</SelectItem>
                <SelectItem value="30Y">30 Years</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sort} onValueChange={setSort}>
              <SelectTrigger className="bg-white border-slate-200 text-foreground">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent className="bg-white text-foreground border-slate-200">
                <SelectItem value="yield_desc">Yield: High to Low</SelectItem>
                <SelectItem value="yield_asc">Yield: Low to High</SelectItem>
                <SelectItem value="maturity_asc">Maturity: Short to Long</SelectItem>
                <SelectItem value="maturity_desc">Maturity: Long to Short</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <WalletGuard className="mt-8" gatedText="Wallet connection required to view treasury details.">
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((treasury, i) => (
                <FadeIn key={treasury.name} delay={i * 0.04}>
                  <GlassCard className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-medium text-foreground">{treasury.name}</h3>
                      <Badge className={getMaturityColor(treasury.maturity)}>{treasury.maturity}</Badge>
                    </div>

                    <div className="flex items-center gap-2 mb-4">
                      <Shield className="w-4 h-4 text-green-600" />
                      <p className="text-sm text-muted-foreground">US Government Backed</p>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-sm mb-4">
                      <div className="rounded px-3 py-2 bg-white/70 border border-slate-200">
                        <p className="text-muted-foreground">Yield</p>
                        <p className="font-medium text-foreground">{treasury.yield}%</p>
                      </div>
                      <div className="rounded px-3 py-2 bg-white/70 border border-slate-200">
                        <p className="text-muted-foreground">Coupon</p>
                        <p className="font-medium text-foreground">{treasury.couponRate}%</p>
                      </div>
                      <div className="rounded px-3 py-2 bg-white/70 border border-slate-200">
                        <p className="text-muted-foreground">Price</p>
                        <p className="font-medium text-foreground">${treasury.price}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Button
                        size="sm"
                        className="bg-gradient-to-tr from-[#3A86FF] to-[#1f6fff] text-white hover:opacity-95"
                        onClick={() => handleInvestNow(treasury)}
                        disabled={!treasury.available}
                      >
                        Invest Now
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-slate-200 text-foreground hover:bg-slate-100 bg-transparent"
                        onClick={() => handleViewDetails(treasury)}
                      >
                        View Details
                      </Button>
                      {!treasury.available && (
                        <Badge variant="outline" className="ml-auto border-slate-300 text-muted-foreground">
                          Waitlist
                        </Badge>
                      )}
                    </div>
                  </GlassCard>
                </FadeIn>
              ))}
            </div>
          </WalletGuard>

          {/* Details Modal */}
          <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
            <DialogContent className="max-w-2xl bg-white border-slate-200">
              <DialogHeader>
                <DialogTitle className="text-xl font-semibold text-foreground">{selectedTreasury?.name}</DialogTitle>
              </DialogHeader>
              {selectedTreasury && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-[#3A86FF]" />
                        <div>
                          <p className="text-sm text-muted-foreground">Maturity</p>
                          <p className="font-medium text-foreground">{selectedTreasury.maturity}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-[#3A86FF]" />
                        <div>
                          <p className="text-sm text-muted-foreground">Yield to Maturity</p>
                          <p className="font-medium text-foreground">{selectedTreasury.yield}%</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-[#3A86FF]" />
                        <div>
                          <p className="text-sm text-muted-foreground">Coupon Rate</p>
                          <p className="font-medium text-foreground">{selectedTreasury.couponRate}%</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-[#3A86FF]" />
                        <div>
                          <p className="text-sm text-muted-foreground">Tokens Available</p>
                          <p className="font-medium text-foreground">
                            {selectedTreasury.tokensAvailable.toLocaleString()} /{" "}
                            {selectedTreasury.totalTokens.toLocaleString()}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-[#3A86FF]" />
                        <div>
                          <p className="text-sm text-muted-foreground">Price per Token</p>
                          <p className="font-medium text-foreground">${selectedTreasury.price} USDC</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-[#3A86FF]" />
                        <div>
                          <p className="text-sm text-muted-foreground">CUSIP</p>
                          <p className="font-medium text-foreground font-mono">{selectedTreasury.cusip}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-lg">
                    <div>
                      <p className="text-sm text-muted-foreground">Issue Date</p>
                      <p className="font-medium text-foreground">{selectedTreasury.issueDate}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Maturity Date</p>
                      <p className="font-medium text-foreground">{selectedTreasury.maturityDate}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Description</p>
                    <p className="text-foreground">{selectedTreasury.description}</p>
                  </div>

                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Shield className="w-4 h-4 text-green-600" />
                      <p className="text-sm font-medium text-green-700">Government Guarantee</p>
                    </div>
                    <p className="text-sm text-green-600">
                      Backed by the full faith and credit of the United States Government
                    </p>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button
                      className="bg-gradient-to-tr from-[#3A86FF] to-[#1f6fff] text-white hover:opacity-95"
                      onClick={() => {
                        setShowDetailsModal(false)
                        handleInvestNow(selectedTreasury)
                      }}
                      disabled={!selectedTreasury.available}
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

          {/* Investment Modal */}
          <Dialog open={showInvestModal} onOpenChange={setShowInvestModal}>
            <DialogContent className="max-w-md bg-white border-slate-200">
              <DialogHeader>
                <DialogTitle className="text-xl font-semibold text-foreground">
                  Invest in {selectedTreasury?.name}
                </DialogTitle>
              </DialogHeader>
              {selectedTreasury && (
                <div className="space-y-6">
                  <div className="p-4 bg-slate-50 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-muted-foreground">Price per Token</span>
                      <span className="font-medium text-foreground">${selectedTreasury.price} USDC</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Available Tokens</span>
                      <span className="font-medium text-foreground">
                        {selectedTreasury.tokensAvailable.toLocaleString()}
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
                      max={selectedTreasury.tokensAvailable}
                      value={investmentAmount}
                      onChange={(e) => setInvestmentAmount(Math.max(1, Number.parseInt(e.target.value) || 1))}
                      className="bg-white border-slate-200 text-foreground"
                    />
                    <p className="text-xs text-muted-foreground">
                      Minimum: ${selectedTreasury.minimumInvestment} USDC • Maximum:{" "}
                      {selectedTreasury.tokensAvailable.toLocaleString()} tokens
                    </p>
                  </div>

                  <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-muted-foreground">Total Investment</span>
                      <span className="text-lg font-semibold text-[#3A86FF]">
                        ${totalInvestmentCost.toFixed(2)} USDC
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm mb-1">
                      <span className="text-muted-foreground">Annual Yield</span>
                      <span className="font-medium text-green-600">
                        ${((totalInvestmentCost * selectedTreasury.yield) / 100).toFixed(2)} USDC
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">Maturity Date</span>
                      <span className="font-medium text-foreground">{selectedTreasury.maturityDate}</span>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button
                      className="flex-1 bg-gradient-to-tr from-[#3A86FF] to-[#1f6fff] text-white hover:opacity-95"
                      onClick={() => {
                        alert(
                          `Investment of ${investmentAmount} tokens (${totalInvestmentCost.toFixed(2)} USDC) initiated!`,
                        )
                        setShowInvestModal(false)
                      }}
                      disabled={totalInvestmentCost < selectedTreasury.minimumInvestment}
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
    </div>
  )
}
