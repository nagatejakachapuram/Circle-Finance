"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
} from "recharts"
import { TrendingUp, DollarSign, Building2, Landmark, Calendar, CreditCard, Download, Filter } from "lucide-react"

// Mock portfolio data
const portfolioData = [
  { name: "Real Estate", value: 45000, percentage: 45, color: "#3A86FF" },
  { name: "Index Funds", value: 30000, percentage: 30, color: "#8ab6ff" },
  { name: "US Treasuries", value: 25000, percentage: 25, color: "#1f6fff" },
]

const portfolioGrowth = [
  { month: "Jan", value: 85000 },
  { month: "Feb", value: 87500 },
  { month: "Mar", value: 92000 },
  { month: "Apr", value: 89000 },
  { month: "May", value: 95000 },
  { month: "Jun", value: 100000 },
]

const monthlyReturns = [
  { month: "Jan", returns: 2.5 },
  { month: "Feb", returns: 1.8 },
  { month: "Mar", returns: 3.2 },
  { month: "Apr", returns: -1.5 },
  { month: "May", returns: 4.1 },
  { month: "Jun", returns: 2.8 },
]

const transactions = [
  {
    id: 1,
    type: "Real Estate",
    property: "Manhattan Loft Fund",
    amount: 15000,
    tokens: 150,
    date: "2024-01-15",
    paymentMethod: "USDC",
    status: "Completed",
    icon: Building2,
  },
  {
    id: 2,
    type: "Index Fund",
    property: "S&P 500 Token Fund",
    amount: 10000,
    tokens: 200,
    date: "2024-01-10",
    paymentMethod: "ETH",
    status: "Completed",
    icon: TrendingUp,
  },
  {
    id: 3,
    type: "US Treasury",
    property: "10Y Treasury Bond",
    amount: 8000,
    tokens: 80,
    date: "2024-01-05",
    paymentMethod: "USDC",
    status: "Completed",
    icon: Landmark,
  },
  {
    id: 4,
    type: "Real Estate",
    property: "Tokyo MicroLiving",
    amount: 12000,
    tokens: 120,
    date: "2023-12-28",
    paymentMethod: "USDC",
    status: "Completed",
    icon: Building2,
  },
  {
    id: 5,
    type: "Index Fund",
    property: "NASDAQ Tech Fund",
    amount: 7500,
    tokens: 150,
    date: "2023-12-20",
    paymentMethod: "ETH",
    status: "Completed",
    icon: TrendingUp,
  },
]

export default function PortfolioPage() {
  const [timeRange, setTimeRange] = useState("6M")
  const [filterType, setFilterType] = useState("all")

  const totalValue = portfolioData.reduce((sum, item) => sum + item.value, 0)
  const totalGrowth = 8.5 // percentage
  const monthlyIncome = 2850

  const filteredTransactions =
    filterType === "all"
      ? transactions
      : transactions.filter((t) => t.type.toLowerCase().includes(filterType.toLowerCase()))

  return (
    <div className="flex-1 space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <PieChart className="w-8 h-8 text-[#3A86FF]" />
            Portfolio Overview
          </h1>
          <p className="text-muted-foreground mt-1">Track your tokenized investments and performance</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1M">1M</SelectItem>
              <SelectItem value="3M">3M</SelectItem>
              <SelectItem value="6M">6M</SelectItem>
              <SelectItem value="1Y">1Y</SelectItem>
              <SelectItem value="ALL">ALL</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-white to-slate-50 border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Portfolio Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalValue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-green-500" />+{totalGrowth}% from last month
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-white to-slate-50 border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Income</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${monthlyIncome.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">From rent & dividends</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-white to-slate-50 border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Investments</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{transactions.length}</div>
            <p className="text-xs text-muted-foreground">Across 3 asset classes</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-white to-slate-50 border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average APY</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">7.2%</div>
            <p className="text-xs text-muted-foreground">Weighted average</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="bg-gradient-to-br from-white to-slate-50 border-slate-200">
              <CardHeader>
                <CardTitle>Portfolio Allocation</CardTitle>
                <CardDescription>Distribution across asset classes</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={portfolioData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percentage }) => `${name} ${percentage}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {portfolioData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, "Value"]} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-white to-slate-50 border-slate-200">
              <CardHeader>
                <CardTitle>Portfolio Growth</CardTitle>
                <CardDescription>Total value over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={portfolioGrowth}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, "Portfolio Value"]} />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="#3A86FF"
                      strokeWidth={3}
                      dot={{ fill: "#3A86FF", strokeWidth: 2, r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card className="bg-gradient-to-br from-white to-slate-50 border-slate-200">
            <CardHeader>
              <CardTitle>Monthly Returns</CardTitle>
              <CardDescription>Performance breakdown by month</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={monthlyReturns}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`${value}%`, "Returns"]} />
                  <Bar dataKey="returns" fill="#3A86FF" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-4">
          <Card className="bg-gradient-to-br from-white to-slate-50 border-slate-200">
            <CardHeader>
              <CardTitle>Transaction History</CardTitle>
              <CardDescription>Complete record of your investments</CardDescription>
              <div className="flex items-center gap-2 pt-2">
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-48">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Investments</SelectItem>
                    <SelectItem value="real estate">Real Estate</SelectItem>
                    <SelectItem value="index">Index Funds</SelectItem>
                    <SelectItem value="treasury">US Treasuries</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredTransactions.map((transaction) => {
                  const Icon = transaction.icon
                  return (
                    <div
                      key={transaction.id}
                      className="flex items-center justify-between p-4 border rounded-lg bg-white"
                    >
                      <div className="flex items-center gap-4">
                        <div className="p-2 rounded-full bg-[#3A86FF]/10">
                          <Icon className="w-5 h-5 text-[#3A86FF]" />
                        </div>
                        <div>
                          <div className="font-medium">{transaction.property}</div>
                          <div className="text-sm text-muted-foreground flex items-center gap-4">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(transaction.date).toLocaleDateString()}
                            </span>
                            <span className="flex items-center gap-1">
                              <CreditCard className="w-3 h-3" />
                              {transaction.paymentMethod}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">${transaction.amount.toLocaleString()}</div>
                        <div className="text-sm text-muted-foreground">{transaction.tokens} tokens</div>
                        <Badge variant="secondary" className="mt-1">
                          {transaction.status}
                        </Badge>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
