// CCTP supported networks and contract addresses
export const CCTP_NETWORKS = {
  ethereum: {
    chainId: 1,
    name: "Ethereum",
    rpcUrl: "https://eth-mainnet.g.alchemy.com/v2/your-api-key",
    tokenMessenger: "0xBd3fa81B58Ba92a82136038B25aDec7066af3155",
    messageTransmitter: "0x0a992d191DEeC32aFe36203Ad87D7d289a738F81",
    usdcAddress: "0xA0b86a33E6441b8C4505B4afDcA7FBf074d9eCE4",
    domain: 0,
    explorer: "https://etherscan.io",
  },
  base: {
    chainId: 8453,
    name: "Base",
    rpcUrl: "https://mainnet.base.org",
    tokenMessenger: "0x1682Ae6375C4E4A97e4B583BC394c861A46D8962",
    messageTransmitter: "0xAD09780d193884d503182aD4588450C416D6F9D4",
    usdcAddress: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    domain: 6,
    explorer: "https://basescan.org",
  },
  arbitrum: {
    chainId: 42161,
    name: "Arbitrum One",
    rpcUrl: "https://arb1.arbitrum.io/rpc",
    tokenMessenger: "0x19330d10D9Cc8751218eaf51E8885D058642E08A",
    messageTransmitter: "0xC30362313FBBA5cf9163F0bb16a0e01f01A896ca",
    usdcAddress: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
    domain: 3,
    explorer: "https://arbiscan.io",
  },
  polygon: {
    chainId: 137,
    name: "Polygon",
    rpcUrl: "https://polygon-rpc.com",
    tokenMessenger: "0x9daF8c91AEFAE50b9c0E69629D3F6Ca40cA3B3FE",
    messageTransmitter: "0xF3be9355363857F3e001be68856A2f96b4C39Ba9",
    usdcAddress: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174",
    domain: 7,
    explorer: "https://polygonscan.com",
  },
} as const

export type CCTPNetwork = keyof typeof CCTP_NETWORKS
export type NetworkConfig = (typeof CCTP_NETWORKS)[CCTPNetwork]

export const SUPPORTED_CHAINS = Object.values(CCTP_NETWORKS).map((network) => ({
  id: network.chainId,
  name: network.name,
  network: Object.keys(CCTP_NETWORKS).find(
    (key) => CCTP_NETWORKS[key as CCTPNetwork].chainId === network.chainId,
  ) as CCTPNetwork,
  nativeCurrency: {
    decimals: 18,
    name: "Ether",
    symbol: "ETH",
  },
  rpcUrls: {
    default: {
      http: [network.rpcUrl],
    },
    public: {
      http: [network.rpcUrl],
    },
  },
  blockExplorers: {
    default: { name: "Explorer", url: network.explorer },
  },
}))

export function getNetworkByChainId(chainId: number): NetworkConfig | undefined {
  return Object.values(CCTP_NETWORKS).find((network) => network.chainId === chainId)
}

export function getNetworkByName(name: CCTPNetwork): NetworkConfig {
  return CCTP_NETWORKS[name]
}
