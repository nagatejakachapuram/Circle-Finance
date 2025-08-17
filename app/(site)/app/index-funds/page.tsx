"use client"

import { useMemo, useState } from "react"
import { TrendingUp, BarChart3, DollarSign, Calendar, Users, Target } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { WalletGuard } from "@/components/wallet-guard"
import { GlassCard } from "@/components/glass-card"
import { FadeIn } from "@/components/motion"
import { InvestmentModal } from "@/components/investment-modal"

type IndexFund = {
  name: string
  category: "Tech" | "Healthcare" | "Energy" | "Finance" | "Diversified"
  apy: number
  risk: "Low" | "Medium" | "High"
  price: number
  available: boolean
  tokensAvailable: number
  totalTokens: number
  managementFee: number
  minimumInvestment: number
  description: string
  topHoldings: string[]
  inceptionDate: string
}

const INDEX_FUNDS: IndexFund[] = [
  {
    name: "Tech Growth Index",
    category: "Tech",
    apy: 12.4,
    risk: "High",
    price: 250,
    available: true,
    tokensAvailable: 5000,
    totalTokens: 20000,
    managementFee: 0.75,
    minimumInvestment: 1000,
    description: "Diversified portfolio of leading technology companies with high growth potential.",
    topHoldings: ["Apple Inc.", "Microsoft Corp.", "Alphabet Inc.", "Amazon.com Inc.", "Tesla Inc."],
    inceptionDate: "2023-01-15",
  },
  {
    name: "Healthcare Innovation",
    category: "Healthcare",
    apy: 9.8,
    risk: "Medium",
    price: 180,
    available: true,
    tokensAvailable: 3200,
    totalTokens: 15000,
    managementFee: 0.65,
    minimumInvestment: 500,
    description: "Focus on pharmaceutical, biotech, and medical device companies driving healthcare innovation.",
    topHoldings: ["Johnson & Johnson", "Pfizer Inc.", "UnitedHealth Group", "Moderna Inc.", "Merck & Co."],
    inceptionDate: "2023-03-20",
  },
  {
    name: "Clean Energy Future",
    category: "Energy",
    apy: 11.2,
    risk: "High",
    price: 220,
    available: true,
    tokensAvailable: 2800,
    totalTokens: 12000,
    managementFee: 0.85,
    minimumInvestment: 750,
    description: "Renewable energy and clean technology companies leading the energy transition.",
    topHoldings: ["NextEra Energy", "Enphase Energy", "First Solar", "Vestas Wind Systems", "Tesla Energy"],
    inceptionDate: "2023-02-10",
  },
  {
    name: "Global Diversified",
    category: "Diversified",
    apy: 8.5,
    risk: "Low",
    price: 150,
    available: true,
    tokensAvailable: 8500,
    totalTokens: 25000,
    managementFee: 0.45,
    minimumInvestment: 250,
    description: "Broad market exposure across sectors and geographies for stable long-term growth.",
    topHoldings: ["S&P 500 ETF", "FTSE Developed Markets", "Emerging Markets ETF", "Bond Index", "REIT Index"],
    inceptionDate: "2022-12-01",
  },
  {
    name: "Financial Services Plus",
    category: "Finance",
    apy: 10.1,
    risk: "Medium",
    price: 195,
    available: false,
    tokensAvailable: 0,
    totalTokens: 10000,
    managementFee: 0.7,
    minimumInvestment: 500,
    description: "Traditional and fintech companies reshaping the financial services landscape.",
    topHoldings: ["JPMorgan Chase", "Bank of America", "PayPal Holdings", "Square Inc.", "Visa Inc."],
    inceptionDate: "2023-04-05",
  },
]

