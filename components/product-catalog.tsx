"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Search, ShoppingCart, Zap } from "lucide-react"
import { GlassCard } from "./glass-card"
import { FadeIn } from "./motion"
import { useWallet } from "@/hooks/use-wallet"
import { CCTP_CONFIG } from "@/lib/cctp-config"
import type { Product } from "@/lib/types/product"

interface ProductCatalogProps {
  onProductSelect?: (product: Product) => void
}

export function ProductCatalog({ onProductSelect }: ProductCatalogProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [selectedChain, setSelectedChain] = useState<string>("all")
  const [isLoading, setIsLoading] = useState(true)
  const { chainId } = useWallet()

  // Fetch products
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch("/api/products?active=true")
        const data = await response.json()
        if (data.success) {
          setProducts(data.products)
          setFilteredProducts(data.products)
        }
      } catch (error) {
        console.error("Failed to fetch products:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchProducts()
  }, [])

  // Filter products
  useEffect(() => {
    let filtered = products

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (product) =>
          product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.description.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    // Filter by category
    if (selectedCategory !== "all") {
      filtered = filtered.filter((product) => product.category === selectedCategory)
    }

    // Filter by chain
    if (selectedChain !== "all") {
      const chainIdNum = Number.parseInt(selectedChain)
      filtered = filtered.filter((product) => product.supportedChains.includes(chainIdNum))
    }

    setFilteredProducts(filtered)
  }, [products, searchTerm, selectedCategory, selectedChain])

  const categories = Array.from(new Set(products.map((p) => p.category)))
  const supportedChains = Object.entries(CCTP_CONFIG.chains).map(([chainId, config]) => ({
    id: chainId,
    name: config.name,
  }))

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <GlassCard key={i}>
              <div className="animate-pulse">
                <div className="h-32 bg-muted rounded-t-lg" />
                <CardHeader>
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </CardHeader>
              </div>
            </GlassCard>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <FadeIn>
        <GlassCard>
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedChain} onValueChange={setSelectedChain}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Network" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Networks</SelectItem>
                  {supportedChains.map((chain) => (
                    <SelectItem key={chain.id} value={chain.id}>
                      {chain.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </GlassCard>
      </FadeIn>

      {/* Products Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredProducts.map((product, index) => (
          <FadeIn key={product.id} delay={index * 0.1}>
            <ProductCard product={product} onSelect={onProductSelect} currentChain={chainId} />
          </FadeIn>
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <FadeIn>
          <GlassCard>
            <CardContent className="pt-6 text-center">
              <div className="flex flex-col items-center gap-2">
                <ShoppingCart className="h-12 w-12 text-muted-foreground" />
                <h3 className="text-lg font-semibold">No products found</h3>
                <p className="text-muted-foreground">Try adjusting your search or filters</p>
              </div>
            </CardContent>
          </GlassCard>
        </FadeIn>
      )}
    </div>
  )
}

interface ProductCardProps {
  product: Product
  onSelect?: (product: Product) => void
  currentChain?: number
}

function ProductCard({ product, onSelect, currentChain }: ProductCardProps) {
  const isAvailableOnCurrentChain = currentChain ? product.supportedChains.includes(currentChain) : true
  const priceInUSDC = product.price / 1e6

  return (
    <GlassCard className="group cursor-pointer transition-all hover:scale-105">
      <div className="relative">
        {product.image ? (
          <img
            src={product.image || "/placeholder.svg"}
            alt={product.name}
            className="h-32 w-full rounded-t-lg object-cover"
          />
        ) : (
          <div className="flex h-32 items-center justify-center rounded-t-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20">
            <Zap className="h-8 w-8 text-blue-500" />
          </div>
        )}
        <Badge className="absolute right-2 top-2" variant={isAvailableOnCurrentChain ? "default" : "secondary"}>
          {product.category}
        </Badge>
      </div>

      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg">{product.name}</CardTitle>
            <CardDescription className="mt-1 line-clamp-2">{product.description}</CardDescription>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          <div className="text-2xl font-bold text-blue-600">${priceInUSDC} USDC</div>
          <Button
            onClick={() => onSelect?.(product)}
            disabled={!isAvailableOnCurrentChain}
            className="group-hover:bg-blue-600 group-hover:text-white"
          >
            {isAvailableOnCurrentChain ? "Buy Now" : "Switch Network"}
          </Button>
        </div>

        {/* Supported Chains */}
        <div className="flex flex-wrap gap-1 pt-2">
          {product.supportedChains.map((chainId) => {
            const chainConfig = CCTP_CONFIG.chains[chainId]
            return (
              <Badge key={chainId} variant={chainId === currentChain ? "default" : "outline"} className="text-xs">
                {chainConfig?.name || `Chain ${chainId}`}
              </Badge>
            )
          })}
        </div>
      </CardHeader>
    </GlassCard>
  )
}
