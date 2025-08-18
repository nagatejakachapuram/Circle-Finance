export type Chain = "Ethereum" | "Base" | "Polygon"
export type Asset = {
  id: string
  symbol: string
  name: string
  chain: Chain
  price: number // USDC
  apy: number
  change24h: number // percent
  liquidity: number // TVL or available
  logo?: string
}

export const ASSETS: Asset[] = [
  {
    id: "soma-loft",
    symbol: "SOMA",
    name: "SoMa Loft Fund",
    chain: "Ethereum",
    price: 120,
    apy: 7.2,
    change24h: 0.8,
    liquidity: 2_450_000,
    logo: "/loft-fund-token-icon.png",
  },
  {
    id: "shoreline-res",
    symbol: "SLR",
    name: "Shoreline Residences",
    chain: "Base",
    price: 85,
    apy: 6.5,
    change24h: -0.4,
    liquidity: 1_320_000,
    logo: "/shoreline-residential-token-icon.png",
  },
  {
    id: "eixample-offices",
    symbol: "EIX",
    name: "Eixample Offices",
    chain: "Polygon",
    price: 140,
    apy: 8.1,
    change24h: 1.3,
    liquidity: 3_020_000,
    logo: "/office-token-icon.png",
  },
  {
    id: "docklands-tower",
    symbol: "DLT",
    name: "Docklands Tower",
    chain: "Ethereum",
    price: 150,
    apy: 6.9,
    change24h: 0.2,
    liquidity: 4_120_000,
    logo: "/tower-token-icon.png",
  },
]