export default function IndexFundsPage() {
  const [query, setQuery] = useState("")
  const [category, setCategory] = useState<string>("all")
  const [sort, setSort] = useState<string>("apy_desc")
  const [selectedFund, setSelectedFund] = useState<IndexFund | null>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showInvestModal, setShowInvestModal] = useState(false)
  const [investmentAmount, setInvestmentAmount] = useState(1)

  const filtered = useMemo(() => {
    let items = INDEX_FUNDS.filter(
      (f) =>
        (category === "all" ? true : f.category === category) &&
        (query
          ? f.name.toLowerCase().includes(query.toLowerCase()) || f.category.toLowerCase().includes(query.toLowerCase())
          : true),
    )
    if (sort === "apy_desc") items = items.sort((a, b) => b.apy - a.apy)
    if (sort === "apy_asc") items = items.sort((a, b) => a.apy - b.apy)
    if (sort === "price_asc") items = items.sort((a, b) => a.price - b.price)
    if (sort === "price_desc") items = items.sort((a, b) => b.price - a.price)
    return items
  }, [query, category, sort])

  const handleViewDetails = (fund: IndexFund) => {
    setSelectedFund(fund)
    setShowDetailsModal(true)
  }

  const handleInvestNow = (fund: IndexFund) => {
    setSelectedFund(fund)
    setShowInvestModal(true)
  }

  const totalInvestmentCost = selectedFund ? investmentAmount * selectedFund.price : 0

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "Low":
        return "bg-green-100 text-green-700"
      case "Medium":
        return "bg-yellow-100 text-yellow-700"
      case "High":
        return "bg-red-100 text-red-700"
      default:
        return "bg-slate-100 text-slate-700"
    }
  }

  return (
    <div className="min-h-dvh bg-white relative overflow-hidden flex-1 space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <TrendingUp className="w-8 h-8 text-[#3A86FF]" />
            Tokenized Index Funds
          </h1>
          <p className="text-muted-foreground mt-1">Professional-grade index funds tokenized for verified investors</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          KYC Verified
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search funds..."
          className="bg-white border-slate-200 text-foreground placeholder:text-muted-foreground"
        />
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="bg-white border-slate-200 text-foreground">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent className="bg-white text-foreground border-slate-200">
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="Tech">Technology</SelectItem>
            <SelectItem value="Healthcare">Healthcare</SelectItem>
            <SelectItem value="Energy">Energy</SelectItem>
            <SelectItem value="Finance">Finance</SelectItem>
            <SelectItem value="Diversified">Diversified</SelectItem>
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

      <WalletGuard className="mt-8" gatedText="Wallet connection required to view fund details.">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((fund, i) => (
            <FadeIn key={fund.name} delay={i * 0.04}>
              <GlassCard className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-foreground">{fund.name}</h3>
                  <Badge className={getRiskColor(fund.risk)}>{fund.risk} Risk</Badge>
                </div>

                <p className="text-sm text-muted-foreground mb-4">
                  {fund.category} • Since {fund.inceptionDate}
                </p>

                <div className="grid grid-cols-3 gap-2 text-sm mb-4">
                  <div className="rounded px-3 py-2 bg-white/70 border border-slate-200">
                    <p className="text-muted-foreground">APY</p>
                    <p className="font-medium text-foreground">{fund.apy}%</p>
                  </div>
                  <div className="rounded px-3 py-2 bg-white/70 border border-slate-200">
                    <p className="text-muted-foreground">Fee</p>
                    <p className="font-medium text-foreground">{fund.managementFee}%</p>
                  </div>
                  <div className="rounded px-3 py-2 bg-white/70 border border-slate-200">
                    <p className="text-muted-foreground">Token</p>
                    <p className="font-medium text-foreground">${fund.price}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Button
                    size="sm"
                    className="bg-gradient-to-tr from-[#3A86FF] to-[#1f6fff] text-white hover:opacity-95 min-h-[44px] px-4 text-sm font-medium"
                    onClick={() => handleInvestNow(fund)}
                    disabled={!fund.available}
                  >
                    Invest Now
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-slate-200 text-foreground hover:bg-slate-100 bg-transparent min-h-[44px] px-4 text-sm font-medium"
                    onClick={() => handleViewDetails(fund)}
                  >
                    View Details
                  </Button>
                  {!fund.available && (
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
            <DialogTitle className="text-xl font-semibold text-foreground">{selectedFund?.name}</DialogTitle>
          </DialogHeader>
          {selectedFund && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-[#3A86FF]" />
                    <div>
                      <p className="text-sm text-muted-foreground">Category</p>
                      <p className="font-medium text-foreground">{selectedFund.category}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-[#3A86FF]" />
                    <div>
                      <p className="text-sm text-muted-foreground">Risk Level</p>
                      <Badge className={getRiskColor(selectedFund.risk)}>{selectedFund.risk} Risk</Badge>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-[#3A86FF]" />
                    <div>
                      <p className="text-sm text-muted-foreground">Inception Date</p>
                      <p className="font-medium text-foreground">{selectedFund.inceptionDate}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-[#3A86FF]" />
                    <div>
                      <p className="text-sm text-muted-foreground">Tokens Available</p>
                      <p className="font-medium text-foreground">
                        {selectedFund.tokensAvailable.toLocaleString()} / {selectedFund.totalTokens.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-[#3A86FF]" />
                    <div>
                      <p className="text-sm text-muted-foreground">Price per Token</p>
                      <p className="font-medium text-foreground">${selectedFund.price} USDC</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-[#3A86FF]" />
                    <div>
                      <p className="text-sm text-muted-foreground">Expected APY</p>
                      <p className="font-medium text-foreground">{selectedFund.apy}%</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">Management Fee</p>
                  <p className="font-medium text-foreground">{selectedFund.managementFee}% annually</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Minimum Investment</p>
                  <p className="font-medium text-foreground">${selectedFund.minimumInvestment} USDC</p>
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-2">Top Holdings</p>
                <div className="space-y-1">
                  {selectedFund.topHoldings.map((holding, index) => (
                    <div key={holding} className="flex justify-between text-sm">
                      <span className="text-foreground">{holding}</span>
                      <span className="text-muted-foreground">{20 - index * 3}%</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-2">Description</p>
                <p className="text-foreground">{selectedFund.description}</p>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  className="bg-gradient-to-tr from-[#3A86FF] to-[#1f6fff] text-white hover:opacity-95"
                  onClick={() => {
                    setShowDetailsModal(false)
                    handleInvestNow(selectedFund)
                  }}
                  disabled={!selectedFund.available}
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
      <InvestmentModal
        open={showInvestModal}
        onOpenChange={setShowInvestModal}
        asset={selectedFund || INDEX_FUNDS[0]}
        investmentType="index-fund"
        recipientAddress="0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6" // Replace with your treasury address
      />
    </div>
  )
}